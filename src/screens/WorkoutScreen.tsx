// src/screens/WorkoutScreen.tsx
// LinearGradient local retiré : le fond est désormais porté par AppNavigator
// pour un dégradé continu jusque sous la tab bar. Racine remplacée par une View transparente.
// Structure basée sur currentExercise (préset via LOAD_WORKOUT_DAY) + logique de repos existante.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

export default function WorkoutScreen() {
  const { state, dispatch } = useAppContext();
  const { currentExercise, resting, restDuration } = state;

  return (
    <View style={styles.container}>
      <OneForAllField count={10} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <View>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.exerciseMeta}>
              {currentExercise.muscleGroup} · {currentExercise.grip}
            </Text>
          </View>
          <TouchableOpacity onPress={() => dispatch({ type: 'END_WORKOUT' })}>
            <Text style={styles.endLink}>Terminer</Text>
          </TouchableOpacity>
        </View>

        {resting && (
          <View style={styles.restBanner}>
            <Text style={styles.restText}>Repos · {restDuration}s</Text>
            <TouchableOpacity onPress={() => dispatch({ type: 'END_REST' })}>
              <Text style={styles.restSkip}>Passer</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSet]}>Série</Text>
            <Text style={[styles.tableHeaderText, styles.colPrev]}>Préc.</Text>
            <Text style={[styles.tableHeaderText, styles.colInput]}>Kg</Text>
            <Text style={[styles.tableHeaderText, styles.colInput]}>Reps</Text>
            <Text style={[styles.tableHeaderText, styles.colInput]}>RPE</Text>
            <Text style={[styles.tableHeaderText, styles.colCheck]}> </Text>
          </View>

          {currentExercise.sets.map((set) => (
            <View key={set.id} style={[styles.setRow, set.validated && styles.setRowValidated]}>
              <Text style={[styles.setCell, styles.colSet, styles.setIndex]}>{set.id}</Text>
              <Text style={[styles.setCell, styles.colPrev]}>{set.previous}</Text>

              <TextInput
                style={[styles.input, styles.colInput]}
                value={set.weight}
                keyboardType="decimal-pad"
                onChangeText={(v) => dispatch({ type: 'UPDATE_SET_FIELD', payload: { setId: set.id, field: 'weight', value: v } })}
                editable={!set.validated}
              />
              <TextInput
                style={[styles.input, styles.colInput]}
                value={set.reps}
                keyboardType="number-pad"
                onChangeText={(v) => dispatch({ type: 'UPDATE_SET_FIELD', payload: { setId: set.id, field: 'reps', value: v } })}
                editable={!set.validated}
              />
              <TextInput
                style={[styles.input, styles.colInput]}
                value={set.rpe}
                keyboardType="decimal-pad"
                onChangeText={(v) => dispatch({ type: 'UPDATE_SET_FIELD', payload: { setId: set.id, field: 'rpe', value: v } })}
                editable={!set.validated}
              />

              <TouchableOpacity
                style={[styles.checkButton, styles.colCheck, set.validated && styles.checkButtonDone]}
                onPress={() => !set.validated && dispatch({ type: 'VALIDATE_SET', payload: set.id })}
                disabled={set.validated}
              >
                <Text style={styles.checkMark}>{set.validated ? '✓' : ''}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addSetPill} onPress={() => dispatch({ type: 'ADD_SET' })} activeOpacity={0.8}>
            <Text style={styles.addSetText}>+ Ajouter une série</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.85}
            onPress={() => dispatch({ type: 'NEXT_EXERCISE_IN_DAY' })}
          >
            <Text style={styles.nextText}>Exercice suivant</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  exerciseName: { ...type.h1, color: colors.textPrimary },
  exerciseMeta: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  endLink: { ...type.body, color: colors.gold, fontWeight: '600' },

  restBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.pillActive, borderWidth: 1, borderColor: colors.pillActiveBorder,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  restText: { ...type.bodyStrong, color: colors.gold },
  restSkip: { ...type.caption, color: colors.textSecondary, fontWeight: '600' },

  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  tableHeader: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tableHeaderText: { ...type.label, color: colors.textMuted, textAlign: 'center' },

  colSet: { width: 40 },
  colPrev: { width: 56 },
  colInput: { flex: 1 },
  colCheck: { width: 40 },

  setRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  setRowValidated: { opacity: 0.55 },
  setCell: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  setIndex: { color: colors.textPrimary, fontWeight: '700' },

  input: {
    ...type.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    marginHorizontal: 3,
    paddingVertical: 6,
  },

  checkButton: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, borderColor: colors.pillBorder,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  checkButtonDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: colors.textPrimary, fontWeight: '700' },

  addSetPill: {
    borderWidth: 1, borderColor: colors.pillBorder, borderStyle: 'dashed',
    borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  addSetText: { ...type.bodyStrong, color: colors.textSecondary },

  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  nextButton: {
    backgroundColor: colors.ctaBackground, paddingVertical: spacing.md,
    borderRadius: radius.pill, alignItems: 'center',
  },
  nextText: { ...type.h2, color: colors.ctaText },
});