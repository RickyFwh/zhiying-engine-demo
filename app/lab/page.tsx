'use client';
import { useState, useEffect } from 'react';
import { getClientConfig } from '@/lib/client-config';
import { saveContent } from '@/lib/storage';

interface LabResult {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  elapsed: number;
  finish_reason: string;
}

const QUICK_PROMPTS = [
  { label: '📕 小红书种草文案', prompt: '为烟酰胺焕亮精华液写一篇小红书种草笔记，口语化，多用emoji，包含成分分析和使用体验', system: '你是一位资深小红书内容运营专家，擅长为护肤品撰写种草文案。风格口语化、真诚、多用emoji，避免绝对化用语。' },
  { label: '🎵 抖音短视频脚本', prompt: '为肽能修护头皮精华写一个30秒抖音带货短视频脚本，包含hook、痛点、解决方案、CTA', system: '你是一位抖音短视频编导，擅长为日化产品制作带货脚本。前3秒必须有强力hook，节奏快，有明确CTA。' },
  { label: '💬 微信公众号推文', prompt: '为玻色因紧致面霜写一篇微信公众号科普推文，专业但通俗，重点讲玻色因的抗衰原理', system: '你是一位护肤品科普作者，擅长用通俗语言解释成分原理。文章要有深度但易读，适合微信公众号发布。' },
  { label: '🧠 投放策略分析', prompt: '分析以下投放数据：烟酰胺精华日消耗300元，ROI 2.8；头皮精华日消耗200元，ROI 1.9；玻色因面霜日消耗150元，ROI 2.1。给出预算优化建议。', system: '你是一位资深广告投放师，拥有10年效果广告经验。请基于数据给出专业的投放优化建议，包含具体的预算分配和人群策略。' },
  { label: '🔍 竞品分析', prompt: '分析竞品A的小红书投放策略：最近一周发了15条笔记，平均互动量500+，主要卖点是"医美级护肤"，价格带199-299元。我们该如何差异化竞争？', system: '你是一位市场竞品分析专家，擅长从公开数据中提炼竞争策略。请给出具体可执行的差异化方案。' },
  { label: '📝 自由输入', prompt: '', system: '' },
];

export default function LabPage() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [prompt, setPrompt] = useState(QUICK_PROMPTS[0].prompt);
  const [systemPrompt, setSystemPrompt] = useState(QUICK_PROMPTS[0].system);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LabResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ prompt: string; time: string; tokens: number }[]>([]);

  const selectPreset = (idx: number) => {
    setSelectedPreset(idx);
    setPrompt(QUICK_PROMPTS[idx].prompt);
    setSystemPrompt(QUICK_PROMPTS[idx].system);
  };

  const runTest = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const res = await fetch('/api/lab', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt, temperature, maxTokens, clientConfig: getClientConfig() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setHistory(prev => [{ prompt: prompt.slice(0, 50), time: new Date().toLocaleTimeString('zh-CN'), tokens: data.usage?.total_tokens || 0 }, ...prev].slice(0, 20));
        // 测试成功后自动保存到历史记录
        if (data._saveInfo) {
          saveContent(data._saveInfo);
        }
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) { setError('Network error: ' + err.message); }
    finally { setLoading(false); }
  };

  const copyResult = () => {
    if (result?.content) navigator.clipboard.writeText(result.content);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">🧪 真实测试面板</h1>
        <p className="text-slate-400">直接调用真实大模型 API，测试内容生成和策略分析效果</p>
        <p className="text-xs text-yellow-400 mt-1">⚠️ 所有调用均使用真实 API，会产生 Token 消耗费用</p>
      </div>

      {/* Quick prompts */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🎯 快速测试模板</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {QUICK_PROMPTS.map((qp, i) => (
            <button key={i} onClick={() => selectPreset(i)}
              className={'p-3 rounded-lg border text-left transition-all text-sm ' + (selectedPreset === i ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500')}>
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">📝 测试输入</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">系统提示词（角色设定）</label>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="input w-full" rows={2} placeholder="例如：你是一位资深投放师..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">用户提示词（测试问题）</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="input w-full" rows={4} placeholder="输入你想让 AI 回答的内容..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">温度 (Temperature): {temperature}</label>
              <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs text-slate-500"><span>精确 0</span><span>创意 2</span></div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">最大 Token 数</label>
              <input type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} className="input" min={100} max={8000} step={100} />
            </div>
            <div className="flex items-end">
              <button onClick={runTest} disabled={loading || !prompt.trim()}
                className="btn-primary w-full disabled:opacity-50 py-3">
                {loading ? '⏳ AI 生成中...' : '🚀 发送真实请求'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      {error && (
        <div className="card p-6 border-red-500/30">
          <div className="text-red-400 text-sm">❌ {error}</div>
        </div>
      )}

      {result && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">📄 生成结果</h2>
            <button onClick={copyResult} className="btn-secondary text-sm">📋 复制结果</button>
          </div>

          <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--slate-700)', borderRadius: '0.5rem', padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--slate-200)', fontSize: '0.875rem', lineHeight: '1.7', fontFamily: 'inherit' }}>{result.content}</pre>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-5 gap-3 mt-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{result.model}</div>
              <div className="text-xs text-slate-400">模型</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-400">{result.elapsed}ms</div>
              <div className="text-xs text-slate-400">响应时间</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-400">{result.usage?.prompt_tokens || 0}</div>
              <div className="text-xs text-slate-400">输入 Token</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">{result.usage?.completion_tokens || 0}</div>
              <div className="text-xs text-slate-400">输出 Token</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{result.finish_reason}</div>
              <div className="text-xs text-slate-400">结束原因</div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📜 测试历史</h2>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="flex-1">
                  <span className="text-xs text-slate-500 mr-3">{h.time}</span>
                  <span className="text-sm text-slate-300">{h.prompt}{h.prompt.length >= 50 ? '...' : ''}</span>
                </div>
                <span className="text-xs text-blue-400 ml-4">{h.tokens} tokens</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
