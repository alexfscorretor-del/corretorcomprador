import type { Client, Property, Broker, BusinessStatus, TriState } from '@/types';

export type DbClientRow = {
  id: string;
  user_id: string;
  created_at: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  aniversario: string | null;
  sexo: string | null;
  estado_civil: string | null;
  tem_filhos: boolean | null;
  quant_filhos: number | null;
  prazo: string | null;
  tipo_imovel: string | null;
  preco_min: number | null;
  preco_max: number | null;
  bairro: string | null;
  bairros_secundarios: string | null;
  tamanho: number | null;
  quartos_min: number | null;
  suites_min: number | null;
  banheiros_min: number | null;
  vagas_min: number | null;
  tipo_vaga: string | null;
  condominio_max: number | null;
  pref_andar: boolean | null;
  andar_apartir: number | null;
  novo: string | null;
  reformado: string | null;
  aceita_financiamento: string | null;
  mobiliado: string | null;
  varanda: string | null;
  area_lazer: string | null;
  aceita_pet: string | null;
  archived: boolean | null;
  status_negocio: string | null;
  observacoes: string | null;
};

export type DbPropertyRow = {
  id: string;
  created_at: string;
  client_id: string;
  titulo: string;
  endereco: string | null;
  preco: number | null;
  area: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  tipo_imovel: string | null;
  tipo_vaga_cobertura: string | null;
  tipo_vaga_modelo: string | null;
  andar: number | null;
  condominio: number | null;
  predio_novo: string | null;
  reformado: string | null;
  mobiliado: boolean | null;
  varanda: boolean | null;
  area_lazer: boolean | null;
  aceita_pet: boolean | null;
  aceita_financiamento: string | null;
  bairro: string | null;
  descricao: string | null;
  favorito: boolean | null;
  avaliacao: number | null;
  fotos: string[] | null;
  user_id: string;
  archived?: boolean | null;
};

export type DbBrokerRow = {
  id: string;
  user_id: string;
  nome: string | null;
  nome_exibicao: string | null;
  telefone: string | null;
  email: string | null;
  empresa: string | null;
  creci: string | null;
};

function asTriState(v: string | null | undefined): TriState {
  if (v === 'sim' || v === 'nao' || v === 'indiferente') return v;
  return 'indiferente';
}

function asBusinessStatus(v: string | null | undefined): BusinessStatus {
  if (v === 'fechou' || v === 'nao_fechou' || v === 'em_andamento') return v;
  return 'em_andamento';
}

export function mapRowToClient(row: DbClientRow): Client {
  return {
    id: row.id,
    createdAt: row.created_at,
    nome: row.nome ?? '',
    telefone: row.telefone ?? '',
    email: row.email ?? '',
    cpf: row.cpf ?? '',
    aniversario: row.aniversario ?? '',
    sexo: row.sexo ?? '',
    estadoCivil: row.estado_civil ?? '',
    temFilhos: row.tem_filhos ?? false,
    quantFilhos: row.quant_filhos ?? 0,
    prazo: row.prazo ?? '',
    tipoImovel: row.tipo_imovel ?? '',
    precoMin: row.preco_min ?? undefined,
    precoMax: row.preco_max ?? undefined,
    orcamentoMin: row.preco_min ?? undefined,
    orcamentoMax: row.preco_max ?? undefined,
    bairro: row.bairro ?? '',
    bairrosSecundarios: row.bairros_secundarios ?? '',
    tamanho: row.tamanho ?? undefined,
    quartosMin: row.quartos_min ?? undefined,
    suitesMin: row.suites_min ?? undefined,
    banheirosMin: row.banheiros_min ?? undefined,
    vagasMin: row.vagas_min ?? undefined,
    tipoVaga: row.tipo_vaga ?? '',
    condominioMax: row.condominio_max ?? undefined,
    prefAndar: row.pref_andar ?? false,
    andarApartir: row.andar_apartir ?? null,
    novo: asTriState(row.novo),
    reformado: asTriState(row.reformado),
    aceitaFinanciamento: asTriState(row.aceita_financiamento),
    mobiliado: asTriState(row.mobiliado),
    varanda: asTriState(row.varanda),
    areaLazer: asTriState(row.area_lazer),
    aceitaPet: asTriState(row.aceita_pet),
    archived: row.archived === true,
    statusNegocio: asBusinessStatus(row.status_negocio),
    observacoes: row.observacoes ?? '',
    properties: [],
  };
}

export function mapRowToProperty(row: DbPropertyRow): Property {
  return {
    id: row.id,
    clientId: row.client_id,
    createdAt: row.created_at,
    titulo: row.titulo ?? '',
    tipoImovel: row.tipo_imovel ?? '',
    preco: Number(row.preco ?? 0),
    bairro: row.bairro ?? '',
    tamanho: row.area ?? undefined,
    quartos: row.quartos ?? undefined,
    suites: row.suites ?? undefined,
    banheiros: row.banheiros ?? undefined,
    vagas: row.vagas ?? undefined,
    tipoVagaCobertura:
      (row.tipo_vaga_cobertura as Property['tipoVagaCobertura']) ?? '',
    tipoVagaModelo: (row.tipo_vaga_modelo as Property['tipoVagaModelo']) ?? '',
    andar: row.andar ?? null,
    condominio: row.condominio ?? null,
    predioNovo: (row.predio_novo as Property['predioNovo']) ?? '',
    reformado: (row.reformado as Property['reformado']) ?? '',
    aceitaFinanciamento:
      (row.aceita_financiamento as Property['aceitaFinanciamento']) ?? '',
    mobiliado: row.mobiliado ?? false,
    varanda: row.varanda ?? false,
    areaLazer: row.area_lazer ?? false,
    aceitaPet: row.aceita_pet ?? false,
    descricao: row.descricao ?? '',
    favorito: row.favorito ?? false,
    rating: row.avaliacao ?? 0,
    fotos: Array.isArray(row.fotos) ? row.fotos : [],
    observacoes: row.endereco ?? '',
  };
}

export function mapRowToBroker(row: DbBrokerRow): Broker & {
  nomeExibicao?: string;
} {
  return {
    id: row.id ?? '',
    nome: row.nome ?? '',
    telefone: row.telefone ?? '',
    email: row.email ?? '',
    empresa: row.empresa ?? '',
    creci: row.creci ?? '',
    nomeExibicao: row.nome_exibicao ?? '',
  };
}

/** Payload snake_case para insert/update de clients. */
export function clientToDbPayload(client: Client, userId: string) {
  return {
    user_id: userId,
    nome: client.nome,
    telefone: client.telefone || null,
    email: client.email || null,
    cpf: client.cpf || null,
    aniversario: client.aniversario || null,
    sexo: client.sexo || null,
    estado_civil: client.estadoCivil || null,
    tem_filhos: client.temFilhos ?? false,
    quant_filhos: client.quantFilhos ?? 0,
    prazo: client.prazo || null,
    tipo_imovel: Array.isArray(client.tipoImovel)
      ? client.tipoImovel.join(', ')
      : client.tipoImovel || null,
    preco_min: client.precoMin ?? client.orcamentoMin ?? null,
    preco_max: client.precoMax ?? client.orcamentoMax ?? null,
    bairro: client.bairro || null,
    bairros_secundarios: client.bairrosSecundarios || null,
    tamanho: client.tamanho ?? null,
    quartos_min: client.quartosMin ?? null,
    suites_min: client.suitesMin ?? null,
    banheiros_min: client.banheirosMin ?? null,
    vagas_min: client.vagasMin ?? null,
    tipo_vaga: client.tipoVaga || null,
    condominio_max: client.condominioMax ?? null,
    pref_andar: client.prefAndar ?? false,
    andar_apartir: client.prefAndar ? (client.andarApartir ?? null) : null,
    novo: client.novo || 'indiferente',
    reformado: client.reformado || 'indiferente',
    aceita_financiamento: client.aceitaFinanciamento || 'indiferente',
    mobiliado: client.mobiliado || 'indiferente',
    varanda: client.varanda || 'indiferente',
    area_lazer: client.areaLazer || 'indiferente',
    aceita_pet: client.aceitaPet || 'indiferente',
    archived: client.archived ?? false,
    status_negocio: client.statusNegocio ?? 'em_andamento',
    observacoes: client.observacoes || null,
  };
}

export function propertyToDbPayload(
  prop: Property,
  userId: string,
  clientId: string,
  fotos: string[]
) {
  return {
    user_id: userId,
    client_id: clientId,
    titulo: prop.titulo,
    endereco: prop.observacoes || null,
    preco: prop.preco ?? 0,
    area: prop.tamanho ?? null,
    quartos: prop.quartos ?? null,
    suites: prop.suites ?? null,
    banheiros: prop.banheiros ?? null,
    vagas: prop.vagas ?? null,
    tipo_imovel: prop.tipoImovel || null,
    tipo_vaga_cobertura: prop.tipoVagaCobertura || null,
    tipo_vaga_modelo: prop.tipoVagaModelo || null,
    andar: prop.andar ?? null,
    condominio: prop.condominio ?? null,
    predio_novo: prop.predioNovo || null,
    reformado: prop.reformado || null,
    mobiliado: prop.mobiliado ?? false,
    varanda: prop.varanda ?? false,
    area_lazer: prop.areaLazer ?? false,
    aceita_pet: prop.aceitaPet ?? false,
    aceita_financiamento: prop.aceitaFinanciamento || null,
    bairro: prop.bairro || null,
    descricao: prop.descricao || null,
    favorito: prop.favorito ?? false,
    avaliacao: prop.rating ?? 0,
    fotos,
    archived: false,
  };
}
