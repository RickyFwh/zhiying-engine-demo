'use client';
import { useState } from 'react';
import { CheckSquare, Check, X, MessageSquare, Clock, Filter } from 'lucide-react';
import { generateMockContent } from '@/lib/mock-data';
import { ContentItem } from '@/lib/types';

export default function ReviewPage() {
  const [contents, setContents] = useState<ContentItem[]>(generateMockContent());
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const filtered = filter === 'all' ? contents : contents.filter(c => c.status === filter);
  const pendingCount = contents.filter(c => c.status === 'pending_review').length;

  const handleApprove = (id: string) => {
    setContents(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' as const } : c));
    setSelectedId(null);
  };

  const handleReject = (id: string) => {
    if (!comment.trim()) return;
    setContents(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'rejected' as const, reviewComment: comment } : c
    ));
    setComment('');
    setSelectedId(null);
  };

  const statusLabels = {
    pending_review: { label: '待审核', class: 'badge-yellow' },
    approved: { label: '已通过', class: 'badge-green' },
    rejected: { label: '已驳回', class: 'badge-red' },
    published: { label: '已发布', class: 'badge-blue' },
  };

  const platformLabels = { xiaohongshu: '📕 小红书', douyin: '🎵 抖音', wechat: '💬 微信' };
  const typeLabels = { text: '📝 文案', image_prompt: '🎨 图片', video_script: '🎬 脚本' };

  const selected = contents.find(c => c.id === selectedId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-yellow-400" />
            审核队列
          </h1>
          <p className="text-slate-400">专家审核 AI 生成的营销内容</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-yellow flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {pendingCount} 条待审
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['all', 'pending_review', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f === 'all' ? '全部' : statusLabels[f].label}
            {f === 'pending_review' && pendingCount > 0 && (
              <span className="ml-1 bg-yellow-500 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content List */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`card p-4 cursor-pointer transition-all ${
                selectedId === item.id ? 'border-blue-500 bg-blue-500/5' : 'hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{platformLabels[item.platform]}</span>
                    <span className="text-xs text-slate-500">{typeLabels[item.type]}</span>
                  </div>
                </div>
                <span className={statusLabels[item.status].class}>{statusLabels[item.status].label}</span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{item.body}</p>
              {item.reviewComment && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300 flex items-start gap-1">
                  <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                  {item.reviewComment}
                </div>
              )}
              {item.metrics && (
                <div className="mt-2 flex gap-3 text-xs text-slate-500">
                  <span>曝光 {(item.metrics.impressions / 1000).toFixed(0)}K</span>
                  <span>点击 {item.metrics.clicks}</span>
                  <span>转化 {item.metrics.conversions}</span>
                  <span className="text-green-400">ROI {item.metrics.roi}</span>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card p-8 text-center text-slate-500">
              暂无{filter === 'all' ? '' : statusLabels[filter].label}内容
            </div>
          )}
        </div>

        {/* Review Panel */}
        <div className="card p-6 sticky top-8">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
                <span className={statusLabels[selected.status].class}>{statusLabels[selected.status].label}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="badge-blue">{platformLabels[selected.platform]}</span>
                <span className="badge-purple">{typeLabels[selected.type]}</span>
                <span className="text-xs text-slate-500">
                  {new Date(selected.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4 max-h-80 overflow-auto">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {selected.body}
                </pre>
              </div>

              {selected.status === 'pending_review' && (
                <div className="space-y-3">
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
                      className="btn-success flex-1 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> 通过审核
                    </button>
                    <button
                      onClick={() => handleReject(selected.id)}
                      disabled={!comment.trim()}
                      className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> 驳回修改
                    </button>
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
    </div>
  );
}
