// components/auth/UserMenu.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useBibleStore } from "@/store/useBibleStore";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut, Settings, Loader2, Calendar, BrainCircuit, Flame, Shield, Users, BarChart3, Bell, MessageSquare, BookOpen } from "lucide-react";
import { ApiSettingsDialog } from "@/components/settings/ApiSettingsDialog";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { NotificationDialog } from "@/components/common/NotificationDialog";
import { useGroupUnread } from "@/hooks/use-group-unread";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const {
    setAuthOpen,
    setMobileSettingsOpen,
    streakCount, // 连续阅读天数
    tabs,
    setActiveTab,
    addTab
  } = useBibleStore();
  const { totalUnread: groupUnread } = useGroupUnread();

  const [isOpen, setIsOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);  const [isAdmin, setIsAdmin] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 更新菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

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
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
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
        <span className="hidden sm:inline">{t('auth.login')}</span>
      </Button>
    );
  }

  // 已登录
  const userInitial = session.user?.name?.[0]?.toUpperCase() || "U";

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-2 border-transparent hover:border-blue-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold">{userInitial}</span>
      </Button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-white dark:bg-slate-900 rounded-xl shadow-xl border dark:border-slate-800 py-2 z-[9999] animate-in fade-in zoom-in-95 duration-200 w-56"
          style={{ top: menuPosition.top, right: menuPosition.right }}
        >
          <div className="px-4 py-3 border-b dark:border-slate-800 mb-2 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-3">
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                <span className="font-bold text-blue-700 dark:text-blue-200">{userInitial}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{session.user?.name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{session.user?.email}</p>
            </div>
          </div>

          {/* 快捷入口 */}
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
              <BarChart3 className="w-4 h-4" />
              <span className="flex-1 text-left">{t('auth.dashboard')}</span>
              {streakCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streakCount}</span>
                </div>
              )}
            </button>
          </div>

          <MenuItem
            icon={<Settings className="w-4 h-4" />}
            label={t('auth.settings')}
            onClick={() => { setIsOpen(false); setMobileSettingsOpen(true); }}
          />
          <MenuItem
            icon={<BrainCircuit className="w-4 h-4 text-indigo-500" />}
            label={t('auth.aiModelApiSettings')}
            onClick={() => { setIsOpen(false); setApiSettingsOpen(true); }}
          />

          <div className="my-1 border-t dark:border-slate-800" />

          {/* 通知中心 */}
          <MenuItem
            icon={<Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            label={t('auth.notifications')}
            onClick={() => { setIsOpen(false); setNotificationOpen(true); }}
          />

          <MenuItem
            icon={<Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            label={t('auth.readingPlan')}
            onClick={() => {
              setIsOpen(false);
              const { tabs, setActiveTab, addTab } = useBibleStore.getState();
              const existTab = tabs.find(t => t.type === 'plan');
              if (existTab) setActiveTab(existTab.id);
              else addTab({ type: 'plan' });
            }}
          />

          <MenuItem
            icon={<BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
            label={t('auth.mySermons')}
            onClick={() => {
              setIsOpen(false);
              const { tabs, setActiveTab, addTab } = useBibleStore.getState();
              const existTab = tabs.find((t: any) => t.type === 'sermon');
              if (existTab) setActiveTab(existTab.id);
              else addTab({ type: 'sermon' as any });
            }}
          />

          <MenuItem
            icon={<Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            label={t('auth.groupReading')}
            onClick={() => {
              setIsOpen(false);
              const groupTab = tabs.find(t => t.type === 'group');
              if (groupTab) setActiveTab(groupTab.id);
              else addTab({ type: 'group' });
            }}
            rightElement={groupUnread > 0 ? (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {groupUnread > 99 ? '99+' : groupUnread}
              </span>
            ) : undefined}
          />

          <div className="my-1 border-t dark:border-slate-800" />

          {/* 反馈 */}
          <MenuItem
            icon={<MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />}
            label={t('auth.feedback')}
            onClick={() => { setIsOpen(false); setFeedbackDialogOpen(true); }}
          />

          {/* Admin */}
          {isAdmin && (
            <>
              <div className="my-1 border-t dark:border-slate-800" />
              <Link href="/admin/feedback" onClick={() => setIsOpen(false)}>
                <div className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  {t('auth.feedbackManagement')}
                  <span className="ml-auto text-[10px] bg-purple-200 dark:bg-purple-800 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-300">Admin</span>
                </div>
              </Link>
            </>
          )}

          <div className="my-1 border-t dark:border-slate-800" />

          <MenuItem
            icon={<LogOut className="w-4 h-4" />}
            label={t('auth.logout')}
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = '/';
            }}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
          />
        </div>,
        document.body
      )}

      <ApiSettingsDialog open={apiSettingsOpen} onOpenChange={setApiSettingsOpen} />
      <FeedbackDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen} />
      <NotificationDialog open={notificationOpen} onOpenChange={setNotificationOpen} />
    </>
  );
}

function MenuItem({ icon, label, onClick, className, rightElement }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left",
        className
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {rightElement}
    </button>
  );
}