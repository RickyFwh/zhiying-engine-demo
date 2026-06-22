'use client';
import { useState, useRef, useEffect } from 'react';
import { getClientConfig } from '@/lib/client-config';
import { saveContent } from '@/lib/storage';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

interface CompetitorScores {
  content_quality: number;
  spend_intensity: number;
  differentiation: number;
  brand_awareness: number;
  user_engagement: number;
}

interface CompetitorData {
  name: string;
  strategy: string;
  strengths: string[];
  weaknesses: string[];
  spend_level: 'high' | 'medium' | 'low';
  scores: CompetitorScores;
}

interface StructuredData {
  competitors: CompetitorData[];
  opportunities: string[];
  recommended_keywords: string[];
  differentiation: string;
}

interface StepResult {
  content: string;
  elapsed: number;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
  structured?: StructuredData;
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

// ─── Simple Markdown → HTML renderer ───────────────────────────
function renderMarkdown(text: string): string {
  if (!text) return '';
  let html = text;

  // Fenced code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Process line by line for block elements
  const lines = html.split('\n');
  const out: string[] = [];
  let inList: 'ul' | 'ol' | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip lines inside pre blocks (already handled)
    if (line.includes('<pre>') || line.includes('</pre>')) {
      if (inList) { out.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      out.push(line);
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      if (inList) { out.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      out.push('<hr/>');
      continue;
    }

    // Headers
    const h4 = line.match(/^####\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h4) { if (inList) { out.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; } out.push(`<h4>${inlineFormat(h4[1])}</h4>`); continue; }
    if (h3) { if (inList) { out.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; } out.push(`<h3>${inlineFormat(h3[1])}</h3>`); continue; }
    if (h2) { if (inList) { out.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; } out.push(`<h2>${inlineFormat(h2[1])}</h2>`); continue; }
    if (h1) { if (inList) { out.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; } out.push(`<h1>${inlineFormat(h1[1])}</h1>`); continue; }

    // Blockquote
    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      if (inList) { out.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      out.push(`<blockquote>${inlineFormat(bq[1])}</blockquote>`);
      continue;
    }

    // Unordered list item
    const ul = line.match(/^[\s]*[-*]\s+(.+)$/);
    if (ul) {
      if (inList !== 'ul') {
        if (inList) out.push('</ol>');
        out.push('<ul>');
        inList = 'ul';
      }
      out.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    // Ordered list item
    const ol = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (ol) {
      if (inList !== 'ol') {
        if (inList) out.push('</ul>');
        out.push('<ol>');
        inList = 'ol';
      }
      out.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    // Close list if not a list item
    if (inList) {
      out.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }

    // Empty line → paragraph break
    if (line.trim() === '') {
      out.push('');
      continue;
    }

    // Regular paragraph
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) out.push(inList === 'ul' ? '</ul>' : '</ol>');

  return out.join('\n');
}

function inlineFormat(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Loading Indicator Component ───────────────────────────────
function LoadingIndicator({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
      <div className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
      <span style={{ color: '#60a5fa', fontSize: '0.875rem', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Vertical Timeline Component ───────────────────────────────
function VerticalTimeline({ runningStepId, results }: {
  runningStepId: string | null;
  results: Record<string, StepResult>;
}) {
  const completedCount = STEPS.filter(s => results[s.id]).length;
  const runningIdx = runningStepId ? STEPS.findIndex(s => s.id === runningStepId) : -1;
  const fillHeight = runningIdx >= 0
    ? ((runningIdx + 0.5) / STEPS.length) * 100
    : (completedCount / STEPS.length) * 100;

  return (
    <div style={{
      position: 'sticky', top: '2rem',
      width: '200px', minWidth: '200px', flexShrink: 0,
      padding: '1.5rem 1rem',
      background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem',
      border: '1px solid #334155',
      alignSelf: 'flex-start',
    }}>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
        全链路进度
      </div>

      <div style={{ position: 'relative', paddingLeft: '28px' }}>
        {/* Background line */}
        <div className="timeline-line" />
        {/* Filled line */}
        <div className="timeline-line-fill" style={{ height: `${fillHeight}%` }} />

        {STEPS.map((s, i) => {
          const done = !!results[s.id];
          const running = runningStepId === s.id;
          const nodeClass = done ? 'tl-node tl-node-done' : running ? 'tl-node tl-node-running' : 'tl-node';

          return (
            <div key={s.id} style={{ position: 'relative', marginBottom: i < STEPS.length - 1 ? '1.75rem' : 0 }}>
              {/* Node dot */}
              <div className={nodeClass} style={{ position: 'absolute', left: '-28px', top: '2px' }}>
                {done && <span className="check-pop" style={{ position: 'absolute', top: '-3px', left: '1px', fontSize: '10px', color: 'white', fontWeight: 700 }}>✓</span>}
              </div>

              {/* Label */}
              <div style={{
                fontSize: '0.8125rem',
                fontWeight: done || running ? 600 : 400,
                color: done ? '#4ade80' : running ? '#60a5fa' : '#64748b',
                transition: 'all 0.3s',
              }}>
                {s.icon} {s.label}
              </div>

              {/* Status text */}
              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>
                {done ? `✅ ${(results[s.id].elapsed / 1000).toFixed(1)}s` :
                 running ? '⏳ 执行中...' : '等待中'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Token summary during run */}
      {completedCount > 0 && (
        <div style={{
          marginTop: '1.5rem', paddingTop: '1rem',
          borderTop: '1px solid #334155',
          fontSize: '0.75rem', color: '#94a3b8',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>已完成</span>
            <span style={{ color: '#4ade80' }}>{completedCount}/{STEPS.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>消耗 Token</span>
            <span style={{ color: '#60a5fa' }}>
              {Object.values(results).reduce((sum, r) => sum + (r.usage?.total_tokens || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Competitor Visualization Component ────────────────────────
const SPEND_COLORS: Record<string, { bg: string; bar: string; label: string }> = {
  high: { bg: 'rgba(239,68,68,0.15)', bar: '#ef4444', label: '高强度' },
  medium: { bg: 'rgba(250,204,21,0.15)', bar: '#facc15', label: '中等' },
  low: { bg: 'rgba(34,197,94,0.15)', bar: '#22c55e', label: '低投入' },
};

const RADAR_COLORS = ['#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#fb923c'];

const DIMENSION_LABELS: Record<string, string> = {
  content_quality: '内容质量',
  spend_intensity: '投放力度',
  differentiation: '差异化',
  brand_awareness: '品牌认知',
  user_engagement: '用户互动',
};

function CompetitorVisualization({ data }: { data: StructuredData }) {
  const [chartMode, setChartMode] = useState<'radar' | 'bar'>('radar');

  // 雷达图数据
  const radarDimensions = Object.keys(DIMENSION_LABELS);
  const radarData = radarDimensions.map(dim => {
    const point: any = { dimension: DIMENSION_LABELS[dim] };
    data.competitors.forEach(c => {
      point[c.name] = c.scores[dim as keyof CompetitorScores] || 0;
    });
    return point;
  });

  // 柱状图数据
  const barData = data.competitors.map(c => ({
    name: c.name,
    内容质量: c.scores.content_quality,
    投放力度: c.scores.spend_intensity,
    差异化: c.scores.differentiation,
    品牌认知: c.scores.brand_awareness,
    用户互动: c.scores.user_engagement,
  }));

  const barMetrics = ['内容质量', '投放力度', '差异化', '品牌认知', '用户互动'];
  const barColors = ['#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#fbbf24'];

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* 竞品卡片网格 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏷️ 竞品对比卡片
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.competitors.length, 4)}, 1fr)`, gap: '1rem' }}>
          {data.competitors.map((comp, idx) => {
            const spendInfo = SPEND_COLORS[comp.spend_level] || SPEND_COLORS.medium;
            return (
              <div key={comp.name} className="card" style={{ padding: '1.25rem', borderColor: RADAR_COLORS[idx % RADAR_COLORS.length] + '40', position: 'relative', overflow: 'hidden' }}>
                {/* 顶部色条 */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: RADAR_COLORS[idx % RADAR_COLORS.length] }} />

                {/* 竞品名 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: RADAR_COLORS[idx % RADAR_COLORS.length], fontWeight: 700, fontSize: '1rem' }}>{comp.name}</span>
                  <span className="badge" style={{ background: spendInfo.bg, color: spendInfo.bar, fontSize: '0.7rem' }}>
                    💰 {spendInfo.label}
                  </span>
                </div>

                {/* 策略摘要 */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>📋 策略摘要</div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>{comp.strategy}</div>
                </div>

                {/* 投放力度进度条 */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>投放力度</div>
                  <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${comp.scores.spend_intensity}%`,
                      background: `linear-gradient(90deg, ${spendInfo.bar}80, ${spendInfo.bar})`,
                      borderRadius: '4px',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem', textAlign: 'right' }}>{comp.scores.spend_intensity}%</div>
                </div>

                {/* 强项 */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#4ade80', marginBottom: '0.25rem' }}>✅ 强项</div>
                  {comp.strengths.map((s, si) => (
                    <div key={si} style={{ fontSize: '0.75rem', color: '#94a3b8', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(34,197,94,0.25)', marginBottom: '0.2rem' }}>
                      {s}
                    </div>
                  ))}
                </div>

                {/* 弱点 */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: '0.25rem' }}>⚠️ 弱点</div>
                  {comp.weaknesses.map((w, wi) => (
                    <div key={wi} style={{ fontSize: '0.75rem', color: '#94a3b8', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(239,68,68,0.25)', marginBottom: '0.2rem' }}>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 图表区域 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 竞品维度对比
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setChartMode('radar')}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: chartMode === 'radar' ? '#2563eb' : '#1e293b', color: chartMode === 'radar' ? 'white' : '#94a3b8' }}>
              🕸️ 雷达图
            </button>
            <button onClick={() => setChartMode('bar')}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: chartMode === 'bar' ? '#2563eb' : '#1e293b', color: chartMode === 'bar' ? 'white' : '#94a3b8' }}>
              📊 柱状图
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          {chartMode === 'radar' ? (
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                {data.competitors.map((comp, idx) => (
                  <Radar
                    key={comp.name}
                    name={comp.name}
                    dataKey={comp.name}
                    stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', fontSize: '0.8rem' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: '#cbd5e1' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={barData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', fontSize: '0.8rem' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: '#cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                {barMetrics.map((metric, mi) => (
                  <Bar key={metric} dataKey={metric} fill={barColors[mi]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 差异化机会 */}
      {(data.opportunities.length > 0 || data.differentiation) && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 差异化机会
          </h3>
          <div className="card" style={{ padding: '1.25rem', borderColor: 'rgba(168,85,247,0.3)', background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.05))' }}>
            {data.differentiation && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(168,85,247,0.1)', borderRadius: '0.5rem', borderLeft: '3px solid #a78bfa' }}>
                <div style={{ fontSize: '0.8rem', color: '#c084fc', marginBottom: '0.25rem', fontWeight: 600 }}>🎯 核心差异化方向</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6 }}>{data.differentiation}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {data.opportunities.map((opp, oi) => (
                <div key={oi} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: '0.625rem 0.75rem', background: 'rgba(30,41,59,0.6)', borderRadius: '0.5rem', border: '1px solid #334155'
                }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1, marginTop: '0.1rem' }}>{oi + 1}</span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>{opp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 推荐关键词 */}
      {data.recommended_keywords.length > 0 && (
        <div>
          <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔑 推荐关键词
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {data.recommended_keywords.map((kw, ki) => (
              <span key={ki} className="badge badge-blue" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
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
  const [runningStepId, setRunningStepId] = useState<string | null>(null);
  const [totalStartTime, setTotalStartTime] = useState<number | null>(null);
  const [totalEndTime, setTotalEndTime] = useState<number | null>(null);

  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to new result
  useEffect(() => {
    const lastResult = Object.keys(results).pop();
    if (lastResult && resultRefs.current[lastResult]) {
      resultRefs.current[lastResult]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);

  const callStep = async (step: string, extraBody: Record<string, any> = {}) => {
    setLoading(true);
    setError('');
    setRunningStepId(step);
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
        clientConfig: getClientConfig(),
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
          structured: data.structured,
        },
      }));

      if (step === 'content' && data._saveInfo) {
        saveContent(data._saveInfo);
      }

      return data.content;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      setRunningStepId(null);
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

  const callStepDirect = async (step: string, body: any): Promise<StepResult> => {
    setRunningStepId(step);
    const cc = getClientConfig();
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, ...body, clientConfig: cc }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    if (step === 'content' && data._saveInfo) {
      saveContent(data._saveInfo);
    }

    const result: StepResult = { content: data.content, elapsed: data.elapsed, usage: data.usage, model: data.model, structured: data.structured };
    setRunningStepId(null);
    return result;
  };

  const runAll = async () => {
    setRunningAll(true);
    setError('');
    setLoading(true);
    const start = Date.now();
    setTotalStartTime(start);
    setTotalEndTime(null);
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
      setTotalEndTime(Date.now());
      setLoading(false);
      setRunningAll(false);
      setRunningStepId(null);
    }
  };

  const copyResult = (step: string) => {
    if (results[step]) navigator.clipboard.writeText(results[step].content);
  };

  const reset = () => {
    setResults({});
    setCurrentStep(0);
    setError('');
    setRunningStepId(null);
    setTotalStartTime(null);
    setTotalEndTime(null);
  };

  // Compute progress
  const completedCount = STEPS.filter(s => results[s.id]).length;
  const progressPct = (completedCount / STEPS.length) * 100;
  const isRunning = loading || runningStepId !== null;
  const runningIdx = runningStepId ? STEPS.findIndex(s => s.id === runningStepId) : -1;
  const activeProgressPct = isRunning && runningIdx >= 0
    ? ((runningIdx + 0.5) / STEPS.length) * 100
    : progressPct;

  const totalElapsed = totalStartTime && totalEndTime ? totalEndTime - totalStartTime : null;
  const totalTokens = Object.values(results).reduce((sum, r) => sum + (r.usage?.total_tokens || 0), 0);
  const totalPromptTokens = Object.values(results).reduce((sum, r) => sum + (r.usage?.prompt_tokens || 0), 0);
  const totalCompletionTokens = Object.values(results).reduce((sum, r) => sum + (r.usage?.completion_tokens || 0), 0);

  // Determine card state
  const getCardState = (stepId: string, idx: number) => {
    if (results[stepId]) return 'done';
    if (runningStepId === stepId) return 'running';
    if (idx <= currentStep && !results[stepId]) return 'pending';
    return 'pending';
  };

  const cardClass = (state: string) => {
    if (state === 'done') return 'card step-card-done';
    if (state === 'running') return 'card step-card-running';
    return 'card step-card-pending';
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
            {runningAll ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="loading-dots">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </span>
                全链路运行中...
              </span>
            ) : '🚀 一键运行全流程'}
          </button>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        {/* Top: step indicators */}
        <div className="flex items-center" style={{ marginBottom: '1rem' }}>
          {STEPS.map((s, i) => {
            const state = getCardState(s.id, i);
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div
                  onClick={() => !isRunning && setCurrentStep(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                    transition: 'all 0.3s',
                    cursor: isRunning ? 'default' : 'pointer',
                    background: state === 'running' ? 'rgba(59,130,246,0.15)' :
                                state === 'done' ? 'rgba(34,197,94,0.08)' :
                                'rgba(30,41,59,0.5)',
                    border: state === 'running' ? '1px solid rgba(59,130,246,0.5)' :
                            state === 'done' ? '1px solid rgba(34,197,94,0.3)' :
                            '1px solid #334155',
                  }}>
                  <span style={{ fontSize: '1.125rem' }}>
                    {state === 'done' ? <span className="check-pop" style={{ color: '#4ade80' }}>✓</span> :
                     state === 'running' ? <span className="loading-dots" style={{ gap: '2px' }}>
                       <span className="loading-dot" style={{ width: '5px', height: '5px' }} />
                       <span className="loading-dot" style={{ width: '5px', height: '5px' }} />
                       <span className="loading-dot" style={{ width: '5px', height: '5px' }} />
                     </span> :
                     s.icon}
                  </span>
                  <div>
                    <div style={{
                      fontSize: '0.8125rem', fontWeight: 500,
                      color: state === 'running' ? '#60a5fa' :
                             state === 'done' ? '#4ade80' : '#94a3b8',
                    }}>
                      {s.label}
                    </div>
                    {results[s.id] && (
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        {(results[s.id].elapsed / 1000).toFixed(1)}s · {(results[s.id].usage?.total_tokens || 0).toLocaleString()} tok
                      </div>
                    )}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 0.5rem',
                    background: results[s.id] ? '#22c55e' : '#334155',
                    borderRadius: '1px',
                    transition: 'background 0.5s',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom: progress track */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="progress-track" style={{ flex: 1 }}>
            <div className="progress-fill" style={{ width: `${activeProgressPct}%` }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: '3rem', textAlign: 'right' }}>
            {completedCount}/{STEPS.length}
          </span>
        </div>

        {/* Running indicator text */}
        {isRunning && runningStepId && (
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LoadingIndicator label={`AI 正在分析：${STEPS.find(s => s.id === runningStepId)?.label || ''}...`} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5', fontSize: '0.875rem' }}>
          ❌ {error}
        </div>
      )}

      {/* Main content area - with optional timeline */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

        {/* Vertical Timeline (shown during runAll) */}
        {runningAll && (
          <VerticalTimeline runningStepId={runningStepId} results={results} />
        )}

        {/* Right: content */}
        <div style={{ flex: 1, minWidth: 0 }} className="space-y-6">

          {/* Input Panel (always visible at step 0 before strategy) */}
          {currentStep === 0 && !results.strategy && (
            <div className={cardClass('pending')} style={{ padding: '1.5rem' }}>
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
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="loading-dots">
                      <span className="loading-dot" />
                      <span className="loading-dot" />
                      <span className="loading-dot" />
                    </span>
                    AI 生成策略中...
                  </span>
                ) : '🎯 第1步：生成投放策略'}
              </button>
            </div>
          )}

          {/* Step Result Cards */}
          {STEPS.map((s, i) => {
            const state = getCardState(s.id, i);
            const hasResult = !!results[s.id];

            // Show running card placeholder
            if (state === 'running' && !hasResult) {
              return (
                <div key={s.id} className={`${cardClass('running')} fade-in-up`} style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                    <div>
                      <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#60a5fa' }}>
                        第{i + 1}步：{s.label}
                      </h2>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.desc}</p>
                    </div>
                  </div>
                  <LoadingIndicator label="AI 正在分析，请稍候..." />
                </div>
              );
            }

            if (!hasResult) return null;

            return (
              <div key={s.id} ref={el => { resultRefs.current[s.id] = el; }}
                className={`${cardClass('done')} fade-in-up`} style={{ padding: '1.5rem' }}>

                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Checkmark icon */}
                    <div style={{
                      width: '2rem', height: '2rem', borderRadius: '50%',
                      background: 'rgba(34,197,94,0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="check-pop" style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.875rem' }}>✓</span>
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#f1f5f9' }}>
                        {s.icon} 第{i + 1}步：{s.label}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                        <span className="badge badge-green">AI 已生成</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ⏱ {(results[s.id].elapsed / 1000).toFixed(1)}s · {results[s.id].model}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      fontSize: '0.75rem', color: '#94a3b8',
                      background: 'rgba(30,41,59,0.8)', padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem',
                    }}>
                      🔤 {(results[s.id].usage?.total_tokens || 0).toLocaleString()} tokens
                    </div>
                    <button onClick={() => copyResult(s.id)} className="btn-secondary text-sm">📋 复制</button>
                  </div>
                </div>

                {/* Markdown rendered content */}
                <div
                  className="md-content"
                  style={{
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    padding: '1.25rem 1.5rem',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(results[s.id].content) }}
                />

                {/* Competitor structured visualization */}
                {s.id === 'competitor' && results[s.id].structured && (
                  <CompetitorVisualization data={results[s.id].structured!} />
                )}

                {/* Next step button */}
                {i < STEPS.length - 1 && i === currentStep - 1 && !runningAll && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => runStep(i + 1)} disabled={loading}
                      className="btn-primary disabled:opacity-50">
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="loading-dots">
                            <span className="loading-dot" />
                            <span className="loading-dot" />
                            <span className="loading-dot" />
                          </span>
                          AI 分析中...
                        </span>
                      ) : `${STEPS[i + 1].icon} 下一步：${STEPS[i + 1].label}`}
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>基于当前结果继续生成</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* ─── Final Summary Card ─────────────────────────── */}
          {results.review && (
            <div className="card fade-in-up" style={{ padding: '1.5rem', border: '2px solid rgba(34,197,94,0.5)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>
                🏁 全链路完成！
              </h2>

              {/* Step summary grid */}
              <div className="grid grid-cols-4 gap-3" style={{ marginBottom: '1.25rem' }}>
                {STEPS.map(s => (
                  <div key={s.id} style={{
                    background: 'rgba(30,41,59,0.5)', borderRadius: '0.5rem',
                    padding: '0.875rem', textAlign: 'center',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#f1f5f9', fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#4ade80' }}>✅ 完成</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>
                      ⏱ {results[s.id] ? (results[s.id].elapsed / 1000).toFixed(1) + 's' : '-'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total stats */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(34,197,94,0.1))',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '0.5rem', padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem' }}>
                  📊 执行统计
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>总耗时</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>
                      {totalElapsed ? (totalElapsed / 1000).toFixed(1) + 's' :
                        (Object.values(results).reduce((s, r) => s + r.elapsed, 0) / 1000).toFixed(1) + 's'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>总 Token</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80' }}>
                      {totalTokens.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>输入 Token</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>
                      {totalPromptTokens.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>输出 Token</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#facc15' }}>
                      {totalCompletionTokens.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
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
      </div>
    </div>
  );
}
