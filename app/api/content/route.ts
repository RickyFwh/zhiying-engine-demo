import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { PRODUCTS } from '@/lib/mock-data';
import { checkCompliance } from '@/lib/compliance';
import { recordUsage } from '@/lib/analytics';
import { generateId, countWords } from '@/lib/storage';

const PLATFORM_STYLES: Record<string, string> = {
  xiaohongshu: '小红书种草笔记风格：口语化、emoji多、分段清晰、有标题和tag、像闺蜜分享',
  douyin: '抖音短视频文案风格：开头要有hook吸引停留、节奏快、口语化、有明确CTA引导',
  wechat: '微信公众号风格：专业但亲和、有深度成分分析、适合长文阅读',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, platform, contentType, extraInstructions, clientConfig } = body;

    const product = PRODUCTS.find(p => p.id === productId) || PRODUCTS[0];
    const platformStyle = PLATFORM_STYLES[platform] || PLATFORM_STYLES.xiaohongshu;

    let systemPrompt = '';
    let userPrompt = '';

    if (contentType === 'text') {
      systemPrompt = `你是一位资深的小红书/抖音内容运营专家，擅长为功效护肤品撰写种草文案。
请按照${platformStyle}来撰写文案。
要求：
1. 文案必须基于真实的产品成分和功效，不能夸大宣传
2. 融入专家验证的高转化写作模式
3. 避免使用违禁词（最、第一、绝对等绝对化用语）
4. 文案要有人设感，像真实用户分享而非广告`;

      userPrompt = `请为以下产品撰写一篇${platform === 'xiaohongshu' ? '小红书种草笔记' : platform === 'douyin' ? '抖音图文文案' : '微信公众号推文'}：

产品名称：${product.name}
品类：${product.category}
价格：¥${product.price}
核心卖点：${product.sellingPoints.join('、')}
目标人群：${product.targetAudience}
产品描述：${product.description}

${extraInstructions ? `额外要求：${extraInstructions}` : ''}

请输出完整的文案内容。`;
    } else if (contentType === 'video_script') {
      systemPrompt = `你是一位抖音短视频脚本编导，擅长为功效护肤品制作带货短视频脚本。
${platformStyle}
要求：
1. 脚本包含时间轴、画面描述、台词、字幕提示
2. 前3秒必须有强力hook
3. 结构：hook→痛点→解决方案→效果→CTA
4. 时长控制在30-60秒`;

      userPrompt = `请为以下产品撰写一个抖音短视频带货脚本：

产品名称：${product.name}
品类：${product.category}
价格：¥${product.price}
核心卖点：${product.sellingPoints.join('、')}
目标人群：${product.targetAudience}

${extraInstructions ? `额外要求：${extraInstructions}` : ''}

请输出完整的视频脚本。`;
    } else {
      systemPrompt = `你是一位AI绘画提示词专家，擅长为产品生成高质量的营销图片提示词。`;
      userPrompt = `请为以下产品生成3组AI绘图提示词（用于Stable Diffusion/MidJourney），适用于${platform}平台的信息流广告：

产品名称：${product.name}
品类：${product.category}
核心卖点：${product.sellingPoints.join('、')}

每组包含：
1. 正向提示词（英文）
2. 负向提示词（英文）
3. 推荐参数设置

${extraInstructions ? `额外要求：${extraInstructions}` : ''}`;
    }

    const llmResult = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      clientConfig,
      0.8,
      3000
    );

    // Record usage analytics
    recordUsage({
      timestamp: new Date().toISOString(),
      source: 'content',
      platform,
      model: llmResult.model || 'unknown',
      tokens: llmResult.usage?.totalTokens || 0,
      elapsed: llmResult.elapsed || 0,
      contentType,
    });

    const contentId = generateId();
    const createdAt = new Date().toISOString();

    // 自动执行违禁词合规检查
    const compliance = checkCompliance(llmResult.content);

    return NextResponse.json({
      id: contentId,
      content: llmResult.content,
      product: product.name,
      platform,
      contentType,
      createdAt,
      source: 'content',
      wordCount: countWords(llmResult.content),
      compliance,  // 违禁词检查结果
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
