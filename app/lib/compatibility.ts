import { Client, Property } from '@/types';

export function calculateCompatibility(client: Client, prop: Property): number {
  let score = 0;

  if (client.tipoImovel && prop.tipoImovel && client.tipoImovel === prop.tipoImovel) score += 10;

  if (client.precoMin && client.precoMax && prop.preco) {
    if (Number(prop.preco) >= Number(client.precoMin) && Number(prop.preco) <= Number(client.precoMax)) score += 15;
    else if (Number(prop.preco) <= Number(client.precoMax) * 1.1) score += 8;
  } else if (client.precoMax && prop.preco) {
    if (Number(prop.preco) <= Number(client.precoMax)) score += 15;
  }

  if (client.bairro && prop.bairro) {
    if (client.bairro.toLowerCase() === prop.bairro.toLowerCase()) score += 15;
    else if (client.bairrosSecundarios?.toLowerCase().includes(prop.bairro.toLowerCase())) score += 10;
  }

  if (client.tamanho && prop.tamanho) {
    const diff = Math.abs(prop.tamanho - client.tamanho) / client.tamanho;
    if (diff <= 0.15) score += 10;
    else if (diff <= 0.3) score += 5;
  }

  if (prop.quartos >= client.quartosMin) score += 8;
  if (client.suitesMin && prop.suites >= client.suitesMin) score += 5;
  if (client.banheirosMin && prop.banheiros >= client.banheirosMin) score += 5;
  if (prop.vagas >= client.vagasMin) score += 5;

  // tipoVaga: compara cobertura do HTML original
  if (client.tipoVaga && prop.tipoVagaCobertura && client.tipoVaga === prop.tipoVagaCobertura) score += 2;

  if (!client.prefAndar || (prop.andar && prop.andar >= (client.andarApartir || 1))) score += 5;

  if (client.novo !== 'indiferente') {
    const novoOk = !(client.novo === 'sim' && prop.predioNovo !== 'sim') && !(client.novo === 'nao' && prop.predioNovo === 'sim');
    if (novoOk) score += 3;
  }

  if (client.reformado !== 'indiferente') {
    const refOk = !(client.reformado === 'sim' && prop.reformado !== 'sim');
    if (refOk) score += 2;
  }

  if (client.condominioMax && prop.condominio && Number(prop.condominio) <= Number(client.condominioMax)) score += 5;

  let extras = 0;
  if (client.mobiliado === 'sim' && prop.mobiliado) extras += 2;
  else if (client.mobiliado === 'nao' && !prop.mobiliado) extras += 2;
  else if (client.mobiliado === 'indiferente') extras += 2;

  if (client.varanda === 'sim' && prop.varanda) extras += 2;
  else if (client.varanda === 'indiferente') extras += 2;

  if (client.areaLazer === 'sim' && prop.areaLazer) extras += 2;
  else if (client.areaLazer === 'indiferente') extras += 2;

  if (client.aceitaPet === 'sim' && prop.aceitaPet) extras += 2;
  else if (client.aceitaPet === 'indiferente') extras += 2;

  if (client.aceitaFinanciamento === 'sim' && prop.aceitaFinanciamento === 'sim') extras += 2;
  else if (client.aceitaFinanciamento === 'indiferente') extras += 2;

  score += Math.min(10, extras);
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function extractPropertyData(text: string): Partial<Property> {
  const d: Partial<Property> = {};
  const pm = text.match(/R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i);
  if (pm) d.preco = parseFloat(pm[1].replace(/\./g, '').replace(',', '.'));
  const tm = text.match(/(\d+)\s*m[^a-z]/i); if (tm) d.tamanho = parseInt(tm[1]);
  const qm = text.match(/(\d+)\s*(?:quarto|quartos|qto|qtos|dormit)/i); if (qm) d.quartos = parseInt(qm[1]);
  const sm = text.match(/(\d+)\s*(?:suite|suites)/i); if (sm) d.suites = parseInt(sm[1]);
  const bm = text.match(/(\d+)\s*(?:banheiro|banheiros|wc|lavabo)/i); if (bm) d.banheiros = parseInt(bm[1]);
  const vm = text.match(/(\d+)\s*(?:vaga|vagas|garagem)/i); if (vm) d.vagas = parseInt(vm[1]);
  const am = text.match(/(\d+)(?:o)?\s*andar/i); if (am) d.andar = parseInt(am[1]);
  d.descricao = text.length > 400 ? text.substring(0, 400) + '...' : text;
  return d;
}