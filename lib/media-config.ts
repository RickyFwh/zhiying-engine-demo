// 媒体 API 配置管理 - 图片/视频生成 API 存储在浏览器 localStorage

export interface MediaConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
}

const IMAGE_STORAGE_KEY = "zhiying_image_config";
const VIDEO_STORAGE_KEY = "zhiying_video_config";

// ========== 图片生成配置 ==========

export function getImageConfig(): MediaConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IMAGE_STORAGE_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw);
    if (config.apiKey && config.baseUrl) return config;
    return null;
  } catch {
    return null;
  }
}

export function saveImageConfig(config: MediaConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(config));
}

export function clearImageConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(IMAGE_STORAGE_KEY);
}

export function hasImageConfig(): boolean {
  return getImageConfig() !== null;
}

// ========== 视频生成配置 ==========

export function getVideoConfig(): MediaConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VIDEO_STORAGE_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw);
    if (config.apiKey && config.baseUrl) return config;
    return null;
  } catch {
    return null;
  }
}

export function saveVideoConfig(config: MediaConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(config));
}

export function clearVideoConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VIDEO_STORAGE_KEY);
}

export function hasVideoConfig(): boolean {
  return getVideoConfig() !== null;
}

// ========== 图片生成服务商预设 ==========

export const IMAGE_PROVIDER_PRESETS = [
  {
    name: "Stable Diffusion (API)",
    baseUrl: "https://api.stability.ai",
    model: "stable-diffusion-xl-1024-v1-0",
    provider: "stability",
    placeholder: "sk-xxx...xxxx",
    description: "Stability AI 官方 API",
  },
  {
    name: "可灵 (Kling)",
    baseUrl: "https://api.klingai.com/v1",
    model: "kling-v1",
    provider: "kling",
    placeholder: "输入 API Key",
    description: "快手可灵 AI 图片生成",
  },
  {
    name: "DALL-E (OpenAI)",
    baseUrl: "https://api.openai.com/v1",
    model: "dall-e-3",
    provider: "openai",
    placeholder: "sk-xxx...xxxx",
    description: "OpenAI DALL-E 系列",
  },
  {
    name: "通义万相",
    baseUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
    model: "wanx-v1",
    provider: "dashscope",
    placeholder: "sk-xxx...xxxx",
    description: "阿里云通义万相文生图",
  },
  {
    name: "自定义",
    baseUrl: "",
    model: "",
    provider: "custom",
    placeholder: "输入 API Key",
    description: "兼容自定义图片生成 API",
  },
];

// ========== 视频生成服务商预设 ==========

export const VIDEO_PROVIDER_PRESETS = [
  {
    name: "可灵 (Kling)",
    baseUrl: "https://api.klingai.com/v1",
    model: "kling-v1",
    provider: "kling",
    placeholder: "输入 API Key",
    description: "快手可灵 AI 视频生成",
  },
  {
    name: "Runway",
    baseUrl: "https://api.runwayml.com/v1",
    model: "gen3a_turbo",
    provider: "runway",
    placeholder: "输入 API Key",
    description: "Runway Gen-3 视频生成",
  },
  {
    name: "Pika",
    baseUrl: "https://api.pika.art/v1",
    model: "pika-1.0",
    provider: "pika",
    placeholder: "输入 API Key",
    description: "Pika Labs 视频生成",
  },
  {
    name: "智谱清影",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "cogvideox",
    provider: "zhipu",
    placeholder: "xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx",
    description: "智谱 AI CogVideoX 视频生成",
  },
  {
    name: "自定义",
    baseUrl: "",
    model: "",
    provider: "custom",
    placeholder: "输入 API Key",
    description: "兼容自定义视频生成 API",
  },
];
