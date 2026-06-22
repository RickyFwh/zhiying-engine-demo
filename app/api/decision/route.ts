import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { runDecisionEngine } from '@/lib/decision-engine';
import { recordUsage } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal, budget, targetROI, productId, clientConfig } = body;

    // Rule engine first
    const ruleResult = runDecisionEngine({
      goal: goal || 'acquisition',
      budget: budget || 500,
      targetROI: targetROI || 2.0,
      productId: productId || undefined,
    });

    // Then LLM analysis
    const systemPrompt = `你是一位资深的数据驱动营销决策专家。基于以下规则引擎的分析结果，给出你的决策建议。
要求：
1. 解读每条规则的含义和优先级
2. 分析可能的风险和机会
3. 给出具体的行动建议（包括时间线）
4. 预判注意事项
5. 给出整体置信度评估
用中文回答，简洁有力。`;

    const userPrompt = `投放目标：${goal === 'acquisition' ? '拉新获客' : goal === 'repurchase' ? '促进复购' : '品牌曝光'}
日预算：¥${budget || 500}
目标ROI：${targetROI || 2.0}

规则引擎分析结果：
${JSON.stringify(ruleResult, null, 2)}

请基于以上信息给出你的决策建议。`;

    const llmResult = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      clientConfig,
      0.6,
      2000
    );

    // Record usage analytics
    recordUsage({
      timestamp: new Date().toISOString(),
      source: 'decision',
      model: llmResult.model || 'unknown',
      tokens: llmResult.usage?.totalTokens || 0,
      elapsed: llmResult.elapsed || 0,
    });

    return NextResponse.json({
      rules: ruleResult,
      llmAnalysis: llmResult.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
