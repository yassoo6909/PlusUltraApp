// src/screens/DashboardScreen.tsx
// Le LinearGradient local est retiré : le fond est désormais porté par AppNavigator
// pour que le dégradé soit continu jusque sous la tab bar, sans raccord visible.
// Remplace le <LinearGradient> racine par une simple <View transparente.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

export default function DashboardScreen() {
  const { dispatch } = useAppContext();

  return (
    <View style={styles.container}>
      <OneForAllField count={90} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Symbolisme</Text>
          <Text style={styles.headerSubtitle}>Objectif sèche · Semaine 4</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroPill}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroTag}>Statut héroïque</Text>
              <Text style={styles.heroLevel}>Niv. 28</Text>
            </View>
            <Text style={styles.heroTitle}>Symbol of Peace</Text>
            <Text style={styles.heroMeta}>185,4 tonnes cumulées</Text>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>142 500 / 150 000 XP</Text>
              <Text style={styles.progressRemaining}>7 500 avant palier</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={() => dispatch({ type: 'NAVIGATE', payload: 'checkin' })}
          >
            <Text style={styles.ctaText}>Lancer le check-in</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Récupération</Text>
          <View style={styles.pill}>
            <Text style={styles.cardSubtitle}>Dernière séance · Dos</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.statusText}>Haut du corps</Text>
              <Text style={[styles.statusValue, { color: colors.success }]}>Prêt</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.statusText}>Genou droit</Text>
              <Text style={[styles.statusValue, { color: colors.danger }]}>Sensibilité</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Métriques du jour</Text>
          <View style={styles.metricsRow}>
            <MetricPill label="Sommeil" value="7h45" />
            <MetricPill label="Pas" value="9 420" />
          </View>
          <View style={styles.metricsRow}>
            <MetricPill label="Poids" value="76.4 kg" />
            <MetricPill label="Tonnage" value="48.5 T" />
          </View>
          <View style={styles.metricsRow}>
            <MetricPill label="Calories" value="2 450" highlight />
            <MetricPill label="RPE moyen" value="8.2" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MetricPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.metricPill, highlight && styles.metricPillHighlight]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, highlight && { color: colors.gold }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { ...type.display, color: colors.textPrimary },
  headerSubtitle: { ...type.caption, color: colors.textSecondary, marginTop: 2 },

  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  heroPill: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  heroTag: { ...type.label, color: colors.textMuted },
  heroLevel: { ...type.caption, color: colors.gold, fontWeight: '600' },
  heroTitle: { ...type.h1, color: colors.textPrimary, marginBottom: 2 },
  heroMeta: { ...type.body, color: colors.textSecondary, marginBottom: spacing.md },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { ...type.caption, color: colors.textPrimary },
  progressRemaining: { ...type.caption, color: colors.gold },
  progressBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },

  ctaButton: {
    backgroundColor: colors.ctaBackground,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ctaText: { ...type.h2, color: colors.ctaText },

  sectionLabel: { ...type.label, color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.xs },

  pill: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardSubtitle: { ...type.caption, color: colors.textMuted, marginBottom: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: spacing.sm },
  statusText: { ...type.body, color: colors.textPrimary, flex: 1 },
  statusValue: { ...type.caption, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: spacing.xs },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  metricPill: {
    flex: 1,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  metricPillHighlight: { backgroundColor: colors.pillActive, borderColor: colors.pillActiveBorder },
  metricLabel: { ...type.caption, color: colors.textMuted, marginBottom: 4 },
  metricValue: { ...type.mono, color: colors.textPrimary },
});