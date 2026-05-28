export type BusinessStatus = 'fechou' | 'nao_fechou' | 'em_andamento';
export type TriState = 'sim' | 'nao' | 'indiferente';

export interface Property {
  // Identificação
  id: string;
  clientId: string;
  createdAt: string;

  // Informações básicas
  titulo: string;
  tipoImovel: string;
  preco: number;
  bairro: string;
  descricao?: string;

  // Características físicas
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

  // Mídia e referências
  link?: string;
  fotos?: string[];

  // Estado
  rating?: number;
  favorito?: boolean;
  status?: 'disponivel' | 'vendido' | 'alugado';
  observacoes?: string;

  // ✅ Adicionado em 16/05/2026
  anotacaoPrivada?: string;   // Nota privada do corretor (não aparece na página do cliente)
}

export interface Client {
  // Identificação
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

  // Preferências — Tipo
  tipoImovel?: string | string[];

  // Preferências — Preço
  precoMin?: number;
  precoMax?: number;
  orcamentoMin?: number;
  orcamentoMax?: number;

  // Preferências — Localização
  cidadeDesejada?: string;
  bairro?: string;
  bairrosSecundarios?: string;
  bairrosDesejados?: string[];

  // Preferências — Características
  tamanho?: number;
  quartosMin?: number;
  suitesMin?: number;
  banheirosMin?: number;
  vagasMin?: number;
  tipoVaga?: string;
  condominioMax?: number;
  prefAndar?: boolean;
  andarApartir?: number | null;

  // Preferências — Amenidades (TriState)
  novo?: TriState;
  reformado?: TriState;
  aceitaFinanciamento?: TriState;
  mobiliado?: TriState;
  varanda?: TriState;
  areaLazer?: TriState;
  aceitaPet?: TriState;

  // Relações
  properties?: Property[];

  // Estado
  statusNegocio: BusinessStatus;
  observacoes?: string;

  // ✅ Adicionado em 16/05/2026
  ultimoContato?: string;     // YYYY-MM-DD — data do último contato com o cliente
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