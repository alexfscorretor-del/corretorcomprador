'use client';

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import {
  propertyInputClass as fi,
  propertyLabelClass as fl,
} from '@/components/forms/shared';

type Props = {
  quartos: string;
  setQuartos: (v: string) => void;
  suites: string;
  setSuites: (v: string) => void;
  banheiros: string;
  setBanheiros: (v: string) => void;
  vagas: string;
  setVagas: (v: string) => void;
  tipoVagaCobertura: string;
  setTipoVagaCobertura: (v: string) => void;
  tipoVagaModelo: string;
  setTipoVagaModelo: (v: string) => void;
  andar: string;
  setAndar: (v: string) => void;
  condominioStr: string;
  onCondInput: (e: ChangeEvent<HTMLInputElement>) => void;
  predioNovo: string;
  setPredioNovo: (v: string) => void;
  reformado: string;
  setReformado: (v: string) => void;
  aceitaFinanciamento: string;
  setAceitaFinanciamento: (v: string) => void;
  mobiliado: boolean;
  setMobiliado: Dispatch<SetStateAction<boolean>>;
  varanda: boolean;
  setVaranda: Dispatch<SetStateAction<boolean>>;
  areaLazer: boolean;
  setAreaLazer: Dispatch<SetStateAction<boolean>>;
  aceitaPet: boolean;
  setAceitaPet: Dispatch<SetStateAction<boolean>>;
};

export function FeaturesSection(p: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={fl}>Quartos</label>
          <input
            value={p.quartos}
            onChange={(e) => p.setQuartos(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={fl}>Suítes</label>
          <input
            value={p.suites}
            onChange={(e) => p.setSuites(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={fl}>Banheiros</label>
          <input
            value={p.banheiros}
            onChange={(e) => p.setBanheiros(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={fl}>Vagas</label>
          <input
            value={p.vagas}
            onChange={(e) => p.setVagas(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={fl}>Tipo de Vaga — Cobertura</label>
          <select
            value={p.tipoVagaCobertura}
            onChange={(e) => p.setTipoVagaCobertura(e.target.value)}
            className={fi}
          >
            <option value="">Indiferente</option>
            <option value="coberta">Coberta</option>
            <option value="descoberta">Descoberta</option>
          </select>
        </div>
        <div>
          <label className={fl}>Tipo de Vaga — Modelo</label>
          <select
            value={p.tipoVagaModelo}
            onChange={(e) => p.setTipoVagaModelo(e.target.value)}
            className={fi}
          >
            <option value="">Indiferente</option>
            <option value="individual">Individual</option>
            <option value="gaveta">Gaveta</option>
          </select>
        </div>
        <div>
          <label className={fl}>Andar</label>
          <input
            value={p.andar}
            onChange={(e) => p.setAndar(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={fl}>Condomínio (R$/mês)</label>
          <input
            value={p.condominioStr}
            onChange={p.onCondInput}
            className={fi}
            inputMode="numeric"
            placeholder="0,00"
          />
        </div>
        <div>
          <label className={fl}>Prédio novo?</label>
          <select
            value={p.predioNovo}
            onChange={(e) => p.setPredioNovo(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
        <div>
          <label className={fl}>Reformado?</label>
          <select
            value={p.reformado}
            onChange={(e) => p.setReformado(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
        <div>
          <label className={fl}>Financiamento?</label>
          <select
            value={p.aceitaFinanciamento}
            onChange={(e) => p.setAceitaFinanciamento(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(
          [
            ['mobiliado', 'Mobiliado', p.mobiliado, p.setMobiliado],
            ['varanda', 'Varanda/Sacada', p.varanda, p.setVaranda],
            ['areaLazer', 'Área de Lazer', p.areaLazer, p.setAreaLazer],
            ['aceitaPet', 'Aceita Pet', p.aceitaPet, p.setAceitaPet],
          ] as const
        ).map(([key, label, val, setter]) => (
          <label
            key={key}
            className="flex items-center gap-3 text-white bg-white/5 border border-white/10 rounded-2xl px-4 py-3 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => setter(e.target.checked)}
              className="w-5 h-5 accent-red-600"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </>
  );
}
