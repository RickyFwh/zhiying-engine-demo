'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getClientConfig } from '@/lib/client-config';
import { getImageConfig, getVideoConfig, type MediaConfig } from '@/lib/media-config';
import { saveContent, type StoredContentItem } from '@/lib/storage';
import { saveMedia } from '@/lib/media-storage';

// Toast type definition
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  type: ToastType;
  message: string;
  timestamp: number;
  exiting?: boolean;
}

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

  // Toast 状态
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Refs for auto-scroll
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);

  // Toast functions
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newToast: Toast = { id, type, message, timestamp: Date.now() };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after 3 seconds with exit animation
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

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

  // Toast 触发: 图片结果变化
  useEffect(() => {
    if (imageResult) {
      addToast('success', '🎨 图片生成完成！');
    }
  }, [imageResult, addToast]);

  useEffect(() => {
    if (imageError) {
      addToast('error', '❌ 图片生成失败');
    }
  }, [imageError, addToast]);

  // Toast 触发: 视频结果变化
  useEffect(() => {
    if (videoResult) {
      addToast('success', '🎬 视频生成完成！');
    }
  }, [videoResult, addToast]);

  useEffect(() => {
    if (videoError) {
      addToast('error', '❌ 视频生成失败');
    }
  }, [videoError, addToast]);

  // Auto-scroll: 图片区域
  useEffect(() => {
    if ((imageLoading || imageResult) && imageSectionRef.current) {
      setTimeout(() => {
        imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [imageLoading, imageResult]);

  // Auto-scroll: 视频区域
  useEffect(() => {
    if ((videoLoading || videoResult) && videoSectionRef.current) {
      setTimeout(() => {
        videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [videoLoading, videoResult]);

  // 进度计算
  const getProgress = () => {
    if (!result) return 0;
    let progress = 33; // 文案完成
    if (imageEnabled) {
      if (imageResult) progress += 33; // 图片完成
    } else {
      // 如果图片未启用，按比比例算
      if (!videoEnabled) return 100; // 只有文案，直接100%
    }
    if (videoEnabled) {
      if (videoResult) progress = imageEnabled ? 100 : 66; // 视频完成
    } else {
      if (imageEnabled && imageResult) progress = 100; // 图片完成且无视频
      else if (!imageEnabled) progress = 100;
    }
    // 修正逻辑
    if (imageEnabled && !imageResult && !imageLoading) {
      // 图片启用但未生成（可能出错）
    }
    if (videoEnabled && !videoResult && !videoLoading) {
      // 视频启用但未生成（可能出错）
    }
    return Math.min(progress, 100);
  };

  // 简化进度计算
  const progressPercent = (() => {
    if (!result) return 0;
    const totalSteps = 1 + (imageEnabled ? 1 : 0) + (videoEnabled ? 1 : 0);
    let completedSteps = 1; // 文案已完成
    if (imageEnabled && imageResult) completedSteps++;
    if (videoEnabled && videoResult) completedSteps++;
    // 如果有error也算完成（不再等待）
    if (imageEnabled && imageError && !imageLoading) completedSteps++;
    if (videoEnabled && videoError && !videoLoading) completedSteps++;
    return Math.round((completedSteps / totalSteps) * 100);
  })();

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

  // 图片生成进度
  const [imageElapsed, setImageElapsed] = useState(0);

  // 单独触发图片生成
  const generateImage = async (content?: string) => {
    const freshConfig = getImageConfig();
    setImageConfig(freshConfig);
    setImageLoading(true);
    setImageError('');
    setImageResult(null);
    setImageElapsed(0);

    // 计时器：每3秒更新进度
    const timer = setInterval(() => {
      setImageElapsed(prev => prev + 3);
    }, 3000);

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
          clientConfig: getClientConfig(), // 传递 LLM 配置作为后备
        }),
      });
      const data = await res.json();
      clearInterval(timer);
      if (data.success) {
        setImageResult({ imageUrl: data.imageUrl, prompt: data.prompt, model: data.model });
        addToast('success', '🎨 图片生成完成！');
        // 保存到媒体中心
        saveMedia({
          id: `img-${Date.now()}`,
          type: 'image',
          url: data.imageUrl,
          prompt: data.prompt,
          product: productNames[productId],
          platform: platform,
          model: data.model,
          provider: freshConfig?.provider || 'dashscope',
          createdAt: new Date().toISOString(),
        });
      } else {
        setImageError(data.error || '图片生成失败');
        addToast('error', '❌ 图片生成失败: ' + (data.error || ''));
      }
    } catch (err: any) {
      clearInterval(timer);
      setImageError('图片生成错误: ' + err.message);
      addToast('error', '❌ 图片生成错误: ' + err.message);
    }
    setImageLoading(false);
  };

  // 单独触发视频生成
  const generateVideo = async (content?: string) => {
    const freshConfig = getVideoConfig();
    setVideoConfig(freshConfig);
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
          clientConfig: getClientConfig(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoResult({ videoUrl: data.videoUrl, script: data.script, model: data.model });
        addToast('success', '🎬 视频生成完成！');
        // 保存到媒体中心
        saveMedia({
          id: `vid-${Date.now()}`,
          type: 'video',
          url: data.videoUrl,
          prompt: data.script,
          product: productNames[productId],
          platform: platform,
          model: data.model,
          provider: freshConfig?.provider || 'unknown',
          createdAt: new Date().toISOString(),
        });
      } else {
        setVideoError(data.error || '视频生成失败');
        addToast('error', '❌ 视频生成失败: ' + (data.error || ''));
      }
    } catch (err: any) {
      setVideoError('视频生成错误: ' + err.message);
      addToast('error', '❌ 视频生成错误: ' + err.message);
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

  // Toast 容器组件
  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}${toast.exiting ? ' toast-exit' : ''}`}
          onClick={() => removeToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Toast 通知容器 */}
      <ToastContainer />

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
          {/* 状态提示 */}
          {imageEnabled && !imageConfig && (
            <div style={{
              marginTop: 8, padding: '8px 14px', borderRadius: 8,
              background: '#00b89422', color: '#00b894', fontSize: 13,
              border: '1px solid #00b89444',
            }}>
              ✅ 图片生成已开启，将使用 LLM 设置的 DashScope API Key 调用通义万相生成图片
            </div>
          )}
          {imageEnabled && imageConfig && (
            <div style={{
              marginTop: 8, padding: '8px 14px', borderRadius: 8,
              background: '#6c5ce722', color: '#a29bfe', fontSize: 13,
              border: '1px solid #6c5ce744',
            }}>
              🎨 图片生成已开启，使用专用 API: {imageConfig.provider} ({imageConfig.model})
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
          {/* 进度指示器 */}
          {(imageEnabled || videoEnabled) && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">生成进度</span>
                <span className="text-xs font-medium" style={{ color: progressPercent === 100 ? '#4ade80' : '#60a5fa' }}>
                  {progressPercent}%
                </span>
              </div>
              <div className="content-progress-track">
                <div className="content-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span style={{ color: result ? '#4ade80' : '#64748b' }}>📝 文案</span>
                {imageEnabled && (
                  <span style={{ color: imageResult ? '#4ade80' : imageLoading ? '#60a5fa' : '#64748b' }}>🎨 图片</span>
                )}
                {videoEnabled && (
                  <span style={{ color: videoResult ? '#4ade80' : videoLoading ? '#60a5fa' : '#64748b' }}>🎬 视频</span>
                )}
              </div>
            </div>
          )}

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

          {/* 生成状态条 - 图片 */}
          {imageEnabled && (
            <div className={`gen-status-bar ${imageResult ? 'gen-status-done' : imageLoading ? 'gen-status-loading' : imageError ? 'gen-status-error' : 'gen-status-loading'}`}>
              {imageLoading && (
                <>
                  <span className="loading-dots">
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                  </span>
                  <span>🎨 图片正在生成中...</span>
                </>
              )}
              {imageResult && (
                <>
                  <span>✅ 图片已生成</span>
                  <a href="#image-section" onClick={(e) => { e.preventDefault(); imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                    ↓ 查看图片
                  </a>
                </>
              )}
              {imageError && !imageLoading && (
                <span>❌ 图片生成失败: {imageError}</span>
              )}
              {!imageLoading && !imageResult && !imageError && (
                <span>🎨 等待图片生成...</span>
              )}
            </div>
          )}

          {/* 生成状态条 - 视频 */}
          {videoEnabled && (
            <div className={`gen-status-bar ${videoResult ? 'gen-status-done' : videoLoading ? 'gen-status-loading' : videoError ? 'gen-status-error' : 'gen-status-loading'}`}>
              {videoLoading && (
                <>
                  <span className="loading-dots">
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                  </span>
                  <span>🎬 视频正在生成中...</span>
                </>
              )}
              {videoResult && (
                <>
                  <span>✅ 视频已生成</span>
                  <a href="#video-section" onClick={(e) => { e.preventDefault(); videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                    ↓ 查看视频
                  </a>
                </>
              )}
              {videoError && !videoLoading && (
                <span>❌ 视频生成失败: {videoError}</span>
              )}
              {!videoLoading && !videoResult && !videoError && (
                <span>🎬 等待视频生成...</span>
              )}
            </div>
          )}

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
        <div id="image-section" ref={imageSectionRef} className={`card p-6 ${imageLoading ? 'media-pulse' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🎨 图片生成 <span className="badge badge-blue">{imageConfig ? imageConfig.provider : '通义万相 (DashScope)'}</span>
            </h2>
            {result && imageEnabled && !imageLoading && (
              <button onClick={() => generateImage()} className="btn-secondary text-sm">
                🔄 重新生成图片
              </button>
            )}
          </div>

          {imageLoading && (
            <div className="media-pulse" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, border: '3px solid #333', borderTopColor: '#6c5ce7',
                  borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
                <span style={{ color: '#a29bfe', fontSize: 16, fontWeight: 600 }}>
                  通义万相正在生成图片...
                </span>
              </div>
              <div style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>
                已耗时 <span style={{ color: '#f39c12', fontWeight: 600 }}>{imageElapsed}s</span>
                {' '}· 通常需要 15-60 秒
              </div>
              <div style={{
                width: '100%', height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(imageElapsed / 60 * 100, 95)}%`,
                  background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                {imageElapsed < 5 ? '📤 提交生成任务...' :
                 imageElapsed < 15 ? '🎨 AI 正在绘制图片...' :
                 imageElapsed < 30 ? '✨ 精细化渲染中...' :
                 imageElapsed < 60 ? '⏳ 即将完成，请耐心等待...' :
                 '⚠️ 生成时间较长，请稍候...'}
              </div>
            </div>
          )}

          {imageError && (
            <div style={{ padding: '16px', borderRadius: 8, background: '#ff6b6b15', border: '1px solid #ff6b6b44' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>❌</span>
                <span style={{ color: '#ff6b6b', fontSize: 14, fontWeight: 600 }}>图片生成失败</span>
              </div>
              <div style={{ color: '#ff8888', fontSize: 13, marginLeft: 28 }}>{imageError}</div>
              <div style={{ marginLeft: 28, marginTop: 12 }}>
                <button onClick={() => generateImage()} className="btn-secondary text-xs" style={{ marginRight: 8 }}>
                  🔄 重试
                </button>
                <span style={{ color: '#666', fontSize: 12 }}>
                  提示：如使用 DashScope，请确保 API Key 已开通通义万相权限
                </span>
              </div>
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
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎨</div>
              <div>生成文案后将自动调用通义万相生成配图</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                使用 LLM 设置的 API Key（DashScope），无需单独配置图片 API
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 视频生成结果区 ========== */}
      {(videoEnabled || videoResult || videoLoading || videoError) && (
        <div id="video-section" ref={videoSectionRef} className={`card p-6 ${videoLoading ? 'media-pulse' : ''}`}>
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
