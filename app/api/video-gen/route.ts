import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { script, productInfo, platform, mediaConfig } = body;

    // 检查媒体配置
    if (!mediaConfig || !mediaConfig.apiKey || !mediaConfig.baseUrl) {
      return NextResponse.json({
        success: false,
        error: '请先在设置页配置视频生成 API',
      });
    }

    const { provider, apiKey, baseUrl, model } = mediaConfig;

    let videoUrl = '';

    if (provider === 'kling') {
      // 可灵视频生成 API
      try {
        const res = await fetch(`${baseUrl}/videos/text2video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'kling-v1',
            prompt: script,
            duration: '5',
            aspect_ratio: '16:9',
          }),
        });
        const data = await res.json();
        if (data.data && data.data.task_id) {
          videoUrl = `任务已提交，任务ID: ${data.data.task_id}（可灵视频生成为异步任务，预计3-5分钟完成）`;
        } else {
          return NextResponse.json({
            success: false,
            error: data.message || '可灵视频生成请求失败',
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `可灵 API 调用失败: ${err.message}`,
        });
      }
    } else if (provider === 'runway') {
      // Runway API
      try {
        const res = await fetch(`${baseUrl}/image_to_video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'gen3a_turbo',
            promptText: script,
            duration: 5,
            ratio: '16:9',
          }),
        });
        const data = await res.json();
        if (data.id) {
          videoUrl = `任务已提交，任务ID: ${data.id}（Runway 视频生成为异步任务）`;
        } else {
          return NextResponse.json({
            success: false,
            error: data.error || 'Runway 视频生成请求失败',
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Runway API 调用失败: ${err.message}`,
        });
      }
    } else if (provider === 'pika') {
      // Pika API
      try {
        const res = await fetch(`${baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'pika-1.0',
            prompt: script,
            style: 'cinematic',
            duration: 3,
          }),
        });
        const data = await res.json();
        if (data.id || data.task_id) {
          videoUrl = `任务已提交，任务ID: ${data.id || data.task_id}（Pika 视频生成为异步任务）`;
        } else {
          return NextResponse.json({
            success: false,
            error: 'Pika 视频生成请求失败',
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Pika API 调用失败: ${err.message}`,
        });
      }
    } else if (provider === 'zhipu') {
      // 智谱清影 CogVideoX API
      try {
        const res = await fetch(`${baseUrl}/videos/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'cogvideox',
            prompt: script,
            duration: 6,
          }),
        });
        const data = await res.json();
        if (data.id || data.task_id) {
          videoUrl = `任务已提交，任务ID: ${data.id || data.task_id}（智谱清影为异步任务，预计5-10分钟完成）`;
        } else {
          return NextResponse.json({
            success: false,
            error: data.error?.message || '智谱清影请求失败',
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `智谱清影 API 调用失败: ${err.message}`,
        });
      }
    } else {
      // 自定义服务商 - 通用格式
      try {
        const res = await fetch(`${baseUrl}/videos/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'default',
            prompt: script,
          }),
        });
        const data = await res.json();
        if (data.data && data.data[0]) {
          videoUrl = data.data[0].url || '';
        } else if (data.id || data.task_id) {
          videoUrl = `任务已提交，任务ID: ${data.id || data.task_id}`;
        } else {
          return NextResponse.json({
            success: true,
            videoUrl: '',
            script: script,
            model: model,
            message: 'API 已调用但未返回视频 URL，请检查服务商返回格式',
            rawResponse: data,
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `视频 API 调用失败: ${err.message}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      script: script,
      model: model,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
