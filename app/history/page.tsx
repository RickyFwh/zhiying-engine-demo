'use client';
import { useState, useEffect } from 'react';
import { getContentList, deleteContent, getStats, type StoredContentItem } from '@/lib/storage';

export default function HistoryPage() {
  const [items, setItems] = useState<StoredContentItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    byPlatform: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    todayCount: 0,
    weekCount: 0,
  });
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setItems(getContentList());
    setStats(getStats());
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条内容吗？')) {
      deleteContent(id);
      loadData();
    }
  };

  const handleCopy = (item: StoredContentItem) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 筛选逻辑
  const filtered = items.filter(item => {
    // 搜索
    if (search && !item.content.toLowerCase().includes(search.toLowerCase())) return false;
    // 平台
    if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
    // 类型
    if (typeFilter !== 'all' && item.contentType !== typeFilter) return false;
    // 日期
    if (dateFilter !== 'all') {
      const ts = new Date(item.createdAt).getTime();
      const now = Date.now();
      if (dateFilter === 'today' && ts < now - 24 * 60 * 60 * 1000) return false;
      if (dateFilter === 'week' && ts < now - 7 * 24 * 60 * 60 * 1000) return false;
      if (dateFilter === 'month' && ts < now - 30 * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  const platformNames: Record<string, string> = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    wechat: '微信',
    lab: '实验室',
  };

  const typeNames: Record<string, string> = {
    text: '种草文案',
    video_script: '视频脚本',
    image_prompt: '图片提示词',
  };

  const sourceNames: Record<string, string> = {
    content: '内容生成',
    pipeline: 'Pipeline',
    lab: '实验室',
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">📚 历史记录</h1>
        <p className="text-slate-400">查看所有 AI 生成的内容历史</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card card-blue">
          <div className="text-slate-400 text-sm mb-1">总生成数</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="card card-green">
          <div className="text-slate-400 text-sm mb-1">今日生成</div>
          <div className="text-2xl font-bold text-white">{stats.todayCount}</div>
        </div>
        <div className="card card-purple">
          <div className="text-slate-400 text-sm mb-1">本周生成</div>
          <div className="text-2xl font-bold text-white">{stats.weekCount}</div>
        </div>
        <div className="card card-yellow">
          <div className="text-slate-400 text-sm mb-1">平台分布</div>
          <div className="text-sm text-white">
            {Object.entries(stats.byPlatform).map(([p, c]) => (
              <span key={p} className="badge badge-blue ml-1 mb-1">
                {platformNames[p] || p}: {c}
              </span>
            ))}
            {Object.keys(stats.byPlatform).length === 0 && <span className="text-slate-500">暂无数据</span>}
          </div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="card p-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">搜索内容</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="输入关键词搜索..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">平台</label>
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="input">
              <option value="all">全部平台</option>
              <option value="xiaohongshu">小红书</option>
              <option value="douyin">抖音</option>
              <option value="wechat">微信</option>
              <option value="lab">实验室</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">类型</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input">
              <option value="all">全部类型</option>
              <option value="text">种草文案</option>
              <option value="video_script">视频脚本</option>
              <option value="image_prompt">图片提示词</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">时间</label>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input">
              <option value="all">全部时间</option>
              <option value="today">今天</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          共 {filtered.length} 条记录 {items.length !== filtered.length && `（总计 ${items.length} 条）`}
        </div>
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="card p-6 text-center text-slate-400">
          <div className="text-4xl mb-2">📭</div>
          <p>暂无历史记录</p>
          <p className="text-sm mt-2">生成内容后会自动保存在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="card p-4">
              <div
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-blue">{platformNames[item.platform] || item.platform}</span>
                    <span className="badge badge-purple">{typeNames[item.contentType] || item.contentType}</span>
                    <span className="badge badge-green">{sourceNames[item.source] || item.source}</span>
                    <span className="text-sm text-slate-300 font-medium">{item.product}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{item.wordCount} 字</span>
                    <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-300 line-clamp-2">
                  {item.content.slice(0, 200)}
                  {item.content.length > 200 && '...'}
                </div>
              </div>

              {expandedId === item.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => handleCopy(item)}
                      className="btn-secondary text-sm"
                    >
                      {copiedId === item.id ? '✅ 已复制' : '📋 复制内容'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn-danger text-sm"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                  <div
                    style={{
                      background: 'rgba(15,23,42,0.5)',
                      border: '1px solid #334155',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                  >
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        color: '#cbd5e1',
                        fontSize: '0.875rem',
                        lineHeight: '1.7',
                        fontFamily: 'inherit',
                      }}
                    >
                      {item.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
