'use client';

import type { BusinessStatus } from '@/types';
import { inputClass, selectClass, labelClass } from '@/components/forms/shared';
import type { ClientFormSet, ClientFormState } from './types';

export function StatusSection({
  form,
  set,
}: {
  form: ClientFormState;
  set: ClientFormSet;
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <label className={labelClass}>Status do Negócio</label>
        <select
          value={form.statusNegocio}
          onChange={(e) =>
            set('statusNegocio', e.target.value as BusinessStatus)
          }
          className={selectClass}
        >
          <option value="em_andamento">Em Andamento</option>
          <option value="fechou">Fechou Negócio</option>
          <option value="nao_fechou">Não Fechou</option>
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
  );
}
