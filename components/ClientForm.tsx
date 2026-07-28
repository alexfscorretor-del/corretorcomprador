'use client';

import { useState } from 'react';
import type { Client } from '@/types';
import { formatMoeda } from '@/lib/formatters';
import { parseMoeda, parseOptionalNumber } from '@/lib/parsers';
import { validateClientInput } from '@/services/clientService';
import { getErrorMessage } from '@/lib/errors';
import { PersonalDataSection } from '@/components/forms/client/PersonalDataSection';
import { PreferencesSection } from '@/components/forms/client/PreferencesSection';
import { FeaturesSection } from '@/components/forms/client/FeaturesSection';
import { StatusSection } from '@/components/forms/client/StatusSection';
import type { ClientFormState } from '@/components/forms/client/types';

interface Props {
  initial?: Partial<Client>;
  onSave: (client: Client) => void | Promise<void>;
  onCancel: () => void;
}

function buildInitial(initial?: Partial<Client>): ClientFormState {
  return {
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
  };
}

export default function ClientForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ClientFormState>(() => buildInitial(initial));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  const set = <K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      const tipoVagaCombinado =
        [form.tipoVagaCobertura, form.tipoVagaModelo].filter(Boolean).join('|') ||
        undefined;

      const draft = {
        id: initial?.id,
        createdAt: initial?.createdAt,
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
        tamanho: parseOptionalNumber(form.tamanho),
        quartosMin: parseOptionalNumber(form.quartosMin),
        suitesMin: parseOptionalNumber(form.suitesMin),
        banheirosMin: parseOptionalNumber(form.banheirosMin),
        vagasMin: parseOptionalNumber(form.vagasMin),
        tipoVaga: tipoVagaCombinado,
        condominioMax: parseMoeda(form.condominioMaxStr) || undefined,
        prefAndar: form.prefAndar,
        andarApartir: parseOptionalNumber(form.andarApartir) ?? null,
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
      };

      const client = validateClientInput(draft);
      client.properties = initial?.properties ?? [];
      await onSave(client);
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível validar o cliente.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 hover:text-white text-sm"
        >
          Fechar
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      ) : null}

      <PersonalDataSection form={form} set={set} />
      <PreferencesSection form={form} set={set} />
      <FeaturesSection form={form} set={set} />
      <StatusSection form={form} set={set} />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="flex-1 py-3 rounded-2xl bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-semibold transition-colors text-sm"
        >
          {saving ? 'Validando...' : 'SALVAR'}
        </button>
      </div>
    </div>
  );
}
