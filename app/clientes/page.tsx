'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ClientCard from '@/components/ClientCard';
import ClientForm from '@/components/ClientForm';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { deletePhotos } from '@/lib/uploadPhotos';
import { Client } from '@/types';
import { Plus, Search } from 'lucide-react';

type Modal = 'new' | 'edit' | 'delete' | null;

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

export default function ClientesPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'em_andamento' | 'fechou' | 'nao_fechou'
  >('todos');
  const [loading, setLoading] = useState(true);

  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null);
  const [showArchiveWarning, setShowArchiveWarning] = useState(false);
  const [archiveNoticeChecked, setArchiveNoticeChecked] = useState(false);
  const [dontShowArchiveWarning, setDontShowArchiveWarning] = useState(false);

  useEffect(() => {
    const pref = localStorage.getItem('skip_archive_warning');
    if (pref === '1') {
      setDontShowArchiveWarning(true);
    }
  }, []);

  const loadClients = async () => {
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
      .or('archived.is.null,archived.eq.false')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar clientes:', error);
      setClients([]);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((row) => mapRowToClient(row as DbClientRow));
    setClients(mapped);
    setLoading(false);
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const saveClient = async (client: Client): Promise<void> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert('Usuário não autenticado.');
      return;
    }

    const payload = {
      user_id: userData.user.id,
      nome: client.nome,
      telefone: client.telefone || null,
      email: client.email || null,
      cpf: client.cpf || null,
      aniversario: client.aniversario || null,
      sexo: client.sexo || null,
      estado_civil: client.estadoCivil || null,
      tem_filhos: client.temFilhos ?? false,
      quant_filhos: client.quantFilhos ?? 0,
      prazo: client.prazo || null,
      tipo_imovel: Array.isArray(client.tipoImovel)
        ? client.tipoImovel.join(', ')
        : client.tipoImovel || null,
      preco_min: client.precoMin ?? client.orcamentoMin ?? null,
      preco_max: client.precoMax ?? client.orcamentoMax ?? null,
      bairro: client.bairro || null,
      bairros_secundarios: client.bairrosSecundarios || null,
      tamanho: client.tamanho ?? null,
      quartos_min: client.quartosMin ?? null,
      suites_min: client.suitesMin ?? null,
      banheiros_min: client.banheirosMin ?? null,
      vagas_min: client.vagasMin ?? null,
      tipo_vaga: client.tipoVaga || null,
      condominio_max: client.condominioMax ?? null,
      pref_andar: client.prefAndar ?? false,
      andar_apartir: client.prefAndar ? (client.andarApartir ?? null) : null,
      novo: client.novo || 'indiferente',
      reformado: client.reformado || 'indiferente',
      aceita_financiamento: client.aceitaFinanciamento || 'indiferente',
      mobiliado: client.mobiliado || 'indiferente',
      varanda: client.varanda || 'indiferente',
      area_lazer: client.areaLazer || 'indiferente',
      aceita_pet: client.aceitaPet || 'indiferente',
      archived: client.archived ?? false,
      status_negocio: client.statusNegocio ?? 'em_andamento',
      observacoes: client.observacoes || null,
    };

    if (selected?.id) {
      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', selected.id)
        .eq('user_id', userData.user.id);

      if (error) {
        alert(`Erro ao atualizar cliente: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from('clients').insert(payload);

      if (error) {
        alert(`Erro ao criar cliente: ${error.message}`);
        return;
      }
    }

    setModal(null);
    setSelected(null);
    await loadClients();
  };

  const deleteClient = async (): Promise<void> => {
    if (!selected) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert('Usuário não autenticado.');
      return;
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', selected.id)
      .eq('user_id', userData.user.id);

    if (error) {
      alert(`Erro ao excluir cliente: ${error.message}`);
      return;
    }

    setModal(null);
    setSelected(null);
    await loadClients();
  };

  const executeArchiveFlow = async (client: Client): Promise<void> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert('Usuário não autenticado.');
      return;
    }

    if (client.archived) {
      const { error } = await supabase
        .from('clients')
        .update({ archived: false })
        .eq('id', client.id)
        .eq('user_id', userData.user.id);

      if (error) {
        alert(`Erro ao desarquivar cliente: ${error.message}`);
        return;
      }

      setShowArchiveWarning(false);
      setArchiveTarget(null);
      await loadClients();
      return;
    }

    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('id, fotos')
      .eq('client_id', client.id)
      .eq('user_id', userData.user.id);

    if (propertiesError) {
      alert(`Erro ao buscar imóveis do cliente: ${propertiesError.message}`);
      return;
    }

    const fotosParaApagar = (propertiesData || []).flatMap((property) =>
      Array.isArray(property.fotos) ? property.fotos : []
    );

    if (fotosParaApagar.length > 0) {
      try {
        await deletePhotos(fotosParaApagar);
      } catch (error) {
        console.error('Erro ao apagar fotos do storage:', error);
      }
    }

    const { error: updatePropsError } = await supabase
      .from('properties')
      .update({ fotos: [], archived: true })
      .eq('client_id', client.id)
      .eq('user_id', userData.user.id);

    if (updatePropsError) {
      alert(`Erro ao atualizar imóveis do cliente: ${updatePropsError.message}`);
      return;
    }

    const { error: updateClientError } = await supabase
      .from('clients')
      .update({ archived: true })
      .eq('id', client.id)
      .eq('user_id', userData.user.id);

    if (updateClientError) {
      alert(`Erro ao arquivar cliente: ${updateClientError.message}`);
      return;
    }

    setShowArchiveWarning(false);
    setArchiveTarget(null);
    await loadClients();
  };

  const handleArchiveClick = (client: Client): void => {
    setArchiveTarget(client);

    if (client.archived) {
      void executeArchiveFlow(client);
      return;
    }

    if (dontShowArchiveWarning) {
      void executeArchiveFlow(client);
      return;
    }

    setShowArchiveWarning(true);
  };

  const matchBuscaClient = (c: Client): boolean =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca);

  const matchStatusClient = (c: Client): boolean =>
    filtroStatus === 'todos' ? true : c.statusNegocio === filtroStatus;

  const ativosFiltrados = clients.filter(
    (c) => matchBuscaClient(c) && matchStatusClient(c)
  );

  const statusLabels = {
    todos: 'Todos',
    em_andamento: 'Em Andamento',
    fechou: 'Fechou ✅',
    nao_fechou: 'Não Fechou ❌',
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <p className="text-zinc-500">Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pt-12 lg:pt-0">
            <div>
              <h1 className="text-2xl font-black text-white">Clientes</h1>
              <p className="text-zinc-500 text-sm">
                {clients.length} cliente{clients.length !== 1 ? 's' : ''} ativo
                {clients.length !== 1 ? 's' : ''}
              </p>
            </div>

            <button
              onClick={() => {
                setSelected(null);
                setModal('new');
              }}
              className="flex items-center gap-2 bg-[#E50914] hover:bg-red-700 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-colors min-h-[44px]"
            >
              <Plus size={16} />
              Novo Cliente
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors text-sm"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors text-sm min-h-[44px]"
            >
              {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((k) => (
                <option key={k} value={k} className="bg-zinc-900">
                  {statusLabels[k]}
                </option>
              ))}
            </select>
          </div>

          {ativosFiltrados.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-600 text-lg">
                {busca || filtroStatus !== 'todos'
                  ? 'Nenhum cliente encontrado com esses filtros.'
                  : 'Nenhum cliente cadastrado ainda.'}
              </p>

              {!busca && filtroStatus === 'todos' && (
                <button
                  onClick={() => setModal('new')}
                  className="mt-4 text-red-400 hover:text-red-300 text-sm underline"
                >
                  Cadastrar primeiro cliente
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ativosFiltrados.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onView={(c) => router.push(`/clientes/${c.id}`)}
                  onDelete={(c) => {
                    setSelected(c);
                    setModal('delete');
                  }}
                  onArchive={(c) => {
                    void handleArchiveClick(c);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {(modal === 'new' || modal === 'edit') && (
        <ClientForm
          initial={modal === 'edit' && selected ? selected : undefined}
          onSave={saveClient}
          onCancel={() => {
            setModal(null);
            setSelected(null);
          }}
        />
      )}

      {modal === 'delete' && (
        <ConfirmModal
          title="Excluir Cliente"
          message={`Excluir ${selected?.nome} permanentemente?`}
          confirmLabel="Excluir"
          onConfirm={deleteClient}
          onCancel={() => {
            setModal(null);
            setSelected(null);
          }}
        />
      )}

      {showArchiveWarning && archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Arquivar cliente</h3>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Ao arquivar este cliente, os imóveis vinculados também serão arquivados.
              As fotos desses imóveis serão apagadas permanentemente.
            </p>

            <label className="mt-4 flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={archiveNoticeChecked}
                onChange={(e) => setArchiveNoticeChecked(e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              Não mostrar este aviso novamente
            </label>

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowArchiveWarning(false);
                  setArchiveTarget(null);
                }}
                className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>

              <button
                onClick={async () => {
                  if (!archiveTarget) return;

                  if (archiveNoticeChecked) {
                    localStorage.setItem('skip_archive_warning', '1');
                    setDontShowArchiveWarning(true);
                  }

                  await executeArchiveFlow(archiveTarget);
                }}
                className="px-4 py-3 rounded-2xl bg-[#E50914] text-white font-semibold hover:bg-red-700 transition-colors min-h-[44px]"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}