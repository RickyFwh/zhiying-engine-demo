// 产品知识库存储模块
// localStorage key: zhiying_products

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  margin: number; // 毛利率 0~1
  sellingPoints: string[];
  targetAudience: string;
  description: string;
  brand: {
    name: string;
    tone: string;
    voice: string;
    forbiddenWords: string[];
  };
}

const STORAGE_KEY = 'zhiying_products';

/**
 * 获取默认产品列表（从 mock-data 中的三个产品初始化）
 */
export function getDefaultProducts(): Product[] {
  return [
    {
      id: 'p1',
      name: '烟酰胺焕亮精华液',
      category: '功效护肤',
      price: 199,
      margin: 0.77,
      sellingPoints: ['5%高浓度烟酰胺', '熊果苷协同美白', '敏感肌友好配方', '28天见效承诺'],
      targetAudience: '25-35岁女性，关注美白功效，有一定护肤知识',
      description: '5%烟酰胺+熊果苷双重美白，28天提亮肤色一个色阶',
      brand: {
        name: '智研美肌',
        tone: '专业可信赖、科学护肤',
        voice: '温和理性，成分党友好',
        forbiddenWords: ['美白针', '医美', '激素', '速效'],
      },
    },
    {
      id: 'p2',
      name: '肽能修护头皮精华',
      category: '头皮护理',
      price: 168,
      margin: 0.77,
      sellingPoints: ['生物活性肽技术', '修护毛囊微环境', '7天控油持久清爽', '无硅油无酒精'],
      targetAudience: '28-40岁男女，头皮敏感/出油/脱发困扰人群',
      description: '生物活性肽深层修护毛囊，改善头皮微环境，强韧发根',
      brand: {
        name: '智研美肌',
        tone: '科技感、专业修护',
        voice: '直白实用，痛点导向',
        forbiddenWords: ['生发', '药物', '治疗', '根治'],
      },
    },
    {
      id: 'p3',
      name: '玻色因紧致面霜',
      category: '抗衰护肤',
      price: 258,
      margin: 0.79,
      sellingPoints: ['30%高浓度玻色因', '依克多因细胞修护', '4周可见淡纹', '医美级抗衰体验'],
      targetAudience: '30-45岁女性，追求抗衰效果，愿意为品质付费',
      description: '30%玻色因+依克多因，生物科技抗衰，4周淡纹紧致',
      brand: {
        name: '智研美肌',
        tone: '高端抗衰、生物科技',
        voice: '优雅自信，效果说话',
        forbiddenWords: ['整容', '逆龄', '返老还童', '永久'],
      },
    },
  ];
}

/**
 * 从 localStorage 加载所有产品，若无数据则初始化默认产品
 */
export function loadProducts(): Product[] {
  if (typeof window === 'undefined') return getDefaultProducts();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Product[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // corrupted data, fall through to defaults
  }
  // 首次访问，写入默认数据
  const defaults = getDefaultProducts();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

/**
 * 保存（新增或更新）一个产品
 */
export function saveProduct(product: Product): void {
  const products = loadProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

/**
 * 删除一个产品
 */
export function deleteProduct(id: string): void {
  const products = loadProducts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

/**
 * 生成新的产品 ID
 */
export function generateProductId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * 创建一个空白产品模板
 */
export function createEmptyProduct(): Product {
  return {
    id: generateProductId(),
    name: '',
    category: '',
    price: 0,
    margin: 0.5,
    sellingPoints: [],
    targetAudience: '',
    description: '',
    brand: {
      name: '',
      tone: '',
      voice: '',
      forbiddenWords: [],
    },
  };
}
