// src/screens/ProgramsScreen.tsx
// Liste, lancement, édition et suppression des programmes.

import React from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
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

  const handleCreate = () => {
    dispatch({ type: 'STOP_EDIT_PROGRAM' });
    dispatch({ type: 'NAVIGATE', payload: 'program-builder' });
  };

  const handleEdit = (programId: string) => {
    dispatch({ type: 'START_EDIT_PROGRAM', payload: programId });
    dispatch({ type: 'NAVIGATE', payload: 'program-builder' });
  };

  const handleDelete = (programId: string, programName: string) => {
    if (programs.length === 1) {
      Alert.alert('Suppression impossible', 'Garde au moins un programme dans ton application.');
      return;
    }

    Alert.alert(
      'Supprimer le programme ?',
      `« ${programName} » sera supprimé définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_PROGRAM', payload: programId }),
        },
      ]
    );
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

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(program.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(program.id, program.name)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.createPill} activeOpacity={0.8} onPress={handleCreate}>
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
  programName: { ...type.h2, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
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

  actionsRow: { flexDirection: 'row', marginTop: spacing.md },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.pillActiveBorder,
    borderRadius: radius.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  editButtonText: { ...type.caption, color: colors.gold, fontWeight: '700' },
  deleteButton: {
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    borderRadius: radius.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  deleteButtonText: { ...type.caption, color: colors.danger, fontWeight: '700' },

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