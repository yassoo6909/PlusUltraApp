// src/components/RestTimer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '../theme/colors';

type Props = {
  durationSeconds: number;
  onFinish: () => void;
  onSkip: () => void;
};

export default function RestTimer({ durationSeconds, onFinish, onSkip }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setSecondsLeft(durationSeconds);
    progress.setValue(1);

    Animated.timing(progress, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSeconds]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const isAlmostDone = secondsLeft <= 10;

  return (
    <View style={[styles.container, isAlmostDone && styles.containerUrgent]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Repos en cours</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.timeText, isAlmostDone && styles.timeTextUrgent]}>{timeLabel}</Text>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: barWidth }, isAlmostDone && styles.progressFillUrgent]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  containerUrgent: { borderColor: colors.gold, backgroundColor: colors.pillActive },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  skipText: { color: colors.gold, fontWeight: '600', fontSize: 12 },
  timeText: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', textAlign: 'center', marginVertical: 4 },
  timeTextUrgent: { color: colors.gold },
  progressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: colors.blue, borderRadius: 3 },
  progressFillUrgent: { backgroundColor: colors.gold },
});