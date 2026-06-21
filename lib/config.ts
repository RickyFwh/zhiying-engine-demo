// API 配置管理 - 支持 localStorage 持久化 + 服务端 .env 读取

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string; // 'deepseek' | 'doubao' | 'qwen' | 'custom'
}

export interface PlatformConfig {
  xiaohongshu: {
    cookie: string;
    enabled: boolean;
    accountId: string;
  };
  douyin: {
    cookie: string;
    enabled: boolean;
    accountId: string;
  };
  wechat: {
    appId: string;
    appSecret: string;
    enabled: boolean;
    accessToken?: string;
  };
}

const STORAGE_KEY = 'zhiying_config';
const PLATFORM_KEY = 'zhiying_platform_config';

const DEFAULT_LLM: LLMConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  provider: 'deepseek',
};

const DEFAULT_PLATFORM: PlatformConfig = {
  xiaohongshu: { cookie: '', enabled: false, accountId: '' },
  douyin: { cookie: '', enabled: false, accountId: '' },
  wechat: { appId: '', appSecret: '', enabled: false },
};

const PRESETS: Record<string, Partial<LLMConfig>> = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', provider: 'deepseek' },
  doubao: { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-4k', provider: 'doubao' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', provider: 'qwen' },
  custom: { baseUrl: '', model: '', provider: 'custom' },
};

export { DEFAULT_LLM, DEFAULT_PLATFORM, PRESETS };

export function loadLLMConfig(): LLMConfig {
  if (typeof window === 'undefined') return DEFAULT_LLM;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_LLM, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_LLM;
}

export function saveLLMConfig(config: LLMConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function loadPlatformConfig(): PlatformConfig {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM;
  try {
    const raw = localStorage.getItem(PLATFORM_KEY);
    if (raw) return { ...DEFAULT_PLATFORM, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PLATFORM;
}

export function savePlatformConfig(config: PlatformConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLATFORM_KEY, JSON.stringify(config));
}

export function isLLMConfigured(config: LLMConfig): boolean {
  return config.apiKey.length > 0 && config.baseUrl.length > 0 && config.model.length > 0;
}
