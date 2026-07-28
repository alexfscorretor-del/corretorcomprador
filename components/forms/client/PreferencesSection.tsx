'use client';

import { maskMoeda } from '@/lib/formatters';
import { inputClass, selectClass, labelClass } from '@/components/forms/shared';
import type { ClientFormSet, ClientFormState } from './types';

const andares = Array.from({ length: 150 }, (_, i) => i + 1);

export function PreferencesSection({
  form,
  set,
}: {
  form: ClientFormState;
  set: ClientFormSet;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white mb-3 mt-2">
        Imóvel Desejado
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tipo de Imóvel</label>
          <select
            value={form.tipoImovel}
            onChange={(e) => set('tipoImovel', e.target.value)}
            className={selectClass}
          >
            <option value="">Selecione</option>
            {['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Terreno', 'Comercial'].map(
              (t) => (
                <option key={t} value={t.toLowerCase()}>
                  {t}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className={labelClass}>Bairro Principal</label>
          <input
            value={form.bairro}
            onChange={(e) => set('bairro', e.target.value)}
            className={inputClass}
            placeholder="Ex: Setor Bueno"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Bairros Secundários</label>
          <input
            value={form.bairrosSecundarios}
            onChange={(e) => set('bairrosSecundarios', e.target.value)}
            className={inputClass}
            placeholder="Separados por vírgula"
          />
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
            onChange={(e) =>
              set('tamanho', e.target.value === '' ? '' : Number(e.target.value))
            }
            className={inputClass}
            placeholder="Ex: 80"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={labelClass}>Quartos Mínimos</label>
          <input
            type="number"
            min={0}
            value={form.quartosMin}
            onChange={(e) =>
              set('quartosMin', e.target.value === '' ? '' : Number(e.target.value))
            }
            className={inputClass}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={labelClass}>Suítes Mínimas</label>
          <input
            type="number"
            min={0}
            value={form.suitesMin}
            onChange={(e) =>
              set('suitesMin', e.target.value === '' ? '' : Number(e.target.value))
            }
            className={inputClass}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={labelClass}>Banheiros Mínimos</label>
          <input
            type="number"
            min={0}
            value={form.banheirosMin}
            onChange={(e) =>
              set(
                'banheirosMin',
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            className={inputClass}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={labelClass}>Vagas Mínimas</label>
          <input
            type="number"
            min={0}
            value={form.vagasMin}
            onChange={(e) =>
              set('vagasMin', e.target.value === '' ? '' : Number(e.target.value))
            }
            className={inputClass}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={labelClass}>Tipo de Vaga — Cobertura</label>
          <select
            value={form.tipoVagaCobertura}
            onChange={(e) => set('tipoVagaCobertura', e.target.value)}
            className={selectClass}
          >
            <option value="">Indiferente</option>
            <option value="coberta">Coberta</option>
            <option value="descoberta">Descoberta</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Tipo de Vaga</label>
          <select
            value={form.tipoVagaModelo}
            onChange={(e) => set('tipoVagaModelo', e.target.value)}
            className={selectClass}
          >
            <option value="">Indiferente</option>
            <option value="individual">Individual</option>
            <option value="gaveta">Gaveta</option>
          </select>
        </div>

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
              onChange={(e) =>
                set(
                  'andarApartir',
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className={selectClass}
            >
              <option value="">Selecione o andar</option>
              {andares.map((a) => (
                <option key={a} value={a}>
                  {a}º andar
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
