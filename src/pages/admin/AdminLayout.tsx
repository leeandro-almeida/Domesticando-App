import React from 'react'
import { Outlet } from 'react-router-dom'
import { AdminAuthProvider } from '../../contexts/AdminAuthContext'

export default function AdminLayout() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  )
}
