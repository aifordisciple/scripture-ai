"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Bell,
  Settings,
  MessageCircle,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  Home,
  Mail,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/churches", label: "小组管理", icon: Building2 },
  { href: "/admin/messages", label: "私信管理", icon: Mail },
  { href: "/admin/feedback", label: "反馈管理", icon: MessageCircle },
  { href: "/admin/announcements", label: "公告管理", icon: Bell },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 flex flex-col
          bg-card dark:bg-card border-r border-border
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">AI</span>
            </div>
            <span className="apple-headline text-lg">AI读 · 管理</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-2 rounded-md hover:bg-accent active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 min-h-[44px] rounded-md
                    transition-all duration-150 active:scale-95
                    ${
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-[15px]">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-95 text-[15px]"
          >
            <span>← 返回主站</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — glassmorphism */}
        <header className="glass-nav sticky top-0 z-30 h-16 flex items-center px-6 border-b border-border">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 ml-2 lg:ml-0">
            <span className="text-muted-foreground text-[15px]">管理后台</span>
            {pathname !== "/admin" && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground text-[15px] font-semibold">
                  {navItems.find((i) => isActive(i.href))?.label || ""}
                </span>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-accent active:scale-95 transition-all duration-150"
              aria-label="切换深色模式"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}