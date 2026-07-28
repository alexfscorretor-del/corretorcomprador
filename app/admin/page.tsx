'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { UserPlus, Trash2, CheckCircle, XCircle } from 'lucide-react';

type Invite = {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean;
  created_at: string;
  used_at: string | null;
};

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'alexfs.corretor@gmail.com').toLowerCase();

export default function AdminPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      if ((user.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        router.push('/dashboard');
        return;
      }

      setAutorizado(true);
      await carregarInvites();
    }

    void init();
  }, [router]);

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || '';
  }

  async function carregarInvites() {
    setLoading(true);
    setMsg('');

    const token = await getToken();

    const res = await fetch('/api/admin/invites', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || 'Erro ao carregar convites.');
      setLoading(false);
      return;
    }

    setInvites(json.invites || []);
    setLoading(false);
  }

  async function cadastrarInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!novoEmail.trim()) return;

    setSalvando(true);
    setMsg('');

    const token = await getToken();

    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: novoEmail,
        nome: novoNome,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || 'Erro ao liberar corretor.');
      setSalvando(false);
      return;
    }

    setMsg('Corretor liberado com sucesso.');
    setNovoEmail('');
    setNovoNome('');
    setSalvando(false);
    await carregarInvites();
  }

  async function toggleAtivo(invite: Invite) {
    const token = await getToken();

    const res = await fetch('/api/admin/invites', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: invite.id,
        ativo: !invite.ativo,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || 'Erro ao atualizar convite.');
      return;
    }

    await carregarInvites();
  }

  async function removerInvite(invite: Invite) {
    if (!confirm(`Remover a liberação de ${invite.email}?`)) return;

    const token = await getToken();

    const res = await fetch(`/api/admin/invites?id=${invite.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || 'Erro ao remover convite.');
      return;
    }

    await carregarInvites();
  }

  if (!autorizado) return null;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 pt-12 lg:pt-0">
            <h1 className="text-2xl font-black text-white">Painel Admin</h1>
            <p className="text-zinc-500 text-sm">
              Libere e gerencie os e-mails autorizados para cadastro.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-red-400" />
              Liberar novo corretor
            </h2>

            <form onSubmit={cadastrarInvite} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome do corretor (opcional)"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors text-sm"
              />

              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="E-mail do corretor"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  required
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors text-sm"
                />

                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-[#E50914] hover:bg-red-700 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {salvando ? 'Salvando...' : 'Liberar'}
                </button>
              </div>
            </form>

            {msg && <p className="mt-3 text-sm text-emerald-400">{msg}</p>}
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4">
              Convites ({invites.length})
            </h2>

            {loading ? (
              <p className="text-zinc-500 text-sm">Carregando...</p>
            ) : invites.length === 0 ? (
              <p className="text-zinc-600 text-sm">Nenhum convite criado ainda.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {invite.nome || 'Sem nome'}
                      </p>
                      <p className="text-zinc-400 text-xs">{invite.email}</p>
                      <p className="text-zinc-500 text-xs">
                        {invite.used_at ? 'Cadastro já utilizado' : 'Aguardando cadastro'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          invite.ativo
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}
                      >
                        {invite.ativo ? 'Ativo' : 'Bloqueado'}
                      </span>

                      <button
                        onClick={() => toggleAtivo(invite)}
                        title={invite.ativo ? 'Bloquear' : 'Ativar'}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {invite.ativo ? (
                          <XCircle size={16} className="text-red-400" />
                        ) : (
                          <CheckCircle size={16} className="text-emerald-400" />
                        )}
                      </button>

                      <button
                        onClick={() => removerInvite(invite)}
                        title="Remover"
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Trash2 size={16} className="text-zinc-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}