// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, Building2, MessageSquare, Activity, TrendingUp, AlertCircle, BookOpen, Target, Calendar, Eye, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateClient } from '@/lib/locale';
import { useTranslation } from '@/lib/i18n';

interface Stats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    activeToday: number;
  };
  churches: {
    total: number;
    publicCount: number;
    totalMembers: number;
  };
  feedback: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  plans: {
    active: number;
    completed: number;
  };
  activity: {
    recentCount: number;
    dailyActiveUsers: Array<{ date: string; count: number }>;
    newUsersDaily: Array<{ date: string; count: number }>;
  };
}

interface Analytics {
  today: { pv: number; uv: number };
  trend: Array<{ date: string; pv: number; uv: number }>;
  topPages: Array<{ path: string; count: number }>;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics?days=7');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      // 静默失败，不影响主流程
      console.debug('Analytics not available:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground apple-headline tracking-tight">{t('admin.dashboard')}</h1>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('admin.activeToday')}
          value={stats.users.activeToday}
          icon={Activity}
          color="bg-green-500/100"
        />
        <StatCard
          title={t('admin.newUsersToday')}
          value={stats.users.newToday}
          icon={TrendingUp}
          color="bg-primary/100"
        />
        <StatCard
          title={t('admin.pageViewsToday')}
          value={analytics?.today?.pv || 0}
          icon={Eye}
          color="bg-cyan-500"
        />
        <StatCard
          title={t('admin.visitorsToday')}
          value={analytics?.today?.uv || 0}
          icon={MousePointer}
          color="bg-pink-500"
        />
      </div>

      {/* 访问统计趋势图 */}
      {analytics && analytics.trend.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Eye className="text-cyan-600" size={20} />
            {t('admin.sevenDayVisitTrend')}
          </h2>

          <div className="h-48 flex items-end gap-2">
            {analytics.trend.map((day, i) => {
              const maxPV = Math.max(...analytics.trend.map(d => d.pv), 1);
              const height = (day.pv / maxPV) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      {day.pv > 0 && (
                        <div className="text-center text-xs text-white font-semibold py-1">
                          {day.pv}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateClient(new Date(day.date), { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* PV/UV 图例 */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan-500"></div>
              <span className="text-muted-foreground">{t('admin.pageViewsPV')}</span>
            </div>
            <div className="text-muted-foreground">|</div>
            <div className="text-muted-foreground">
              {t('admin.uniqueVisitorsUV')}: {analytics.trend.map(d => d.uv).reduce((a, b) => a + b, 0)} {t('admin.total')}
            </div>
          </div>
        </div>
      )}

      {/* 用户统计 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Users className="text-primary" size={20} />
          {t('admin.userStatistics')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem label={t('admin.totalUsers')} value={stats.users.total} />
          <StatItem label={t('admin.newToday')} value={stats.users.newToday} color="green" />
          <StatItem label={t('admin.newThisWeek')} value={stats.users.newThisWeek} color="green" />
          <StatItem label={t('admin.activeToday')} value={stats.users.activeToday} color="blue" />
        </div>

        {/* 用户增长趋势图 */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">{t('admin.sevenDayUserGrowthTrend')}</h3>
          <div className="h-48 flex items-end gap-2">
            {stats.activity.newUsersDaily.map((day, i) => {
              const maxCount = Math.max(...stats.activity.newUsersDaily.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      {day.count > 0 && (
                        <div className="text-center text-xs text-white font-semibold py-1">
                          {day.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateClient(new Date(day.date), { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 小组统计 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <BookOpen className="text-purple-600" size={20} />
          {t('admin.groupStatistics')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <StatItem label={t('admin.totalGroups')} value={stats.churches.total} />
          <StatItem label={t('admin.publicGroups')} value={stats.churches.publicCount} />
          <StatItem label={t('admin.totalMembers')} value={stats.churches.totalMembers} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 读经计划统计 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Target className="text-amber-600 dark:text-amber-400" size={20} />
            {t('admin.readingPlanStatistics')}
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <StatItem label={t('admin.activePlans')} value={stats.plans.active} color="blue" />
            <StatItem label={t('admin.completedPlans')} value={stats.plans.completed} color="muted" />
          </div>
        </div>

        {/* 反馈统计 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            {t('admin.feedbackStatistics')}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-semibold">{stats.feedback.total}</div>
              <div className="text-sm text-muted-foreground">{t('admin.total')}</div>
            </div>
            <div className="text-center p-4 bg-amber-500/10 rounded-lg">
              <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{stats.feedback.open}</div>
              <div className="text-sm text-muted-foreground">{t('admin.pending')}</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-semibold text-primary">{stats.feedback.inProgress}</div>
              <div className="text-sm text-muted-foreground">{t('admin.inProgress')}</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.feedback.resolved}</div>
              <div className="text-sm text-muted-foreground">{t('admin.resolved')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 活跃度趋势 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Calendar className="text-teal-600" size={20} />
          {t('admin.sevenDayActiveUsers')}
        </h2>

        <div className="h-48 flex items-end gap-2">
          {stats.activity.dailyActiveUsers.map((day, i) => {
            const maxCount = Math.max(...stats.activity.dailyActiveUsers.map(d => d.count), 1);
            const height = (day.count / maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    {day.count > 0 && (
                      <div className="text-center text-xs text-white font-semibold py-1">
                        {day.count}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDateClient(new Date(day.date), { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 统计卡片组件
function StatCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg text-white", color)}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

// 统计项组件
function StatItem({
  label,
  value,
  color = 'default'
}: {
  label: string;
  value: number;
  color?: 'default' | 'green' | 'blue' | 'orange' | 'muted';
}) {
  const colorClasses = {
    default: 'text-foreground',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-primary',
    orange: 'text-amber-600 dark:text-amber-400',
    muted: 'text-muted-foreground'
  };

  return (
    <div className="text-center p-4 bg-accent rounded-lg">
      <div className={cn("text-3xl font-semibold", colorClasses[color])}>{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}