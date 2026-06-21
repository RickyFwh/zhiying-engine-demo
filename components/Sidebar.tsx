'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '总览', icon: '📊' },
  { href: '/pipeline', label: '全链路工作流', icon: '🔗' },
  { href: '/decision', label: '决策大脑', icon: '🧠' },
  { href: '/content', label: '内容生成', icon: '✍️' },
  { href: '/review', label: '审核队列', icon: '✅' },
  { href: '/dashboard', label: '投放看板', icon: '📈' },
  { href: '/lab', label: '真实测试', icon: '🧪' },
  { href: '/status', label: '系统状态', icon: '💚' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="flex items-center gap-3">
          <div className="logo-gradient">
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>智营引擎</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>AI 市场运营 Agent</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={isActive ? 'active' : ''}>
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--slate-800)' }}>
        <div className="card" style={{ padding: '0.75rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="status-dot" />
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)' }}>系统运行中</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }} className="space-y-1">
            <div className="flex justify-between">
              <span>今日决策</span>
              <span className="text-green-400">12 条</span>
            </div>
            <div className="flex justify-between">
              <span>待审核</span>
              <span className="text-yellow-400">3 条</span>
            </div>
            <div className="flex justify-between">
              <span>模型状态</span>
              <span className="text-blue-400">正常</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
