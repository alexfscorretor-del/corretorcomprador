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

  // Tipo de imóvel
  if (client.tipoImovel) {
    total += 15;
    if (property.tipoImovel?.toLowerCase() === client.tipoImovel.toLowerCase()) score += 15;
  }

  // Quartos
  if (client.quartos != null) {
    total += 15;
    if (property.quartos != null) {
      if (property.quartos === client.quartos) score += 15;
      else if (Math.abs(property.quartos - client.quartos) === 1) score += 8;
    }
  }

  // Bairro
  if (client.bairrosPreferidos && client.bairrosPreferidos.length > 0) {
    total += 15;
    const bairroImovel = (property.bairro || '').toLowerCase();
    const match = client.bairrosPreferidos.some(
      (b) => bairroImovel.includes(b.toLowerCase()) || b.toLowerCase().includes(bairroImovel)
    );
    if (match) score += 15;
  }

  // Tamanho
  if (client.tamanhoMin != null || client.tamanhoMax != null) {
    total += 10;
    const tam = property.tamanho ?? 0;
    const min = client.tamanhoMin ?? 0;
    const max = client.tamanhoMax ?? Infinity;
    if (tam >= min && tam <= max) score += 10;
    else if (tam >= min * 0.9 && tam <= max * 1.1) score += 5;
  }

  // Suítes
  if (client.suites != null) {
    total += 5;
    if (property.suites != null && property.suites >= client.suites) score += 5;
  }

  // Vagas
  if (client.vagas != null) {
    total += 5;
    if (property.vagas != null && property.vagas >= client.vagas) score += 5;
  }

  // Diferenciais booleanos
  const boolChecks: Array<[keyof Client, keyof Property]> = [
    ['mobiliado', 'mobiliado'],
    ['varanda', 'varanda'],
    ['areaLazer', 'areaLazer'],
    ['aceitaPet', 'aceitaPet'],
  ];

  for (const [ck, pk] of boolChecks) {
    if (client[ck]) {
      total += 2;
      if (property[pk]) score += 2;
    }
  }

  if (total === 0) return 50;
  return Math.round((score / total) * 100);
}
