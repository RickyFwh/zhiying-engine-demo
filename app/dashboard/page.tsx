'use client';
import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { generateMockMetrics, PRODUCTS } from '@/lib/mock-data';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const metrics = useMemo(() => generateMockMetrics(days), [days]);

  const latest = metrics[metrics.length - 1];
  const prev = metrics[metrics.length - 2];
  const roiChange = latest.roi - prev.roi;
  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const avgROI = totalRevenue / totalSpend;
  const avgCTR = metrics.reduce((s, m) => s + m.ctr, 0) / metrics.length;
  const avgCVR = metrics.reduce((s, m) => s + m.cvr, 0) / metrics.length;

  // 按产品模拟分配数据
  const productData = PRODUCTS.map((p, i) => ({
    name: p.name,
    spend: Math.round(totalSpend * (i === 0 ? 0.45 : i === 1 ? 0.3 : 0.25)),
    revenue: Math.round(totalRevenue * (i === 0 ? 0.5 : i === 1 ? 0.28 : 0.22)),
    conversions: Math.round(totalConversions * (i === 0 ? 0.48 : i === 1 ? 0.3 : 0.22)),
    roi: i === 0 ? 2.8 : i === 1 ? 1.9 : 2.1,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-400" />
            投放数据看板
          </h1>
          <p className="text-slate-400">实时监控投放效果 · 数据驱动决策优化</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                days === d ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="总消耗" value={`¥${totalSpend.toLocaleString()}`} sub={`${days}天累计`} />
        <StatCard label="总营收" value={`¥${totalRevenue.toLocaleString()}`} sub={`${days}天累计`} />
        <StatCard
          label="平均ROI"
          value={avgROI.toFixed(2)}
          sub={roiChange >= 0 ? `+${roiChange.toFixed(2)} vs昨日` : `${roiChange.toFixed(2)} vs昨日`}
          positive={roiChange >= 0}
        />
        <StatCard label="总转化" value={totalConversions.toString()} sub={`${days}天累计`} />
        <StatCard label="平均CTR" value={`${avgCTR.toFixed(2)}%`} sub="点击率" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* ROI Trend */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">ROI 趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="roi" stroke="#3b82f6" fill="url(#roiGradient)" strokeWidth={2} name="ROI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Spend vs Revenue */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">消耗 vs 营收</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Bar dataKey="spend" fill="#ef4444" name="消耗" radius={[2, 2, 0, 0]} />
              <Bar dataKey="revenue" fill="#22c55e" name="营收" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CTR & CVR Trend */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4">CTR & CVR 趋势</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend />
            <Line type="monotone" dataKey="ctr" stroke="#a78bfa" strokeWidth={2} name="CTR %" dot={false} />
            <Line type="monotone" dataKey="cvr" stroke="#f59e0b" strokeWidth={2} name="CVR %" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Product Performance */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4">产品投放效果对比</h3>
        <div className="grid grid-cols-3 gap-4">
          {productData.map((p, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{p.name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">消耗</span>
                  <span className="text-red-400">¥{p.spend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">营收</span>
                  <span className="text-green-400">¥{p.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">转化</span>
                  <span className="text-white">{p.conversions}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span className="text-slate-400 font-medium">ROI</span>
                  <span className={`font-bold ${p.roi >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {p.roi.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4">运行中的投放计划</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2">计划名称</th>
              <th className="text-left py-2">平台</th>
              <th className="text-right py-2">日预算</th>
              <th className="text-right py-2">消耗</th>
              <th className="text-right py-2">ROI</th>
              <th className="text-center py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: '烟酰胺-拉新-信息流', platform: '千川', budget: 300, spend: 285, roi: 2.8, status: 'running' },
              { name: '头皮精华-种草-搜索', platform: '聚光', budget: 200, spend: 178, roi: 1.9, status: 'running' },
              { name: '玻色因-品牌-开屏', platform: '千川', budget: 150, spend: 52, roi: 2.1, status: 'running' },
              { name: '烟酰胺-复购-私信', platform: '聚光', budget: 100, spend: 0, roi: 0, status: 'paused' },
            ].map((c, i) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-3 text-white">{c.name}</td>
                <td className="py-3 text-slate-400">{c.platform}</td>
                <td className="py-3 text-right text-slate-300">¥{c.budget}</td>
                <td className="py-3 text-right text-red-400">¥{c.spend}</td>
                <td className="py-3 text-right">
                  <span className={c.roi >= 2 ? 'text-green-400' : c.roi > 0 ? 'text-yellow-400' : 'text-slate-500'}>
                    {c.roi > 0 ? c.roi.toFixed(1) : '-'}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className={c.status === 'running' ? 'badge-green' : 'badge-yellow'}>
                    {c.status === 'running' ? '投放中' : '已暂停'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className={`text-xs mt-1 flex items-center gap-1 ${
        positive === undefined ? 'text-slate-500' : positive ? 'text-green-400' : 'text-red-400'
      }`}>
        {positive !== undefined && (positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
        {sub}
      </p>
    </div>
  );
}
