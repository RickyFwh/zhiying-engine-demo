'use client';
import { PRODUCTS, generateMockMetrics } from '@/lib/mock-data';
import Link from 'next/link';

export default function OverviewPage() {
  const metrics = generateMockMetrics(30);
  const latest = metrics[metrics.length - 1];
  const prev7d = metrics.slice(-7);
  const totalSpend7d = prev7d.reduce((s, m) => s + m.spend, 0);
  const totalRevenue7d = prev7d.reduce((s, m) => s + m.revenue, 0);
  const avgROI7d = (totalRevenue7d / totalSpend7d).toFixed(2);
  const totalConversions7d = prev7d.reduce((s, m) => s + m.conversions, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">智营引擎 · 运营总览</h1>
        <p className="text-slate-400">AI驱动的市场运营全链路自动化 · 生物科技日化专项</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-gradient-blue">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">今日消耗</span>
            <span className="text-blue-400">💰</span>
          </div>
          <div className="text-2xl font-bold text-white">¥{latest.spend}</div>
          <div className="text-xs mt-1 text-green-400">↑ +12% 较上周</div>
        </div>
        <div className="card bg-gradient-green">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">7日ROI</span>
            <span className="text-green-400">📈</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgROI7d}</div>
          <div className="text-xs mt-1 text-green-400">↑ +0.3 较上周</div>
        </div>
        <div className="card bg-gradient-purple">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">7日转化</span>
            <span className="text-purple-400">🛒</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalConversions7d}</div>
          <div className="text-xs mt-1 text-green-400">↑ +18% 较上周</div>
        </div>
        <div className="card bg-gradient-yellow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">7日曝光</span>
            <span className="text-yellow-400">👁️</span>
          </div>
          <div className="text-2xl font-bold text-white">{(prev7d.reduce((s, m) => s + m.impressions, 0) / 1000).toFixed(0)}K</div>
          <div className="text-xs mt-1 text-green-400">↑ +25% 较上周</div>
        </div>
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">核心模块</h2>
        <div className="grid grid-cols-4 gap-4">
          <Link href="/decision" className="card cursor-pointer hover:border-blue-500 transition-all">
            <div className="text-blue-400 mb-3" style={{ fontSize: '2rem' }}>🧠</div>
            <h3 className="text-white font-semibold mb-1">决策大脑</h3>
            <p className="text-slate-400 text-sm mb-3">AI策略引擎，实时优化投放参数</p>
            <div className="flex items-center justify-between">
              <span className="badge badge-green">运行中</span>
              <span className="text-xs text-slate-500">今日决策 12 条</span>
            </div>
          </Link>
          <Link href="/content" className="card cursor-pointer hover:border-blue-500 transition-all">
            <div className="text-blue-400 mb-3" style={{ fontSize: '2rem' }}>✍️</div>
            <h3 className="text-white font-semibold mb-1">内容生成器</h3>
            <p className="text-slate-400 text-sm mb-3">AI生成文案/脚本/图片提示词</p>
            <div className="flex items-center justify-between">
              <span className="badge badge-blue">已生成 8 篇</span>
              <span className="text-xs text-slate-500">通过率 62%</span>
            </div>
          </Link>
          <Link href="/review" className="card cursor-pointer hover:border-blue-500 transition-all">
            <div className="text-blue-400 mb-3" style={{ fontSize: '2rem' }}>✅</div>
            <h3 className="text-white font-semibold mb-1">审核队列</h3>
            <p className="text-slate-400 text-sm mb-3">专家审核AI生成内容</p>
            <div className="flex items-center justify-between">
              <span className="badge badge-yellow">3 条待审</span>
              <span className="text-xs text-slate-500">平均审核 2 分钟</span>
            </div>
          </Link>
          <Link href="/dashboard" className="card cursor-pointer hover:border-blue-500 transition-all">
            <div className="text-blue-400 mb-3" style={{ fontSize: '2rem' }}>📊</div>
            <h3 className="text-white font-semibold mb-1">投放看板</h3>
            <p className="text-slate-400 text-sm mb-3">实时投放数据监控</p>
            <div className="flex items-center justify-between">
              <span className="badge badge-green">3 个计划</span>
              <span className="text-xs text-slate-500">整体ROI 2.4</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Products */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">在投产品</h2>
        <div className="grid grid-cols-3 gap-4">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge badge-blue">{product.category}</span>
                  <h3 className="text-white font-semibold mt-2">{product.name}</h3>
                </div>
                <span className="text-2xl font-bold text-white">¥{product.price}</span>
              </div>
              <p className="text-slate-400 text-sm mb-3">{product.description}</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {product.sellingPoints.slice(0, 3).map((sp, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', background: 'var(--slate-700)', color: 'var(--slate-300)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    {sp}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-slate-400">毛利率</span>
                <span className="text-green-400 font-medium">{Math.round(product.margin * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">最近活动</h2>
        <div className="space-y-3">
          {[
            { time: '10分钟前', action: '决策大脑', detail: '建议烟酰胺精华日预算从¥300提升至¥500', dot: 'var(--purple-400)' },
            { time: '25分钟前', action: '内容生成', detail: '为玻色因面霜生成了小红书种草笔记', dot: 'var(--blue-400)' },
            { time: '1小时前', action: '审核通过', detail: '头皮精华抖音短视频脚本已通过专家审核', dot: 'var(--green-400)' },
            { time: '2小时前', action: '投放优化', detail: '自动暂停ROI<1.2的计划 #3847，节省预算¥180', dot: 'var(--yellow-400)' },
            { time: '3小时前', action: '竞品情报', detail: '检测到竞品A新增5条小红书投放素材', dot: 'var(--slate-400)' },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--slate-800)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.dot, marginTop: 6, flexShrink: 0 }} />
              <div className="flex-1">
                <span className="text-xs text-slate-500">{log.time}</span>
                <span className="text-xs badge-purple" style={{ marginLeft: 8 }}>{log.action}</span>
                <p className="text-sm text-slate-300 mt-1">{log.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
