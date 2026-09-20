// src/context/AppContext.tsx
// Ajout de la persistance AsyncStorage : programs, activeProgramId, activeDayId,
// activeExerciseIndex et energyLevel survivent maintenant au redémarrage de l'app.
// Le reste (screen, painArea, resting, currentExercise en cours) reste volatile,
// car ce sont des états de session, pas des données à conserver entre les lancements.

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
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

  isHydrated: boolean; // true une fois le state relu depuis AsyncStorage
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
  | { type: 'LOAD_WORKOUT_DAY'; payload: { programId: string; dayId: string; exerciseIndex?: number } }
  | { type: 'NEXT_EXERCISE_IN_DAY' }
  | { type: 'HYDRATE'; payload: Partial<AppState> };

const STORAGE_KEY = '@plusultra/persisted_state_v1';

// Clés du state qui doivent être sauvegardées sur disque.
// On exclut volontairement screen/painArea/resting/currentExercise/isHydrated :
// ce sont des états de session, pas des données de progression durable.
const PERSISTED_KEYS: (keyof AppState)[] = [
  'programs',
  'activeProgramId',
  'activeDayId',
  'activeExerciseIndex',
  'energyLevel',
];

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

    case 'END_WORKOUT':
      return { ...state, screen: 'dashboard', resting: false };

    case 'SAVE_PROGRAM': {
      const exists = state.programs.some((p) => p.id === action.payload.id);
      const programs = exists
        ? state.programs.map((p) => (p.id === action.payload.id ? action.payload : p))
        : [...state.programs, action.payload];
      return { ...state, programs };
    }

    case 'DELETE_PROGRAM':
      return { ...state, programs: state.programs.filter((p) => p.id !== action.payload) };

    case 'SET_ACTIVE_PROGRAM':
      return { ...state, activeProgramId: action.payload };

    case 'LOAD_WORKOUT_DAY': {
      const { programId, dayId, exerciseIndex = 0 } = action.payload;
      const program = state.programs.find((p) => p.id === programId);
      const day = program?.days.find((d) => d.id === dayId);
      const template = day?.exercises[exerciseIndex];
      if (!template) return state;

      return {
        ...state,
        activeProgramId: programId,
        activeDayId: dayId,
        activeExerciseIndex: exerciseIndex,
        currentExercise: buildCurrentExercise(template),
      };
    }

    case 'NEXT_EXERCISE_IN_DAY': {
      const program = state.programs.find((p) => p.id === state.activeProgramId);
      const day = program?.days.find((d) => d.id === state.activeDayId);
      if (!day) return state;

      const nextIndex = state.activeExerciseIndex + 1;
      const template = day.exercises[nextIndex];
      if (!template) return state;

      return {
        ...state,
        activeExerciseIndex: nextIndex,
        currentExercise: buildCurrentExercise(template),
      };
    }

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
  const hasHydrated = useRef(false);

  // Lecture d'AsyncStorage une seule fois au montage de l'app.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          dispatch({ type: 'HYDRATE', payload: parsed });
        } else {
          dispatch({ type: 'HYDRATE', payload: {} });
        }
      } catch (err) {
        console.warn('Erreur lecture AsyncStorage, valeurs par défaut utilisées', err);
        dispatch({ type: 'HYDRATE', payload: {} });
      } finally {
        hasHydrated.current = true;
      }
    })();
  }, []);

  // Sauvegarde automatique dès qu'une clé persistée change, une fois l'hydratation initiale faite.
  // On évite d'écrire pendant le tout premier rendu (avant HYDRATE) pour ne pas écraser
  // les données sauvegardées avec le state par défaut.
  useEffect(() => {
    if (!state.isHydrated) return;

    const toPersist: Partial<AppState> = {};
    for (const key of PERSISTED_KEYS) {
      (toPersist as any)[key] = state[key];
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist)).catch((err) => {
      console.warn('Erreur sauvegarde AsyncStorage', err);
    });
  }, [
    state.isHydrated,
    state.programs,
    state.activeProgramId,
    state.activeDayId,
    state.activeExerciseIndex,
    state.energyLevel,
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
    throw new Error('useAppContext doit etre utilise a l\'interieur d\'un AppProvider');
  }
  return ctx;
}