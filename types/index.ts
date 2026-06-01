export interface Property {
  id: string;
  titulo: string;
  bairro?: string;
  preco: number;
  tipoImovel?: string;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  tamanho?: number;
  andar?: number;
  condominio?: number;
  predioNovo?: string;
  reformado?: string;
  mobiliado?: boolean;
  varanda?: boolean;
  areaLazer?: boolean;
  aceitaPet?: boolean;
  aceitaFinanciamento?: string;
  descricao?: string;
  fotos?: string[];
  link?: string;
  rating?: number;
}

export interface Client {
  id: string;
  nome: string;
  bairrosPreferidos?: string[];
  tipoImovel?: string;
  quartos?: number;
  suites?: number;
  vagas?: number;
  tamanhoMin?: number;
  tamanhoMax?: number;
  precoMin?: number;
  precoMax?: number;
  mobiliado?: boolean;
  varanda?: boolean;
  areaLazer?: boolean;
  aceitaPet?: boolean;
  aceitaFinanciamento?: string;
  predioNovo?: string;
  properties?: Property[];
}

export interface Broker {
  id: string;
  user_id?: string;
  nome: string;
  nomeExibicao?: string;
  nome_exibicao?: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  creci?: string;
  ativo?: boolean;
  plano?: string;
}
