// src/screens/ProfileScreen.tsx
// Ajout de la photo de profil : appui sur l'avatar → choix Galerie ou Appareil photo
// via expo-image-picker. L'URI locale est stockée dans profile.avatarUri (persisté).
//
// Installation requise avant de tester :
//   npx expo install expo-image-picker

import React, { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, type } from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import OneForAllField from '../components/OneForAllField';

const LEVELS: Array<'Débutant' | 'Intermédiaire' | 'Avancé'> = ['Débutant', 'Intermédiaire', 'Avancé'];
const REST_PRESETS = [60, 90, 120, 180];

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const { state, dispatch } = useAppContext();
  const { profile, preferences, healthSync, sessionHistory } = state;

  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.displayName);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const globalStats = useMemo(() => {
    const totalSessions = sessionHistory.length;
    const totalTonnage = Math.round(
      sessionHistory.reduce((sum, s) => sum + s.totalTonnage, 0) * 10
    ) / 10;
    const totalSets = sessionHistory.reduce((sum, s) => sum + s.totalValidatedSets, 0);
    return { totalSessions, totalTonnage, totalSets };
  }, [sessionHistory]);

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length > 0) {
      dispatch({ type: 'UPDATE_PROFILE', payload: { displayName: trimmed } });
    }
    setNameModalVisible(false);
  };

  const setLevel = (level: 'Débutant' | 'Intermédiaire' | 'Avancé') => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { level } });
  };

  const setWeightUnit = (unit: 'kg' | 'lb') => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: { weightUnit: unit } });
  };

  const setDefaultRest = (seconds: number) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: { defaultRestSeconds: seconds } });
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', "Autorise l'accès à tes photos dans les réglages pour choisir un avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      dispatch({ type: 'UPDATE_PROFILE', payload: { avatarUri: result.assets[0].uri } });
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', "Autorise l'accès à l'appareil photo dans les réglages pour prendre une photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      dispatch({ type: 'UPDATE_PROFILE', payload: { avatarUri: result.assets[0].uri } });
    }
  };

  const removeAvatar = () => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { avatarUri: null } });
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      const options = profile.avatarUri
        ? ['Prendre une photo', 'Choisir dans la galerie', 'Supprimer la photo', 'Annuler']
        : ['Prendre une photo', 'Choisir dans la galerie', 'Annuler'];
      const cancelButtonIndex = options.length - 1;
      const destructiveButtonIndex = profile.avatarUri ? 2 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, destructiveButtonIndex },
        (index) => {
          if (index === 0) pickFromCamera();
          else if (index === 1) pickFromLibrary();
          else if (profile.avatarUri && index === 2) removeAvatar();
        }
      );
    } else {
      setAvatarModalVisible(true);
    }
  };

  const toggleHealthSync = () => {
    if (!healthSync.enabled) {
      Alert.alert(
        'Synchronisation santé',
        "La connexion réelle à Apple Health nécessite une version buildée de l'app (Dev Client), pas la version de test actuelle. Active ce réglage pour préparer la connexion — la synchronisation des séances démarrera dès que le module natif sera installé.",
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer',
            onPress: () => dispatch({ type: 'TOGGLE_HEALTH_SYNC', payload: { platform: 'apple_health' } }),
          },
        ]
      );
    } else {
      dispatch({ type: 'TOGGLE_HEALTH_SYNC', payload: { platform: null } });
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser toutes les données ?',
      'Programmes, historique et préférences seront définitivement supprimés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: () => dispatch({ type: 'RESET_ALL_DATA' }) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <OneForAllField count={12} />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profil</Text>
          </View>

          <View style={styles.identityCard}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              <View style={styles.avatar}>
                {profile.avatarUri ? (
                  <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{profile.displayName.charAt(0).toUpperCase()}</Text>
                )}
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>✎</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.identityInfo}>
              <TouchableOpacity onPress={() => { setNameDraft(profile.displayName); setNameModalVisible(true); }}>
                <Text style={styles.displayName}>{profile.displayName} ✎</Text>
              </TouchableOpacity>
              <Text style={styles.memberSince}>Membre depuis {formatMemberSince(profile.memberSince)}</Text>
            </View>
          </View>

          <View style={styles.levelRow}>
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.levelPill, profile.level === level && styles.levelPillActive]}
                onPress={() => setLevel(level)}
              >
                <Text style={[styles.levelPillText, profile.level === level && styles.levelPillTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{globalStats.totalSessions}</Text>
              <Text style={styles.statLabel}>Séances totales</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{globalStats.totalTonnage.toLocaleString('fr-FR')} kg</Text>
              <Text style={styles.statLabel}>Tonnage cumulé</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{globalStats.totalSets}</Text>
              <Text style={styles.statLabel}>Séries validées</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Préférences</Text>

          <View style={styles.settingBlock}>
            <Text style={styles.settingLabel}>Unité de poids</Text>
            <View style={styles.unitRow}>
              {(['kg', 'lb'] as const).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitPill, preferences.weightUnit === unit && styles.unitPillActive]}
                  onPress={() => setWeightUnit(unit)}
                >
                  <Text style={[styles.unitPillText, preferences.weightUnit === unit && styles.unitPillTextActive]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingBlock}>
            <Text style={styles.settingLabel}>Repos par défaut</Text>
            <View style={styles.unitRow}>
              {REST_PRESETS.map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[styles.unitPill, preferences.defaultRestSeconds === seconds && styles.unitPillActive]}
                  onPress={() => setDefaultRest(seconds)}
                >
                  <Text
                    style={[styles.unitPillText, preferences.defaultRestSeconds === seconds && styles.unitPillTextActive]}
                  >
                    {seconds}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Santé</Text>

          <View style={styles.healthCard}>
            <View style={styles.healthCardRow}>
              <View style={styles.healthCardText}>
                <Text style={styles.settingLabel}>Synchroniser avec Apple Health</Text>
                <Text style={styles.healthCardCaption}>
                  {healthSync.enabled
                    ? 'Préparé — la synchronisation démarrera après un build natif.'
                    : "Envoie automatiquement tes séances vers l'app Santé."}
                </Text>
              </View>
              <Switch
                value={healthSync.enabled}
                onValueChange={toggleHealthSync}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.gold }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Données</Text>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Réinitialiser toutes les données</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={nameModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Modifier ton nom</Text>
              <TextInput
                style={styles.modalInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Ton nom"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setNameModalVisible(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveName} style={styles.modalSave}>
                  <Text style={styles.modalSaveText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Sélecteur Android/fallback : ActionSheetIOS n'existe que sur iOS */}
        <Modal visible={avatarModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Photo de profil</Text>

              <TouchableOpacity
                style={styles.avatarOption}
                onPress={() => { setAvatarModalVisible(false); pickFromCamera(); }}
              >
                <Text style={styles.avatarOptionText}>Prendre une photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarOption}
                onPress={() => { setAvatarModalVisible(false); pickFromLibrary(); }}
              >
                <Text style={styles.avatarOptionText}>Choisir dans la galerie</Text>
              </TouchableOpacity>

              {profile.avatarUri && (
                <TouchableOpacity
                  style={styles.avatarOption}
                  onPress={() => { setAvatarModalVisible(false); removeAvatar(); }}
                >
                  <Text style={[styles.avatarOptionText, { color: colors.danger }]}>Supprimer la photo</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setAvatarModalVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  header: { paddingVertical: spacing.md },
  headerTitle: { ...type.display, color: colors.textPrimary },

  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'visible',
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarInitial: { ...type.h1, color: '#1a1a1a' },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface ?? '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  avatarBadgeText: { fontSize: 10, color: colors.textPrimary },
  identityInfo: { flex: 1 },
  displayName: { ...type.h2, color: colors.textPrimary },
  memberSince: { ...type.caption, color: colors.textSecondary, marginTop: 2 },

  levelRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  levelPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    alignItems: 'center',
  },
  levelPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  levelPillText: { ...type.caption, color: colors.textSecondary },
  levelPillTextActive: { color: '#1a1a1a', fontWeight: '600' },

  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { ...type.h2, color: colors.textPrimary },
  statLabel: { ...type.caption, color: colors.textMuted, marginTop: 4, fontSize: 10, textAlign: 'center' },

  sectionTitle: { ...type.bodyStrong, color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.sm, textTransform: 'uppercase', fontSize: 12 },

  settingBlock: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settingLabel: { ...type.bodyStrong, color: colors.textPrimary, marginBottom: spacing.sm },
  unitRow: { flexDirection: 'row', gap: spacing.sm },
  unitPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  unitPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  unitPillText: { ...type.caption, color: colors.textSecondary },
  unitPillTextActive: { color: '#1a1a1a', fontWeight: '600' },

  healthCard: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  healthCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  healthCardText: { flex: 1, marginRight: spacing.md },
  healthCardCaption: { ...type.caption, color: colors.textSecondary, marginTop: 4 },

  resetButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetButtonText: { ...type.bodyStrong, color: colors.danger },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface ?? '#1c1c1e', borderRadius: radius.md, padding: spacing.lg },
  modalTitle: { ...type.h2, color: colors.textPrimary, marginBottom: spacing.md },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  modalCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalCancelText: { ...type.bodyStrong, color: colors.textSecondary },
  modalSave: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.gold, borderRadius: radius.sm },
  modalSaveText: { ...type.bodyStrong, color: '#1a1a1a' },

  avatarOption: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  avatarOptionText: { ...type.bodyStrong, color: colors.textPrimary, textAlign: 'center' },
});
