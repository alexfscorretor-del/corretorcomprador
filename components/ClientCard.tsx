'use client';
import { Client } from '@/types';
import { User, Phone, MapPin, Archive, Trash2, Eye, CheckCircle2, XCircle, Clock, MessageCircle, AlertCircle } from 'lucide-react';

interface Props {
  client: Client;
  onView: (client: Client) => void;
  onArchive?: (client: Client) => void;
  onDelete: (client: Client) => void;
  readonly?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  fechou:       { label: 'Fechou Negócio', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  nao_fechou:   { label: 'Não Fechou',     icon: XCircle,      color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  em_andamento: { label: 'Em Andamento',   icon: Clock,        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
};

const DIAS_ALERTA = 7;

function diasSemContato(ultimoContato?: string): number | null {
  if (!ultimoContato) return null;
  const diff = (new Date().getTime() - new Date(ultimoContato).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

function abrirWhatsApp(telefone: string, nome: string): void {
  const numero = telefone.replace(/\D/g, '');
  const msg = encodeURIComponent(
    `Olá ${nome}! 😊 Tenho novidades sobre os imóveis que selecionei para você. Podemos conversar?`
  );
  window.open(`https://wa.me/55${numero}?text=${msg}`, '_blank');
}

export default function ClientCard({ client, onView, onArchive, onDelete, readonly = false }: Props) {
  const status = statusConfig[client.statusNegocio] || statusConfig.em_andamento;
  const StatusIcon = status.icon;

  const dias = diasSemContato(client.ultimoContato);
  const semContatoRecente = dias === null || dias >= DIAS_ALERTA;
  const labelDias = dias === null ? 'Sem registro de contato' : `Último contato: ${dias}d atrás`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all group">

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <User size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{client.nome}</h3>
            <p className="text-xs text-zinc-500">{client.cpf}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      {/* Infos */}
      <div className="space-y-1 mb-3">
        <p className="text-xs text-zinc-400 flex items-center gap-2">
          <Phone size={12} className="text-zinc-600" /> {client.telefone}
        </p>
        <p className="text-xs text-zinc-400 flex items-center gap-2">
          <MapPin size={12} className="text-zinc-600" /> {client.cidadeDesejada || '—'}
        </p>
        <p className="text-xs text-zinc-500">
          Orçamento: R$ {Number(client.orcamentoMin ?? client.precoMin ?? 0).toLocaleString('pt-BR')} — R$ {Number(client.orcamentoMax ?? client.precoMax ?? 0).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Alerta de contato */}
      <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl mb-3 ${
        semContatoRecente
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : 'bg-zinc-800 text-zinc-400'
      }`}>
        {semContatoRecente
          ? <AlertCircle size={11} />
          : <Clock size={11} />
        }
        {labelDias}
      </div>

      {/* Botões */}
      {!readonly && (
        <div className="flex gap-2 border-t border-zinc-800 pt-3">
          <button
            onClick={() => onView(client)}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <Eye size={13} /> Ver
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => abrirWhatsApp(client.telefone, client.nome)}
            className="flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors"
            title="Abrir WhatsApp"
          >
            <MessageCircle size={13} /> WhatsApp
          </button>

          {onArchive && (
  <button
    onClick={() => onArchive(client)}
    className={`flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg border transition-colors ${
      client.archived
        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
        : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
    }`}
  >
    <Archive size={14} />
    {client.archived ? 'Desarquivar' : 'Arquivar'}
  </button>
)}

          <button
            onClick={() => onDelete(client)}
            className="flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}