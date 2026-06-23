import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, productInfo, platform, mediaConfig } = body;

    // 检查媒体配置
    if (!mediaConfig || !mediaConfig.apiKey || !mediaConfig.baseUrl) {
      return NextResponse.json({
        success: false,
        error: '请先在设置页配置图片生成 API',
      });
    }

    const { provider, apiKey, baseUrl, model } = mediaConfig;

    let imageUrl = '';
    let actualPrompt = prompt;

    // 根据不同服务商调用不同 API
    if (provider === 'openai') {
      // DALL-E API (OpenAI)
      try {
        const res = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
          }),
        });
        const data = await res.json();
        if (data.data && data.data[0]) {
          imageUrl = data.data[0].url || data.data[0].b64_json || '';
        } else {
          return NextResponse.json({
            success: false,
            error: data.error?.message || 'DALL-E 生成失败',
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `DALL-E API 调用失败: ${err.message}`,
        });
      }
    } else if (provider === 'stability') {
      // Stability AI API
      try {
        const res = await fetch(`${baseUrl}/v1/generation/${model || 'stable-diffusion-xl-1024-v1-0'}/text-to-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt, weight: 1 }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            steps: 30,
            samples: 1,
          }),
        });
        const data = await res.json();
        if (data.artifacts && data.artifacts[0]) {
          imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;
        } else {
          return NextResponse.json({
            success: false,
            error: 'Stable Diffusion 生成失败',
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Stability API 调用失败: ${err.message}`,
        });
      }
    } else if (provider === 'dashscope') {
      // 通义万相 (DashScope)
      try {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-DashScope-Async': 'enable',
          },
          body: JSON.stringify({
            model: model || 'wanx-v1',
            input: { prompt: prompt },
            parameters: { size: '1024*1024', n: 1 },
          }),
        });
        const data = await res.json();
        if (data.output && data.output.task_id) {
          imageUrl = `任务已提交，任务ID: ${data.output.task_id}（通义万相为异步任务，请稍后查询结果）`;
        } else {
          return NextResponse.json({
            success: false,
            error: data.message || '通义万相请求失败',
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `通义万相 API 调用失败: ${err.message}`,
        });
      }
    } else {
      // 可灵 / 自定义: 通用 OpenAI 兼容格式尝试
      try {
        const res = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'default',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
          }),
        });
        const data = await res.json();
        if (data.data && data.data[0]) {
          imageUrl = data.data[0].url || '';
        } else if (data.output && data.output.results) {
          imageUrl = data.output.results[0]?.url || '';
        } else {
          imageUrl = '';
          return NextResponse.json({
            success: true,
            imageUrl: '',
            prompt: actualPrompt,
            model: model,
            message: 'API 已调用但未返回图片 URL，请检查服务商返回格式',
            rawResponse: data,
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `图片 API 调用失败: ${err.message}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: actualPrompt,
      model: model,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
