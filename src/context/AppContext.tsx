// src/context/AppContext.tsx
// Ajout du système de programmes : Program > Day > Exercise > Sets cibles.

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

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

// --- Nouveau : structure de programme ---
export type ExerciseTemplate = {
  name: string;
  muscleGroup: string;
  grip: string;
  targetSets: { weight: string; reps: string; rpe: string }[];
};

export type ProgramDay = {
  id: string;
  label: string; // ex: "Pull · Sèche J3"
  exercises: ExerciseTemplate[];
};

export type Program = {
  id: string;
  name: string; // ex: "Push / Pull / Legs — Sèche"
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
  | { type: 'NEXT_EXERCISE_IN_DAY' };

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
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
      if (!template) return state; // dernier exercice du jour déjà atteint

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