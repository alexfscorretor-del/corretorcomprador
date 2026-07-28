'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ClientCard from '@/components/ClientCard';
import ClientForm from '@/components/ClientForm';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import { Plus, Search } from 'lucide-react';
import * as clientsRepo from '@/repositories/clientsRepository';
import {
  saveClient as saveClientService,
  removeClient,
  archiveClientWithProperties,
  restoreClientWithProperties,
} from '@/services/clientService';
import { getErrorMessage } from '@/lib/errors';

type Modal = 'new' | 'edit' | 'delete' | null;

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
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.push('/login');
        return;
      }
      const mapped = await clientsRepo.listClients({ archived: false });
      setClients(mapped);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void loadClients();
  }, []);

  const saveClient = async (client: Client): Promise<void> => {
    try {
      await saveClientService(client, selected?.id);
      setModal(null);
      setSelected(null);
      await loadClients();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao salvar cliente.'));
    }
  };


  const deleteClient = async (): Promise<void> => {
    if (!selected) return;
    try {
      await removeClient(selected.id);
      setModal(null);
      setSelected(null);
      await loadClients();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao excluir cliente.'));
    }
  };


  const executeArchiveFlow = async (client: Client): Promise<void> => {
    try {
      if (client.archived) {
        await restoreClientWithProperties(client.id);
      } else {
        await archiveClientWithProperties(client.id);
      }
      setShowArchiveWarning(false);
      setArchiveTarget(null);
      setArchiveNoticeChecked(false);
      await loadClients();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao arquivar/desarquivar cliente.'));
    }
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