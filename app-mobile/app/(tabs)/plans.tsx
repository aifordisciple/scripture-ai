// app-mobile/app/(tabs)/plans.tsx
// Reading plans screen

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { ReadingPlan } from '@scripture-ai/core/src/constants';

// Sample plans - in real app, fetch from API
const SAMPLE_PLANS: ReadingPlan[] = [
  {
    id: 'nt-90days',
    title: '新约 90 天通读',
    description: '每天阅读大约 2-3 章，三个月内轻松读完整个新约。',
    durationDays: 90,
    tags: ['新约', '三个月', '初信友好'],
    tasks: []
  },
  {
    id: 'ot-1year',
    title: '旧约一年通读',
    description: '每天阅读 2-3 章，一年完成旧约阅读。',
    durationDays: 365,
    tags: ['旧约', '一年', '系统阅读'],
    tasks: []
  },
  {
    id: 'psalm-30days',
    title: '诗篇 30 天灵修',
    description: '每天 5 篇诗篇，30 天完成诗篇阅读。',
    durationDays: 30,
    tags: ['诗篇', '灵修', '默想'],
    tasks: []
  }
];

export default function PlansScreen() {
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const handleStartPlan = (planId: string) => {
    setActivePlan(planId);
    // In real app, save to storage and start tracking
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>读经计划</Text>
        <Text style={styles.subtitle}>选择一个计划开始灵修之旅</Text>
      </View>

      {activePlan && (
        <View style={styles.activePlanCard}>
          <Text style={styles.activePlanLabel}>进行中</Text>
          <Text style={styles.activePlanTitle}>
            {SAMPLE_PLANS.find(p => p.id === activePlan)?.title}
          </Text>
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>继续阅读</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.plansList}>
        {SAMPLE_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, activePlan === plan.id && styles.planCardActive]}
            onPress={() => handleStartPlan(plan.id)}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planDuration}>{plan.durationDays} 天</Text>
            </View>
            <Text style={styles.planDescription}>{plan.description}</Text>
            <View style={styles.planTags}>
              {plan.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  activePlanCard: {
    margin: 16,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
  },
  activePlanLabel: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: 8,
  },
  activePlanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  plansList: {
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  planDuration: {
    fontSize: 14,
    color: '#64748b',
  },
  planDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  planTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
  },
});
