'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ClientCard from '@/components/ClientCard';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import * as clientsRepo from '@/repositories/clientsRepository';
import {
  restoreClientWithProperties,
  removeClient,
} from '@/services/clientService';
import { getErrorMessage } from '@/lib/errors';

export default function ArquivadosPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const loadArchivedClients = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.push('/login');
        return;
      }
      const mapped = await clientsRepo.listClients({ archived: true });
      setClients(mapped);
    } catch (err) {
      console.error(err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArchivedClients();
  }, []);

  const handleRestore = async (client: Client) => {
    try {
      await restoreClientWithProperties(client.id);
      await loadArchivedClients();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao desarquivar cliente.'));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await removeClient(toDelete.id);
      setToDelete(null);
      await loadArchivedClients();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao excluir cliente.'));
    }
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
              {clients.length} cliente{clients.length !== 1 ? 's' : ''} arquivado
              {clients.length !== 1 ? 's' : ''}
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
