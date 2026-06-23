// 竞品情报存储模块
// localStorage key: zhiying_competitors

export interface CompetitorAdMaterial {
  id: string;
  type: 'text' | 'image_desc' | 'video_script';
  platform: string;
  content: string;
  performance: string;
  createdAt: string;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  category: string;
  relatedProductId: string;
  price: { min: number; max: number };
  channels: string[];
  marketingData: {
    estimatedBudget: string;
    contentFrequency: string;
    followerCount: string;
    topContent: string;
    engagementRate: string;
  };
  adMaterials: CompetitorAdMaterial[];
  strengths: string[];
  weaknesses: string[];
  differentiation: string;
  researchedAt: string;
  notes: string;
}

const STORAGE_KEY = 'zhiying_competitors';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 从 localStorage 加载所有竞品档案
 */
export function loadCompetitors(): CompetitorProfile[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

/**
 * 保存（新增或更新）一个竞品档案
 */
export function saveCompetitor(competitor: CompetitorProfile): void {
  if (!isClient()) return;
  try {
    const list = loadCompetitors();
    const idx = list.findIndex((c) => c.id === competitor.id);
    if (idx >= 0) {
      list[idx] = competitor;
    } else {
      list.unshift(competitor);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('保存竞品档案失败:', e);
  }
}

/**
 * 删除一个竞品档案
 */
export function deleteCompetitor(id: string): void {
  if (!isClient()) return;
  try {
    const list = loadCompetitors().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('删除竞品档案失败:', e);
  }
}

/**
 * 按关联产品 ID 获取竞品列表
 */
export function getCompetitorsByProduct(productId: string): CompetitorProfile[] {
  return loadCompetitors().filter((c) => c.relatedProductId === productId);
}

/**
 * 生成竞品 ID
 */
export function generateCompetitorId(): string {
  return 'comp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
