'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PropertyCard from '@/components/PropertyCard';
import PropertyForm from '@/components/PropertyForm';
import ConfirmModal from '@/components/ConfirmModal';
import ClientForm from '@/components/ClientForm';
import { Client, Property, Broker } from '@/types';
import { calculateCompatibility } from '@/lib/compatibility';
import { generateClientCatalog } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import { mapRowToClient, type DbClientRow } from '@/lib/mappers';
import * as propertiesRepo from '@/repositories/propertiesRepository';
import * as brokersRepo from '@/repositories/brokersRepository';
import { saveProperty as savePropertyService, removeProperty } from '@/services/propertyService';
import {
  archiveClientWithProperties,
  restoreClientWithProperties,
} from '@/services/clientService';
import { updateClientRecord } from '@/repositories/clientsRepository';
import { getErrorMessage } from '@/lib/errors';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Link2,
  FileText,
  SlidersHorizontal,
  Star,
  Bell,
} from 'lucide-react';

type Modal =
  | 'editClient'
  | 'newProperty'
  | 'editProperty'
  | 'deleteProp'
  | 'archiveClient'
  | null;

type Ordenacao =
  | 'compatibilidade'
  | 'estrelas'
  | 'preco_asc'
  | 'preco_desc'
  | 'recentes';

function gerarPDF(client: Client, prop: Property, broker: Broker & { nomeExibicao?: string }): void {
  const cp = calculateCompatibility(client, prop);

  const brokerNome =
    (broker as any).nomeExibicao ||
    (broker as any).nome_exibicao ||
    broker.nome ||
    'Seu corretor';

  const brokerTelefone = (broker as any).telefone || '-';
  const brokerEmpresa = (broker as any).empresa || '';
  const brokerEmail = (broker as any).email || '';

  const specs: [string, string | number][] = [
    ['Tipo', prop.tipoImovel || '-'],
    ['Bairro', prop.bairro || '-'],
    ['Área', (prop.tamanho || '?') + 'm²'],
    ['Quartos', prop.quartos ?? '-'],
    ['Suítes', prop.suites ?? '-'],
    ['Banheiros', prop.banheiros ?? '-'],
    ['Vagas', prop.vagas ?? '-'],
    ['Andar', prop.andar ?? '-'],
    [
      'Condomínio',
      prop.condominio
        ? 'R$ ' + Number(prop.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '-',
    ],
    ['Prédio Novo', prop.predioNovo || '-'],
    ['Reformado', prop.reformado || '-'],
    ['Mobiliado', prop.mobiliado ? 'Sim' : 'Não'],
    ['Varanda', prop.varanda ? 'Sim' : 'Não'],
    ['Área Lazer', prop.areaLazer ? 'Sim' : 'Não'],
    ['Pet', prop.aceitaPet ? 'Sim' : 'Não'],
    ['Financiamento', prop.aceitaFinanciamento || '-'],
  ];

  const specsH = specs
    .map(([l, v]) => `<div class="si"><strong>${l}</strong>${v}</div>`)
    .join('');

  let photosH = '';
  if (prop.fotos?.length) {
    const rows: string[][] = [];
    for (let i = 0; i < prop.fotos.length; i += 3) {
      rows.push(prop.fotos.slice(i, i + 3));
    }
    photosH = rows
      .map(
        (row) =>
          `<div style="display:flex;gap:10px;margin:16px 0">${row
            .map(
              (f) =>
                `<img src="${f}" style="flex:1;max-width:32%;height:200px;object-fit:cover;border-radius:8px">`
            )
            .join('')}</div>`
      )
      .join('');
  }

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${prop.titulo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
<style>
body{font-family:Arial,sans-serif;margin:0;padding:36px;color:#111}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #e50914;padding-bottom:18px;margin-bottom:26px;gap:20px}
.hd-left{max-width:60%}
.eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#777;margin:0 0 8px 0}
.ht{margin:0;font-size:26px;color:#e50914;line-height:1.15}
.client-line{color:#666;margin:8px 0 0 0;font-size:14px}
.hd-right{text-align:right;min-width:220px}
.broker-label{font-size:10px;color:#777;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
.broker-name{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;font-style:italic;color:#e50914;line-height:1.05;margin-bottom:4px}
.broker-sub{font-size:12px;color:#666;margin-bottom:3px}
.broker-phone{font-size:13px;color:#444;font-weight:700;margin-bottom:10px}
.compat-box{display:inline-block;background:#fff5f5;border:1px solid #fecaca;border-radius:12px;padding:10px 14px}
.compat-num{font-size:28px;font-weight:700;color:#e50914;line-height:1}
.compat-label{font-size:10px;color:#999;text-transform:uppercase;margin-top:2px}
.prop-title{font-size:20px;margin-bottom:4px}
.price{font-size:28px;font-weight:700;color:#e50914;margin:14px 0}
.specs{background:#f8fafc;padding:18px;border-radius:8px;margin:20px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.si strong{display:block;font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px}
.desc{font-size:14px;line-height:1.6;border-left:4px solid #e50914;padding:16px;margin:20px 0;background:#fff8f8}
.assinatura{margin-top:28px;background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:16px}
.assinatura-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#777;margin-bottom:6px}
.assinatura-nome{font-family:'Cormorant Garamond',serif;font-size:26px;font-style:italic;font-weight:600;color:#e50914;line-height:1.1}
.assinatura-meta{font-size:13px;color:#444;margin-top:6px}
.ft{margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b}
@media print{body{padding:20px}}
</style>
</head><body>
<div class="hd">
  <div class="hd-left">
    <p class="eyebrow">Apresentação de imóvel</p>
    <h1 class="ht">${prop.titulo}</h1>
    <p class="client-line">Para: <strong>${client.nome}</strong></p>
  </div>

  <div class="hd-right">
    <div class="broker-label">Corretor responsável</div>
    <div class="broker-name">${brokerNome}</div>
    ${brokerEmpresa ? `<div class="broker-sub">${brokerEmpresa}</div>` : ''}
    ${brokerEmail ? `<div class="broker-sub">${brokerEmail}</div>` : ''}
    <div class="broker-phone">${brokerTelefone}</div>
    <div class="compat-box">
      <div class="compat-num">${cp}%</div>
      <div class="compat-label">Compatibilidade</div>
    </div>
  </div>
</div>

<div class="price">R$ ${Number(prop.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
<div class="specs">${specsH}</div>
${photosH}
${prop.descricao ? `<div class="desc">${prop.descricao}</div>` : ''}
${prop.link ? `<p style="margin:14px 0"><strong>Anúncio:</strong> <a href="${prop.link}" style="color:#e50914">${prop.link}</a></p>` : ''}

<div class="assinatura">
  <div class="assinatura-label">Atendimento</div>
  <div class="assinatura-nome">${brokerNome}</div>
  <div class="assinatura-meta">
    ${brokerTelefone !== '-' ? `Contato: ${brokerTelefone}` : 'Contato não informado'}
    ${brokerEmpresa ? ` &nbsp;|&nbsp; ${brokerEmpresa}` : ''}
  </div>
</div>

<div class="ft">
  <p>Documento gerado para apresentação do imóvel ao cliente.</p>
</div>

<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [broker, setBroker] = useState<Broker & { nomeExibicao?: string; empresa?: string; email?: string }>({
    id: '',
    nome: '',
    telefone: '',
    nomeExibicao: '',
    empresa: '',
    email: '',
  });
  const [modal, setModal] = useState<Modal>(null);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('compatibilidade');
  const [showOrdenacao, setShowOrdenacao] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState(false);
  const [ultimaGeracao, setUltimaGeracao] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArchiveWarning, setShowArchiveWarning] = useState(false);
  const [dontShowArchiveWarning, setDontShowArchiveWarning] = useState(false);
  const [archiveNoticeChecked, setArchiveNoticeChecked] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem(`catalog_gerado_${id}`);
    if (salvo) setUltimaGeracao(salvo);

    const pref = localStorage.getItem('skip_archive_warning');
    if (pref === '1') setDontShowArchiveWarning(true);
  }, [id]);

  useEffect(() => {
    const loadBroker = async () => {
      try {
        const data = await brokersRepo.getCurrentBroker();
        if (data) setBroker(data);
      } catch {
        /* ignore */
      }
    };
    void loadBroker();
  }, []);


  const carregarImoveisDoCliente = async (clientId: string, _userId?: string): Promise<Property[]> => {
    try {
      return await propertiesRepo.listPropertiesByClient(clientId);
    } catch (err) {
      console.error('Erro ao carregar imóveis:', err);
      return [];
    }
  };


  useEffect(() => {
    const loadClient = async () => {
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', userData.user.id)
        .single();

      if (error || !data) {
        console.error('Erro ao carregar cliente:', error);
        setClient(null);
        setLoading(false);
        return;
      }

      const clientBase = mapRowToClient(data as DbClientRow);
      const properties = await carregarImoveisDoCliente(id, userData.user.id);

      setClient({
        ...clientBase,
        properties,
      });

      setLoading(false);
    };

    if (id) {
      void loadClient();
    }
  }, [id, router]);

  useEffect(() => {
    const ratingsKey = `ratings_${id}`;

    const applyRatings = (): void => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(ratingsKey) || '{}'
        ) as Record<string, number>;

        if (Object.keys(saved).length === 0) return;

        setClient((prev) => {
          if (!prev) return prev;

          const temNova = (prev.properties || []).some((p) => {
            const nova = saved[p.id];
            return nova !== undefined && nova !== p.rating;
          });

          if (temNova) setNovaAvaliacao(true);

          return {
            ...prev,
            properties: (prev.properties || []).map((p) => {
              const newRating = saved[p.id];
              return newRating !== undefined ? { ...p, rating: newRating } : p;
            }),
          };
        });
      } catch {}
    };

    applyRatings();

    const handleStorage = (e: StorageEvent): void => {
      if (e.key === ratingsKey) applyRatings();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [id]);

  const recarregarImoveis = async (): Promise<void> => {
    if (!client) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert('Usuário não autenticado.');
      return;
    }

    const properties = await carregarImoveisDoCliente(client.id, userData.user.id);

    setClient((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        properties,
      };
    });
  };

  const recarregarClienteCompleto = async (): Promise<void> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert('Usuário não autenticado.');
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error || !data) {
      alert(`Erro ao recarregar cliente: ${error?.message || 'Não encontrado'}`);
      return;
    }

    const properties = await carregarImoveisDoCliente(id, userData.user.id);

    setClient({
      ...mapRowToClient(data as DbClientRow),
      properties,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <p className="text-zinc-500">Carregando cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <p className="text-zinc-500">
          Cliente não encontrado.{` `}
          <button onClick={() => router.push('/clientes')} className="text-red-400 underline">
            Voltar
          </button>
        </p>
      </div>
    );
  }

  const updateClient = async (updated: Client): Promise<void> => {
    try {
      const data = await updateClientRecord(updated.id, updated);
      setClient((prev) => ({
        ...data,
        properties: prev?.properties || [],
      }));
      setModal(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao atualizar cliente.'));
    }
  };


  const saveProperty = async (prop: Property): Promise<void> => {
    try {
      await savePropertyService({
        input: prop,
        clientId: client.id,
        existing: selectedProp,
      });
      await recarregarImoveis();
      setModal(null);
      setSelectedProp(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao salvar imóvel.'));
    }
  };


  const handleRating = async (prop: Property, rating: number): Promise<void> => {
    try {
      await propertiesRepo.updatePropertyRating(prop.id, rating);
      await recarregarImoveis();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao salvar avaliação.'));
    }
  };


  const deleteProperty = async (): Promise<void> => {
    if (!selectedProp) return;
    try {
      await removeProperty(selectedProp);
      await recarregarImoveis();
      setModal(null);
      setSelectedProp(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao excluir imóvel.'));
    }
  };


  const archiveClientAndProperties = async (): Promise<void> => {
    try {
      await archiveClientWithProperties(client.id);
      setShowArchiveWarning(false);
      await recarregarClienteCompleto();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao arquivar cliente.'));
    }
  };


  const restoreClientAndProperties = async (): Promise<void> => {
    try {
      await restoreClientWithProperties(client.id);
      await recarregarClienteCompleto();
    } catch (err) {
      alert(getErrorMessage(err, 'Erro ao desarquivar cliente.'));
    }
  };


  const handleArchiveRequest = (): void => {
    if (client.archived) {
      void restoreClientAndProperties();
      return;
    }

    if (dontShowArchiveWarning) {
      void archiveClientAndProperties();
      return;
    }

    setShowArchiveWarning(true);
  };

  const handleGerarCatalog = (): void => {
    generateClientCatalog(client, broker as Broker);
    const agora = new Date().toLocaleString('pt-BR');
    localStorage.setItem(`catalog_gerado_${id}`, agora);
    setUltimaGeracao(agora);
  };

  const propriedadesOrdenadas = [...(client.properties || [])].sort((a, b) => {
    switch (ordenacao) {
      case 'compatibilidade':
        return calculateCompatibility(client, b) - calculateCompatibility(client, a);
      case 'estrelas':
        return (b.rating || 0) - (a.rating || 0);
      case 'preco_asc':
        return (a.preco || 0) - (b.preco || 0);
      case 'preco_desc':
        return (b.preco || 0) - (a.preco || 0);
      case 'recentes':
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      default:
        return 0;
    }
  });

  const ordenacaoLabels: Record<Ordenacao, string> = {
    compatibilidade: '% Compatibilidade',
    estrelas: '⭐ Estrelas',
    preco_asc: 'Preço: Menor',
    preco_desc: 'Preço: Maior',
    recentes: 'Mais Recentes',
  };

  const tipoImovelStr = Array.isArray(client.tipoImovel)
    ? client.tipoImovel.join(', ')
    : client.tipoImovel || '-';

  const infoItems: [string, string | number][] = [
    ['Telefone', client.telefone],
    ['E-mail', client.email || '-'],
    ['CPF', client.cpf || '-'],
    ['Aniversário', client.aniversario || '-'],
    ['Sexo', client.sexo || '-'],
    ['Estado Civil', client.estadoCivil || '-'],
    ['Filhos', client.temFilhos ? `${client.quantFilhos} filho(s)` : 'Não'],
    [
      'Prazo',
      client.prazo
        ? new Date(client.prazo + 'T12:00:00').toLocaleDateString('pt-BR')
        : '-',
    ],
    ['Tipo de Imóvel', tipoImovelStr],
    [
      'Preço Mín.',
      client.precoMin
        ? 'R$ ' + Number(client.precoMin).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '-',
    ],
    [
      'Preço Máx.',
      client.precoMax
        ? 'R$ ' + Number(client.precoMax).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '-',
    ],
    ['Bairro', client.bairro || '-'],
    ['Bairros Sec.', client.bairrosSecundarios || '-'],
    ['Tamanho Ideal', client.tamanho ? client.tamanho + 'm²' : '-'],
    ['Quartos Mín.', client.quartosMin ?? '-'],
    ['Suítes Mín.', client.suitesMin ?? '-'],
    ['Banheiros Mín.', client.banheirosMin ?? '-'],
    ['Vagas Mín.', `${client.vagasMin ?? '-'} (${client.tipoVaga || '-'})`],
    ['Andar', client.prefAndar ? `A partir do ${client.andarApartir ?? ''}º` : 'Indiferente'],
    ['Prédio Novo', client.novo || '-'],
    ['Reformado', client.reformado || '-'],
    [
      'Cond. Máx.',
      client.condominioMax
        ? 'R$ ' + Number(client.condominioMax).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '-',
    ],
    ['Financiamento', client.aceitaFinanciamento || '-'],
    ['Mobiliado', client.mobiliado || '-'],
    ['Varanda', client.varanda || '-'],
    ['Área Lazer', client.areaLazer || '-'],
    ['Pet', client.aceitaPet || '-'],
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6 pt-12 lg:pt-0">
            <button
              onClick={() => router.push('/clientes')}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-white truncate">
                {client.nome}
              </h1>
              <p className="text-red-400 text-sm">{client.telefone}</p>
            </div>

            {novaAvaliacao && (
              <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs px-3 py-2 rounded-2xl">
                <Bell size={13} />
                <span className="hidden sm:inline">Cliente avaliou!</span>
                <Star size={13} />
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 mb-8">
            <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
              <h2 className="text-lg md:text-xl font-semibold text-white">Perfil completo</h2>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setModal('editClient')}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl text-sm font-medium text-white transition-colors min-h-[44px]"
                >
                  <Pencil size={15} />
                  Editar
                </button>

                <button
                  onClick={handleArchiveRequest}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors min-h-[44px] ${
                    client.archived
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                  }`}
                >
                  {client.archived ? 'Desarquivar cliente' : 'Arquivar cliente'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
              {infoItems.map(([label, val]) => (
                <div key={label}>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">
                    {label}
                  </span>
                  <p className="font-medium text-white mt-0.5 break-words">{val}</p>
                </div>
              ))}
            </div>

            {client.observacoes && (
              <div className="mt-4 p-4 bg-white/5 rounded-2xl text-sm">
                <span className="text-gray-400">Observações: </span>
                <span className="text-white">{client.observacoes}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <h3 className="text-lg md:text-xl font-semibold text-white">
              Imóveis encontrados ({client.properties?.length || 0})
            </h3>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleGerarCatalog}
                className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-2xl text-sm font-semibold hover:bg-zinc-200 transition-colors min-h-[44px]"
              >
                <Link2 size={15} />
                <span className="hidden sm:inline">Gerar Página</span>
                <span className="sm:hidden">Página</span>
              </button>

              <button
                onClick={() => {
                  setSelectedProp(null);
                  setModal('newProperty');
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-[#E50914] to-red-700 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-colors min-h-[44px]"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Adicionar Imóvel</span>
                <span className="sm:hidden">Imóvel</span>
              </button>
            </div>
          </div>

          {(client.properties?.length || 0) > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <p className="text-xs text-zinc-500">
                {ultimaGeracao
                  ? `📤 Página gerada em: ${ultimaGeracao}`
                  : '📤 Página ainda não foi gerada para este cliente'}
              </p>

              <div className="relative">
                <button
                  onClick={() => setShowOrdenacao((v) => !v)}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-2xl text-xs font-medium transition-colors min-h-[44px]"
                >
                  <SlidersHorizontal size={13} />
                  {ordenacaoLabels[ordenacao]}
                </button>

                {showOrdenacao && (
                  <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden z-20 shadow-xl min-w-[180px]">
                    {(Object.keys(ordenacaoLabels) as Ordenacao[]).map((op) => (
                      <button
                        key={op}
                        onClick={() => {
                          setOrdenacao(op);
                          setShowOrdenacao(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors min-h-[44px] ${
                          ordenacao === op
                            ? 'bg-red-500/20 text-red-400'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {ordenacaoLabels[op]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {propriedadesOrdenadas.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <p className="text-lg">Nenhum imóvel cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {propriedadesOrdenadas.map((prop) => (
                <div key={prop.id}>
                  <PropertyCard
                    property={prop}
                    compatibility={calculateCompatibility(client, prop)}
                    onEdit={(p) => {
                      setSelectedProp(p);
                      setModal('editProperty');
                    }}
                    onDelete={(p) => {
                      setSelectedProp(p);
                      setModal('deleteProp');
                    }}
                    onRating={(property, rating) => {
                      void handleRating(property, rating);
                    }}
                  />

                  <button
                    onClick={() => gerarPDF(client, prop, broker)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors min-h-[44px]"
                  >
                    <FileText size={14} /> Gerar PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modal === 'editClient' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="p-6 md:p-8">
              <ClientForm
                initial={client}
                onSave={async (c) => {
                  await updateClient(c);
                }}
                onCancel={() => setModal(null)}
              />
            </div>
          </div>
        </div>
      )}

      {(modal === 'newProperty' || (modal === 'editProperty' && selectedProp)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="p-6 md:p-8">
              <PropertyForm
                clientId={client.id}
                initial={modal === 'editProperty' ? selectedProp ?? undefined : undefined}
                onSave={async (p) => {
                  await saveProperty(p);
                }}
                onCancel={() => {
                  setModal(null);
                  setSelectedProp(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {modal === 'deleteProp' && (
        <ConfirmModal
          title="Excluir Imóvel"
          message="Excluir este imóvel definitivamente?"
          confirmLabel="Excluir"
          onConfirm={async () => {
            await deleteProperty();
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {showArchiveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Arquivar cliente</h3>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Ao arquivar este cliente, os imóveis vinculados também serão arquivados.
              As fotos desses imóveis serão apagadas permanentemente para economizar armazenamento.
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
                onClick={() => setShowArchiveWarning(false)}
                className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (archiveNoticeChecked) {
                    localStorage.setItem('skip_archive_warning', '1');
                    setDontShowArchiveWarning(true);
                  }
                  await archiveClientAndProperties();
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