import { TaskTemplate, TaskTemplateInput } from '../types/admin'

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function headers(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
  }
}

async function request<T>(url: string, init: RequestInit, token: string): Promise<T> {
  const res = await fetch(url, { ...init, headers: headers(token) })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
  return json as T
}

export const adminApi = {
  getTasks(grade: string, token: string): Promise<TaskTemplate[]> {
    return request(`${FN_BASE}/admin-tasks?grade=${grade}`, { method: 'GET' }, token)
  },

  createTask(data: TaskTemplateInput, token: string): Promise<TaskTemplate> {
    return request(`${FN_BASE}/admin-tasks`, { method: 'POST', body: JSON.stringify(data) }, token)
  },

  updateTask(id: string, data: Partial<TaskTemplateInput>, token: string): Promise<TaskTemplate> {
    return request(`${FN_BASE}/admin-tasks`, { method: 'PUT', body: JSON.stringify({ id, ...data }) }, token)
  },

  deleteTask(id: string, token: string): Promise<{ ok: boolean }> {
    return request(`${FN_BASE}/admin-tasks?id=${id}`, { method: 'DELETE' }, token)
  },
}
