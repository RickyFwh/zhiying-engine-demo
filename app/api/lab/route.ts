import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

function readEnv(): Record<string, string> {
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { prompt, systemPrompt, temperature, maxTokens, clientConfig } = body;
    const env = readEnv();
    
    // 优先使用客户端配置
    const apiKey = clientConfig?.apiKey || env.LLM_API_KEY;
    const baseUrl = clientConfig?.baseUrl || env.LLM_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    const model = clientConfig?.model || env.LLM_MODEL || 'qwen-plus';

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key 未配置。请在「设置」页填入 API Key。' });
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model, messages, temperature: temperature || 0.7, max_tokens: maxTokens || 2000 }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ success: false, error: 'API Error ' + response.status + ': ' + text.slice(0, 300), elapsed });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    return NextResponse.json({
      success: true,
      content,
      model: data.model || model,
      usage: { prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens, total_tokens: usage.total_tokens },
      elapsed,
      finish_reason: data.choices?.[0]?.finish_reason,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, elapsed: Date.now() - startTime });
  }
}
