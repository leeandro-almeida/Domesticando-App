import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type View = 'login' | 'forgot';

export default function LoginPage() {
  const { user, isLoading, signIn, resetPassword } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-[#0a0a0c] to-[#111115]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const reset = () => { setError(''); setSuccess(''); };

  const switchView = (v: View) => {
    setView(v);
    setError('');
    setSuccess('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (view === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) setError(translateError(err.message));
      } else {
        const { error: err } = await resetPassword(email);
        if (err) setError(translateError(err.message));
        else setSuccess('E-mail de recuperação enviado. Verifique sua caixa de entrada.');
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const titles: Record<View, string> = {
    login: 'Entrar',
    forgot: 'Recuperar senha',
  };

  const subtitles: Record<View, string> = {
    login: 'Acesse seu protocolo de tratamento',
    forgot: 'Enviaremos um link para seu e-mail',
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-[#0a0a0c] to-[#111115] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-900/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] animate-enter">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Domesticando
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">{subtitles[view]}</p>
        </div>

        {/* Card */}
        <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-5">{titles[view]}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Password */}
            {view === 'login' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {view === 'login' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => switchView('forgot')} className="text-xs text-gray-500 hover:text-primary transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 mt-0.5 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm tracking-wide transition-all duration-300 hover:bg-blue-600 active:scale-[0.98] shadow-glow disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                view === 'login' ? 'Entrar' : 'Enviar link'
              )}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="text-center mt-5">
          {view === 'forgot' && (
            <p className="text-sm text-gray-500">
              Lembrou a senha?{' '}
              <button onClick={() => switchView('login')} className="text-primary hover:text-blue-400 font-medium transition-colors">
                Voltar ao login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.';
  if (msg.includes('Password should be')) return 'A senha deve ter no mínimo 6 caracteres.';
  return msg;
}
