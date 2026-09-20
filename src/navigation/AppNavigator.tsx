// src/navigation/AppNavigator.tsx
// Ajout de l'écran Profil à la place du placeholder Dashboard.

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import { gradients } from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import CheckInScreen from '../screens/CheckInScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProgramsScreen from '../screens/ProgramsScreen';
import ProgramBuilderScreen from '../screens/ProgramBuilderScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
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
      case 'program-builder':
        return <ProgramBuilderScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'profile':
        return <ProfileScreen />;
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
    paddingBottom: 4,
  },
});