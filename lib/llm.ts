import fs from "fs";
import path from "path";

export interface LLMConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  provider?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  elapsed?: number;
}

function loadEnvConfig(): LLMConfig {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
    return {
      apiKey: env.LLM_API_KEY || env.DASHSCOPE_API_KEY,
      baseUrl: env.LLM_BASE_URL,
      model: env.LLM_MODEL,
      provider: env.LLM_PROVIDER,
    };
  } catch {
    return {};
  }
}

// 主调用函数 - 优先使用客户端传入的配置
export async function callLLM(
  messages: { role: string; content: string }[],
  clientConfig?: LLMConfig,
  temperature = 0.7,
  maxTokens = 2000
): Promise<LLMResponse> {
  const envConfig = loadEnvConfig();
  const config = {
    apiKey: clientConfig?.apiKey || envConfig.apiKey,
    baseUrl: clientConfig?.baseUrl || envConfig.baseUrl || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    model: clientConfig?.model || envConfig.model || "qwen-plus",
    provider: clientConfig?.provider || envConfig.provider || "qwen",
  };

  if (!config.apiKey) {
    return mockLLMResponse(messages);
  }

  const startTime = Date.now();
  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LLM API ${res.status}: ${err}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || "（模型未返回内容）",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
      model: data.model || config.model,
      elapsed: Date.now() - startTime,
    };
  } catch (error: any) {
    throw new Error(`LLM 调用失败: ${error.message}`);
  }
}

// 兼容旧接口 - chatCompletion 返回纯字符串
export async function chatCompletion(
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number; clientConfig?: LLMConfig }
): Promise<string> {
  const result = await callLLM(
    messages,
    options?.clientConfig,
    options?.temperature || 0.7,
    options?.maxTokens || 2000
  );
  return result.content;
}

function mockLLMResponse(
  messages: { role: string; content: string }[]
): LLMResponse {
  const lastMsg = messages[messages.length - 1]?.content || "";
  const topic = lastMsg.slice(0, 50);

  return {
    content: `[Mock 模式 - 未配置 API Key]

基于您的请求「${topic}...」，以下是分析结果：

## 核心洞察
1. **市场趋势**: 当前市场呈现稳步增长态势，消费者需求持续升级
2. **竞品动态**: 主要竞品在加大投入，需要差异化策略
3. **机会点**: 建议关注细分市场和新兴渠道

## 建议行动
- 优化产品定位，突出核心卖点
- 加强内容营销，提升品牌认知
- 关注数据指标，及时调整策略

---
*提示：请在设置页面配置 API Key 以获取真实 AI 分析*`,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    model: "mock",
    elapsed: 0,
  };
}
