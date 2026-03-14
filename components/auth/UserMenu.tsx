// components/auth/UserMenu.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useBibleStore } from "@/store/useBibleStore";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut, Settings, BookMarked, FileText, Image as ImageIcon, Moon, Sun, Loader2, LayoutDashboard, Calendar, BrainCircuit, Flame, Shield, MessageSquare } from "lucide-react";
import { ApiSettingsDialog } from "@/components/settings/ApiSettingsDialog";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();
  const {
    setAuthOpen,
    isDarkMode,
    toggleDarkMode,
    setMobileSettingsOpen,
    setDashboardOpen, // [新增] 引入看板开关方法
    streakCount // 连续阅读天数
  } = useBibleStore();

  const [isOpen, setIsOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => setIsAdmin(data.role === 'admin'))
        .catch(() => {});
    }
  }, [session?.user?.id]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 加载中
  if (status === "loading") {
    return <Button variant="ghost" size="icon" disabled><Loader2 className="w-5 h-5 animate-spin" /></Button>;
  }

  // 未登录
  if (!session) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setAuthOpen(true)}
        className="text-slate-600 dark:text-slate-300 gap-2"
      >
        <UserCircle className="w-5 h-5" />
        <span className="hidden sm:inline">登录</span>
      </Button>
    );
  }

  // 已登录
  const userInitial = session.user?.name?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-2 border-transparent hover:border-blue-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold">{userInitial}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b dark:border-slate-800 mb-2 bg-slate-50/50 dark:bg-slate-800/20">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{session.user?.name}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{session.user?.email}</p>
          </div>

          {/* 个人数据看板入口 */}
          <div className="px-2 mb-2">
            <button
              onClick={() => {
                setIsOpen(false);
                const { tabs, setActiveTab, addTab } = useBibleStore.getState();
                const existTab = tabs.find(t => t.type === 'dashboard');
                if (existTab) setActiveTab(existTab.id);
                else addTab({ type: 'dashboard' });
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="flex-1 text-left">个人数据看板</span>
              {/* 火焰徽章 - 显示连续阅读天数 */}
              {streakCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streakCount}</span>
                </div>
              )}
              <span className="text-[10px] bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-300">D</span>
            </button>
          </div>

          <MenuItem 
            icon={<Settings className="w-4 h-4" />} 
            label="阅读设置" 
            onClick={() => { setIsOpen(false); setMobileSettingsOpen(true); }} 
          />
          <MenuItem 
            icon={<BrainCircuit className="w-4 h-4 text-indigo-500" />} 
            label="AI 模型与接口设置" 
            onClick={() => { setIsOpen(false); setApiSettingsOpen(true); }} 
          />
          <MenuItem 
            icon={isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>} 
            label={isDarkMode ? "浅色模式" : "深色模式"} 
            onClick={toggleDarkMode} 
          />
          
          <div className="my-1 border-t dark:border-slate-800" />
          
          <MenuItem 
            icon={<BookMarked className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />} 
            label="我的高亮" 
            onClick={() => { 
              setIsOpen(false); 
              const { tabs, setActiveTab, addTab } = useBibleStore.getState();
              const existTab = tabs.find(t => t.type === 'highlights');
              if (existTab) setActiveTab(existTab.id);
              else addTab({ type: 'highlights' });
            }} 
          />
          <MenuItem
            icon={<FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            label="我的笔记"
            onClick={() => {
              setIsOpen(false);
              const { tabs, setActiveTab, addTab } = useBibleStore.getState();
              const existTab = tabs.find(t => t.type === 'notes');
              if (existTab) setActiveTab(existTab.id);
              else addTab({ type: 'notes' });
            }}
          />

          <div className="my-1 border-t dark:border-slate-800" />

          <MenuItem
            icon={<Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            label="读经计划"
            onClick={() => {
              setIsOpen(false);
              const { tabs, setActiveTab, addTab } = useBibleStore.getState();
              const existTab = tabs.find(t => t.type === 'plans');
              if (existTab) setActiveTab(existTab.id);
              else addTab({ type: 'plans' });
            }}
          />

          <div className="my-1 border-t dark:border-slate-800" />

          {/* Admin Menu Items */}
          {isAdmin && (
            <>
              <Link href="/admin/feedback" onClick={() => setIsOpen(false)}>
                <div className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  反馈管理
                  <span className="ml-auto text-[10px] bg-purple-200 dark:bg-purple-800 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-300">Admin</span>
                </div>
              </Link>
              <div className="my-1 border-t dark:border-slate-800" />
            </>
          )}

          <MenuItem icon={<ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />} label="经文卡片" onClick={() => alert("功能开发中...")} />
          
          <div className="my-1 border-t dark:border-slate-800" />
          
          <MenuItem
            icon={<LogOut className="w-4 h-4" />}
            label="退出登录"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
          />
        </div>
      )}
      
      <ApiSettingsDialog open={apiSettingsOpen} onOpenChange={setApiSettingsOpen} />
    </div>
  );
}

function MenuItem({ icon, label, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left", 
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}