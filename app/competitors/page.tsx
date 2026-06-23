'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadProducts, Product } from '@/lib/products';
import {
  CompetitorProfile,
  loadCompetitors,
  saveCompetitor,
  deleteCompetitor,
  getCompetitorsByProduct,
} from '@/lib/competitors';
import { getClientConfig } from '@/lib/client-config';

export default function CompetitorsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [allCompetitors, setAllCompetitors] = useState<CompetitorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<CompetitorProfile[]>([]);

  useEffect(() => {
    const prods = loadProducts();
    setProducts(prods);
    const all = loadCompetitors();
    setAllCompetitors(all);
    if (prods.length > 0) {
      setSelectedProductId(prods[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      const filtered = getCompetitorsByProduct(selectedProductId);
      setCompetitors(filtered);
    }
  }, [selectedProductId, allCompetitors]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleResearch = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError('');
    setResearchResult([]);

    try {
      const clientConfig = getClientConfig();
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          category: selectedProduct.category,
          price: selectedProduct.price,
          sellingPoints: selectedProduct.sellingPoints,
          clientConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '研究失败');
      }

      const newCompetitors = data.competitors as CompetitorProfile[];
      setResearchResult(newCompetitors);

      // 自动保存到 localStorage
      for (const comp of newCompetitors) {
        saveCompetitor(comp);
      }
      setAllCompetitors(loadCompetitors());
    } catch (err: any) {
      setError(err.message || '竞品研究出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteCompetitor(id);
    setAllCompetitors(loadCompetitors());
    setResearchResult((prev) => prev.filter((c) => c.id !== id));
  };

  const startEditNotes = (comp: CompetitorProfile) => {
    setEditingNotesId(comp.id);
    setNotesDraft(comp.notes || '');
  };

  const saveNotes = () => {
    if (!editingNotesId) return;
    const all = loadCompetitors();
    const target = all.find((c) => c.id === editingNotesId);
    if (target) {
      target.notes = notesDraft;
      saveCompetitor(target);
      setAllCompetitors(loadCompetitors());
    }
    setEditingNotesId(null);
    setNotesDraft('');
  };

  const copyToClipboard = async (text: string, materialId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(materialId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const getChannelColor = (channel: string) => {
    if (channel.includes('小红书')) return '#ff4757';
    if (channel.includes('抖音')) return '#000000';
    if (channel.includes('微信')) return '#07c160';
    if (channel.includes('快手')) return '#ff6600';
    if (channel.includes('微博')) return '#ff8200';
    return '#6366f1';
  };

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return '📝 文案';
      case 'video_script': return '🎬 视频脚本';
      case 'image_desc': return '🖼️ 图片描述';
      default: return type;
    }
  };

  const displayCompetitors = [...researchResult, ...competitors.filter(
    (c) => !researchResult.some((r) => r.id === c.id)
  )];

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>🔍 竞品情报</h1>
          <p className="text-slate-400 text-sm mt-1">
            选择我方产品，AI 自动研究同品类竞品的投放策略、营销数据与素材案例
          </p>
        </div>
      </div>

      {/* 产品选择与研究按钮 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div style={{ flex: '1 1 300px' }}>
            <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>
              选择我方产品
            </label>
            <select
              className="input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.length === 0 && <option value="">暂无产品</option>}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) - ¥{p.price}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={handleResearch}
              disabled={loading || !selectedProductId}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? '⏳ 研究中...' : '🔍 研究竞品'}
            </button>
          </div>
        </div>

        {/* 选中产品的简要信息 */}
        {selectedProduct && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="badge badge-blue">{selectedProduct.category}</span>
              <span className="text-yellow-400 font-medium">¥{selectedProduct.price}</span>
              <span className="text-slate-400">
                卖点：{selectedProduct.sellingPoints.slice(0, 3).join('、')}
                {selectedProduct.sellingPoints.length > 3 ? '...' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#f87171', marginBottom: 16, fontSize: 14 }}>
          ❌ {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="card text-center" style={{ padding: '40px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#e2e8f0' }}>正在研究竞品情报...</p>
          <p className="text-slate-400 text-sm mt-2">AI 正在分析同品类竞品的投放策略、营销数据和素材案例</p>
        </div>
      )}

      {/* 竞品卡片列表 */}
      {displayCompetitors.length > 0 && !loading && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            📊 竞品档案 ({displayCompetitors.length})
          </h2>
          <div className="space-y-4">
            {displayCompetitors.map((comp) => (
              <div key={comp.id} className="card" style={{ overflow: 'hidden' }}>
                {/* 卡片头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                      {comp.name}
                    </h3>
                    <span className="badge badge-purple">{comp.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => startEditNotes(comp)}
                    >
                      📝 备注
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', fontSize: 14 }}
                      onClick={() => handleDelete(comp.id)}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* 价格带 + 渠道标签 */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <span style={{ fontSize: 14, color: '#fbbf24', fontWeight: 600 }}>
                    ¥{comp.price?.min || 0} - ¥{comp.price?.max || 0}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {(comp.channels || []).map((ch, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 500,
                          background: `${getChannelColor(ch)}22`,
                          color: getChannelColor(ch),
                          border: `1px solid ${getChannelColor(ch)}44`,
                        }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                  <span className="text-slate-500 text-xs">
                    研究时间：{new Date(comp.researchedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                {/* 营销数据网格 */}
                {comp.marketingData && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="text-slate-400 text-xs font-medium" style={{ marginBottom: 6 }}>
                      📈 营销数据
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div className="text-slate-500" style={{ fontSize: 10, marginBottom: 2 }}>预估预算</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>{comp.marketingData.estimatedBudget || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div className="text-slate-500" style={{ fontSize: 10, marginBottom: 2 }}>发布频率</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#86efac' }}>{comp.marketingData.contentFrequency || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(251,191,36,0.08)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div className="text-slate-500" style={{ fontSize: 10, marginBottom: 2 }}>粉丝量级</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fcd34d' }}>{comp.marketingData.followerCount || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(244,63,94,0.08)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div className="text-slate-500" style={{ fontSize: 10, marginBottom: 2 }}>爆款内容</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#fda4af', lineHeight: 1.3 }}>{comp.marketingData.topContent || '-'}</div>
                      </div>
                      <div style={{ background: 'rgba(168,85,247,0.08)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div className="text-slate-500" style={{ fontSize: 10, marginBottom: 2 }}>互动率</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#c084fc' }}>{comp.marketingData.engagementRate || '-'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 强项与弱点 */}
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 14 }}>
                  <div>
                    <div className="text-green-400 text-xs font-medium" style={{ marginBottom: 4 }}>
                      ✅ 强项
                    </div>
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {(comp.strengths || []).map((s, i) => (
                        <li key={i} className="text-slate-300 text-xs" style={{ marginBottom: 2, lineHeight: 1.5 }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-red-400 text-xs font-medium" style={{ marginBottom: 4 }}>
                      ⚠️ 弱点
                    </div>
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {(comp.weaknesses || []).map((w, i) => (
                        <li key={i} className="text-slate-300 text-xs" style={{ marginBottom: 2, lineHeight: 1.5 }}>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 差异化建议 */}
                {comp.differentiation && (
                  <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, border: '1px solid rgba(59,130,246,0.15)' }}>
                    <div className="text-blue-400 text-xs font-medium" style={{ marginBottom: 4 }}>
                      💡 差异化建议
                    </div>
                    <p className="text-slate-300 text-sm" style={{ margin: 0, lineHeight: 1.6 }}>
                      {comp.differentiation}
                    </p>
                  </div>
                )}

                {/* 备注 */}
                {editingNotesId === comp.id ? (
                  <div style={{ marginBottom: 14 }}>
                    <textarea
                      className="input"
                      rows={3}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="添加研究备注..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={saveNotes}>
                        保存备注
                      </button>
                      <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setEditingNotesId(null)}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : comp.notes ? (
                  <div style={{ background: 'rgba(148,163,184,0.08)', borderRadius: 8, padding: '8px 14px', marginBottom: 14 }}>
                    <div className="text-slate-400 text-xs font-medium" style={{ marginBottom: 2 }}>📝 备注</div>
                    <p className="text-slate-300 text-xs" style={{ margin: 0 }}>{comp.notes}</p>
                  </div>
                ) : null}

                {/* 展开/收起投放素材 */}
                <button
                  className="btn-secondary"
                  style={{ width: '100%', padding: '8px', fontSize: 13, textAlign: 'center' }}
                  onClick={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
                >
                  {expandedId === comp.id ? '收起投放素材 ▲' : `查看投放素材 (${(comp.adMaterials || []).length} 条) ▼`}
                </button>

                {/* 投放素材列表 */}
                {expandedId === comp.id && (
                  <div style={{ marginTop: 12 }}>
                    {(() => {
                      const materials = comp.adMaterials || [];
                      // 按平台分组
                      const grouped: Record<string, typeof materials> = {};
                      for (const m of materials) {
                        const platform = m.platform || '其他';
                        if (!grouped[platform]) grouped[platform] = [];
                        grouped[platform].push(m);
                      }
                      return Object.entries(grouped).map(([platform, items]) => (
                        <div key={platform} style={{ marginBottom: 16 }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: getChannelColor(platform),
                              }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                              {platform}
                            </span>
                            <span className="text-slate-500 text-xs">({items.length} 条)</span>
                          </div>
                          <div className="space-y-3">
                            {items.map((m) => (
                              <div
                                key={m.id}
                                style={{
                                  background: 'rgba(30,41,59,0.8)',
                                  border: '1px solid #334155',
                                  borderRadius: 8,
                                  padding: '12px 14px',
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="badge badge-green" style={{ fontSize: 11 }}>
                                    {getMaterialTypeLabel(m.type)}
                                  </span>
                                  <button
                                    className="btn-secondary"
                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                    onClick={() => copyToClipboard(m.content, m.id)}
                                  >
                                    {copiedId === m.id ? '✅ 已复制' : '📋 复制'}
                                  </button>
                                </div>
                                <div
                                  className="text-slate-300"
                                  style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}
                                >
                                  {m.content}
                                </div>
                                {m.performance && (
                                  <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(251,191,36,0.06)', borderRadius: 6, border: '1px solid rgba(251,191,36,0.15)' }}>
                                    <span className="text-yellow-400 text-xs">📊 预估效果：</span>
                                    <span className="text-slate-400 text-xs">{m.performance}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                    {(comp.adMaterials || []).length === 0 && (
                      <p className="text-slate-500 text-sm text-center" style={{ padding: 16 }}>
                        暂无投放素材数据
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!loading && displayCompetitors.length === 0 && selectedProductId && (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#e2e8f0', marginBottom: 8 }}>
            暂无竞品情报数据
          </p>
          <p className="text-slate-400 text-sm">
            点击「研究竞品」按钮，AI 将自动分析同品类竞品的投放策略
          </p>
        </div>
      )}

      {/* 历史竞品列表 */}
      {allCompetitors.length > 0 && displayCompetitors.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            📁 历史竞品库 ({allCompetitors.length})
          </h2>
          <div className="card">
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th className="text-slate-400 text-left" style={{ padding: '8px 12px', fontWeight: 500 }}>品牌</th>
                    <th className="text-slate-400 text-left" style={{ padding: '8px 12px', fontWeight: 500 }}>品类</th>
                    <th className="text-slate-400 text-left" style={{ padding: '8px 12px', fontWeight: 500 }}>价格带</th>
                    <th className="text-slate-400 text-left" style={{ padding: '8px 12px', fontWeight: 500 }}>关联产品</th>
                    <th className="text-slate-400 text-left" style={{ padding: '8px 12px', fontWeight: 500 }}>研究时间</th>
                    <th className="text-slate-400 text-center" style={{ padding: '8px 12px', fontWeight: 500 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allCompetitors.map((comp) => {
                    const relatedProduct = products.find((p) => p.id === comp.relatedProductId);
                    return (
                      <tr key={comp.id} style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                        <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 500 }}>{comp.name}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className="badge badge-purple" style={{ fontSize: 11 }}>{comp.category}</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#fbbf24' }}>
                          ¥{comp.price?.min}-{comp.price?.max}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                          {relatedProduct?.name || '未关联'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>
                          {new Date(comp.researchedAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 13 }}
                            onClick={() => handleDelete(comp.id)}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
