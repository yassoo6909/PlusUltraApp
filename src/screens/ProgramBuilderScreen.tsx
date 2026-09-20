// src/screens/ProgramBuilderScreen.tsx
// Création et édition d'un programme : nom + jours + exercices + séries cibles.

import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { ExerciseTemplate, Program, ProgramDay, useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

type DraftDay = {
  id: string;
  label: string;
  exercises: ExerciseTemplate[];
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeExercise(): ExerciseTemplate {
  return {
    name: 'Nouvel exercice',
    muscleGroup: 'AUTRE',
    grip: '—',
    targetSets: [
      { weight: '', reps: '10', rpe: '8' },
      { weight: '', reps: '10', rpe: '8' },
      { weight: '', reps: '10', rpe: '8' },
    ],
  };
}

function makeEmptyDays(): DraftDay[] {
  return [{ id: makeId('day'), label: 'Jour 1', exercises: [makeExercise()] }];
}

function cloneDays(days: ProgramDay[]): DraftDay[] {
  return days.map((day) => ({
    id: day.id,
    label: day.label,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      targetSets: exercise.targetSets.map((set) => ({ ...set })),
    })),
  }));
}

export default function ProgramBuilderScreen() {
  const { state, dispatch } = useAppContext();
  const editingProgram = state.editingProgramId
    ? state.programs.find((program) => program.id === state.editingProgramId)
    : undefined;
  const isEditing = Boolean(editingProgram);

  const [programName, setProgramName] = useState('');
  const [days, setDays] = useState<DraftDay[]>(makeEmptyDays);

  // Quand l'utilisateur ouvre « Modifier », l'éditeur se remplit avec une copie
  // indépendante du programme sélectionné. Les changements ne touchent donc pas
  // le vrai programme avant l'appui sur Enregistrer.
  useEffect(() => {
    if (editingProgram) {
      setProgramName(editingProgram.name);
      setDays(cloneDays(editingProgram.days));
    } else {
      setProgramName('');
      setDays(makeEmptyDays());
    }
  }, [state.editingProgramId]);

  const closeBuilder = () => {
    dispatch({ type: 'STOP_EDIT_PROGRAM' });
    dispatch({ type: 'NAVIGATE', payload: 'programs' });
  };

  const updateDayLabel = (dayId: string, label: string) => {
    setDays((current) => current.map((day) => (day.id === dayId ? { ...day, label } : day)));
  };

  const addDay = () => {
    setDays((current) => [
      ...current,
      { id: makeId('day'), label: `Jour ${current.length + 1}`, exercises: [makeExercise()] },
    ]);
  };

  const removeDay = (dayId: string) => {
    if (days.length === 1) {
      Alert.alert('Un jour minimum', 'Un programme doit contenir au moins un jour.');
      return;
    }
    setDays((current) => current.filter((day) => day.id !== dayId));
  };

  const addExercise = (dayId: string) => {
    setDays((current) =>
      current.map((day) =>
        day.id === dayId ? { ...day, exercises: [...day.exercises, makeExercise()] } : day
      )
    );
  };

  const removeExercise = (dayId: string, exerciseIndex: number) => {
    const day = days.find((item) => item.id === dayId);
    if (day && day.exercises.length === 1) {
      Alert.alert('Un exercice minimum', 'Chaque jour doit contenir au moins un exercice.');
      return;
    }
    setDays((current) =>
      current.map((item) =>
        item.id === dayId
          ? { ...item, exercises: item.exercises.filter((_, index) => index !== exerciseIndex) }
          : item
      )
    );
  };

  const updateExerciseField = (
    dayId: string,
    exerciseIndex: number,
    field: 'name' | 'muscleGroup' | 'grip',
    value: string
  ) => {
    setDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise, index) =>
            index === exerciseIndex ? { ...exercise, [field]: value } : exercise
          ),
        };
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
    setDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise, index) => {
            if (index !== exerciseIndex) return exercise;
            return {
              ...exercise,
              targetSets: exercise.targetSets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex ? { ...set, [field]: value } : set
              ),
            };
          }),
        };
      })
    );
  };

  const addSet = (dayId: string, exerciseIndex: number) => {
    setDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise, index) =>
            index === exerciseIndex
              ? { ...exercise, targetSets: [...exercise.targetSets, { weight: '', reps: '10', rpe: '8' }] }
              : exercise
          ),
        };
      })
    );
  };

  const removeSet = (dayId: string, exerciseIndex: number, setIndex: number) => {
    const day = days.find((item) => item.id === dayId);
    const exercise = day?.exercises[exerciseIndex];
    if (exercise && exercise.targetSets.length === 1) {
      Alert.alert('Une série minimum', 'Chaque exercice doit contenir au moins une série.');
      return;
    }

    setDays((current) =>
      current.map((item) => {
        if (item.id !== dayId) return item;
        return {
          ...item,
          exercises: item.exercises.map((itemExercise, index) =>
            index === exerciseIndex
              ? { ...itemExercise, targetSets: itemExercise.targetSets.filter((_, currentIndex) => currentIndex !== setIndex) }
              : itemExercise
          ),
        };
      })
    );
  };

  const saveProgram = () => {
    const name = programName.trim();
    if (!name) {
      Alert.alert('Nom manquant', 'Donne un nom à ton programme avant de l’enregistrer.');
      return;
    }

    const validDays: ProgramDay[] = days.map((day) => ({
      id: day.id,
      label: day.label.trim() || 'Jour sans nom',
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        name: exercise.name.trim() || 'Exercice sans nom',
        muscleGroup: exercise.muscleGroup.trim().toUpperCase() || 'AUTRE',
        grip: exercise.grip.trim() || '—',
      })),
    }));

    const program: Program = {
      id: editingProgram?.id ?? makeId('program'),
      name,
      days: validDays,
    };

    dispatch({ type: 'SAVE_PROGRAM', payload: program });
    dispatch({ type: 'SET_ACTIVE_PROGRAM', payload: program.id });
    dispatch({ type: 'NAVIGATE', payload: 'programs' });
  };

  return (
    <View style={styles.container}>
      <OneForAllField count={12} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{isEditing ? 'Modifier le programme' : 'Nouveau programme'}</Text>
            <Text style={styles.headerSubtitle}>
              {isEditing ? 'Mets à jour tes jours et tes exercices' : 'Construis tes jours et tes exercices'}
            </Text>
          </View>
          <TouchableOpacity onPress={closeBuilder}>
            <Text style={styles.cancelLink}>Annuler</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.pill}>
              <Text style={styles.fieldLabel}>Nom du programme</Text>
              <TextInput
                style={styles.programNameInput}
                placeholder="Ex. Push / Pull / Legs — Sèche"
                placeholderTextColor={colors.textMuted}
                value={programName}
                onChangeText={setProgramName}
                returnKeyType="done"
              />
            </View>

            {days.map((day, dayIndex) => (
              <View key={day.id} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <TextInput
                    style={styles.dayNameInput}
                    value={day.label}
                    onChangeText={(value) => updateDayLabel(day.id, value)}
                    placeholder={`Jour ${dayIndex + 1}`}
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity onPress={() => removeDay(day.id)} hitSlop={8}>
                    <Text style={styles.removeText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>

                {day.exercises.map((exercise, exerciseIndex) => (
                  <View key={`${day.id}-${exerciseIndex}`} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseNumber}>EXERCICE {exerciseIndex + 1}</Text>
                      <TouchableOpacity onPress={() => removeExercise(day.id, exerciseIndex)} hitSlop={8}>
                        <Text style={styles.removeText}>×</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={styles.exerciseNameInput}
                      value={exercise.name}
                      onChangeText={(value) => updateExerciseField(day.id, exerciseIndex, 'name', value)}
                      placeholder="Nom de l'exercice"
                      placeholderTextColor={colors.textMuted}
                    />

                    <View style={styles.metaRow}>
                      <TextInput
                        style={[styles.metaInput, styles.metaInputLeft]}
                        value={exercise.muscleGroup}
                        onChangeText={(value) => updateExerciseField(day.id, exerciseIndex, 'muscleGroup', value)}
                        placeholder="Groupe"
                        placeholderTextColor={colors.textMuted}
                      />
                      <TextInput
                        style={styles.metaInput}
                        value={exercise.grip}
                        onChangeText={(value) => updateExerciseField(day.id, exerciseIndex, 'grip', value)}
                        placeholder="Prise"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={styles.setHeader}>
                      <Text style={[styles.setHeaderText, styles.setNumber]}>Série</Text>
                      <Text style={[styles.setHeaderText, styles.setField]}>Kg</Text>
                      <Text style={[styles.setHeaderText, styles.setField]}>Reps</Text>
                      <Text style={[styles.setHeaderText, styles.setField]}>RPE</Text>
                      <Text style={styles.setDeleteSpacer}>{' '}</Text>
                    </View>

                    {exercise.targetSets.map((set, setIndex) => (
                      <View key={`${day.id}-${exerciseIndex}-${setIndex}`} style={styles.setRow}>
                        <Text style={[styles.setNumber, styles.setIndex]}>{setIndex + 1}</Text>
                        <TextInput
                          style={[styles.setInput, styles.setField]}
                          value={set.weight}
                          onChangeText={(value) => updateSetField(day.id, exerciseIndex, setIndex, 'weight', value)}
                          placeholder="—"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                        />
                        <TextInput
                          style={[styles.setInput, styles.setField]}
                          value={set.reps}
                          onChangeText={(value) => updateSetField(day.id, exerciseIndex, setIndex, 'reps', value)}
                          keyboardType="number-pad"
                        />
                        <TextInput
                          style={[styles.setInput, styles.setField]}
                          value={set.rpe}
                          onChangeText={(value) => updateSetField(day.id, exerciseIndex, setIndex, 'rpe', value)}
                          keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                          style={styles.setDelete}
                          onPress={() => removeSet(day.id, exerciseIndex, setIndex)}
                          hitSlop={8}
                        >
                          <Text style={styles.setDeleteText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={() => addSet(day.id, exerciseIndex)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addSetText}>+ Ajouter une série</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={() => addExercise(day.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addExerciseText}>+ Ajouter un exercice</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addDayButton} onPress={addDay} activeOpacity={0.8}>
              <Text style={styles.addDayText}>+ Ajouter un jour</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveProgram} activeOpacity={0.85}>
            <Text style={styles.saveText}>
              {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le programme'}
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
  keyboardArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { ...type.h1, color: colors.textPrimary },
  headerSubtitle: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  cancelLink: { ...type.body, color: colors.gold, fontWeight: '600' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  pill: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fieldLabel: { ...type.label, color: colors.textMuted, marginBottom: spacing.sm },
  programNameInput: {
    ...type.h2,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.pillBorder,
    paddingVertical: spacing.sm,
  },

  dayCard: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayNameInput: { ...type.h2, color: colors.textPrimary, flex: 1, paddingVertical: 4 },
  removeText: { ...type.caption, color: colors.danger, fontWeight: '600', marginLeft: spacing.md },

  exerciseCard: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  exerciseNumber: { ...type.label, color: colors.gold },
  exerciseNameInput: {
    ...type.bodyStrong,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.pillBorder,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaRow: { flexDirection: 'row', marginBottom: spacing.md },
  metaInput: {
    ...type.caption,
    color: colors.textSecondary,
    flex: 1,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  metaInputLeft: { marginRight: spacing.sm },

  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  setHeaderText: { ...type.label, color: colors.textMuted, textAlign: 'center', fontSize: 9 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  setNumber: { width: 38, textAlign: 'center' },
  setIndex: { ...type.bodyStrong, color: colors.textSecondary },
  setField: { flex: 1 },
  setInput: {
    ...type.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    paddingVertical: 7,
    marginHorizontal: 2,
  },
  setDelete: { width: 26, alignItems: 'center', justifyContent: 'center' },
  setDeleteSpacer: { width: 26 },
  setDeleteText: { ...type.h2, color: colors.danger },
  addSetButton: { alignItems: 'center', paddingTop: spacing.sm },
  addSetText: { ...type.caption, color: colors.gold, fontWeight: '600' },

  addExerciseButton: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addExerciseText: { ...type.caption, color: colors.textSecondary, fontWeight: '600' },

  addDayButton: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addDayText: { ...type.bodyStrong, color: colors.textSecondary },

  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  saveButton: {
    backgroundColor: colors.ctaBackground,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  saveText: { ...type.h2, color: colors.ctaText },
});