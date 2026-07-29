export type BusinessStatus = 'fechou' | 'nao_fechou' | 'em_andamento';
export type TriState = 'sim' | 'nao' | 'indiferente';

export interface Property {
  // Identificacao
  id: string;
  clientId: string;
  createdAt: string;

  // Informacoes basicas
  titulo: string;
  tipoImovel: string;
  preco: number;
  bairro: string;
  descricao?: string;

  // Caracteristicas fisicas
  tamanho?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  andar?: number | null;

  // Tipos de vaga
  tipoVaga?: string;
  tipoVagaCobertura?: 'coberta' | 'descoberta' | '';
  tipoVagaModelo?: 'individual' | 'gaveta' | '';

  // Amenidades
  condominio?: number | null;
  predioNovo?: 'sim' | 'nao' | '';
  reformado?: 'sim' | 'nao' | '';
  aceitaFinanciamento?: 'sim' | 'nao' | '';
  mobiliado?: boolean;
  varanda?: boolean;
  areaLazer?: boolean;
  aceitaPet?: boolean;

  // Midia e referencias
  link?: string;
  fotos?: string[];

  // Estado
  rating?: number;
  favorito?: boolean;
  status?: 'disponivel' | 'vendido' | 'alugado';
  observacoes?: string;

  // Adicionado em 16/05/2026
  anotacaoPrivada?: string;
}

export interface Client {
  // Identificacao
  id: string;
  createdAt: string;
  archived: boolean;

  // Dados pessoais
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  aniversario?: string;
  sexo?: string;
  estadoCivil?: string;
  temFilhos?: boolean;
  quantFilhos?: number;
  prazo?: string;

  // Preferencias - Tipo
  tipoImovel?: string | string[];

  // Preferencias - Preco
  precoMin?: number;
  precoMax?: number;
  orcamentoMin?: number;
  orcamentoMax?: number;

  // Preferencias - Localizacao
  cidadeDesejada?: string;
  bairro?: string;
  bairrosSecundarios?: string;
  bairrosDesejados?: string[];

  // Preferencias - Caracteristicas
  tamanho?: number;
  quartosMin?: number;
  suitesMin?: number;
  banheirosMin?: number;
  vagasMin?: number;
  tipoVaga?: string;
  condominioMax?: number;
  prefAndar?: boolean;
  andarApartir?: number | null;

  // Preferencias - Amenidades (TriState)
  novo?: TriState;
  reformado?: TriState;
  aceitaFinanciamento?: TriState;
  mobiliado?: TriState;
  varanda?: TriState;
  areaLazer?: TriState;
  aceitaPet?: TriState;

  // Relacoes
  properties?: Property[];

  // Estado
  statusNegocio: BusinessStatus;
  observacoes?: string;

  // Adicionado em 16/05/2026
  ultimoContato?: string;
}

export interface Broker {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  empresa?: string;
  creci?: string;
  ativo?: boolean;
}
