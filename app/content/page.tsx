'use client';
import { useState, useEffect } from 'react';
import { getClientConfig } from '@/lib/client-config';
import { getImageConfig, getVideoConfig, type MediaConfig } from '@/lib/media-config';
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

  // 图片/视频开关状态
  const [imageEnabled, setImageEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [imageConfig, setImageConfig] = useState<MediaConfig | null>(null);
  const [videoConfig, setVideoConfig] = useState<MediaConfig | null>(null);

  // 图片/视频生成结果
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<{ imageUrl: string; prompt: string; model: string } | null>(null);
  const [imageError, setImageError] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoResult, setVideoResult] = useState<{ videoUrl: string; script: string; model: string } | null>(null);
  const [videoError, setVideoError] = useState('');

  const productNames: Record<string, string> = { p1: '烟酰胺精华', p2: '头皮精华', p3: '玻色因面霜' };
  const platformNames: Record<string, string> = { xiaohongshu: '小红书', douyin: '抖音', wechat: '微信' };
  const contentTypeLabels: Record<string, string> = { text: '种草文案', video_script: '视频脚本', image_prompt: '图片提示词' };

  // 加载开关状态和配置
  useEffect(() => {
    const imgToggle = localStorage.getItem('zhiying_image_toggle');
    const vidToggle = localStorage.getItem('zhiying_video_toggle');
    if (imgToggle === 'true') setImageEnabled(true);
    if (vidToggle === 'true') setVideoEnabled(true);
    setImageConfig(getImageConfig());
    setVideoConfig(getVideoConfig());
  }, []);

  const handleImageToggle = (val: boolean) => {
    setImageEnabled(val);
    localStorage.setItem('zhiying_image_toggle', val ? 'true' : 'false');
    if (val) setImageConfig(getImageConfig()); // 重新读取配置
  };

  const handleVideoToggle = (val: boolean) => {
    setVideoEnabled(val);
    localStorage.setItem('zhiying_video_toggle', val ? 'true' : 'false');
    if (val) setVideoConfig(getVideoConfig()); // 重新读取配置
  };

  // 生成图片提示词
  const generateImagePrompt = (content: string): string => {
    // 从生成的文案中提取关键信息生成图片提示词
    const productName = productNames[productId];
    const platformName = platformNames[platform];
    return `为${productName}产品生成一张适合${platformName}平台的营销图片。风格：高端、精致、自然。画面：产品居中展示，背景为清新的自然植物元素，光线柔和明亮，色调以白色、绿色为主。产品包装清晰可见，整体氛围传达天然、科技、有效的品牌理念。高质量商业摄影风格，4K分辨率。`;
  };

  // 生成视频脚本摘要
  const generateVideoScript = (content: string): string => {
    const productName = productNames[productId];
    return `【视频脚本 - ${productName}】\n\n` +
      `场景1（0-3秒）：产品特写，柔光照射，品牌logo淡入\n` +
      `场景2（3-8秒）：模特使用产品的近景镜头，展示质地和使用方法\n` +
      `场景3（8-15秒）：效果对比或使用前后变化\n` +
      `场景4（15-20秒）：模特满意微笑，产品展示+购买引导\n\n` +
      `配音旁白：基于生成的文案内容进行语音转换\n` +
      `背景音乐：轻快、时尚风格的纯音乐\n` +
      `时长：20秒\n` +
      `分辨率：1080x1920（竖屏）`;
  };

  const generateContent = async () => {
    setLoading(true); setResult(''); setExportMsg(''); setPublishMsg('');
    setImageResult(null); setImageError('');
    setVideoResult(null); setVideoError('');
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

        // 如果图片开关开启，同时生成图片
        if (imageEnabled) {
          generateImage(data.content);
        }
        // 如果视频开关开启，同时生成视频
        if (videoEnabled) {
          generateVideo(data.content);
        }
      } else {
        setResult(data.error || '生成失败');
      }
    } catch (err: any) { setResult('生成失败: ' + err.message); }
    finally { setLoading(false); }
  };

  // 单独触发图片生成
  const generateImage = async (content?: string) => {
    const freshConfig = getImageConfig();
    setImageConfig(freshConfig);
    if (!freshConfig || !freshConfig.apiKey) {
      setImageError('请先在设置页配置图片生成 API');
      return;
    }
    setImageLoading(true);
    setImageError('');
    setImageResult(null);
    try {
      const textContent = content || result;
      const imgPrompt = generateImagePrompt(textContent);
      const res = await fetch('/api/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgPrompt,
          productInfo: { name: productNames[productId] },
          platform,
          mediaConfig: freshConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImageResult({ imageUrl: data.imageUrl, prompt: data.prompt, model: data.model });
      } else {
        setImageError(data.error || '图片生成失败');
      }
    } catch (err: any) {
      setImageError('图片生成错误: ' + err.message);
    }
    setImageLoading(false);
  };

  // 单独触发视频生成
  const generateVideo = async (content?: string) => {
    const freshConfig = getVideoConfig();
    setVideoConfig(freshConfig);
    if (!freshConfig || !freshConfig.apiKey) {
      setVideoError('请先在设置页配置视频生成 API');
      return;
    }
    setVideoLoading(true);
    setVideoError('');
    setVideoResult(null);
    try {
      const textContent = content || result;
      const vidScript = generateVideoScript(textContent);
      const res = await fetch('/api/video-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: vidScript,
          productInfo: { name: productNames[productId] },
          platform,
          mediaConfig: freshConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoResult({ videoUrl: data.videoUrl, script: data.script, model: data.model });
      } else {
        setVideoError(data.error || '视频生成失败');
      }
    } catch (err: any) {
      setVideoError('视频生成错误: ' + err.message);
    }
    setVideoLoading(false);
  };

  const copyToClipboard = (target: string, text?: string) => {
    navigator.clipboard.writeText(text || result);
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

  // Toggle 开关组件
  const ToggleSwitch = ({ enabled, onToggle, label, icon }: { enabled: boolean; onToggle: (v: boolean) => void; label: string; icon: string }) => (
    <div
      onClick={() => onToggle(!enabled)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        padding: '8px 14px', borderRadius: 8,
        background: enabled ? '#6c5ce722' : '#111',
        border: enabled ? '1px solid #6c5ce7' : '1px solid #333',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color: enabled ? '#a29bfe' : '#888', fontSize: 14, fontWeight: 500 }}>{label}</span>
      <div style={{
        width: 40, height: 22, borderRadius: 11,
        background: enabled ? '#6c5ce7' : '#444',
        position: 'relative', transition: 'all 0.2s',
        marginLeft: 'auto',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 9,
          background: '#fff',
          position: 'absolute', top: 2,
          left: enabled ? 20 : 2,
          transition: 'all 0.2s',
        }} />
      </div>
    </div>
  );

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

        {/* 图片/视频生成开关 */}
        <div style={{ marginBottom: 16 }}>
          <label className="block text-sm text-slate-400 mb-2">附加媒体生成</label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ToggleSwitch
              enabled={imageEnabled}
              onToggle={handleImageToggle}
              label="同时生成图片"
              icon="🎨"
            />
            <ToggleSwitch
              enabled={videoEnabled}
              onToggle={handleVideoToggle}
              label="同时生成视频"
              icon="🎬"
            />
          </div>
          {/* 警告提示 */}
          {imageEnabled && !imageConfig && (
            <div style={{
              marginTop: 8, padding: '8px 14px', borderRadius: 8,
              background: '#f39c1222', color: '#f39c12', fontSize: 13,
              border: '1px solid #f39c1244',
            }}>
              ⚠️ 图片生成已开启，但尚未配置 API。请在「设置」页面配置图片生成 API。
            </div>
          )}
          {videoEnabled && !videoConfig && (
            <div style={{
              marginTop: 8, padding: '8px 14px', borderRadius: 8,
              background: '#f39c1222', color: '#f39c12', fontSize: 13,
              border: '1px solid #f39c1244',
            }}>
              ⚠️ 视频生成已开启，但尚未配置 API。请在「设置」页面配置视频生成 API。
            </div>
          )}
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
              📝 文案结果 <span className="badge badge-green">AI 已生成</span>
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

      {/* ========== 图片生成结果区 ========== */}
      {(imageEnabled || imageResult || imageLoading || imageError) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🎨 图片生成 <span className="badge badge-blue">{imageConfig ? imageConfig.provider : '未配置'}</span>
            </h2>
            {result && imageEnabled && !imageLoading && (
              <button onClick={() => generateImage()} className="btn-secondary text-sm">
                🔄 重新生成图片
              </button>
            )}
          </div>

          {imageLoading && (
            <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <p>正在调用图片生成 API...</p>
            </div>
          )}

          {imageError && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: '#ff6b6b22', color: '#ff6b6b', fontSize: 14 }}>
              ❌ {imageError}
            </div>
          )}

          {imageResult && (
            <div>
              {imageResult.imageUrl && imageResult.imageUrl.startsWith('http') && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={imageResult.imageUrl}
                    alt="生成的产品图片"
                    style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #333' }}
                  />
                </div>
              )}
              {imageResult.imageUrl && imageResult.imageUrl.startsWith('data:') && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={imageResult.imageUrl}
                    alt="生成的产品图片"
                    style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #333' }}
                  />
                </div>
              )}
              {imageResult.imageUrl && !imageResult.imageUrl.startsWith('http') && !imageResult.imageUrl.startsWith('data:') && (
                <div style={{ padding: '12px 16px', borderRadius: 8, background: '#00b89422', color: '#00b894', fontSize: 14, marginBottom: 12 }}>
                  ℹ️ {imageResult.imageUrl}
                </div>
              )}
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(30,41,59,0.5)', border: '1px solid var(--slate-700)' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>图片提示词（Prompt）：</div>
                <pre style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', margin: 0 }}>
                  {imageResult.prompt}
                </pre>
                <button
                  onClick={() => copyToClipboard('imagePrompt', imageResult.prompt)}
                  style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: '1px solid #444', background: '#222', color: '#aaa', cursor: 'pointer', fontSize: 12 }}
                >
                  {copied === 'imagePrompt' ? '✅ 已复制' : '📋 复制提示词'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                模型: {imageResult.model}
              </div>
            </div>
          )}

          {!imageLoading && !imageResult && !imageError && imageEnabled && (
            <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
              生成文案后将自动调用图片 API 生成配图
            </div>
          )}
        </div>
      )}

      {/* ========== 视频生成结果区 ========== */}
      {(videoEnabled || videoResult || videoLoading || videoError) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🎬 视频生成 <span className="badge badge-purple">{videoConfig ? videoConfig.provider : '未配置'}</span>
            </h2>
            {result && videoEnabled && !videoLoading && (
              <button onClick={() => generateVideo()} className="btn-secondary text-sm">
                🔄 重新生成视频
              </button>
            )}
          </div>

          {videoLoading && (
            <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <p>正在调用视频生成 API...</p>
            </div>
          )}

          {videoError && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: '#ff6b6b22', color: '#ff6b6b', fontSize: 14 }}>
              ❌ {videoError}
            </div>
          )}

          {videoResult && (
            <div>
              {videoResult.videoUrl && videoResult.videoUrl.startsWith('http') && (
                <div style={{ marginBottom: 12 }}>
                  <video
                    src={videoResult.videoUrl}
                    controls
                    style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #333' }}
                  />
                </div>
              )}
              {videoResult.videoUrl && !videoResult.videoUrl.startsWith('http') && (
                <div style={{ padding: '12px 16px', borderRadius: 8, background: '#00b89422', color: '#00b894', fontSize: 14, marginBottom: 12 }}>
                  ℹ️ {videoResult.videoUrl}
                </div>
              )}
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(30,41,59,0.5)', border: '1px solid var(--slate-700)' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>视频脚本：</div>
                <pre style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', margin: 0 }}>
                  {videoResult.script}
                </pre>
                <button
                  onClick={() => copyToClipboard('videoScript', videoResult.script)}
                  style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: '1px solid #444', background: '#222', color: '#aaa', cursor: 'pointer', fontSize: 12 }}
                >
                  {copied === 'videoScript' ? '✅ 已复制' : '📋 复制脚本'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                模型: {videoResult.model}
              </div>
            </div>
          )}

          {!videoLoading && !videoResult && !videoError && videoEnabled && (
            <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
              生成文案后将自动调用视频 API 生成短视频
            </div>
          )}
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
