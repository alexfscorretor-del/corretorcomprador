'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ClientCard from '@/components/ClientCard';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';

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
    aceitaFinanciamento: (row.aceita_financiamento as Client['aceitaFinanciamento']) ?? 'indiferente',
    mobiliado: (row.mobiliado as Client['mobiliado']) ?? 'indiferente',
    varanda: (row.varanda as Client['varanda']) ?? 'indiferente',
    areaLazer: (row.area_lazer as Client['areaLazer']) ?? 'indiferente',
    aceitaPet: (row.aceita_pet as Client['aceitaPet']) ?? 'indiferente',
    archived: row.archived ?? false,
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

export default function ArquivadosPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const loadArchivedClients = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('archived', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar clientes arquivados:', error);
      setClients([]);
      setLoading(false);
      return;
    }

    setClients((data || []).map((row) => mapRowToClient(row as DbClientRow)));
    setLoading(false);
  };

  useEffect(() => {
    loadArchivedClients();
  }, []);

  const handleRestore = async (client: Client) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert('Usuário não autenticado.');
      return;
    }

    const { error } = await supabase
      .from('clients')
      .update({ archived: false })
      .eq('id', client.id)
      .eq('user_id', userData.user.id);

    if (error) {
      alert(`Erro ao desarquivar cliente: ${error.message}`);
      return;
    }

    await loadArchivedClients();
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert('Usuário não autenticado.');
      return;
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', toDelete.id)
      .eq('user_id', userData.user.id);

    if (error) {
      alert(`Erro ao excluir cliente: ${error.message}`);
      return;
    }

    setToDelete(null);
    await loadArchivedClients();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <p className="text-zinc-500">Carregando clientes arquivados...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-6">
        <div className="max-w-6xl mx-auto pt-12 lg:pt-0">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white">Clientes Arquivados</h1>
            <p className="text-zinc-500 text-sm">
              {clients.length} cliente{clients.length !== 1 ? 's' : ''} arquivado{clients.length !== 1 ? 's' : ''}
            </p>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-600 text-lg">Nenhum cliente arquivado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onView={(c) => router.push(`/clientes/${c.id}`)}
                  onDelete={(c) => setToDelete(c)}
                  onArchive={(c) => handleRestore(c)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {toDelete && (
        <ConfirmModal
          title="Excluir Cliente"
          message={`Excluir ${toDelete.nome} permanentemente?`}
          confirmLabel="Excluir"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}