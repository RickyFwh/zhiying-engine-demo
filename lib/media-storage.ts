// 媒体历史持久化存储 - 基于 localStorage
// localStorage key: zhiying_media_history

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;           // 图片URL或视频URL
  prompt: string;        // 生成提示词/脚本
  product: string;       // 关联产品
  platform: string;      // 目标平台
  model: string;         // 使用的模型
  provider: string;      // 服务商
  createdAt: string;     // 生成时间
  thumbnail?: string;    // 缩略图（视频用）
}

const STORAGE_KEY = 'zhiying_media_history';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 保存媒体项到 localStorage
 */
export function saveMedia(item: MediaItem): void {
  if (!isClient()) return;
  try {
    const list = getMediaList();
    const existing = list.findIndex(i => i.id === item.id);
    if (existing >= 0) {
      list[existing] = item;
    } else {
      list.unshift(item); // 最新的在前面
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('保存媒体项失败:', e);
  }
}

/**
 * 获取所有媒体项
 */
export function getMediaList(): MediaItem[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MediaItem[];
  } catch {
    return [];
  }
}

/**
 * 删除指定媒体项
 */
export function deleteMedia(id: string): void {
  if (!isClient()) return;
  try {
    const list = getMediaList();
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('删除媒体项失败:', e);
  }
}

/**
 * 清空所有媒体项
 */
export function clearAllMedia(): void {
  if (!isClient()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('清空媒体项失败:', e);
  }
}

/**
 * 批量删除媒体项
 */
export function deleteMediaBatch(ids: string[]): void {
  if (!isClient()) return;
  try {
    const list = getMediaList();
    const idSet = new Set(ids);
    const filtered = list.filter(item => !idSet.has(item.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('批量删除媒体项失败:', e);
  }
}

/**
 * 获取媒体统计信息
 */
export function getMediaStats(): {
  total: number;
  imageCount: number;
  videoCount: number;
  byProvider: Record<string, number>;
} {
  const list = getMediaList();
  let imageCount = 0;
  let videoCount = 0;
  const byProvider: Record<string, number> = {};

  for (const item of list) {
    if (item.type === 'image') imageCount++;
    else if (item.type === 'video') videoCount++;
    byProvider[item.provider] = (byProvider[item.provider] || 0) + 1;
  }

  return {
    total: list.length,
    imageCount,
    videoCount,
    byProvider,
  };
}

/**
 * 生成媒体项唯一 ID
 */
export function generateMediaId(): string {
  return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
