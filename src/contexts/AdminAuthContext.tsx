import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'dc-admin-token'
const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface AdminAuthContextType {
  isAdmin: boolean
  isLoading: boolean
  accessToken: string | null
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin]         = useState(false)
  const [isLoading, setIsLoading]     = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token) { setIsLoading(false); return }
    verifyToken(token)
  }, [])

  async function verifyToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user?.user_metadata?.role === 'admin') {
        setIsAdmin(true)
        setAccessToken(token)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }

  async function signIn(username: string, password: string): Promise<{ error: string | null }> {
    try {
      const res = await fetch(`${FN_BASE}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json()
      if (!res.ok) return { error: json.error ?? 'Credenciais inválidas' }

      localStorage.setItem(STORAGE_KEY, json.access_token)
      setAccessToken(json.access_token)
      setIsAdmin(true)
      return { error: null }
    } catch {
      return { error: 'Erro de conexão' }
    }
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setIsAdmin(false)
    setAccessToken(null)
  }

  return (
    <AdminAuthContext.Provider value={{ isAdmin, isLoading, accessToken, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider')
  return ctx
}
