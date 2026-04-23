export interface FormData {
  name: string;
  email: string;
  age: string;
  gender: string;
}

export type SymptomLevel = 'A' | 'B' | 'C' | 'D' | null;

export interface ValidationErrors {
  name?: string;
  email?: string;
  age?: string;
  gender?: string;
}

export enum Gender {
  FEMALE = 'Feminino',
  MALE = 'Masculino',
  PREFER_NOT_TO_SAY = 'Prefiro não informar'
}

export interface Task {
  id: string;
  text: string;
  subtext?: string; // For medication progress "tratamento: 6/14"
  completed: boolean;
  meta?: string; // For "após 2h" etc.
  locked?: boolean; // For medication steps waiting for interval
  lockedUntil?: number; // Timestamp
}

export interface PhaseDetail {
  id: SymptomLevel;
  title: string;
  description: string;
  fullDescription: string; // For the phase selection screens
}

// Recurrence Types
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'once';

export interface RecurrenceConfig {
  frequency: RecurrenceType;
  weekDays?: number[]; // 0=Sun, 1=Mon, etc.
  monthDay?: number; // 1-31
  createdDate?: string; // YYYY-MM-DD for 'once' tasks
}

export type MedicationStatus = 'active' | 'inactive' | 'completed';

export interface Medication extends RecurrenceConfig {
  id: string;
  name: string;
  timesPerDay: number;
  createdOnDay: number;
  
  // New Treatment Tracking
  status: MedicationStatus;
  totalDosesPlanned: number; // Total doses needed (infinite if 0 or undefined, though UI forces value)
  dosesTaken: number; // Global counter of doses taken
}

export interface CustomTask extends RecurrenceConfig {
  id: string;
  name: string;
  hasSteps: boolean;
  stepsQty: number;
  createdAt: number;
}

export interface MedicationLog {
  [dateKey: string]: { // Key format: "YYYY-MM-DD"
    [medId: string]: {
      stepsCompleted: number;
      lastStepTime: number; // Timestamp
    }
  }
}

export interface TaskLog {
  [dateKey: string]: { // Key format: "YYYY-MM-DD"
    [taskId: string]: number; // stepsCompleted
  }
}