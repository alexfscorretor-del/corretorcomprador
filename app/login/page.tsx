'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register' | 'recover';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('login');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage('E-mail ou senha incorretos.');
      return;
    }

    if (!data.session) {
      setMessage('Login realizado, mas a sessão não foi criada.');
      return;
    }

    router.push('/dashboard');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || 'Erro ao realizar cadastro.');
      return;
    }

    setMessage('Cadastro realizado com sucesso. Agora faça login.');
    setMode('login');
    setPassword('');
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);

    if (error) {
      setMessage(`Erro ao enviar recuperação: ${error.message}`);
      return;
    }

    setMessage('Link de recuperação enviado. Verifique seu e-mail.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 md:p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Login</h1>
        <p className="text-sm text-zinc-400 mb-6">
          {mode === 'login' && 'Acesse sua conta.'}
          {mode === 'register' && 'Cadastre sua conta com e-mail liberado pelo admin.'}
          {mode === 'recover' && 'Recupere sua senha.'}
        </p>

        <form
          onSubmit={
            mode === 'login'
              ? handleLogin
              : mode === 'register'
              ? handleRegister
              : handleRecover
          }
          className="space-y-4"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors text-sm"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={mode !== 'recover'}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <p className={`text-sm ${
              message.toLowerCase().includes('sucesso') || message.toLowerCase().includes('enviado')
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E50914] hover:bg-red-700 text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-50 text-sm min-h-[44px]"
          >
            {loading
              ? 'Aguarde...'
              : mode === 'login'
              ? 'Entrar'
              : mode === 'register'
              ? 'Cadastrar'
              : 'Enviar link'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center">
          {mode !== 'login' && (
            <button
              onClick={() => { setMode('login'); setMessage(''); }}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Já tenho conta — fazer login
            </button>
          )}
          {mode !== 'register' && (
            <button
              onClick={() => { setMode('register'); setMessage(''); }}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Primeiro acesso — cadastrar conta
            </button>
          )}
          {mode !== 'recover' && (
            <button
              onClick={() => { setMode('recover'); setMessage(''); }}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Esqueci minha senha
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
