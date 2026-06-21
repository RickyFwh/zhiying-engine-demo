'use client';
import { useState, useEffect } from 'react';

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(data => { setStatus(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">正在加载系统状态...</div>;
  if (!status) return <div className="text-red-400">加载失败</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">💚 系统状态</h1>
        <p className="text-slate-400">实时系统健康与配置状态</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🧠 大模型 API 状态</h2>
          <div className="space-y-3">
            <Row label="模型提供商" value={status.llm.provider} ok />
            <Row label="模型名称" value={status.llm.model} ok />
            <Row label="接口地址" value={status.llm.baseUrl} ok />
            <Row label="API 密钥" value={status.llm.configured ? '已配置 ✅' : '未配置 ⚠️'} ok={status.llm.configured} />
            <Row label="最近测试" value={status.llm.lastTest || '未测试'} ok={!!status.llm.lastTest} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🔌 API 端点</h2>
          <div className="space-y-3">
            {Object.entries(status.api).map(([name, url]: any) => (
              <Row key={name} label={'/' + name} value="正常 ✅" ok />
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🔗 平台集成</h2>
          <div className="space-y-3">
            <Row label="微信公众号" value={status.platform.wechat ? '已连接 ✅' : '未配置'} ok={status.platform.wechat} />
            <Row label="小红书" value={status.platform.xiaohongshu ? 'RPA 就绪 ✅' : '未配置'} ok={status.platform.xiaohongshu} />
            <Row label="抖音 / 千川" value={status.platform.douyin ? 'RPA 就绪 ✅' : '未配置'} ok={status.platform.douyin} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 内容统计</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{status.content.generated}</div>
              <div className="text-xs text-slate-400 mt-1">已生成</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{status.content.approved}</div>
              <div className="text-xs text-slate-400 mt-1">已通过</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{status.content.pending}</div>
              <div className="text-xs text-slate-400 mt-1">待审核</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{status.content.rejected}</div>
              <div className="text-xs text-slate-400 mt-1">已驳回</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🖥️ 系统信息</h2>
        <div className="grid grid-cols-4 gap-4">
          <Row label="版本号" value={status.system.version} ok />
          <Row label="Node.js" value={status.system.nodeVersion} ok />
          <Row label="运行环境" value={status.system.env} ok />
          <Row label="运行时长" value={status.system.uptime} ok />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className={'text-sm ' + (ok ? 'text-green-400' : 'text-yellow-400')}>{value}</span>
        <div className={'w-2 h-2 rounded-full ' + (ok ? 'bg-green-400' : 'bg-yellow-400')} />
      </div>
    </div>
  );
}
