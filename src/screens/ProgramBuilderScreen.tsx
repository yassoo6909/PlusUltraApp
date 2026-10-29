// src/screens/ProgramBuilderScreen.tsx
// Version complète et autonome : création/édition d'un programme avec jours
// d'entraînement ET jours de repos explicites (isRestDay). Remplace tout le
// fichier existant.

import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext, Program, ProgramDay, ExerciseTemplate } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyExercise(): ExerciseTemplate {
  return {
    name: '',
    muscleGroup: '',
    grip: '',
    targetSets: [{ weight: '', reps: '', rpe: '' }],
  };
}

function emptyTrainingDay(index: number): ProgramDay {
  return {
    id: makeLocalId('day'),
    label: `Jour ${index + 1}`,
    isRestDay: false,
    exercises: [emptyExercise()],
  };
}

function restDay(): ProgramDay {
  return {
    id: makeLocalId('repos'),
    label: 'Repos',
    isRestDay: true,
    exercises: [],
  };
}

export default function ProgramBuilderScreen() {
  const { state, dispatch } = useAppContext();
  const { editingProgramId, programs } = state;

  const existingProgram = useMemo(
    () => programs.find((p) => p.id === editingProgramId) ?? null,
    [programs, editingProgramId]
  );

  const [programName, setProgramName] = useState(existingProgram?.name ?? '');
  const [days, setDays] = useState<ProgramDay[]>(
    existingProgram ? existingProgram.days.map((d) => ({ ...d, exercises: [...d.exercises] })) : [emptyTrainingDay(0)]
  );
  const [expandedDayId, setExpandedDayId] = useState<string | null>(days[0]?.id ?? null);

  const goBack = () => {
    dispatch({ type: 'STOP_EDIT_PROGRAM' });
    dispatch({ type: 'NAVIGATE', payload: 'programs' });
  };

  const addTrainingDay = () => {
    const newDay = emptyTrainingDay(days.length);
    setDays((prev) => [...prev, newDay]);
    setExpandedDayId(newDay.id);
  };

  const addRestDay = () => {
    const newDay = restDay();
    setDays((prev) => [...prev, newDay]);
  };

  const removeDay = (dayId: string) => {
    if (days.length <= 1) {
      Alert.alert('Impossible', 'Un programme doit contenir au moins un jour.');
      return;
    }
    setDays((prev) => prev.filter((d) => d.id !== dayId));
  };

  const updateDayLabel = (dayId: string, label: string) => {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, label } : d)));
  };

  const toggleExpanded = (dayId: string) => {
    setExpandedDayId((prev) => (prev === dayId ? null : dayId));
  };

  const addExerciseToDay = (dayId: string) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d))
    );
  };

  const removeExerciseFromDay = (dayId: string, exerciseIndex: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.filter((_, i) => i !== exerciseIndex) }
          : d
      )
    );
  };

  const updateExerciseField = (
    dayId: string,
    exerciseIndex: number,
    field: keyof Omit<ExerciseTemplate, 'targetSets'>,
    value: string
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const exercises = d.exercises.map((ex, i) =>
          i === exerciseIndex ? { ...ex, [field]: value } : ex
        );
        return { ...d, exercises };
      })
    );
  };

  const addSetToExercise = (dayId: string, exerciseIndex: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const exercises = d.exercises.map((ex, i) =>
          i === exerciseIndex
            ? { ...ex, targetSets: [...ex.targetSets, { weight: '', reps: '', rpe: '' }] }
            : ex
        );
        return { ...d, exercises };
      })
    );
  };

  const removeSetFromExercise = (dayId: string, exerciseIndex: number, setIndex: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const exercises = d.exercises.map((ex, i) =>
          i === exerciseIndex
            ? { ...ex, targetSets: ex.targetSets.filter((_, si) => si !== setIndex) }
            : ex
        );
        return { ...d, exercises };
      })
    );
  };

  const updateSetField = (
    dayId: string,
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps' | 'rpe',
    value: string
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const exercises = d.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex;
          const targetSets = ex.targetSets.map((s, si) => (si === setIndex ? { ...s, [field]: value } : s));
          return { ...ex, targetSets };
        });
        return { ...d, exercises };
      })
    );
  };

  const handleSave = () => {
    const trimmedName = programName.trim();
    if (trimmedName.length === 0) {
      Alert.alert('Nom manquant', 'Donne un nom à ton programme avant de sauvegarder.');
      return;
    }

    const trainingDaysWithoutExercise = days.filter((d) => !d.isRestDay && d.exercises.length === 0);
    if (trainingDaysWithoutExercise.length > 0) {
      Alert.alert('Jour incomplet', 'Chaque jour d\'entraînement doit contenir au moins un exercice.');
      return;
    }

    const program: Program = {
      id: existingProgram?.id ?? makeLocalId('program'),
      name: trimmedName,
      days,
    };

    dispatch({ type: 'SAVE_PROGRAM', payload: program });
    dispatch({ type: 'NAVIGATE', payload: 'programs' });
  };

  return (
    <View style={styles.container}>
      <OneForAllField count={12} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} hitSlop={8}>
            <Text style={styles.backLink}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{existingProgram ? 'Modifier le programme' : 'Nouveau programme'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Nom du programme</Text>
          <TextInput
            style={styles.nameInput}
            value={programName}
            onChangeText={setProgramName}
            placeholder="Ex : Sèche — Push/Pull/Legs"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.sectionLabel}>Jours du cycle</Text>

          {days.map((day, dayIndex) => (
            <View key={day.id} style={styles.dayCard}>
              {day.isRestDay ? (
                <View style={styles.restDayRow}>
                  <Text style={styles.restDayLabel}>😴 {day.label}</Text>
                  <TouchableOpacity onPress={() => removeDay(day.id)}>
                    <Text style={styles.removeText}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.dayHeader} onPress={() => toggleExpanded(day.id)}>
                    <TextInput
                      style={styles.dayLabelInput}
                      value={day.label}
                      onChangeText={(text) => updateDayLabel(day.id, text)}
                      placeholder={`Jour ${dayIndex + 1}`}
                      placeholderTextColor={colors.textMuted}
                    />
                    <View style={styles.dayHeaderActions}>
                      <Text style={styles.exerciseCount}>{day.exercises.length} exo</Text>
                      <TouchableOpacity onPress={() => removeDay(day.id)} hitSlop={8}>
                        <Text style={styles.removeText}>Retirer</Text>
                      </TouchableOpacity>
                      <Text style={styles.chevron}>{expandedDayId === day.id ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>

                  {expandedDayId === day.id && (
                    <View style={styles.exercisesBlock}>
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <View key={exerciseIndex} style={styles.exerciseCard}>
                          <View style={styles.exerciseHeaderRow}>
                            <TextInput
                              style={styles.exerciseNameInput}
                              value={exercise.name}
                              onChangeText={(text) => updateExerciseField(day.id, exerciseIndex, 'name', text)}
                              placeholder="Nom de l'exercice"
                              placeholderTextColor={colors.textMuted}
                            />
                            <TouchableOpacity onPress={() => removeExerciseFromDay(day.id, exerciseIndex)} hitSlop={8}>
                              <Text style={styles.removeText}>✕</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.exerciseMetaRow}>
                            <TextInput
                              style={styles.metaInput}
                              value={exercise.muscleGroup}
                              onChangeText={(text) => updateExerciseField(day.id, exerciseIndex, 'muscleGroup', text)}
                              placeholder="Groupe musculaire"
                              placeholderTextColor={colors.textMuted}
                            />
                            <TextInput
                              style={styles.metaInput}
                              value={exercise.grip}
                              onChangeText={(text) => updateExerciseField(day.id, exerciseIndex, 'grip', text)}
                              placeholder="Prise / variante"
                              placeholderTextColor={colors.textMuted}
                            />
                          </View>

                          <Text style={styles.setsLabel}>Séries cibles</Text>
                          {exercise.targetSets.map((set, setIndex) => (
                            <View key={setIndex} style={styles.setRow}>
                              <TextInput
                                style={styles.setInput}
                                value={set.weight}
                                onChangeText={(text) => updateSetField(day.id, exerciseIndex, setIndex, 'weight', text)}
                                placeholder="kg"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                              />
                              <TextInput
                                style={styles.setInput}
                                value={set.reps}
                                onChangeText={(text) => updateSetField(day.id, exerciseIndex, setIndex, 'reps', text)}
                                placeholder="reps"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                              />
                              <TextInput
                                style={styles.setInput}
                                value={set.rpe}
                                onChangeText={(text) => updateSetField(day.id, exerciseIndex, setIndex, 'rpe', text)}
                                placeholder="RPE"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                              />
                              <TouchableOpacity onPress={() => removeSetFromExercise(day.id, exerciseIndex, setIndex)} hitSlop={8}>
                                <Text style={styles.removeText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ))}

                          <TouchableOpacity style={styles.addSetButton} onPress={() => addSetToExercise(day.id, exerciseIndex)}>
                            <Text style={styles.addSetButtonText}>+ Série</Text>
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity style={styles.addExerciseButton} onPress={() => addExerciseToDay(day.id)}>
                        <Text style={styles.addExerciseButtonText}>+ Exercice</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}

          <View style={styles.addDayRow}>
            <TouchableOpacity style={styles.addDayButton} onPress={addTrainingDay}>
              <Text style={styles.addDayButtonText}>+ Jour d'entraînement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addRestDayButton} onPress={addRestDay}>
              <Text style={styles.addRestDayButtonText}>+ Jour de repos</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer le programme</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1 },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backLink: { ...type.bodyStrong, color: colors.gold, marginBottom: spacing.xs },
  headerTitle: { ...type.display, color: colors.textPrimary },

  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  sectionLabel: {
    ...type.bodyStrong,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontSize: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  nameInput: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.pill,
  },

  dayCard: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },

  restDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  restDayLabel: { ...type.bodyStrong, color: colors.textPrimary },

  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dayLabelInput: { ...type.bodyStrong, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  dayHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseCount: { ...type.caption, color: colors.textMuted },
  chevron: { color: colors.textSecondary, fontSize: 12 },

  removeText: { ...type.caption, color: colors.danger },

  exercisesBlock: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },

  exerciseCard: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  exerciseNameInput: {
    flex: 1,
    color: colors.textPrimary,
    ...type.bodyStrong,
    borderBottomWidth: 1,
    borderBottomColor: colors.pillBorder,
    paddingBottom: 4,
    marginRight: spacing.sm,
  },

  exerciseMetaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  metaInput: {
    flex: 1,
    ...type.caption,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  setsLabel: { ...type.caption, color: colors.textMuted, marginBottom: spacing.xs, fontSize: 11 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  setInput: {
    flex: 1,
    ...type.caption,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },

  addSetButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
  addSetButtonText: { ...type.caption, color: colors.gold },

  addExerciseButton: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addExerciseButtonText: { ...type.caption, color: colors.textSecondary },

  addDayRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  addDayButton: {
    flex: 1,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addDayButtonText: { ...type.bodyStrong, color: colors.textPrimary, fontSize: 13 },

  addRestDayButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addRestDayButtonText: { ...type.caption, color: colors.textMuted },

  saveButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: { ...type.bodyStrong, color: '#1a1a1a' },
});