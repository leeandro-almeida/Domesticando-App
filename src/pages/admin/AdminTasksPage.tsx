import React, { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { adminApi } from '../../lib/adminApi'
import { Grade, TaskTemplate, TaskTemplateInput } from '../../types/admin'
import TaskTemplateForm from '../../components/admin/TaskTemplateForm'

const GRADES: Grade[] = ['A', 'B', 'D', 'E']
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function formatRecurrence(task: TaskTemplate): string {
  if (task.recurrence === 'daily')   return 'Diário'
  if (task.recurrence === 'monthly') return 'Mensal'
  if (task.recurrence === 'today')   return 'Hoje'
  const days = task.days_of_week.map(d => DAY_LABELS[d]).join(', ')
  return days ? `Semanal — ${days}` : 'Semanal'
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = minutes / 60
  return Number.isInteger(h) ? `${h}h` : `${h}h`
}

export default function AdminTasksPage() {
  const { signOut, accessToken } = useAdminAuth()
  const [grade, setGrade]         = useState<Grade>('A')
  const [tasks, setTasks]         = useState<TaskTemplate[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<TaskTemplate | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getTasks(grade, accessToken)
      setTasks(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }, [grade, accessToken])

  useEffect(() => { loadTasks() }, [loadTasks])

  async function handleSave(data: Omit<TaskTemplateInput, 'grade'>, grades: Grade[]) {
    if (!accessToken) return
    if (editing) {
      await adminApi.updateTask(editing.id, { ...data, grade: grades[0] }, accessToken)
    } else {
      await Promise.all(grades.map(g => adminApi.createTask({ ...data, grade: g }, accessToken)))
    }
    setShowForm(false)
    setEditing(null)
    loadTasks()
  }

  async function handleDelete(id: string) {
    if (!accessToken) return
    setDeleting(id)
    try {
      await adminApi.deleteTask(id, accessToken)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover tarefa')
    } finally {
      setDeleting(null)
    }
  }

  function openCreate() { setEditing(null); setShowForm(true) }
  function openEdit(task: TaskTemplate) { setEditing(task); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null) }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-none">Admin</p>
            <h1 className="text-sm font-semibold text-white leading-snug">Domesticando</h1>
          </div>
        </div>
        <button onClick={signOut}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title + Add button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Tarefas por grau</h2>
          <button onClick={openCreate}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-blue-600 active:scale-[0.98] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova tarefa
          </button>
        </div>

        {/* Grade tabs */}
        <div className="flex gap-2 mb-6">
          {GRADES.map(g => (
            <button key={g} onClick={() => setGrade(g)}
              className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
                grade === g
                  ? 'bg-primary text-white'
                  : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] border border-white/[0.06]'
              }`}>
              Grau {g}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            </div>
            <p className="text-gray-500 text-sm">Nenhuma tarefa para o grau {grade}</p>
            <p className="text-gray-600 text-xs mt-1">Clique em "Nova tarefa" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id}
                className="bg-[#111113] border border-white/[0.06] rounded-xl px-5 py-4 flex items-start justify-between gap-4 hover:border-white/[0.10] transition-colors">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{task.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{formatRecurrence(task)}</p>
                  {task.has_steps && (
                    <p className="text-gray-600 text-xs mt-0.5">
                      {task.steps_count} {task.steps_count === 1 ? 'etapa' : 'etapas'}
                      {task.step_interval_minutes != null && ` · ${formatInterval(task.step_interval_minutes)} de intervalo`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(task)}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center transition-all">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(task.id)} disabled={deleting === task.id}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-red-500/10 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40">
                    {deleting === task.id
                      ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <TaskTemplateForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}
    </div>
  )
}
