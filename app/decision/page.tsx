'use client';
import { useState } from 'react';

interface RuleResult {
  type: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: string;
  confidence: number;
}

const priorityStyles: Record<string, React.CSSProperties> = {
  high: { background: 'rgba(248,113,113,0.2)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.3)' },
  medium: { background: 'rgba(250,204,21,0.2)', color: '#fde047', border: '1px solid rgba(250,204,21,0.3)' },
  low: { background: 'rgba(96,165,250,0.2)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)' },
};
const priorityLabels: Record<string, string> = { high: '高优先', medium: '中优先', low: '低优先' };

export default function DecisionPage() {
  const [goal, setGoal] = useState<'acquisition' | 'repurchase' | 'branding'>('acquisition');
  const [budget, setBudget] = useState(500);
  const [targetROI, setTargetROI] = useState(2.0);
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<RuleResult[]>([]);
  const [llmAnalysis, setLlmAnalysis] = useState('');

  const runDecision = async () => {
    setLoading(true);
    setRules([]);
    setLlmAnalysis('');
    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, budget, targetROI, productId: productId || undefined }),
      });
      const data = await res.json();
      setRules(data.rules || []);
      setLlmAnalysis(data.llmAnalysis || '');
    } catch (err) {
      console.error('Decision error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">🧠 专家决策大脑</h1>
        <p className="text-slate-400">基于规则引擎 + AI 增强的投放策略决策系统</p>
      </div>

      {/* Input Panel */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">🎯 策略参数配置</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">投放目标</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value as any)} className="input">
              <option value="acquisition">🎯 拉新获客</option>
              <option value="repurchase">🔄 促进复购</option>
              <option value="branding">📢 品牌曝光</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">日预算 (¥)</label>
            <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="input" min={100} max={10000} step={100} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">目标ROI</label>
            <input type="number" value={targetROI} onChange={(e) => setTargetROI(Number(e.target.value))} className="input" min={0.5} max={10} step={0.1} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">产品范围</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
              <option value="">全部产品</option>
              <option value="p1">烟酰胺焕亮精华液</option>
              <option value="p2">肽能修护头皮精华</option>
              <option value="p3">玻色因紧致面霜</option>
            </select>
          </div>
        </div>
        <button onClick={runDecision} disabled={loading} className="btn-primary">
          {loading ? '⏳ AI 正在分析...' : '⚡ 运行决策引擎'}
        </button>
      </div>

      {/* Results */}
      {(rules.length > 0 || llmAnalysis) && (
        <div className="grid grid-cols-2 gap-6">
          {/* Rule Results */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">📊 规则引擎输出</h2>
            <div className="space-y-4">
              {rules.map((rule, i) => (
                <div key={i} style={{ border: '1px solid var(--slate-700)', borderRadius: '0.5rem', padding: '1rem' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', ...priorityStyles[rule.priority] }}>
                      {priorityLabels[rule.priority]}
                    </span>
                    <span className="text-xs text-slate-500">置信度 {(rule.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-slate-200 mb-2">{rule.description}</p>
                  <p className="text-xs text-slate-500">
                    <span className="text-green-400">预期效果：</span>{rule.expectedImpact}
                  </p>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${rule.confidence * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LLM Analysis */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">🧠 AI 增强分析</h2>
            <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--slate-700)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {llmAnalysis || '等待 AI 分析...'}
              </div>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.5rem' }}>
              <p className="text-xs text-blue-400">💡 AI分析基于规则引擎输出进行增强解读，最终决策由专家确认后执行</p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">决策流程</h2>
        <div className="flex items-center justify-between">
          {[
            { label: '数据输入', desc: '投放/用户/竞品数据', emoji: '📥' },
            { label: '规则引擎', desc: '专家经验规则匹配', emoji: '⚙️' },
            { label: 'AI 增强', desc: 'LLM补充分析', emoji: '🧠' },
            { label: '专家审核', desc: '人工确认高风险决策', emoji: '👨‍💼' },
            { label: '自动执行', desc: 'RPA下发投放指令', emoji: '🤖' },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="text-center">
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', fontSize: '1.5rem' }}>
                  {step.emoji}
                </div>
                <p className="text-sm text-white font-medium">{step.label}</p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
              {i < arr.length - 1 && <div style={{ width: 64, height: 2, background: 'var(--slate-600)', margin: '0 0.5rem' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
