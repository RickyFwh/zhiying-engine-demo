// ===== 产品定义 =====
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  margin: number; // 毛利率
  description: string;
  sellingPoints: string[];
  targetAudience: string;
  imageUrl?: string;
}

// ===== 投放计划 =====
export interface CampaignPlan {
  id: string;
  productId: string;
  platform: 'douyin' | 'xiaohongshu';
  objective: 'acquisition' | 'repurchase' | 'branding';
  dailyBudget: number;
  targetROI: number;
  audience: string;
  bidStrategy: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  createdAt: string;
}

// ===== 决策输出 =====
export interface DecisionOutput {
  id: string;
  timestamp: string;
  productId: string;
  recommendations: {
    type: 'budget_adjust' | 'audience_shift' | 'content_refresh' | 'bid_optimize';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: string;
    confidence: number;
  }[];
  strategy: string;
  reasoning: string;
}

// ===== 内容 =====
export interface ContentItem {
  id: string;
  productId: string;
  platform: 'douyin' | 'xiaohongshu' | 'wechat';
  type: 'text' | 'image_prompt' | 'video_script';
  title: string;
  body: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'published';
  reviewComment?: string;
  createdAt: string;
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    roi: number;
  };
}

// ===== 投放数据 =====
export interface CampaignMetrics {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
  ctr: number;
  cvr: number;
}

// ===== 竞品情报 =====
export interface CompetitorIntel {
  id: string;
  competitor: string;
  platform: string;
  contentType: string;
  title: string;
  engagement: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  collectedAt: string;
}

// ===== 用户生命周期事件 =====
export interface LifecycleEvent {
  id: string;
  userId: string;
  type: 'cart_abandon' | 'first_purchase' | 'repurchase_remind' | 'win_back';
  triggerTime: string;
  channel: 'wechat' | 'sms' | 'platform_dm';
  message: string;
  status: 'pending' | 'sent' | 'opened' | 'converted';
}
