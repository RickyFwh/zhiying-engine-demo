import { NextRequest, NextResponse } from 'next/server';
import { runDecisionEngine } from '@/lib/decision-engine';
import { chatCompletion } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal, budget, targetROI, productId } = body;

    // 1. 运行规则引擎
    const ruleResults = runDecisionEngine({ goal, budget, targetROI, productId });

    // 2. 用 LLM 增强决策分析
    const llmAnalysis = await chatCompletion([
      {
        role: 'system',
        content: `你是"智营引擎"AI市场运营Agent的决策大脑模块。你是一位资深投放师，精通抖音千川和小红书聚光平台的投放策略。
请基于以下规则引擎的输出，给出更详细的分析和补充建议。用中文回答，格式清晰，包含具体数字。`
      },
      {
        role: 'user',
        content: `投放目标：${goal === 'acquisition' ? '拉新' : goal === 'repurchase' ? '复购' : '品牌曝光'}
日预算：¥${budget}
目标ROI：${targetROI}
${productId ? `指定产品：${productId}` : '全部3款产品'}

规则引擎输出：
${ruleResults.map((r, i) => `${i + 1}. [${r.priority}] ${r.description}`).join('\n')}

请补充你的分析和额外建议。`
      }
    ], { temperature: 0.7 });

    return NextResponse.json({
      rules: ruleResults,
      llmAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
