// src/context/AppContext.tsx
// Ajout du Profil : identité, préférences (unité, repos par défaut), et un objet
// healthSync préparé pour le futur branchement Apple Health / Health Connect
// (nécessitera un Dev Client custom, pas géré ici).

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SetItem = {
  id: number;
  previous: string;
  weight: string;
  reps: string;
  rpe: string;
  validated: boolean;
};

export type CurrentExercise = {
  name: string;
  muscleGroup: string;
  grip: string;
  sets: SetItem[];
};

export type ExerciseTemplate = {
  name: string;
  muscleGroup: string;
  grip: string;
  targetSets: { weight: string; reps: string; rpe: string }[];
};

export type ProgramDay = {
  id: string;
  label: string;
  exercises: ExerciseTemplate[];
};

export type Program = {
  id: string;
  name: string;
  days: ProgramDay[];
};

export type CompletedExercise = {
  name: string;
  muscleGroup: string;
  validatedSets: number;
  totalSets: number;
  tonnage: number;
  averageRpe: number | null;
};

export type WorkoutSession = {
  id: string;
  date: string;
  programName: string;
  dayLabel: string;
  exercises: CompletedExercise[];
  totalTonnage: number;
  totalValidatedSets: number;
  averageRpe: number | null;
};

// --- Nouveau : Profil et préférences ---
export type WeightUnit = 'kg' | 'lb';

export type UserProfile = {
  displayName: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  memberSince: string;
  avatarUri: string | null;
};

export type UserPreferences = {
  weightUnit: WeightUnit;
  defaultRestSeconds: number;
  defaultEnergyLevel: string;
};

// Objet préparé pour la future intégration Apple Health / Health Connect.
// Le toggle est stocké dès maintenant pour ne pas re-designer l'écran Profil
// quand le vrai module natif (react-native-health) sera ajouté via un Dev Client.
export type HealthSyncSettings = {
  enabled: boolean;
  platform: 'apple_health' | 'health_connect' | null;
  lastSyncDate: string | null;


};

type PersistedState = Pick<
  AppState,
  | 'programs'
  | 'activeProgramId'
  | 'activeDayId'
  | 'activeExerciseIndex'
  | 'energyLevel'
  | 'sessionHistory'
  | 'profile'
  | 'preferences'
  | 'healthSync'
>;

type AppState = {
  screen: string;
  painArea: string | null;
  resting: boolean;
  restDuration: number;
  energyLevel: string;
  currentExercise: CurrentExercise;

  programs: Program[];
  activeProgramId: string | null;
  activeDayId: string | null;
  activeExerciseIndex: number;

  sessionHistory: WorkoutSession[];
  sessionExerciseLog: CompletedExercise[];

  profile: UserProfile;
  preferences: UserPreferences;
  healthSync: HealthSyncSettings;

  editingProgramId: string | null;
  isHydrated: boolean;
};

type Action =
  | { type: 'NAVIGATE'; payload: string }
  | { type: 'SET_PAIN_AREA'; payload: string }
  | { type: 'SET_ENERGY_LEVEL'; payload: string }
  | { type: 'UPDATE_SET_FIELD'; payload: { setId: number; field: 'weight' | 'reps' | 'rpe'; value: string } }
  | { type: 'VALIDATE_SET'; payload: number }
  | { type: 'ADD_SET' }
  | { type: 'END_REST' }
  | { type: 'END_WORKOUT' }
  | { type: 'SAVE_PROGRAM'; payload: Program }
  | { type: 'DELETE_PROGRAM'; payload: string }
  | { type: 'SET_ACTIVE_PROGRAM'; payload: string }
  | { type: 'START_EDIT_PROGRAM'; payload: string }
  | { type: 'STOP_EDIT_PROGRAM' }
  | { type: 'LOAD_WORKOUT_DAY'; payload: { programId: string; dayId: string; exerciseIndex?: number } }
  | { type: 'NEXT_EXERCISE_IN_DAY' }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'TOGGLE_HEALTH_SYNC'; payload: { platform: HealthSyncSettings['platform'] } }
  | { type: 'RESET_ALL_DATA' }
  | { type: 'HYDRATE'; payload: Partial<PersistedState> };

const STORAGE_KEY = '@plusultra/persisted_state_v1';

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildCurrentExercise(template: ExerciseTemplate): CurrentExercise {
  return {
    name: template.name,
    muscleGroup: template.muscleGroup,
    grip: template.grip,
    sets: template.targetSets.map((s, i) => ({
      id: i + 1,
      previous: '—',
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
      validated: false,
    })),
  };
}

function summarizeExercise(exercise: CurrentExercise): CompletedExercise {
  const validatedSets = exercise.sets.filter((s) => s.validated);
  const tonnage = validatedSets.reduce((total, s) => {
    const weight = parseFloat(s.weight.replace(',', '.')) || 0;
    const reps = parseFloat(s.reps.replace(',', '.')) || 0;
    return total + weight * reps;
  }, 0);

  const rpeValues = validatedSets
    .map((s) => parseFloat(s.rpe.replace(',', '.')))
    .filter((value) => !Number.isNaN(value));
  const averageRpe = rpeValues.length > 0
    ? Math.round((rpeValues.reduce((sum, v) => sum + v, 0) / rpeValues.length) * 10) / 10
    : null;

  return {
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    validatedSets: validatedSets.length,
    totalSets: exercise.sets.length,
    tonnage: Math.round(tonnage * 10) / 10,
    averageRpe,
  };
}

const defaultProgram: Program = {
  id: 'default',
  name: 'Sèche — Push/Pull/Legs',
  days: [
    {
      id: 'pull-j3',
      label: 'Pull · Sèche J3',
      exercises: [
        {
          name: 'Tirage Vertical Poitrine',
          muscleGroup: 'DOS',
          grip: 'Pronation',
          targetSets: [
            { weight: '80', reps: '10', rpe: '8.5' },
            { weight: '80', reps: '9', rpe: '9' },
          ],
        },
      ],
    },
  ],
};

const initialState: AppState = {
  screen: 'dashboard',
  painArea: null,
  resting: false,
  restDuration: 90,
  energyLevel: 'Plus Ultra',
  currentExercise: buildCurrentExercise(defaultProgram.days[0].exercises[0]),

  programs: [defaultProgram],
  activeProgramId: defaultProgram.id,
  activeDayId: defaultProgram.days[0].id,
  activeExerciseIndex: 0,

  sessionHistory: [],
  sessionExerciseLog: [],

    profile: {
      displayName: 'Yassine',
      level: 'Intermédiaire',
      memberSince: new Date().toISOString(),
      avatarUri: null,
    },
  preferences: {
    weightUnit: 'kg',
    defaultRestSeconds: 90,
    defaultEnergyLevel: 'Plus Ultra',
  },
  healthSync: {
    enabled: false,
    platform: null,
    lastSyncDate: null,
  },

  editingProgramId: null,
  isHydrated: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, isHydrated: true };

    case 'NAVIGATE':
      return { ...state, screen: action.payload };

    case 'SET_PAIN_AREA':
      return { ...state, painArea: state.painArea === action.payload ? null : action.payload };

    case 'SET_ENERGY_LEVEL':
      return { ...state, energyLevel: action.payload };

    case 'UPDATE_SET_FIELD': {
      const { setId, field, value } = action.payload;
      return {
        ...state,
        currentExercise: {
          ...state.currentExercise,
          sets: state.currentExercise.sets.map((s) =>
            s.id === setId ? { ...s, [field]: value } : s
          ),
        },
      };
    }

    case 'VALIDATE_SET':
      return {
        ...state,
        resting: true,
        currentExercise: {
          ...state.currentExercise,
          sets: state.currentExercise.sets.map((s) =>
            s.id === action.payload ? { ...s, validated: true } : s
          ),
        },
      };

    case 'ADD_SET': {
      const nextId = state.currentExercise.sets.length + 1;
      return {
        ...state,
        currentExercise: {
          ...state.currentExercise,
          sets: [
            ...state.currentExercise.sets,
            { id: nextId, previous: '—', weight: '', reps: '', rpe: '', validated: false },
          ],
        },
      };
    }

    case 'END_REST':
      return { ...state, resting: false };

    case 'END_WORKOUT': {
      const currentSummary = summarizeExercise(state.currentExercise);
      const fullLog =
        currentSummary.validatedSets > 0
          ? [...state.sessionExerciseLog, currentSummary]
          : state.sessionExerciseLog;

      if (fullLog.length === 0) {
        return { ...state, screen: 'dashboard', resting: false, sessionExerciseLog: [] };
      }

      const activeProgram = state.programs.find((p) => p.id === state.activeProgramId);
      const activeDay = activeProgram?.days.find((d) => d.id === state.activeDayId);

      const totalTonnage = Math.round(fullLog.reduce((sum, ex) => sum + ex.tonnage, 0) * 10) / 10;
      const totalValidatedSets = fullLog.reduce((sum, ex) => sum + ex.validatedSets, 0);
      const rpeValues = fullLog.map((ex) => ex.averageRpe).filter((v): v is number => v !== null);
      const averageRpe = rpeValues.length > 0
        ? Math.round((rpeValues.reduce((sum, v) => sum + v, 0) / rpeValues.length) * 10) / 10
        : null;

      const session: WorkoutSession = {
        id: makeId('session'),
        date: new Date().toISOString(),
        programName: activeProgram?.name ?? 'Programme',
        dayLabel: activeDay?.label ?? 'Séance libre',
        exercises: fullLog,
        totalTonnage,
        totalValidatedSets,
        averageRpe,
      };

      return {
        ...state,
        screen: 'dashboard',
        resting: false,
        sessionHistory: [session, ...state.sessionHistory],
        sessionExerciseLog: [],
      };
    }

    case 'SAVE_PROGRAM': {
      const exists = state.programs.some((program) => program.id === action.payload.id);
      const programs = exists
        ? state.programs.map((program) => (program.id === action.payload.id ? action.payload : program))
        : [...state.programs, action.payload];
      return { ...state, programs, editingProgramId: null };
    }

    case 'DELETE_PROGRAM': {
      const programs = state.programs.filter((program) => program.id !== action.payload);
      const wasActive = state.activeProgramId === action.payload;
      const nextActiveProgram = wasActive ? programs[0] : undefined;
      return {
        ...state,
        programs,
        activeProgramId: nextActiveProgram?.id ?? state.activeProgramId,
        activeDayId: nextActiveProgram?.days[0]?.id ?? state.activeDayId,
        activeExerciseIndex: wasActive ? 0 : state.activeExerciseIndex,
        editingProgramId: state.editingProgramId === action.payload ? null : state.editingProgramId,
      };
    }

    case 'SET_ACTIVE_PROGRAM':
      return { ...state, activeProgramId: action.payload };

    case 'START_EDIT_PROGRAM':
      return { ...state, editingProgramId: action.payload };

    case 'STOP_EDIT_PROGRAM':
      return { ...state, editingProgramId: null };

    case 'LOAD_WORKOUT_DAY': {
      const { programId, dayId, exerciseIndex = 0 } = action.payload;
      const program = state.programs.find((item) => item.id === programId);
      const day = program?.days.find((item) => item.id === dayId);
      const template = day?.exercises[exerciseIndex];
      if (!template) return state;

      return {
        ...state,
        activeProgramId: programId,
        activeDayId: dayId,
        activeExerciseIndex: exerciseIndex,
        currentExercise: buildCurrentExercise(template),
        sessionExerciseLog: exerciseIndex === 0 ? [] : state.sessionExerciseLog,
      };
    }

    case 'NEXT_EXERCISE_IN_DAY': {
      const program = state.programs.find((item) => item.id === state.activeProgramId);
      const day = program?.days.find((item) => item.id === state.activeDayId);
      if (!day) return state;

      const nextIndex = state.activeExerciseIndex + 1;
      const template = day.exercises[nextIndex];
      if (!template) return state;

      const completedExercise = summarizeExercise(state.currentExercise);

      return {
        ...state,
        activeExerciseIndex: nextIndex,
        currentExercise: buildCurrentExercise(template),
        sessionExerciseLog: [...state.sessionExerciseLog, completedExercise],
      };
    }

    case 'DELETE_SESSION':
      return { ...state, sessionHistory: state.sessionHistory.filter((s) => s.id !== action.payload) };

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'UPDATE_PREFERENCES': {
      const nextPreferences = { ...state.preferences, ...action.payload };
      return {
        ...state,
        preferences: nextPreferences,
        // Le repos par défaut des préférences alimente aussi restDuration
        // si aucune séance n'est en cours, pour rester cohérent immédiatement.
        restDuration: action.payload.defaultRestSeconds ?? state.restDuration,
      };
    }

    case 'TOGGLE_HEALTH_SYNC': {
      // Ceci ne fait que basculer un drapeau local pour l'instant.
      // Le vrai appel HealthKit/Health Connect sera ajouté avec un Dev Client
      // (react-native-health / react-native-health-connect) dans une étape dédiée.
      const enabling = !state.healthSync.enabled;
      return {
        ...state,
        healthSync: {
          enabled: enabling,
          platform: enabling ? action.payload.platform : null,
          lastSyncDate: enabling ? new Date().toISOString() : state.healthSync.lastSyncDate,
        },
      };
    }

    case 'RESET_ALL_DATA':
      return {
        ...initialState,
        profile: state.profile,
        isHydrated: true,
      };

    default:
      return state;
  }
}

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          dispatch({ type: 'HYDRATE', payload: JSON.parse(stored) as Partial<PersistedState> });
        } else {
          dispatch({ type: 'HYDRATE', payload: {} });
        }
      } catch (error) {
        console.warn('Impossible de charger les données locales', error);
        dispatch({ type: 'HYDRATE', payload: {} });
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!state.isHydrated) return;

    const dataToPersist: PersistedState = {
      programs: state.programs,
      activeProgramId: state.activeProgramId,
      activeDayId: state.activeDayId,
      activeExerciseIndex: state.activeExerciseIndex,
      energyLevel: state.energyLevel,
      sessionHistory: state.sessionHistory,
      profile: state.profile,
      preferences: state.preferences,
      healthSync: state.healthSync,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToPersist)).catch((error) => {
      console.warn('Impossible de sauvegarder les données locales', error);
    });
  }, [
    state.isHydrated,
    state.programs,
    state.activeProgramId,
    state.activeDayId,
    state.activeExerciseIndex,
    state.energyLevel,
    state.sessionHistory,
    state.profile,
    state.preferences,
    state.healthSync,
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext doit etre utilise a l'interieur d'un AppProvider");
  }
  return ctx;
}
