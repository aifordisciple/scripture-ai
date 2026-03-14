'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/churches', label: '小组管理', icon: Building2 },
  { href: '/admin/feedback', label: '反馈管理', icon: MessageSquare },
  { href: '/admin/stats', label: '数据统计', icon: BarChart3 },
  { href: '/admin/announcements', label: '公告管理', icon: Bell },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <span className="font-bold text-lg text-indigo-600">管理后台</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
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
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title={collapsed ? "返回前台" : undefined}
          >
            <Home size={20} />
            {!collapsed && <span>返回前台</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              管理后台
            </Link>
            {pathname !== '/admin' && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">
                  {navItems.find(item => item.href === pathname)?.label || ''}
                </span>
              </>
            )}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}