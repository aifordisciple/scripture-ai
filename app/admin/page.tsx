// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, Building2, MessageSquare, Activity, TrendingUp, AlertCircle, BookOpen, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日活跃"
          value={stats.users.activeToday}
          icon={Activity}
          color="bg-green-500"
        />
        <StatCard
          title="新增用户（今日）"
          value={stats.users.newToday}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="待处理反馈"
          value={stats.feedback.open}
          icon={MessageSquare}
          color="bg-orange-500"
        />
        <StatCard
          title="活跃计划"
          value={stats.plans.active}
          icon={Building2}
          color="bg-purple-500"
        />
      </div>

      {/* 用户统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          用户统计
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem label="总用户数" value={stats.users.total} />
          <StatItem label="今日新增" value={stats.users.newToday} color="green" />
          <StatItem label="本周新增" value={stats.users.newThisWeek} color="green" />
          <StatItem label="今日活跃" value={stats.users.activeToday} color="blue" />
        </div>

        {/* 用户增长趋势图 */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-4">近7日用户增长趋势</h3>
          <div className="h-48 flex items-end gap-2">
            {stats.activity.newUsersDaily.map((day, i) => {
              const maxCount = Math.max(...stats.activity.newUsersDaily.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      {day.count > 0 && (
                        <div className="text-center text-xs text-white font-medium py-1">
                          {day.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 小组统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="text-purple-600" size={20} />
          小组统计
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <StatItem label="总小组数" value={stats.churches.total} />
          <StatItem label="公开小组" value={stats.churches.publicCount} />
          <StatItem label="总成员数" value={stats.churches.totalMembers} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 读经计划统计 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="text-orange-600" size={20} />
            读经计划统计
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <StatItem label="进行中计划" value={stats.plans.active} color="indigo" />
            <StatItem label="已完成计划" value={stats.plans.completed} color="gray" />
          </div>
        </div>

        {/* 反馈统计 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            反馈统计
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.feedback.total}</div>
              <div className="text-sm text-gray-600">总计</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.feedback.open}</div>
              <div className="text-sm text-gray-600">待处理</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.feedback.inProgress}</div>
              <div className="text-sm text-gray-600">处理中</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.feedback.resolved}</div>
              <div className="text-sm text-gray-600">已解决</div>
            </div>
          </div>
        </div>
      </div>

      {/* 活跃度趋势 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="text-teal-600" size={20} />
          近7日活跃用户
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
                      <div className="text-center text-xs text-white font-medium py-1">
                        {day.count}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
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
  color?: 'default' | 'green' | 'blue' | 'orange' | 'indigo' | 'gray';
}) {
  const colorClasses = {
    default: 'text-gray-900',
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
    gray: 'text-gray-600'
  };

  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className={cn("text-3xl font-bold", colorClasses[color])}>{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}