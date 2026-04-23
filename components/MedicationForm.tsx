import React, { useState, useEffect } from 'react';
import { Medication, RecurrenceType } from '../types';
import { Input } from './Input';
import { WeekDaySelector } from './WeekDaySelector';
import { CalendarInput } from './CalendarInput';

interface MedicationFormProps {
  currentDay: number;
  onSave: (med: Omit<Medication, 'id'>) => void;
  initialData?: Medication | null;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({ currentDay, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceType>('daily');
  const [timesPerDay, setTimesPerDay] = useState<number>(1);
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState<number>(1);
  
  // Treatment Tracking State
  const [isStartingNow, setIsStartingNow] = useState<boolean>(true);
  const [dosesInput, setDosesInput] = useState<number>(14); // Default generic value
  const [dosesTakenInput, setDosesTakenInput] = useState<number>(0);

  const [error, setError] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setFrequency(initialData.frequency);
      setTimesPerDay(initialData.timesPerDay);
      setWeekDays(initialData.weekDays || []);
      setMonthDay(initialData.monthDay || 1);
      
      // Calculate inputs based on saved data
      if (initialData.totalDosesPlanned) {
          // If editing, we show what's remaining/total based on existing logic
          // Simplified: just show Total Planned and Taken
          setDosesInput(initialData.totalDosesPlanned);
          setDosesTakenInput(initialData.dosesTaken);
          // If taken > 0, technically not "starting now", but for UI simplicity in edit mode:
          setIsStartingNow(initialData.dosesTaken === 0);
      }
    } else {
      // Defaults
      setName('');
      setFrequency('daily');
      setTimesPerDay(1);
      setWeekDays([]);
      setMonthDay(new Date().getDate());
      setIsStartingNow(true);
      setDosesInput(14);
      setDosesTakenInput(0);
    }
  }, [initialData]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (timesPerDay < 1 || timesPerDay > 6) {
      setError('Quantidade diária deve ser entre 1 e 6');
      return;
    }
    if (frequency === 'weekly' && weekDays.length === 0) {
      setError('Selecione pelo menos um dia da semana');
      return;
    }
    if (frequency === 'monthly' && (monthDay < 1 || monthDay > 31)) {
        setError('Dia do mês inválido');
        return;
    }
    if (dosesInput < 1) {
        setError('Informe a quantidade de doses');
        return;
    }

    // Logic for totals
    // If starting now: Taken = 0, Total = Input
    // If already started: Taken = (Total - Remaining), but Input asks "How many remaining?".
    // Let's stick to the prompt structure.
    // Prompt: "Se Já comecei -> Quantas doses ainda faltam tomar?"
    // We need to calculate Total Planned for the record.
    // TotalPlanned = (TakenSoFar[implicit 0 if new] + RemainingInput) is weird if we don't know taken.
    // Actually, if "Already started", we assume they took some outside the app. 
    // We only care about tracking what happens INSIDE the app from now on + History?
    // Let's store: dosesTaken = 0 (in app history starts now) 
    // totalDosesPlanned = remainingInput. 
    // Display will be "0 / remainingInput". 
    // This is the simplest way to track "future" doses.
    
    // HOWEVER, the prompt says: "tratamento: tomadas/total_planejado".
    // If I say "Faltam 10", and I take 1. It shows "1/10". Correct.
    
    const calculatedTotal = dosesInput; // The input represents the "Total tracking scope" for this entry.
    
    // If editing, we preserve the taken count unless explicitly resetting logic is needed.
    // For MVP/Prompt compliance:
    const finalTaken = initialData ? initialData.dosesTaken : 0;
    // If "Already Started" mode in creation, we just set the Total to the Remaining count provided. 
    // Effectively, "Total Planned" = "Tasks the app will generate".

    onSave({
      name,
      frequency,
      timesPerDay,
      weekDays: frequency === 'weekly' ? weekDays : undefined,
      monthDay: frequency === 'monthly' ? monthDay : undefined,
      createdOnDay: initialData ? initialData.createdOnDay : currentDay,
      status: initialData ? initialData.status : 'active',
      totalDosesPlanned: calculatedTotal,
      dosesTaken: finalTaken,
    });
    
    if (!initialData) {
        setName('');
        setFrequency('daily');
        setTimesPerDay(1);
        setWeekDays([]);
    }
    setError('');
  };

  const estimatedDays = Math.ceil(dosesInput / timesPerDay);

  return (
    <div className="space-y-6 animate-enter">
      <Input
        label="Nome do remédio ou vitamina"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Antibiótico, Vitamina C"
        error={error && !name.trim() ? error : undefined}
      />

      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-gray-400 ml-1">Como vai tomar?</label>
        
        {/* Recurrence Selector */}
        <div className="flex gap-2 bg-[#161618] p-1 rounded-xl border border-white/10">
          <button onClick={() => setFrequency('daily')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${frequency === 'daily' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Diário</button>
          <button onClick={() => setFrequency('weekly')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${frequency === 'weekly' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Semanal</button>
          <button onClick={() => setFrequency('monthly')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${frequency === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Mensal</button>
        </div>

        {/* Dynamic Recurrence Options */}
        {frequency === 'weekly' && (
          <div className="space-y-2 animate-enter">
            <label className="text-xs font-medium text-gray-400 ml-1">Quais dias?</label>
            <WeekDaySelector selectedDays={weekDays} onChange={setWeekDays} />
          </div>
        )}

        {frequency === 'monthly' && (
           <div className="space-y-2 animate-enter">
             <label className="text-xs font-medium text-gray-400 ml-1">Selecione o dia</label>
             <CalendarInput selectedDay={monthDay} onSelectDay={setMonthDay} />
           </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Input
          label="Quantas vezes por dia?"
          type="number"
          min={1}
          max={6}
          value={timesPerDay}
          onChange={(e) => setTimesPerDay(parseInt(e.target.value) || 0)}
        />
      </div>

      {/* Treatment Duration Section */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <label className="text-xs font-medium text-gray-400 ml-1">Situação do tratamento</label>
        
        {!initialData && (
             <div className="flex gap-2 bg-[#161618] p-1 rounded-xl border border-white/10 mb-3">
                <button onClick={() => setIsStartingNow(true)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${isStartingNow ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Estou iniciando agora</button>
                <button onClick={() => setIsStartingNow(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${!isStartingNow ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Já comecei</button>
            </div>
        )}

        <Input
          label={initialData ? "Total de doses planejadas" : (isStartingNow ? "Quantas doses no total você precisa tomar?" : "Quantas doses ainda faltam tomar?")}
          type="number"
          min={1}
          value={dosesInput}
          onChange={(e) => setDosesInput(parseInt(e.target.value) || 0)}
        />
        
        {dosesInput > 0 && timesPerDay > 0 && (
            <div className="ml-1 p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-xs text-gray-300">
                    Duração estimada: <strong className="text-white">{estimatedDays} dias</strong>
                    {frequency !== 'daily' && <span className="text-gray-500"> (considerando dias de pausa)</span>}
                </p>
            </div>
        )}
      </div>
      
      {error && <p className="text-xs text-red-400 text-center animate-pulse">{error}</p>}

      <button
        onClick={handleSave}
        className="w-full py-4 rounded-xl font-bold text-sm bg-primary text-white shadow-glow hover:bg-blue-600 transition-all mt-4"
      >
        {initialData ? 'SALVAR ALTERAÇÕES' : 'SALVAR REMÉDIO'}
      </button>
    </div>
  );
};