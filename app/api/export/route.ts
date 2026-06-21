import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, format, platform, title } = body;

    if (format === 'markdown') {
      // Already markdown, return as-is
      return NextResponse.json({ success: true, content, filename: (title || 'content') + '.md' });
    }

    if (format === 'html') {
      // Convert markdown to simple HTML
      let html = content
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*)$/gm, '<li>$2</li>')
        .replace(/---/g, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      html = '<p>' + html + '</p>';

      // Wrap with basic styling for WeChat
      if (platform === 'wechat') {
        html = '<section style="font-family: -apple-system, BlinkMacSystemFont, Helvetica Neue, PingFang SC, Microsoft YaHei, sans-serif; font-size: 16px; line-height: 1.8; color: #333; padding: 16px;">' + html + '</section>';
      }

      return NextResponse.json({ success: true, content: html, filename: (title || 'content') + '.html' });
    }

    if (format === 'json') {
      const jsonData = {
        title: title || 'Untitled',
        platform: platform,
        content: content,
        generatedAt: new Date().toISOString(),
        version: '1.0',
      };
      return NextResponse.json({ success: true, content: JSON.stringify(jsonData, null, 2), filename: (title || 'content') + '.json' });
    }

    return NextResponse.json({ success: false, error: 'Unknown format: ' + format });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
