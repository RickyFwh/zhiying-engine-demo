/**
 * 违禁词检查系统
 * 基于中国广告法，内置违禁词库，用于自动检测生成内容中的合规风险
 */

// ===== 违禁词分类 =====
export type ViolationCategory =
  | 'absolute'       // 绝对化用语
  | 'medical'        // 医疗宣称
  | 'false_promise'  // 虚假承诺
  | 'exaggeration'   // 夸大宣传
  | 'authority'      // 虚假权威背书
  | 'comparison'     // 不正当对比
  | 'inducement'     // 诱导性用语
  | 'cosmetics'      // 化妆品违禁宣称
  | 'financial'      // 金融/效果保证
  | 'misc';          // 其他

// ===== 严重程度 =====
export type ViolationSeverity = 'high' | 'medium' | 'low';

// ===== 违禁项 =====
export interface Violation {
  word: string;
  category: ViolationCategory;
  severity: ViolationSeverity;
  suggestion: string;
}

// ===== 检查结果 =====
export interface ComplianceResult {
  passed: boolean;
  violations: Violation[];
  totalChecked: number;       // 检查词库总数
  highCount: number;          // 高风险数
  mediumCount: number;        // 中风险数
  lowCount: number;           // 低风险数
}

// ===== 违禁词库条目 =====
interface BannedWord {
  word: string;
  category: ViolationCategory;
  severity: ViolationSeverity;
  suggestion: string;
}

/**
 * 中文广告法违禁词库（100+词）
 * 覆盖绝对化用语、医疗宣称、虚假承诺等分类
 */
const BANNED_WORDS: BannedWord[] = [
  // ============ 绝对化用语（广告法第九条）============
  { word: '最', category: 'absolute', severity: 'high', suggestion: '避免使用"最"，可改为"较为"、"非常"等' },
  { word: '最佳', category: 'absolute', severity: 'high', suggestion: '改为"优质"、"出色"等' },
  { word: '最好', category: 'absolute', severity: 'high', suggestion: '改为"优秀"、"出色"' },
  { word: '最优', category: 'absolute', severity: 'high', suggestion: '改为"高品质"' },
  { word: '最强', category: 'absolute', severity: 'high', suggestion: '改为"强劲"、"显著"' },
  { word: '最高', category: 'absolute', severity: 'high', suggestion: '改为"较高"、"突出"' },
  { word: '最大', category: 'absolute', severity: 'high', suggestion: '改为"较大"、"显著"' },
  { word: '最低', category: 'absolute', severity: 'high', suggestion: '改为"较低"、"优惠"' },
  { word: '最新', category: 'absolute', severity: 'medium', suggestion: '改为"全新"、"升级"' },
  { word: '第一', category: 'absolute', severity: 'high', suggestion: '避免排名类表述，可改为"领先"、"知名"' },
  { word: '首个', category: 'absolute', severity: 'high', suggestion: '除非有权威证明，否则改为"创新"' },
  { word: '首选', category: 'absolute', severity: 'medium', suggestion: '改为"推荐"、"热门选择"' },
  { word: '唯一', category: 'absolute', severity: 'high', suggestion: '改为"独特"、"专属"' },
  { word: '绝无仅有', category: 'absolute', severity: 'high', suggestion: '改为"少见"、"独特"' },
  { word: '绝对', category: 'absolute', severity: 'high', suggestion: '改为"非常"、"十分"' },
  { word: '绝无', category: 'absolute', severity: 'high', suggestion: '改为"极少"、"罕见"' },
  { word: '顶级', category: 'absolute', severity: 'high', suggestion: '改为"高端"、"精品"' },
  { word: '顶尖', category: 'absolute', severity: 'high', suggestion: '改为"高端"、"优质"' },
  { word: '极致', category: 'absolute', severity: 'high', suggestion: '改为"精细"、"匠心"' },
  { word: '极品', category: 'absolute', severity: 'high', suggestion: '改为"精品"、"臻品"' },
  { word: '冠军', category: 'absolute', severity: 'high', suggestion: '除非有权威赛事证明，避免使用' },
  { word: '领先', category: 'absolute', severity: 'medium', suggestion: '需有数据支撑，否则改为"前沿"' },
  { word: '遥遥领先', category: 'absolute', severity: 'high', suggestion: '改为"处于前列"、"具有优势"' },
  { word: '全网最', category: 'absolute', severity: 'high', suggestion: '避免全网对比，改为"热门"' },
  { word: '史无前例', category: 'absolute', severity: 'high', suggestion: '改为"创新"、"突破"' },
  { word: '前无古人', category: 'absolute', severity: 'high', suggestion: '改为"创新突破"' },
  { word: '万能', category: 'absolute', severity: 'high', suggestion: '改为"多效"、"多功能"' },
  { word: '全方位', category: 'absolute', severity: 'medium', suggestion: '改为"多方面"、"系统性"' },
  { word: '永久', category: 'absolute', severity: 'high', suggestion: '改为"持久"、"长效"' },
  { word: '无敌', category: 'absolute', severity: 'high', suggestion: '改为"出色"、"卓越"' },

  // ============ 医疗宣称（化妆品禁用）============
  { word: '治疗', category: 'medical', severity: 'high', suggestion: '化妆品不能宣称治疗，改为"改善"、"修护"' },
  { word: '治愈', category: 'medical', severity: 'high', suggestion: '化妆品禁止宣称治愈，改为"舒缓"、"调理"' },
  { word: '根治', category: 'medical', severity: 'high', suggestion: '禁止使用，改为"改善"、"缓解"' },
  { word: '药效', category: 'medical', severity: 'high', suggestion: '化妆品不能宣称药效，改为"护肤效果"' },
  { word: '疗效', category: 'medical', severity: 'high', suggestion: '改为"护肤功效"、"使用效果"' },
  { word: '医学级', category: 'medical', severity: 'high', suggestion: '改为"专业级"、"科研级"' },
  { word: '医疗级', category: 'medical', severity: 'high', suggestion: '改为"专业级"、"高标准"' },
  { word: '药监局认证', category: 'medical', severity: 'high', suggestion: '除非有真实批文，否则删除' },
  { word: '处方', category: 'medical', severity: 'high', suggestion: '化妆品不能与处方关联' },
  { word: '抗癌', category: 'medical', severity: 'high', suggestion: '严禁宣称，立即删除' },
  { word: '防癌', category: 'medical', severity: 'high', suggestion: '严禁宣称，立即删除' },
  { word: '消炎', category: 'medical', severity: 'high', suggestion: '改为"舒缓"、"镇静"' },
  { word: '杀菌', category: 'medical', severity: 'medium', suggestion: '改为"抑菌"、"清洁"' },
  { word: '抑菌率99', category: 'medical', severity: 'medium', suggestion: '需有检测报告支持，否则改为"有效抑菌"' },
  { word: '祛痘', category: 'medical', severity: 'medium', suggestion: '改为"控痘"、"改善痘痘肌"' },
  { word: '祛斑', category: 'medical', severity: 'medium', suggestion: '改为"淡化色斑"、"均匀肤色"' },
  { word: '去皱', category: 'medical', severity: 'medium', suggestion: '改为"淡化细纹"、"抚平皱纹"' },
  { word: '生发', category: 'medical', severity: 'high', suggestion: '属于特殊功效宣称，需特证，改为"强健发根"' },
  { word: '防脱发', category: 'medical', severity: 'high', suggestion: '需特殊化妆品批文，改为"减少断发"' },
  { word: '美白', category: 'medical', severity: 'medium', suggestion: '需特殊化妆品批文（美白特证），否则改为"提亮"' },

  // ============ 虚假承诺 ============
  { word: '100%', category: 'false_promise', severity: 'high', suggestion: '改为"充分"、"全面"等' },
  { word: '百分百', category: 'false_promise', severity: 'high', suggestion: '改为"充分"、"全面"' },
  { word: '保证', category: 'false_promise', severity: 'high', suggestion: '改为"致力于"、"力求"' },
  { word: '保证效果', category: 'false_promise', severity: 'high', suggestion: '改为"使用体验良好"' },
  { word: '立竿见影', category: 'false_promise', severity: 'high', suggestion: '改为"快速见效"、"使用后即可感受"' },
  { word: '立即见效', category: 'false_promise', severity: 'high', suggestion: '改为"短期内可见改善"' },
  { word: '一次见效', category: 'false_promise', severity: 'high', suggestion: '改为"初次使用即有体验感"' },
  { word: '三天见效', category: 'false_promise', severity: 'high', suggestion: '改为"坚持使用可见改善"' },
  { word: '七天见效', category: 'false_promise', severity: 'high', suggestion: '改为"持续使用可见改善"' },
  { word: '无效退款', category: 'false_promise', severity: 'high', suggestion: '除非有真实退款政策，否则删除' },
  { word: '永不', category: 'false_promise', severity: 'high', suggestion: '改为"持久"、"长期"' },
  { word: '零风险', category: 'false_promise', severity: 'high', suggestion: '改为"安全可靠"' },
  { word: '无副作用', category: 'false_promise', severity: 'high', suggestion: '改为"温和配方"、"低敏配方"' },
  { word: '速效', category: 'false_promise', severity: 'medium', suggestion: '改为"快速"、"高效"' },
  { word: '特效', category: 'false_promise', severity: 'medium', suggestion: '改为"特殊配方"、"针对性配方"' },

  // ============ 夸大宣传 ============
  { word: '奇迹', category: 'exaggeration', severity: 'high', suggestion: '改为"惊喜"、"出色表现"' },
  { word: '神奇', category: 'exaggeration', severity: 'high', suggestion: '改为"出色"、"优秀"' },
  { word: '逆龄', category: 'exaggeration', severity: 'medium', suggestion: '改为"显年轻"、"抗初老"' },
  { word: '冻龄', category: 'exaggeration', severity: 'medium', suggestion: '改为"保持年轻状态"' },
  { word: '换脸', category: 'exaggeration', severity: 'high', suggestion: '改为"焕新"、"焕颜"' },
  { word: '脱胎换骨', category: 'exaggeration', severity: 'high', suggestion: '改为"焕然一新"' },
  { word: '秒杀', category: 'exaggeration', severity: 'medium', suggestion: '改为"远超"、"优于"（但注意对比合规）' },
  { word: '完胜', category: 'exaggeration', severity: 'medium', suggestion: '改为"表现出色"' },
  { word: '碾压', category: 'exaggeration', severity: 'medium', suggestion: '改为"明显优势"' },
  { word: '吊打', category: 'exaggeration', severity: 'medium', suggestion: '改为"优于"、"突出"' },

  // ============ 虚假权威背书 ============
  { word: '国家级', category: 'authority', severity: 'high', suggestion: '除非有真实认证，否则删除' },
  { word: '国际认证', category: 'authority', severity: 'high', suggestion: '需有真实认证文件，否则删除' },
  { word: '央视推荐', category: 'authority', severity: 'high', suggestion: '除非有真实合作，否则删除' },
  { word: '明星同款', category: 'authority', severity: 'medium', suggestion: '需有真实代言合同，否则删除' },
  { word: '专家推荐', category: 'authority', severity: 'medium', suggestion: '需有真实背书，否则改为"专业人士认可"' },
  { word: '医院推荐', category: 'authority', severity: 'high', suggestion: '严禁使用，改为"皮肤科测试"' },
  { word: '诺贝尔', category: 'authority', severity: 'high', suggestion: '除非有真实关联，否则删除' },
  { word: '获奖', category: 'authority', severity: 'medium', suggestion: '需注明具体奖项名称和年份' },
  { word: '专利技术', category: 'authority', severity: 'medium', suggestion: '需注明专利号，否则改为"自有技术"' },
  { word: '中科院', category: 'authority', severity: 'high', suggestion: '除非有真实合作，否则删除' },

  // ============ 不正当对比 ============
  { word: '吊打同行', category: 'comparison', severity: 'high', suggestion: '禁止贬低同行，删除' },
  { word: '比XX好', category: 'comparison', severity: 'medium', suggestion: '避免指名对比，改为"同类产品中表现出色"' },
  { word: '吊打大牌', category: 'comparison', severity: 'high', suggestion: '禁止贬低竞品，改为"品质不输"' },
  { word: '替代品', category: 'comparison', severity: 'medium', suggestion: '改为"平替选择"、"高性价比之选"' },
  { word: '同款平替', category: 'comparison', severity: 'low', suggestion: '可改为"高性价比之选"' },
  { word: '碾压大牌', category: 'comparison', severity: 'high', suggestion: '禁止贬低竞品，删除' },

  // ============ 诱导性用语 ============
  { word: '不买后悔', category: 'inducement', severity: 'medium', suggestion: '改为"值得尝试"' },
  { word: '错过就没了', category: 'inducement', severity: 'medium', suggestion: '改为"限时优惠"' },
  { word: '最后一天', category: 'inducement', severity: 'medium', suggestion: '需确实为最后一天，否则删除' },
  { word: '仅限今天', category: 'inducement', severity: 'medium', suggestion: '需确实限时，否则改为"限时特惠"' },
  { word: '疯抢', category: 'inducement', severity: 'low', suggestion: '改为"热销"、"畅销"' },
  { word: '爆款', category: 'inducement', severity: 'low', suggestion: '改为"热销款"、"人气款"' },
  { word: '必买', category: 'inducement', severity: 'medium', suggestion: '改为"推荐"、"值得一试"' },
  { word: '不买亏大', category: 'inducement', severity: 'medium', suggestion: '改为"超值优惠"' },
  { word: '手慢无', category: 'inducement', severity: 'low', suggestion: '改为"库存有限"' },
  { word: '闭眼入', category: 'inducement', severity: 'low', suggestion: '改为"放心入手"' },

  // ============ 化妆品特殊违禁 ============
  { word: '食品级', category: 'cosmetics', severity: 'high', suggestion: '化妆品不能宣称食品级，删除' },
  { word: '可食用', category: 'cosmetics', severity: 'high', suggestion: '严禁宣称，立即删除' },
  { word: '孕妇可用', category: 'cosmetics', severity: 'high', suggestion: '需有安全检测报告，否则改为"温和配方"' },
  { word: '婴儿可用', category: 'cosmetics', severity: 'high', suggestion: '需有安全检测报告，否则删除' },
  { word: '纯天然', category: 'cosmetics', severity: 'high', suggestion: '改为"天然成分"、"植物来源"' },
  { word: '零添加', category: 'cosmetics', severity: 'high', suggestion: '改为"精简配方"、"无多余添加"' },
  { word: '无添加', category: 'cosmetics', severity: 'medium', suggestion: '需明确"无添加"指什么，否则改为"精简配方"' },
  { word: '无防腐', category: 'cosmetics', severity: 'medium', suggestion: '需有检测报告，否则改为"温和防腐体系"' },
  { word: '激素', category: 'cosmetics', severity: 'high', suggestion: '即使宣称"不含激素"也需谨慎，改为"安全配方"' },
  { word: '不含荧光剂', category: 'cosmetics', severity: 'low', suggestion: '需有检测报告支持' },

  // ============ 金融/效果保证 ============
  { word: '稳赚不赔', category: 'financial', severity: 'high', suggestion: '严禁宣称，立即删除' },
  { word: '保本', category: 'financial', severity: 'high', suggestion: '严禁宣称，立即删除' },
  { word: '翻倍', category: 'financial', severity: 'high', suggestion: '改为"显著提升"、"大幅增长"' },
  { word: '躺赚', category: 'financial', severity: 'high', suggestion: '严禁宣称，立即删除' },
  { word: '日入过万', category: 'financial', severity: 'high', suggestion: '严禁宣称，立即删除' },
];

/**
 * 对文本进行违禁词合规检查
 * @param text 待检查的文本内容
 * @returns 合规检查结果
 */
export function checkCompliance(text: string): ComplianceResult {
  if (!text || typeof text !== 'string') {
    return {
      passed: true,
      violations: [],
      totalChecked: BANNED_WORDS.length,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
  }

  const violations: Violation[] = [];
  const normalizedText = text.toLowerCase();

  for (const banned of BANNED_WORDS) {
    // 使用 includes 进行子串匹配
    if (normalizedText.includes(banned.word.toLowerCase())) {
      violations.push({
        word: banned.word,
        category: banned.category,
        severity: banned.severity,
        suggestion: banned.suggestion,
      });
    }
  }

  // 去重（同一词可能出现多次匹配）
  const uniqueViolations = violations.filter(
    (v, index, self) => index === self.findIndex(t => t.word === v.word)
  );

  const highCount = uniqueViolations.filter(v => v.severity === 'high').length;
  const mediumCount = uniqueViolations.filter(v => v.severity === 'medium').length;
  const lowCount = uniqueViolations.filter(v => v.severity === 'low').length;

  return {
    passed: highCount === 0,  // 只有无高风险词才算通过
    violations: uniqueViolations,
    totalChecked: BANNED_WORDS.length,
    highCount,
    mediumCount,
    lowCount,
  };
}

/**
 * 获取违禁词分类的中文名称
 */
export function getCategoryLabel(category: ViolationCategory): string {
  const labels: Record<ViolationCategory, string> = {
    absolute: '绝对化用语',
    medical: '医疗宣称',
    false_promise: '虚假承诺',
    exaggeration: '夸大宣传',
    authority: '虚假权威背书',
    comparison: '不正当对比',
    inducement: '诱导性用语',
    cosmetics: '化妆品违禁宣称',
    financial: '效果保证',
    misc: '其他',
  };
  return labels[category] || category;
}

/**
 * 获取严重程度的中文名称
 */
export function getSeverityLabel(severity: ViolationSeverity): string {
  const labels: Record<ViolationSeverity, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };
  return labels[severity] || severity;
}
