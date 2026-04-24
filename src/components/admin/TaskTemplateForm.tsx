import React, { useState } from 'react'
import { Grade, Recurrence, TaskTemplate, TaskTemplateInput } from '../../types/admin'

const GRADES: Grade[] = ['A', 'B', 'D', 'E']
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const DAY_INITIALS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

const INTERVAL_OPTIONS: { label: string; value: number }[] = [
  { label: '30 minutos', value: 30 },
  { label: '1 hora',    value: 60 },
  { label: '2 horas',   value: 120 },
  { label: '3 horas',   value: 180 },
  { label: '4 horas',   value: 240 },
  { label: '6 horas',   value: 360 },
  { label: '8 horas',   value: 480 },
  { label: '12 horas',  value: 720 },
  { label: '24 horas',  value: 1440 },
]

interface Props {
  initial?: TaskTemplate
  onSave: (data: Omit<TaskTemplateInput, 'grade'>, grades: Grade[]) => Promise<void>
  onCancel: () => void
}

export default function TaskTemplateForm({ initial, onSave, onCancel }: Props) {
  const [selectedGrades, setSelectedGrades] = useState<Grade[]>(
    initial ? [initial.grade] : []
  )
  const [name, setName]               = useState(initial?.name ?? '')
  const [recurrence, setRecurrence]   = useState<Recurrence>(initial?.recurrence ?? 'daily')
  const [days, setDays]               = useState<number[]>(initial?.days_of_week ?? [])
  const [hasSteps, setHasSteps]       = useState(initial?.has_steps ?? false)
  const [stepsCount, setStepsCount]   = useState(initial?.steps_count ?? 1)
  const [hasInterval, setHasInterval] = useState(initial?.step_interval_minutes != null)
  const [interval, setInterval]       = useState(initial?.step_interval_minutes ?? 60)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  function toggleGrade(g: Grade) {
    if (initial) {
      setSelectedGrades([g])
    } else {
      setSelectedGrades(prev =>
        prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
      )
    }
  }

  function toggleDay(idx: number) {
    setDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome da tarefa é obrigatório'); return }
    if (selectedGrades.length === 0) { setError('Selecione pelo menos um grau'); return }
    if (recurrence === 'weekly' && days.length === 0) { setError('Selecione pelo menos um dia'); return }

    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        recurrence,
        days_of_week: recurrence === 'weekly' ? days : [],
        has_steps: hasSteps,
        steps_count: hasSteps ? stepsCount : null,
        step_interval_minutes: hasSteps && hasInterval ? interval : null,
      }, selectedGrades)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      setSaving(false)
    }
  }

  const title = initial
    ? `Editar tarefa — Grau ${selectedGrades[0] ?? initial.grade}`
    : 'Adicionar tarefa'

  const submitLabel = saving
    ? null
    : initial
      ? 'Salvar alterações'
      : selectedGrades.length > 1
        ? `Criar para ${selectedGrades.length} graus`
        : 'Criar tarefa'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold text-base">{title}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Seleção de grau(s) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {initial ? 'Grau da lesão' : 'Grau(s) da lesão — pode selecionar mais de um'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                    selectedGrades.includes(g)
                      ? 'bg-primary text-white'
                      : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] border border-white/[0.08]'
                  }`}
                >
                  Grau {g}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nome da tarefa</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Hidratação, Alongamento..."
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Recorrência */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recorrência</label>
            <div className="grid grid-cols-2 gap-2">
              {(['daily', 'weekly', 'monthly', 'today'] as Recurrence[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  className={`h-10 rounded-xl text-sm font-medium transition-all ${
                    recurrence === r
                      ? 'bg-primary text-white'
                      : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] border border-white/[0.08]'
                  }`}
                >
                  {r === 'daily' ? 'Diário' : r === 'weekly' ? 'Semanal' : r === 'monthly' ? 'Mensal' : 'Hoje'}
                </button>
              ))}
            </div>
          </div>

          {/* Dias da semana */}
          {recurrence === 'weekly' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quais dias?</label>
              <div className="flex gap-2">
                {DAY_INITIALS.map((letter, idx) => (
                  <button
                    key={idx}
                    type="button"
                    title={DAY_LABELS[idx]}
                    onClick={() => toggleDay(idx)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-all ${
                      days.includes(idx)
                        ? 'bg-primary text-white'
                        : 'bg-white/[0.04] text-gray-500 hover:bg-white/[0.08] border border-white/[0.08]'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tem etapas */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">Tem etapas?</span>
            <button
              type="button"
              onClick={() => setHasSteps(p => !p)}
              className={`w-11 h-6 rounded-full transition-all relative ${hasSteps ? 'bg-primary' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${hasSteps ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {hasSteps && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quantidade de etapas (1–6)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={stepsCount}
                  onChange={e => setStepsCount(Math.min(6, Math.max(1, Number(e.target.value))))}
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">Tem intervalo fixo entre etapas?</span>
                <button
                  type="button"
                  onClick={() => setHasInterval(p => !p)}
                  className={`w-11 h-6 rounded-full transition-all relative ${hasInterval ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${hasInterval ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {hasInterval && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Intervalo entre etapas</label>
                  <select
                    value={interval}
                    onChange={e => setInterval(Number(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  >
                    {INTERVAL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-[#111113]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-white/[0.08] text-gray-400 text-sm font-medium hover:bg-white/[0.04] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                : submitLabel
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
