// src/components/TabBar.tsx
// Barre de navigation basse, style pilule translucide cohérent avec le reste de l'app.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';

export type TabKey = 'dashboard' | 'programs' | 'history' | 'profile';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Accueil', icon: '⌂' },
  { key: 'programs', label: 'Programmes', icon: '☰' },
  { key: 'history', label: 'Historique', icon: '◷' },
  { key: 'profile', label: 'Profil', icon: '◉' },
];

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export default function TabBar({ activeTab, onChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {active && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  icon: { fontSize: 18, color: colors.textMuted, marginBottom: 2 },
  iconActive: { color: colors.gold },
  label: { ...type.caption, fontSize: 10, color: colors.textMuted },
  labelActive: { color: colors.gold, fontWeight: '700' },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
});