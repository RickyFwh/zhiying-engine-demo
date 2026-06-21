// LLM API 客户端 - 兼容 OpenAI 接口（通义千问/百炼/豆包/DeepSeek 等）
// 运行时从 .env.local 读取配置，支持设置页热更新

import fs from 'fs';
import path from 'path';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function readEnvConfig(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const result: Record<string, string> = {};
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq > 0) result[t.slice(0, eq)] = t.slice(eq + 1);
    }
  } catch {}
  return result;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const { temperature = 0.7, maxTokens = 2000 } = options || {};

  // 每次调用都从 .env.local 读取最新配置
  const env = readEnvConfig();
  const apiKey = env.LLM_API_KEY || process.env.LLM_API_KEY || '';
  const baseUrl = env.LLM_BASE_URL || process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = env.LLM_MODEL || process.env.LLM_MODEL || 'qwen-plus';

  if (!apiKey || apiKey === 'sk-your-api-key-here') {
    return mockLLMResponse(messages);
  }

  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', response.status, errorText.slice(0, 200));
      // 如果真实 API 失败，返回错误提示但仍尝试 fallback 到模拟
      return '⚠️ API 调用失败 (' + response.status + ')，请检查设置页的 API Key 是否正确。\n\n错误详情：' + errorText.slice(0, 300) + '\n\n---\n\n以下为模拟内容（API 恢复后可替换）：\n\n' + mockLLMResponse(messages);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err: any) {
    console.error('LLM API network error:', err.message);
    return '⚠️ 网络连接失败: ' + err.message + '\n\n请检查：\n1. API Key 是否正确\n2. Base URL 是否可访问\n3. 网络连接是否正常';
  }
}

function mockLLMResponse(messages: ChatMessage[]): string {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsg = messages.find(m => m.role === 'user')?.content || '';

  if (systemMsg.includes('决策') || userMsg.includes('策略') || userMsg.includes('决策')) {
    return '## 投放策略建议\n\n### 当前分析\n基于近7天数据表现，3款产品的整体ROI呈上升趋势：\n- **烟酰胺焕亮精华液**：ROI 2.8，表现优秀，建议加大预算\n- **肽能修护头皮精华**：ROI 1.9，处于爬坡期，维持当前策略\n- **玻色因紧致面霜**：ROI 2.1，新素材效果待验证\n\n### 推荐操作\n1. **【高优先】烟酰胺精华 - 追加预算**\n   - 将日预算从 300 提升至 500 元\n   - 预期 ROI 维持在 2.5 以上\n\n2. **【中优先】头皮精华 - 人群拓展**\n   - 新增"脱发焦虑"兴趣标签人群\n   - 出价策略从"控成本"切换为"最大转化"\n\n3. **【低优先】玻色因面霜 - 素材优化**\n   - 暂停 CTR 低于 2% 的旧素材\n   - 生成3组新卖点文案\n\n### 预算分配建议\n| 产品 | 日预算 | 占比 | 预期ROI |\n|------|--------|------|----------|\n| 烟酰胺精华 | ¥500 | 50% | 2.5-3.0 |\n| 头皮精华 | ¥300 | 30% | 1.8-2.2 |\n| 玻色因面霜 | ¥200 | 20% | 2.0-2.5 |\n\n**总日预算：¥1,000 | 预期整体ROI：2.3-2.6**';
  }

  if (systemMsg.includes('文案') || systemMsg.includes('内容') || userMsg.includes('文案')) {
    return '# 小红书种草文案\n\n## 标题（3选1）\n1. 🫙 黄皮亲妈！这瓶精华让我白到发光\n2. 😱 同事以为我打了美白针…其实只用了这瓶\n3. ✨ 28天美白挑战｜从黄二白到冷白皮的秘密\n\n## 正文\n\n姐妹们我真的绷不住了！！😭\n\n作为一个从小学就开始被叫"小黑"的黄皮星人\n这瓶烟酰胺焕亮精华液真的改变了我的命运\n\n📸 先说结论：**28天，黄二白→冷一白**（附对比图）\n\n---\n\n### 🔬 成分党狂喜\n- **5%烟酰胺**：这个浓度是真的良心！低于2%基本没效果，高于10%容易刺激，5%刚刚好\n- **熊果苷**：和烟酰胺是美白黄金搭档，从源头抑制黑色素\n- **透明质酸**：美白的同时保湿不拔干\n\n### 📝 我的使用方法\n1. 洁面后先拍一层爽肤水\n2. 取2-3滴精华，全脸按压吸收\n3. 重点暗沉区域（鼻翼、嘴角）多按压几下\n4. 后续叠加面霜锁水\n\n### ⏰ 我的变化时间线\n- **第1周**：皮肤变细腻了，出油减少\n- **第2周**：鼻翼暗沉开始变浅！\n- **第3周**：整张脸透亮了一个度\n- **第4周**：同事问我是不是偷偷去做了医美😂\n\n---\n\n💡 温馨提示：美白是个持久战，一定要配合防晒！\n我搭配的是SPF50+的防晒霜，阴天也涂！\n\n📦 现在品牌有活动，**新客立减30**\n需要的姐妹冲！这个价格真的闭眼入\n\n#美白精华 #烟酰胺 #黄皮逆袭 #护肤分享 #好物推荐';
  }

  if (systemMsg.includes('视频') || userMsg.includes('视频')) {
    return '# 抖音短视频脚本\n\n## 基本信息\n- **时长**：45秒\n- **类型**：口播+产品展示\n- **风格**：闺蜜分享型\n\n---\n\n## 🎬 脚本\n\n### 【0-5秒】Hook\n**画面**：怼脸拍，展示肤色对比\n**台词**："黄皮女生看过来！我用了一个月，同事以为我偷偷去打了美白针！"\n\n### 【5-15秒】痛点共鸣\n**画面**：展示手机里以前的自拍\n**台词**："以前拍照永远显黄显暗，直到遇到这瓶——"\n\n### 【15-30秒】产品展示\n**画面**：产品特写 → 滴管取出 → 涂抹\n**台词**："5%浓度的烟酰胺，配合熊果苷双重美白，敏感肌也能用"\n\n### 【30-40秒】效果展示\n**画面**：28天前后对比照片\n**台词**："28天，真的白了一个度"\n\n### 【40-45秒】CTA\n**画面**：产品+手机下单页面\n**台词**："新客立减30，链接放在小黄车1号，赶紧冲！"';
  }

  return '这是智营引擎 AI 生成的示例内容。\n\n请在「设置」页面配置有效的 API Key 以获得真实的 AI 生成内容。\n\n支持的 API：\n- 通义千问/百炼 (dashscope.aliyuncs.com)\n- DeepSeek (api.deepseek.com)\n- 豆包 (ark.cn-beijing.volces.com)\n- 任何 OpenAI 兼容接口';
}
