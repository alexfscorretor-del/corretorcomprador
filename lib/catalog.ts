import { Client, Broker } from '@/types';
import { calculateCompatibility } from './compatibility';
import { CARD_TOKENS as T } from '@/components/PropertyCard';

// ──────────────────────────────────────────────────────────────────────────────
// catalog.ts — página gerada para o cliente
// Usa os mesmos CARD_TOKENS do PropertyCard.tsx como fonte única de verdade.
// ──────────────────────────────────────────────────────────────────────────────

export function generateClientCatalog(client: Client, broker: Broker): void {
  if (!client.properties || client.properties.length === 0) {
    alert('Cadastre pelo menos um imóvel primeiro.');
    return;
  }

  const sorted = [...client.properties].sort(
    (a, b) => calculateCompatibility(client, b) - calculateCompatibility(client, a)
  );

  const ratingsKey = `ratings_${client.id}`;
  const fbKey      = `feedback_${client.id}`;

  const topProp = sorted[0];
  const cpTop   = calculateCompatibility(client, topProp);
  const topImg  = topProp.fotos?.[0] || '';

  const brokerNome =
    (broker as any).nomeExibicao ||
    (broker as any).nome_exibicao ||
    broker.nome ||
    'Seu corretor';

  const brokerEmpresa  = (broker as any).empresa || '';
  const brokerTelefone = (broker as any).telefone || broker.telefone || '';
  const brokerEmail    = (broker as any).email || '';

  // ─── DESIGN TOKENS inline (mesmo valor de CARD_TOKENS) ───────────────────
  const RED        = '#E50914';
  const RED_TEXT   = '#ef4444';
  const BG_CARD    = 'rgba(255,255,255,0.05)';
  const BORDER     = 'rgba(255,255,255,0.1)';
  const RADIUS     = '24px';
  const RADIUS_SM  = '16px';
  const RADIUS_XS  = '12px';
  const TRANSITION = 'all .3s cubic-bezier(.4,0,.2,1)';

  // ─── PRINT CARDS DATA ────────────────────────────────────────────────────
  const printCardsData = sorted.map((p) => {
    const cp = calculateCompatibility(client, p);
    const specs: [string, string | number][] = [
      ['TIPO',          p.tipoImovel || '-'],
      ['BAIRRO',        p.bairro || '-'],
      ['\u00c1REA',         (p.tamanho || '?') + 'm\u00b2'],
      ['QUARTOS',       p.quartos ?? '-'],
      ['SU\u00cdTES',       p.suites ?? '-'],
      ['BANHEIROS',     p.banheiros ?? '-'],
      ['VAGAS',         p.vagas ?? '-'],
      ['ANDAR',         p.andar ?? '-'],
      ['CONDOM\u00cdNIO',    p.condominio ? 'R$ ' + Number(p.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
      ['PR\u00c9DIO NOVO',   p.predioNovo || '-'],
      ['REFORMADO',     p.reformado || '-'],
      ['MOBILIADO',     p.mobiliado ? 'Sim' : 'N\u00e3o'],
      ['VARANDA',       p.varanda ? 'Sim' : 'N\u00e3o'],
      ['\u00c1REA LAZER',    p.areaLazer ? 'Sim' : 'N\u00e3o'],
      ['PET',           p.aceitaPet ? 'Sim' : 'N\u00e3o'],
      ['FINANCIAMENTO', p.aceitaFinanciamento || '-'],
    ];
    return {
      id: p.id, titulo: p.titulo, bairro: p.bairro || '',
      preco: Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      cp, imgSrc: p.fotos?.[0] || '', fotos: p.fotos || [],
      specs, descricao: p.descricao || '', link: p.link || '',
    };
  });

  // ─── CARDS HTML ──────────────────────────────────────────────────────────
  const cards = sorted.map((p) => {
    const cp     = calculateCompatibility(client, p);
    const imgSrc = p.fotos?.[0] || '';
    const stars  = [1, 2, 3, 4, 5]
      .map(n => `<button class="star" data-id="${p.id}" data-val="${n}" aria-label="${n} estrelas">&#9733;</button>`)
      .join('');

    return `
<article class="card" data-id="${p.id}" onclick="openDetail('${p.id}')" role="button" tabindex="0" aria-label="Ver detalhes de ${p.titulo}">
  <div class="card-img-wrap">
    ${imgSrc ? `<img src="${imgSrc}" class="card-img" alt="${p.titulo}" loading="lazy">` : '<div class="card-img-ph">📷</div>'}
    <div class="compat-badge">${cp}% Compat\u00edvel</div>
    <button class="fav-btn" data-id="${p.id}" onclick="toggleFav(event,'${p.id}')" aria-label="Favoritar">&#x2665;</button>
  </div>
  <div class="card-body">
    <h3 class="card-title">${p.titulo}</h3>
    <p class="card-price">R$\u00a0${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    <p class="card-meta">${p.bairro || '-'} \u2022 ${p.tamanho || '?'}m\u00b2 \u2022 ${p.quartos ?? 0} qtos \u2022 ${p.vagas ?? 0} vaga(s)</p>
    <div class="stars-row" onclick="event.stopPropagation()">${stars}</div>
    <div class="card-actions" onclick="event.stopPropagation()">
      <button class="btn-like" data-id="${p.id}" onclick="toggleLike(event,'${p.id}',true)">\uD83D\uDC4D Gostei</button>
      <button class="btn-dislike" data-id="${p.id}" onclick="toggleLike(event,'${p.id}',false)">\uD83D\uDC4E N\u00e3o gostei</button>
    </div>
  </div>
</article>`;
  }).join('');

  // ─── MODAIS ───────────────────────────────────────────────────────────────
  const modals = sorted.map((p) => {
    const cp     = calculateCompatibility(client, p);
    const fotos  = p.fotos || [];
    const specs: [string, string | number][] = [
      ['Tipo',          p.tipoImovel || '-'],
      ['Bairro',        p.bairro || '-'],
      ['\u00c1rea',         (p.tamanho || '?') + 'm\u00b2'],
      ['Quartos',       p.quartos ?? '-'],
      ['Su\u00edtes',       p.suites ?? '-'],
      ['Banheiros',     p.banheiros ?? '-'],
      ['Vagas',         p.vagas ?? '-'],
      ['Andar',         p.andar ?? '-'],
      ['Condom\u00ednio',    p.condominio ? 'R$ ' + Number(p.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
      ['Pr\u00e9dio Novo',   p.predioNovo || '-'],
      ['Reformado',     p.reformado || '-'],
      ['Mobiliado',     p.mobiliado ? 'Sim' : 'N\u00e3o'],
      ['Varanda',       p.varanda ? 'Sim' : 'N\u00e3o'],
      ['\u00c1rea Lazer',    p.areaLazer ? 'Sim' : 'N\u00e3o'],
      ['Pet',           p.aceitaPet ? 'Sim' : 'N\u00e3o'],
      ['Financiamento', p.aceitaFinanciamento || '-'],
    ];
    const specsH = specs.map(([l, v]) => `<div class="spec"><strong>${l}</strong><span>${v}</span></div>`).join('');
    const galleryH = fotos.length > 1
      ? `<div class="gallery-grid">${fotos.map((f, i) => `<div class="gthumb" onclick="openLB('${p.id}',${i})"><img src="${f}" alt="Foto ${i+1}" loading="lazy"></div>`).join('')}</div>`
      : '';

    return `
<div class="modal-ov" id="modal-${p.id}" onclick="if(event.target===this)closeDetail('${p.id}')" role="dialog" aria-modal="true" aria-label="${p.titulo}">
  <div class="modal-box">
    <div class="modal-hero">
      ${fotos[0] ? `<img src="${fotos[0]}" alt="${p.titulo}" class="modal-hero-img" onclick="openLB('${p.id}',0)" title="Clique para ampliar">` : '<div class="modal-hero-ph">📷</div>'}
      <div class="modal-hero-grad"></div>
      <button class="modal-close" onclick="closeDetail('${p.id}')" aria-label="Fechar">&#x2715;</button>
      <div class="modal-compat">${cp}% Compat\u00edvel</div>
    </div>
    <div class="modal-body">
      <div class="modal-top-row">
        <div>
          <h2 class="modal-title">${p.titulo}</h2>
          ${p.bairro ? `<p class="modal-bairro">${p.bairro}</p>` : ''}
        </div>
        <div class="modal-price-col">
          <p class="modal-price">R$\u00a0${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          ${p.condominio ? `<p class="modal-cond">+ R$ ${Number(p.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cond.</p>` : ''}
        </div>
      </div>
      <div class="modal-stars" onclick="event.stopPropagation()">
        ${[1,2,3,4,5].map(n => `<button class="star" data-id="${p.id}" data-val="${n}" aria-label="${n} estrelas">&#9733;</button>`).join('')}
      </div>
      <div class="specs-grid">${specsH}</div>
      ${p.descricao ? `<div class="modal-desc-box"><p class="label-sm">Descri\u00e7\u00e3o</p><p class="modal-desc">${p.descricao}</p></div>` : ''}
      ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener noreferrer" class="ext-link">&#x2197; Ver an\u00fancio original</a>` : ''}
      ${fotos.length > 1 ? `<div class="gallery-header"><p class="label-sm">Galeria \u2022 <span class="gallery-hint">${fotos.length} fotos \u2014 clique para ampliar</span></p>${galleryH}</div>` : ''}
      <div class="modal-actions">
        <button class="btn-like modal-like" data-id="${p.id}" onclick="toggleLike(event,'${p.id}',true)">\uD83D\uDC4D Gostei</button>
        <button class="btn-dislike modal-dislike" data-id="${p.id}" onclick="toggleLike(event,'${p.id}',false)">\uD83D\uDC4E N\u00e3o gostei</button>
        <button class="btn-close-modal" onclick="closeDetail('${p.id}')">Fechar</button>
      </div>
    </div>
  </div>
</div>`;
  }).join('');

  // ─── LIGHTBOXES ───────────────────────────────────────────────────────────
  const lightboxes = sorted.filter(p => (p.fotos?.length || 0) > 0).map((p) => {
    const fotos = p.fotos || [];
    const thumbs = fotos.map((f, i) => `<div class="lb-thumb ${i === 0 ? 'lb-thumb-active' : ''}" data-i="${i}" onclick="lbGoTo('${p.id}',${i})"><img src="${f}" alt="" loading="lazy"></div>`).join('');
    return `
<div class="lb-ov" id="lb-${p.id}" onclick="if(event.target===this)closeLB('${p.id}')" role="dialog" aria-modal="true" aria-label="Galeria ${p.titulo}">
  <button class="lb-close" onclick="closeLB('${p.id}')" aria-label="Fechar">&#x2715;</button>
  ${fotos.length > 1 ? `<button class="lb-arrow lb-prev" onclick="lbNav('${p.id}',-1)" aria-label="Anterior">&#x2039;</button>` : ''}
  <img class="lb-img" id="lb-img-${p.id}" src="${fotos[0]}" alt="">
  ${fotos.length > 1 ? `<button class="lb-arrow lb-next" onclick="lbNav('${p.id}',1)" aria-label="Pr\u00f3xima">&#x203A;</button>` : ''}
  <div class="lb-counter" id="lb-counter-${p.id}">1 de ${fotos.length}</div>
  ${fotos.length > 1 ? `<div class="lb-thumbs" id="lb-thumbs-${p.id}">${thumbs}</div>` : ''}
</div>`;
  }).join('');

  // ─── HTML ─────────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Im\u00f3veis para ${client.nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
/* ── RESET ── */
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e4e4e7;font-family:'Inter',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
button{font-family:inherit}

/* ── HERO ── */
.hero{position:relative;background:#111;overflow:hidden;padding:60px 24px 50px}
${topImg ? `.hero::before{content:'';position:absolute;inset:0;background:url('${topImg}') center/cover no-repeat;opacity:.15;z-index:0}` : ''}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.92) 0%,rgba(10,10,10,.68) 45%,rgba(10,10,10,.3) 100%);z-index:0}
.hero-inner{position:relative;z-index:1;max-width:1180px;margin:0 auto;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:24px}
.hero-left{max-width:720px}
.hero-label{font-size:13px;color:#a1a1aa;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.hero-name{font-size:clamp(28px,5vw,48px);font-weight:700;color:#fff;line-height:1.05}
.hero-meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:14px;font-size:14px;font-weight:600;color:#f4f4f5}
.hero-meta .compat{color:#4ade80}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
.hero-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border-radius:14px;font-size:14px;font-weight:700;transition:.2s;cursor:pointer;border:none;text-decoration:none}
.hero-btn-p{background:#fff;color:#111}
.hero-btn-p:hover{background:#e4e4e7}
.hero-btn-s{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.12);color:#fff}
.hero-btn-s:hover{background:rgba(255,255,255,.18)}
.hero-client{margin-top:12px;font-size:14px;color:#e4e4e7;font-weight:600}
.hero-right{min-width:260px;max-width:340px;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.hero-broker-label{font-size:11px;color:#71717a;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}
.hero-broker-name{font-family:'Cormorant Garamond',serif;font-size:clamp(28px,4vw,44px);font-weight:600;color:${RED};font-style:italic;line-height:1.05}
.hero-broker-sub{font-size:12px;color:#a1a1aa;margin-top:2px}
.hero-broker-phone{font-size:14px;color:#e4e4e7;margin-top:4px;font-weight:600}
.hero-broker-email{font-size:12px;color:#a1a1aa}
.hero-compat{margin-top:16px;background:rgba(229,9,20,.12);border:1px solid rgba(229,9,20,.3);border-radius:16px;padding:14px 18px;display:inline-block}
.hero-compat-num{font-size:38px;font-weight:700;color:${RED};line-height:1}
.hero-compat-label{font-size:10px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.hero-feat-title{font-size:11px;color:#71717a;margin-top:12px}
.hero-feat-name{font-size:15px;font-weight:600;color:#fff;margin-top:3px;max-width:220px}

/* ── SECTION ── */
.section{max-width:1180px;margin:0 auto;padding:40px 20px}
.section-label{font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:20px}

/* ── CARD (= CARD_TOKENS) ── */
.card{
  background:${BG_CARD};
  backdrop-filter:blur(20px);
  border:1px solid ${BORDER};
  border-radius:${RADIUS};
  padding:16px;
  cursor:pointer;
  transition:${TRANSITION};
  outline:none;
}
.card:hover,.card:focus-visible{
  transform:translateY(-5px);
  box-shadow:0 20px 25px -5px rgba(16,185,129,.2);
  border-color:rgba(16,185,129,.35);
  background:rgba(255,255,255,0.08);
}
.card:focus-visible{outline:2px solid ${RED};outline-offset:2px}
.card-img-wrap{
  position:relative;
  width:100%;
  aspect-ratio:16/9;
  border-radius:${RADIUS_SM};
  overflow:hidden;
  background:#1f2937;
  margin-bottom:16px;
}
.card-img{width:100%;height:100%;object-fit:cover;display:block}
.card-img-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:#52525b}
.compat-badge{
  position:absolute;top:8px;right:8px;
  background:rgba(229,9,20,.9);color:#fff;
  font-size:11px;font-weight:700;
  padding:3px 10px;border-radius:${RADIUS_XS};
}
.fav-btn{
  position:absolute;top:8px;left:8px;
  width:32px;height:32px;
  display:flex;align-items:center;justify-content:center;
  border-radius:50%;border:none;cursor:pointer;
  background:rgba(0,0,0,.55);color:#fff;
  font-size:14px;transition:.2s;
}
.fav-btn.active{background:${RED}}
.card-body{padding:0}
.card-title{font-size:15px;font-weight:600;color:#fff;margin-bottom:4px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-price{font-size:20px;font-weight:700;color:${RED_TEXT};margin-bottom:4px}
.card-meta{font-size:12px;color:#a1a1aa;margin-bottom:12px}
.stars-row{display:flex;gap:2px;margin-bottom:12px;user-select:none}
.star{background:none;border:none;cursor:pointer;font-size:20px;color:#4b5563;padding:0;line-height:1;transition:color .15s}
.star.active{color:#fbbf24}
.card-actions{display:flex;gap:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.btn-like,.btn-dislike{
  flex:1;padding:10px 6px;
  border-radius:${RADIUS_SM};
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.06);
  color:#e4e4e7;font-size:12px;font-weight:600;
  cursor:pointer;transition:.2s;
}
.btn-like:hover,.btn-like.active{background:rgba(22,163,74,.25);border-color:#16a34a;color:#4ade80}
.btn-dislike:hover,.btn-dislike.active{background:rgba(239,68,68,.15);border-color:#ef4444;color:#fca5a5}

/* ── MODAL ── */
.modal-ov{
  display:none;position:fixed;inset:0;
  background:rgba(0,0,0,.82);
  backdrop-filter:blur(4px);
  z-index:999;overflow-y:auto;padding:20px;
  align-items:flex-start;justify-content:center;
}
.modal-ov.open{display:flex}
.modal-box{
  background:#181818;
  width:100%;max-width:896px;
  border-radius:${RADIUS};
  max-height:calc(100dvh - 40px);
  overflow:auto;
  margin:auto;
}
.modal-hero{position:relative;width:100%;aspect-ratio:16/6;background:#1f2937;border-radius:${RADIUS} ${RADIUS} 0 0;overflow:hidden}
.modal-hero-img{width:100%;height:100%;object-fit:cover;cursor:zoom-in;display:block}
.modal-hero-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;color:#52525b}
.modal-hero-grad{position:absolute;inset:0;background:linear-gradient(to top,#181818,transparent 55%)}
.modal-close{
  position:absolute;top:16px;right:16px;
  background:rgba(0,0,0,.6);border:none;color:#fff;
  width:40px;height:40px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:16px;transition:.2s;z-index:2;
}
.modal-close:hover{background:rgba(0,0,0,.85)}
.modal-compat{
  position:absolute;top:16px;left:16px;
  background:rgba(229,9,20,.9);color:#fff;
  font-size:13px;font-weight:700;
  padding:5px 14px;border-radius:${RADIUS_XS};
  z-index:2;
}
.modal-body{padding:24px 28px 28px}
.modal-top-row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}
.modal-title{font-size:clamp(20px,4vw,28px);font-weight:700;color:#fff;margin-bottom:4px}
.modal-bairro{color:#a1a1aa;font-size:14px}
.modal-price-col{text-align:right}
.modal-price{font-size:clamp(22px,4vw,30px);font-weight:700;color:${RED_TEXT}}
.modal-cond{color:#a1a1aa;font-size:13px;margin-top:2px}
.modal-stars{display:flex;gap:2px;margin-bottom:24px;user-select:none}
.modal-stars .star{font-size:28px}
.specs-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px}
@media(min-width:640px){.specs-grid{grid-template-columns:repeat(4,1fr)}}
.spec{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:${RADIUS_XS};padding:10px 12px}
.spec strong{display:block;font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.spec span{font-size:13px;font-weight:600;color:#e4e4e7}
.modal-desc-box{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:${RADIUS_XS};padding:14px 16px;margin-bottom:16px}
.label-sm{font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.modal-desc{font-size:13px;color:#d4d4d8;line-height:1.65;white-space:pre-wrap}
.ext-link{display:inline-flex;align-items:center;gap:6px;color:${RED_TEXT};font-size:13px;text-decoration:none;margin-bottom:20px;transition:color .2s}
.ext-link:hover{color:#fca5a5}
.gallery-header{margin-bottom:20px}
.gallery-hint{color:#52525b;font-weight:400}
.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
@media(min-width:640px){.gallery-grid{grid-template-columns:repeat(4,1fr)}}
.gthumb{aspect-ratio:16/9;border-radius:${RADIUS_XS};overflow:hidden;cursor:zoom-in;transition:.2s}
.gthumb:hover{opacity:.8;transform:scale(1.03)}
.gthumb img{width:100%;height:100%;object-fit:cover}
.modal-actions{display:flex;gap:10px;padding-top:20px;border-top:1px solid rgba(255,255,255,.1);flex-wrap:wrap}
.modal-like,.modal-dislike,.btn-close-modal{
  flex:1;min-width:100px;padding:12px;
  border-radius:${RADIUS_SM};
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.06);
  color:#e4e4e7;font-size:13px;font-weight:600;
  cursor:pointer;transition:.2s;
}
.modal-like:hover,.modal-like.active{background:rgba(22,163,74,.25);border-color:#16a34a;color:#4ade80}
.modal-dislike:hover,.modal-dislike.active{background:rgba(239,68,68,.15);border-color:#ef4444;color:#fca5a5}
.btn-close-modal{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)}
.btn-close-modal:hover{background:rgba(255,255,255,.15)}

/* ── LIGHTBOX ── */
.lb-ov{
  display:none;position:fixed;inset:0;
  background:rgba(0,0,0,.97);
  z-index:2000;
  align-items:center;justify-content:center;
  flex-direction:column;
}
.lb-ov.lb-open{display:flex}
.lb-img{max-width:92vw;max-height:76vh;object-fit:contain;border-radius:10px;user-select:none;display:block}
.lb-close{
  position:fixed;top:16px;right:16px;
  background:rgba(255,255,255,.1);border:none;color:#fff;
  width:44px;height:44px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:20px;transition:.2s;z-index:2001;
}
.lb-close:hover{background:rgba(255,255,255,.25)}
.lb-arrow{
  position:fixed;top:50%;transform:translateY(-50%);
  background:rgba(255,255,255,.1);border:none;color:#fff;
  width:52px;height:52px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:44px;line-height:1;transition:.2s;z-index:2001;
  padding-bottom:3px;
}
.lb-arrow:hover{background:rgba(255,255,255,.25)}
.lb-prev{left:12px}
.lb-next{right:12px}
.lb-counter{
  position:fixed;bottom:56px;left:50%;transform:translateX(-50%);
  color:rgba(255,255,255,.7);font-size:13px;
  background:rgba(0,0,0,.6);backdrop-filter:blur(8px);
  padding:5px 18px;border-radius:20px;z-index:2001;
}
.lb-thumbs{
  position:fixed;bottom:12px;left:50%;transform:translateX(-50%);
  display:flex;gap:8px;overflow-x:auto;max-width:90vw;padding:4px;
  z-index:2001;
}
.lb-thumb{
  width:56px;height:40px;border-radius:8px;overflow:hidden;
  cursor:pointer;flex-shrink:0;
  opacity:.4;border:2px solid transparent;
  transition:opacity .2s,border-color .2s;
}
.lb-thumb.lb-thumb-active{opacity:1;border-color:${RED}}
.lb-thumb img{width:100%;height:100%;object-fit:cover}

/* ── FOOTER ── */
.footer{border-top:1px solid #1c1c1e;padding:40px 24px;text-align:center}
.footer-broker{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:${RED};font-style:italic;margin-bottom:6px}
.footer-contact{font-size:14px;color:#e4e4e7;margin-top:4px}
.footer-email{font-size:12px;color:#a1a1aa;margin-top:4px}
.footer-empresa{font-size:12px;color:#71717a;margin-top:3px;letter-spacing:.04em;text-transform:uppercase}

/* ── PRINT ── */
@media print{
  .hero,.section-label,.card-actions,.modal-ov,.lb-ov,.footer{display:none!important}
  .grid{display:block}
  .card{break-inside:avoid;background:#fff;border:1px solid #ddd;margin-bottom:20px;page-break-inside:avoid}
  .card-title,.card-price{color:#111}
  .card-meta{color:#555}
  .compat-badge{background:#fef2f2;color:#b91c1c}
}

/* ── RESPONSIVE ── */
@media(max-width:700px){
  .hero-inner{flex-direction:column;align-items:flex-start}
  .hero-right{text-align:left;align-items:flex-start;min-width:unset;max-width:unset}
  .modal-body{padding:16px 16px 20px}
  .modal-actions{flex-direction:column}
  .modal-like,.modal-dislike,.btn-close-modal{flex:unset;width:100%}
  .lb-arrow{width:40px;height:40px;font-size:34px}
  .lb-prev{left:4px}
  .lb-next{right:4px}
  .gallery-grid{grid-template-columns:repeat(3,1fr)}
}
</style>
</head>
<body>

<!-- HERO -->
<div class="hero">
  <div class="hero-inner">
    <div class="hero-left">
      <p class="hero-label">Sele\u00e7\u00e3o de im\u00f3veis preparada para voc\u00ea</p>
      <h1 class="hero-name">${topProp.titulo}</h1>
      <div class="hero-meta">
        <span class="compat">${cpTop}% Compat\u00edvel</span>
        ${topProp.quartos != null ? `<span>${topProp.quartos} Quartos</span>` : ''}
        ${topProp.bairro ? `<span>${topProp.bairro}</span>` : ''}
      </div>
      <div class="hero-btns">
        <button class="hero-btn hero-btn-p" onclick="openDetail('${topProp.id}')">&#x25B6; Ver Detalhes</button>
        <button class="hero-btn hero-btn-s" onclick="window.print()">&#x1F4C4; Imprimir</button>
      </div>
      <div class="hero-client">Selecionados para ${client.nome}</div>
    </div>
    <div class="hero-right">
      <div class="hero-broker-label">Corretor respons\u00e1vel</div>
      <div class="hero-broker-name">${brokerNome}</div>
      ${brokerEmpresa ? `<div class="hero-broker-sub">${brokerEmpresa}</div>` : ''}
      ${brokerTelefone ? `<div class="hero-broker-phone">${brokerTelefone}</div>` : ''}
      ${brokerEmail ? `<div class="hero-broker-email">${brokerEmail}</div>` : ''}
      <div class="hero-compat">
        <div class="hero-compat-num">${cpTop}%</div>
        <div class="hero-compat-label">Compatibilidade</div>
        <div class="hero-feat-title">Im\u00f3vel em destaque</div>
        <div class="hero-feat-name">${topProp.titulo}</div>
      </div>
    </div>
  </div>
</div>

<!-- GRID -->
<div class="section">
  <p class="section-label">Im\u00f3veis selecionados para voc\u00ea</p>
  <div class="grid">${cards}</div>
</div>

<!-- MODAIS + LIGHTBOXES -->
${modals}
${lightboxes}

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-broker">${brokerNome}</div>
  ${brokerTelefone ? `<div class="footer-contact">${brokerTelefone}</div>` : ''}
  ${brokerEmail ? `<div class="footer-email">${brokerEmail}</div>` : ''}
  ${brokerEmpresa ? `<div class="footer-empresa">${brokerEmpresa}</div>` : ''}
</footer>

<script>
// ── STORE ──
const RATINGS_KEY = '${ratingsKey}';
const FB_KEY      = '${fbKey}';
const PRINT_DATA  = ${JSON.stringify(printCardsData)};
const BROKER_NOME = ${JSON.stringify(brokerNome)};
const BROKER_EMP  = ${JSON.stringify(brokerEmpresa)};
const BROKER_TEL  = ${JSON.stringify(brokerTelefone)};
const BROKER_EMAIL = ${JSON.stringify(brokerEmail)};
const CLIENT_NOME  = ${JSON.stringify(client.nome)};

const LB_STATE = {}; // { [propId]: { srcs, cur } }

function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }

// ── RATINGS ──
function applyRatings() {
  const saved = load(RATINGS_KEY, {});
  document.querySelectorAll('.star').forEach(s => {
    const id  = s.dataset.id;
    const val = parseInt(s.dataset.val);
    const cur = saved[id] || 0;
    s.classList.toggle('active', cur >= val);
    s.style.color = cur >= val ? '#fbbf24' : '#4b5563';
  });
}
document.querySelectorAll('.star').forEach(s => {
  s.addEventListener('click', function(e) {
    e.stopPropagation();
    const id = this.dataset.id, val = parseInt(this.dataset.val);
    const ratings = load(RATINGS_KEY, {});
    ratings[id] = val;
    store(RATINGS_KEY, ratings);
    applyRatings();
  });
});
applyRatings();

// ── FEEDBACK ──
function toggleLike(e, id, liked) {
  e.stopPropagation();
  const fbs = load(FB_KEY, {});
  const cur = fbs[id];
  fbs[id] = (cur && cur.liked === liked) ? { liked: null } : { liked };
  store(FB_KEY, fbs);
  applyFeedback();
}
function applyFeedback() {
  const fbs = load(FB_KEY, {});
  document.querySelectorAll('.btn-like,.modal-like').forEach(btn => {
    const id = btn.dataset.id;
    btn.classList.toggle('active', fbs[id]?.liked === true);
  });
  document.querySelectorAll('.btn-dislike,.modal-dislike').forEach(btn => {
    const id = btn.dataset.id;
    btn.classList.toggle('active', fbs[id]?.liked === false);
  });
}
applyFeedback();

// ── FAVORITOS ──
function toggleFav(e, id) {
  e.stopPropagation();
  const favs = load('favs', {});
  favs[id] = !favs[id];
  store('favs', favs);
  applyFavs();
}
function applyFavs() {
  const favs = load('favs', {});
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = btn.dataset.id;
    btn.classList.toggle('active', !!favs[id]);
    btn.title = favs[id] ? 'Remover favorito' : 'Favoritar';
  });
}
applyFavs();

// ── MODAL ──
function openDetail(id) {
  document.getElementById('modal-' + id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDetail(id) {
  document.getElementById('modal-' + id)?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── LIGHTBOX ──
function openLB(propId, idx) {
  const el = document.getElementById('lb-' + propId);
  if (!el) return;
  const thumbs = Array.from(document.querySelectorAll('#lb-thumbs-' + propId + ' .lb-thumb'));
  const srcs   = thumbs.length
    ? thumbs.map(t => t.querySelector('img').src)
    : [document.querySelector('#modal-' + propId + ' .modal-hero-img')?.src].filter(Boolean);
  LB_STATE[propId] = { srcs, cur: idx };
  lbRender(propId);
  el.classList.add('lb-open');
  document.body.style.overflow = 'hidden';
}
function closeLB(propId) {
  document.getElementById('lb-' + propId)?.classList.remove('lb-open');
  // N\u00e3o restaurar overflow aqui se modal ainda estiver aberto
  const anyModal = document.querySelector('.modal-ov.open');
  if (!anyModal) document.body.style.overflow = '';
}
function lbNav(propId, dir) {
  const s = LB_STATE[propId];
  if (!s) return;
  s.cur = (s.cur + dir + s.srcs.length) % s.srcs.length;
  lbRender(propId);
}
function lbGoTo(propId, idx) {
  const s = LB_STATE[propId];
  if (!s) return;
  s.cur = idx;
  lbRender(propId);
}
function lbRender(propId) {
  const s = LB_STATE[propId];
  if (!s) return;
  const img     = document.getElementById('lb-img-' + propId);
  const counter = document.getElementById('lb-counter-' + propId);
  const thumbs  = document.querySelectorAll('#lb-thumbs-' + propId + ' .lb-thumb');
  if (img)     img.src = s.srcs[s.cur];
  if (counter) counter.textContent = (s.cur + 1) + ' de ' + s.srcs.length;
  thumbs.forEach((t, i) => t.classList.toggle('lb-thumb-active', i === s.cur));
}

// ── TECLADO ──
document.addEventListener('keydown', function(e) {
  const lbOpen = document.querySelector('.lb-ov.lb-open');
  if (lbOpen) {
    const pid = lbOpen.id.replace('lb-', '');
    if (e.key === 'ArrowLeft')  { lbNav(pid, -1); return; }
    if (e.key === 'ArrowRight') { lbNav(pid,  1); return; }
    if (e.key === 'Escape')     { closeLB(pid); return; }
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-ov.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});

// ── SWIPE ──
document.querySelectorAll('.lb-ov').forEach(el => {
  let sx = 0;
  const pid = el.id.replace('lb-', '');
  el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) lbNav(pid, dx < 0 ? 1 : -1);
  }, { passive: true });
});

// ── PDF INDIVIDUAL ──
function printCard(id) {
  const card = PRINT_DATA.find(c => c.id === id);
  if (!card) return;
  const now = new Date().toLocaleDateString('pt-BR');
  const specsH = card.specs.map(s => '<div class="ps"><strong>' + s[0] + '</strong><span>' + s[1] + '</span></div>').join('');
  const fp = card.imgSrc ? '<img src="' + card.imgSrc + '" class="fp" alt="">' : '';
  const fx = card.fotos.length > 1 ? '<div class="fg">' + card.fotos.slice(1).map(f => '<img src="' + f + '" alt="">').join('') + '</div>' : '';

  const doc = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>' + card.titulo + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#fff;color:#111}@page{size:A4;margin:0}' +
    '.pg{width:210mm;min-height:297mm;padding:12mm 14mm;display:flex;flex-direction:column;page-break-after:always}.pg:last-child{page-break-after:auto}' +
    '.hd{background:#e50914;color:#fff;border-radius:12px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}' +
    '.hd-l .ht{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin-bottom:4px}.hd-l .hb{font-size:26px;font-weight:700}' +
    '.hd-r{text-align:right}.hd-r .hl{font-size:10px;opacity:.75;margin-bottom:3px}.hd-r .hn{font-size:16px;font-weight:700}' +
    '.cb{background:#f8f8f8;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}' +
    '.cn{font-size:18px;font-weight:700;color:#111;margin-bottom:2px}.ce{font-size:12px;color:#555;margin-bottom:4px}.cc{font-size:12px;color:#333}' +
    '.cx{text-align:center;background:#e50914;color:#fff;border-radius:10px;padding:12px 20px;min-width:110px}.cn2{font-size:32px;font-weight:700;line-height:1}.cl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;opacity:.85;margin-top:2px}' +
    '.pr{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.pv{font-size:28px;font-weight:700;color:#e50914}.pt{font-size:14px;font-weight:600;color:#333}' +
    '.fp{width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-bottom:14px}' +
    '.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}' +
    '.ps{background:#f8f8f8;border-radius:8px;padding:8px 10px}.ps strong{display:block;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:3px}.ps span{font-size:13px;font-weight:600;color:#111}' +
    '.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px}.fg img{width:100%;height:90px;object-fit:cover;border-radius:8px}' +
    '.dd{font-size:12px;color:#444;line-height:1.6;border-left:3px solid #e50914;padding-left:10px;margin-bottom:14px}' +
    '.rd{margin-top:auto;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#888}' +
    '.rm{font-size:13px;font-weight:700;color:#e50914}' +
    '.at{background:#f8f8f8;border-radius:10px;padding:18px 22px;margin-bottom:20px}' +
    '.at-l{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:10px}' +
    '.at-n{font-size:18px;font-weight:700;color:#111;margin-bottom:4px}.at-c{font-size:13px;color:#333;margin-bottom:2px}.at-nt{font-size:11px;color:#888;line-height:1.6;margin-top:20px}' +
    '@media print{button{display:none!important}}</style></head><body>' +
    '<div class="pg">' +
    '<div class="hd"><div class="hd-l"><div class="ht">Apresenta\u00e7\u00e3o de Im\u00f3vel</div><div class="hb">' + (card.bairro || card.titulo) + '</div></div>' +
    '<div class="hd-r"><div class="hl">Para:</div><div class="hn">' + CLIENT_NOME + '</div></div></div>' +
    '<div class="cb"><div><div style="font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:6px">Corretor Respons\u00e1vel</div>' +
    '<div class="cn">' + BROKER_NOME + '</div>' + (BROKER_EMP ? '<div class="ce">' + BROKER_EMP + '</div>' : '') +
    '<div class="cc">' + (BROKER_EMAIL ? BROKER_EMAIL + '<br>' : '') + (BROKER_TEL || '') + '</div></div>' +
    '<div class="cx"><div class="cn2">' + card.cp + '%</div><div class="cl">Compatibilidade</div></div></div>' +
    '<div class="pr"><div class="pv">R$\u00a0' + card.preco + '</div><div class="pt">' + card.titulo + '</div></div>' +
    fp + '<div class="sg">' + specsH + '</div>' +
    (card.descricao ? '<div class="dd">' + card.descricao + '</div>' : '') +
    '<div class="rd"><div><div class="rm">' + BROKER_NOME + '</div>' + (BROKER_TEL ? '<div>' + BROKER_TEL + '</div>' : '') + '</div><div>' + now + '</div></div>' +
    '</div>' +
    '<div class="pg"><div class="hd"><div class="hd-l"><div class="ht">Detalhes do Im\u00f3vel</div><div class="hb">' + card.titulo + '</div></div>' +
    '<div class="hd-r"><div class="hl">Para:</div><div class="hn">' + CLIENT_NOME + '</div></div></div>' +
    (card.fotos.length > 1 ? fx : '') +
    '<div class="at"><div class="at-l">Atendimento</div><div class="at-n">' + BROKER_NOME + '</div>' +
    (BROKER_TEL ? '<div class="at-c">Contato: ' + BROKER_TEL + (BROKER_EMP ? '\u00a0|\u00a0' + BROKER_EMP : '') + '</div>' : '') +
    '<div class="at-nt">Documento gerado para apresenta\u00e7\u00e3o do im\u00f3vel ao cliente.</div></div>' +
    '<div class="rd"><div><div class="rm">' + BROKER_NOME + '</div></div><div>' + now + '</div></div></div>' +
    '</body></html>';

  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const w    = window.open(url, '_blank');
  if (w) w.addEventListener('load', () => setTimeout(() => w.print(), 500));
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}
