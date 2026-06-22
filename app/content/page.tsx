'use client';
import { useState } from 'react';
import { getClientConfig } from '@/lib/client-config';
import { saveContent, type StoredContentItem } from '@/lib/storage';

export default function ContentPage() {
  const [productId, setProductId] = useState('p1');
  const [platform, setPlatform] = useState<'xiaohongshu' | 'douyin' | 'wechat'>('xiaohongshu');
  const [contentType, setContentType] = useState<'text' | 'video_script' | 'image_prompt'>('text');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');

  const productNames: Record<string, string> = { p1: '烟酰胺精华', p2: '头皮精华', p3: '玻色因面霜' };
  const platformNames: Record<string, string> = { xiaohongshu: '小红书', douyin: '抖音', wechat: '微信' };
  const contentTypeLabels: Record<string, string> = { text: '种草文案', video_script: '视频脚本', image_prompt: '图片提示词' };

  const generateContent = async () => {
    setLoading(true); setResult(''); setExportMsg(''); setPublishMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, platform, contentType, extraInstructions, clientConfig: getClientConfig() }),
      });
      const data = await res.json();
      if (data.content) {
        setResult(data.content);
        // 自动保存到历史记录
        saveContent({
          id: data.id,
          content: data.content,
          product: data.product,
          platform: data.platform,
          contentType: data.contentType,
          createdAt: data.createdAt,
          source: 'content',
          wordCount: data.wordCount || data.content.length,
        });
      } else {
        setResult(data.error || '生成失败');
      }
    } catch (err: any) { setResult('生成失败: ' + err.message); }
    finally { setLoading(false); }
  };

  const copyToClipboard = (target: string) => {
    navigator.clipboard.writeText(result);
    setCopied(target); setTimeout(() => setCopied(''), 2000);
  };

  const exportFile = async (format: 'markdown' | 'html' | 'json') => {
    setExportMsg('');
    try {
      const res = await fetch('/api/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result, format, platform, title: productNames[productId] + '_' + platformNames[platform] + '_' + contentType }),
      });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = data.filename || 'content.' + format;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportMsg('已下载: ' + data.filename);
      } else { setExportMsg('导出失败: ' + data.error); }
    } catch (err: any) { setExportMsg('导出错误: ' + err.message); }
  };

  const publishToWechat = async () => {
    setPublishing(true); setPublishMsg('');
    try {
      const htmlContent = result
        .replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*)$/gm, '<li>$1</li>').replace(/---/g, '<hr>')
        .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
      const wrapped = '<section style="font-size:16px;line-height:1.8;color:#333;"><p>' + htmlContent + '</p></section>';
      const res = await fetch('/api/wechat-publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: productNames[productId] + ' - ' + platformNames[platform] + ' 文案', content: wrapped, author: '智营引擎AI' }),
      });
      const data = await res.json();
      setPublishMsg(data.success ? '微信草稿已上传! media_id: ' + data.mediaId : '发布失败: ' + data.error);
    } catch (err: any) { setPublishMsg('发布错误: ' + err.message); }
    finally { setPublishing(false); }
  };

  const exportForXiaohongshu = () => {
    const plain = result.replace(/^#+\s*/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/---/g, '').replace(/^- /gm, '• ');
    navigator.clipboard.writeText(plain); setCopied('xiaohongshu');
    setExportMsg('已复制纯文本，请粘贴到 creator.xiaohongshu.com'); setTimeout(() => setCopied(''), 2000);
  };

  const exportForDouyin = () => {
    navigator.clipboard.writeText(result); setCopied('douyin');
    setExportMsg('已复制脚本，请粘贴到千川广告平台或视频编辑工具'); setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">✍️ 内容生成器</h1>
        <p className="text-slate-400">AI 驱动的多渠道营销内容自动生成</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">内容配置</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">产品</label>
            <select value={productId} onChange={e => setProductId(e.target.value)} className="input">
              <option value="p1">烟酰胺焕亮精华液</option>
              <option value="p2">肽能修护头皮精华</option>
              <option value="p3">玻色因紧致面霜</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">投放平台</label>
            <select value={platform} onChange={e => setPlatform(e.target.value as any)} className="input">
              <option value="xiaohongshu">📕 小红书</option>
              <option value="douyin">🎵 抖音</option>
              <option value="wechat">💬 微信公众号</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">内容类型</label>
            <select value={contentType} onChange={e => setContentType(e.target.value as any)} className="input">
              <option value="text">📝 种草文案</option>
              <option value="video_script">🎬 视频脚本</option>
              <option value="image_prompt">🎨 图片提示词</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={generateContent} disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? '⏳ AI 生成中...' : '✨ 生成内容'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">额外要求（可选）</label>
          <input type="text" value={extraInstructions} onChange={e => setExtraInstructions(e.target.value)}
            placeholder="例如：强调敏感肌友好、语气更活泼、加入价格促销信息..." className="input w-full" />
        </div>
      </div>

      {result && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              生成结果 <span className="badge badge-green">AI 已生成</span>
            </h2>
            <button onClick={() => copyToClipboard('raw')} className="btn-secondary text-sm">
              {copied === 'raw' ? '✅ 已复制!' : '📋 复制全文'}
            </button>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--slate-700)', borderRadius: '0.5rem', padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--slate-200)', fontSize: '0.875rem', lineHeight: '1.7', fontFamily: 'inherit' }}>{result}</pre>
          </div>
          <div className="flex items-center gap-4 text-sm mt-4">
            <span className="badge badge-blue">产品：{productNames[productId]}</span>
            <span className="badge badge-purple">平台：{platformNames[platform]}</span>
            <span className="badge badge-green">类型：{contentTypeLabels[contentType]}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--slate-700)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
            <h3 className="text-sm font-semibold text-white mb-3">📤 导出与发布</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button onClick={exportForXiaohongshu}
                className={'p-3 rounded-lg border text-left transition-all ' + (copied === 'xiaohongshu' ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500')}>
                <div className="text-sm text-white font-medium">📕 小红书</div>
                <div className="text-xs text-slate-400 mt-1">{copied === 'xiaohongshu' ? '✅ 已复制!' : '复制纯文本到创作者中心'}</div>
              </button>
              <button onClick={exportForDouyin}
                className={'p-3 rounded-lg border text-left transition-all ' + (copied === 'douyin' ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500')}>
                <div className="text-sm text-white font-medium">🎵 抖音</div>
                <div className="text-xs text-slate-400 mt-1">{copied === 'douyin' ? '✅ 已复制!' : '复制脚本到千川平台'}</div>
              </button>
              <button onClick={publishToWechat} disabled={publishing}
                className={'p-3 rounded-lg border text-left transition-all disabled:opacity-50 ' + (publishMsg.includes('已上传') ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500')}>
                <div className="text-sm text-white font-medium">💬 微信公众号</div>
                <div className="text-xs text-slate-400 mt-1">{publishing ? '发布中...' : publishMsg || '上传草稿（需配置AppID）'}</div>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-slate-400">下载文件：</span>
              <button onClick={() => exportFile('markdown')} className="btn-secondary text-xs">📄 Markdown</button>
              <button onClick={() => exportFile('html')} className="btn-secondary text-xs">🌐 HTML</button>
              <button onClick={() => exportFile('json')} className="btn-secondary text-xs">📦 JSON</button>
            </div>
            {exportMsg && <div className="text-xs text-green-400 mt-2">{exportMsg}</div>}
            {publishMsg && <div className={'text-xs mt-2 ' + (publishMsg.includes('已上传') ? 'text-green-400' : 'text-yellow-400')}>{publishMsg}</div>}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-white mb-3">💡 发布指南</h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <p className="text-white font-medium mb-1">📕 小红书</p>
            <p>1. 点击上方「复制纯文本」按钮</p>
            <p>2. 打开 creator.xiaohongshu.com</p>
            <p>3. 粘贴到编辑器，添加配图</p>
            <p>4. 或在「设置」中配置 RPA Cookie 自动发布</p>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <p className="text-white font-medium mb-1">🎵 抖音</p>
            <p>1. 复制脚本或下载 Markdown 文件</p>
            <p>2. 按脚本拍摄制作短视频</p>
            <p>3. 上传到千川广告平台</p>
            <p>4. 或在「设置」中配置 RPA Cookie 自动发布</p>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <p className="text-white font-medium mb-1">💬 微信公众号</p>
            <p>1. 在「设置」页配置 AppID 和 Secret</p>
            <p>2. 点击「微信公众号」按钮上传草稿</p>
            <p>3. 登录 mp.weixin.qq.com 预览</p>
            <p>4. 在公众号后台确认发布</p>
          </div>
        </div>
      </div>
    </div>
  );
}
