'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import { Clock } from 'lucide-react';

type DbClientRow = {
  id: string;
  user_id: string;
  created_at: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  aniversario: string | null;
  sexo: string | null;
  estado_civil: string | null;
  tem_filhos: boolean | null;
  quant_filhos: number | null;
  prazo: string | null;
  tipo_imovel: string | null;
  preco_min: number | null;
  preco_max: number | null;
  bairro: string | null;
  bairros_secundarios: string | null;
  tamanho: number | null;
  quartos_min: number | null;
  suites_min: number | null;
  banheiros_min: number | null;
  vagas_min: number | null;
  tipo_vaga: string | null;
  condominio_max: number | null;
  pref_andar: boolean | null;
  andar_apartir: number | null;
  novo: string | null;
  reformado: string | null;
  aceita_financiamento: string | null;
  mobiliado: string | null;
  varanda: string | null;
  area_lazer: string | null;
  aceita_pet: string | null;
  archived: boolean | null;
  status_negocio: string | null;
  observacoes: string | null;
};

function mapRowToClient(row: DbClientRow): Client {
  return {
    id: row.id,
    createdAt: row.created_at,
    nome: row.nome ?? '',
    telefone: row.telefone ?? '',
    email: row.email ?? '',
    cpf: row.cpf ?? '',
    aniversario: row.aniversario ?? '',
    sexo: row.sexo ?? '',
    estadoCivil: row.estado_civil ?? '',
    temFilhos: row.tem_filhos ?? false,
    quantFilhos: row.quant_filhos ?? 0,
    prazo: row.prazo ?? '',
    tipoImovel: row.tipo_imovel ?? '',
    precoMin: row.preco_min ?? undefined,
    precoMax: row.preco_max ?? undefined,
    orcamentoMin: row.preco_min ?? undefined,
    orcamentoMax: row.preco_max ?? undefined,
    bairro: row.bairro ?? '',
    bairrosSecundarios: row.bairros_secundarios ?? '',
    tamanho: row.tamanho ?? undefined,
    quartosMin: row.quartos_min ?? undefined,
    suitesMin: row.suites_min ?? undefined,
    banheirosMin: row.banheiros_min ?? undefined,
    vagasMin: row.vagas_min ?? undefined,
    tipoVaga: row.tipo_vaga ?? '',
    condominioMax: row.condominio_max ?? undefined,
    prefAndar: row.pref_andar ?? false,
    andarApartir: row.andar_apartir ?? null,
    novo: (row.novo as Client['novo']) ?? 'indiferente',
    reformado: (row.reformado as Client['reformado']) ?? 'indiferente',
    aceitaFinanciamento:
      (row.aceita_financiamento as Client['aceitaFinanciamento']) ?? 'indiferente',
    mobiliado: (row.mobiliado as Client['mobiliado']) ?? 'indiferente',
    varanda: (row.varanda as Client['varanda']) ?? 'indiferente',
    areaLazer: (row.area_lazer as Client['areaLazer']) ?? 'indiferente',
    aceitaPet: (row.aceita_pet as Client['aceitaPet']) ?? 'indiferente',
    archived: row.archived === true,
    statusNegocio:
      row.status_negocio === 'fechou' ||
      row.status_negocio === 'nao_fechou' ||
      row.status_negocio === 'em_andamento'
        ? row.status_negocio
        : 'em_andamento',
    observacoes: row.observacoes ?? '',
    properties: [],
  };
}

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

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map((row) => mapRowToClient(row as DbClientRow));
      setClients(mapped);
      setLoading(false);
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