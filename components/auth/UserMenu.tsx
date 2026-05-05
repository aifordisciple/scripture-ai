// components/auth/UserMenu.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useBibleStore } from "@/store/useBibleStore";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { UserCircle, LogOut, Settings, Loader2, Calendar, BrainCircuit, Flame, Shield, Users, BarChart3, Bell, MessageSquare, BookOpen, ChevronRight, Highlighter, StickyNote, Star } from "lucide-react";
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
    streakCount,
    tabs,
    setActiveTab,
    addTab
  } = useBibleStore();
  const { totalUnread: groupUnread } = useGroupUnread();

  const [isOpen, setIsOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const subMenuTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 检测移动端
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSubMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
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
        className="text-foreground dark:text-foreground/80 gap-2"
      >
        <UserCircle className="w-5 h-5" />
        <span className="hidden sm:inline">{t('auth.login')}</span>
      </Button>
    );
  }

  // 已登录
  const userInitial = session.user?.name?.[0]?.toUpperCase() || "U";

  const openTab = (type: string) => {
    setIsOpen(false);
    setSubMenuOpen(false);
    const { tabs, setActiveTab, addTab } = useBibleStore.getState();
    const existTab = tabs.find((tab: any) => tab.type === type);
    if (existTab) setActiveTab(existTab.id);
    else addTab({ type: type as any });
  };

  // Sub-menu items for "我的"
  const mySubMenuItems = [
    { key: 'highlights', icon: <Highlighter className="w-4 h-4 text-primary" />, label: t('auth.myHighlights') },
    { key: 'notes', icon: <StickyNote className="w-4 h-4 text-primary" />, label: t('auth.myNotes') },
    { key: 'insights', icon: <Star className="w-4 h-4 text-primary" />, label: t('auth.myFavorites') },
    { key: 'sermon', icon: <BookOpen className="w-4 h-4 text-primary" />, label: t('auth.mySermons') },
  ];

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="rounded-full bg-primary/10 text-primary dark:text-primary border-2 border-transparent hover:border-primary/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold">{userInitial}</span>
      </Button>

      {isOpen && createPortal(
        <>
          {/* 移动端遮罩 */}
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/30 z-[9998] animate-in fade-in duration-200"
              onClick={() => { setIsOpen(false); setSubMenuOpen(false); }}
            />
          )}
          <div
            ref={menuRef}
            className={cn(
              "fixed bg-white/80 dark:bg-card/80 backdrop-blur-xl saturate-[1.8] rounded-lg border border-border dark:border-border py-2 z-[9999] animate-in duration-200",
              isMobile
                ? "bottom-0 left-0 right-0 rounded-b-none max-h-[80vh] overflow-y-auto slide-in-from-bottom duration-300 w-full"
                : "fade-in zoom-in-95 w-56"
            )}
            style={!isMobile ? { top: menuPosition.top, right: menuPosition.right } : undefined}
          >
          {/* 移动端拖拽指示条 */}
          {isMobile && (
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-apple-chip/30 dark:bg-apple-chip/20 rounded-full" />
            </div>
          )}
          <div className="px-4 py-3 border-b border-border dark:border-border mb-2 bg-secondary/50 dark:bg-card/30 flex items-center gap-3">
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-bold text-primary dark:text-primary">{userInitial}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground dark:text-foreground truncate">{session.user?.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{session.user?.email}</p>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="px-2 mb-2">
            <button
              onClick={() => openTab('dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-primary dark:text-primary bg-primary/5 hover:bg-primary/10 active:scale-95 rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="flex-1 text-left">{t('auth.dashboard')}</span>
              {streakCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">{streakCount}</span>
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
            icon={<BrainCircuit className="w-4 h-4 text-primary" />}
            label={t('auth.aiModelApiSettings')}
            onClick={() => { setIsOpen(false); setApiSettingsOpen(true); }}
          />

          <div className="my-1 border-t border-border dark:border-border" />

          {/* 通知中心 */}
          <MenuItem
            icon={<Bell className="w-4 h-4 text-primary" />}
            label={t('auth.notifications')}
            onClick={() => { setIsOpen(false); setNotificationOpen(true); }}
          />

          <MenuItem
            icon={<Calendar className="w-4 h-4 text-primary" />}
            label={t('auth.readingPlan')}
            onClick={() => openTab('plan')}
          />

          <MenuItem
            icon={<Users className="w-4 h-4 text-primary" />}
            label={t('auth.groupReading')}
            onClick={() => openTab('group')}
            rightElement={groupUnread > 0 ? (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {groupUnread > 99 ? '99+' : groupUnread}
              </span>
            ) : undefined}
          />

          <div className="my-1 border-t border-border dark:border-border" />

          {/* "我的" 子菜单 */}
          <div className="relative">
            <button
              className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-foreground dark:text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left"
              onClick={() => {
                if (isMobile) {
                  setSubMenuOpen(!subMenuOpen);
                }
              }}
              onMouseEnter={() => {
                if (!isMobile) {
                  if (subMenuTimerRef.current) clearTimeout(subMenuTimerRef.current);
                  setSubMenuOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (!isMobile) {
                  subMenuTimerRef.current = setTimeout(() => setSubMenuOpen(false), 150);
                }
              }}
            >
              <UserCircle className="w-4 h-4 text-primary" />
              <span className="flex-1">{t('auth.myMenu')}</span>
              <ChevronRight className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                subMenuOpen && isMobile && "rotate-90"
              )} />
            </button>

            {/* Sub-menu: 移动端内联展开，桌面端左侧飞出 */}
            {subMenuOpen && isMobile && (
              <div className="bg-secondary/80 dark:bg-card/30 border-t border-b border-border dark:border-border">
                {mySubMenuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => openTab(item.key)}
                    className="w-full flex items-center gap-3 px-5 pl-9 py-2.5 text-sm text-foreground dark:text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {subMenuOpen && !isMobile && (
              <div
                ref={subMenuRef}
                className="absolute right-full top-0 mr-1 bg-white/80 dark:bg-card/80 backdrop-blur-xl saturate-[1.8] rounded-lg border border-border dark:border-border py-2 z-[10000] w-44 animate-in fade-in zoom-in-95 duration-150"
                onMouseEnter={() => {
                  if (subMenuTimerRef.current) clearTimeout(subMenuTimerRef.current);
                }}
                onMouseLeave={() => {
                  subMenuTimerRef.current = setTimeout(() => setSubMenuOpen(false), 150);
                }}
              >
                {mySubMenuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => openTab(item.key)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground dark:text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="my-1 border-t border-border dark:border-border" />

          {/* 反馈 */}
          <MenuItem
            icon={<MessageSquare className="w-4 h-4 text-primary" />}
            label={t('auth.feedback')}
            onClick={() => { setIsOpen(false); setFeedbackDialogOpen(true); }}
          />

          {/* Admin */}
          {isAdmin && (
            <>
              <div className="my-1 border-t border-border dark:border-border" />
              <Link href="/admin/feedback" onClick={() => setIsOpen(false)}>
                <div className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-foreground dark:text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left">
                  <Shield className="w-4 h-4 text-primary" />
                  {t('auth.feedbackManagement')}
                  <span className="ml-auto text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary">Admin</span>
                </div>
              </Link>
            </>
          )}

          <div className="my-1 border-t border-border dark:border-border" />

          <MenuItem
            icon={<LogOut className="w-4 h-4" />}
            label={t('auth.logout')}
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = '/';
            }}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
          />
        </div>
        </>,
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
        "w-full flex items-center gap-3 px-5 py-2.5 text-sm text-foreground dark:text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-colors text-left",
 className
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {rightElement}
    </button>
  );
}