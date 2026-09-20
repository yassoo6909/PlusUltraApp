// src/screens/DashboardScreen.tsx
// Dashboard connecté à sessionHistory : tonnage 7j/30j, tendance RPE, dernière séance, régularité.

import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext, WorkoutSession } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

function daysAgo(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function formatRelativeDate(iso: string): string {
  const d = daysAgo(iso);
  if (d < 1) return "Aujourd'hui";
  if (d < 2) return 'Hier';
  return `Il y a ${Math.floor(d)} jours`;
}

function computeRpeTrend(sessions: WorkoutSession[]): { trend: 'up' | 'down' | 'flat'; delta: number } {
  const withRpe = sessions.filter((s) => s.averageRpe !== null).slice(0, 6);
  if (withRpe.length < 2) return { trend: 'flat', delta: 0 };

  const half = Math.ceil(withRpe.length / 2);
  const recent = withRpe.slice(0, half);
  const older = withRpe.slice(half);
  if (older.length === 0) return { trend: 'flat', delta: 0 };

  const avg = (arr: WorkoutSession[]) =>
    arr.reduce((sum, s) => sum + (s.averageRpe ?? 0), 0) / arr.length;

  const delta = Math.round((avg(recent) - avg(older)) * 10) / 10;
  if (Math.abs(delta) < 0.2) return { trend: 'flat', delta };
  return { trend: delta > 0 ? 'up' : 'down', delta };
}

export default function DashboardScreen() {
  const { state, dispatch } = useAppContext();
  const { sessionHistory } = state;

  const stats = useMemo(() => {
    const last7 = sessionHistory.filter((s) => daysAgo(s.date) <= 7);
    const last30 = sessionHistory.filter((s) => daysAgo(s.date) <= 30);
    const last14 = sessionHistory.filter((s) => daysAgo(s.date) <= 14);

    const tonnage7 = Math.round(last7.reduce((sum, s) => sum + s.totalTonnage, 0) * 10) / 10;
    const tonnage30 = Math.round(last30.reduce((sum, s) => sum + s.totalTonnage, 0) * 10) / 10;
    const rpeTrend = computeRpeTrend(sessionHistory);
    const lastSession = sessionHistory[0] ?? null;

    return {
      tonnage7,
      tonnage30,
      sessionsLast14: last14.length,
      rpeTrend,
      lastSession,
    };
  }, [sessionHistory]);

  const goToHistory = () => dispatch({ type: 'NAVIGATE', payload: 'history' });
  const goToPrograms = () => dispatch({ type: 'NAVIGATE', payload: 'programs' });

  const trendLabel =
    stats.rpeTrend.trend === 'up'
      ? `↑ +${stats.rpeTrend.delta} — fatigue en hausse`
      : stats.rpeTrend.trend === 'down'
      ? `↓ ${stats.rpeTrend.delta} — récupération en hausse`
      : 'Stable';

  const trendColor =
    stats.rpeTrend.trend === 'up' ? colors.danger : stats.rpeTrend.trend === 'down' ? colors.success : colors.textSecondary;

  return (
    <View style={styles.container}>
      <OneForAllField count={12} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Plus Ultra</Text>
            <Text style={styles.headerSubtitle}>Ton suivi de progression</Text>
          </View>

          {sessionHistory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucune donnée pour l'instant</Text>
              <Text style={styles.emptyText}>
                Termine ta première séance pour voir apparaître ton tonnage et ta progression ici.
              </Text>
              <TouchableOpacity style={styles.ctaButton} onPress={goToPrograms}>
                <Text style={styles.ctaText}>Voir mes programmes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{stats.tonnage7.toLocaleString('fr-FR')} kg</Text>
                  <Text style={styles.metricLabel}>Tonnage · 7 jours</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{stats.tonnage30.toLocaleString('fr-FR')} kg</Text>
                  <Text style={styles.metricLabel}>Tonnage · 30 jours</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{stats.sessionsLast14}</Text>
                  <Text style={styles.metricLabel}>Séances · 14 jours</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricValue, { color: trendColor, fontSize: 16 }]}>{trendLabel}</Text>
                  <Text style={styles.metricLabel}>Tendance RPE</Text>
                </View>
              </View>

              {stats.lastSession && (
                <TouchableOpacity style={styles.lastSessionCard} onPress={goToHistory} activeOpacity={0.85}>
                  <View style={styles.lastSessionHeader}>
                    <Text style={styles.lastSessionTitle}>Dernière séance</Text>
                    <Text style={styles.lastSessionDate}>{formatRelativeDate(stats.lastSession.date)}</Text>
                  </View>
                  <Text style={styles.lastSessionDay}>{stats.lastSession.dayLabel}</Text>
                  <Text style={styles.lastSessionProgram}>{stats.lastSession.programName}</Text>

                  <View style={styles.lastSessionMetrics}>
                    <View style={styles.lastSessionMetric}>
                      <Text style={styles.lastSessionMetricValue}>
                        {stats.lastSession.totalTonnage.toLocaleString('fr-FR')} kg
                      </Text>
                      <Text style={styles.lastSessionMetricLabel}>Tonnage</Text>
                    </View>
                    <View style={styles.lastSessionMetric}>
                      <Text style={styles.lastSessionMetricValue}>{stats.lastSession.totalValidatedSets}</Text>
                      <Text style={styles.lastSessionMetricLabel}>Séries</Text>
                    </View>
                    <View style={styles.lastSessionMetric}>
                      <Text style={[styles.lastSessionMetricValue, { color: colors.gold }]}>
                        {stats.lastSession.averageRpe ?? '—'}
                      </Text>
                      <Text style={styles.lastSessionMetricLabel}>RPE moyen</Text>
                    </View>
                  </View>

                  <Text style={styles.seeAllLink}>Voir tout l'historique →</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.ctaButton} onPress={goToPrograms}>
                <Text style={styles.ctaText}>Démarrer une nouvelle séance</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  header: { paddingVertical: spacing.md },
  greeting: { ...type.display, color: colors.textPrimary },
  headerSubtitle: { ...type.caption, color: colors.textSecondary, marginTop: 2 },

  emptyCard: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  emptyTitle: { ...type.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { ...type.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm },
  metricCard: {
    width: '47%',
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  metricValue: { ...type.h1, color: colors.textPrimary },
  metricLabel: { ...type.caption, color: colors.textMuted, marginTop: 4, fontSize: 11 },

  lastSessionCard: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  lastSessionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  lastSessionTitle: { ...type.bodyStrong, color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase' },
  lastSessionDate: { ...type.caption, color: colors.textMuted },
  lastSessionDay: { ...type.h2, color: colors.textPrimary, marginTop: 4 },
  lastSessionProgram: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.md },

  lastSessionMetrics: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  lastSessionMetric: { flex: 1, alignItems: 'center' },
  lastSessionMetricValue: { ...type.h2, color: colors.textPrimary },
  lastSessionMetricLabel: { ...type.caption, color: colors.textMuted, marginTop: 2, fontSize: 10 },

  seeAllLink: { ...type.bodyStrong, color: colors.gold, textAlign: 'right' },

  ctaButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  ctaText: { ...type.bodyStrong, color: '#1a1a1a' },
});
