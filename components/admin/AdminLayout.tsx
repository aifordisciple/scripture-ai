'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
  Mail,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/churches', label: '小组管理', icon: Building2 },
  { href: '/admin/messages', label: '私信管理', icon: Mail },
  { href: '/admin/feedback', label: '反馈管理', icon: MessageSquare },
  { href: '/admin/announcements', label: '公告管理', icon: Bell },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // 关闭移动端菜单当路由变化
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 根据屏幕宽度自动折叠侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 移动端遮罩 */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col transition-all duration-300",
          "fixed md:relative z-50 h-full",
          // 桌面端
          collapsed ? "md:w-16" : "md:w-64",
          // 移动端
          mobileMenuOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!collapsed && (
            <span className="font-semibold text-lg text-[#0066cc]">管理后台</span>
          )}
          {/* 移动端关闭按钮 */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 md:hidden transition-colors"
          >
            <X size={20} />
          </button>
          {/* 桌面端折叠按钮 */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hidden md:block transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-[#0066cc]/5 text-[#0066cc]"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={20} className="shrink-0" />
                    {(!collapsed || mobileMenuOpen) && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title={collapsed ? "返回前台" : undefined}
          >
            <Home size={20} className="shrink-0" />
            {(!collapsed || mobileMenuOpen) && <span>返回前台</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 shrink-0">
          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 md:hidden mr-3 transition-colors"
          >
            <Menu size={22} />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm overflow-x-auto">
            <Link href="/admin" className="text-slate-500 hover:text-slate-700 whitespace-nowrap">
              管理后台
            </Link>
            {pathname !== '/admin' && (
              <>
                <span className="text-slate-400">/</span>
                <span className="text-slate-900 font-medium whitespace-nowrap">
                  {navItems.find(item => item.href === pathname)?.label || ''}
                </span>
              </>
            )}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}