import fs from 'fs';
import path from 'path';

export interface UsageEntry {
  timestamp: string;
  source: 'pipeline' | 'lab' | 'content' | 'decision';
  platform?: string;
  model: string;
  tokens?: number;
  elapsed?: number;
  contentType?: string;
  step?: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readEntries(): UsageEntry[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // corrupted file, start fresh
  }
  return [];
}

function writeEntries(entries: UsageEntry[]) {
  ensureDataDir();
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(entries, null, 2));
}

export function recordUsage(entry: UsageEntry): void {
  try {
    const entries = readEntries();
    entries.push(entry);
    writeEntries(entries);
  } catch (e) {
    console.error('[analytics] recordUsage failed:', e);
  }
}

export function getUsageOverview() {
  const entries = readEntries();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalCalls = entries.length;
  const totalTokens = entries.reduce((sum, e) => sum + (e.tokens || 0), 0);
  const totalElapsed = entries.reduce((sum, e) => sum + (e.elapsed || 0), 0);
  const avgTokensPerCall = totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0;
  const avgElapsed = totalCalls > 0 ? Math.round(totalElapsed / totalCalls) : 0;

  const todayCalls = entries.filter(e => new Date(e.timestamp) >= todayStart).length;
  const weekCalls = entries.filter(e => new Date(e.timestamp) >= weekStart).length;

  return { totalCalls, totalTokens, totalElapsed, avgTokensPerCall, avgElapsed, todayCalls, weekCalls };
}

export function getPlatformDistribution(): { platform: string; count: number; tokens: number }[] {
  const entries = readEntries();
  const map: Record<string, { count: number; tokens: number }> = {};

  for (const e of entries) {
    const p = e.platform || 'unknown';
    if (!map[p]) map[p] = { count: 0, tokens: 0 };
    map[p].count++;
    map[p].tokens += e.tokens || 0;
  }

  return Object.entries(map).map(([platform, data]) => ({
    platform,
    count: data.count,
    tokens: data.tokens,
  }));
}

export function getModelDistribution(): { model: string; count: number }[] {
  const entries = readEntries();
  const map: Record<string, number> = {};

  for (const e of entries) {
    const m = e.model || 'unknown';
    map[m] = (map[m] || 0) + 1;
  }

  return Object.entries(map).map(([model, count]) => ({ model, count }));
}

export function getDailyTrend(days: number): { date: string; calls: number; tokens: number }[] {
  const entries = readEntries();
  const result: { date: string; calls: number; tokens: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, calls: 0, tokens: 0 });
  }

  for (const e of entries) {
    const dateStr = e.timestamp.slice(0, 10);
    const bucket = result.find(r => r.date === dateStr);
    if (bucket) {
      bucket.calls++;
      bucket.tokens += e.tokens || 0;
    }
  }

  return result;
}

export function getContentStats(): { byType: Record<string, number>; byPlatform: Record<string, number> } {
  const entries = readEntries();
  const byType: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};

  for (const e of entries) {
    if (e.contentType) {
      byType[e.contentType] = (byType[e.contentType] || 0) + 1;
    }
    if (e.platform) {
      byPlatform[e.platform] = (byPlatform[e.platform] || 0) + 1;
    }
  }

  return { byType, byPlatform };
}

export function getRecentEntries(limit: number = 10): UsageEntry[] {
  const entries = readEntries();
  return entries.slice(-limit).reverse();
}

export function getAllAnalytics() {
  return {
    overview: getUsageOverview(),
    platformDistribution: getPlatformDistribution(),
    modelDistribution: getModelDistribution(),
    dailyTrend: getDailyTrend(7),
    contentStats: getContentStats(),
    recentEntries: getRecentEntries(10),
  };
}
