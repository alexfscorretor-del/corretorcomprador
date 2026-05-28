'use client';
import { Client } from '@/types';
import { Users, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Props { clients: Client[]; }

export default function DashboardStats({ clients }: Props) {
  const ativos = clients.filter(c => !c.archived);
  const total = ativos.length;
  const fecharam = ativos.filter(c => c.statusNegocio === 'fechou').length;
  const naoFecharam = ativos.filter(c => c.statusNegocio === 'nao_fechou').length;
  const emAndamento = ativos.filter(c => c.statusNegocio === 'em_andamento').length;
  const taxa = total > 0 ? ((fecharam / total) * 100).toFixed(1) : '0.0';

  const cards = [
    { label: 'Total de Clientes', value: total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Fecharam Negócio', value: fecharam, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Não Fecharam', value: naoFecharam, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Em Andamento', value: emAndamento, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-400">{label}</p>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Taxa de Conversão — destaque principal */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={20} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Taxa de Conversão</h3>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-black text-emerald-400">{taxa}%</span>
          <span className="text-zinc-400 mb-1 text-sm">
            {fecharam} de {total} clientes fecharam negócio
          </span>
        </div>
        {/* Barra de progresso */}
        <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${taxa}%` }}
          />
        </div>
      </div>

      {/* Mock Indicadores de Mercado */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
          Indicadores de Mercado <span className="text-zinc-600">(dados estáticos · integração API futura)</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500">Taxa Selic</p>
            <p className="text-2xl font-bold text-white">10,50% <span className="text-xs text-zinc-500">a.a.</span></p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Dólar (USD/BRL)</p>
            <p className="text-2xl font-bold text-white">R$ 5,10</p>
          </div>
        </div>
      </div>
    </div>
  );
}