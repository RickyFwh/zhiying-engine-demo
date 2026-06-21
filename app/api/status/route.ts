import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');
const START_TIME = Date.now();

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

export async function GET() {
  const env = readEnv();
  const uptimeMs = Date.now() - START_TIME;
  const uptimeMin = Math.floor(uptimeMs / 60000);

  // Read content stats from localStorage is not possible server-side, use defaults
  return NextResponse.json({
    llm: {
      configured: !!(env.LLM_API_KEY),
      provider: env.LLM_PROVIDER || 'deepseek',
      model: env.LLM_MODEL || 'deepseek-chat',
      baseUrl: env.LLM_BASE_URL || 'https://api.deepseek.com',
      lastTest: env._LAST_TEST || null,
    },
    api: {
      decision: '/api/decision',
      content: '/api/content',
      config: '/api/config',
      'status': '/api/status',
      'wechat-publish': '/api/wechat-publish',
    },
    platform: {
      wechat: !!(env.WECHAT_APP_ID && env.WECHAT_APP_SECRET),
      xiaohongshu: false,  // cookie is in localStorage, not server-side
      douyin: false,
    },
    content: {
      generated: 8,
      approved: 3,
      rejected: 1,
      pending: 4,
    },
    system: {
      version: 'v0.1.0-demo',
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
      uptime: uptimeMin + ' min',
    },
  });
}
