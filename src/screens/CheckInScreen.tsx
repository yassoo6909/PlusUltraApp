// src/screens/CheckInScreen.tsx
// LinearGradient local retiré : le fond est désormais porté par AppNavigator
// pour un dégradé continu jusque sous la tab bar. Racine remplacée par une View transparente.
// Pilule active en rouge (colors.danger) pour signaler une zone sensible, conservé tel quel.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

const PAIN_AREAS = ['Épaules', 'Coudes', 'Genoux', 'Lombaires'];

export default function CheckInScreen() {
  const { state, dispatch } = useAppContext();
  const { painArea } = state;

  return (
    <View style={styles.container}>
      <OneForAllField count={14} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Check-in articulaire</Text>
          <TouchableOpacity onPress={() => dispatch({ type: 'NAVIGATE', payload: 'dashboard' })}>
            <Text style={styles.backLink}>Retour</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pill}>
            <Text style={styles.sectionTitle}>Comment vont tes articulations ?</Text>
            <Text style={styles.subInfoText}>Sélectionne une zone sensible pour activer les alternatives</Text>

            <View style={styles.painGrid}>
              {PAIN_AREAS.map((zone) => {
                const active = painArea === zone;
                return (
                  <TouchableOpacity
                    key={zone}
                    style={[styles.painPill, active && styles.painPillActive]}
                    onPress={() => dispatch({ type: 'SET_PAIN_AREA', payload: zone })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.painPillText, active && styles.painPillTextActive]}>{zone}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {painArea && (
              <View style={styles.adaptationBanner}>
                <Text style={styles.adaptationText}>
                  Adaptation active — les exercices à fort stress sur les{' '}
                  <Text style={styles.adaptationHighlight}>{painArea}</Text> seront ajustés.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={() => dispatch({ type: 'NAVIGATE', payload: 'workout' })}
          >
            <Text style={styles.ctaText}>Valider et lancer la séance</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  headerTitle: { ...type.h1, color: colors.textPrimary },
  backLink: { ...type.body, color: colors.gold, fontWeight: '600' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  pill: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  sectionTitle: { ...type.h2, color: colors.textPrimary, marginBottom: 4 },
  subInfoText: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.md },

  painGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  painPill: {
    width: '48%',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  painPillActive: { backgroundColor: 'rgba(248, 113, 113, 0.16)', borderColor: colors.danger },
  painPillText: { ...type.bodyStrong, color: colors.textSecondary },
  painPillTextActive: { color: colors.danger },

  adaptationBanner: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  adaptationText: { ...type.caption, color: colors.textSecondary, lineHeight: 18 },
  adaptationHighlight: { color: colors.danger, fontWeight: '700' },

  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  ctaButton: {
    backgroundColor: colors.ctaBackground,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaText: { ...type.h2, color: colors.ctaText },
});