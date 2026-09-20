// src/screens/HistoryScreen.tsx
// Historique des séances terminées : tonnage, séries validées, RPE moyen par séance.

import React from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const { state, dispatch } = useAppContext();
  const { sessionHistory } = state;

  const handleDelete = (sessionId: string, dayLabel: string) => {
    Alert.alert('Supprimer cette séance ?', `La séance « ${dayLabel} » sera retirée de l’historique.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_SESSION', payload: sessionId }) },
    ]);
  };

  const totalSessions = sessionHistory.length;
  const totalTonnageAllTime = Math.round(
    sessionHistory.reduce((sum, session) => sum + session.totalTonnage, 0) * 10
  ) / 10;

  return (
    <View style={styles.container}>
      <OneForAllField count={12} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historique</Text>
          <Text style={styles.headerSubtitle}>
            {totalSessions} séance(s) · {totalTonnageAllTime.toLocaleString('fr-FR')} kg cumulés
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sessionHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucune séance enregistrée</Text>
              <Text style={styles.emptyText}>
                Termine une séance depuis l’onglet Programmes pour la voir apparaître ici.
              </Text>
            </View>
          ) : (
            sessionHistory.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionHeaderText}>
                    <Text style={styles.sessionDay}>{session.dayLabel}</Text>
                    <Text style={styles.sessionMeta}>
                      {session.programName} · {formatDate(session.date)} à {formatTime(session.date)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(session.id, session.dayLabel)} hitSlop={8}>
                    <Text style={styles.deleteText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{session.totalTonnage.toLocaleString('fr-FR')} kg</Text>
                    <Text style={styles.metricLabel}>Tonnage</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{session.totalValidatedSets}</Text>
                    <Text style={styles.metricLabel}>Séries</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: colors.gold }]}>
                      {session.averageRpe !== null ? session.averageRpe : '—'}
                    </Text>
                    <Text style={styles.metricLabel}>RPE moyen</Text>
                  </View>
                </View>

                <View style={styles.exerciseList}>
                  {session.exercises.map((exercise, index) => (
                    <View key={`${session.id}-${index}`} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseDetail}>
                        {exercise.validatedSets}/{exercise.totalSets} séries · {exercise.tonnage.toLocaleString('fr-FR')} kg
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
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

  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyTitle: { ...type.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { ...type.caption, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },

  sessionCard: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  sessionHeaderText: { flex: 1 },
  sessionDay: { ...type.h2, color: colors.textPrimary },
  sessionMeta: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  deleteText: { ...type.h1, color: colors.danger, marginLeft: spacing.sm },

  metricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { ...type.h2, color: colors.textPrimary },
  metricLabel: { ...type.caption, color: colors.textMuted, marginTop: 2, fontSize: 10 },

  exerciseList: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: spacing.sm },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  exerciseName: { ...type.bodyStrong, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  exerciseDetail: { ...type.caption, color: colors.textSecondary },
});