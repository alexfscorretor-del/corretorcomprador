import { Client, Broker } from '@/types';
import { calculateCompatibility } from './compatibility';

export function generateClientCatalog(client: Client, broker: Broker): void {
  if (!client.properties || client.properties.length === 0) {
    alert('Cadastre pelo menos um imóvel primeiro.');
    return;
  }

  const sorted = [...client.properties].sort(
    (a, b) => calculateCompatibility(client, b) - calculateCompatibility(client, a)
  );

  const ratingsKey = `ratings_${client.id}`;

  const topProp = sorted[0];
  const cpTop = calculateCompatibility(client, topProp);
  const topImg = topProp.fotos?.[0] || '';

  const brokerNome =
    (broker as any).nomeExibicao ||
    (broker as any).nome_exibicao ||
    broker.nome ||
    'Seu corretor';

  const brokerEmpresa = (broker as any).empresa || '';
  const brokerTelefone = (broker as any).telefone || broker.telefone || '';
  const brokerEmail = (broker as any).email || '';

  /* ─── CARDS ─────────────────────────────────────────────────────────── */
  const cards = sorted
    .map((p) => {
      const cp = calculateCompatibility(client, p);
      const imgSrc = p.fotos?.[0] || '';
      const stars = [1, 2, 3, 4, 5]
        .map(
          (n) =>
            `<span class="star" data-id="${p.id}" data-val="${n}" style="color:${
              (p.rating || 0) >= n ? '#facc15' : '#3f3f46'
            };cursor:pointer;font-size:20px;">&#9733;</span>`
        )
        .join('');

      return `
<div class="card" data-id="${p.id}">
  ${
    imgSrc
      ? `<img src="${imgSrc}" class="card-img" alt="${p.titulo}" loading="lazy">`
      : '<div class="card-img-placeholder"></div>'
  }
  <div class="card-body">
    <div class="card-top">
      <span class="compat-badge">${cp}% Compat\u00edvel</span>
      <span class="price-sm">R$\u00a0${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
    </div>
    <h3 class="card-title">${p.titulo}</h3>
    <p class="card-bairro">${p.bairro || ''}</p>
    <div class="card-specs">
      ${p.quartos != null ? `<span>&#x1F6CF; ${p.quartos} quartos</span>` : ''}
      ${p.suites != null ? `<span>&#x1F6BF; ${p.suites} su\u00edtes</span>` : ''}
      ${p.vagas != null ? `<span>&#x1F697; ${p.vagas} vagas</span>` : ''}
      ${p.tamanho != null ? `<span>&#x1F4D0; ${p.tamanho}m\u00b2</span>` : ''}
    </div>
    <div class="stars-row" data-id="${p.id}">${stars}</div>
    ${p.descricao ? `<p class="card-desc">${p.descricao}</p>` : ''}
    <div class="card-actions">
      <button class="btn-detail" onclick="openDetail('${p.id}')">Ver detalhes</button>
      <button class="btn-pdf" onclick="printCard('${p.id}')">&#x1F4C4; PDF</button>
    </div>
  </div>
</div>`;
    })
    .join('');

  /* ─── MODAIS ─────────────────────────────────────────────────────────── */
  const detailModals = sorted
    .map((p) => {
      const cp = calculateCompatibility(client, p);
      const fotos = p.fotos || [];

      // fotos com onclick para abrir lightbox
      const fotosH = fotos.length
        ? `<div class="detail-photos">${fotos
            .map(
              (f, i) =>
                `<img src="${f}" alt="Foto ${i + 1}" loading="lazy" onclick="openLightbox('${p.id}',${i})">`
            )
            .join('')}</div>`
        : '';

      // array de fotos serializado para uso no lightbox via JS
      const fotosJson = JSON.stringify(fotos);

      const specs: [string, string | number][] = [
        ['Tipo', p.tipoImovel || '-'],
        ['Bairro', p.bairro || '-'],
        ['\u00c1rea', (p.tamanho || '?') + 'm\u00b2'],
        ['Quartos', p.quartos ?? '-'],
        ['Su\u00edtes', p.suites ?? '-'],
        ['Banheiros', p.banheiros ?? '-'],
        ['Vagas', p.vagas ?? '-'],
        ['Andar', p.andar ?? '-'],
        ['Condom\u00ednio', p.condominio ? 'R$ ' + Number(p.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
        ['Pr\u00e9dio Novo', p.predioNovo || '-'],
        ['Reformado', p.reformado || '-'],
        ['Mobiliado', p.mobiliado ? 'Sim' : 'N\u00e3o'],
        ['Varanda', p.varanda ? 'Sim' : 'N\u00e3o'],
        ['\u00c1rea Lazer', p.areaLazer ? 'Sim' : 'N\u00e3o'],
        ['Pet', p.aceitaPet ? 'Sim' : 'N\u00e3o'],
        ['Financiamento', p.aceitaFinanciamento || '-'],
      ];

      const specsH = specs
        .map(([l, v]) => `<div class="dspec"><strong>${l}</strong><span>${v}</span></div>`)
        .join('');

      return `
<div class="modal-overlay" id="modal-${p.id}" onclick="if(event.target===this)closeDetail('${p.id}')">
  <div class="modal-box">
    <div class="modal-header">
      <button class="modal-close" onclick="closeDetail('${p.id}')">&#x2715;</button>
      <button class="modal-pdf-btn" onclick="printCard('${p.id}')">&#x1F4C4; Gerar PDF</button>
    </div>
    <div class="modal-compat">${cp}% compat\u00edvel</div>
    <h2 class="modal-title">${p.titulo}</h2>
    <div class="modal-price">R$\u00a0${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    ${fotosH}
    ${fotos.length > 0 ? `<p class="foto-hint">&#x1F50D; Clique em uma foto para ampliar</p>` : ''}
    <div class="dspecs-grid">${specsH}</div>
    ${p.descricao ? `<div class="modal-desc">${p.descricao}</div>` : ''}
    ${p.link ? `<p style="margin:12px 0"><a href="${p.link}" target="_blank" rel="noopener noreferrer" style="color:#e50914">Ver an\u00fancio &#x2197;</a></p>` : ''}
    <script>window["__fotos_${p.id.replace(/-/g, '_')}"] = ${fotosJson};<\/script>
  </div>
</div>`;
    })
    .join('');

  /* ─── PRINT CARDS DATA ────────────────────────────────────────────────── */
  const printCardsData = sorted.map((p) => {
    const cp = calculateCompatibility(client, p);
    const imgSrc = p.fotos?.[0] || '';
    const fotos = p.fotos || [];

    const specs: [string, string | number][] = [
      ['TIPO', p.tipoImovel || '-'],
      ['BAIRRO', p.bairro || '-'],
      ['\u00c1REA', (p.tamanho || '?') + 'm\u00b2'],
      ['QUARTOS', p.quartos ?? '-'],
      ['SU\u00cdTES', p.suites ?? '-'],
      ['BANHEIROS', p.banheiros ?? '-'],
      ['VAGAS', p.vagas ?? '-'],
      ['ANDAR', p.andar ?? '-'],
      ['CONDOM\u00cdNIO', p.condominio ? 'R$ ' + Number(p.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
      ['PR\u00c9DIO NOVO', p.predioNovo || '-'],
      ['REFORMADO', p.reformado || '-'],
      ['MOBILIADO', p.mobiliado ? 'Sim' : 'N\u00e3o'],
      ['VARANDA', p.varanda ? 'Sim' : 'N\u00e3o'],
      ['\u00c1REA LAZER', p.areaLazer ? 'Sim' : 'N\u00e3o'],
      ['PET', p.aceitaPet ? 'Sim' : 'N\u00e3o'],
      ['FINANCIAMENTO', p.aceitaFinanciamento || '-'],
    ];

    return {
      id: p.id,
      titulo: p.titulo,
      bairro: p.bairro || '',
      preco: Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      cp,
      imgSrc,
      fotos,
      specs,
      descricao: p.descricao || '',
      link: p.link || '',
    };
  });

  /* ─── HTML ───────────────────────────────────────────────────────────── */
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
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e4e4e7;font-family:'Inter',sans-serif;min-height:100vh}

/* HERO */
.hero{position:relative;background:#111;overflow:hidden;padding:60px 24px 50px}
${topImg ? `.hero::before{content:'';position:absolute;inset:0;background:url('${topImg}') center/cover no-repeat;opacity:.15;z-index:0}` : ''}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.92) 0%,rgba(10,10,10,.68) 45%,rgba(10,10,10,.3) 100%);z-index:0}
.hero-inner{position:relative;z-index:1;max-width:1180px;margin:0 auto;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:24px}
.hero-left{max-width:720px}
.hero-greeting{font-size:13px;color:#a1a1aa;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.hero-name{font-family:'Inter',sans-serif;font-size:clamp(28px,5vw,48px);font-weight:700;color:#fff;line-height:1.05}
.hero-meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:14px;font-size:14px;font-weight:600;color:#f4f4f5}
.hero-meta .compat{color:#4ade80}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
.hero-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border-radius:14px;text-decoration:none;font-size:14px;font-weight:700;transition:.2s;cursor:pointer;border:none}
.hero-btn-primary{background:#fff;color:#111}
.hero-btn-primary:hover{background:#e4e4e7}
.hero-btn-secondary{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.12);color:#fff}
.hero-btn-secondary:hover{background:rgba(255,255,255,.18)}
.hero-client-line{margin-top:12px;font-size:14px;color:#e4e4e7;font-weight:600}
.hero-right{min-width:260px;max-width:340px;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.hero-broker-label{font-size:11px;color:#71717a;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}
.hero-broker-name{font-family:'Cormorant Garamond',serif;font-size:clamp(28px,4vw,44px);font-weight:600;color:#e50914;font-style:italic;line-height:1.05}
.hero-broker-sub{font-size:12px;color:#a1a1aa;margin-top:2px}
.hero-broker-phone{font-size:14px;color:#e4e4e7;margin-top:4px;font-weight:600}
.hero-broker-email{font-size:12px;color:#a1a1aa}
.hero-compat{margin-top:16px;background:rgba(229,9,20,.12);border:1px solid rgba(229,9,20,.3);border-radius:16px;padding:14px 18px;display:inline-block}
.hero-compat-num{font-size:38px;font-weight:700;color:#e50914;line-height:1}
.hero-compat-label{font-size:10px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.hero-feat-title{font-size:11px;color:#71717a;margin-top:12px}
.hero-feat-name{font-size:15px;font-weight:600;color:#fff;margin-top:3px;max-width:220px}

/* GRID */
.section{max-width:1180px;margin:0 auto;padding:40px 20px}
.section-title{font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:20px}

/* CARD */
.card{background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.4)}
.card-img{width:100%;height:190px;object-fit:cover}
.card-img-placeholder{width:100%;height:190px;background:#27272a}
.card-body{padding:16px}
.card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px}
.compat-badge{background:rgba(229,9,20,.15);color:#ff4d57;border:1px solid rgba(229,9,20,.3);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700}
.price-sm{font-size:13px;font-weight:700;color:#fff}
.card-title{font-size:15px;font-weight:700;color:#fff;margin-bottom:3px;line-height:1.3}
.card-bairro{font-size:12px;color:#a1a1aa;margin-bottom:10px}
.card-specs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.card-specs span{background:#27272a;border-radius:6px;padding:3px 8px;font-size:11px;color:#d4d4d8}
.stars-row{margin:8px 0;user-select:none}
.card-desc{font-size:12px;color:#a1a1aa;margin-top:8px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-actions{display:flex;gap:8px;margin-top:12px}
.btn-detail{flex:1;padding:10px;border-radius:10px;border:1px solid #3f3f46;background:transparent;color:#e4e4e7;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.btn-detail:hover{background:#27272a;color:#fff;border-color:#52525b}
.btn-pdf{padding:10px 14px;border-radius:10px;border:1px solid rgba(229,9,20,.4);background:rgba(229,9,20,.1);color:#ff4d57;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap}
.btn-pdf:hover{background:rgba(229,9,20,.2);border-color:#e50914}

/* MODAL */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;overflow-y:auto;padding:20px}
.modal-overlay.open{display:flex;align-items:flex-start;justify-content:center}
.modal-box{background:#18181b;border:1px solid #27272a;border-radius:20px;width:100%;max-width:700px;padding:28px;position:relative;margin:auto}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.modal-close{background:#27272a;border:none;color:#a1a1aa;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
.modal-close:hover{background:#3f3f46;color:#fff}
.modal-pdf-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid rgba(229,9,20,.4);background:rgba(229,9,20,.1);color:#ff4d57;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.modal-pdf-btn:hover{background:rgba(229,9,20,.2);border-color:#e50914}
.modal-compat{display:inline-block;background:rgba(229,9,20,.15);color:#ff4d57;border:1px solid rgba(229,9,20,.3);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:10px}
.modal-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:6px}
.modal-price{font-size:26px;font-weight:700;color:#e50914;margin-bottom:16px}

/* FOTOS DO MODAL — clicáveis */
.detail-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:8px}
.detail-photos img{width:100%;height:130px;object-fit:cover;border-radius:10px;cursor:pointer;transition:transform .15s,opacity .15s}
.detail-photos img:hover{transform:scale(1.04);opacity:.88}
.foto-hint{font-size:11px;color:#71717a;margin-bottom:14px;display:flex;align-items:center;gap:4px}

.dspecs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.dspec strong{display:block;font-size:10px;color:#71717a;text-transform:uppercase;margin-bottom:2px}
.dspec span{font-size:13px;color:#e4e4e7}
.modal-desc{font-size:13px;color:#a1a1aa;line-height:1.6;border-left:3px solid #e50914;padding-left:12px}

/* LIGHTBOX */
.lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.96);z-index:1200;align-items:center;justify-content:center}
.lightbox.open{display:flex}
.lightbox-img{max-width:92vw;max-height:88vh;object-fit:contain;border-radius:10px;user-select:none}
.lightbox-close{position:absolute;top:18px;right:22px;color:#fff;font-size:36px;cursor:pointer;background:none;border:none;line-height:1;opacity:.8;transition:opacity .2s}
.lightbox-close:hover{opacity:1}
.lightbox-prev,.lightbox-next{position:absolute;top:50%;transform:translateY(-50%);color:#fff;font-size:44px;cursor:pointer;background:none;border:none;padding:0 18px;opacity:.7;transition:opacity .2s;user-select:none}
.lightbox-prev:hover,.lightbox-next:hover{opacity:1}
.lightbox-prev{left:0}
.lightbox-next{right:0}
.lightbox-counter{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);color:#a1a1aa;font-size:13px;background:rgba(0,0,0,.5);padding:4px 12px;border-radius:20px}

/* PRINT */
@media print{
  body{background:#fff;color:#111}
  .hero,.section-title,.hero-actions,.stars-row,.card-actions,.modal-overlay,.lightbox,footer{display:none!important}
  .grid{display:block}
  .card{break-inside:avoid;border:1px solid #ddd;background:#fff;margin-bottom:20px;page-break-inside:avoid}
  .card-img{max-height:220px}
  .compat-badge{background:#fef2f2;color:#b91c1c;border-color:#fca5a5}
  .card-title,.price-sm{color:#111}
  .card-bairro,.card-desc{color:#555}
  .card-specs span{background:#f3f4f6;color:#374151}
  .print-only{display:block!important}
}
.print-only{display:none}

/* FOOTER */
.footer{border-top:1px solid #1c1c1e;padding:40px 24px;text-align:center}
.footer-broker{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#e50914;font-style:italic;margin-bottom:6px}
.footer-contact{font-size:14px;color:#e4e4e7;margin-top:4px}
.footer-email{font-size:12px;color:#a1a1aa;margin-top:4px}
.footer-empresa{font-size:12px;color:#71717a;margin-top:3px;letter-spacing:.04em;text-transform:uppercase}

@media(max-width:700px){
  .hero-inner{flex-direction:column;align-items:flex-start}
  .hero-right{text-align:left;align-items:flex-start;min-width:unset;max-width:unset}
  .hero-feat-name{max-width:none}
  .dspecs-grid{grid-template-columns:repeat(2,1fr)}
  .detail-photos{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>

<div class="hero">
  <div class="hero-inner">
    <div class="hero-left">
      <p class="hero-greeting">Sele\u00e7\u00e3o de im\u00f3veis preparada para voc\u00ea</p>
      <h1 class="hero-name">${topProp.titulo}</h1>
      <div class="hero-meta">
        <span class="compat">${cpTop}% Compat\u00edvel</span>
        ${topProp.quartos != null ? `<span>${topProp.quartos} Quartos</span>` : ''}
        ${topProp.bairro ? `<span>${topProp.bairro}</span>` : ''}
      </div>
      <div class="hero-actions">
        <button class="hero-btn hero-btn-primary" onclick="openDetail('${topProp.id}')">&#x25B6; Ver Detalhes</button>
        <button class="hero-btn hero-btn-secondary" onclick="window.print()">&#x1F4C4; Imprimir / PDF</button>
      </div>
      <div class="hero-client-line">Selecionados para ${client.nome}</div>
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

<div class="section">
  <p class="section-title">Im\u00f3veis selecionados para voc\u00ea</p>
  <div class="grid" id="cards-grid">
    ${cards}
  </div>
</div>

${detailModals}

<!-- LIGHTBOX GLOBAL -->
<div class="lightbox" id="lightbox" onclick="if(event.target===this)closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()">&#x2715;</button>
  <button class="lightbox-prev" onclick="moveLightbox(-1)">&#x2039;</button>
  <img class="lightbox-img" id="lightbox-img" src="" alt="">
  <button class="lightbox-next" onclick="moveLightbox(1)">&#x203A;</button>
  <div class="lightbox-counter" id="lightbox-counter"></div>
</div>

<footer class="footer">
  <div class="footer-broker">${brokerNome}</div>
  ${brokerTelefone ? `<div class="footer-contact">${brokerTelefone}</div>` : ''}
  ${brokerEmail ? `<div class="footer-email">${brokerEmail}</div>` : ''}
  ${brokerEmpresa ? `<div class="footer-empresa">${brokerEmpresa}</div>` : ''}
</footer>

<script>
const RATINGS_KEY = '${ratingsKey}';
const PRINT_CARDS = ${JSON.stringify(printCardsData)};
const BROKER_NOME = ${JSON.stringify(brokerNome)};
const BROKER_EMPRESA = ${JSON.stringify(brokerEmpresa)};
const BROKER_TELEFONE = ${JSON.stringify(brokerTelefone)};
const BROKER_EMAIL = ${JSON.stringify(brokerEmail)};
const CLIENT_NOME = ${JSON.stringify(client.nome)};

// ── MODAL ──────────────────────────────────────────────────────────────────
function openDetail(id) {
  document.getElementById('modal-' + id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDetail(id) {
  document.getElementById('modal-' + id)?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── LIGHTBOX ───────────────────────────────────────────────────────────────
var _lbFotos = [];
var _lbIdx = 0;

function openLightbox(propId, idx) {
  var key = '__fotos_' + propId.replace(/-/g, '_');
  var fotos = window[key] || [];
  if (!fotos.length) return;
  _lbFotos = fotos;
  _lbIdx = idx || 0;
  _renderLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
function moveLightbox(dir) {
  _lbIdx = (_lbIdx + dir + _lbFotos.length) % _lbFotos.length;
  _renderLightbox();
}
function _renderLightbox() {
  document.getElementById('lightbox-img').src = _lbFotos[_lbIdx];
  document.getElementById('lightbox-counter').textContent =
    (_lbIdx + 1) + ' / ' + _lbFotos.length;
  var prev = document.querySelector('.lightbox-prev');
  var next = document.querySelector('.lightbox-next');
  if (prev) prev.style.display = _lbFotos.length > 1 ? '' : 'none';
  if (next) next.style.display = _lbFotos.length > 1 ? '' : 'none';
}

// ── TECLADO ────────────────────────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  var lb = document.getElementById('lightbox');
  if (lb && lb.classList.contains('open')) {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowRight') { moveLightbox(1); return; }
    if (e.key === 'ArrowLeft') { moveLightbox(-1); return; }
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

// ── TOUCH SWIPE NO LIGHTBOX ────────────────────────────────────────────────
var _touchStartX = null;
document.getElementById('lightbox').addEventListener('touchstart', function(e) {
  _touchStartX = e.touches[0].clientX;
}, { passive: true });
document.getElementById('lightbox').addEventListener('touchend', function(e) {
  if (_touchStartX === null) return;
  var dx = e.changedTouches[0].clientX - _touchStartX;
  if (Math.abs(dx) > 40) moveLightbox(dx < 0 ? 1 : -1);
  _touchStartX = null;
}, { passive: true });

// ── ESTRELAS ───────────────────────────────────────────────────────────────
function saveRatings(ratings) {
  try { localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings)); } catch {}
}
function loadRatings() {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); } catch { return {}; }
}
function applyRatings() {
  var saved = loadRatings();
  document.querySelectorAll('.star').forEach(function(s) {
    var id = s.dataset.id;
    var val = parseInt(s.dataset.val);
    var cur = saved[id] || 0;
    s.style.color = cur >= val ? '#facc15' : '#3f3f46';
  });
}
document.querySelectorAll('.star').forEach(function(star) {
  star.addEventListener('click', function() {
    var id = this.dataset.id;
    var val = parseInt(this.dataset.val);
    var ratings = loadRatings();
    ratings[id] = val;
    saveRatings(ratings);
    applyRatings();
  });
});
applyRatings();

// ── PDF ────────────────────────────────────────────────────────────────────
function printCard(id) {
  var card = PRINT_CARDS.find(function(c) { return c.id === id; });
  if (!card) return;

  var now = new Date().toLocaleDateString('pt-BR');

  var specsHtml = card.specs
    .map(function(s) {
      return '<div class="ps"><strong>' + s[0] + '</strong><span>' + s[1] + '</span></div>';
    })
    .join('');

  var fotosPrincipal = card.imgSrc
    ? '<img src="' + card.imgSrc + '" class="foto-principal" alt="">'
    : '';

  var fotosExtras = card.fotos.length > 1
    ? '<div class="fotos-grid">' + card.fotos.slice(1).map(function(f) {
        return '<img src="' + f + '" alt="">';
      }).join('') + '</div>'
    : '';

  var htmlPdf = '<!DOCTYPE html>' +
    '<html lang="pt-BR"><head>' +
    '<meta charset="UTF-8">' +
    '<title>Apresenta\u00e7\u00e3o - ' + card.titulo + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'body{font-family:Inter,sans-serif;background:#fff;color:#111;padding:0}' +
    '@page{size:A4;margin:0}' +
    '.pagina{width:210mm;min-height:297mm;padding:12mm 14mm;display:flex;flex-direction:column;page-break-after:always}' +
    '.pagina:last-child{page-break-after:auto}' +
    '.cabecalho{background:#e50914;color:#fff;border-radius:12px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}' +
    '.cab-titulo{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin-bottom:4px}' +
    '.cab-bairro{font-size:26px;font-weight:700;line-height:1.1}' +
    '.cab-para-label{font-size:10px;opacity:.75;text-align:right;margin-bottom:3px}' +
    '.cab-para-nome{font-size:16px;font-weight:700;text-align:right}' +
    '.corretor-box{background:#f8f8f8;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}' +
    '.corretor-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:6px}' +
    '.corretor-nome{font-size:18px;font-weight:700;color:#111;margin-bottom:2px}' +
    '.corretor-empresa{font-size:12px;color:#555;margin-bottom:4px}' +
    '.corretor-contatos{font-size:12px;color:#333}' +
    '.compat-box{text-align:center;background:#e50914;color:#fff;border-radius:10px;padding:12px 20px;min-width:110px}' +
    '.compat-num{font-size:32px;font-weight:700;line-height:1}' +
    '.compat-label{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.85;margin-top:2px}' +
    '.preco-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}' +
    '.preco{font-size:28px;font-weight:700;color:#e50914}' +
    '.titulo-imovel{font-size:14px;font-weight:600;color:#333}' +
    '.foto-principal{width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-bottom:14px}' +
    '.specs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}' +
    '.ps{background:#f8f8f8;border-radius:8px;padding:8px 10px}' +
    '.ps strong{display:block;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:3px}' +
    '.ps span{font-size:13px;font-weight:600;color:#111}' +
    '.fotos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px}' +
    '.fotos-grid img{width:100%;height:90px;object-fit:cover;border-radius:8px}' +
    '.descricao{font-size:12px;color:#444;line-height:1.6;border-left:3px solid #e50914;padding-left:10px;margin-bottom:14px}' +
    '.rodape{margin-top:auto;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#888}' +
    '.rodape-marca{font-size:13px;font-weight:700;color:#e50914}' +
    '.p2-atendimento{background:#f8f8f8;border-radius:10px;padding:18px 22px;margin-bottom:20px}' +
    '.p2-at-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:10px}' +
    '.p2-at-nome{font-size:18px;font-weight:700;color:#111;margin-bottom:4px}' +
    '.p2-at-contato{font-size:13px;color:#333;margin-bottom:2px}' +
    '.p2-nota{font-size:11px;color:#888;line-height:1.6;margin-top:20px}' +
    '@media print{button{display:none!important}}' +
    '</style></head><body>' +
    '<div class="pagina">' +
    '<div class="cabecalho">' +
    '<div><div class="cab-titulo">Apresenta\u00e7\u00e3o de Im\u00f3vel</div>' +
    '<div class="cab-bairro">' + (card.bairro || card.titulo) + '</div></div>' +
    '<div><div class="cab-para-label">Para:</div>' +
    '<div class="cab-para-nome">' + CLIENT_NOME + '</div></div>' +
    '</div>' +
    '<div class="corretor-box">' +
    '<div><div class="corretor-label">Corretor Respons\u00e1vel</div>' +
    '<div class="corretor-nome">' + BROKER_NOME + '</div>' +
    (BROKER_EMPRESA ? '<div class="corretor-empresa">' + BROKER_EMPRESA + '</div>' : '') +
    '<div class="corretor-contatos">' +
    (BROKER_EMAIL ? BROKER_EMAIL + '<br>' : '') +
    (BROKER_TELEFONE ? BROKER_TELEFONE : '') +
    '</div></div>' +
    '<div class="compat-box"><div class="compat-num">' + card.cp + '%</div>' +
    '<div class="compat-label">Compatibilidade</div></div>' +
    '</div>' +
    '<div class="preco-row">' +
    '<div class="preco">R$\u00a0' + card.preco + '</div>' +
    '<div class="titulo-imovel">' + card.titulo + '</div>' +
    '</div>' +
    fotosPrincipal +
    '<div class="specs-grid">' + specsHtml + '</div>' +
    (card.descricao ? '<div class="descricao">' + card.descricao + '</div>' : '') +
    '<div class="rodape">' +
    '<div><div class="rodape-marca">' + BROKER_NOME + '</div>' +
    (BROKER_TELEFONE ? '<div>' + BROKER_TELEFONE + '</div>' : '') + '</div>' +
    '<div>' + now + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="pagina">' +
    '<div class="cabecalho">' +
    '<div><div class="cab-titulo">Detalhes do Im\u00f3vel</div>' +
    '<div class="cab-bairro">' + card.titulo + '</div></div>' +
    '<div><div class="cab-para-label">Para:</div>' +
    '<div class="cab-para-nome">' + CLIENT_NOME + '</div></div>' +
    '</div>' +
    (card.fotos.length > 1 ? fotosExtras : '') +
    '<div class="p2-atendimento">' +
    '<div class="p2-at-label">Atendimento</div>' +
    '<div class="p2-at-nome">' + BROKER_NOME + '</div>' +
    (BROKER_TELEFONE ? '<div class="p2-at-contato">Contato: ' + BROKER_TELEFONE + (BROKER_EMPRESA ? '\u00a0\u00a0|\u00a0\u00a0' + BROKER_EMPRESA : '') + '</div>' : '') +
    '<div class="p2-nota">Documento gerado para apresenta\u00e7\u00e3o do im\u00f3vel ao cliente.</div>' +
    '</div>' +
    '<div class="rodape">' +
    '<div><div class="rodape-marca">' + BROKER_NOME + '</div></div>' +
    '<div>' + now + '</div>' +
    '</div>' +
    '</div>' +
    '</body></html>';

  var blob = new Blob([htmlPdf], { type: 'text/html;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var w = window.open(url, '_blank');
  if (w) {
    w.addEventListener('load', function() {
      setTimeout(function() { w.print(); }, 600);
    });
  }
  setTimeout(function() { URL.revokeObjectURL(url); }, 120000);
}
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}
