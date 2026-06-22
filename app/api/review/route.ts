/**
 * 审核反馈 API
 * GET  - 获取审核列表（从前端 localStorage 同步的数据 + 历史生成记录）
 * POST - 提交审核结果（通过/驳回/编辑）
 *
 * 注意：由于 Next.js API 路由运行在服务端，无法直接访问 localStorage，
 * 因此审核数据由前端通过 POST 提交，服务端做处理后返回。
 * 实际持久化在浏览器 localStorage（key: zhiying_reviews）
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkCompliance } from '@/lib/compliance';

// ===== 审核记录类型定义 =====
export interface ReviewItem {
  id: string;
  title: string;
  body: string;
  platform: 'xiaohongshu' | 'douyin' | 'wechat';
  type: 'text' | 'image_prompt' | 'video_script';
  productId: string;
  productName: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'published';
  reviewComment?: string;       // 驳回原因
  editedContent?: string;       // 编辑后的内容
  compliance?: {
    passed: boolean;
    violations: {
      word: string;
      category: string;
      severity: string;
      suggestion: string;
    }[];
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  createdAt: string;
  reviewedAt?: string;          // 审核时间
  reviewAction?: 'approve' | 'reject' | 'edit';  // 审核操作类型
}

// ===== 内存中暂存审核数据（服务端重启会丢失，主要持久化在 localStorage）=====
let reviewStore: ReviewItem[] = [];

/**
 * GET - 获取审核列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let items = [...reviewStore];

    // 按状态过滤
    if (status && status !== 'all') {
      items = items.filter(item => item.status === status);
    }

    // 按时间倒序
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      items,
      total: items.length,
      pendingCount: items.filter(i => i.status === 'pending_review').length,
      approvedCount: items.filter(i => i.status === 'approved').length,
      rejectedCount: items.filter(i => i.status === 'rejected').length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - 提交审核操作 / 批量同步数据
 *
 * 支持的 action:
 * - sync     : 前端同步整个审核列表到服务端
 * - approve  : 通过审核
 * - reject   : 驳回审核（需附原因）
 * - edit     : 编辑内容并通过
 * - add      : 添加新内容到审核队列（从内容生成 API 自动调用）
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // === 批量同步 ===
    if (action === 'sync') {
      const { items } = body;
      if (Array.isArray(items)) {
        reviewStore = items;
      }
      return NextResponse.json({ success: true, count: reviewStore.length });
    }

    // === 添加新内容到审核队列 ===
    if (action === 'add') {
      const { title, body: content, platform, type, productId, productName } = body;
      const newItem: ReviewItem = {
        id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: title || '未命名内容',
        body: content || '',
        platform: platform || 'xiaohongshu',
        type: type || 'text',
        productId: productId || '',
        productName: productName || '',
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        compliance: checkCompliance(content || ''),
      };
      reviewStore.unshift(newItem);
      return NextResponse.json({ success: true, item: newItem });
    }

    // === 审核操作 ===
    if (action === 'approve' || action === 'reject' || action === 'edit') {
      const { id, comment, editedContent } = body;

      const index = reviewStore.findIndex(item => item.id === id);
      if (index === -1) {
        return NextResponse.json({ error: '审核记录不存在: ' + id }, { status: 404 });
      }

      const item = reviewStore[index];
      item.reviewedAt = new Date().toISOString();
      item.reviewAction = action;

      if (action === 'approve') {
        item.status = 'approved';
      } else if (action === 'reject') {
        if (!comment || !comment.trim()) {
          return NextResponse.json({ error: '驳回时必须填写原因' }, { status: 400 });
        }
        item.status = 'rejected';
        item.reviewComment = comment.trim();
      } else if (action === 'edit') {
        if (editedContent) {
          item.editedContent = editedContent;
          item.body = editedContent; // 用编辑后的内容覆盖原文
          // 重新做违禁词检查
          item.compliance = checkCompliance(editedContent);
        }
        item.status = 'approved';
      }

      reviewStore[index] = item;
      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json({ error: '未知操作: ' + action }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
