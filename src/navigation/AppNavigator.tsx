// src/navigation/AppNavigator.tsx
// Fix : le LinearGradient couvre maintenant tout l'écran (y compris sous la tab bar),
// au lieu de s'arrêter à screenArea. Ça élimine le raccord bordure bleu foncé/dégradé
// visible en bas d'écran. La tab bar devient un overlay semi-transparent posé dessus,
// cohérent avec le style "pilule" du reste de l'app.

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import { gradients } from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import CheckInScreen from '../screens/CheckInScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProgramsScreen from '../screens/ProgramsScreen';
import TabBar, { TabKey } from '../components/TabBar';

const ROOT_SCREENS = ['dashboard', 'programs', 'history', 'profile'];

export default function AppNavigator() {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    dispatch({ type: 'NAVIGATE', payload: tab });
  };

  const renderScreen = () => {
    switch (state.screen) {
      case 'checkin':
        return <CheckInScreen />;
      case 'workout':
        return <WorkoutScreen />;
      case 'programs':
        return <ProgramsScreen />;
      case 'history':
        return <DashboardScreen />;
      case 'profile':
        return <DashboardScreen />;
      case 'dashboard':
      default:
        return <DashboardScreen />;
    }
  };

  const showTabBar = ROOT_SCREENS.includes(state.screen);

  return (
    <LinearGradient colors={gradients.hero} style={styles.container}>
      <View style={styles.screenArea}>{renderScreen()}</View>
      {showTabBar && (
        <View style={styles.tabBarWrapper}>
          <TabBar activeTab={activeTab} onChange={handleTabChange} />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenArea: { flex: 1 },
  tabBarWrapper: {
    backgroundColor: 'transparent',
    paddingBottom: 4, // marge de sécurité pour la home indicator sur iPhone à encoche
  },
});