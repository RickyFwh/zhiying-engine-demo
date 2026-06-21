'use client';
import { useState, useEffect } from 'react';

type Provider = 'deepseek' | 'doubao' | 'qwen' | 'custom';

const PRESETS: Record<Provider, { name: string; baseUrl: string; model: string; desc: string; url: string; emoji: string }> = {
  deepseek: { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', desc: 'DeepSeek API，性价比高', url: 'https://platform.deepseek.com', emoji: 'DS' },
  doubao: { name: '豆包（字节跳动）', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-4k', desc: '字节豆包大模型', url: 'https://console.volcengine.com/ark', emoji: 'DB' },
  qwen: { name: '通义千问 / 百炼', baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', desc: '阿里通义千问（国际版）', url: 'https://dashscope.console.aliyun.com', emoji: 'QW' },
  custom: { name: '自定义', baseUrl: '', model: '', desc: '任意 OpenAI 兼容接口', url: '', emoji: 'CU' },
};

export default function SettingsPage() {
  const [provider, setProvider] = useState<Provider>('qwen');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(PRESETS.qwen.baseUrl);
  const [model, setModel] = useState(PRESETS.qwen.model);
  const [maskedKey, setMaskedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [wechatAppId, setWechatAppId] = useState('');
  const [wechatSecret, setWechatSecret] = useState('');
  const [xhsCookie, setXhsCookie] = useState('');
  const [douyinCookie, setDouyinCookie] = useState('');
  const [exportFormat, setExportFormat] = useState<'markdown' | 'html' | 'json'>('markdown');

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(data => {
      setMaskedKey(data.apiKey || '');
      setBaseUrl(data.baseUrl || PRESETS.qwen.baseUrl);
      setModel(data.model || 'qwen-plus');
      setProvider((data.provider as Provider) || 'qwen');
      setWechatAppId(data.wechatAppId || '');
      if (data.apiKeyRaw) setApiKey(data.apiKeyRaw);
    }).catch(() => {});
    try {
      const raw = localStorage.getItem('zhiying_platform_config');
      if (raw) {
        const cfg = JSON.parse(raw);
        setXhsCookie(cfg.xiaohongshu?.cookie || '');
        setDouyinCookie(cfg.douyin?.cookie || '');
        if (cfg.exportFormat) setExportFormat(cfg.exportFormat);
      }
    } catch {}
  }, []);

  const applyPreset = (p: Provider) => {
    setProvider(p);
    if (p !== 'custom') { setBaseUrl(PRESETS[p].baseUrl); setModel(PRESETS[p].model); }
  };

  const testConnection = async () => {
    setLoading(true); setTestResult(null);
    try {
      const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, baseUrl, model }) });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.success ? 'AI 回复: ' + data.reply : '错误: ' + data.error });
    } catch (err: any) { setTestResult({ success: false, message: '网络错误: ' + err.message }); }
    finally { setLoading(false); }
  };

  const saveConfig = async () => {
    setSaveMsg('');
    try {
      const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, baseUrl, model, provider, wechatAppId, wechatAppSecret: wechatSecret }) });
      const data = await res.json();
      setSaveMsg(data.success ? '✅ 配置已保存！重启开发服务器后生效' : '❌ 保存失败: ' + data.error);
      const platformCfg = { xiaohongshu: { cookie: xhsCookie, enabled: !!xhsCookie }, douyin: { cookie: douyinCookie, enabled: !!douyinCookie }, wechat: { appId: wechatAppId, appSecret: wechatSecret, enabled: !!wechatAppId }, exportFormat };
      localStorage.setItem('zhiying_platform_config', JSON.stringify(platformCfg));
    } catch (err: any) { setSaveMsg('保存失败: ' + err.message); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">⚙️ 系统设置</h1>
        <p className="text-slate-400">配置大模型 API、平台集成和导出设置</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-1">🧠 大模型 API 配置</h2>
        <p className="text-slate-500 text-sm mb-6">选择模型提供商并填入 API 密钥，点击「测试连接」验证</p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {(Object.keys(PRESETS) as Provider[]).map(p => (
            <button key={p} onClick={() => applyPreset(p)}
              className={'p-4 rounded-lg border text-left transition-all ' + (provider === p ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500')}>
              <div className="flex items-center gap-2 mb-1">
                <div className={'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ' + (provider === p ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300')}>{PRESETS[p].emoji}</div>
                <span className="text-white font-semibold text-sm">{PRESETS[p].name}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">{PRESETS[p].desc}</div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">API 密钥 *</label>
            <div className="flex gap-2">
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                placeholder={maskedKey || 'sk-...'} className="input flex-1" />
              <button onClick={() => setShowKey(!showKey)} className="btn-secondary text-sm">{showKey ? '隐藏' : '显示'}</button>
              <button onClick={testConnection} disabled={loading || !apiKey} className="btn-secondary disabled:opacity-50 whitespace-nowrap">
                {loading ? '🔄 测试中...' : '🔗 测试连接'}
              </button>
            </div>
            {maskedKey && <p className="text-xs text-slate-500 mt-1">当前已保存：{maskedKey}</p>}
            {provider !== 'custom' && PRESETS[provider].url && (
              <p className="text-xs text-blue-400 mt-1">获取密钥：<a href={PRESETS[provider].url} target="_blank" rel="noopener" className="underline">{PRESETS[provider].url}</a></p>
            )}
          </div>

          {testResult && (
            <div className={'p-3 rounded-lg text-sm ' + (testResult.success ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300')}>
              {testResult.success ? '✅ 连接成功！' : '❌ 连接失败'}{testResult.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">接口地址 (Base URL) *</label>
              <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="input" placeholder="https://api.example.com/v1" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">模型名称 *</label>
              <input type="text" value={model} onChange={e => setModel(e.target.value)} className="input" placeholder="模型名称" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-1">🔗 平台集成配置</h2>
        <p className="text-slate-500 text-sm mb-6">配置各社交平台的发布凭证，用于自动发布内容</p>
        <div className="space-y-6">
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div><h3 className="text-white font-medium">💬 微信公众号</h3><p className="text-xs text-slate-500">通过微信官方 API 直接发布文章草稿</p></div>
              <span className="badge badge-green">API 支持</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1">App ID</label><input type="text" value={wechatAppId} onChange={e => setWechatAppId(e.target.value)} className="input" placeholder="wx..." /></div>
              <div><label className="block text-xs text-slate-400 mb-1">App Secret</label><input type="password" value={wechatSecret} onChange={e => setWechatSecret(e.target.value)} className="input" placeholder="App Secret" /></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">在 <a href="https://mp.weixin.qq.com" target="_blank" rel="noopener" className="text-blue-400 underline">mp.weixin.qq.com</a> &gt; 开发 &gt; 基本配置 中获取</p>
          </div>
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div><h3 className="text-white font-medium">📕 小红书</h3><p className="text-xs text-slate-500">通过 RPA 浏览器自动化发布（或手动复制粘贴）</p></div>
              <span className="badge badge-yellow">RPA 模式</span>
            </div>
            <div><label className="block text-xs text-slate-400 mb-1">会话 Cookie（用于 RPA 自动发布）</label><input type="password" value={xhsCookie} onChange={e => setXhsCookie(e.target.value)} className="input" placeholder="从浏览器开发者工具中复制 Cookie" /></div>
            <div className="mt-3 p-3 bg-slate-800/50 rounded text-xs text-slate-400">
              <p className="text-white font-medium mb-1">如何获取 Cookie：</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>打开 xiaohongshu.com 并登录</li>
                <li>按 F12 &gt; Network 标签 &gt; 刷新页面</li>
                <li>点击任意请求 &gt; Request Headers &gt; 复制 Cookie 值</li>
              </ol>
            </div>
          </div>
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div><h3 className="text-white font-medium">🎵 抖音 / 千川</h3><p className="text-xs text-slate-500">通过 RPA 发布视频脚本和广告素材</p></div>
              <span className="badge badge-yellow">RPA 模式</span>
            </div>
            <div><label className="block text-xs text-slate-400 mb-1">会话 Cookie（用于 RPA 自动发布）</label><input type="password" value={douyinCookie} onChange={e => setDouyinCookie(e.target.value)} className="input" placeholder="从 qianchuan.jinritemai.com 复制 Cookie" /></div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-1">📦 内容导出格式</h2>
        <p className="text-slate-500 text-sm mb-4">选择默认的文件导出格式</p>
        <div className="flex gap-3">
          {(['markdown', 'html', 'json'] as const).map(fmt => (
            <button key={fmt} onClick={() => setExportFormat(fmt)}
              className={'px-4 py-2 rounded-lg text-sm font-medium transition-all ' + (exportFormat === fmt ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white')}>
              {fmt === 'markdown' ? '📄 Markdown (.md)' : fmt === 'html' ? '🌐 HTML (.html)' : '📦 JSON (.json)'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={saveConfig} className="btn-primary px-8">💾 保存所有设置</button>
        {saveMsg && <span className={'text-sm ' + (saveMsg.includes('✅') ? 'text-green-400' : 'text-red-400')}>{saveMsg}</span>}
      </div>
    </div>
  );
}
