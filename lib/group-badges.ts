// lib/group-badges.ts
// Group achievement badges definition and helper functions
// Badge names/descriptions use i18n keys for localization

export interface GroupBadge {
  id: string;
  nameKey: string;
  descKey: string;
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
    nameKey: 'group.badges.streak7.name',
    descKey: 'group.badges.streak7.desc',
    icon: '🔥',
    color: '#FF6B35',
    requirement: { type: 'STREAK', value: 3 },
    rarity: 'COMMON'
  },
  {
    id: 'streak_7',
    nameKey: 'group.badges.streak7.name',
    descKey: 'group.badges.streak7.desc',
    icon: '🔥',
    color: '#FF8C42',
    requirement: { type: 'STREAK', value: 7 },
    rarity: 'COMMON'
  },
  {
    id: 'streak_14',
    nameKey: 'group.badges.streak30.name',
    descKey: 'group.badges.streak30.desc',
    icon: '🔥',
    color: '#FFA15C',
    requirement: { type: 'STREAK', value: 14 },
    rarity: 'RARE'
  },
  {
    id: 'streak_30',
    nameKey: 'group.badges.streak30.name',
    descKey: 'group.badges.streak30.desc',
    icon: '🔥',
    color: '#FFB366',
    requirement: { type: 'STREAK', value: 30 },
    rarity: 'RARE'
  },
  {
    id: 'streak_100',
    nameKey: 'group.badges.streak100.name',
    descKey: 'group.badges.streak100.desc',
    icon: '🔥',
    color: '#FF6B00',
    requirement: { type: 'STREAK', value: 100 },
    rarity: 'LEGENDARY'
  },

  // Completed days badges
  {
    id: 'completed_7',
    nameKey: 'group.badges.firstPlan.name',
    descKey: 'group.badges.firstPlan.desc',
    icon: '📖',
    color: '#4CAF50',
    requirement: { type: 'COMPLETED_DAYS', value: 7 },
    rarity: 'COMMON'
  },
  {
    id: 'completed_30',
    nameKey: 'group.badges.plan5.name',
    descKey: 'group.badges.plan5.desc',
    icon: '📖',
    color: '#45A049',
    requirement: { type: 'COMPLETED_DAYS', value: 30 },
    rarity: 'RARE'
  },
  {
    id: 'completed_100',
    nameKey: 'group.badges.plan20.name',
    descKey: 'group.badges.plan20.desc',
    icon: '📖',
    color: '#2E7D32',
    requirement: { type: 'COMPLETED_DAYS', value: 100 },
    rarity: 'EPIC'
  },

  // Chapters read badges
  {
    id: 'chapters_50',
    nameKey: 'group.badges.firstHighlight.name',
    descKey: 'group.badges.firstHighlight.desc',
    icon: '📚',
    color: '#2196F3',
    requirement: { type: 'CHAPTERS_READ', value: 50 },
    rarity: 'COMMON'
  },
  {
    id: 'chapters_100',
    nameKey: 'group.badges.highlight100.name',
    descKey: 'group.badges.highlight100.desc',
    icon: '📚',
    color: '#1E88E5',
    requirement: { type: 'CHAPTERS_READ', value: 100 },
    rarity: 'RARE'
  },
  {
    id: 'chapters_365',
    nameKey: 'group.badges.highlight500.name',
    descKey: 'group.badges.highlight500.desc',
    icon: '📚',
    color: '#1565C0',
    requirement: { type: 'CHAPTERS_READ', value: 365 },
    rarity: 'EPIC'
  },
  {
    id: 'chapters_1000',
    nameKey: 'group.badges.highlight500.name',
    descKey: 'group.badges.highlight500.desc',
    icon: '📚',
    color: '#0D47A1',
    requirement: { type: 'CHAPTERS_READ', value: 1000 },
    rarity: 'LEGENDARY'
  },

  // Plan complete badges
  {
    id: 'plan_complete_1',
    nameKey: 'group.badges.firstPlan.name',
    descKey: 'group.badges.firstPlan.desc',
    icon: '🏆',
    color: '#FFD700',
    requirement: { type: 'PLAN_COMPLETE', value: 1 },
    rarity: 'COMMON'
  },
  {
    id: 'plan_complete_5',
    nameKey: 'group.badges.plan5.name',
    descKey: 'group.badges.plan5.desc',
    icon: '🏆',
    color: '#FFC107',
    requirement: { type: 'PLAN_COMPLETE', value: 5 },
    rarity: 'RARE'
  },
  {
    id: 'plan_complete_10',
    nameKey: 'group.badges.plan20.name',
    descKey: 'group.badges.plan20.desc',
    icon: '🏆',
    color: '#FF9800',
    requirement: { type: 'PLAN_COMPLETE', value: 10 },
    rarity: 'EPIC'
  },

  // Early bird badge
  {
    id: 'early_bird',
    nameKey: 'group.badges.firstShare.name',
    descKey: 'group.badges.firstShare.desc',
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

// Get rarity label i18n key (use t() to render)
export function getRarityLabelKey(rarity: string): string {
  switch (rarity) {
    case 'COMMON':
      return 'group.badges.rarity.common';
    case 'RARE':
      return 'group.badges.rarity.rare';
    case 'EPIC':
      return 'group.badges.rarity.epic';
    case 'LEGENDARY':
      return 'group.badges.rarity.legendary';
    default:
      return 'group.badges.rarity.common';
  }
}

// Backward-compatible: get rarity label using t() function
import { t } from '@/lib/i18n';

export function getRarityLabel(rarity: string): string {
  return t(getRarityLabelKey(rarity));
}
