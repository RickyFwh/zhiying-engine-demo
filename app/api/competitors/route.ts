import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

function readEnvConfig(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq > 0) result[t.slice(0, eq)] = t.slice(eq + 1);
    }
  } catch {}
  return result;
}

interface ClientConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  provider?: string;
}

async function callLLM(
  messages: { role: string; content: string }[],
  clientConfig?: ClientConfig,
  temperature = 0.7,
  maxTokens = 4000
) {
  const env = readEnvConfig();
  const apiKey = clientConfig?.apiKey || env.LLM_API_KEY;
  const baseUrl =
    clientConfig?.baseUrl ||
    env.LLM_BASE_URL ||
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  const model = clientConfig?.model || env.LLM_MODEL || 'qwen-plus';

  if (!apiKey) {
    throw new Error('API Key 未配置，请先在「设置」页填入');
  }

  const startTime = Date.now();
  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('API 调用失败 (' + response.status + '): ' + text.slice(0, 200));
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    elapsed: Date.now() - startTime,
    model: data.model || model,
  };
}

/**
 * 解析 LLM 返回的 JSON 竞品数据
 */
function parseCompetitorJSON(text: string): any[] {
  // 尝试直接解析 JSON
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.competitors && Array.isArray(parsed.competitors)) return parsed.competitors;
  } catch {}

  // 尝试从 markdown 代码块中提取 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed.competitors && Array.isArray(parsed.competitors)) return parsed.competitors;
    } catch {}
  }

  // 尝试找到第一个 [ 和最后一个 ] 之间的内容
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const parsed = JSON.parse(text.slice(firstBracket, lastBracket + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  throw new Error('无法解析竞品数据，请重试');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, productName, category, price, sellingPoints, clientConfig } = body;
    const cc = clientConfig as ClientConfig | undefined;

    if (!productName && !category) {
      return NextResponse.json({ error: '请提供产品名称或品类' }, { status: 400 });
    }

    const sellingPointsText = Array.isArray(sellingPoints)
      ? sellingPoints.join('、')
      : sellingPoints || '未提供';

    const result = await callLLM(
      [
        {
          role: 'system',
          content: `你是一位资深的竞品情报分析师，专注于中国美妆护肤行业的线上投放竞品研究。你的任务是根据用户提供的我方产品信息，生成3-5个真实感极强的竞品档案。

要求：
1. 竞品品牌名要真实可信（可以是真实品牌的合理变体，或听起来像真实品牌的虚构名称）
2. 根据品类特点生成合理的竞品定位（价格带、渠道、营销数据）
3. 为每个竞品生成3条投放素材（小红书种草文案、抖音视频脚本、产品图片描述）
4. 素材内容要符合各平台的调性和格式规范
5. 给出每个竞品的强项和弱点分析
6. 给出差异化竞争建议

你必须返回严格的 JSON 数组格式，每个竞品对象结构如下：
[
  {
    "name": "品牌名",
    "price": { "min": 最低价数字, "max": 最高价数字 },
    "channels": ["小红书", "抖音", "微信"],
    "marketingData": {
      "estimatedBudget": "预估月投放预算（如：50-100万）",
      "contentFrequency": "内容发布频率（如：每日3-5条）",
      "followerCount": "粉丝量级（如：120万）",
      "topContent": "爆款内容描述（如：28天打卡挑战，单条最高50万赞）",
      "engagementRate": "互动率（如：4.2%）"
    },
    "adMaterials": [
      {
        "type": "text",
        "platform": "小红书",
        "content": "完整的小红书种草文案（包含标题、正文、标签）",
        "performance": "预估效果（如：点赞800-1200，收藏600+）"
      },
      {
        "type": "video_script",
        "platform": "抖音",
        "content": "完整的抖音视频脚本（包含开头hook、内容、结尾引导）",
        "performance": "预估播放量和互动数据"
      },
      {
        "type": "image_desc",
        "platform": "小红书",
        "content": "产品图片拍摄描述（场景、构图、色调、道具）",
        "performance": "预估点击率和收藏率"
      }
    ],
    "strengths": ["强项1", "强项2", "强项3"],
    "weaknesses": ["弱点1", "弱点2", "弱点3"],
    "differentiation": "针对该竞品的差异化建议（100字内）"
  }
]

只返回 JSON，不要有其他文字。`,
        },
        {
          role: 'user',
          content: `请为我方产品进行竞品研究：

我方产品：${productName || '未命名产品'}
品类：${category || '功效护肤'}
价格：¥${price || '未知'}
核心卖点：${sellingPointsText}

请生成 3-5 个该品类的主要竞品档案，包含详细的营销数据和投放素材。`,
        },
      ],
      cc,
      0.8,
      5000
    );

    const competitors = parseCompetitorJSON(result.content);

    // 为每个竞品补充 id、category、relatedProductId、researchedAt、notes
    const enriched = competitors.map((c: any, idx: number) => ({
      ...c,
      id: `comp_${Date.now().toString(36)}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      category: category || '功效护肤',
      relatedProductId: productId || '',
      researchedAt: new Date().toISOString(),
      notes: '',
      adMaterials: (c.adMaterials || []).map((m: any, mIdx: number) => ({
        ...m,
        id: `mat_${Date.now().toString(36)}_${idx}_${mIdx}`,
        createdAt: new Date().toISOString(),
      })),
    }));

    return NextResponse.json({
      competitors: enriched,
      usage: result.usage,
      elapsed: result.elapsed,
      model: result.model,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
