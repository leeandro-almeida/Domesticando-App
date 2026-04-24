import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

export function AdminProtectedRoute() {
  const { isAdmin, isLoading } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return isAdmin ? <Outlet /> : <Navigate to="/admin" replace />
}
