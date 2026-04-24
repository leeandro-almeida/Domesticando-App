import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './src/contexts/AuthContext';
import { FormData, SymptomLevel, ValidationErrors, Gender, Task, PhaseDetail, Medication, MedicationLog, MedicationStatus, CustomTask, RecurrenceConfig, RecurrenceType, TaskLog } from './types';
import { supabase } from './src/lib/supabase';
import { TaskTemplate } from './src/types/admin';
import { Input } from './components/Input';
import { Select } from './components/Select';
import { SymptomCard } from './components/SymptomCard';
import { TaskItem } from './components/TaskItem';
import { ProgressBar } from './components/ProgressBar';
import { PhaseCard } from './components/PhaseCard';
import { Menu } from './components/Menu';
import { ConfirmationModal } from './components/ConfirmationModal';
import { MedicationForm } from './components/MedicationForm';
import { MedicationManager } from './components/MedicationManager';
import { TaskManager } from './components/TaskManager';
import { TaskForm } from './components/TaskForm';

const INITIAL_DATA: FormData = {
  name: '',
  email: '',
  age: '',
  gender: '',
};


const SYMPTOMS: { id: SymptomLevel; label: string }[] = [
  { id: 'A', label: 'Leve / controlado' },
  { id: 'B', label: 'Moderado' },
  { id: 'C', label: 'Intenso' },
  { id: 'D', label: 'Forte / recorrente' },
];

const PHASE_DETAILS: Record<string, PhaseDetail> = {
  'D': {
    id: 'D',
    title: 'Fase D',
    description: 'Forte / recorrente',
    fullDescription: 'Vermelhidão + assaduras/rachaduras. Desconforto forte e recorrente. Pode notar odor diferente.'
  },
  'C': {
    id: 'C',
    title: 'Fase C',
    description: 'Intenso',
    fullDescription: 'Vermelhidão e descamação. Irritação frequente ao longo do dia. Incômodo moderado pra alto.'
  },
  'B': {
    id: 'B',
    title: 'Fase B',
    description: 'Moderado',
    fullDescription: 'Vermelhidão e coceira. Sintomas vão e voltam. Ainda incomoda, mas é mais leve.'
  },
  'A': {
    id: 'A',
    title: 'Fase A',
    description: 'Leve / controlado',
    fullDescription: 'Coceira leve e desconfortos pontuais. Sem incômodo constante. Sensação mais controlada.'
  }
};


const ORDINALS = [
    '', 'PRIMEIRO', 'SEGUNDO', 'TERCEIRO', 'QUARTO', 'QUINTO', 'SEXTO', 'SÉTIMO', 
    'OITAVO', 'NONO', 'DÉCIMO', 'DÉCIMO PRIMEIRO', 'DÉCIMO SEGUNDO', 'DÉCIMO TERCEIRO', 
    'DÉCIMO QUARTO', 'DÉCIMO QUINTO', 'DÉCIMO SEXTO', 'DÉCIMO SÉTIMO', 'DÉCIMO OITAVO', 
    'DÉCIMO NONO', 'VIGÉSIMO'
];

export default function App() {
  const { user } = useAuth();

  // --- STATE ---
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=Form, 2=Symptoms, 3=Tasks
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [symptomLevel, setSymptomLevel] = useState<SymptomLevel>(null);
  
  // Views inside Step 3
  const [taskView, setTaskView] = useState<'list' | 'next_phase' | 'change_phase' | 'med_setup' | 'med_manage' | 'med_setup_direct' | 'edit_tasks' | 'task_form'>('list');
  const [medicationSetupStep, setMedicationSetupStep] = useState<'question' | 'form' | 'summary'>('question');
  
  // Data
  const [currentPhase, setCurrentPhase] = useState<SymptomLevel>('D'); 
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);

  // System Date Tracking (Simulated)
  const [systemDate, setSystemDate] = useState<Date>(new Date);

  // Settings
  const [timeBlockingEnabled, setTimeBlockingEnabled] = useState<boolean>(true);

  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog>({});
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<string | null>(null);
  
  // Custom Tasks
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [adminTemplateTasks, setAdminTemplateTasks] = useState<CustomTask[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog>({}); // Track custom task steps per day
  const [editingTask, setEditingTask] = useState<CustomTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [disabledSystemTaskIds, setDisabledSystemTaskIds] = useState<string[]>([]);
  
  // Navigation State
  const [nextPhaseOption, setNextPhaseOption] = useState<'advance' | 'maintain'>('maintain');
  const [selectedPhaseToChange, setSelectedPhaseToChange] = useState<SymptomLevel>(null);

  // Animation State
  const [daySlideState, setDaySlideState] = useState<'idle' | 'sliding-out' | 'sliding-in'>('idle');

  // Validation
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

  // --- PERSISTENCE & INIT ---

  // Load all user data from Supabase on mount
  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    const init = async () => {
      const [
        { data: progress },
        { data: profile },
        { data: meds },
        { data: medLogs },
        { data: userTasks },
        { data: userTaskLogs },
        { data: disabledTasks },
      ] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_medications').select('*').eq('user_id', userId),
        supabase.from('user_medication_logs').select('*').eq('user_id', userId),
        supabase.from('user_tasks').select('*').eq('user_id', userId),
        supabase.from('user_task_logs').select('*').eq('user_id', userId),
        supabase.from('user_disabled_tasks').select('task_id').eq('user_id', userId),
      ]);

      if (progress) {
        setCurrentPhase(progress.current_phase as SymptomLevel);
        setCurrentDay(progress.current_day);
        setSystemDate(new Date(progress.system_date + 'T12:00:00'));
        setTimeBlockingEnabled(progress.time_blocking_enabled);
        setStep(3);
        setTaskView('list');
      }

      if (profile) {
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          age: profile.age?.toString() || '',
          gender: profile.gender || '',
        });
        if (!progress && profile.onboarding_step) {
          setStep(profile.onboarding_step as 1 | 2 | 3);
        }
      }

      if (meds && meds.length > 0) {
        setMedications(meds.map(m => ({
          id: m.id,
          name: m.name,
          timesPerDay: m.times_per_day,
          totalDosesPlanned: m.total_doses_planned,
          dosesTaken: m.doses_taken,
          status: m.status as MedicationStatus,
          createdOnDay: m.created_on_day,
          frequency: m.frequency as RecurrenceType,
          weekDays: m.week_days || [],
          monthDay: m.month_day ?? undefined,
          createdDate: m.created_date ?? undefined,
        })));
      }

      if (medLogs && medLogs.length > 0) {
        const logsObj: MedicationLog = {};
        medLogs.forEach((log: { log_date: string; medication_id: string; steps_completed: number; last_step_time: number }) => {
          if (!logsObj[log.log_date]) logsObj[log.log_date] = {};
          logsObj[log.log_date][log.medication_id] = {
            stepsCompleted: log.steps_completed,
            lastStepTime: log.last_step_time || 0,
          };
        });
        setMedicationLogs(logsObj);
      }

      if (userTasks && userTasks.length > 0) {
        setCustomTasks(userTasks.map(t => ({
          id: t.id,
          name: t.name,
          hasSteps: t.has_steps,
          stepsQty: t.steps_qty,
          frequency: t.frequency as RecurrenceType,
          weekDays: t.week_days || [],
          monthDay: t.month_day ?? undefined,
          createdDate: t.created_date ?? undefined,
          createdAt: new Date(t.created_at).getTime(),
        })));
      }

      if (userTaskLogs && userTaskLogs.length > 0) {
        const logsObj: TaskLog = {};
        userTaskLogs.forEach((log: { log_date: string; task_id: string; steps_completed: number }) => {
          if (!logsObj[log.log_date]) logsObj[log.log_date] = {};
          logsObj[log.log_date][log.task_id] = log.steps_completed;
        });
        setTaskLogs(logsObj);
      }

      if (disabledTasks && disabledTasks.length > 0) {
        setDisabledSystemTaskIds(disabledTasks.map((t: { task_id: string }) => t.task_id));
      }

      setIsInitialized(true);
    };

    init();
  }, [user]);

  // Persist progress state to Supabase whenever it changes
  useEffect(() => {
    if (!user || !isInitialized || !currentPhase) return;
    supabase.from('user_progress').upsert({
      user_id: user.id,
      current_phase: currentPhase,
      current_day: currentDay,
      system_date: systemDate.toISOString().split('T')[0],
      time_blocking_enabled: timeBlockingEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [currentPhase, currentDay, systemDate, timeBlockingEnabled, isInitialized, user]);

  // Persist onboarding step and form data to profiles
  useEffect(() => {
    if (!user || !isInitialized) return;
    supabase.from('profiles').update({
      name: formData.name || null,
      age: formData.age ? parseInt(formData.age, 10) : null,
      gender: formData.gender || null,
      onboarding_step: step,
    }).eq('id', user.id);
  }, [step, formData, isInitialized, user]);

  // Fetch admin task templates whenever the phase changes
  useEffect(() => {
    if (!currentPhase) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('task_templates')
      .select('*')
      .eq('grade', currentPhase)
      .order('created_at')
      .then(({ data }) => {
        if (!data) return;
        setAdminTemplateTasks(
          (data as TaskTemplate[]).map(t => ({
            id: t.id,
            name: t.name,
            hasSteps: t.has_steps,
            stepsQty: t.steps_count ?? 1,
            createdAt: new Date(t.created_at).getTime(),
            frequency: (t.recurrence === 'today' ? 'once' : t.recurrence) as RecurrenceType,
            weekDays: t.days_of_week,
            createdDate: today,
          }))
        );
      });
  }, [currentPhase]);

  // --- VALIDATION LOGIC ---
  const validation = useMemo(() => {
    const newErrors: ValidationErrors = {};
    const isNameValid = formData.name.trim().length >= 2;
    if (!isNameValid && touched.name) newErrors.name = 'Mínimo 2 caracteres';

    const ageNum = parseInt(formData.age, 10);
    const isAgeValid = !isNaN(ageNum) && ageNum >= 10 && ageNum <= 99;
    if (!isAgeValid && touched.age && formData.age.length > 0) newErrors.age = 'Idade entre 10 e 99';

    const isGenderValid = !!formData.gender;

    return { newErrors, isStep1Valid: isNameValid && isAgeValid && isGenderValid, isStep2Valid: !!symptomLevel };
  }, [formData, symptomLevel, touched]);

  useEffect(() => {
    setErrors(validation.newErrors);
  }, [validation.newErrors]);

  // --- RECURRENCE HELPERS ---
  const shouldItemAppearToday = useCallback((config: RecurrenceConfig, dateToCheck: Date): boolean => {
    const now = dateToCheck;
    // Daily
    if (config.frequency === 'daily') return true;

    // Weekly
    if (config.frequency === 'weekly') {
        if (!config.weekDays || config.weekDays.length === 0) return false;
        const currentDay = now.getDay(); // 0=Sun, 6=Sat
        return config.weekDays.includes(currentDay);
    }

    // Monthly
    if (config.frequency === 'monthly') {
        if (!config.monthDay) return false;
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
        // If config day is 31 but month has 30, use 30.
        const targetDay = Math.min(config.monthDay, daysInMonth);
        return currentDay === targetDay;
    }

    // Once / Today
    if (config.frequency === 'once') {
        if (!config.createdDate) return false; // Should exist
        const todayStr = now.toISOString().split('T')[0];
        return config.createdDate === todayStr;
    }

    return false;
  }, []);

  // --- FORMATTING HELPERS ---
  const getOrdinalDay = (day: number) => {
      if (day > 0 && day <= 20) return ORDINALS[day];
      return `DIA ${day}`;
  };

  const formatSystemDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };
  
  const formatDebugDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'long' });
  };

  const getLogDateKey = (date: Date) => {
      return date.toISOString().split('T')[0];
  };

  // --- TASK GENERATION ---

  const generateTasksForDay = useCallback((
    _phase: SymptomLevel,
    _day: number,
    dateOverride?: Date
  ) => {
    const dateToCheck = dateOverride || systemDate;
    const dateKey = getLogDateKey(dateToCheck);

    let mergedTasks: Task[] = [];

    // 2a. Process Admin Template Tasks (from Supabase, by grade)
    adminTemplateTasks.forEach(ct => {
      if (!shouldItemAppearToday(ct, dateToCheck)) return;
      const taskId = `tpl_${ct.id}`;
      const stepsDone = taskLogs[dateKey]?.[taskId] || 0;
      const totalSteps = ct.hasSteps ? ct.stepsQty : 1;
      const isCompleted = stepsDone >= totalSteps;
      let text = ct.name;
      if (ct.hasSteps) {
        text = isCompleted
          ? `${ct.name} — ${totalSteps}/${totalSteps}`
          : `${ct.name} — ${stepsDone + 1}/${totalSteps}`;
      }
      mergedTasks.push({ id: taskId, text, completed: isCompleted });
    });

    // 2b. Process Custom Tasks (Multi-Step Logic)
    customTasks.forEach(ct => {
        if (!shouldItemAppearToday(ct, dateToCheck)) return;
        
        const taskId = `custom_${ct.id}`;
        
        // Get step progress for this day
        const stepsDone = taskLogs[dateKey]?.[ct.id] || 0;
        const totalSteps = ct.hasSteps ? ct.stepsQty : 1;
        
        // Formatting
        let text = ct.name;
        if (ct.hasSteps) {
            text = `${ct.name} — ${stepsDone + 1}/${totalSteps}`;
            if (stepsDone >= totalSteps) {
                text = `${ct.name} — ${totalSteps}/${totalSteps}`;
            }
        }

        const isCompleted = stepsDone >= totalSteps;

        mergedTasks.push({
            id: taskId,
            text,
            completed: isCompleted
        });
    });

    // 3. Check Ointment Step 2 Locking
    mergedTasks = mergedTasks.map(t => {
        if (t.id === 'ointment_step2' && t.lockedUntil) {
             const now = Date.now();
             let isLocked = now < t.lockedUntil;
             let meta = undefined;
             
             if (!timeBlockingEnabled) isLocked = false;

             if (isLocked) {
                 const hoursLeft = Math.ceil((t.lockedUntil - now) / (1000 * 60 * 60));
                 const minsLeft = Math.ceil(((t.lockedUntil - now) % (1000 * 60 * 60)) / (1000 * 60));
                 meta = hoursLeft >= 1 ? `próxima etapa em ${hoursLeft}h` : `próxima etapa em ${minsLeft}min`;
             }
             
             return { ...t, locked: isLocked, meta: isLocked ? meta : undefined };
        }
        return t;
    });

    // 4. Generate Medication Tasks
    const medTasks: Task[] = [];
    const todayLog = medicationLogs[dateKey] || {};

    medications.forEach(med => {
      if (med.status === 'inactive') return;
      
      const medLog = todayLog[med.id] || { stepsCompleted: 0, lastStepTime: 0 };
      
      // If Global Treatment Completed
      if (med.status === 'completed') {
           // Only show if it was part of today's actions (history for today)
           // If no interaction today, it means it finished on a previous day, so hide it.
           if (medLog.stepsCompleted === 0) return;
      }
      
      // Use refined Recurrence Logic
      if (shouldItemAppearToday(med, dateToCheck)) {
        const stepsCompletedToday = medLog.stepsCompleted;
        const totalStepsToday = med.timesPerDay;
        
        // Subtext: Treatment progress
        const subtext = `tratamento: ${med.dosesTaken}/${med.totalDosesPlanned}`;

        // If Daily Goal Reached OR Treatment Finished (even if mid-day)
        if (stepsCompletedToday >= totalStepsToday || med.status === 'completed') {
            medTasks.push({
              id: `med_${med.id}`,
              text: `Tomar ${med.name} — Concluído`,
              subtext,
              completed: true,
              locked: true // Disable interaction prevents extra clicks
            });
        } else {
             // Not finished yet
             const nextStep = stepsCompletedToday + 1;
             
             // Lock logic for intervals
             let locked = false;
             let meta = undefined;
             
             if (nextStep > 1) {
                 const intervalHours = 24 / med.timesPerDay;
                 const intervalMs = intervalHours * 60 * 60 * 1000;
                 const nextTime = medLog.lastStepTime + intervalMs;
                 const now = Date.now();
                 
                 if (now < nextTime) {
                    locked = true;
                    const hoursLeft = Math.ceil((nextTime - now) / (1000 * 60 * 60));
                    const minsLeft = Math.ceil(((nextTime - now) % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (timeBlockingEnabled) {
                       meta = hoursLeft >= 1 ? `próxima dose em ${hoursLeft}h` : `próxima dose em ${minsLeft}min`;
                    }
                 }
             }
             
             if (!timeBlockingEnabled) {
                  locked = false;
                  meta = undefined;
             }

             const taskText = totalStepsToday === 1 
                ? `Tomar ${med.name}`
                : `Tomar ${med.name} — ${nextStep}/${totalStepsToday}`;

             medTasks.push({
                id: `med_${med.id}`,
                text: taskText,
                subtext,
                completed: false,
                locked,
                meta
             });
        }
      }
    });

    const finalTasks = [...mergedTasks, ...medTasks];
    return finalTasks;
  }, [medications, medicationLogs, customTasks, adminTemplateTasks, disabledSystemTaskIds, timeBlockingEnabled, shouldItemAppearToday, systemDate, taskLogs]);


  // Effect to keep tasks updated
  useEffect(() => {
    if (taskView === 'list' && daySlideState === 'idle') {
        setTasks(generateTasksForDay(currentPhase, currentDay));

        const interval = setInterval(() => {
            setTasks(generateTasksForDay(currentPhase, currentDay));
        }, 10000);
        
        return () => clearInterval(interval);
    }
  }, [currentDay, currentPhase, medications, medicationLogs, customTasks, disabledSystemTaskIds, taskView, daySlideState, generateTasksForDay]);


  // --- HANDLERS: INPUTS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // --- HANDLERS: FLOW & MEDS ---

  const handleNext = () => { if (validation.isStep1Valid) setStep(2); };
  const handleBack = () => { setStep(1); };

  const handleSymptomSubmit = () => {
    if (!validation.isStep2Valid) return;
    setCurrentPhase(symptomLevel);
    setStep(3);
    setTaskView('med_setup');
    setMedicationSetupStep('question');
  };

  const handleMedQuestion = (answer: boolean) => {
    if (answer) {
      setMedicationSetupStep('form');
    } else {
      startTasksFlow();
    }
  };

  const saveMedication = async (medData: Omit<Medication, 'id'>) => {
    if (!user) return;
    if (editingMedication) {
        await supabase.from('user_medications').update({
          name: medData.name,
          times_per_day: medData.timesPerDay,
          total_doses_planned: medData.totalDosesPlanned,
          doses_taken: medData.dosesTaken,
          status: medData.status,
          created_on_day: medData.createdOnDay,
          frequency: medData.frequency,
          week_days: medData.weekDays || [],
          month_day: medData.monthDay ?? null,
          created_date: medData.createdDate ?? null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingMedication.id).eq('user_id', user.id);
        setMedications((prev: Medication[]) => prev.map((m: Medication) =>
          m.id === editingMedication.id ? { ...m, ...medData, id: m.id } : m
        ));
        setEditingMedication(null);
        setTaskView('med_manage');
    } else {
        const { data } = await supabase.from('user_medications').insert({
          user_id: user.id,
          name: medData.name,
          times_per_day: medData.timesPerDay,
          total_doses_planned: medData.totalDosesPlanned,
          doses_taken: 0,
          status: medData.status || 'active',
          created_on_day: medData.createdOnDay,
          frequency: medData.frequency,
          week_days: medData.weekDays || [],
          month_day: medData.monthDay ?? null,
          created_date: medData.createdDate ?? null,
        }).select().single();
        if (data) {
          setMedications(prev => [...prev, { ...medData, id: data.id }]);
        }
        if (taskView === 'med_setup') setMedicationSetupStep('summary');
        else if (taskView === 'med_manage') setTaskView('med_manage');
        else setTaskView('list');
    }
  };

  const handleDeleteMedication = async () => {
    if (!user || !medicationToDelete) return;
    await supabase.from('user_medications').delete()
      .eq('id', medicationToDelete).eq('user_id', user.id);
    setMedications((prev: Medication[]) => prev.filter((m: Medication) => m.id !== medicationToDelete));
    setMedicationToDelete(null);
  };

  // --- HANDLERS: CUSTOM TASKS ---

  const saveCustomTask = async (taskData: Omit<CustomTask, 'id' | 'createdAt'>) => {
    if (!user) return;
    if (editingTask) {
        await supabase.from('user_tasks').update({
          name: taskData.name,
          has_steps: taskData.hasSteps,
          steps_qty: taskData.stepsQty,
          frequency: taskData.frequency,
          week_days: taskData.weekDays || [],
          month_day: taskData.monthDay ?? null,
          created_date: taskData.createdDate ?? null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingTask.id).eq('user_id', user.id);
        setCustomTasks((prev: CustomTask[]) => prev.map((t: CustomTask) =>
          t.id === editingTask.id ? { ...t, ...taskData } : t
        ));
        setEditingTask(null);
        setTaskView('edit_tasks');
    } else {
        const { data } = await supabase.from('user_tasks').insert({
          user_id: user.id,
          name: taskData.name,
          has_steps: taskData.hasSteps,
          steps_qty: taskData.stepsQty,
          frequency: taskData.frequency,
          week_days: taskData.weekDays || [],
          month_day: taskData.monthDay ?? null,
          created_date: taskData.createdDate ?? null,
        }).select().single();
        if (data) {
          setCustomTasks(prev => [...prev, {
            ...taskData,
            id: data.id,
            createdAt: new Date(data.created_at).getTime(),
          }]);
        }
        setTaskView('edit_tasks');
    }
  };

  const handleDeleteCustomTask = async () => {
    if (!user || !taskToDelete) return;
    await supabase.from('user_tasks').delete()
      .eq('id', taskToDelete).eq('user_id', user.id);
    setCustomTasks((prev: CustomTask[]) => prev.filter((t: CustomTask) => t.id !== taskToDelete));
    setTaskToDelete(null);
  };


  const startTasksFlow = () => {
    setCurrentDay(1);
    setTaskView('list');
    setTasks(generateTasksForDay(currentPhase, 1));
  };

  // --- DAY ADVANCE ANIMATION & LOGIC ---

  const advanceDay = () => {
    setDaySlideState('sliding-out');
    setTimeout(() => {
      // 1. Advance Ordinal Day
      const newDay = currentDay + 1;
      setCurrentDay(newDay);

      // 2. Advance Simulated System Date (Calendar)
      const nextDate = new Date(systemDate);
      nextDate.setDate(nextDate.getDate() + 1);
      setSystemDate(nextDate);

      // 3. Generate fresh tasks for the new date
      const freshTasks = generateTasksForDay(currentPhase, newDay, nextDate);
      setTasks(freshTasks);
      
      setFeedbackMessage(`Dia ${newDay} iniciado`);
      setDaySlideState('sliding-in');
      setTimeout(() => setFeedbackMessage(null), 3000);
      setTimeout(() => {
        setDaySlideState('idle');
      }, 350);
    }, 350);
  };

  const handleToggleTask = (id: string) => {
    if (!user) return;
    let newTasks = [...tasks];
    const dateKey = getLogDateKey(systemDate);

    // --- MEDICATION LOGIC ---
    if (id.startsWith('med_')) {
        const medId = id.replace('med_', '');
        const med = medications.find(m => m.id === medId);

        if (med) {
             const currentLog = medicationLogs[dateKey]?.[medId] || { stepsCompleted: 0, lastStepTime: 0 };

             if (currentLog.stepsCompleted >= med.timesPerDay) return;
             if (med.dosesTaken >= med.totalDosesPlanned) return;

             if (timeBlockingEnabled && currentLog.stepsCompleted > 0) {
                 const intervalMs = (24 / med.timesPerDay) * 60 * 60 * 1000;
                 if (Date.now() < currentLog.lastStepTime + intervalMs) return;
             }

             const newStepsCompleted = currentLog.stepsCompleted + 1;
             const lastStepTime = Date.now();

             setMedicationLogs({
               ...medicationLogs,
               [dateKey]: {
                 ...medicationLogs[dateKey],
                 [medId]: { stepsCompleted: newStepsCompleted, lastStepTime },
               },
             });

             const newTotalTaken = med.dosesTaken + 1;
             const isTreatmentFinished = newTotalTaken >= med.totalDosesPlanned;
             setMedications(medications.map((m: Medication) =>
               m.id === medId
                 ? { ...m, dosesTaken: newTotalTaken, status: (isTreatmentFinished ? 'completed' : m.status) as MedicationStatus }
                 : m
             ));

             supabase.from('user_medication_logs').upsert({
               user_id: user.id, medication_id: medId, log_date: dateKey,
               steps_completed: newStepsCompleted, last_step_time: lastStepTime,
               updated_at: new Date().toISOString(),
             }, { onConflict: 'user_id,medication_id,log_date' });
             supabase.from('user_medications').update({
               doses_taken: newTotalTaken,
               status: isTreatmentFinished ? 'completed' : med.status,
               updated_at: new Date().toISOString(),
             }).eq('id', medId).eq('user_id', user.id);
        }
    }
    // --- CUSTOM TASK LOGIC (Multi-step) ---
    else if (id.startsWith('custom_')) {
        const ctId = id.replace('custom_', '');
        const ct = customTasks.find(t => t.id === ctId);

        if (ct) {
            const currentStep = taskLogs[dateKey]?.[ctId] || 0;
            const totalSteps = ct.hasSteps ? ct.stepsQty : 1;

            if (currentStep < totalSteps) {
                const newStep = currentStep + 1;
                setTaskLogs({ ...taskLogs, [dateKey]: { ...taskLogs[dateKey], [ctId]: newStep } });
                if (newStep >= totalSteps) {
                   newTasks = newTasks.map(t => t.id === id ? { ...t, completed: true } : t);
                   setTasks(newTasks);
                }
                supabase.from('user_task_logs').upsert({
                  user_id: user.id, task_id: ctId, log_date: dateKey,
                  steps_completed: newStep, updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,task_id,log_date' });
            }
        }
    }
    // --- ADMIN TEMPLATE TASK LOGIC ---
    else if (id.startsWith('tpl_')) {
      const ct = adminTemplateTasks.find(t => `tpl_${t.id}` === id);
      if (ct) {
        const currentStep = taskLogs[dateKey]?.[id] || 0;
        const totalSteps = ct.hasSteps ? ct.stepsQty : 1;
        if (currentStep < totalSteps) {
          const newStep = currentStep + 1;
          setTaskLogs({ ...taskLogs, [dateKey]: { ...taskLogs[dateKey], [id]: newStep } });
          if (newStep >= totalSteps) {
            newTasks = newTasks.map(t => t.id === id ? { ...t, completed: true } : t);
            setTasks(newTasks);
          }
          supabase.from('user_task_logs').upsert({
            user_id: user.id, task_id: id, log_date: dateKey,
            steps_completed: newStep, updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,task_id,log_date' });
        }
      }
    }
    // --- OINTMENT LOGIC (System) ---
    else if (id === 'ointment_step1') {
       newTasks = newTasks.filter(t => t.id !== 'ointment_step1');
       const now = Date.now();
       const lockedUntil = now + (2 * 60 * 60 * 1000); 
       
       newTasks.push({ 
           id: 'ointment_step2', 
           text: 'Remover excesso de pomada da glande — 2/2', 
           meta: 'próxima etapa em 2h', 
           completed: false,
           locked: timeBlockingEnabled,
           lockedUntil: lockedUntil
       });
       setTasks(newTasks); 
    } 
    // --- STANDARD TOGGLE ---
    else {
      newTasks = newTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      setTasks(newTasks);
    }
  };

  // Monitor for Day Completion
  useEffect(() => {
    if (taskView === 'list' && tasks.length > 0 && daySlideState === 'idle') {
        const allCompleted = tasks.every(t => t.completed);
        
        if (allCompleted) {
             const timer = setTimeout(() => {
                if (currentDay === 7) {
                    openNextPhaseScreen();
                } else {
                    advanceDay();
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }
  }, [tasks, currentDay, taskView, daySlideState]);


  // --- GLOBAL RESET ---
  const handleReset = () => {
    setFormData(INITIAL_DATA);
    setSymptomLevel(null);
    setTasks([]);
    setStep(1);
    setCurrentPhase('D');
    setCurrentDay(1);
    setTaskView('list');
    setTouched({});
    setMedications([]);
    setMedicationLogs({});
    setCustomTasks([]);
    setTaskLogs({});
    setDisabledSystemTaskIds([]);
    setTimeBlockingEnabled(true);
    setSystemDate(new Date());

    if (user) {
      Promise.all([
        supabase.from('user_progress').delete().eq('user_id', user.id),
        supabase.from('user_medications').delete().eq('user_id', user.id),
        supabase.from('user_tasks').delete().eq('user_id', user.id),
        supabase.from('user_task_logs').delete().eq('user_id', user.id),
        supabase.from('user_medication_logs').delete().eq('user_id', user.id),
        supabase.from('user_disabled_tasks').delete().eq('user_id', user.id),
        supabase.from('profiles').update({
          age: null, gender: null, onboarding_step: 1,
        }).eq('id', user.id),
      ]);
    }
  };

  // --- PHASE / NAV LOGIC ---
  const getNextPhase = (current: SymptomLevel): SymptomLevel => {
    if (current === 'D') return 'C';
    if (current === 'C') return 'B';
    if (current === 'B') return 'A';
    return null; 
  };

  const handleNextPhaseClick = () => {
    const completedTasksCount = tasks.filter(t => t.completed).length;
    if (completedTasksCount === 0) setShowAdvanceConfirm(true);
    else openNextPhaseScreen();
  };

  const openNextPhaseScreen = () => {
    setNextPhaseOption('maintain');
    setTaskView('next_phase');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyNextPhase = () => {
    if (nextPhaseOption === 'advance') {
      const next = getNextPhase(currentPhase);
      if (next) {
        setCurrentPhase(next);
        setCurrentDay(1);
        setTasks(generateTasksForDay(next, 1));
        setTaskView('list');
      }
    } else {
      if (currentDay === 7 && tasks.every(t => t.completed)) {
        advanceDay();
        setTaskView('list');
      } else {
        setTaskView('list');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openChangePhaseScreen = () => {
    setSelectedPhaseToChange(currentPhase); 
    setTaskView('change_phase');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyChangePhase = () => {
    if (selectedPhaseToChange && selectedPhaseToChange !== currentPhase) {
      setCurrentPhase(selectedPhaseToChange);
      setCurrentDay(1);
      setTasks(generateTasksForDay(selectedPhaseToChange, 1));
    }
    setTaskView('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derived state
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const currentPhaseDetail = currentPhase ? PHASE_DETAILS[currentPhase] : null;

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-[#0a0a0c] to-[#111115] relative overflow-x-hidden">
      
      {/* Global Menu */}
      <Menu 
        onReset={() => setShowResetConfirm(true)} 
        onOpenMedications={() => { setEditingMedication(null); setTaskView('med_manage'); }}
        onOpenEditTasks={() => { setEditingTask(null); setTaskView('edit_tasks'); }}
        timeBlockingEnabled={timeBlockingEnabled}
        onToggleTimeBlocking={() => setTimeBlockingEnabled(!timeBlockingEnabled)}
      />

      {/* 
        ------------------------------------------------------------
        SCREEN: FORMULARIO & SINTOMAS
        ------------------------------------------------------------
      */}
      {step !== 3 && (
        <div className="w-full max-w-2xl bg-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden relative transition-all duration-500 animate-enter">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="p-6 md:p-10 space-y-8 md:space-y-10">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                Domesticando
              </h1>
              <p className="text-gray-400 text-sm font-light h-5 transition-all duration-300">
                {step === 1 ? "Preencha seus dados." : "Escolha como você está hoje."}
              </p>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <Input label="Nome" name="name" placeholder="Digite seu nome" value={formData.name} onChange={handleInputChange} onBlur={() => handleBlur('name')} error={errors.name} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Idade" name="age" type="number" placeholder="Ex: 28" value={formData.age} onChange={handleInputChange} onBlur={() => handleBlur('age')} error={errors.age} />
                  <Select label="Gênero" name="gender" options={Object.values(Gender)} value={formData.gender} onChange={handleInputChange} error={errors.gender} />
                </div>
                <p className="text-xs text-gray-500 text-center">{user?.email}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SYMPTOMS.map((symptom) => (
                    <SymptomCard key={symptom.id} level={symptom.id as SymptomLevel} label={symptom.id as string} description={symptom.label} isSelected={symptomLevel === symptom.id} onSelect={() => setSymptomLevel(symptom.id)} />
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col md:flex-row items-center gap-4">
              {step === 2 && (
                <button onClick={handleBack} className="order-2 md:order-1 px-8 py-4 rounded-xl font-medium text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-300 w-full md:w-auto">
                  Voltar
                </button>
              )}
              <button
                onClick={step === 1 ? handleNext : handleSymptomSubmit}
                disabled={step === 1 ? !validation.isStep1Valid : !validation.isStep2Valid}
                className={`order-1 md:order-2 flex-1 w-full py-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 relative overflow-hidden
                  ${(step === 1 ? validation.isStep1Valid : validation.isStep2Valid) ? 'bg-primary text-white shadow-glow hover:bg-blue-600' : 'bg-white/5 text-gray-500 cursor-not-allowed opacity-50'}`}
              >
                {step === 1 ? 'PRÓXIMO' : 'CONTINUAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ------------------------------------------------------------
        SCREEN: MEDICATION SETUP (Initial Flow)
        ------------------------------------------------------------
      */}
      {step === 3 && taskView === 'med_setup' && (
        <div className="w-full max-w-lg px-4 flex flex-col items-center justify-center gap-8 animate-enter">
          {medicationSetupStep === 'question' && (
             <div className="w-full bg-[#161618] border border-white/10 p-8 rounded-3xl text-center space-y-6">
                <h2 className="text-xl font-bold text-white">Você está tomando algum remédio ou vitamina?</h2>
                <div className="flex gap-4 w-full">
                    <button onClick={() => handleMedQuestion(false)} className="flex-1 py-4 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all">Não</button>
                    <button onClick={() => handleMedQuestion(true)} className="flex-1 py-4 rounded-xl bg-primary text-white shadow-glow hover:bg-blue-600 transition-all">Sim</button>
                </div>
             </div>
          )}

          {medicationSetupStep === 'form' && (
             <div className="w-full bg-[#161618] border border-white/10 p-6 rounded-3xl">
                <MedicationForm currentDay={currentDay} onSave={saveMedication} />
             </div>
          )}

          {medicationSetupStep === 'summary' && (
             <div className="w-full bg-[#161618] border border-white/10 p-8 rounded-3xl text-center space-y-6">
                <h2 className="text-xl font-bold text-white">Remédio adicionado!</h2>
                <div className="flex flex-col gap-3 w-full">
                    <button onClick={() => setMedicationSetupStep('form')} className="w-full py-4 rounded-xl border border-white/10 text-primary hover:bg-primary/5 transition-all">Adicionar outro</button>
                    <button onClick={startTasksFlow} className="w-full py-4 rounded-xl bg-primary text-white shadow-glow hover:bg-blue-600 transition-all">Ir para Tarefas</button>
                </div>
             </div>
          )}
        </div>
      )}

      {/* 
        ------------------------------------------------------------
        SCREEN: MEDICATION MANAGER
        ------------------------------------------------------------
      */}
      {step === 3 && taskView === 'med_manage' && (
        <MedicationManager 
          medications={medications}
          onToggleActive={(id) => {
              setMedications(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m));
          }}
          onEdit={(med) => {
              setEditingMedication(med);
              setTaskView('med_setup_direct');
          }}
          onDelete={(id) => setMedicationToDelete(id)}
          onAddMore={() => {
              setEditingMedication(null);
              setTaskView('med_setup_direct');
          }}
          onClose={() => setTaskView('list')}
        />
      )}

      {/* 
        ------------------------------------------------------------
        SCREEN: EDIT TASKS (MANAGER)
        ------------------------------------------------------------
      */}
      {step === 3 && taskView === 'edit_tasks' && (
          <TaskManager 
            customTasks={customTasks}
            systemTasks={[]}
            disabledSystemTaskIds={disabledSystemTaskIds}
            onToggleSystemTask={(id) => {
                 setTaskToDelete(id);
            }}
            onEdit={(task) => {
                setEditingTask(task);
                setTaskView('task_form');
            }}
            onDelete={(id) => setTaskToDelete(id)}
            onAdd={() => {
                setEditingTask(null);
                setTaskView('task_form');
            }}
            onClose={() => setTaskView('list')}
          />
      )}

      {/* 
        ------------------------------------------------------------
        SCREEN: QUICK MED ADD / EDIT (From Tasks/Manager)
        ------------------------------------------------------------
      */}
      {step === 3 && taskView === 'med_setup_direct' && (
         <div className="w-full max-w-lg px-4 animate-enter">
            <div className="w-full bg-[#161618] border border-white/10 p-6 rounded-3xl relative">
                <button onClick={() => { setEditingMedication(null); setTaskView('med_manage'); }} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <h2 className="text-xl font-bold text-white mb-6">{editingMedication ? 'Editar Remédio' : 'Adicionar Remédio'}</h2>
                <MedicationForm 
                    currentDay={currentDay} 
                    onSave={saveMedication} 
                    initialData={editingMedication} 
                />
            </div>
         </div>
      )}

      {/* 
        ------------------------------------------------------------
        SCREEN: TASK FORM (Manual Tasks)
        ------------------------------------------------------------
      */}
      {step === 3 && taskView === 'task_form' && (
         <div className="w-full max-w-lg px-4 animate-enter">
            <div className="w-full bg-[#161618] border border-white/10 p-6 rounded-3xl relative">
                <button onClick={() => { setEditingTask(null); setTaskView('edit_tasks'); }} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <h2 className="text-xl font-bold text-white mb-6">{editingTask ? 'Editar Tarefa' : 'Adicionar Tarefa'}</h2>
                <TaskForm 
                    initialData={editingTask}
                    onSave={saveCustomTask}
                    onCancel={() => { setEditingTask(null); setTaskView('edit_tasks'); }}
                    systemDate={systemDate}
                />
            </div>
         </div>
      )}


      {/* 
        ------------------------------------------------------------
        SCREEN: TAREFAS (Step 3 - List)
        ------------------------------------------------------------
      */}
      {step === 3 && taskView === 'list' && (
        <div 
          className={`w-full max-w-lg px-4 flex flex-col items-start gap-8 pb-10 transition-transform duration-300 ease-out
            ${daySlideState === 'sliding-out' ? '-translate-x-[120%] opacity-0' : ''}
            ${daySlideState === 'sliding-in' ? 'translate-x-[120%] opacity-0' : ''}
            ${daySlideState === 'idle' ? 'translate-x-0 opacity-100' : ''}
          `}
          style={{ 
             transform: daySlideState === 'sliding-out' ? 'translateX(-100vw)' : 
                        daySlideState === 'sliding-in' ? 'translateX(100vw)' : 'translateX(0)',
             opacity: daySlideState === 'idle' ? 1 : 0
          }}
        >
           {/* Header */}
           <div className="w-full flex items-center justify-between pt-6">
             <div className="flex items-center gap-3">
               <div className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                 {getOrdinalDay(currentDay)} DIA
               </div>
               <div className="text-xs text-gray-400 font-medium tracking-wide flex flex-col sm:flex-row sm:gap-2">
                 <span>Fase {currentPhase} - {formData.name}</span>
               </div>
             </div>
             
             <div className="text-right">
                <span className="text-xs font-medium text-white block">Hoje: {formatSystemDate(systemDate)}</span>
             </div>
           </div>
           
           {/* Debug Date Range (Optional/Subtle as requested) */}
           <div className="w-full text-right -mt-6 opacity-40">
               <span className="text-[10px] text-gray-400">Exibindo tarefas para: {formatDebugDate(systemDate)}</span>
           </div>

           {/* Feedback Message */}
           {feedbackMessage && (
             <div className="w-full text-center py-2 -my-4 animate-[fadeIn_0.5s_ease-in-out]">
               <span className="text-sm font-medium text-green-400">
                 ✨ {feedbackMessage}
               </span>
             </div>
           )}

           {/* Title */}
           <div className="w-full">
             <h2 className="text-3xl font-bold text-white capitalize">
               Tarefas do {getOrdinalDay(currentDay).toLowerCase()} dia
             </h2>
           </div>

           {/* Progress Bar */}
           <div className="w-full">
             <ProgressBar total={tasks.length} completed={completedTasksCount} />
           </div>

           {/* Task List */}
           <div className="w-full space-y-4">
             {tasks.length === 0 ? (
                 <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                     <p className="text-gray-500 text-sm">Nenhuma tarefa agendada para hoje ({formatSystemDate(systemDate)}).</p>
                 </div>
             ) : (
                tasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
                ))
             )}
           </div>

           {/* Footer Actions */}
           <div className="w-full pt-8 flex gap-3 items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
              <button onClick={handleNextPhaseClick} disabled={currentPhase === 'A'} 
                className="flex-1 h-12 rounded-lg border border-white/10 bg-transparent text-gray-500 text-xs font-medium uppercase tracking-widest hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed">
                Próxima Fase
              </button>
              <button onClick={openChangePhaseScreen} 
                className="flex-1 h-12 rounded-lg border border-white/10 bg-transparent text-gray-500 text-xs font-medium uppercase tracking-widest hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-300">
                Mudar Fase
              </button>
           </div>
           
           {/* Add Med Link */}
           <div className="w-full flex justify-center -mt-2">
             <button 
                onClick={() => { setEditingMedication(null); setTaskView('med_setup_direct'); }}
                className="text-xs text-gray-600 hover:text-primary transition-colors border-b border-transparent hover:border-primary/50 pb-0.5"
             >
                Adicionar remédio/vitamina
             </button>
           </div>
        </div>
      )}

      {/* 
        ------------------------------------------------------------
        SCREEN: NEXT PHASE & CHANGE PHASE (Shared Layouts)
        ------------------------------------------------------------
      */}
      {step === 3 && (taskView === 'next_phase' || taskView === 'change_phase') && (
        <div className="w-full max-w-lg px-4 flex flex-col items-start gap-6 animate-enter pb-10">
          <div className="w-full space-y-2 mb-4 pt-6">
             <h2 className="text-2xl font-bold text-white">
                {taskView === 'next_phase' ? 'Próxima Fase' : 'Mudar de Fase'}
             </h2>
             <p className="text-gray-400 text-sm">
                {taskView === 'next_phase' 
                    ? "Como você está agora? Se seus sintomas combinarem com a próxima fase, você pode avançar."
                    : "Escolha a fase que mais combina com como você está hoje."}
             </p>
          </div>

          {taskView === 'next_phase' && (
             <>
                <div className="w-full space-y-2">
                    <div className="text-xs text-gray-500 font-bold uppercase ml-1">Sua fase atual</div>
                    <PhaseCard phase={PHASE_DETAILS[currentPhase!]} isCurrent={true} variant="display" />
                </div>
                {getNextPhase(currentPhase!) ? (
                    <div className="w-full space-y-2">
                        <div className="text-xs text-gray-500 font-bold uppercase ml-1">Próxima fase sugerida</div>
                        <PhaseCard phase={PHASE_DETAILS[getNextPhase(currentPhase!)!]} variant="display" />
                    </div>
                ) : (
                    <div className="w-full p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-sm text-center">
                        Você já está na fase mais leve. Parabéns!
                    </div>
                )}
                
                <div className="w-full space-y-3 pt-2">
                    <button onClick={() => setNextPhaseOption('maintain')} className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${nextPhaseOption === 'maintain' ? 'bg-primary/10 border-primary shadow-glow' : 'bg-[#161618] border-white/10 hover:bg-white/5'}`}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${nextPhaseOption === 'maintain' ? 'border-primary' : 'border-gray-500'}`}>{nextPhaseOption === 'maintain' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}</div>
                        <span className={nextPhaseOption === 'maintain' ? 'text-white font-medium' : 'text-gray-400'}>Manter na {PHASE_DETAILS[currentPhase!].title}</span>
                    </button>
                    {getNextPhase(currentPhase!) && (
                        <button onClick={() => setNextPhaseOption('advance')} className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${nextPhaseOption === 'advance' ? 'bg-primary/10 border-primary shadow-glow' : 'bg-[#161618] border-white/10 hover:bg-white/5'}`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${nextPhaseOption === 'advance' ? 'border-primary' : 'border-gray-500'}`}>{nextPhaseOption === 'advance' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}</div>
                            <span className={nextPhaseOption === 'advance' ? 'text-white font-medium' : 'text-gray-400'}>Avançar para Fase {PHASE_DETAILS[getNextPhase(currentPhase!)!].title.replace('Fase ', '')}</span>
                        </button>
                    )}
                </div>
             </>
          )}

          {taskView === 'change_phase' && (
              <div className="w-full space-y-4">
                {['D', 'C', 'B', 'A'].map((level) => (
                  <PhaseCard key={level} phase={PHASE_DETAILS[level]} isCurrent={currentPhase === level} isSelected={selectedPhaseToChange === level} onClick={() => setSelectedPhaseToChange(level as SymptomLevel)} />
                ))}
              </div>
          )}

          <div className="w-full pt-4 flex gap-4">
              <button onClick={taskView === 'next_phase' ? applyNextPhase : applyChangePhase} className="flex-[2] h-14 rounded-xl bg-primary text-white shadow-glow hover:bg-blue-600 font-bold text-sm tracking-wide transition-all">CONTINUAR</button>
              <button onClick={() => { setTaskView('list'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-1 h-14 rounded-xl border border-white/10 font-medium text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">VOLTAR</button>
          </div>
        </div>
      )}
      
      {/* Background ambient decorative blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* MODALS */}
      <ConfirmationModal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} onConfirm={handleReset} title="Resetar tudo?" description="Isso apaga seus dados e reinicia o acompanhamento." confirmText="Resetar" cancelText="Cancelar" variant="danger" />
      <ConfirmationModal isOpen={showAdvanceConfirm} onClose={() => setShowAdvanceConfirm(false)} onConfirm={openNextPhaseScreen} title="Avançar sem concluir?" description="Você ainda não concluiu nenhuma tarefa de hoje. Quer mesmo avançar?" confirmText="Continuar" cancelText="Voltar" />
      <ConfirmationModal isOpen={!!medicationToDelete} onClose={() => setMedicationToDelete(null)} onConfirm={handleDeleteMedication} title="Excluir remédio?" description="Isso remove a configuração e suas tarefas futuras." confirmText="Excluir" cancelText="Cancelar" variant="danger" />
      <ConfirmationModal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} onConfirm={handleDeleteCustomTask} title="Excluir tarefa?" description="Isso remove a configuração e suas tarefas futuras." confirmText="Excluir" cancelText="Cancelar" variant="danger" />

    </div>
  );
}