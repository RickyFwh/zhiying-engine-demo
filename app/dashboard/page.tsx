'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Activity, Clock, Zap, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalCalls: number;
    totalTokens: number;
    totalElapsed: number;
    avgTokensPerCall: number;
    avgElapsed: number;
    todayCalls: number;
    weekCalls: number;
  };
  platformDistribution: { platform: string; count: number; tokens: number }[];
  modelDistribution: { model: string; count: number }[];
  dailyTrend: { date: string; calls: number; tokens: number }[];
  contentStats: { byType: Record<string, number>; byPlatform: Record<string, number> };
  recentEntries: {
    timestamp: string;
    source: string;
    platform?: string;
    model: string;
    tokens?: number;
    elapsed?: number;
    contentType?: string;
    step?: string;
  }[];
}

const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  wechat: '微信',
  lab: '实验室',
  unknown: '未知',
};

const SOURCE_LABELS: Record<string, string> = {
  pipeline: 'Pipeline',
  lab: 'AI 实验室',
  content: '内容生成',
  decision: '决策引擎',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  text: '种草文案',
  video_script: '视频脚本',
  image_prompt: '图片提示词',
};

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
          <div className="text-slate-400 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            加载数据中...
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.overview.totalCalls === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            数据看板
          </h1>
          <p className="text-slate-400">实时使用数据统计 · 数据驱动决策优化</p>
        </div>
        <div className="card p-6" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BarChart3 className="w-16 h-16 text-slate-600" style={{ margin: '0 auto 1.5rem' }} />
          <h3 className="text-xl font-semibold text-white mb-2">暂无使用数据</h3>
          <p className="text-slate-400 mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
            开始使用系统各功能后，这里会自动展示您的使用数据统计。
          </p>
          <div className="grid grid-cols-4 gap-3" style={{ maxWidth: '600px', margin: '2rem auto 0' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.5rem', padding: '1rem' }}>
              <p className="text-sm text-blue-400 font-medium">Pipeline</p>
              <p className="text-xs text-slate-500 mt-1">全链路策略分析</p>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.5rem', padding: '1rem' }}>
              <p className="text-sm text-green-400 font-medium">内容生成</p>
              <p className="text-xs text-slate-500 mt-1">多渠道营销内容</p>
            </div>
            <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '0.5rem', padding: '1rem' }}>
              <p className="text-sm text-purple-400 font-medium">AI 实验室</p>
              <p className="text-xs text-slate-500 mt-1">自由探索 AI 能力</p>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.5rem', padding: '1rem' }}>
              <p className="text-sm text-yellow-400 font-medium">决策引擎</p>
              <p className="text-xs text-slate-500 mt-1">智能投放决策</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { overview, platformDistribution, modelDistribution, dailyTrend, contentStats, recentEntries } = data;

  // Transform contentStats for bar chart
  const contentTypeData = Object.entries(contentStats.byType).map(([type, count]) => ({
    name: CONTENT_TYPE_LABELS[type] || type,
    count,
  }));

  // Transform platformDistribution with labels
  const platformChartData = platformDistribution.map(p => ({
    name: PLATFORM_LABELS[p.platform] || p.platform,
    value: p.count,
    tokens: p.tokens,
  }));

  // Transform modelDistribution
  const modelChartData = modelDistribution.map(m => ({
    name: m.model,
    value: m.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            数据看板
          </h1>
          <p className="text-slate-400">实时使用数据统计 · 数据驱动决策优化</p>
        </div>
        <button onClick={fetchData} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card card-blue p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-400">总调用次数</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.totalCalls}</p>
          <p className="text-xs text-slate-500 mt-1">本周 {overview.weekCalls} 次 · 今日 {overview.todayCalls} 次</p>
        </div>
        <div className="card card-green p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-400">总 Token 消耗</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.totalTokens.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">平均 {overview.avgTokensPerCall.toLocaleString()} / 次</p>
        </div>
        <div className="card card-purple p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-slate-400">今日调用</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.todayCalls}</p>
          <p className="text-xs text-slate-500 mt-1">本周累计 {overview.weekCalls} 次</p>
        </div>
        <div className="card card-yellow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-slate-400">平均响应时间</span>
          </div>
          <p className="text-2xl font-bold text-white">{(overview.avgElapsed / 1000).toFixed(1)}s</p>
          <p className="text-xs text-slate-500 mt-1">总计 {(overview.totalElapsed / 1000 / 60).toFixed(1)} 分钟</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Trend - Line Chart */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">每日调用趋势（最近7天）</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: number, name: string) => [value, name === 'calls' ? '调用次数' : 'Token 数']}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Legend formatter={(value) => value === 'calls' ? '调用次数' : 'Token 数'} />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="calls" />
              <Line type="monotone" dataKey="tokens" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="tokens" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution - Pie Chart */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">平台使用分布</h3>
          {platformChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={platformChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {platformChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: number, name: string, props: any) => [`${value} 次 (${(props.payload.tokens || 0).toLocaleString()} tokens)`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: '260px' }}>
              <p className="text-slate-500">暂无平台数据</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Content Type Distribution - Bar Chart */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">内容类型分布</h3>
          {contentTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={contentTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [value + ' 次', '生成次数']}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} name="生成次数" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: '260px' }}>
              <p className="text-slate-500">暂无内容类型数据</p>
            </div>
          )}
        </div>

        {/* Model Distribution - Pie Chart */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">模型使用分布</h3>
          {modelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={modelChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name.length > 12 ? name.slice(0, 12) + '…' : name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {modelChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: number, _name: string, props: any) => [`${value} 次`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: '260px' }}>
              <p className="text-slate-500">暂无模型数据</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4">最近使用记录</h3>
        {recentEntries.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b" style={{ borderColor: '#334155' }}>
                <th className="text-left py-2">时间</th>
                <th className="text-left py-2">来源</th>
                <th className="text-left py-2">平台</th>
                <th className="text-left py-2">模型</th>
                <th className="text-right py-2">Token</th>
                <th className="text-right py-2">耗时</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((entry, i) => (
                <tr key={i} className="border-b" style={{ borderColor: '#1e293b' }}>
                  <td className="py-3 text-slate-300">
                    {new Date(entry.timestamp).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3">
                    <span className="badge badge-blue">{SOURCE_LABELS[entry.source] || entry.source}{entry.step ? ` / ${entry.step}` : ''}</span>
                  </td>
                  <td className="py-3 text-slate-400">{PLATFORM_LABELS[entry.platform || ''] || entry.platform || '-'}</td>
                  <td className="py-3 text-slate-300" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.model}
                  </td>
                  <td className="py-3 text-right text-slate-300">{entry.tokens ? entry.tokens.toLocaleString() : '-'}</td>
                  <td className="py-3 text-right text-slate-300">{entry.elapsed ? (entry.elapsed / 1000).toFixed(1) + 's' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-center py-4">暂无记录</p>
        )}
      </div>
    </div>
  );
}
