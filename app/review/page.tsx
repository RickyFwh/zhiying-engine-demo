'use client';
/**
 * 审核页面 - 审核反馈闭环
 * 展示历史生成内容，支持通过/驳回/编辑操作
 * 审核数据持久化在 localStorage（key: zhiying_reviews）
 */
import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Check, X, MessageSquare, Clock, Filter, AlertTriangle, Edit3, RefreshCw } from 'lucide-react';
import { getClientConfig } from '@/lib/client-config';
import { getCategoryLabel, getSeverityLabel } from '@/lib/compliance';

// ===== 审核记录类型 =====
interface ReviewItem {
  id: string;
  title: string;
  body: string;
  platform: 'xiaohongshu' | 'douyin' | 'wechat';
  type: 'text' | 'image_prompt' | 'video_script';
  productId: string;
  productName: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'published';
  reviewComment?: string;
  editedContent?: string;
  compliance?: {
    passed: boolean;
    violations: {
      word: string;
      category: string;
      severity: string;
      suggestion: string;
    }[];
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  createdAt: string;
  reviewedAt?: string;
  reviewAction?: 'approve' | 'reject' | 'edit';
}

const STORAGE_KEY = 'zhiying_reviews';

// ===== 本地存储操作 =====
function loadReviews(): ReviewItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveReviews(items: ReviewItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function ReviewPage() {
  const [contents, setContents] = useState<ReviewItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // 初始化：从 localStorage 加载数据，并同步到服务端
  useEffect(() => {
    const localItems = loadReviews();
    if (localItems.length > 0) {
      setContents(localItems);
      // 同步到服务端内存
      syncToServer(localItems);
    }
    setLoading(false);
  }, []);

  // 同步数据到服务端
  const syncToServer = async (items: ReviewItem[]) => {
    try {
      setSyncing(true);
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', items }),
      });
    } catch (e) {
      console.error('同步审核数据失败:', e);
    } finally {
      setSyncing(false);
    }
  };

  // 更新本地数据并持久化
  const updateContents = useCallback((updater: (prev: ReviewItem[]) => ReviewItem[]) => {
    setContents(prev => {
      const next = updater(prev);
      saveReviews(next);
      // 异步同步到服务端
      syncToServer(next);
      return next;
    });
  }, []);

  // 过滤列表
  const filtered = filter === 'all' ? contents : contents.filter(c => c.status === filter);
  const pendingCount = contents.filter(c => c.status === 'pending_review').length;

  // 通过审核
  const handleApprove = async (id: string) => {
    const now = new Date().toISOString();
    updateContents(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'approved' as const, reviewedAt: now, reviewAction: 'approve' as const } : c
    ));
    // 通知服务端
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id }),
      });
    } catch {}
    setSelectedId(null);
    setEditMode(false);
  };

  // 驳回审核
  const handleReject = async (id: string) => {
    if (!comment.trim()) return;
    const now = new Date().toISOString();
    updateContents(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        status: 'rejected' as const,
        reviewComment: comment.trim(),
        reviewedAt: now,
        reviewAction: 'reject' as const,
      } : c
    ));
    // 通知服务端
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', id, comment: comment.trim() }),
      });
    } catch {}
    setComment('');
    setSelectedId(null);
    setEditMode(false);
  };

  // 编辑内容并通过
  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    const now = new Date().toISOString();
    updateContents(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        status: 'approved' as const,
        body: editContent.trim(),
        editedContent: editContent.trim(),
        reviewedAt: now,
        reviewAction: 'edit' as const,
      } : c
    ));
    // 通知服务端
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', id, editedContent: editContent.trim() }),
      });
    } catch {}
    setSelectedId(null);
    setEditMode(false);
    setEditContent('');
  };

  // 选中某条记录
  const handleSelect = (item: ReviewItem) => {
    setSelectedId(item.id);
    setComment('');
    setEditMode(false);
    setEditContent(item.body);
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending_review: { label: '待审核', class: 'badge-yellow' },
    approved: { label: '已通过', class: 'badge-green' },
    rejected: { label: '已驳回', class: 'badge-red' },
    published: { label: '已发布', class: 'badge-blue' },
  };

  const platformLabels: Record<string, string> = { xiaohongshu: '📕 小红书', douyin: '🎵 抖音', wechat: '💬 微信' };
  const typeLabels: Record<string, string> = { text: '📝 文案', image_prompt: '🎨 图片', video_script: '🎬 脚本' };

  const selected = contents.find(c => c.id === selectedId);

  // 加载中的状态
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
          <p>加载审核数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-yellow-400" />
            审核队列
          </h1>
          <p className="text-slate-400">
            审核 AI 生成的营销内容，违禁词自动检测
            {syncing && <span className="ml-2 text-xs text-blue-400">同步中...</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-yellow flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {pendingCount} 条待审
          </span>
          <span className="badge-green flex items-center gap-1">
            {contents.filter(c => c.status === 'approved').length} 已通过
          </span>
          <span className="badge-red flex items-center gap-1">
            {contents.filter(c => c.status === 'rejected').length} 已驳回
          </span>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['all', 'pending_review', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: filter === f ? '#2563eb' : '#1e293b',
              color: filter === f ? '#fff' : '#94a3b8',
            }}
          >
            {f === 'all' ? '全部' : statusLabels[f].label}
            {f === 'pending_review' && pendingCount > 0 && (
              <span className="ml-1 bg-yellow-500 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* 无数据提示 */}
      {contents.length === 0 && (
        <div className="card p-12 text-center">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl text-slate-300 mb-2">暂无审核内容</h3>
          <p className="text-slate-500">
            请先在「内容生成」或「投放流水线」页面生成内容，<br />
            生成的内容会自动进入审核队列
          </p>
        </div>
      )}

      {/* 内容列表 + 审核面板 */}
      {contents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：内容列表 */}
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="card p-4 cursor-pointer transition-all"
                style={{
                  borderColor: selectedId === item.id ? '#3b82f6' : undefined,
                  background: selectedId === item.id ? 'rgba(59,130,246,0.05)' : undefined,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{platformLabels[item.platform]}</span>
                      <span className="text-xs text-slate-500">{typeLabels[item.type]}</span>
                      {item.productName && (
                        <span className="text-xs text-slate-600">| {item.productName}</span>
                      )}
                    </div>
                  </div>
                  <span className={statusLabels[item.status]?.class || 'badge'}>
                    {statusLabels[item.status]?.label || item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{item.body}</p>

                {/* 违禁词警告 */}
                {item.compliance && !item.compliance.passed && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                      发现 {item.compliance.highCount} 个高风险词
                      {item.compliance.mediumCount > 0 && `、${item.compliance.mediumCount} 个中风险词`}
                    </span>
                  </div>
                )}

                {/* 驳回原因 */}
                {item.reviewComment && (
                  <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded text-xs text-orange-300 flex items-start gap-1">
                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                    {item.reviewComment}
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-600">
                  {new Date(item.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="card p-8 text-center text-slate-500">
                暂无{filter === 'all' ? '' : statusLabels[filter]?.label}内容
              </div>
            )}
          </div>

          {/* 右侧：审核面板 */}
          <div className="card p-6 sticky top-8">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
                  <span className={statusLabels[selected.status]?.class || 'badge'}>
                    {statusLabels[selected.status]?.label || selected.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="badge-blue">{platformLabels[selected.platform]}</span>
                  <span className="badge-purple">{typeLabels[selected.type]}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(selected.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>

                {/* 违禁词检查结果展示 */}
                {selected.compliance && selected.compliance.violations.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      违禁词检测结果
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${selected.compliance.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {selected.compliance.passed ? '✓ 通过' : '✗ 未通过'}
                      </span>
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-auto">
                      {selected.compliance.violations.map((v, i) => (
                        <div key={i} className="text-xs flex items-start gap-2 py-1 border-b border-slate-700/50">
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                            v.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                            v.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {getSeverityLabel(v.severity as any)}
                          </span>
                          <span className="text-white font-medium">「{v.word}」</span>
                          <span className="text-slate-500">{getCategoryLabel(v.category as any)}</span>
                          <span className="text-slate-400 ml-auto">→ {v.suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 内容展示区 */}
                {!editMode ? (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4 max-h-80 overflow-auto">
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {selected.body}
                    </pre>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-1">编辑内容</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input w-full h-64 resize-none font-mono text-sm"
                      placeholder="修改内容..."
                    />
                  </div>
                )}

                {/* 操作区域 - 仅待审核状态可操作 */}
                {selected.status === 'pending_review' && (
                  <div className="space-y-3">
                    {!editMode ? (
                      <>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">驳回原因（驳回时必填）</label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="例如：开头不够吸引、违禁词需修改..."
                            className="input w-full h-20 resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(selected.id)}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                            style={{ background: '#16a34a' }}
                          >
                            <Check className="w-4 h-4" /> 通过审核
                          </button>
                          <button
                            onClick={() => handleReject(selected.id)}
                            disabled={!comment.trim()}
                            className="btn-secondary flex-1 flex items-center justify-center gap-2"
                            style={{ background: '#dc2626', opacity: !comment.trim() ? 0.5 : 1 }}
                          >
                            <X className="w-4 h-4" /> 驳回修改
                          </button>
                          <button
                            onClick={() => setEditMode(true)}
                            className="btn-secondary flex items-center justify-center gap-2 px-4"
                            title="编辑内容后通过"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(selected.id)}
                          disabled={!editContent.trim()}
                          className="btn-primary flex-1 flex items-center justify-center gap-2"
                          style={{ background: '#16a34a', opacity: !editContent.trim() ? 0.5 : 1 }}
                        >
                          <Check className="w-4 h-4" /> 保存并通过
                        </button>
                        <button
                          onClick={() => { setEditMode(false); setEditContent(selected.body); }}
                          className="btn-secondary flex-1 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" /> 取消编辑
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 已审核状态的信息展示 */}
                {selected.status !== 'pending_review' && (
                  <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>审核状态：{statusLabels[selected.status]?.label}</p>
                      {selected.reviewedAt && <p>审核时间：{new Date(selected.reviewedAt).toLocaleString('zh-CN')}</p>}
                      {selected.reviewAction && <p>操作类型：{selected.reviewAction === 'approve' ? '通过' : selected.reviewAction === 'reject' ? '驳回' : '编辑后通过'}</p>}
                      {selected.reviewComment && <p className="text-orange-300">驳回原因：{selected.reviewComment}</p>}
                      {selected.editedContent && <p className="text-green-300">✓ 内容已被编辑</p>}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>点击左侧内容查看详情</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
