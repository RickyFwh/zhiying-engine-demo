'use client';
import { useState, useRef } from 'react';

interface StepResult {
  content: string;
  elapsed: number;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

const PRODUCTS_TEXT = `1. 烟酰胺焕亮精华液 | 功效护肤 | ¥199 | 毛利率77%
   卖点：5%高浓度烟酰胺、熊果苷协同美白、敏感肌友好、28天见效
   目标人群：25-35岁女性，关注美白功效

2. 肽能修护头皮精华 | 头皮护理 | ¥168 | 毛利率77%
   卖点：生物活性肽技术、修护毛囊微环境、7天控油、无硅油
   目标人群：28-40岁，头皮敏感/出油/脱发人群

3. 玻色因紧致面霜 | 抗衰护肤 | ¥258 | 毛利率79%
   卖点：30%高浓度玻色因、依克多因细胞修护、4周淡纹
   目标人群：30-45岁女性，追求抗衰效果`;

const STEPS = [
  { id: 'strategy', label: '策略生成', icon: '🎯', desc: '制定投放策略、预算分配、内容方向' },
  { id: 'competitor', label: '竞品分析', icon: '🔍', desc: '分析竞品投放动作，找到差异化方向' },
  { id: 'content', label: '素材生成', icon: '✍️', desc: '基于策略+竞品洞察，生成差异化内容' },
  { id: 'review', label: '审核发布', icon: '✅', desc: '内容质检、评分、投放建议' },
];

export default function PipelinePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [goal, setGoal] = useState('acquisition');
  const [budget, setBudget] = useState(500);
  const [targetROI, setTargetROI] = useState(2.0);
  const [platform, setPlatform] = useState('xiaohongshu');
  const [contentType, setContentType] = useState('text');
  const [competitors, setCompetitors] = useState('薛尼多尔、威诺娜、HBN、珀莱雅');
  const [productsText, setProductsText] = useState(PRODUCTS_TEXT);

  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [runningAll, setRunningAll] = useState(false);

  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const callStep = async (step: string, extraBody: Record<string, any> = {}) => {
    setLoading(true);
    setError('');
    try {
      const body: any = {
        step,
        products: productsText,
        goal,
        budget,
        targetROI,
        platform,
        contentType,
        competitors,
        ...extraBody,
      };

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResults(prev => ({
        ...prev,
        [step]: {
          content: data.content,
          elapsed: data.elapsed,
          usage: data.usage,
          model: data.model,
        },
      }));
      return data.content;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const runStep = async (stepIdx: number) => {
    const step = STEPS[stepIdx];
    const extra: Record<string, any> = {};

    if (stepIdx >= 1 && results.strategy) extra.strategy = results.strategy.content;
    if (stepIdx >= 2 && results.competitor) extra.competitorAnalysis = results.competitor.content;
    if (stepIdx >= 3 && results.content) extra.content = results.content.content;

    try {
      await callStep(step.id, extra);
      setCurrentStep(stepIdx + 1);
    } catch {}
  };

  const runAll = async () => {
    setRunningAll(true);
    setError('');
    setLoading(true);
    try {
      // Step 1: Strategy
      const s1 = await callStepDirect('strategy', { products: productsText, goal, budget, targetROI });
      setResults(prev => ({ ...prev, strategy: s1 }));
      setCurrentStep(1);

      // Step 2: Competitor
      const s2 = await callStepDirect('competitor', { competitors, strategy: s1.content });
      setResults(prev => ({ ...prev, competitor: s2 }));
      setCurrentStep(2);

      // Step 3: Content
      const s3 = await callStepDirect('content', { platform, contentType, strategy: s1.content, competitorAnalysis: s2.content });
      setResults(prev => ({ ...prev, content: s3 }));
      setCurrentStep(3);

      // Step 4: Review
      const s4 = await callStepDirect('review', { strategy: s1.content, competitorAnalysis: s2.content, content: s3.content });
      setResults(prev => ({ ...prev, review: s4 }));
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRunningAll(false);
    }
  };

  const callStepDirect = async (step: string, body: any): Promise<StepResult> => {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, ...body }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return { content: data.content, elapsed: data.elapsed, usage: data.usage, model: data.model };
  };

  const copyResult = (step: string) => {
    if (results[step]) navigator.clipboard.writeText(results[step].content);
  };

  const reset = () => {
    setResults({});
    setCurrentStep(0);
    setError('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🔗 全链路工作流</h1>
          <p className="text-slate-400">策略生成 → 竞品分析 → 素材生成 → 审核发布，一步接一步</p>
        </div>
        <div className="flex gap-3">
          <button onClick={reset} className="btn-secondary text-sm">🔄 重新开始</button>
          <button onClick={runAll} disabled={loading}
            className="btn-primary disabled:opacity-50">
            {runningAll ? '⏳ 全链路运行中...' : '🚀 一键运行全流程'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={'flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ' +
                (i === currentStep ? 'bg-blue-500/20 border border-blue-500/40' :
                 results[s.id] ? 'bg-green-500/10 border border-green-500/30' :
                 'bg-slate-800/50 border border-slate-700')}
                onClick={() => setCurrentStep(i)}>
                <span className="text-lg">{results[s.id] ? '✅' : s.icon}</span>
                <div>
                  <div className={'text-sm font-medium ' + (i === currentStep ? 'text-blue-300' : results[s.id] ? 'text-green-300' : 'text-slate-400')}>
                    {s.label}
                  </div>
                  {results[s.id] && (
                    <div className="text-xs text-slate-500">{results[s.id].elapsed}ms · {results[s.id].usage?.total_tokens || 0} tokens</div>
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={'flex-1 h-0.5 mx-2 ' + (results[s.id] ? 'bg-green-500/40' : 'bg-slate-700')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">❌ {error}</div>
      )}

      {/* Input Panel (always visible at step 0) */}
      {currentStep === 0 && !results.strategy && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📋 输入投放参数</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">投放目标</label>
              <select value={goal} onChange={e => setGoal(e.target.value)} className="input">
                <option value="acquisition">🎯 拉新获客</option>
                <option value="repurchase">🔄 促进复购</option>
                <option value="branding">📢 品牌曝光</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">日预算 (¥)</label>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="input" min={100} max={10000} step={100} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">目标ROI</label>
              <input type="number" value={targetROI} onChange={e => setTargetROI(Number(e.target.value))} className="input" min={0.5} max={10} step={0.1} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">目标平台</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="input">
                <option value="xiaohongshu">📕 小红书</option>
                <option value="douyin">🎵 抖音</option>
                <option value="wechat">💬 微信公众号</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">内容类型</label>
              <select value={contentType} onChange={e => setContentType(e.target.value)} className="input">
                <option value="text">📝 种草文案</option>
                <option value="video_script">🎬 视频脚本</option>
                <option value="image_prompt">🎨 图片提示词</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">主要竞品</label>
              <input type="text" value={competitors} onChange={e => setCompetitors(e.target.value)} className="input" placeholder="竞品品牌名，逗号分隔" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">产品信息</label>
            <textarea value={productsText} onChange={e => setProductsText(e.target.value)} className="input w-full" rows={6} />
          </div>
          <button onClick={() => runStep(0)} disabled={loading}
            className="btn-primary disabled:opacity-50">
            {loading ? '⏳ AI 生成策略中...' : '🎯 第1步：生成投放策略'}
          </button>
        </div>
      )}

      {/* Step Results */}
      {STEPS.map((s, i) => results[s.id] && (
        <div key={s.id} ref={el => { resultRefs.current[s.id] = el; }}
          className={'card p-6 ' + (i === currentStep - 1 ? 'border-blue-500/40' : '')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {s.icon} 第{i + 1}步：{s.label}
              <span className="badge badge-green">AI 已生成</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{results[s.id].model} · {results[s.id].elapsed}ms · {results[s.id].usage?.total_tokens || 0} tokens</span>
              <button onClick={() => copyResult(s.id)} className="btn-secondary text-sm">📋 复制</button>
            </div>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--slate-700)', borderRadius: '0.5rem', padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--slate-200)', fontSize: '0.875rem', lineHeight: '1.7', fontFamily: 'inherit' }}>
              {results[s.id].content}
            </pre>
          </div>

          {/* Next step button */}
          {i < STEPS.length - 1 && i === currentStep - 1 && (
            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => runStep(i + 1)} disabled={loading}
                className="btn-primary disabled:opacity-50">
                {loading ? '⏳ AI 分析中...' : `${STEPS[i + 1].icon} 下一步：${STEPS[i + 1].label}`}
              </button>
              <span className="text-xs text-slate-500">基于当前结果继续生成</span>
            </div>
          )}
        </div>
      ))}

      {/* Final summary */}
      {results.review && (
        <div className="card p-6" style={{ border: '1px solid rgba(34,197,94,0.4)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">🏁 全链路完成！</h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {STEPS.map(s => (
              <div key={s.id} className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-sm text-white font-medium">{s.label}</div>
                <div className="text-xs text-green-400">✅ 完成</div>
                <div className="text-xs text-slate-500">{results[s.id]?.elapsed}ms</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              const allContent = STEPS.map(s => `=== ${s.label} ===\n\n${results[s.id]?.content}`).join('\n\n\n');
              const blob = new Blob([allContent], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = '智营引擎_全链路报告_' + new Date().toISOString().slice(0, 10) + '.md';
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }} className="btn-primary">📥 下载全链路报告</button>
            <button onClick={reset} className="btn-secondary">🔄 重新运行</button>
          </div>
        </div>
      )}
    </div>
  );
}
