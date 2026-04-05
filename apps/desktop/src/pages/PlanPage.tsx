// apps/desktop/src/pages/PlanPage.tsx
/**
 * Reading Plan page for desktop app
 *
 * Features:
 * - Available reading plans
 * - Daily reading schedule
 * - Progress tracking
 * - Check-in functionality
 * - Reading history with statistics
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Calendar, Check, ChevronRight, Clock, Target, Trophy, Flame, History, BookOpen } from 'lucide-react';
import { ReadingHistory } from '../components';

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  totalDays: number;
  category: 'bible' | 'topic' | 'devotional';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface PlanProgress {
  planId: string;
  currentDay: number;
  startedAt: string;
  lastCheckIn: string | null;
  streak: number;
  completed: boolean;
}

interface DailyReading {
  day: number;
  title: string;
  readings: {
    bookId: string;
    bookName: string;
    chapter: number;
    verseStart?: number;
    verseEnd?: number;
  }[];
  completed: boolean;
}

interface PlanPageProps {
  onNavigate?: (bookId: string, chapter: number) => void;
}

// Sample reading plans
const READING_PLANS: ReadingPlan[] = [
  {
    id: 'bible-in-year',
    name: '一年通读圣经',
    description: '365天读完整本圣经',
    totalDays: 365,
    category: 'bible',
    difficulty: 'medium',
  },
  {
    id: 'nt-in-90',
    name: '90天新约之旅',
    description: '90天读完新约全书',
    totalDays: 90,
    category: 'bible',
    difficulty: 'easy',
  },
  {
    id: 'psalms-30',
    name: '30天诗篇灵修',
    description: '精选诗篇每日灵修',
    totalDays: 30,
    category: 'devotional',
    difficulty: 'easy',
  },
  {
    id: 'gospels-60',
    name: '60天福音书',
    description: '深入阅读四福音书',
    totalDays: 60,
    category: 'bible',
    difficulty: 'medium',
  },
  {
    id: 'wisdom-21',
    name: '21天智慧之旅',
    description: '箴言与传道书精选',
    totalDays: 21,
    category: 'topic',
    difficulty: 'easy',
  },
];

// Generate daily readings for a plan
function generateDailyReadings(planId: string): DailyReading[] {
  const plan = READING_PLANS.find(p => p.id === planId);
  if (!plan) return [];

  const readings: DailyReading[] = [];

  // Simplified reading generation (real app would have proper schedule)
  if (planId === 'nt-in-90') {
    const ntBooks = [
      { id: 'mat', name: '马太福音', chapters: 28 },
      { id: 'mark', name: '马可福音', chapters: 16 },
      { id: 'luke', name: '路加福音', chapters: 24 },
      { id: 'john', name: '约翰福音', chapters: 21 },
      // ... more books
    ];

    let day = 1;
    for (const book of ntBooks) {
      for (let ch = 1; ch <= book.chapters && day <= plan.totalDays; ch++, day++) {
        readings.push({
          day,
          title: `${book.name} ${ch}章`,
          readings: [{ bookId: book.id, bookName: book.name, chapter: ch }],
          completed: false,
        });
      }
    }
  } else if (planId === 'psalms-30') {
    for (let day = 1; day <= 30; day++) {
      const psalm = day * 5; // Every 5th psalm
      readings.push({
        day,
        title: `诗篇 ${psalm}篇`,
        readings: [{ bookId: 'ps', bookName: '诗篇', chapter: psalm }],
        completed: false,
      });
    }
  } else {
    // Generic daily readings
    for (let day = 1; day <= Math.min(plan.totalDays, 30); day++) {
      readings.push({
        day,
        title: `第 ${day} 天`,
        readings: [{ bookId: 'gen', bookName: '创世记', chapter: day }],
        completed: false,
      });
    }
  }

  return readings;
}

export function PlanPage({ onNavigate }: PlanPageProps) {
  const [activePlan, setActivePlan] = useState<PlanProgress | null>(null);
  const [dailyReadings, setDailyReadings] = useState<DailyReading[]>([]);
  const [showPlanList, setShowPlanList] = useState(true);
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'plan' | 'history'>('plan');
  const [userId, setUserId] = useState<string>('default-user');

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { getAuthAdapter } = await import('@scripture-ai/native');
        const auth = getAuthAdapter();
        const token = await auth.getToken();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.sub || payload.id || 'default-user');
        }
      } catch {
        // Use default user ID
      }
    };
    getUserId();
  }, []);

  // Load active plan from storage
  useEffect(() => {
    // In real app, load from local storage/database
    const savedPlan = localStorage.getItem('activePlan');
    if (savedPlan) {
      const progress: PlanProgress = JSON.parse(savedPlan);
      setActivePlan(progress);
      setShowPlanList(false);
      setDailyReadings(generateDailyReadings(progress.planId));
      setStreak(progress.streak);
    }
  }, []);

  // Join a plan
  const joinPlan = (planId: string) => {
    const progress: PlanProgress = {
      planId,
      currentDay: 1,
      startedAt: new Date().toISOString(),
      lastCheckIn: null,
      streak: 0,
      completed: false,
    };

    setActivePlan(progress);
    setDailyReadings(generateDailyReadings(planId));
    setShowPlanList(false);
    localStorage.setItem('activePlan', JSON.stringify(progress));
  };

  // Leave plan
  const leavePlan = () => {
    setActivePlan(null);
    setDailyReadings([]);
    setShowPlanList(true);
    localStorage.removeItem('activePlan');
  };

  // Check in for today
  const checkIn = (day: number) => {
    if (!activePlan) return;

    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = activePlan.lastCheckIn?.split('T')[0];

    // Update streak
    let newStreak = streak;
    if (lastCheckIn) {
      const lastDate = new Date(lastCheckIn);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = streak + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    setStreak(newStreak);

    const updatedProgress: PlanProgress = {
      ...activePlan,
      currentDay: Math.max(activePlan.currentDay, day + 1),
      lastCheckIn: today,
      streak: newStreak,
    };

    setActivePlan(updatedProgress);
    setDailyReadings(prev => prev.map(r =>
      r.day === day ? { ...r, completed: true } : r
    ));
    localStorage.setItem('activePlan', JSON.stringify(updatedProgress));
  };

  const currentPlan = activePlan
    ? READING_PLANS.find(p => p.id === activePlan.planId)
    : null;

  const completedDays = dailyReadings.filter(r => r.completed).length;
  const progress = currentPlan ? Math.round((completedDays / currentPlan.totalDays) * 100) : 0;

  return (
    <div className="plan-page">
      {/* Header */}
      <header className="plan-header">
        <div className="header-title">
          <Calendar className="w-6 h-6" />
          <h2>读经计划</h2>
        </div>
        {activePlan && activeTab === 'plan' && (
          <button className="leave-btn" onClick={leavePlan}>
            退出计划
          </button>
        )}
      </header>

      {/* Tab Switcher */}
      <div className="plan-tabs">
        <button
          className={`plan-tab ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          <Target className="w-4 h-4" />
          计划
        </button>
        <button
          className={`plan-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History className="w-4 h-4" />
          阅读记录
        </button>
      </div>

      {/* Content */}
      <div className="plan-content">
        {activeTab === 'history' ? (
          /* Reading History */
          <ReadingHistory
            userId={userId}
            onNavigate={(bookId, chapter) => {
              if (onNavigate) {
                onNavigate(bookId, chapter);
              }
            }}
          />
        ) : showPlanList ? (
          /* Plan Selection */
          <div className="plan-list-section">
            <h3>选择一个计划开始</h3>
            <div className="plan-cards">
              {READING_PLANS.map(plan => (
                <div key={plan.id} className="plan-card" onClick={() => joinPlan(plan.id)}>
                  <div className="plan-icon">
                    {plan.category === 'bible' && <BookOpenIcon />}
                    {plan.category === 'topic' && <Target className="w-6 h-6" />}
                    {plan.category === 'devotional' && <Flame className="w-6 h-6" />}
                  </div>
                  <div className="plan-info">
                    <h4>{plan.name}</h4>
                    <p>{plan.description}</p>
                    <div className="plan-meta">
                      <span><Clock className="w-4 h-4" /> {plan.totalDays}天</span>
                      <span className={`difficulty ${plan.difficulty}`}>
                        {plan.difficulty === 'easy' ? '入门' : plan.difficulty === 'medium' ? '中等' : '挑战'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Plan */
          currentPlan && (
            <div className="active-plan-section">
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <div className="stat-value">{streak}</div>
                  <div className="stat-label">连续打卡</div>
                </div>
                <div className="stat-card">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <div className="stat-value">{completedDays}</div>
                  <div className="stat-label">已完成</div>
                </div>
                <div className="stat-card">
                  <Target className="w-6 h-6 text-blue-500" />
                  <div className="stat-value">{progress}%</div>
                  <div className="stat-label">总进度</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-section">
                <h4>{currentPlan.name}</h4>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-text">
                  {completedDays} / {currentPlan.totalDays} 天
                </div>
              </div>

              {/* Daily Readings */}
              <div className="daily-readings">
                <h4>每日阅读</h4>
                <div className="readings-list">
                  {dailyReadings.slice(0, 10).map(reading => (
                    <div key={reading.day} className={`reading-item ${reading.completed ? 'completed' : ''}`}>
                      <div className="reading-day">
                        {reading.completed ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <span>Day {reading.day}</span>
                        )}
                      </div>
                      <div className="reading-title">{reading.title}</div>
                      {!reading.completed && (
                        <button
                          className="check-in-btn"
                          onClick={() => checkIn(reading.day)}
                        >
                          打卡
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// BookOpen icon component
function BookOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}