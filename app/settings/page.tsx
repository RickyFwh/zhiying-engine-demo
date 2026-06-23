"use client";
import { useState, useEffect } from "react";
import { PROVIDER_PRESETS, setClientConfig, getClientConfig, type ClientConfig } from "@/lib/client-config";
import {
  IMAGE_PROVIDER_PRESETS,
  VIDEO_PROVIDER_PRESETS,
  getImageConfig,
  saveImageConfig,
  clearImageConfig,
  getVideoConfig,
  saveVideoConfig,
  clearVideoConfig,
  type MediaConfig,
} from "@/lib/media-config";

export default function SettingsPage() {
  // ===== LLM 配置状态 =====
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  // ===== 图片生成 API 配置状态 =====
  const [imgPreset, setImgPreset] = useState(0);
  const [imgApiKey, setImgApiKey] = useState("");
  const [imgBaseUrl, setImgBaseUrl] = useState("");
  const [imgModel, setImgModel] = useState("");
  const [imgTesting, setImgTesting] = useState(false);
  const [imgTestResult, setImgTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [imgSaved, setImgSaved] = useState(false);

  // ===== 视频生成 API 配置状态 =====
  const [vidPreset, setVidPreset] = useState(0);
  const [vidApiKey, setVidApiKey] = useState("");
  const [vidBaseUrl, setVidBaseUrl] = useState("");
  const [vidModel, setVidModel] = useState("");
  const [vidTesting, setVidTesting] = useState(false);
  const [vidTestResult, setVidTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [vidSaved, setVidSaved] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取 LLM 配置
    const config = getClientConfig();
    if (config) {
      setApiKey(config.apiKey);
      setBaseUrl(config.baseUrl);
      setModel(config.model);
      const idx = PROVIDER_PRESETS.findIndex(p => p.baseUrl === config.baseUrl);
      if (idx >= 0) setSelectedPreset(idx);
    }
    // 从 localStorage 读取图片配置
    const imgConfig = getImageConfig();
    if (imgConfig) {
      setImgApiKey(imgConfig.apiKey);
      setImgBaseUrl(imgConfig.baseUrl);
      setImgModel(imgConfig.model);
      const idx = IMAGE_PROVIDER_PRESETS.findIndex(p => p.provider === imgConfig.provider);
      if (idx >= 0) setImgPreset(idx);
    }
    // 从 localStorage 读取视频配置
    const vidConfig = getVideoConfig();
    if (vidConfig) {
      setVidApiKey(vidConfig.apiKey);
      setVidBaseUrl(vidConfig.baseUrl);
      setVidModel(vidConfig.model);
      const idx = VIDEO_PROVIDER_PRESETS.findIndex(p => p.provider === vidConfig.provider);
      if (idx >= 0) setVidPreset(idx);
    }
  }, []);

  // ===== LLM 配置 handlers =====
  const handlePresetChange = (idx: number) => {
    setSelectedPreset(idx);
    const p = PROVIDER_PRESETS[idx];
    setBaseUrl(p.baseUrl);
    setModel(p.model);
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setTestResult({ ok: false, msg: "请输入 API Key" });
      return;
    }
    setClientConfig({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      provider: PROVIDER_PRESETS[selectedPreset].provider,
    });
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ ok: false, msg: "请先输入 API Key" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "请回复'连接成功'四个字",
          clientConfig: {
            apiKey: apiKey.trim(),
            baseUrl: baseUrl.trim(),
            model: model.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ ok: true, msg: `✅ 连接成功！模型: ${data.model}，耗时 ${data.elapsed}ms` });
      } else {
        setTestResult({ ok: false, msg: `❌ 连接失败: ${data.error}` });
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: `❌ 请求异常: ${err.message}` });
    }
    setTesting(false);
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zhiying_llm_config");
    }
    setApiKey("");
    setBaseUrl("");
    setModel("");
    setTestResult(null);
    setSaved(false);
  };

  const maskedKey = apiKey ? apiKey.slice(0, 6) + "••••••" + apiKey.slice(-4) : "";

  // ===== 图片配置 handlers =====
  const handleImgPresetChange = (idx: number) => {
    setImgPreset(idx);
    const p = IMAGE_PROVIDER_PRESETS[idx];
    setImgBaseUrl(p.baseUrl);
    setImgModel(p.model);
  };

  const handleImgSave = () => {
    if (!imgApiKey.trim()) {
      setImgTestResult({ ok: false, msg: "请输入 API Key" });
      return;
    }
    saveImageConfig({
      provider: IMAGE_PROVIDER_PRESETS[imgPreset].provider,
      apiKey: imgApiKey.trim(),
      baseUrl: imgBaseUrl.trim(),
      model: imgModel.trim(),
      enabled: true,
    });
    setImgSaved(true);
    setImgTestResult(null);
    setTimeout(() => setImgSaved(false), 3000);
  };

  const handleImgTest = async () => {
    if (!imgApiKey.trim()) {
      setImgTestResult({ ok: false, msg: "请先输入 API Key" });
      return;
    }
    setImgTesting(true);
    setImgTestResult(null);
    try {
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "一只可爱的猫咪",
          productInfo: {},
          platform: "xiaohongshu",
          mediaConfig: {
            provider: IMAGE_PROVIDER_PRESETS[imgPreset].provider,
            apiKey: imgApiKey.trim(),
            baseUrl: imgBaseUrl.trim(),
            model: imgModel.trim(),
            enabled: true,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImgTestResult({ ok: true, msg: `✅ 连接成功！模型: ${data.model}` });
      } else {
        setImgTestResult({ ok: false, msg: `❌ 连接失败: ${data.error}` });
      }
    } catch (err: any) {
      setImgTestResult({ ok: false, msg: `❌ 请求异常: ${err.message}` });
    }
    setImgTesting(false);
  };

  const handleImgClear = () => {
    clearImageConfig();
    setImgApiKey("");
    setImgBaseUrl("");
    setImgModel("");
    setImgTestResult(null);
    setImgSaved(false);
  };

  // ===== 视频配置 handlers =====
  const handleVidPresetChange = (idx: number) => {
    setVidPreset(idx);
    const p = VIDEO_PROVIDER_PRESETS[idx];
    setVidBaseUrl(p.baseUrl);
    setVidModel(p.model);
  };

  const handleVidSave = () => {
    if (!vidApiKey.trim()) {
      setVidTestResult({ ok: false, msg: "请输入 API Key" });
      return;
    }
    saveVideoConfig({
      provider: VIDEO_PROVIDER_PRESETS[vidPreset].provider,
      apiKey: vidApiKey.trim(),
      baseUrl: vidBaseUrl.trim(),
      model: vidModel.trim(),
      enabled: true,
    });
    setVidSaved(true);
    setVidTestResult(null);
    setTimeout(() => setVidSaved(false), 3000);
  };

  const handleVidTest = async () => {
    if (!vidApiKey.trim()) {
      setVidTestResult({ ok: false, msg: "请先输入 API Key" });
      return;
    }
    setVidTesting(true);
    setVidTestResult(null);
    try {
      const res = await fetch("/api/video-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: "一只蝴蝶在花丛中飞舞",
          productInfo: {},
          platform: "douyin",
          mediaConfig: {
            provider: VIDEO_PROVIDER_PRESETS[vidPreset].provider,
            apiKey: vidApiKey.trim(),
            baseUrl: vidBaseUrl.trim(),
            model: vidModel.trim(),
            enabled: true,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVidTestResult({ ok: true, msg: `✅ 连接成功！模型: ${data.model}` });
      } else {
        setVidTestResult({ ok: false, msg: `❌ 连接失败: ${data.error}` });
      }
    } catch (err: any) {
      setVidTestResult({ ok: false, msg: `❌ 请求异常: ${err.message}` });
    }
    setVidTesting(false);
  };

  const handleVidClear = () => {
    clearVideoConfig();
    setVidApiKey("");
    setVidBaseUrl("");
    setVidModel("");
    setVidTestResult(null);
    setVidSaved(false);
  };

  // ===== 通用输入框样式 =====
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#111",
    color: "#fff",
    fontSize: 14,
    boxSizing: "border-box" as const,
  };

  const btnPrimary = {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none" as const,
    background: "#6c5ce7",
    color: "#fff",
    cursor: "pointer" as const,
    fontSize: 14,
    fontWeight: 600,
  };

  const btnSecondary = {
    padding: "10px 24px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#222",
    color: "#fff",
    cursor: "pointer" as const,
    fontSize: 14,
  };

  const btnDanger = {
    padding: "10px 24px",
    borderRadius: 8,
    border: "1px solid #ff6b6b44",
    background: "transparent",
    color: "#ff6b6b",
    cursor: "pointer" as const,
    fontSize: 14,
  };

  const presetBtnStyle = (active: boolean) => ({
    padding: "8px 16px",
    borderRadius: 8,
    border: active ? "2px solid #6c5ce7" : "1px solid #333",
    background: active ? "#6c5ce722" : "#111",
    color: active ? "#a29bfe" : "#aaa",
    cursor: "pointer" as const,
    fontSize: 13,
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>⚙️ 设置</h1>
      <p style={{ color: "#888", marginBottom: 24 }}>
        配置您的 AI 模型 API 和媒体生成 API。所有配置存储在浏览器本地，不会上传到服务器。
      </p>

      {/* ========== AI 模型配置 ========== */}
      <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🤖 AI 模型配置</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>模型服务商</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PROVIDER_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePresetChange(i)}
                style={presetBtnStyle(selectedPreset === i)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
            {PROVIDER_PRESETS[selectedPreset].description}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={PROVIDER_PRESETS[selectedPreset].placeholder}
            style={inputStyle}
          />
          {apiKey && (
            <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
              当前: {maskedKey}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>API Base URL</label>
            <input
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>模型名称</label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="qwen-plus"
              style={inputStyle}
            />
          </div>
        </div>

        {testResult && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: testResult.ok ? "#00b89422" : "#ff6b6b22",
            color: testResult.ok ? "#00b894" : "#ff6b6b",
            marginBottom: 16,
            fontSize: 14,
          }}>
            {testResult.msg}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleSave} style={btnPrimary}>
            {saved ? "✅ 已保存" : "💾 保存配置"}
          </button>
          <button onClick={handleTest} disabled={testing} style={{ ...btnSecondary, opacity: testing ? 0.6 : 1, cursor: testing ? "not-allowed" : "pointer" }}>
            {testing ? "⏳ 测试中..." : "🔌 测试连接"}
          </button>
          <button onClick={handleClear} style={btnDanger}>
            🗑️ 清除配置
          </button>
        </div>
      </div>

      {/* ========== 图片生成 API 配置 ========== */}
      <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🎨 图片生成 API 配置</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>服务商</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {IMAGE_PROVIDER_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleImgPresetChange(i)}
                style={presetBtnStyle(imgPreset === i)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
            {IMAGE_PROVIDER_PRESETS[imgPreset].description}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>API Key</label>
          <input
            type="password"
            value={imgApiKey}
            onChange={e => setImgApiKey(e.target.value)}
            placeholder={IMAGE_PROVIDER_PRESETS[imgPreset].placeholder}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>API Base URL</label>
            <input
              value={imgBaseUrl}
              onChange={e => setImgBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>模型名称</label>
            <input
              value={imgModel}
              onChange={e => setImgModel(e.target.value)}
              placeholder="stable-diffusion-xl"
              style={inputStyle}
            />
          </div>
        </div>

        {imgTestResult && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: imgTestResult.ok ? "#00b89422" : "#ff6b6b22",
            color: imgTestResult.ok ? "#00b894" : "#ff6b6b",
            marginBottom: 16,
            fontSize: 14,
          }}>
            {imgTestResult.msg}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleImgSave} style={btnPrimary}>
            {imgSaved ? "✅ 已保存" : "💾 保存配置"}
          </button>
          <button onClick={handleImgTest} disabled={imgTesting} style={{ ...btnSecondary, opacity: imgTesting ? 0.6 : 1, cursor: imgTesting ? "not-allowed" : "pointer" }}>
            {imgTesting ? "⏳ 测试中..." : "🔌 测试连接"}
          </button>
          <button onClick={handleImgClear} style={btnDanger}>
            🗑️ 清除配置
          </button>
        </div>
      </div>

      {/* ========== 视频生成 API 配置 ========== */}
      <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🎬 视频生成 API 配置</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>服务商</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VIDEO_PROVIDER_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleVidPresetChange(i)}
                style={presetBtnStyle(vidPreset === i)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
            {VIDEO_PROVIDER_PRESETS[vidPreset].description}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>API Key</label>
          <input
            type="password"
            value={vidApiKey}
            onChange={e => setVidApiKey(e.target.value)}
            placeholder={VIDEO_PROVIDER_PRESETS[vidPreset].placeholder}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>API Base URL</label>
            <input
              value={vidBaseUrl}
              onChange={e => setVidBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>模型名称</label>
            <input
              value={vidModel}
              onChange={e => setVidModel(e.target.value)}
              placeholder="kling-v1"
              style={inputStyle}
            />
          </div>
        </div>

        {vidTestResult && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: vidTestResult.ok ? "#00b89422" : "#ff6b6b22",
            color: vidTestResult.ok ? "#00b894" : "#ff6b6b",
            marginBottom: 16,
            fontSize: 14,
          }}>
            {vidTestResult.msg}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleVidSave} style={btnPrimary}>
            {vidSaved ? "✅ 已保存" : "💾 保存配置"}
          </button>
          <button onClick={handleVidTest} disabled={vidTesting} style={{ ...btnSecondary, opacity: vidTesting ? 0.6 : 1, cursor: vidTesting ? "not-allowed" : "pointer" }}>
            {vidTesting ? "⏳ 测试中..." : "🔌 测试连接"}
          </button>
          <button onClick={handleVidClear} style={btnDanger}>
            🗑️ 清除配置
          </button>
        </div>
      </div>

      {/* ========== 安全说明 ========== */}
      <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>🔒 安全说明</h2>
        <ul style={{ color: "#aaa", lineHeight: 2, paddingLeft: 20 }}>
          <li>API Key 仅存储在您的浏览器本地 (localStorage)</li>
          <li>不会上传到任何服务器，其他用户无法看到您的密钥</li>
          <li>每位用户需要自行配置自己的 API Key</li>
          <li>清除浏览器数据会删除配置</li>
          <li>建议设置 API 额度限制以防滥用</li>
        </ul>
      </div>

      {/* ========== 平台集成（预留） ========== */}
      <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>📱 平台集成（预留）</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {["微信公众号", "小红书", "抖音"].map(p => (
            <div key={p} style={{ padding: 16, background: "#111", borderRadius: 8, border: "1px solid #333" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{p}</div>
              <div style={{ color: "#666", fontSize: 12 }}>暂未接入</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
