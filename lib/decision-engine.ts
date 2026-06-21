import { PRODUCTS } from './mock-data';

interface DecisionInput {
  goal: 'acquisition' | 'repurchase' | 'branding';
  budget: number;
  targetROI: number;
  productId?: string;
}

interface RuleResult {
  type: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: string;
  confidence: number;
}

// 专家规则引擎 - 将投放师经验编码为可执行规则
export function runDecisionEngine(input: DecisionInput): RuleResult[] {
  const rules: RuleResult[] = [];
  const products = input.productId
    ? PRODUCTS.filter(p => p.id === input.productId)
    : PRODUCTS;

  // 规则1: 预算分配 - 高毛利产品优先
  if (input.budget < 500) {
    rules.push({
      type: 'budget_concentrate',
      priority: 'high',
      description: `预算有限（¥${input.budget}/天），建议集中投放单一产品。推荐优先投放「${products[0].name}」（毛利率${Math.round(products[0].margin * 100)}%），最大化单产品ROI`,
      expectedImpact: '避免预算分散导致各计划数据不足，加速模型学习',
      confidence: 0.85,
    });
  } else {
    const allocation = products.map((p, i) => ({
      name: p.name,
      ratio: i === 0 ? 0.5 : i === 1 ? 0.3 : 0.2,
      budget: Math.round(input.budget * (i === 0 ? 0.5 : i === 1 ? 0.3 : 0.2)),
    }));
    rules.push({
      type: 'budget_allocate',
      priority: 'high',
      description: `建议按以下比例分配预算：${allocation.map(a => `${a.name} ¥${a.budget}(${Math.round(a.ratio * 100)}%)`).join('、')}`,
      expectedImpact: '高毛利+高转化产品获得更多曝光，整体ROI提升15-20%',
      confidence: 0.8,
    });
  }

  // 规则2: 出价策略 - 根据目标ROI调整
  if (input.targetROI >= 3) {
    rules.push({
      type: 'bid_conservative',
      priority: 'medium',
      description: '目标ROI较高（≥3），建议采用"控成本投放"策略，设置目标转化成本，限制单次出价上限',
      expectedImpact: '降低无效消耗，但可能牺牲部分跑量速度',
      confidence: 0.75,
    });
  } else if (input.targetROI >= 1.5) {
    rules.push({
      type: 'bid_balanced',
      priority: 'medium',
      description: '目标ROI适中，建议采用"最大转化"策略，先跑量积累数据，3天后根据实际ROI微调',
      expectedImpact: '快速获取转化数据，加速模型收敛',
      confidence: 0.82,
    });
  } else {
    rules.push({
      type: 'bid_aggressive',
      priority: 'high',
      description: '目标ROI较低，说明处于冷启动阶段。建议采用"加速投放"，出价上浮20%，优先积累转化数据',
      expectedImpact: '快速度过冷启动期，预计3-5天后ROI回升',
      confidence: 0.7,
    });
  }

  // 规则3: 人群策略 - 根据目标调整
  if (input.goal === 'acquisition') {
    rules.push({
      type: 'audience_expand',
      priority: 'high',
      description: '拉新目标：建议拓展3组新人群包 - ①兴趣标签人群 ②竞品粉丝人群 ③达人相似粉丝。初期排除已购用户',
      expectedImpact: '触达更多潜在用户，预计CTR提升10-15%',
      confidence: 0.88,
    });
  } else if (input.goal === 'repurchase') {
    rules.push({
      type: 'audience_retarget',
      priority: 'high',
      description: '复购目标：重点投放已购用户+加购未付款用户。创建DMP人群包：近30天加购未付款、60天未复购老客',
      expectedImpact: '复购人群转化率通常是新客的3-5倍',
      confidence: 0.92,
    });
  }

  // 规则4: 素材策略
  rules.push({
    type: 'content_refresh',
    priority: 'medium',
    description: '建议每周更新2-3组新素材，避免素材疲劳。当前热门形式：小红书图文测评 > 抖音口播种草 > 信息流商品卡',
    expectedImpact: '新素材CTR通常比衰退期素材高30-50%',
    confidence: 0.78,
  });

  // 规则5: 时段策略
  rules.push({
    type: 'schedule_optimize',
    priority: 'low',
    description: '护肤品类高转化时段：20:00-23:00（晚间护肤场景）、12:00-13:00（午休浏览）。建议在这些时段加大预算投放比例',
    expectedImpact: '高峰时段转化率通常高出平均20-30%',
    confidence: 0.72,
  });

  return rules;
}
