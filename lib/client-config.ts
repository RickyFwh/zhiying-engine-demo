// 客户端配置管理 - 存储在浏览器 localStorage
export interface ClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
}

const STORAGE_KEY = "zhiying_llm_config";

export function getClientConfig(): ClientConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw);
    if (config.apiKey && config.baseUrl) return config;
    return null;
  } catch {
    return null;
  }
}

export function setClientConfig(config: ClientConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearClientConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasClientConfig(): boolean {
  return getClientConfig() !== null;
}

// Provider 预设
export const PROVIDER_PRESETS = [
  {
    name: "通义千问 (Qwen)",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    provider: "qwen",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    description: "阿里云 DashScope 国际版",
  },
  {
    name: "通义千问 (国内)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    provider: "qwen",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    description: "阿里云 DashScope 国内版",
  },
  {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    provider: "deepseek",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    description: "DeepSeek API",
  },
  {
    name: "Moonshot / Kimi",
    baseUrl: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    provider: "moonshot",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    description: "月之暗面 Kimi API",
  },
  {
    name: "智谱 AI (GLM)",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4",
    provider: "zhipu",
    placeholder: "xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx",
    description: "智谱 AI GLM 系列",
  },
  {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    provider: "openai",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    description: "OpenAI GPT 系列",
  },
  {
    name: "自定义",
    baseUrl: "",
    model: "",
    provider: "custom",
    placeholder: "输入 API Key",
    description: "兼容 OpenAI 格式的任意服务",
  },
];
