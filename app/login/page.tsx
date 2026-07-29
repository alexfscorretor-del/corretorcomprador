'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { loginSchema, registerSchema } from '@/schemas/auth';

type Mode = 'login' | 'register' | 'recover';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('login');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setLoading(false);
      setMessage(parsed.error.issues[0]?.message || 'Dados inválidos.');
      return;
    }

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

    // Full page reload garante que o browser envia os cookies recém-gravados
    // no próximo request — o middleware Next.js então lê a sessão corretamente.
    window.location.href = '/dashboard';
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const parsed = registerSchema.safeParse({ email, password });
    if (!parsed.success) {
      setLoading(false);
      setMessage(parsed.error.issues[0]?.message || 'Dados inválidos.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: invited, error: inviteError } = await supabase.rpc('is_broker_invited', {
      p_email: normalizedEmail,
    });

    if (inviteError) {
      setLoading(false);
      setMessage(`Erro ao validar liberação: ${inviteError.message}`);
      return;
    }

    if (!invited) {
      setLoading(false);
      setMessage('Este e-mail não está liberado para cadastro.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    if (data.user?.id) {
      await supabase.rpc('consume_broker_invite', { p_email: normalizedEmail });
    }

    setLoading(false);
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
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-red-400"
              placeholder="seuemail.com"
              autoComplete="email"
              required
            />
          </div>

          {mode !== 'recover' && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-red-400"
                placeholder="Sua senha"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#E50914] px-4 py-3 font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Carregando...'
              : mode === 'login'
              ? 'Entrar'
              : mode === 'register'
              ? 'Cadastrar'
              : 'Enviar recuperação'}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setMessage('');
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
          >
            {mode === 'login' ? 'Quero me cadastrar' : 'Já tenho conta'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('recover');
              setMessage('');
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
          >
            Esqueci minha senha
          </button>

          {mode !== 'login' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage('');
              }}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Voltar para login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
