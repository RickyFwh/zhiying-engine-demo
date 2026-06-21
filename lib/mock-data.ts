import { Product, CampaignMetrics, ContentItem } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '烟酰胺焕亮精华液',
    category: '功效护肤',
    price: 199,
    cost: 45,
    margin: 0.77,
    description: '5%烟酰胺+熊果苷双重美白，28天提亮肤色一个色阶',
    sellingPoints: ['5%高浓度烟酰胺', '熊果苷协同美白', '敏感肌友好配方', '28天见效承诺'],
    targetAudience: '25-35岁女性，关注美白功效，有一定护肤知识',
  },
  {
    id: 'p2',
    name: '肽能修护头皮精华',
    category: '头皮护理',
    price: 168,
    cost: 38,
    margin: 0.77,
    description: '生物活性肽深层修护毛囊，改善头皮微环境，强韧发根',
    sellingPoints: ['生物活性肽技术', '修护毛囊微环境', '7天控油持久清爽', '无硅油无酒精'],
    targetAudience: '28-40岁男女，头皮敏感/出油/脱发困扰人群',
  },
  {
    id: 'p3',
    name: '玻色因紧致面霜',
    category: '抗衰护肤',
    price: 258,
    cost: 55,
    margin: 0.79,
    description: '30%玻色因+依克多因，生物科技抗衰，4周淡纹紧致',
    sellingPoints: ['30%高浓度玻色因', '依克多因细胞修护', '4周可见淡纹', '医美级抗衰体验'],
    targetAudience: '30-45岁女性，追求抗衰效果，愿意为品质付费',
  },
];

// 生成过去30天的模拟投放数据
export function generateMockMetrics(days: number = 30): CampaignMetrics[] {
  const metrics: CampaignMetrics[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const baseImpressions = 5000 + Math.random() * 8000;
    const ctr = 0.02 + Math.random() * 0.03;
    const cvr = 0.03 + Math.random() * 0.05;
    const clicks = Math.floor(baseImpressions * ctr);
    const conversions = Math.floor(clicks * cvr);
    const spend = 200 + Math.random() * 600;
    const revenue = conversions * (150 + Math.random() * 100);
    
    metrics.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(baseImpressions),
      clicks,
      conversions,
      spend: Math.round(spend),
      revenue: Math.round(revenue),
      roi: Math.round((revenue / spend) * 100) / 100,
      ctr: Math.round(ctr * 10000) / 100,
      cvr: Math.round(cvr * 10000) / 100,
    });
  }
  return metrics;
}

// 模拟内容库
export function generateMockContent(): ContentItem[] {
  const contents: ContentItem[] = [
    {
      id: 'c1', productId: 'p1', platform: 'xiaohongshu', type: 'text',
      title: '黄皮救星！28天美白实测', body: '姐妹们！作为一个万年黄皮，我真的被这瓶烟酰胺精华惊到了！用了不到一个月，同事都问我是不是偷偷去打了美白针😂\n\n成分党来分析一下：5%烟酰胺+熊果苷，这个浓度是真的良心...',
      status: 'approved', createdAt: '2026-06-18T10:00:00Z',
      metrics: { impressions: 12500, clicks: 890, conversions: 45, roi: 3.2 },
    },
    {
      id: 'c2', productId: 'p2', platform: 'douyin', type: 'video_script',
      title: '头皮出油到崩溃？试试这个', body: '【开头hook】"早上洗头下午就油？问题不在洗发水，在你的头皮！"\n【痛点共鸣】展示头皮检测仪下的油脂堵塞画面\n【解决方案】肽能修护精华使用演示\n【效果对比】7天前后头皮检测对比\n【CTA】点击下方链接，新客立减30',
      status: 'published', createdAt: '2026-06-17T14:00:00Z',
      metrics: { impressions: 35000, clicks: 2100, conversions: 78, roi: 2.8 },
    },
    {
      id: 'c3', productId: 'p3', platform: 'xiaohongshu', type: 'text',
      title: '30+抗衰面霜天花板', body: '玻色因面霜用了三个月来交作业！法令纹真的浅了，不夸张！\n\n30%玻色因浓度在国货里算顶配了，配合依克多因修护...',
      status: 'pending_review', createdAt: '2026-06-20T09:00:00Z',
    },
    {
      id: 'c4', productId: 'p1', platform: 'douyin', type: 'text',
      title: '美白精华怎么选？成分党必看', body: '烟酰胺浓度越高越好吗？不一定！关键是配方体系...\n这瓶5%烟酰胺精华做到了三效合一...',
      status: 'rejected', createdAt: '2026-06-19T11:00:00Z',
      reviewComment: '开头太平淡，缺乏hook，建议用对比数据开场',
    },
  ];
  return contents;
}
