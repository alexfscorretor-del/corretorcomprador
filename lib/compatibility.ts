import { Client, Property } from '@/types';

/**
 * Calcula a compatibilidade entre um cliente e um imóvel (0-100)
 */
export function calculateCompatibility(client: Client, property: Property): number {
  let score = 0;
  let total = 0;

  // Preço
  if (client.precoMin != null || client.precoMax != null) {
    total += 25;
    const preco = Number(property.preco);
    const min = client.precoMin ?? 0;
    const max = client.precoMax ?? Infinity;
    if (preco >= min && preco <= max) score += 25;
    else if (preco <= max * 1.1 && preco >= min * 0.9) score += 12;
  }

  // Tipo de imóvel — client.tipoImovel pode ser string ou string[]
  if (client.tipoImovel) {
    total += 15;
    const propTipo = (property.tipoImovel ?? '').toLowerCase();
    const clientTipos = Array.isArray(client.tipoImovel)
      ? client.tipoImovel.map((t) => t.toLowerCase())
      : [client.tipoImovel.toLowerCase()];
    if (clientTipos.includes(propTipo)) score += 15;
  }

  // Quartos (campo correto: quartosMin)
  if (client.quartosMin != null) {
    total += 15;
    if (property.quartos != null) {
      if (property.quartos >= client.quartosMin) score += 15;
      else if (property.quartos === client.quartosMin - 1) score += 8;
    }
  }

  // Bairro (campo correto: bairrosDesejados)
  const bairrosRef = client.bairrosDesejados && client.bairrosDesejados.length > 0
    ? client.bairrosDesejados
    : client.bairrosSecundarios
      ? [client.bairrosSecundarios]
      : client.bairro
        ? [client.bairro]
        : [];

  if (bairrosRef.length > 0) {
    total += 15;
    const bairroImovel = (property.bairro || '').toLowerCase();
    const match = bairrosRef.some(
      (b) => bairroImovel.includes(b.toLowerCase()) || b.toLowerCase().includes(bairroImovel)
    );
    if (match) score += 15;
  }

  // Tamanho (campo correto: tamanho — mínimo desejado)
  if (client.tamanho != null) {
    total += 10;
    const tam = property.tamanho ?? 0;
    const min = client.tamanho * 0.9;
    if (tam >= client.tamanho) score += 10;
    else if (tam >= min) score += 5;
  }

  // Suítes (campo correto: suitesMin)
  if (client.suitesMin != null) {
    total += 5;
    if (property.suites != null && property.suites >= client.suitesMin) score += 5;
  }

  // Vagas (campo correto: vagasMin)
  if (client.vagasMin != null) {
    total += 5;
    if (property.vagas != null && property.vagas >= client.vagasMin) score += 5;
  }

  // Diferenciais — client usa TriState ('sim'|'nao'|'indiferente'), property usa boolean
  type TriStateKey = 'mobiliado' | 'varanda' | 'areaLazer' | 'aceitaPet';
  const boolChecks: Array<[TriStateKey, TriStateKey]> = [
    ['mobiliado', 'mobiliado'],
    ['varanda', 'varanda'],
    ['areaLazer', 'areaLazer'],
    ['aceitaPet', 'aceitaPet'],
  ];

  for (const [ck, pk] of boolChecks) {
    if (client[ck] === 'sim') {
      total += 2;
      if (property[pk] === true) score += 2;
    }
  }

  if (total === 0) return 50;
  return Math.round((score / total) * 100);
}
