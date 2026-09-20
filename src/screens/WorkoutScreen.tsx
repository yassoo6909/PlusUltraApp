// src/screens/WorkoutScreen.tsx
// Flow de séance : SetRow animé, minuteur de repos réel et progression sécurisée.

import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';
import RestTimer from '../components/RestTimer';
import SetRow, { ROW_FLEX } from '../components/SetRow';

export default function WorkoutScreen() {
  const { state, dispatch } = useAppContext();
  const { currentExercise, resting, restDuration, programs, activeProgramId, activeDayId, activeExerciseIndex } = state;

  const activeProgram = programs.find((program) => program.id === activeProgramId);
  const activeDay = activeProgram?.days.find((day) => day.id === activeDayId);
  const isLastExercise = !activeDay || activeExerciseIndex >= activeDay.exercises.length - 1;
  const completedSets = currentExercise.sets.filter((set) => set.validated).length;
  const allSetsValidated = currentExercise.sets.length > 0 && completedSets === currentExercise.sets.length;

  const handleNext = () => {
    if (!allSetsValidated) {
      Alert.alert(
        'Séries incomplètes',
        `Valide les ${currentExercise.sets.length - completedSets} série(s) restante(s) avant de continuer.`
      );
      return;
    }

    if (isLastExercise) {
      Alert.alert(
        'Séance terminée',
        'Bravo ! Toutes les séries prévues pour cette séance sont validées.',
        [{ text: 'Retour à l’accueil', onPress: () => dispatch({ type: 'END_WORKOUT' }) }]
      );
      return;
    }

    dispatch({ type: 'NEXT_EXERCISE_IN_DAY' });
  };

  const handleEndWorkout = () => {
    Alert.alert(
      'Terminer la séance ?',
      'Les séries non validées ne seront pas comptabilisées.',
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Terminer', style: 'destructive', onPress: () => dispatch({ type: 'END_WORKOUT' }) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <OneForAllField count={10} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.exerciseMeta}>
              {currentExercise.muscleGroup} · {currentExercise.grip}
            </Text>
            {activeDay && (
              <Text style={styles.progressText}>
                {activeDay.label} · Exercice {activeExerciseIndex + 1}/{activeDay.exercises.length}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleEndWorkout} hitSlop={8}>
            <Text style={styles.endLink}>Terminer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {resting && (
            <RestTimer
              durationSeconds={restDuration}
              onFinish={() => dispatch({ type: 'END_REST' })}
              onSkip={() => dispatch({ type: 'END_REST' })}
            />
          )}

          <View style={styles.progressPill}>
            <Text style={styles.progressPillLabel}>Progression de l’exercice</Text>
            <Text style={styles.progressPillValue}>
              {completedSets}/{currentExercise.sets.length} séries validées
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(completedSets / Math.max(currentExercise.sets.length, 1)) * 100}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: ROW_FLEX.serie }]}>Série</Text>
            <Text style={[styles.tableHeaderText, { flex: ROW_FLEX.previous }]}>Préc.</Text>
            <Text style={[styles.tableHeaderText, { flex: ROW_FLEX.input }]}>Kg</Text>
            <Text style={[styles.tableHeaderText, { flex: ROW_FLEX.input }]}>Reps</Text>
            <Text style={[styles.tableHeaderText, { flex: ROW_FLEX.input }]}>RPE</Text>
            <Text style={[styles.tableHeaderText, { flex: ROW_FLEX.action }]}> </Text>
          </View>

          {currentExercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              onFieldChange={(setId, field, value) =>
                dispatch({ type: 'UPDATE_SET_FIELD', payload: { setId, field, value } })
              }
              onValidate={(setId) => dispatch({ type: 'VALIDATE_SET', payload: setId })}
            />
          ))}

          <TouchableOpacity
            style={styles.addSetPill}
            onPress={() => dispatch({ type: 'ADD_SET' })}
            activeOpacity={0.8}
          >
            <Text style={styles.addSetText}>+ Ajouter une série</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          {!allSetsValidated && (
            <Text style={styles.footerHint}>
              Valide toutes les séries pour continuer ({completedSets}/{currentExercise.sets.length})
            </Text>
          )}
          <TouchableOpacity
            style={[styles.nextButton, !allSetsValidated && styles.nextButtonDisabled]}
            activeOpacity={allSetsValidated ? 0.85 : 0.7}
            onPress={handleNext}
          >
            <Text style={[styles.nextText, !allSetsValidated && styles.nextTextDisabled]}>
              {isLastExercise ? 'Terminer la séance' : 'Exercice suivant'}
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerContent: { flex: 1, marginRight: spacing.sm },
  exerciseName: { ...type.h1, color: colors.textPrimary },
  exerciseMeta: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  progressText: { ...type.caption, color: colors.gold, marginTop: 5, fontWeight: '600' },
  endLink: { ...type.body, color: colors.gold, fontWeight: '600' },

  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  progressPill: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressPillLabel: { ...type.caption, color: colors.textSecondary },
  progressPillValue: { ...type.bodyStrong, color: colors.textPrimary, marginTop: 3 },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: spacing.xs,
  },
  tableHeaderText: { ...type.label, color: colors.textMuted, textAlign: 'center', fontSize: 9 },

  addSetPill: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addSetText: { ...type.bodyStrong, color: colors.textSecondary },

  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  footerHint: { ...type.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  nextButton: {
    backgroundColor: colors.ctaBackground,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  nextText: { ...type.h2, color: colors.ctaText },
  nextTextDisabled: { color: colors.textMuted },
});