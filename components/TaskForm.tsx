import React, { useState, useEffect } from 'react';
import { CustomTask, RecurrenceType } from '../types';
import { Input } from './Input';
import { WeekDaySelector } from './WeekDaySelector';
import { CalendarInput } from './CalendarInput';

interface TaskFormProps {
  onSave: (task: Omit<CustomTask, 'id' | 'createdAt'>) => void;
  initialData?: CustomTask | null;
  onCancel: () => void;
  systemDate: Date;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSave, initialData, onCancel, systemDate }) => {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceType>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState<number>(1);
  const [hasSteps, setHasSteps] = useState(false);
  const [stepsQty, setStepsQty] = useState<number>(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setFrequency(initialData.frequency);
      setWeekDays(initialData.weekDays || []);
      setMonthDay(initialData.monthDay || 1);
      setHasSteps(initialData.hasSteps);
      setStepsQty(initialData.stepsQty);
    } else {
        setMonthDay(systemDate.getDate());
    }
  }, [initialData, systemDate]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Nome da tarefa é obrigatório');
      return;
    }
    if (frequency === 'weekly' && weekDays.length === 0) {
      setError('Selecione pelo menos um dia da semana');
      return;
    }
    if (hasSteps && (stepsQty < 1 || stepsQty > 6)) {
        setError('Quantidade de etapas deve ser entre 1 e 6');
        return;
    }

    // Determine createdDate for 'once' tasks (Uses System Date)
    const createdDate = frequency === 'once' ? systemDate.toISOString().split('T')[0] : undefined;

    onSave({
      name,
      frequency,
      weekDays: frequency === 'weekly' ? weekDays : undefined,
      monthDay: frequency === 'monthly' ? monthDay : undefined,
      hasSteps,
      stepsQty: hasSteps ? stepsQty : 0,
      createdDate
    });
  };

  return (
    <div className="space-y-6 animate-enter">
      <Input
        label="Nome da tarefa"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Alongamento, Hidratação..."
        error={error && !name.trim() ? error : undefined}
      />

      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-gray-400 ml-1">Recorrência</label>
        
        <div className="grid grid-cols-2 gap-2 bg-[#161618] p-1 rounded-xl border border-white/10">
          <button onClick={() => setFrequency('daily')} className={`py-2 rounded-lg text-xs font-medium transition-all ${frequency === 'daily' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Diário</button>
          <button onClick={() => setFrequency('weekly')} className={`py-2 rounded-lg text-xs font-medium transition-all ${frequency === 'weekly' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Semanal</button>
          <button onClick={() => setFrequency('monthly')} className={`py-2 rounded-lg text-xs font-medium transition-all ${frequency === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Mensal</button>
          <button onClick={() => setFrequency('once')} className={`py-2 rounded-lg text-xs font-medium transition-all ${frequency === 'once' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Hoje</button>
        </div>

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

        {frequency === 'once' && (
             <p className="text-[10px] text-gray-400 ml-1 bg-white/5 p-2 rounded-lg">Essa tarefa aparecerá apenas hoje ({systemDate.toLocaleDateString('pt-BR')}) e não se repetirá.</p>
        )}
      </div>

      <div className="space-y-4 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Tem etapas?</label>
            <button 
               onClick={() => setHasSteps(!hasSteps)}
               className={`w-11 h-6 rounded-full relative transition-colors border ${hasSteps ? 'bg-primary/20 border-primary' : 'bg-gray-800 border-gray-600'}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-current transition-transform shadow-sm ${hasSteps ? 'translate-x-5 text-primary' : 'translate-x-0 text-gray-400'}`} />
            </button>
        </div>

        {hasSteps && (
            <div className="animate-enter">
                <Input
                    label="Quantidade de etapas (1-6)"
                    type="number"
                    min={1}
                    max={6}
                    value={stepsQty}
                    onChange={(e) => setStepsQty(parseInt(e.target.value) || 1)}
                />
            </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 text-center animate-pulse">{error}</p>}

      <div className="flex gap-4 mt-4">
        <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl font-medium text-sm text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
        >
            CANCELAR
        </button>
        <button
            onClick={handleSave}
            className="flex-1 py-4 rounded-xl font-bold text-sm bg-primary text-white shadow-glow hover:bg-blue-600 transition-all"
        >
            SALVAR
        </button>
      </div>
    </div>
  );
};