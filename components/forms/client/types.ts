import type { BusinessStatus, TriState } from '@/types';

export type ClientFormState = {
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

export type ClientFormSet = <K extends keyof ClientFormState>(
  key: K,
  value: ClientFormState[K]
) => void;
