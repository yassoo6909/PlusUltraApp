// src/screens/ProgramsScreen.tsx
// LinearGradient local retiré : le fond est désormais porté par AppNavigator
// pour un dégradé continu jusque sous la tab bar. Racine remplacée par une View transparente.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

export default function ProgramsScreen() {
  const { state, dispatch } = useAppContext();
  const { programs, activeProgramId } = state;

  const handleStartDay = (programId: string, dayId: string) => {
    dispatch({ type: 'LOAD_WORKOUT_DAY', payload: { programId, dayId } });
    dispatch({ type: 'NAVIGATE', payload: 'checkin' });
  };

  return (
    <View style={styles.container}>
      <OneForAllField count={12} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Programmes</Text>
          <Text style={styles.headerSubtitle}>{programs.length} programme(s) enregistré(s)</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {programs.map((program) => {
            const isActive = program.id === activeProgramId;
            return (
              <View key={program.id} style={[styles.pill, isActive && styles.pillActive]}>
                <View style={styles.programHeader}>
                  <Text style={styles.programName}>{program.name}</Text>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Actif</Text>
                    </View>
                  )}
                </View>

                {program.days.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={styles.dayRow}
                    onPress={() => handleStartDay(program.id, day.id)}
                    activeOpacity={0.75}
                  >
                    <View>
                      <Text style={styles.dayLabel}>{day.label}</Text>
                      <Text style={styles.daySub}>{day.exercises.length} exercice(s)</Text>
                    </View>
                    <Text style={styles.dayArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}

          <TouchableOpacity style={styles.createPill} activeOpacity={0.8}>
            <Text style={styles.createText}>+ Créer un nouveau programme</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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

  pill: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  pillActive: { borderColor: colors.pillActiveBorder },
  programHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  programName: { ...type.h2, color: colors.textPrimary },
  activeBadge: { backgroundColor: colors.pillActive, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  activeBadgeText: { ...type.caption, color: colors.gold, fontSize: 10, fontWeight: '700' },

  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  dayLabel: { ...type.bodyStrong, color: colors.textPrimary },
  daySub: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  dayArrow: { ...type.h2, color: colors.gold },

  createPill: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createText: { ...type.bodyStrong, color: colors.textSecondary },
});