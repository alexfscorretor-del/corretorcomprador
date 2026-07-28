'use client';

import { maskTelefone, maskCpf } from '@/lib/formatters';
import { inputClass, selectClass, labelClass } from '@/components/forms/shared';
import type { ClientFormSet, ClientFormState } from './types';

export function PersonalDataSection({
  form,
  set,
}: {
  form: ClientFormState;
  set: ClientFormSet;
}) {
  return (
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
          onChange={(e) => set('cpf', maskCpf(e.target.value))}
          className={inputClass}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
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
          type="date"
          value={form.prazo}
          onChange={(e) => set('prazo', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Sexo</label>
        <select
          value={form.sexo}
          onChange={(e) => set('sexo', e.target.value)}
          className={selectClass}
        >
          <option value="">Selecione</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Estado Civil</label>
        <select
          value={form.estadoCivil}
          onChange={(e) => set('estadoCivil', e.target.value)}
          className={selectClass}
        >
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
  );
}
