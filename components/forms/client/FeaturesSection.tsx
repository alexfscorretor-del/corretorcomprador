'use client';

import type { TriState } from '@/types';
import { labelClass, selectClass } from '@/components/forms/shared';
import type { ClientFormSet, ClientFormState } from './types';

const triLabel: Record<TriState, string> = {
  sim: 'Sim',
  nao: 'Não',
  indiferente: 'Indiferente',
};

const triOptions: TriState[] = ['sim', 'nao', 'indiferente'];

export function FeaturesSection({
  form,
  set,
}: {
  form: ClientFormState;
  set: ClientFormSet;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white mb-3 mt-2">
        Características
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['novo', 'reformado'] as const).map((campo) => (
          <div key={campo}>
            <label className={labelClass}>
              {campo === 'novo' ? 'Prédio Novo?' : 'Reformado?'}
            </label>
            <div className="flex gap-3">
              {triOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-1 text-white text-sm cursor-pointer"
                >
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
                <option key={o} value={o}>
                  {triLabel[o]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
