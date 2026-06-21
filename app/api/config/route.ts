import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

function readEnv(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        result[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
      }
    }
  } catch {}
  return result;
}

function writeEnv(vars: Record<string, string>) {
  const lines: string[] = [
    '# ZhiYing Engine Demo - LLM API Config',
    '# Updated: ' + new Date().toISOString(),
    '',
  ];
  for (const [k, v] of Object.entries(vars)) {
    lines.push(k + '=' + v);
  }
  lines.push('');
  fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8');
}

export async function GET() {
  const env = readEnv();
  const ak = env.LLM_API_KEY || '';
  return NextResponse.json({
    apiKey: ak ? ak.slice(0, 6) + '****' + ak.slice(-4) : '',
    apiKeyRaw: ak,
    baseUrl: env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: env.LLM_MODEL || 'qwen-plus',
    provider: env.LLM_PROVIDER || 'qwen',
    envExists: fs.existsSync(ENV_PATH),
    wechatAppId: env.WECHAT_APP_ID || '',
    wechatSecretMasked: env.WECHAT_APP_SECRET ? '****' + env.WECHAT_APP_SECRET.slice(-4) : '',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = readEnv();
    if (body.apiKey) existing['LLM_API_KEY'] = body.apiKey;
    if (body.baseUrl) existing['LLM_BASE_URL'] = body.baseUrl;
    if (body.model) existing['LLM_MODEL'] = body.model;
    if (body.provider) existing['LLM_PROVIDER'] = body.provider;
    if (body.wechatAppId) existing['WECHAT_APP_ID'] = body.wechatAppId;
    if (body.wechatAppSecret) existing['WECHAT_APP_SECRET'] = body.wechatAppSecret;
    writeEnv(existing);
    return NextResponse.json({ success: true, message: 'Config saved. Restart server to apply.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const ak = body.apiKey;
    const bu = body.baseUrl;
    const md = body.model;
    const response = await fetch(bu + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ak,
      },
      body: JSON.stringify({
        model: md,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ success: false, error: response.status + ': ' + text.slice(0, 200) });
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
