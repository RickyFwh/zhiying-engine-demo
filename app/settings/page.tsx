"use client";
import { useState, useEffect } from "react";
import { PROVIDER_PRESETS, setClientConfig, getClientConfig, type ClientConfig } from "@/lib/client-config";

export default function SettingsPage() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取已保存的配置
    const config = getClientConfig();
    if (config) {
      setApiKey(config.apiKey);
      setBaseUrl(config.baseUrl);
      setModel(config.model);
      // 尝试匹配 preset
      const idx = PROVIDER_PRESETS.findIndex(p => p.baseUrl === config.baseUrl);
      if (idx >= 0) setSelectedPreset(idx);
    }
  }, []);

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

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>⚙️ 设置</h1>
      <p style={{ color: "#888", marginBottom: 24 }}>
        配置您的 AI 模型 API。每位用户独立配置，存储在浏览器本地，不会上传到服务器。
      </p>

      {/* API 配置 */}
      <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🤖 AI 模型配置</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>模型服务商</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PROVIDER_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePresetChange(i)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: selectedPreset === i ? "2px solid #6c5ce7" : "1px solid #333",
                  background: selectedPreset === i ? "#6c5ce722" : "#111",
                  color: selectedPreset === i ? "#a29bfe" : "#aaa",
                  cursor: "pointer",
                  fontSize: 13,
                }}
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
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#111",
              color: "#fff",
              fontSize: 14,
              boxSizing: "border-box",
            }}
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
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#111",
                color: "#fff",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#aaa", fontSize: 14 }}>模型名称</label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="qwen-plus"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#111",
                color: "#fff",
                fontSize: 14,
                boxSizing: "border-box",
              }}
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
          <button
            onClick={handleSave}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "#6c5ce7",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {saved ? "✅ 已保存" : "💾 保存配置"}
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#222",
              color: "#fff",
              cursor: testing ? "not-allowed" : "pointer",
              fontSize: 14,
              opacity: testing ? 0.6 : 1,
            }}
          >
            {testing ? "⏳ 测试中..." : "🔌 测试连接"}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid #ff6b6b44",
              background: "transparent",
              color: "#ff6b6b",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            🗑️ 清除配置
          </button>
        </div>
      </div>

      {/* 安全说明 */}
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

      {/* 平台集成 */}
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
