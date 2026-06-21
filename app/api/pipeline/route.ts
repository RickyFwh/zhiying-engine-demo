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

async function callLLM(messages: { role: string; content: string }[], temperature = 0.7, maxTokens = 3000) {
  const env = readEnvConfig();
  const apiKey = env.LLM_API_KEY;
  const baseUrl = env.LLM_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  const model = env.LLM_MODEL || 'qwen-plus';

  if (!apiKey) {
    throw new Error('API Key \u672a\u914d\u7f6e\uff0c\u8bf7\u5148\u5728\u300c\u8bbe\u7f6e\u300d\u9875\u586b\u5165');
  }

  const startTime = Date.now();
  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('API \u8c03\u7528\u5931\u8d25 (' + response.status + '): ' + text.slice(0, 200));
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
async function stepStrategy(body: any) {
  const { products, goal, budget, targetROI, platforms } = body;
  const result = await callLLM([
    { role: 'system', content: `\u4f60\u662f\u4e00\u4f4d\u8d44\u6df1\u7684\u5e02\u573a\u8fd0\u8425\u7b56\u7565\u5e08\uff0c\u62e5\u670910\u5e74\u65e5\u5316\u62a4\u80a4\u54c1\u724c\u8fd0\u8425\u7ecf\u9a8c\u3002\u4f60\u7684\u4efb\u52a1\u662f\u5236\u5b9a\u4e00\u5957\u5b8c\u6574\u7684\u6295\u653e\u7b56\u7565\uff0c\u8981\u6c42\uff1a
1. \u5206\u6790\u4ea7\u54c1\u5356\u70b9\u548c\u76ee\u6807\u4eba\u7fa4
2. \u5236\u5b9a\u6295\u653e\u5e73\u53f0\u7b56\u7565\uff08\u6296\u97f3\u5343\u5ddd/\u5c0f\u7ea2\u4e66\u805a\u5149\uff09
3. \u7ed9\u51fa\u9884\u7b97\u5206\u914d\u5efa\u8bae
4. \u660e\u786e\u5185\u5bb9\u65b9\u5411\uff08\u7528\u4ec0\u4e48\u98ce\u683c\u3001\u8bb2\u4ec0\u4e48\u5356\u70b9\u3001\u6253\u4ec0\u4e48\u75db\u70b9\uff09
5. \u7ed9\u51fa\u7ade\u54c1\u5173\u6ce8\u91cd\u70b9\uff08\u5e94\u8be5\u5173\u6ce8\u54ea\u4e9b\u7ade\u54c1\u3001\u5173\u6ce8\u4ec0\u4e48\uff09
\u7528\u4e2d\u6587\u56de\u7b54\uff0c\u683c\u5f0f\u6e05\u6670\uff0c\u5305\u542b\u5177\u4f53\u6570\u5b57\u548c\u53ef\u6267\u884c\u5efa\u8bae\u3002` },
    { role: 'user', content: `\u6295\u653e\u76ee\u6807\uff1a${goal === 'acquisition' ? '\u62c9\u65b0\u83b7\u5ba2' : goal === 'repurchase' ? '\u4fc3\u8fdb\u590d\u8d2d' : '\u54c1\u724c\u66dd\u5149'}
\u65e5\u9884\u7b97\uff1a\uffe5${budget}
\u76ee\u6807ROI\uff1a${targetROI}
\u6295\u653e\u5e73\u53f0\uff1a${platforms || '\u6296\u97f3\u5343\u5ddd + \u5c0f\u7ea2\u4e66\u805a\u5149'}

\u4ea7\u54c1\u4fe1\u606f\uff1a
${products}

\u8bf7\u5236\u5b9a\u5b8c\u6574\u7684\u6295\u653e\u7b56\u7565\u3002` }
  ], 0.7, 3000);

  return { step: 'strategy', ...result };
}

// Step 2: Competitor Analysis
async function stepCompetitor(body: any, strategy: string) {
  const { competitors, industry } = body;
  const result = await callLLM([
    { role: 'system', content: `\u4f60\u662f\u4e00\u4f4d\u7ade\u54c1\u60c5\u62a5\u5206\u6790\u4e13\u5bb6\uff0c\u64c5\u957f\u5206\u6790\u62a4\u80a4\u54c1\u724c\u7684\u7ebf\u4e0a\u6295\u653e\u7b56\u7565\u3002\u8bf7\u57fa\u4e8e\u6211\u4eec\u7684\u6295\u653e\u7b56\u7565\uff0c\u6a21\u62df\u5206\u6790\u7ade\u54c1\u7684\u6295\u653e\u52a8\u4f5c\uff0c\u5e76\u7ed9\u51fa\u5dee\u5f02\u5316\u7ade\u4e89\u5efa\u8bae\u3002\u8981\u6c42\uff1a
1. \u5206\u6790\u6bcf\u4e2a\u7ade\u54c1\u7684\u5185\u5bb9\u7b56\u7565\u3001\u6295\u653e\u8282\u594f\u3001\u4e3b\u6253\u5356\u70b9
2. \u627e\u51fa\u7ade\u54c1\u7684\u5f31\u70b9\u548c\u7a7a\u767d\u533a
3. \u7ed9\u51fa\u6211\u4eec\u53ef\u4ee5\u5dee\u5f02\u5316\u7684\u5177\u4f53\u65b9\u5411
4. \u8f93\u51fa\u7ade\u54c1\u5173\u952e\u8bcd\u548c\u7d20\u6750\u98ce\u683c\u53c2\u8003
\u7528\u4e2d\u6587\u56de\u7b54\uff0c\u683c\u5f0f\u6e05\u6670\u3002` },
    { role: 'user', content: `\u6211\u4eec\u7684\u6295\u653e\u7b56\u7565\uff1a
${strategy}

\u884c\u4e1a\uff1a${industry || '\u529f\u6548\u62a4\u80a4 / \u751f\u7269\u79d1\u6280\u65e5\u5316'}
\u4e3b\u8981\u7ade\u54c1\uff1a${competitors || '\u859b\u5c3c\u591a\u5c14\u3001\u5a01\u8bfa\u5a1c\u3001HBN\u3001\u73c0\u83b1\u96c5'}

\u8bf7\u5206\u6790\u8fd9\u4e9b\u7ade\u54c1\u7684\u6295\u653e\u7b56\u7565\uff0c\u5e76\u7ed9\u51fa\u5dee\u5f02\u5316\u5efa\u8bae\u3002` }
  ], 0.7, 3000);

  return { step: 'competitor', ...result };
}

// Step 3: Content Generation (multiple pieces)
async function stepContent(body: any, strategy: string, competitorAnalysis: string) {
  const { platform, contentType } = body;
  const result = await callLLM([
    { role: 'system', content: `\u4f60\u662f\u4e00\u4f4d\u8d44\u6df1\u7684\u8425\u9500\u5185\u5bb9\u521b\u4f5c\u4e13\u5bb6\uff0c\u73b0\u5728\u9700\u8981\u57fa\u4e8e\u6211\u4eec\u7684\u6295\u653e\u7b56\u7565\u548c\u7ade\u54c1\u5206\u6790\uff0c\u751f\u6210\u5dee\u5f02\u5316\u7684\u8425\u9500\u5185\u5bb9\u3002\u8981\u6c42\uff1a
1. \u5185\u5bb9\u5fc5\u987b\u4f53\u73b0\u6211\u4eec\u76f8\u5bf9\u7ade\u54c1\u7684\u5dee\u5f02\u5316\u4f18\u52bf
2. \u907f\u514d\u7ade\u54c1\u5df2\u7ecf\u7528\u70c2\u7684\u8868\u8fbe\u65b9\u5f0f
3. \u7a81\u51fa\u6211\u4eec\u72ec\u7279\u7684\u5356\u70b9\u89d2\u5ea6
4. \u98ce\u683c\u8981\u7b26\u5408\u5e73\u53f0\u8c03\u6027
\u7528\u4e2d\u6587\u56de\u7b54\u3002` },
    { role: 'user', content: `\u6295\u653e\u7b56\u7565\uff1a
${strategy}

\u7ade\u54c1\u5206\u6790\uff1a
${competitorAnalysis}

\u8bf7\u4e3a${platform === 'xiaohongshu' ? '\u5c0f\u7ea2\u4e66' : platform === 'douyin' ? '\u6296\u97f3' : '\u5fae\u4fe1\u516c\u4f17\u53f7'}\u5e73\u53f0\u751f\u6210${contentType === 'text' ? '\u79cd\u8349\u6587\u6848' : contentType === 'video_script' ? '\u89c6\u9891\u811a\u672c' : '\u56fe\u7247\u63d0\u793a\u8bcd'}\u3002

\u751f\u6210 3 \u7ec4\u4e0d\u540c\u89d2\u5ea6\u7684\u5185\u5bb9\uff1a
1. \u6210\u5206\u515a\u89d2\u5ea6\uff08\u4e13\u4e1a\u53ef\u4fe1\uff09
2. \u7528\u6237\u4f53\u9a8c\u89d2\u5ea6\uff08\u771f\u5b9e\u5206\u4eab\uff09
3. \u5dee\u5f02\u5316\u89d2\u5ea6\uff08\u7ade\u54c1\u5bf9\u6bd4/\u7a7a\u767d\u533a\uff09` }
  ], 0.8, 4000);

  return { step: 'content', ...result };
}

// Step 4: Review Summary
async function stepReview(body: any, strategy: string, competitorAnalysis: string, content: string) {
  const result = await callLLM([
    { role: 'system', content: `\u4f60\u662f\u4e00\u4f4d\u5185\u5bb9\u5ba1\u6838\u4e13\u5bb6\uff0c\u8bf7\u5bf9\u751f\u6210\u7684\u5185\u5bb9\u8fdb\u884c\u8d28\u91cf\u68c0\u67e5\u548c\u4f18\u5316\u5efa\u8bae\u3002\u68c0\u67e5\u9879\uff1a
1. \u662f\u5426\u5305\u542b\u8fdd\u7981\u8bcd\uff08\u6700\u3001\u7b2c\u4e00\u3001\u7edd\u5bf9\u7b49\u7edd\u5bf9\u5316\u7528\u8bed\uff09
2. \u662f\u5426\u7b26\u5408\u5e73\u53f0\u5185\u5bb9\u89c4\u8303
3. \u5356\u70b9\u662f\u5426\u51c6\u786e\u3001\u662f\u5426\u4e0e\u7ade\u54c1\u6709\u5dee\u5f02\u5316
4. \u7ed9\u51fa\u6bcf\u7ec4\u5185\u5bb9\u7684\u8bc4\u5206\uff081-10\uff09\u548c\u4f18\u5316\u5efa\u8bae
5. \u7ed9\u51fa\u6574\u4f53\u6295\u653e\u5efa\u8bae\uff08\u5148\u53d1\u54ea\u7ec4\u3001A/B\u6d4b\u8bd5\u65b9\u6848\uff09
\u7528\u4e2d\u6587\u56de\u7b54\u3002` },
    { role: 'user', content: `\u6295\u653e\u7b56\u7565\uff1a
${strategy.slice(0, 500)}...

\u7ade\u54c1\u5206\u6790\u8981\u70b9\uff1a
${competitorAnalysis.slice(0, 500)}...

\u751f\u6210\u7684\u5185\u5bb9\uff1a
${content}

\u8bf7\u5ba1\u6838\u8fd9\u4e9b\u5185\u5bb9\uff0c\u7ed9\u51fa\u8bc4\u5206\u548c\u4f18\u5316\u5efa\u8bae\u3002` }
  ], 0.5, 2000);

  return { step: 'review', ...result };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, strategy, competitorAnalysis, content } = body;

    if (step === 'strategy') {
      const result = await stepStrategy(body);
      return NextResponse.json(result);
    }
    if (step === 'competitor') {
      const result = await stepCompetitor(body, strategy || '');
      return NextResponse.json(result);
    }
    if (step === 'content') {
      const result = await stepContent(body, strategy || '', competitorAnalysis || '');
      return NextResponse.json(result);
    }
    if (step === 'review') {
      const result = await stepReview(body, strategy || '', competitorAnalysis || '', content || '');
      return NextResponse.json(result);
    }
    if (step === 'all') {
      // Run full pipeline
      const r1 = await stepStrategy(body);
      const r2 = await stepCompetitor(body, r1.content);
      const r3 = await stepContent({ ...body, platform: body.platform || 'xiaohongshu', contentType: body.contentType || 'text' }, r1.content, r2.content);
      const r4 = await stepReview(body, r1.content, r2.content, r3.content);
      return NextResponse.json({
        strategy: r1, competitor: r2, content: r3, review: r4,
        totalElapsed: r1.elapsed + r2.elapsed + r3.elapsed + r4.elapsed,
      });
    }

    return NextResponse.json({ error: '\u672a\u77e5\u6b65\u9aa4: ' + step }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
