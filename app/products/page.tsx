'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Product,
  loadProducts,
  saveProduct,
  deleteProduct,
  createEmptyProduct,
} from '@/lib/products';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  const refreshProducts = useCallback(() => {
    setProducts(loadProducts());
  }, []);

  // ===== 编辑相关 =====
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditDraft({ ...product, brand: { ...product.brand, forbiddenWords: [...product.brand.forbiddenWords] }, sellingPoints: [...product.sellingPoints] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const handleSave = () => {
    if (!editDraft || !editDraft.name.trim()) return;
    saveProduct(editDraft);
    refreshProducts();
    setEditingId(null);
    setEditDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = () => {
    const newProduct = createEmptyProduct();
    startEdit(newProduct);
  };

  // ===== 删除相关 =====
  const confirmDelete = (id: string) => {
    setDeletingId(id);
  };

  const doDelete = () => {
    if (deletingId) {
      deleteProduct(deletingId);
      refreshProducts();
      if (editingId === deletingId) cancelEdit();
      setDeletingId(null);
    }
  };

  // ===== Draft 编辑工具函数 =====
  const updateDraft = (field: string, value: unknown) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, [field]: value });
  };

  const updateBrand = (field: string, value: unknown) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, brand: { ...editDraft.brand, [field]: value } });
  };

  const addSellingPoint = () => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, sellingPoints: [...editDraft.sellingPoints, ''] });
  };

  const updateSellingPoint = (index: number, value: string) => {
    if (!editDraft) return;
    const sp = [...editDraft.sellingPoints];
    sp[index] = value;
    setEditDraft({ ...editDraft, sellingPoints: sp });
  };

  const removeSellingPoint = (index: number) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, sellingPoints: editDraft.sellingPoints.filter((_, i) => i !== index) });
  };

  const addForbiddenWord = () => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, brand: { ...editDraft.brand, forbiddenWords: [...editDraft.brand.forbiddenWords, ''] } });
  };

  const updateForbiddenWord = (index: number, value: string) => {
    if (!editDraft) return;
    const fw = [...editDraft.brand.forbiddenWords];
    fw[index] = value;
    setEditDraft({ ...editDraft, brand: { ...editDraft.brand, forbiddenWords: fw } });
  };

  const removeForbiddenWord = (index: number) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, brand: { ...editDraft.brand, forbiddenWords: editDraft.brand.forbiddenWords.filter((_, i) => i !== index) } });
  };

  // ===== 渲染 =====
  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>📦 产品知识库</h1>
          <p className="text-slate-400 text-sm mt-1">管理产品信息，包括名称、品类、价格、卖点、目标人群、品牌调性与专属违禁词</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          <span>＋</span> 添加产品
        </button>
      </div>

      {saved && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#4ade80', marginBottom: 16, fontSize: 14 }}>
          ✅ 已保存
        </div>
      )}

      {/* 产品卡片网格 */}
      {products.length === 0 ? (
        <div className="card text-center p-6">
          <p className="text-slate-400">暂无产品，点击上方「添加产品」按钮创建第一个产品</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="card cursor-pointer"
              onClick={() => editingId !== product.id ? startEdit(product) : undefined}
              style={{ position: 'relative' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-blue">{product.category || '未分类'}</span>
                <button
                  className="text-slate-500"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#94a3b8', padding: '2px 6px' }}
                  onClick={(e) => { e.stopPropagation(); confirmDelete(product.id); }}
                  title="删除产品"
                >
                  🗑️
                </button>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{product.name || '未命名产品'}</h3>
              <div className="text-slate-400 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>价格</span>
                  <span className="text-yellow-400 font-medium">¥{product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>毛利率</span>
                  <span className="text-green-400 font-medium">{(product.margin * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>卖点</span>
                  <span className="badge badge-purple">{product.sellingPoints.length} 条</span>
                </div>
                <div className="flex justify-between">
                  <span>违禁词</span>
                  <span className="badge badge-red">{product.brand.forbiddenWords.length} 个</span>
                </div>
              </div>
              {product.description && (
                <p className="text-slate-500 text-xs mt-2 line-clamp-2">{product.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 编辑表单 */}
      {editDraft && (
        <div style={{ marginTop: 24, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>
              {products.find(p => p.id === editDraft.id) ? '✏️ 编辑产品' : '➕ 新建产品'}
            </h2>
            <button className="btn-secondary" onClick={cancelEdit}>✕ 取消</button>
          </div>

          {/* 基本信息 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', marginBottom: 12 }}>📋 基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>产品名称 *</label>
                <input
                  className="input"
                  value={editDraft.name}
                  onChange={(e) => updateDraft('name', e.target.value)}
                  placeholder="例：烟酰胺焕亮精华液"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>品类</label>
                <input
                  className="input"
                  value={editDraft.category}
                  onChange={(e) => updateDraft('category', e.target.value)}
                  placeholder="例：功效护肤"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>价格 (¥)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={editDraft.price}
                  onChange={(e) => updateDraft('price', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>毛利率</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={editDraft.margin}
                  onChange={(e) => updateDraft('margin', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* 产品描述 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', marginBottom: 12 }}>📝 产品描述</h3>
            <textarea
              className="input"
              rows={3}
              value={editDraft.description}
              onChange={(e) => updateDraft('description', e.target.value)}
              placeholder="简要描述产品特点和核心功效..."
            />
          </div>

          {/* 卖点列表 */}
          <div style={{ marginBottom: 20 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa' }}>⭐ 卖点列表</h3>
              <button className="btn-secondary" onClick={addSellingPoint} style={{ padding: '4px 12px', fontSize: 12 }}>+ 添加卖点</button>
            </div>
            <div className="space-y-2">
              {editDraft.sellingPoints.map((sp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs shrink-0" style={{ width: 24 }}>#{i + 1}</span>
                  <input
                    className="input"
                    value={sp}
                    onChange={(e) => updateSellingPoint(i, e.target.value)}
                    placeholder={`卖点 ${i + 1}`}
                  />
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 16, padding: '0 4px' }}
                    onClick={() => removeSellingPoint(i)}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))}
              {editDraft.sellingPoints.length === 0 && (
                <p className="text-slate-500 text-xs">暂无卖点，点击上方按钮添加</p>
              )}
            </div>
          </div>

          {/* 目标人群 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', marginBottom: 12 }}>👥 目标人群</h3>
            <textarea
              className="input"
              rows={2}
              value={editDraft.targetAudience}
              onChange={(e) => updateDraft('targetAudience', e.target.value)}
              placeholder="描述目标用户画像，例：25-35岁女性，关注美白功效，有一定护肤知识"
            />
          </div>

          {/* 品牌调性 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', marginBottom: 12 }}>🎨 品牌调性</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>品牌名称</label>
                <input
                  className="input"
                  value={editDraft.brand.name}
                  onChange={(e) => updateBrand('name', e.target.value)}
                  placeholder="品牌名称"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>调性</label>
                <input
                  className="input"
                  value={editDraft.brand.tone}
                  onChange={(e) => updateBrand('tone', e.target.value)}
                  placeholder="例：专业可信赖"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs" style={{ display: 'block', marginBottom: 4 }}>语气</label>
                <input
                  className="input"
                  value={editDraft.brand.voice}
                  onChange={(e) => updateBrand('voice', e.target.value)}
                  placeholder="例：温和理性"
                />
              </div>
            </div>
          </div>

          {/* 专属违禁词 */}
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>🚫 专属违禁词</h3>
              <button className="btn-secondary" onClick={addForbiddenWord} style={{ padding: '4px 12px', fontSize: 12 }}>+ 添加违禁词</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editDraft.brand.forbiddenWords.map((word, i) => (
                <div key={i} className="flex items-center gap-1" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 9999, padding: '2px 4px 2px 10px' }}>
                  <input
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f87171', fontSize: 13, width: 80 }}
                    value={word}
                    onChange={(e) => updateForbiddenWord(i, e.target.value)}
                    placeholder="违禁词"
                  />
                  <button
                    style={{ background: 'rgba(248,113,113,0.2)', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 12, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => removeForbiddenWord(i)}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))}
              {editDraft.brand.forbiddenWords.length === 0 && (
                <p className="text-slate-500 text-xs">暂无专属违禁词，点击上方按钮添加</p>
              )}
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex items-center gap-3">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!editDraft.name.trim()}
            >
              💾 保存产品
            </button>
            <button className="btn-secondary" onClick={cancelEdit}>
              取消
            </button>
            {!editDraft.name.trim() && (
              <span className="text-yellow-400 text-xs">产品名称为必填项</span>
            )}
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>⚠️ 确认删除</h3>
            <p className="text-slate-400 text-sm mb-4">
              确定要删除产品「{products.find(p => p.id === deletingId)?.name || '未知'}」吗？此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button className="btn-danger" onClick={doDelete}>确认删除</button>
              <button className="btn-secondary" onClick={() => setDeletingId(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
