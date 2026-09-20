// src/components/SetRow.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '../theme/colors';

type SetItem = {
  id: number;
  previous: string;
  weight: string;
  reps: string;
  rpe: string;
  validated: boolean;
};

type Props = {
  set: SetItem;
  onFieldChange: (setId: number, field: 'weight' | 'reps' | 'rpe', value: string) => void;
  onValidate: (setId: number) => void;
};

export default function SetRow({ set, onFieldChange, onValidate }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const wasValidated = useRef(set.validated);

  useEffect(() => {
    if (set.validated && !wasValidated.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 140, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 140, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]).start();
    }
    wasValidated.current = set.validated;
  }, [set.validated]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [set.validated ? colors.pillActiveBorder : colors.pillBorder, colors.gold],
  });

  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Animated.View
        style={[
          styles.tableRow,
          set.validated && styles.rowValidated,
          {
            borderColor,
            shadowColor: colors.gold,
            shadowOpacity,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <View style={[styles.cell, styles.cellSerie]}>
          <Text style={styles.rowText}>{set.id}</Text>
        </View>

        <View style={[styles.cell, styles.cellPrevious]}>
          <Text style={styles.rowSubText} numberOfLines={1}>{set.previous}</Text>
        </View>

        <View style={[styles.cell, styles.cellInput]}>
          <TextInput
            style={styles.input}
            value={set.weight}
            onChangeText={(v) => onFieldChange(set.id, 'weight', v)}
            keyboardType="numeric"
            editable={!set.validated}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={[styles.cell, styles.cellInput]}>
          <TextInput
            style={styles.input}
            value={set.reps}
            onChangeText={(v) => onFieldChange(set.id, 'reps', v)}
            keyboardType="numeric"
            editable={!set.validated}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={[styles.cell, styles.cellInput]}>
          <TextInput
            style={styles.inputRpe}
            value={set.rpe}
            onChangeText={(v) => onFieldChange(set.id, 'rpe', v)}
            keyboardType="numeric"
            editable={!set.validated}
            placeholder="-"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={[styles.cell, styles.cellAction]}>
          <TouchableOpacity
            style={[styles.validateButton, set.validated && styles.validatedButtonColor]}
            onPress={() => onValidate(set.id)}
            disabled={set.validated}
            activeOpacity={0.7}
          >
            <Text style={[styles.validateButtonText, set.validated && styles.validateButtonTextDone]}>
              {set.validated ? '✓' : 'VAL'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export const ROW_FLEX = {
  serie: 0.7,
  previous: 1.6,
  input: 1,
  action: 1,
};

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: colors.pill,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  rowValidated: { backgroundColor: colors.pillActive },
  cell: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cellSerie: { flex: ROW_FLEX.serie },
  cellPrevious: { flex: ROW_FLEX.previous },
  cellInput: { flex: ROW_FLEX.input },
  cellAction: { flex: ROW_FLEX.action },
  rowText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  rowSubText: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: colors.textPrimary,
    width: '100%',
    paddingVertical: 8,
    textAlign: 'center',
    borderRadius: radius.sm,
    fontSize: 13,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  inputRpe: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: colors.gold,
    width: '100%',
    paddingVertical: 8,
    textAlign: 'center',
    borderRadius: radius.sm,
    fontSize: 13,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  validateButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 9,
    borderRadius: radius.sm,
    width: '92%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  validatedButtonColor: { backgroundColor: colors.gold, borderColor: colors.gold },
  validateButtonText: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
  validateButtonTextDone: { color: '#0f1c3f' },
});