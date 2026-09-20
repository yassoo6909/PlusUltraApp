// src/components/RestTimer.tsx
// Minuteur de repos avec décompte, barre de progression, +/- 30 secondes et passage manuel.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = {
  durationSeconds: number;
  onFinish: () => void;
  onSkip: () => void;
};

export default function RestTimer({ durationSeconds, onFinish, onSkip }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const progress = useRef(new Animated.Value(1)).current;
  const hasFinished = useRef(false);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
    progress.setValue(1);
    hasFinished.current = false;

    return () => {
      progress.stopAnimation();
    };
  }, [durationSeconds, progress]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasFinished.current) {
        hasFinished.current = true;
        onFinish();
      }
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: secondsLeft * 1000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      progress.stopAnimation();
    };
  }, [secondsLeft, onFinish, progress]);

  const adjustTime = (seconds: number) => {
    setSecondsLeft((current) => Math.max(0, current + seconds));
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isAlmostDone = secondsLeft <= 10;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, isAlmostDone && styles.containerUrgent]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Repos en cours</Text>
        <TouchableOpacity onPress={onSkip} hitSlop={8}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.timeText, isAlmostDone && styles.timeTextUrgent]}>{timeLabel}</Text>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            isAlmostDone && styles.progressFillUrgent,
            { width: barWidth },
          ]}
        />
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(-30)} activeOpacity={0.8}>
          <Text style={styles.adjustText}>−30 s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(30)} activeOpacity={0.8}>
          <Text style={styles.adjustText}>+30 s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  containerUrgent: { borderColor: colors.gold, backgroundColor: colors.pillActive },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { ...type.caption, color: colors.textSecondary, fontWeight: '600' },
  skipText: { ...type.caption, color: colors.gold, fontWeight: '700' },
  timeText: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', textAlign: 'center', marginVertical: 4 },
  timeTextUrgent: { color: colors.gold },
  progressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
  progressFillUrgent: { backgroundColor: colors.danger },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  adjustButton: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    minWidth: 82,
    alignItems: 'center',
    paddingVertical: 7,
    marginHorizontal: spacing.xs,
  },
  adjustText: { ...type.caption, color: colors.textSecondary, fontWeight: '700' },
});