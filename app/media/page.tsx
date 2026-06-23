'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  type MediaItem,
  getMediaList,
  deleteMedia,
  deleteMediaBatch,
  clearAllMedia,
  getMediaStats,
} from '@/lib/media-storage';

type TypeFilter = 'all' | 'image' | 'video';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

const productNames: Record<string, string> = { p1: '烟酰胺精华', p2: '头皮精华', p3: '玻色因面霜' };
const platformNames: Record<string, string> = { xiaohongshu: '小红书', douyin: '抖音', wechat: '微信' };

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState({ total: 0, imageCount: 0, videoCount: 0, byProvider: {} as Record<string, number> });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState('');

  const refresh = useCallback(() => {
    setItems(getMediaList());
    setStats(getMediaStats());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 筛选逻辑
  const filteredItems = items.filter(item => {
    // 类型筛选
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    // 平台筛选
    if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
    // 时间筛选
    if (timeFilter !== 'all') {
      const ts = new Date(item.createdAt).getTime();
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (timeFilter === 'today' && ts < now - dayMs) return false;
      if (timeFilter === 'week' && ts < now - 7 * dayMs) return false;
      if (timeFilter === 'month' && ts < now - 30 * dayMs) return false;
    }
    // 搜索
    if (search && !item.prompt.toLowerCase().includes(search.toLowerCase()) &&
        !item.product.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    deleteMedia(id);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    refresh();
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 项吗？`)) return;
    deleteMediaBatch(Array.from(selectedIds));
    setSelectedIds(new Set());
    refresh();
  };

  const handleClearAll = () => {
    if (!confirm('确定要清空所有媒体记录吗？此操作不可恢复。')) return;
    clearAllMedia();
    setSelectedIds(new Set());
    refresh();
  };

  const handleCopyPrompt = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = item.prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(''), 2000);
    }
  };

  const handleDownload = (item: MediaItem) => {
    if (!item.url) return;
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `${item.type}_${item.product}_${Date.now()}.${item.type === 'image' ? 'png' : 'mp4'}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const providerName = (p: string) => {
    const map: Record<string, string> = {
      stability: 'Stability', kling: '可灵', openai: 'OpenAI',
      dashscope: '通义万相', runway: 'Runway', pika: 'Pika',
      zhipu: '智谱清影', custom: '自定义',
    };
    return map[p] || p;
  };

  return (
    <div className="space-y-4">
      {/* 顶部标题和统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎨 媒体中心</h1>
          <p className="text-sm text-slate-400 mt-1">统一管理所有 AI 生成的图片和视频</p>
        </div>
        <div className="flex gap-2">
          {batchMode && selectedIds.size > 0 && (
            <button className="btn-danger" onClick={handleBatchDelete}>
              🗑 删除选中 ({selectedIds.size})
            </button>
          )}
          <button className="btn-secondary" onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}>
            {batchMode ? '取消批量' : '批量操作'}
          </button>
          {items.length > 0 && (
            <button className="btn-secondary" onClick={handleClearAll} style={{ color: '#f87171' }}>
              清空全部
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card card-blue">
          <div className="text-xs text-slate-400 mb-1">总生成数</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="card card-green">
          <div className="text-xs text-slate-400 mb-1">图片数</div>
          <div className="text-2xl font-bold text-green-400">{stats.imageCount}</div>
        </div>
        <div className="card card-purple">
          <div className="text-xs text-slate-400 mb-1">视频数</div>
          <div className="text-2xl font-bold text-purple-400">{stats.videoCount}</div>
        </div>
        <div className="card card-yellow">
          <div className="text-xs text-slate-400 mb-1">服务商</div>
          <div className="text-sm font-medium text-yellow-400">
            {Object.keys(stats.byProvider).length > 0
              ? Object.entries(stats.byProvider).map(([p, c]) => `${providerName(p)}(${c})`).join(' ')
              : '暂无'}
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 搜索 */}
          <input
            className="input"
            style={{ maxWidth: '220px' }}
            placeholder="🔍 搜索提示词或产品..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* 类型筛选 */}
          <div className="flex gap-1">
            {(['all', 'image', 'video'] as TypeFilter[]).map(t => (
              <button
                key={t}
                className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === 'all' ? '全部' : t === 'image' ? '🖼 图片' : '🎬 视频'}
              </button>
            ))}
          </div>
          {/* 平台筛选 */}
          <select className="input" style={{ maxWidth: '120px' }} value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}>
            <option value="all">全部平台</option>
            <option value="xiaohongshu">小红书</option>
            <option value="douyin">抖音</option>
            <option value="wechat">微信</option>
          </select>
          {/* 时间筛选 */}
          <div className="flex gap-1">
            {([
              { val: 'all', label: '全部' },
              { val: 'today', label: '今天' },
              { val: 'week', label: '近7天' },
              { val: 'month', label: '近30天' },
            ] as { val: TimeFilter; label: string }[]).map(t => (
              <button
                key={t.val}
                className={`filter-btn ${timeFilter === t.val ? 'active' : ''}`}
                onClick={() => setTimeFilter(t.val)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {batchMode && filteredItems.length > 0 && (
            <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={toggleSelectAll}>
              {selectedIds.size === filteredItems.length ? '取消全选' : '全选'}
            </button>
          )}
        </div>
      </div>

      {/* 内容区 */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          {items.length === 0 ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
              <h3 className="text-lg font-semibold text-white mb-2">还没有媒体内容</h3>
              <p className="text-slate-400 text-sm mb-4">
                前往「内容生成」页面，开启图片或视频开关，生成内容后会自动记录到这里。
              </p>
              <a href="/content" className="btn-primary" style={{ display: 'inline-flex' }}>
                前往内容生成 →
              </a>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <p className="text-slate-400">没有匹配筛选条件的内容</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* 选择框 */}
              {batchMode && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                </div>
              )}
              {/* 媒体预览 */}
              <div
                style={{
                  height: item.type === 'image' ? '180px' : '160px',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => setPreviewItem(item)}
              >
                {item.type === 'image' && item.url && item.url.startsWith('http') ? (
                  <img
                    src={item.url}
                    alt={item.prompt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<div style="text-align:center;color:#64748b;padding:1rem;"><div style="font-size:2rem">🖼</div><div style="font-size:0.75rem;margin-top:0.5rem">图片加载失败</div></div>';
                    }}
                  />
                ) : item.type === 'video' && item.url && item.url.startsWith('http') ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    ) : (
                      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '3rem' }}>🎬</span>
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                      width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: 'white', fontSize: '1.5rem', marginLeft: '3px' }}>▶</span>
                    </div>
                  </div>
                ) : (
                  // 文字卡片（无URL时显示提示词摘要）
                  <div style={{ padding: '1rem', textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {item.type === 'image' ? '🖼' : '🎬'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {item.prompt}
                    </div>
                  </div>
                )}
                {/* 类型角标 */}
                <span className={`badge ${item.type === 'image' ? 'badge-green' : 'badge-purple'}`}
                  style={{ position: 'absolute', top: '8px', right: batchMode ? 'auto' : '8px', left: batchMode ? '8px' : 'auto' }}>
                  {item.type === 'image' ? '图片' : '视频'}
                </span>
              </div>
              {/* 底部信息 */}
              <div style={{ padding: '0.75rem 1rem' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {productNames[item.product] || item.product}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                    {platformNames[item.platform] || item.platform}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{providerName(item.provider)} · {item.model}</span>
                  <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                </div>
                {/* 操作按钮 */}
                <div className="flex gap-1 mt-2" style={{ borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                    onClick={(e) => { e.stopPropagation(); handleCopyPrompt(item); }}
                  >
                    {copiedId === item.id ? '✓ 已复制' : '📋 复制提示词'}
                  </button>
                  {item.url && item.url.startsWith('http') && (
                    <button
                      className="btn-secondary"
                      style={{ flex: 0, justifyContent: 'center', fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                      onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                      title="下载"
                    >
                      ⬇
                    </button>
                  )}
                  {!batchMode && (
                    <button
                      className="btn-secondary"
                      style={{ flex: 0, justifyContent: 'center', fontSize: '0.75rem', padding: '0.375rem 0.5rem', color: '#f87171' }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      title="删除"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 预览 Modal */}
      {previewItem && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '2rem',
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="card"
            style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className={`badge ${previewItem.type === 'image' ? 'badge-green' : 'badge-purple'} mr-2`}>
                  {previewItem.type === 'image' ? '🖼 图片' : '🎬 视频'}
                </span>
                <span className="text-sm text-slate-400">
                  {productNames[previewItem.product] || previewItem.product} · {platformNames[previewItem.platform] || previewItem.platform}
                </span>
              </div>
              <button className="btn-secondary" onClick={() => setPreviewItem(null)} style={{ padding: '0.25rem 0.75rem' }}>
                ✕
              </button>
            </div>

            {/* 媒体内容 */}
            {previewItem.type === 'image' && previewItem.url && previewItem.url.startsWith('http') ? (
              <div style={{ borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={previewItem.url} alt={previewItem.prompt} style={{ width: '100%', display: 'block' }} />
              </div>
            ) : previewItem.type === 'video' && previewItem.url && previewItem.url.startsWith('http') ? (
              <div style={{ borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem', background: '#000' }}>
                <video src={previewItem.url} controls style={{ width: '100%', display: 'block', maxHeight: '60vh' }}
                  poster={previewItem.thumbnail}>
                  您的浏览器不支持视频播放
                </video>
              </div>
            ) : null}

            {/* 提示词 */}
            <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <div className="text-xs text-slate-400 mb-2">生成提示词 / 脚本</div>
              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{previewItem.prompt}</div>
            </div>

            {/* 元信息 */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>模型：{previewItem.model} · 服务商：{providerName(previewItem.provider)}</span>
              <span>{new Date(previewItem.createdAt).toLocaleString('zh-CN')}</span>
            </div>

            {/* 操作 */}
            <div className="flex gap-2 mt-3" style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleCopyPrompt(previewItem)}>
                {copiedId === previewItem.id ? '✓ 已复制' : '📋 复制提示词'}
              </button>
              {previewItem.url && previewItem.url.startsWith('http') && (
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDownload(previewItem)}>
                  ⬇ 下载
                </button>
              )}
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                handleDelete(previewItem.id);
                setPreviewItem(null);
              }}>
                🗑 删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
