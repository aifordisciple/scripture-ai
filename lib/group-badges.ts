// lib/group-badges.ts
// Group achievement badges definition and helper functions

export interface GroupBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type: 'STREAK' | 'COMPLETED_DAYS' | 'CHAPTERS_READ' | 'PLAN_COMPLETE' | 'EARLY_BIRD';
    value: number;
  };
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export const GROUP_BADGES: GroupBadge[] = [
  // Streak badges
  {
    id: 'streak_3',
    name: '初热之火',
    description: '连续打卡 3 天',
    icon: '🔥',
    color: '#FF6B35',
    requirement: { type: 'STREAK', value: 3 },
    rarity: 'COMMON'
  },
  {
    id: 'streak_7',
    name: '坚持不懈',
    description: '连续打卡 7 天',
    icon: '🔥',
    color: '#FF8C42',
    requirement: { type: 'STREAK', value: 7 },
    rarity: 'COMMON'
  },
  {
    id: 'streak_14',
    name: '稳定同行',
    description: '连续打卡 14 天',
    icon: '🔥',
    color: '#FFA15C',
    requirement: { type: 'STREAK', value: 14 },
    rarity: 'RARE'
  },
  {
    id: 'streak_30',
    name: '月度忠心',
    description: '连续打卡 30 天',
    icon: '🔥',
    color: '#FFB366',
    requirement: { type: 'STREAK', value: 30 },
    rarity: 'RARE'
  },
  {
    id: 'streak_100',
    name: '百日坚持',
    description: '连续打卡 100 天',
    icon: '🔥',
    color: '#FF6B00',
    requirement: { type: 'STREAK', value: 100 },
    rarity: 'LEGENDARY'
  },

  // Completed days badges
  {
    id: 'completed_7',
    name: '周度完成者',
    description: '累计完成 7 天阅读任务',
    icon: '📖',
    color: '#4CAF50',
    requirement: { type: 'COMPLETED_DAYS', value: 7 },
    rarity: 'COMMON'
  },
  {
    id: 'completed_30',
    name: '月度完成者',
    description: '累计完成 30 天阅读任务',
    icon: '📖',
    color: '#45A049',
    requirement: { type: 'COMPLETED_DAYS', value: 30 },
    rarity: 'RARE'
  },
  {
    id: 'completed_100',
    name: '百日完成者',
    description: '累计完成 100 天阅读任务',
    icon: '📖',
    color: '#2E7D32',
    requirement: { type: 'COMPLETED_DAYS', value: 100 },
    rarity: 'EPIC'
  },

  // Chapters read badges
  {
    id: 'chapters_50',
    name: '经文探索者',
    description: '累计阅读 50 章经文',
    icon: '📚',
    color: '#2196F3',
    requirement: { type: 'CHAPTERS_READ', value: 50 },
    rarity: 'COMMON'
  },
  {
    id: 'chapters_100',
    name: '经文爱好者',
    description: '累计阅读 100 章经文',
    icon: '📚',
    color: '#1E88E5',
    requirement: { type: 'CHAPTERS_READ', value: 100 },
    rarity: 'RARE'
  },
  {
    id: 'chapters_365',
    name: '经文大师',
    description: '累计阅读 365 章经文',
    icon: '📚',
    color: '#1565C0',
    requirement: { type: 'CHAPTERS_READ', value: 365 },
    rarity: 'EPIC'
  },
  {
    id: 'chapters_1000',
    name: '经文专家',
    description: '累计阅读 1000 章经文',
    icon: '📚',
    color: '#0D47A1',
    requirement: { type: 'CHAPTERS_READ', value: 1000 },
    rarity: 'LEGENDARY'
  },

  // Plan complete badges
  {
    id: 'plan_complete_1',
    name: '计划完成者',
    description: '完成 1 个读经计划',
    icon: '🏆',
    color: '#FFD700',
    requirement: { type: 'PLAN_COMPLETE', value: 1 },
    rarity: 'COMMON'
  },
  {
    id: 'plan_complete_5',
    name: '计划达人',
    description: '完成 5 个读经计划',
    icon: '🏆',
    color: '#FFC107',
    requirement: { type: 'PLAN_COMPLETE', value: 5 },
    rarity: 'RARE'
  },
  {
    id: 'plan_complete_10',
    name: '计划大师',
    description: '完成 10 个读经计划',
    icon: '🏆',
    color: '#FF9800',
    requirement: { type: 'PLAN_COMPLETE', value: 10 },
    rarity: 'EPIC'
  },

  // Early bird badge
  {
    id: 'early_bird',
    name: '早起鸟儿',
    description: '在早上 6 点前完成阅读',
    icon: '🌅',
    color: '#FFB300',
    requirement: { type: 'EARLY_BIRD', value: 1 },
    rarity: 'RARE'
  }
];

// Helper function to check if a user earns a badge
export function checkBadgeEligibility(
  badgeId: string,
  stats: {
    streakDays: number;
    completedDays: number;
    chaptersRead: number;
    plansCompleted: number;
    earlyBirdDays: number;
  }
): boolean {
  const badge = GROUP_BADGES.find(b => b.id === badgeId);
  if (!badge) return false;

  const { requirement } = badge;
  switch (requirement.type) {
    case 'STREAK':
      return stats.streakDays >= requirement.value;
    case 'COMPLETED_DAYS':
      return stats.completedDays >= requirement.value;
    case 'CHAPTERS_READ':
      return stats.chaptersRead >= requirement.value;
    case 'PLAN_COMPLETE':
      return stats.plansCompleted >= requirement.value;
    case 'EARLY_BIRD':
      return stats.earlyBirdDays >= requirement.value;
    default:
      return false;
  }
}

// Get all badges a user is eligible for
export function getEligibleBadges(
  stats: {
    streakDays: number;
    completedDays: number;
    chaptersRead: number;
    plansCompleted: number;
    earlyBirdDays: number;
  }
): GroupBadge[] {
  return GROUP_BADGES.filter(badge => checkBadgeEligibility(badge.id, stats));
}

// Get badge by ID
export function getBadgeById(badgeId: string): GroupBadge | undefined {
  return GROUP_BADGES.find(b => b.id === badgeId);
}

// Get rarity color
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'COMMON':
      return '#9E9E9E';
    case 'RARE':
      return '#2196F3';
    case 'EPIC':
      return '#9C27B0';
    case 'LEGENDARY':
      return '#FFD700';
    default:
      return '#9E9E9E';
  }
}

// Get rarity label
export function getRarityLabel(rarity: string): string {
  switch (rarity) {
    case 'COMMON':
      return '普通';
    case 'RARE':
      return '稀有';
    case 'EPIC':
      return '史诗';
    case 'LEGENDARY':
      return '传说';
    default:
      return '普通';
  }
}