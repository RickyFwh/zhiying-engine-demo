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

// Get WeChat access token
async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appId + '&secret=' + appSecret;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) throw new Error('WeChat token error: ' + data.errmsg);
  return data.access_token;
}

// Upload article as draft
async function addDraft(accessToken: string, title: string, content: string, author: string): Promise<any> {
  const url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + accessToken;
  const body = {
    articles: [{
      title: title,
      author: author || 'Smart Marketing AI',
      content: content,
      digest: title,
      need_open_comment: 0,
      only_fans_can_comment: 0,
    }],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, author } = body;

    const env = readEnv();
    const appId = env.WECHAT_APP_ID;
    const appSecret = env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json({ success: false, error: 'WeChat App ID or Secret not configured. Go to Settings.' });
    }

    const accessToken = await getAccessToken(appId, appSecret);
    const result = await addDraft(accessToken, title, content, author);

    if (result.media_id) {
      return NextResponse.json({
        success: true,
        message: 'Article uploaded as draft! media_id: ' + result.media_id,
        mediaId: result.media_id,
      });
    } else {
      return NextResponse.json({ success: false, error: 'WeChat API error: ' + (result.errmsg || JSON.stringify(result)) });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
