'use client';

import type { ChangeEvent } from 'react';
import {
  propertyInputClass as fi,
  propertyLabelClass as fl,
} from '@/components/forms/shared';

type Props = {
  titulo: string;
  setTitulo: (v: string) => void;
  tipoImovel: string;
  setTipoImovel: (v: string) => void;
  precoStr: string;
  onPrecoInput: (e: ChangeEvent<HTMLInputElement>) => void;
  bairro: string;
  setBairro: (v: string) => void;
  tamanho: string;
  setTamanho: (v: string) => void;
  link: string;
  setLink: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
};

export function BasicInfoSection(props: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={fl}>Título</label>
          <input
            value={props.titulo}
            onChange={(e) => props.setTitulo(e.target.value)}
            className={fi}
            placeholder="Ex: Apto 3Q Setor Bueno"
          />
        </div>

        <div>
          <label className={fl}>Tipo de imóvel</label>
          <select
            value={props.tipoImovel}
            onChange={(e) => props.setTipoImovel(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            {['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Terreno', 'Comercial'].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className={fl}>Preço (R$)</label>
          <input
            value={props.precoStr}
            onChange={props.onPrecoInput}
            className={fi}
            inputMode="numeric"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className={fl}>Bairro</label>
          <input
            value={props.bairro}
            onChange={(e) => props.setBairro(e.target.value)}
            className={fi}
          />
        </div>

        <div>
          <label className={fl}>Área (m²)</label>
          <input
            value={props.tamanho}
            onChange={(e) => props.setTamanho(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <label className={fl}>Link do anúncio</label>
        <input
          value={props.link}
          onChange={(e) => props.setLink(e.target.value)}
          className={fi}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className={fl}>Descrição completa</label>
        <textarea
          value={props.descricao}
          onChange={(e) => props.setDescricao(e.target.value)}
          className={fi + ' h-28'}
          placeholder="Descreva o imóvel..."
        />
      </div>
    </>
  );
}
