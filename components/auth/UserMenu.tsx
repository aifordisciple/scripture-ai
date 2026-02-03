// components/auth/UserMenu.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useBibleStore } from "@/store/useBibleStore";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut, Settings, BookMarked, FileText, Image as ImageIcon, Moon, Sun, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { data: session, status } = useSession();
  const { setAuthOpen, isDarkMode, toggleDarkMode, setAiOpen } = useBibleStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-xl border dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b dark:border-slate-800 mb-2">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{session.user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
          </div>

          <MenuItem icon={<Settings className="w-4 h-4" />} label="阅读设置" onClick={() => { setIsOpen(false); /* 触发设置面板逻辑，可通过 prop 或 store 传递 */ }} />
          <MenuItem icon={isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>} label={isDarkMode ? "浅色模式" : "深色模式"} onClick={toggleDarkMode} />
          
          <div className="my-1 border-t dark:border-slate-800" />
          
          <MenuItem icon={<BookMarked className="w-4 h-4" />} label="我的高亮" onClick={() => alert("功能开发中...")} />
          <MenuItem icon={<FileText className="w-4 h-4" />} label="我的笔记" onClick={() => alert("功能开发中...")} />
          <MenuItem icon={<ImageIcon className="w-4 h-4" />} label="我的经文卡片" onClick={() => alert("功能开发中...")} />
          
          <div className="my-1 border-t dark:border-slate-800" />
          
          <MenuItem 
            icon={<LogOut className="w-4 h-4" />} 
            label="退出登录" 
            onClick={() => signOut()} 
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left", 
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}
