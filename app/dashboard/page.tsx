'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import * as clientsRepo from '@/repositories/clientsRepository';
import { Clock } from 'lucide-react';

const statusLabel: Record<string, { label: string; color: string }> = {
  fechou: { label: 'Fechou', color: 'text-emerald-400' },
  nao_fechou: { label: 'Não Fechou', color: 'text-red-400' },
  em_andamento: { label: 'Em Andamento', color: 'text-yellow-400' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push('/login');
        return;
      }

      try {
        const mapped = await clientsRepo.listClients({ archived: false });
        setClients(mapped);
      } catch (error) {
        console.error(error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  const recentes = clients
    .filter((c) => !c.archived)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <p className="text-zinc-500">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 pt-12 lg:pt-0">
            <h1 className="text-2xl font-black text-white">Dashboard</h1>
            <p className="text-zinc-500 text-sm">Visão geral da sua carteira</p>
          </div>

          <DashboardStats clients={clients} />

          <div className="mt-10">
            <h2 className="text-lg font-bold text-white mb-4">Últimos clientes ativos</h2>

            {recentes.length === 0 ? (
              <p className="text-zinc-600 text-sm">Nenhum cliente ativo cadastrado.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentes.map((c) => {
                  const st = statusLabel[c.statusNegocio] ?? statusLabel['em_andamento'];
                  return (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/clientes/${c.id}`)}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-600 transition-all cursor-pointer"
                    >
                      <div>
                        <p className="text-white font-semibold text-sm">{c.nome}</p>
                        <p className="text-zinc-500 text-xs">{c.telefone}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                        <Clock size={14} className="text-zinc-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}