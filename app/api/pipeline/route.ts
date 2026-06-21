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

async function callLLM(messages: { role: string; content: string }[], clientConfig?: ClientConfig, temperature = 0.7, maxTokens = 3000) {
  const env = readEnvConfig();
  // 优先使用客户端配置，否则用服务端 .env.local
  const apiKey = clientConfig?.apiKey || env.LLM_API_KEY;
  const baseUrl = clientConfig?.baseUrl || env.LLM_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  const model = clientConfig?.model || env.LLM_MODEL || 'qwen-plus';

  if (!apiKey) {
    throw new Error('API Key 未配置，请先在「设置」页填入');
  }

  const startTime = Date.now();
  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
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

// Step 1: Strategy Generation
async function stepStrategy(body: any, cc?: ClientConfig) {
  const { products, goal, budget, targetROI, platforms } = body;
  const result = await callLLM([
    { role: 'system', content: `你是一位资深的市场运营策略师，拥有10年日化护肤品牌运营经验。你的任务是制定一套完整的投放策略，要求：
1. 分析产品卖点和目标人群
2. 制定投放平台策略（抖音千川/小红书聚光）
3. 给出预算分配建议
4. 明确内容方向（用什么风格、讲什么卖点、打什么痛点）
5. 给出竞品关注重点（应该关注哪些竞品、关注什么）
用中文回答，格式清晰，包含具体数字和可执行建议。` },
    { role: 'user', content: `投放目标：${goal === 'acquisition' ? '拉新获客' : goal === 'repurchase' ? '促进复购' : '品牌曝光'}
日预算：￥${budget}
目标ROI：${targetROI}
投放平台：${platforms || '抖音千川 + 小红书聚光'}

产品信息：
${products}

请制定完整的投放策略。` }
  ], cc, 0.7, 3000);

  return { step: 'strategy', ...result };
}

// Step 2: Competitor Analysis
async function stepCompetitor(body: any, strategy: string, cc?: ClientConfig) {
  const { competitors, industry } = body;
  const result = await callLLM([
    { role: 'system', content: `你是一位竞品情报分析专家，擅长分析护肤品牌的线上投放策略。请基于我们的投放策略，模拟分析竞品的投放动作，并给出差异化竞争建议。要求：
1. 分析每个竞品的内容策略、投放节奏、主打卖点
2. 找出竞品的弱点和空白区
3. 给出我们可以差异化的具体方向
4. 输出竞品关键词和素材风格参考
用中文回答，格式清晰。` },
    { role: 'user', content: `我们的投放策略：
${strategy}

行业：${industry || '功效护肤 / 生物科技日化'}
主要竞品：${competitors || '薛尼多尔、薇诺娜、HBN、珀莱雅'}

请分析这些竞品的投放策略，并给出差异化建议。` }
  ], cc, 0.7, 3000);

  return { step: 'competitor', ...result };
}

// Step 3: Content Generation (multiple pieces)
async function stepContent(body: any, strategy: string, competitorAnalysis: string, cc?: ClientConfig) {
  const { platform, contentType } = body;
  const result = await callLLM([
    { role: 'system', content: `你是一位资深的营销内容创作专家，现在需要基于我们的投放策略和竞品分析，生成差异化的营销内容。要求：
1. 内容必须体现我们相对竞品的差异化优势
2. 避免竞品已经用烂的表达方式
3. 突出我们独特的卖点角度
4. 风格要符合平台调性
用中文回答。` },
    { role: 'user', content: `投放策略：
${strategy}

竞品分析：
${competitorAnalysis}

请为${platform === 'xiaohongshu' ? '小红书' : platform === 'douyin' ? '抖音' : '微信公众号'}平台生成${contentType === 'text' ? '种草文案' : contentType === 'video_script' ? '视频脚本' : '图片提示词'}。

生成 3 组不同角度的内容：
1. 成分党角度（专业可信）
2. 用户体验角度（真实分享）
3. 差异化角度（竞品对比/空白区）` }
  ], cc, 0.8, 4000);

  return { step: 'content', ...result };
}

// Step 4: Review Summary
async function stepReview(body: any, strategy: string, competitorAnalysis: string, content: string, cc?: ClientConfig) {
  const result = await callLLM([
    { role: 'system', content: `你是一位内容审核专家，请对生成的内容进行质量检查和优化建议。检查项：
1. 是否包含违禁词（最、第一、绝对等绝对化用语）
2. 是否符合平台内容规范
3. 卖点是否准确、是否与竞品有差异化
4. 给出每组内容的评分（1-10）和优化建议
5. 给出整体投放建议（先发哪组、A/B测试方案）
用中文回答。` },
    { role: 'user', content: `投放策略：
${strategy.slice(0, 500)}...

竞品分析要点：
${competitorAnalysis.slice(0, 500)}...

生成的内容：
${content}

请审核这些内容，给出评分和优化建议。` }
  ], cc, 0.5, 2000);

  return { step: 'review', ...result };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, strategy, competitorAnalysis, content, clientConfig } = body;
    const cc = clientConfig as ClientConfig | undefined;

    if (step === 'strategy') {
      const result = await stepStrategy(body, cc);
      return NextResponse.json(result);
    }
    if (step === 'competitor') {
      const result = await stepCompetitor(body, strategy || '', cc);
      return NextResponse.json(result);
    }
    if (step === 'content') {
      const result = await stepContent(body, strategy || '', competitorAnalysis || '', cc);
      return NextResponse.json(result);
    }
    if (step === 'review') {
      const result = await stepReview(body, strategy || '', competitorAnalysis || '', content || '', cc);
      return NextResponse.json(result);
    }
    if (step === 'all') {
      const r1 = await stepStrategy(body, cc);
      const r2 = await stepCompetitor(body, r1.content, cc);
      const r3 = await stepContent({ ...body, platform: body.platform || 'xiaohongshu', contentType: body.contentType || 'text' }, r1.content, r2.content, cc);
      const r4 = await stepReview(body, r1.content, r2.content, r3.content, cc);
      return NextResponse.json({
        strategy: r1, competitor: r2, content: r3, review: r4,
        totalElapsed: r1.elapsed + r2.elapsed + r3.elapsed + r4.elapsed,
      });
    }

    return NextResponse.json({ error: '未知步骤: ' + step }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
