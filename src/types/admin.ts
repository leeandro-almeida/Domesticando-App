export type Grade = 'A' | 'B' | 'D' | 'E'
export type Recurrence = 'daily' | 'weekly' | 'monthly' | 'today'

export interface TaskTemplate {
  id: string
  grade: Grade
  name: string
  recurrence: Recurrence
  days_of_week: number[]
  has_steps: boolean
  steps_count: number | null
  step_interval_minutes: number | null
  created_at: string
}

export type TaskTemplateInput = Omit<TaskTemplate, 'id' | 'created_at'>
