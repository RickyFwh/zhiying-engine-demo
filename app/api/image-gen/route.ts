import { NextRequest, NextResponse } from 'next/server';

// 通义万相异步轮询
async function pollDashScopeTask(taskId: string, apiKey: string, maxAttempts = 30): Promise<string | null> {
  const pollUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000)); // 每3秒轮询一次
    try {
      const res = await fetch(pollUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const data = await res.json();
      const status = data.output?.task_status;
      if (status === 'SUCCEEDED') {
        const results = data.output?.results;
        if (results && results.length > 0) {
          return results[0].url || null;
        }
        return null;
      }
      if (status === 'FAILED') {
        throw new Error(data.output?.message || '通义万相生成失败');
      }
      // PENDING / RUNNING → 继续轮询
      console.log(`[image-gen] 通义万相轮询 ${i + 1}/${maxAttempts}: ${status}`);
    } catch (err: any) {
      if (err.message?.includes('通义万相生成失败')) throw err;
      console.error(`[image-gen] 轮询出错:`, err.message);
    }
  }
  throw new Error('通义万相生成超时（90秒），请稍后重试');
}

// 通义万相国际站轮询
async function pollDashScopeIntlTask(taskId: string, apiKey: string, maxAttempts = 30): Promise<string | null> {
  const pollUrl = `https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(pollUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const data = await res.json();
      const status = data.output?.task_status;
      if (status === 'SUCCEEDED') {
        const results = data.output?.results;
        if (results && results.length > 0) {
          return results[0].url || null;
        }
        return null;
      }
      if (status === 'FAILED') {
        throw new Error(data.output?.message || '通义万相（国际站）生成失败');
      }
      console.log(`[image-gen] 通义万相国际站轮询 ${i + 1}/${maxAttempts}: ${status}`);
    } catch (err: any) {
      if (err.message?.includes('通义万相')) throw err;
      console.error(`[image-gen] 轮询出错:`, err.message);
    }
  }
  throw new Error('通义万相（国际站）生成超时（90秒），请稍后重试');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, productInfo, platform, mediaConfig, clientConfig } = body;

    // 如果有专用图片 API 配置，优先使用
    if (mediaConfig && mediaConfig.apiKey && mediaConfig.baseUrl) {
      return await handleMediaConfig(mediaConfig, prompt, productInfo, platform);
    }

    // 没有专用配置 → 尝试用 DashScope LLM Key 调用通义万相
    if (clientConfig && clientConfig.apiKey) {
      const provider = clientConfig.provider || 'dashscope';
      const apiKey = clientConfig.apiKey;
      const baseUrl = clientConfig.baseUrl || '';

      // 判断是否为 DashScope（国内或国际）
      if (provider === 'dashscope' || baseUrl.includes('dashscope')) {
        const isIntl = baseUrl.includes('dashscope-intl');
        const submitUrl = isIntl
          ? 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
          : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';

        try {
          // 1. 提交异步任务
          const submitRes = await fetch(submitUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'X-DashScope-Async': 'enable',
            },
            body: JSON.stringify({
              model: 'wanx-v1',
              input: { prompt },
              parameters: { size: '1024*1024', n: 1 },
            }),
          });

          const submitData = await submitRes.json();
          if (!submitData.output?.task_id) {
            // 如果 wanx-v1 不可用，尝试 flux
            const submitRes2 = await fetch(submitUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'X-DashScope-Async': 'enable',
              },
              body: JSON.stringify({
                model: 'flux-schnell',
                input: { prompt },
                parameters: { size: '1024*1024', n: 1 },
              }),
            });
            const submitData2 = await submitRes2.json();
            if (!submitData2.output?.task_id) {
              return NextResponse.json({
                success: false,
                error: `通义万相任务提交失败: ${submitData.message || submitData2.message || JSON.stringify(submitData)}`,
              });
            }
            // 用 flux 的 taskId 轮询
            const imageUrl = isIntl
              ? await pollDashScopeIntlTask(submitData2.output.task_id, apiKey)
              : await pollDashScopeTask(submitData2.output.task_id, apiKey);
            if (imageUrl) {
              return NextResponse.json({
                success: true, imageUrl, prompt, model: 'flux-schnell (DashScope)',
              });
            }
            return NextResponse.json({ success: false, error: '通义万相未返回图片 URL' });
          }

          // 2. 轮询等待结果
          const imageUrl = isIntl
            ? await pollDashScopeIntlTask(submitData.output.task_id, apiKey)
            : await pollDashScopeTask(submitData.output.task_id, apiKey);

          if (imageUrl) {
            return NextResponse.json({
              success: true, imageUrl, prompt, model: 'wanx-v1 (通义万相)',
            });
          }
          return NextResponse.json({ success: false, error: '通义万相未返回图片 URL' });
        } catch (err: any) {
          return NextResponse.json({
            success: false,
            error: `通义万相 API 错误: ${err.message}`,
          });
        }
      }

      // 非 DashScope 但有 API Key → 尝试 OpenAI 兼容格式
      try {
        const imgRes = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: '1024x1024',
          }),
        });
        const imgData = await imgRes.json();
        if (imgData.data && imgData.data[0]) {
          return NextResponse.json({
            success: true,
            imageUrl: imgData.data[0].url || '',
            prompt,
            model: imgData.model || 'dall-e-3',
          });
        }
        return NextResponse.json({
          success: false,
          error: `图片 API 返回异常: ${JSON.stringify(imgData.error || imgData.message || imgData)}`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `图片 API 调用失败: ${err.message}`,
        });
      }
    }

    // 什么配置都没有
    return NextResponse.json({
      success: false,
      error: '未配置任何 API。请在设置页配置 LLM API Key（会自动使用 DashScope 生成图片），或单独配置图片生成 API。',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 处理专用 mediaConfig 的逻辑（保持原有逻辑）
async function handleMediaConfig(mediaConfig: any, prompt: string, productInfo: any, platform: string) {
  const { provider, apiKey, baseUrl, model } = mediaConfig;
  let imageUrl = '';

  if (provider === 'dashscope') {
    // 通义万相 - 使用专用配置
    const isIntl = baseUrl.includes('dashscope-intl') || baseUrl.includes('intl');
    const submitUrl = isIntl
      ? 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
      : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';

    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: model || 'wanx-v1',
        input: { prompt },
        parameters: { size: '1024*1024', n: 1 },
      }),
    });
    const submitData = await submitRes.json();
    if (!submitData.output?.task_id) {
      return NextResponse.json({ success: false, error: submitData.message || '通义万相提交失败' });
    }
    const result = isIntl
      ? await pollDashScopeIntlTask(submitData.output.task_id, apiKey)
      : await pollDashScopeTask(submitData.output.task_id, apiKey);
    if (result) {
      return NextResponse.json({ success: true, imageUrl: result, prompt, model: model || 'wanx-v1' });
    }
    return NextResponse.json({ success: false, error: '通义万相未返回图片' });
  }

  if (provider === 'openai') {
    const res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || 'dall-e-3', prompt, n: 1, size: '1024x1024' }),
    });
    const data = await res.json();
    if (data.data?.[0]) imageUrl = data.data[0].url || '';
    else return NextResponse.json({ success: false, error: data.error?.message || 'DALL-E 失败' });
  } else if (provider === 'stability') {
    const res = await fetch(`${baseUrl}/v1/generation/${model || 'stable-diffusion-xl-1024-v1-0'}/text-to-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
      body: JSON.stringify({ text_prompts: [{ text: prompt, weight: 1 }], cfg_scale: 7, height: 1024, width: 1024, steps: 30, samples: 1 }),
    });
    const data = await res.json();
    if (data.artifacts?.[0]) imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;
    else return NextResponse.json({ success: false, error: 'Stable Diffusion 失败' });
  } else {
    // 通用 OpenAI 兼容
    const res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || 'default', prompt, n: 1, size: '1024x1024' }),
    });
    const data = await res.json();
    if (data.data?.[0]) imageUrl = data.data[0].url || '';
    else if (data.output?.results) imageUrl = data.output.results[0]?.url || '';
    else return NextResponse.json({ success: false, error: 'API 未返回图片' });
  }

  return NextResponse.json({ success: true, imageUrl, prompt, model });
}
