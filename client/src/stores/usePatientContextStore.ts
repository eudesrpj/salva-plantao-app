
import { create } from 'zustand';

export type AgeGroup = 'adult' | 'pediatric';

export type Allergy =
  | 'penicillin'
  | 'sulfa'
  | 'dypirone'
  | 'nsaid'
  | 'macrolide'
  | 'quinolone'
  | 'iodine';

export type KeyCondition =
  | 'renal'
  | 'hepatic'
  | 'anticoagulant'
  | 'diabetes'
  | 'immunosuppressed'
  | 'asthma_dpoc'
  | 'seizure_history';

export type Severity = 'mild' | 'moderate' | 'severe';

export interface PatientContextState {
  isActive: boolean;
  ageGroup: AgeGroup | null;
  isPregnant: boolean | null;
  pediatricWeightKg: number | null;
  allergies: Allergy[];
  otherAllergies: string;
  keyConditions: KeyCondition[];
  severity: Severity | null;
}

interface PatientContextActions {
  setPatientContext: (context: Partial<PatientContextState>) => void;
  resetPatientContext: () => void;
  toggleAllergy: (allergy: Allergy) => void;
  toggleKeyCondition: (condition: KeyCondition) => void;
}

const initialState: PatientContextState = {
  isActive: false,
  ageGroup: null,
  isPregnant: null,
  pediatricWeightKg: null,
  allergies: [],
  otherAllergies: '',
  keyConditions: [],
  severity: null,
};

export const usePatientContextStore = create<PatientContextState & PatientContextActions>((set) => ({
  ...initialState,

  setPatientContext: (context: Partial<PatientContextState>) =>
    set((state) => ({ ...state, ...context, isActive: true })),

  resetPatientContext: () => set(initialState),

  toggleAllergy: (allergy: Allergy) =>
    set((state) => {
      const allergies = state.allergies.includes(allergy)
        ? state.allergies.filter((a) => a !== allergy)
        : [...state.allergies, allergy];
      return { ...state, allergies };
    }),

  toggleKeyCondition: (condition: KeyCondition) =>
    set((state) => {
      const keyConditions = state.keyConditions.includes(condition)
        ? state.keyConditions.filter((c) => c !== condition)
        : [...state.keyConditions, condition];
      return { ...state, keyConditions };
    }),
}));
