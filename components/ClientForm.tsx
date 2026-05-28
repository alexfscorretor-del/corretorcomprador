'use client';

import { useState } from 'react';
import { Client, BusinessStatus, TriState } from '@/types';

interface Props {
  initial?: Partial<Client>;
  onSave: (client: Client) => void | Promise<void>;
  onCancel: () => void;
}

type FormState = {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  aniversario: string;
  sexo: string;
  estadoCivil: string;
  temFilhos: boolean;
  quantFilhos: number;
  prazo: string;
  tipoImovel: string;
  precoMinStr: string;
  precoMaxStr: string;
  bairro: string;
  bairrosSecundarios: string;
  tamanho: number | '';
  quartosMin: number | '';
  suitesMin: number | '';
  banheirosMin: number | '';
  vagasMin: number | '';
  tipoVagaCobertura: string;
  tipoVagaModelo: string;
  condominioMaxStr: string;
  prefAndar: boolean;
  andarApartir: number | '';
  novo: TriState;
  reformado: TriState;
  aceitaFinanciamento: TriState;
  mobiliado: TriState;
  varanda: TriState;
  areaLazer: TriState;
  aceitaPet: TriState;
  statusNegocio: BusinessStatus;
  observacoes: string;
  archived: boolean;
};

function parseMoeda(val: string): number {
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatMoeda(num: number | undefined | null | ''): string {
  if (num === '' || num === undefined || num === null || num === 0) return '';
  return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function maskMoeda(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return (parseInt(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function maskTelefone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const triLabel: Record<TriState, string> = {
  sim: 'Sim',
  nao: 'Não',
  indiferente: 'Indiferente',
};

const triOptions: TriState[] = ['sim', 'nao', 'indiferente'];
const andares = Array.from({ length: 150 }, (_, i) => i + 1);

export default function ClientForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    nome: initial?.nome ?? '',
    telefone: initial?.telefone ?? '',
    email: initial?.email ?? '',
    cpf: initial?.cpf ?? '',
    aniversario: initial?.aniversario ?? '',
    sexo: initial?.sexo ?? '',
    estadoCivil: initial?.estadoCivil ?? '',
    temFilhos: initial?.temFilhos ?? false,
    quantFilhos: initial?.quantFilhos ?? 0,
    prazo: initial?.prazo ?? '',
    tipoImovel: Array.isArray(initial?.tipoImovel)
      ? initial?.tipoImovel[0] ?? ''
      : initial?.tipoImovel ?? '',
    precoMinStr: formatMoeda(initial?.precoMin ?? initial?.orcamentoMin),
    precoMaxStr: formatMoeda(initial?.precoMax ?? initial?.orcamentoMax),
    bairro: initial?.bairro ?? '',
    bairrosSecundarios: initial?.bairrosSecundarios ?? '',
    tamanho: initial?.tamanho ?? '',
    quartosMin: initial?.quartosMin ?? '',
    suitesMin: initial?.suitesMin ?? '',
    banheirosMin: initial?.banheirosMin ?? '',
    vagasMin: initial?.vagasMin ?? '',
    tipoVagaCobertura: initial?.tipoVaga?.split('|')[0] ?? '',
    tipoVagaModelo: initial?.tipoVaga?.split('|')[1] ?? '',
    condominioMaxStr: formatMoeda(initial?.condominioMax),
    prefAndar: initial?.prefAndar ?? false,
    andarApartir: initial?.andarApartir ?? '',
    novo: initial?.novo ?? 'indiferente',
    reformado: initial?.reformado ?? 'indiferente',
    aceitaFinanciamento: initial?.aceitaFinanciamento ?? 'indiferente',
    mobiliado: initial?.mobiliado ?? 'indiferente',
    varanda: initial?.varanda ?? 'indiferente',
    areaLazer: initial?.areaLazer ?? 'indiferente',
    aceitaPet: initial?.aceitaPet ?? 'indiferente',
    statusNegocio: initial?.statusNegocio ?? 'em_andamento',
    observacoes: initial?.observacoes ?? '',
    archived: initial?.archived ?? false,
  });

  const isEdit = !!initial?.id;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectClass =
    'w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-base outline-none text-white focus:border-emerald-400 transition-colors';
  const inputClass =
    'w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-base outline-none text-white placeholder-gray-500 focus:border-emerald-400 transition-colors';
  const labelClass = 'block text-xs uppercase tracking-wider text-gray-400 mb-1';

  const toNum = (value: number | '' | null | undefined): number | undefined => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  };

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      alert('Nome e Telefone são obrigatórios.');
      return;
    }

    const tipoVagaCombinado = [form.tipoVagaCobertura, form.tipoVagaModelo]
      .filter(Boolean)
      .join('|') || undefined;

    const client: Client = {
      id: initial?.id ?? crypto.randomUUID(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      cpf: form.cpf.trim(),
      aniversario: form.aniversario || undefined,
      sexo: form.sexo || undefined,
      estadoCivil: form.estadoCivil || undefined,
      temFilhos: form.temFilhos,
      quantFilhos: form.temFilhos ? form.quantFilhos : 0,
      prazo: form.prazo || undefined,
      tipoImovel: form.tipoImovel || undefined,
      precoMin: parseMoeda(form.precoMinStr) || undefined,
      precoMax: parseMoeda(form.precoMaxStr) || undefined,
      orcamentoMin: parseMoeda(form.precoMinStr) || undefined,
      orcamentoMax: parseMoeda(form.precoMaxStr) || undefined,
      bairro: form.bairro || undefined,
      bairrosSecundarios: form.bairrosSecundarios || undefined,
      tamanho: toNum(form.tamanho),
      quartosMin: toNum(form.quartosMin),
      suitesMin: toNum(form.suitesMin),
      banheirosMin: toNum(form.banheirosMin),
      vagasMin: toNum(form.vagasMin),
      tipoVaga: tipoVagaCombinado,
      condominioMax: parseMoeda(form.condominioMaxStr) || undefined,
      prefAndar: form.prefAndar,
      andarApartir: toNum(form.andarApartir) ?? null,
      novo: form.novo,
      reformado: form.reformado,
      aceitaFinanciamento: form.aceitaFinanciamento,
      mobiliado: form.mobiliado,
      varanda: form.varanda,
      areaLazer: form.areaLazer,
      aceitaPet: form.aceitaPet,
      statusNegocio: form.statusNegocio,
      observacoes: form.observacoes,
      archived: form.archived,
      properties: initial?.properties ?? [],
    };

    await onSave(client);
  };

  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {isEdit ? '✏️ Editar Cliente' : '👤 Novo Cliente'}
        </h2>
        <button onClick={onCancel} className="text-zinc-400 hover:text-white text-sm">
          Fechar
        </button>
      </div>

      {/* DADOS PESSOAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome completo *</label>
          <input
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            className={inputClass}
            placeholder="Ex: João da Silva"
          />
        </div>

        <div>
          <label className={labelClass}>Telefone *</label>
          <input
            value={form.telefone}
            onChange={(e) => set('telefone', maskTelefone(e.target.value))}
            className={inputClass}
            placeholder="(62) 99999-0000"
            inputMode="tel"
            maxLength={16}
          />
        </div>

        <div>
          <label className={labelClass}>E-mail</label>
          <input
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputClass}
            placeholder="email@exemplo.com"
            type="email"
          />
        </div>

        <div>
          <label className={labelClass}>CPF</label>
          <input
            value={form.cpf}
            onChange={(e) => set('cpf', e.target.value)}
            className={inputClass}
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label className={labelClass}>Data de Aniversário</label>
          <input
            type="date"
            value={form.aniversario}
            onChange={(e) => set('aniversario', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Prazo para Encontrar</label>
          <input
            value={form.prazo}
            onChange={(e) => set('prazo', e.target.value)}
            className={inputClass}
            placeholder="Ex: 3 meses"
          />
        </div>

        <div>
          <label className={labelClass}>Sexo</label>
          <select value={form.sexo} onChange={(e) => set('sexo', e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Estado Civil</label>
          <select value={form.estadoCivil} onChange={(e) => set('estadoCivil', e.target.value)} className={selectClass}>
            <option value="">Selecione</option>
            <option value="casado">Casado(a)</option>
            <option value="solteiro">Solteiro(a)</option>
            <option value="uniao_estavel">União Estável</option>
            <option value="divorciado">Divorciado(a)</option>
          </select>
        </div>

        <div className="flex items-center gap-4 md:col-span-2">
          <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.temFilhos}
              onChange={(e) => set('temFilhos', e.target.checked)}
              className="h-5 w-5 accent-red-600"
            />
            Tem filhos?
          </label>
          {form.temFilhos && (
            <input
              type="number"
              min={1}
              value={form.quantFilhos || ''}
              onChange={(e) => set('quantFilhos', Number(e.target.value || 0))}
              className={inputClass + ' max-w-[120px]'}
              placeholder="Qtd"
            />
          )}
        </div>
      </div>

      {/* IMÓVEL DESEJADO */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3 mt-2">🏠 Imóvel Desejado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelClass}>Tipo de Imóvel</label>
            <select value={form.tipoImovel} onChange={(e) => set('tipoImovel', e.target.value)} className={selectClass}>
              <option value="">Selecione</option>
              {['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Terreno', 'Comercial'].map((t) => (
                <option key={t} value={t.toLowerCase()}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Bairro Principal</label>
            <input value={form.bairro} onChange={(e) => set('bairro', e.target.value)} className={inputClass} placeholder="Ex: Setor Bueno" />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Bairros Secundários</label>
            <input value={form.bairrosSecundarios} onChange={(e) => set('bairrosSecundarios', e.target.value)} className={inputClass} placeholder="Separados por vírgula" />
          </div>

          <div>
            <label className={labelClass}>Preço Mínimo (R$)</label>
            <input
              value={form.precoMinStr}
              onChange={(e) => set('precoMinStr', maskMoeda(e.target.value))}
              className={inputClass}
              placeholder="0,00"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className={labelClass}>Preço Máximo (R$)</label>
            <input
              value={form.precoMaxStr}
              onChange={(e) => set('precoMaxStr', maskMoeda(e.target.value))}
              className={inputClass}
              placeholder="0,00"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className={labelClass}>Condomínio Máximo (R$)</label>
            <input
              value={form.condominioMaxStr}
              onChange={(e) => set('condominioMaxStr', maskMoeda(e.target.value))}
              className={inputClass}
              placeholder="0,00"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className={labelClass}>Tamanho Ideal (m²)</label>
            <input
              type="number"
              value={form.tamanho}
              onChange={(e) => set('tamanho', e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
              placeholder="Ex: 80"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className={labelClass}>Quartos Mínimos</label>
            <input type="number" min={0} value={form.quartosMin} onChange={(e) => set('quartosMin', e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} inputMode="numeric" />
          </div>

          <div>
            <label className={labelClass}>Suítes Mínimas</label>
            <input type="number" min={0} value={form.suitesMin} onChange={(e) => set('suitesMin', e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} inputMode="numeric" />
          </div>

          <div>
            <label className={labelClass}>Banheiros Mínimos</label>
            <input type="number" min={0} value={form.banheirosMin} onChange={(e) => set('banheirosMin', e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} inputMode="numeric" />
          </div>

          <div>
            <label className={labelClass}>Vagas Mínimas</label>
            <input type="number" min={0} value={form.vagasMin} onChange={(e) => set('vagasMin', e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} inputMode="numeric" />
          </div>

          {/* TIPO DE VAGA — 2 dimensões */}
          <div>
            <label className={labelClass}>Tipo de Vaga — Cobertura</label>
            <select value={form.tipoVagaCobertura} onChange={(e) => set('tipoVagaCobertura', e.target.value)} className={selectClass}>
              <option value="">Indiferente</option>
              <option value="coberta">Coberta</option>
              <option value="descoberta">Descoberta</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tipo de Vaga — Modelo</label>
            <select value={form.tipoVagaModelo} onChange={(e) => set('tipoVagaModelo', e.target.value)} className={selectClass}>
              <option value="">Indiferente</option>
              <option value="individual">Individual</option>
              <option value="paralela">Paralela</option>
            </select>
          </div>

          {/* ANDAR A PARTIR DE */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-white text-sm cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={form.prefAndar}
                onChange={(e) => set('prefAndar', e.target.checked)}
                className="h-5 w-5 accent-red-600"
              />
              Prefere andar a partir de
            </label>
            {form.prefAndar && (
              <select
                value={form.andarApartir}
                onChange={(e) => set('andarApartir', e.target.value === '' ? '' : Number(e.target.value))}
                className={selectClass}
              >
                <option value="">Selecione o andar</option>
                {andares.map((a) => (
                  <option key={a} value={a}>{a}º andar</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* CARACTERÍSTICAS */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3 mt-2">✅ Características</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Prédio Novo e Reformado como radio */}
          {(['novo', 'reformado'] as const).map((campo) => (
            <div key={campo}>
              <label className={labelClass}>{campo === 'novo' ? 'Prédio Novo?' : 'Reformado?'}</label>
              <div className="flex gap-3">
                {triOptions.map((option) => (
                  <label key={option} className="flex items-center gap-1 text-white text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={campo}
                      value={option}
                      checked={form[campo] === option}
                      onChange={() => set(campo, option)}
                      className="accent-red-600"
                    />
                    {triLabel[option]}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Demais como select */}
          {(
            [
              { key: 'aceitaFinanciamento', label: 'Aceita Financiamento?' },
              { key: 'mobiliado', label: 'Mobiliado?' },
              { key: 'varanda', label: 'Varanda/Sacada?' },
              { key: 'areaLazer', label: 'Área de Lazer?' },
              { key: 'aceitaPet', label: 'Aceita Pet?' },
            ] as const
          ).map((item) => (
            <div key={item.key}>
              <label className={labelClass}>{item.label}</label>
              <select
                value={form[item.key]}
                onChange={(e) => set(item.key, e.target.value as TriState)}
                className={selectClass}
              >
                {triOptions.map((o) => (
                  <option key={o} value={o}>{triLabel[o]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* STATUS E OBSERVAÇÕES */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className={labelClass}>Status do Negócio</label>
          <select
            value={form.statusNegocio}
            onChange={(e) => set('statusNegocio', e.target.value as BusinessStatus)}
            className={selectClass}
          >
            <option value="em_andamento">Em Andamento</option>
            <option value="fechou">Fechou Negócio ✅</option>
            <option value="nao_fechou">Não Fechou ❌</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            className={inputClass + ' h-24 resize-none'}
            placeholder="Anotações importantes sobre o cliente..."
          />
        </div>
      </div>

      {/* AÇÕES */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-3 rounded-2xl bg-[#E50914] hover:bg-red-700 text-white font-semibold transition-colors text-sm"
        >
          SALVAR
        </button>
      </div>
    </div>
  );
}