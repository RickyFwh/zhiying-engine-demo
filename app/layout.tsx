import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: '智营引擎 - AI市场运营Agent',
  description: 'AI驱动的市场运营全链路自动化决策与执行系统',
};

const globalStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0f172a; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; }
a { color: inherit; text-decoration: none; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1e293b; }
::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }

/* Layout */
.app-layout { display: flex; min-height: 100vh; }
.main-content { flex: 1; overflow: auto; }
.main-inner { padding: 2rem; max-width: 80rem; margin: 0 auto; }

/* Sidebar */
.sidebar { width: 16rem; background: #0f172a; border-right: 1px solid #1e293b; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; }
.sidebar-logo { padding: 1.5rem; border-bottom: 1px solid #1e293b; }
.sidebar-logo h1 { font-size: 1.125rem; font-weight: 700; color: white; }
.sidebar-logo p { font-size: 0.75rem; color: #94a3b8; }
.sidebar-nav { flex: 1; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
.sidebar-nav a { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.5rem; color: #94a3b8; transition: all 0.15s; font-weight: 500; font-size: 0.9rem; }
.sidebar-nav a:hover { color: white; background: rgba(255,255,255,0.05); }
.sidebar-nav a.active { background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
.logo-icon { background: linear-gradient(135deg, #3b82f6, #9333ea); border-radius: 0.75rem; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
.status-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #4ade80; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Flex/Grid */
.flex { display: flex; } .flex-col { flex-direction: column; } .flex-1 { flex: 1; } .flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; } .items-start { align-items: flex-start; } .items-end { align-items: flex-end; }
.justify-between { justify-content: space-between; } .justify-center { justify-content: center; }
.gap-1 { gap: 0.25rem; } .gap-2 { gap: 0.5rem; } .gap-3 { gap: 0.75rem; } .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; }
.grid { display: grid; } .grid-cols-2 { grid-template-columns: repeat(2, 1fr); } .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); } .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }

/* Spacing */
.p-3 { padding: 0.75rem; } .p-4 { padding: 1rem; } .p-5 { padding: 1.25rem; } .p-6 { padding: 1.5rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; } .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; } .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.mb-1 { margin-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; } .mb-4 { margin-bottom: 1rem; }
.mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-4 { margin-top: 1rem; }
.mx-auto { margin-left: auto; margin-right: auto; } .ml-1 { margin-left: 0.25rem; } .ml-2 { margin-left: 0.5rem; }
.pt-2 { padding-top: 0.5rem; } .pt-3 { padding-top: 0.75rem; }

/* Cards */
.card { background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.25rem; transition: border-color 0.15s; }
.card:hover { border-color: #475569; }
.card-blue { background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.03)); border-color: rgba(59,130,246,0.3); }
.card-green { background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.03)); border-color: rgba(34,197,94,0.3); }
.card-purple { background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.03)); border-color: rgba(168,85,247,0.3); }
.card-yellow { background: linear-gradient(135deg, rgba(250,204,21,0.15), rgba(250,204,21,0.03)); border-color: rgba(250,204,21,0.3); }

/* Buttons */
.btn-primary { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; border: none; cursor: pointer; transition: background 0.15s; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: #334155; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; border: none; cursor: pointer; transition: background 0.15s; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.btn-secondary:hover { background: #475569; }
.btn-success { background: #16a34a; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; flex: 1; justify-content: center; }
.btn-success:hover { background: #22c55e; }
.btn-danger { background: #dc2626; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; flex: 1; justify-content: center; }
.btn-danger:hover { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Inputs */
.input, select.input, textarea.input { background: #1e293b; border: 1px solid #475569; border-radius: 0.5rem; padding: 0.5rem 0.75rem; color: white; font-size: 0.875rem; width: 100%; outline: none; transition: border-color 0.15s; }
.input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
select.input { appearance: none; cursor: pointer; }
textarea.input { resize: none; }

/* Badges */
.badge { display: inline-flex; align-items: center; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
.badge-blue { background: rgba(59,130,246,0.2); color: #60a5fa; }
.badge-green { background: rgba(34,197,94,0.2); color: #4ade80; }
.badge-yellow { background: rgba(250,204,21,0.2); color: #facc15; }
.badge-red { background: rgba(248,113,113,0.2); color: #f87171; }
.badge-purple { background: rgba(168,85,247,0.2); color: #c084fc; }

/* Text */
.text-xs { font-size: 0.75rem; } .text-sm { font-size: 0.875rem; } .text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; } .text-2xl { font-size: 1.5rem; } .text-3xl { font-size: 1.875rem; }
.font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; }
.text-white { color: white; } .text-slate-200 { color: #cbd5e1; } .text-slate-300 { color: #cbd5e1; }
.text-slate-400 { color: #94a3b8; } .text-slate-500 { color: #64748b; }
.text-blue-400 { color: #60a5fa; } .text-green-400 { color: #4ade80; } .text-yellow-400 { color: #facc15; }
.text-red-400 { color: #f87171; } .text-purple-400 { color: #c084fc; } .text-red-300 { color: #fca5a5; }

/* Misc */
.w-full { width: 100%; } .h-20 { height: 5rem; }
.rounded { border-radius: 0.25rem; } .rounded-lg { border-radius: 0.5rem; } .rounded-full { border-radius: 9999px; }
.border-t { border-top: 1px solid #334155; } .border-b { border-bottom: 1px solid #334155; }
.opacity-30 { opacity: 0.3; } .cursor-pointer { cursor: pointer; } .text-center { text-align: center; }
.text-right { text-align: right; } .whitespace-pre-wrap { white-space: pre-wrap; } .leading-relaxed { line-height: 1.625; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.shrink-0 { flex-shrink: 0; } .overflow-auto { overflow: auto; } .overflow-hidden { overflow: hidden; }
.sticky { position: sticky; } .top-8 { top: 2rem; } .max-h-80 { max-height: 20rem; }
.transition-all { transition: all 0.15s; }
.animate-spin { animation: spin 1s linear infinite; }
.block { display: block; }
.space-y-1 > * + * { margin-top: 0.25rem; } .space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-3 > * + * { margin-top: 0.75rem; } .space-y-4 > * + * { margin-top: 1rem; }
.space-y-8 > * + * { margin-top: 2rem; }

/* Confidence bar */
.confidence-bar { height: 6px; background: #334155; border-radius: 3px; overflow: hidden; margin-top: 0.5rem; }
.confidence-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #22c55e); border-radius: 3px; transition: width 0.5s; }

/* Table */
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-weight: 500; color: #94a3b8; padding: 0.5rem 0; border-bottom: 1px solid #334155; font-size: 0.875rem; }
td { padding: 0.75rem 0; border-bottom: 1px solid #1e293b; font-size: 0.875rem; }
tr:hover td { background: rgba(30,41,59,0.5); }

/* Filter buttons */
.filter-btn { padding: 0.375rem 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; border: none; cursor: pointer; transition: all 0.15s; background: #1e293b; color: #94a3b8; }
.filter-btn:hover { color: white; }
.filter-btn.active { background: #2563eb; color: white; }

/* Pipeline Enhanced Animations */
@keyframes borderPulse {
  0%, 100% { border-color: rgba(59,130,246,0.9); box-shadow: 0 0 12px rgba(59,130,246,0.2); }
  50% { border-color: rgba(59,130,246,0.4); box-shadow: 0 0 24px rgba(59,130,246,0.4); }
}
@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
@keyframes timelinePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
  50% { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes progressShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes checkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.step-card-pending { border: 2px dashed #475569 !important; }
.step-card-running { animation: borderPulse 1.5s ease-in-out infinite; border: 2px solid #3b82f6 !important; }
.step-card-done { border: 2px solid rgba(34,197,94,0.7) !important; }

.loading-dots { display: inline-flex; gap: 4px; align-items: center; }
.loading-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #60a5fa; animation: dotPulse 1.4s ease-in-out infinite; }
.loading-dot:nth-child(2) { animation-delay: 0.16s; }
.loading-dot:nth-child(3) { animation-delay: 0.32s; }

.tl-node { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #475569; background: #1e293b; transition: all 0.4s ease; position: relative; z-index: 1; }
.tl-node-done { background: #22c55e; border-color: #22c55e; }
.tl-node-running { background: #3b82f6; border-color: #3b82f6; animation: timelinePulse 1.5s ease-in-out infinite; }

.md-content h1 { font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin: 1rem 0 0.5rem; }
.md-content h2 { font-size: 1.125rem; font-weight: 700; color: #f1f5f9; margin: 0.875rem 0 0.5rem; border-bottom: 1px solid #334155; padding-bottom: 0.375rem; }
.md-content h3 { font-size: 1rem; font-weight: 600; color: #e2e8f0; margin: 0.75rem 0 0.375rem; }
.md-content h4 { font-size: 0.9375rem; font-weight: 600; color: #e2e8f0; margin: 0.5rem 0 0.25rem; }
.md-content ul, .md-content ol { padding-left: 1.5rem; margin: 0.5rem 0; }
.md-content ul { list-style: disc; }
.md-content ol { list-style: decimal; }
.md-content li { margin: 0.3rem 0; line-height: 1.65; color: #cbd5e1; }
.md-content pre { background: rgba(15,23,42,0.8); padding: 0.875rem 1rem; border-radius: 0.5rem; margin: 0.625rem 0; overflow-x: auto; border: 1px solid #334155; }
.md-content pre code { background: transparent; padding: 0; font-size: 0.8125rem; color: #e2e8f0; }
.md-content code { background: rgba(59,130,246,0.15); color: #93c5fd; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.85em; }
.md-content strong { color: #f1f5f9; font-weight: 600; }
.md-content em { color: #c084fc; font-style: italic; }
.md-content p { margin: 0.5rem 0; color: #cbd5e1; line-height: 1.7; }
.md-content hr { border: none; border-top: 1px solid #334155; margin: 1rem 0; }
.md-content blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; margin: 0.5rem 0; color: #94a3b8; }
.md-content table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
.md-content th, .md-content td { border: 1px solid #334155; padding: 0.375rem 0.75rem; text-align: left; font-size: 0.8125rem; }
.md-content th { background: rgba(30,41,59,0.8); color: #94a3b8; font-weight: 600; }

.fade-in-up { animation: fadeInUp 0.4s ease forwards; }
.check-pop { animation: checkPop 0.3s ease forwards; }

.progress-track { height: 6px; background: #1e293b; border-radius: 9999px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 9999px; transition: width 0.6s ease; background: linear-gradient(90deg, #3b82f6, #6366f1, #22c55e); background-size: 200% 100%; animation: progressShimmer 2s linear infinite; }

.timeline-line { width: 2px; background: #334155; position: absolute; left: 6px; top: 0; bottom: 0; }
.timeline-line-fill { width: 2px; background: linear-gradient(180deg, #22c55e, #3b82f6); position: absolute; left: 6px; top: 0; transition: height 0.5s ease; }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <div className="main-inner">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
