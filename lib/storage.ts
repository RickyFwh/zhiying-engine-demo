// 内容持久化存储 - 基于 localStorage
// localStorage key: zhiying_contents

export interface StoredContentItem {
  id: string;
  content: string;
  product: string;
  platform: string;
  contentType: string;
  createdAt: string;
  source: 'pipeline' | 'lab' | 'content';
  wordCount: number;
  complianceResult?: {
    passed: boolean;
    issues?: string[];
  };
}

const STORAGE_KEY = 'zhiying_contents';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 保存生成内容到 localStorage
 */
export function saveContent(item: StoredContentItem): void {
  if (!isClient()) return;
  try {
    const list = getContentList();
    // 避免重复保存（根据 id）
    const existing = list.findIndex(i => i.id === item.id);
    if (existing >= 0) {
      list[existing] = item;
    } else {
      list.unshift(item); // 最新的在前面
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('保存内容失败:', e);
  }
}

/**
 * 获取所有历史内容
 */
export function getContentList(): StoredContentItem[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredContentItem[];
  } catch {
    return [];
  }
}

/**
 * 根据 ID 获取单条内容
 */
export function getContentById(id: string): StoredContentItem | null {
  const list = getContentList();
  return list.find(item => item.id === id) || null;
}

/**
 * 删除指定内容
 */
export function deleteContent(id: string): void {
  if (!isClient()) return;
  try {
    const list = getContentList();
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('删除内容失败:', e);
  }
}

/**
 * 获取统计信息
 */
export function getStats(): {
  total: number;
  byPlatform: Record<string, number>;
  byType: Record<string, number>;
  todayCount: number;
  weekCount: number;
} {
  const list = getContentList();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

  const byPlatform: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let todayCount = 0;
  let weekCount = 0;

  for (const item of list) {
    // 按平台统计
    byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
    // 按类型统计
    byType[item.contentType] = (byType[item.contentType] || 0) + 1;
    // 按时间统计
    const ts = new Date(item.createdAt).getTime();
    if (ts >= todayStart) todayCount++;
    if (ts >= weekStart) weekCount++;
  }

  return {
    total: list.length,
    byPlatform,
    byType,
    todayCount,
    weekCount,
  };
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * 计算字数（中文按字符数，英文按单词数）
 */
export function countWords(text: string): number {
  if (!text) return 0;
  // 中文字符数 + 英文单词数
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}
