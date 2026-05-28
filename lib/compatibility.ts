import { Client, Property } from '@/types';

export function calculateCompatibility(client: Client, prop: Property): number {
  let score = 0;

  // ── TIPO DE IMÓVEL (15pts) ─────────────────────────────────────────────────
  if (client.tipoImovel && prop.tipoImovel && client.tipoImovel === prop.tipoImovel)
    score += 15;

  // ── PREÇO ≤ máximo do cliente (25pts) ──────────────────────────────────────
  // Penaliza só se ACIMA do teto; abaixo é sempre bom
  if (client.precoMax && prop.preco) {
    const preco = Number(prop.preco);
    const max   = Number(client.precoMax);
    const min   = Number(client.precoMin ?? 0);

    if (preco >= min && preco <= max)          score += 25; // dentro do range ideal
    else if (preco < min)                      score += 20; // abaixo do mínimo (ainda compatível)
    else if (preco <= max * 1.05)              score += 10; // até 5% acima: quase compatível
    // acima de 5% do teto: não pontua
  }

  // ── BAIRRO (10pts principal + 7pts secundário) ─────────────────────────────
  if (client.bairro && prop.bairro) {
    if (client.bairro.toLowerCase() === prop.bairro.toLowerCase())
      score += 10;
    else if (client.bairrosSecundarios?.toLowerCase().includes(prop.bairro.toLowerCase()))
      score += 7;
  }

  // ── TAMANHO (m²) — cliente indica mínimo desejado (5pts) ──────────────────
  // Maior que o desejado é bônus; menor penaliza
  if (client.tamanho && prop.tamanho) {
    if (prop.tamanho >= client.tamanho)        score += 5; // igual ou maior: ok
    else {
      const diff = (client.tamanho - prop.tamanho) / client.tamanho;
      if (diff <= 0.1)                         score += 3; // até 10% menor: parcial
      // mais de 10% menor: não pontua
    }
  }

  // ── QUARTOS ≥ mínimo do cliente (15pts) ───────────────────────────────────
  if (prop.quartos >= client.quartosMin)       score += 15;

  // ── SUÍTES ≥ mínimo do cliente (8pts) ─────────────────────────────────────
  if (client.suitesMin && prop.suites >= client.suitesMin)     score += 8;

  // ── BANHEIROS ≥ mínimo do cliente (3pts) ──────────────────────────────────
  if (client.banheirosMin && prop.banheiros >= client.banheirosMin) score += 3;

  // ── VAGAS ≥ mínimo do cliente (3pts) ──────────────────────────────────────
  if (prop.vagas >= client.vagasMin)           score += 3;

  // ── TIPO DE VAGA (2pts) ────────────────────────────────────────────────────
  if (client.tipoVaga && prop.tipoVagaCobertura && client.tipoVaga === prop.tipoVagaCobertura)
    score += 2;

  // ── ANDAR ≥ preferência do cliente (3pts) ─────────────────────────────────
  if (!client.prefAndar || (prop.andar && prop.andar >= (client.andarApartir || 1)))
    score += 3;

  // ── CONDOMÍNIO ≤ máximo do cliente (7pts) ─────────────────────────────────
  // Abaixo do teto é bom; acima penaliza (não pontua)
  if (client.condominioMax && prop.condominio) {
    if (Number(prop.condominio) <= Number(client.condominioMax)) score += 7;
    // acima do teto: não pontua
  } else if (!client.condominioMax) {
    score += 7; // cliente não definiu limite → campo indiferente, pontua sempre
  }

  // ── PRÉDIO NOVO — tristate (3pts) ─────────────────────────────────────────
  if (client.novo === 'indiferente') {
    score += 3;
  } else if (client.novo === 'sim' && prop.predioNovo === 'sim') {
    score += 3;
  } else if (client.novo === 'nao' && prop.predioNovo !== 'sim') {
    score += 3;
  }
  // não pontua se divergir

  // ── REFORMADO — tristate (2pts) ────────────────────────────────────────────
  if (client.reformado === 'indiferente') {
    score += 2;
  } else if (client.reformado === 'sim' && prop.reformado === 'sim') {
    score += 2;
  } else if (client.reformado === 'nao' && prop.reformado !== 'sim') {
    score += 2;
  }

  // ── EXTRAS — tristate (2pts cada, máx 10pts) ──────────────────────────────
  let extras = 0;

  // Mobiliado
  if (client.mobiliado === 'indiferente')                           extras += 2;
  else if (client.mobiliado === 'sim' && prop.mobiliado)            extras += 2;
  else if (client.mobiliado === 'nao' && !prop.mobiliado)           extras += 2;

  // Varanda
  if (client.varanda === 'indiferente')                             extras += 2;
  else if (client.varanda === 'sim' && prop.varanda)                extras += 2;
  else if (client.varanda === 'nao' && !prop.varanda)               extras += 2;

  // Área de lazer
  if (client.areaLazer === 'indiferente')                           extras += 2;
  else if (client.areaLazer === 'sim' && prop.areaLazer)            extras += 2;
  else if (client.areaLazer === 'nao' && !prop.areaLazer)           extras += 2;

  // Aceita pet
  if (client.aceitaPet === 'indiferente')                           extras += 2;
  else if (client.aceitaPet === 'sim' && prop.aceitaPet)            extras += 2;
  else if (client.aceitaPet === 'nao' && !prop.aceitaPet)           extras += 2;

  // Aceita financiamento
  if (client.aceitaFinanciamento === 'indiferente')                 extras += 2;
  else if (client.aceitaFinanciamento === 'sim' && prop.aceitaFinanciamento === 'sim') extras += 2;
  else if (client.aceitaFinanciamento === 'nao' && prop.aceitaFinanciamento !== 'sim') extras += 2;

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