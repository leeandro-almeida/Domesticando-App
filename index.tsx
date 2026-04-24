import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { ProtectedRoute } from './src/components/auth/ProtectedRoute';
import { AdminProtectedRoute } from './src/components/admin/AdminProtectedRoute';
import LoginPage from './src/pages/LoginPage';
import AdminLayout from './src/pages/admin/AdminLayout';
import AdminLoginPage from './src/pages/admin/AdminLoginPage';
import AdminTasksPage from './src/pages/admin/AdminTasksPage';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminLoginPage />} />
              <Route element={<AdminProtectedRoute />}>
                <Route path="tasks" element={<AdminTasksPage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/*" element={<App />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);