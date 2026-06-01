import { Client, Broker } from '@/types';
import { calculateCompatibility } from './compatibility';

export function generateClientCatalog(client: Client, broker: Broker): void {
  if (!client.properties || client.properties.length === 0) {
    alert('Este cliente não possui imóveis compatíveis cadastrados.');
    return;
  }

  const sorted = [...client.properties].sort(
    (a, b) => calculateCompatibility(client, b) - calculateCompatibility(client, a)
  );

  /* ─── DADOS DO BROKER ──────────────────────────────────────────────────── */
  const brokerNome     = broker.nomeCompleto   || broker.nome || 'Corretor';
  const brokerEmpresa  = broker.empresa        || '';
  const brokerTelefone = broker.telefone       || '';
  const brokerEmail    = broker.email          || '';

  /* ─── DADOS PARA PDF (printCard) ───────────────────────────────────────── */
  const printCardsData = sorted.map((p) => {
    const specs: [string, string | number][] = [
      ['Tipo', p.tipoImovel || '-'],
      ['Bairro', p.bairro || '-'],
      ['Área', (p.tamanho || '?') + 'm²'],
      ['Quartos', p.quartos ?? '-'],
      ['Suítes', p.suites ?? '-'],
      ['Banheiros', p.banheiros ?? '-'],
      ['Vagas', p.vagas ?? '-'],
      ['Andar', p.andar ?? '-'],
      ['Condomínio', p.condominio ? 'R$ ' + Number(p.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
      ['Prédio Novo', p.predioNovo || '-'],
      ['Reformado', p.reformado || '-'],
      ['Mobiliado', p.mobiliado ? 'Sim' : 'Não'],
      ['Varanda', p.varanda ? 'Sim' : 'Não'],
      ['Área Lazer', p.areaLazer ? 'Sim' : 'Não'],
      ['Pet', p.aceitaPet ? 'Sim' : 'Não'],
      ['Financiamento', p.aceitaFinanciamento || '-'],
    ];
    return {
      id: p.id,
      titulo: p.titulo,
      preco: p.preco,
      bairro: p.bairro,
      imgSrc: p.fotos?.[0] || '',
      fotos: p.fotos || [],
      specs,
      descricao: p.descricao || '',
      link: p.link || '',
      compat: calculateCompatibility(client, p),
    };
  });

  const ratingsKey = `ratings_${client.id}`;

  /* ─── CARDS ────────────────────────────────────────────────────────────── */
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

      // atributos em texto linear (ex: "Bueno • 120m² • 3 qtos • 2 vagas")
      const attParts: string[] = [];
      if (p.bairro)           attParts.push(p.bairro);
      if (p.tamanho != null)  attParts.push(p.tamanho + 'm\u00b2');
      if (p.quartos  != null) attParts.push(p.quartos + ' qto' + (p.quartos !== 1 ? 's' : ''));
      if (p.vagas    != null) attParts.push(p.vagas + ' vaga' + (p.vagas !== 1 ? 's' : ''));
      const attLine = attParts.join(' \u2022 ');

      return `
<div class="card" data-id="${p.id}" onclick="openDetail('${p.id}')" role="button" tabindex="0" aria-label="Ver detalhes de ${p.titulo}">
  <div class="card-img-wrap">
    ${
      imgSrc
        ? `<img src="${imgSrc}" class="card-img" alt="${p.titulo}" loading="lazy">`
        : '<div class="card-img-placeholder"></div>'
    }
    <span class="compat-badge">${cp}% Compat\u00edvel</span>
  </div>
  <div class="card-body">
    <h3 class="card-title">${p.titulo}</h3>
    <p class="card-price">R$\u00a0${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    ${attLine ? `<p class="card-specs">${attLine}</p>` : ''}
    <div class="stars-row" data-id="${p.id}">${stars}</div>
    ${p.descricao ? `<p class="card-desc">${p.descricao}</p>` : ''}
    <div class="card-actions" onclick="event.stopPropagation()">
      <button class="btn-detail" onclick="openDetail('${p.id}')">Ver detalhes</button>
    </div>
  </div>
</div>`;
    })
    .join('');

  /* ─── MODAIS ───────────────────────────────────────────────────────────── */
  const detailModals = sorted
    .map((p) => {
      const cp = calculateCompatibility(client, p);
      const fotos = p.fotos || [];
      const fotosH = fotos.length
        ? `<div class="detail-photos">${fotos.map((f, i) => `<img src="${f}" alt="" loading="lazy" class="detail-photo-thumb" onclick="openLightbox('${p.id}',${i})" tabindex="0" role="button" aria-label="Ampliar foto ${i + 1}">`).join('')}</div>`
        : '';

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
    <div class="dspecs-grid">${specsH}</div>
    ${p.descricao ? `<div class="modal-desc">${p.descricao}</div>` : ''}
    ${p.link ? `<p style="margin:12px 0"><a href="${p.link}" target="_blank" rel="noopener noreferrer" style="color:#e50914">Ver an\u00fancio &#x2197;</a></p>` : ''}
  </div>
</div>`;
    })
    .join('');

  /* ─── HTML FINAL ───────────────────────────────────────────────────────── */
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Im\u00f3veis para ${client.nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:#09090b;color:#e4e4e7;min-height:100vh}

/* HEADER */
.page-header{background:#18181b;border-bottom:1px solid #27272a;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.header-left{display:flex;align-items:center;gap:14px}
.broker-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #3f3f46}
.broker-info h1{font-size:16px;font-weight:700;color:#fff}
.broker-info p{font-size:12px;color:#a1a1aa}
.client-tag{background:rgba(229,9,20,.12);border:1px solid rgba(229,9,20,.3);color:#ff4d57;border-radius:20px;padding:6px 14px;font-size:13px;font-weight:600}

/* GRID */
.catalog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;padding:28px 24px;max-width:1200px;margin:0 auto}

/* CARD — mesmo design do card interno */
.card{background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;transition:transform .2s,box-shadow .2s;cursor:pointer}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.4)}
.card-img-wrap{position:relative;width:100%;height:190px}
.card-img{width:100%;height:190px;object-fit:cover;display:block}
.card-img-placeholder{width:100%;height:190px;background:#27272a}
.compat-badge{position:absolute;top:10px;right:10px;background:rgba(229,9,20,.85);color:#fff;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;backdrop-filter:blur(4px)}
.card-body{padding:16px}
.card-title{font-size:15px;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.3}
.card-price{font-size:14px;font-weight:700;color:#e50914;margin-bottom:6px}
.card-specs{font-size:12px;color:#a1a1aa;margin-bottom:10px;line-height:1.5}
.stars-row{margin:8px 0;user-select:none}
.card-desc{font-size:12px;color:#a1a1aa;margin-top:8px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-actions{display:flex;gap:8px;margin-top:12px}
.btn-detail{flex:1;padding:10px;border-radius:10px;border:1px solid rgba(229,9,20,.5);background:rgba(229,9,20,.12);color:#ff4d57;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.btn-detail:hover{background:rgba(229,9,20,.22);border-color:#e50914;color:#fff}

/* THUMBS DO MODAL */
.detail-photo-thumb{cursor:pointer;border-radius:6px;transition:opacity .2s}
.detail-photo-thumb:hover{opacity:.8}

/* LIGHTBOX */
#lightbox-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;align-items:center;justify-content:center;flex-direction:column}
#lightbox-overlay.lb-open{display:flex}
#lb-img{max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px;user-select:none;transition:opacity .25s}
#lb-counter{color:#e4e4e7;font-size:13px;margin-top:10px;font-family:Inter,sans-serif}
#lb-close{position:absolute;top:16px;right:20px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;line-height:1;z-index:1}
#lb-prev,#lb-next{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.12);border:none;color:#fff;font-size:28px;cursor:pointer;padding:12px 18px;border-radius:8px;transition:background .2s;z-index:1;line-height:1}
#lb-prev{left:12px}
#lb-next{right:12px}
#lb-prev:hover,#lb-next:hover{background:rgba(255,255,255,.25)}

/* MODAL */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1000;align-items:center;justify-content:center;padding:16px}
.modal-overlay.open{display:flex}
.modal-box{background:#18181b;border:1px solid #27272a;border-radius:20px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;padding:24px;position:relative}
.modal-header{display:flex;justify-content:flex-end;gap:10px;margin-bottom:12px}
.modal-close{background:none;border:none;color:#a1a1aa;font-size:20px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:color .2s}
.modal-close:hover{color:#fff}
.modal-pdf-btn{padding:7px 14px;border-radius:8px;border:1px solid rgba(229,9,20,.4);background:rgba(229,9,20,.1);color:#ff4d57;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.modal-pdf-btn:hover{background:rgba(229,9,20,.2)}
.modal-compat{font-size:12px;color:#ff4d57;font-weight:700;margin-bottom:6px}
.modal-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:6px}
.modal-price{font-size:18px;font-weight:700;color:#e50914;margin-bottom:16px}
.detail-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:16px}
.detail-photos img{width:100%;height:90px;object-fit:cover;border-radius:8px}
.dspecs-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.dspec{background:#27272a;border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:3px}
.dspec strong{font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em}
.dspec span{font-size:13px;color:#e4e4e7;font-weight:600}
.modal-desc{font-size:13px;color:#a1a1aa;line-height:1.6;margin-top:12px}

/* FOOTER */
.page-footer{text-align:center;padding:32px 24px;color:#52525b;font-size:12px;border-top:1px solid #27272a;margin-top:8px}

@media(max-width:600px){
  .catalog-grid{grid-template-columns:1fr;padding:16px}
  .page-header{padding:16px}
  .dspecs-grid{grid-template-columns:1fr}
  #lb-prev{left:4px}
  #lb-next{right:4px}
}
</style>
</head>
<body>

<header class="page-header">
  <div class="header-left">
    ${broker.fotoPerfil ? `<img src="${broker.fotoPerfil}" class="broker-avatar" alt="${brokerNome}">` : ''}
    <div class="broker-info">
      <h1>${brokerNome}</h1>
      <p>${brokerEmpresa}${brokerEmpresa && brokerTelefone ? ' &middot; ' : ''}${brokerTelefone}</p>
    </div>
  </div>
  <span class="client-tag">Im\u00f3veis para ${client.nome}</span>
</header>

<main class="catalog-grid">
${cards}
</main>

${detailModals}

<div id="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Galeria de fotos">
  <button id="lb-close" onclick="closeLightbox()" aria-label="Fechar">&times;</button>
  <button id="lb-prev" onclick="lbNav(-1)" aria-label="Foto anterior">&#8249;</button>
  <img id="lb-img" src="" alt="Foto ampliada">
  <div id="lb-counter"></div>
  <button id="lb-next" onclick="lbNav(1)" aria-label="Pr\u00f3xima foto">&#8250;</button>
</div>

<footer class="page-footer">
  ${brokerNome}${brokerEmpresa ? ' &middot; ' + brokerEmpresa : ''}${brokerEmail ? ' &middot; ' + brokerEmail : ''}
</footer>

<script>
const RATINGS_KEY = '${ratingsKey}';
const PRINT_CARDS = ${JSON.stringify(printCardsData)};
const BROKER_NOME = ${JSON.stringify(brokerNome)};
const BROKER_EMPRESA = ${JSON.stringify(brokerEmpresa)};
const BROKER_TELEFONE = ${JSON.stringify(brokerTelefone)};
const BROKER_EMAIL = ${JSON.stringify(brokerEmail)};
const CLIENT_NOME = ${JSON.stringify(client.nome)};

function openDetail(id) {
  document.getElementById('modal-' + id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDetail(id) {
  document.getElementById('modal-' + id)?.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', function(e) {
  if (document.getElementById('lightbox-overlay').classList.contains('lb-open')) return;
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

function saveRatings(ratings) {
  try { localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings)); } catch {}
}
function loadRatings() {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); } catch { return {}; }
}
function applyRatings() {
  const saved = loadRatings();
  document.querySelectorAll('.star').forEach(function(s) {
    const id = s.dataset.id;
    const val = parseInt(s.dataset.val);
    const cur = saved[id] || 0;
    s.style.color = cur >= val ? '#facc15' : '#3f3f46';
  });
}
document.querySelectorAll('.star').forEach(function(star) {
  star.addEventListener('click', function() {
    const id = this.dataset.id;
    const val = parseInt(this.dataset.val);
    const ratings = loadRatings();
    ratings[id] = val;
    saveRatings(ratings);
    applyRatings();
  });
});
applyRatings();

function printCard(id) {
  const card = PRINT_CARDS.find(function(c){ return c.id === id; });
  if (!card) return;

  const now = new Date().toLocaleDateString('pt-BR');

  const specsHtml = card.specs
    .map(function(s) {
      return '<div class="ps"><strong>' + s[0] + '</strong><span>' + s[1] + '</span></div>';
    })
    .join('');

  const fotosPrincipal = card.imgSrc
    ? '<img src="' + card.imgSrc + '" class="foto-principal" alt="">'
    : '';

  const fotosExtras = card.fotos.length > 1
    ? '<div class="fotos-grid">' + card.fotos.slice(1).map(function(f) {
        return '<img src="' + f + '" alt="">';
      }).join('') + '</div>'
    : '';

  const htmlPdf = '<!DOCTYPE html>' +
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
    '.pdf-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8mm;padding-bottom:5mm;border-bottom:2px solid #e50914}' +
    '.pdf-broker{display:flex;flex-direction:column}' +
    '.pdf-broker-name{font-size:15px;font-weight:700;color:#111}' +
    '.pdf-broker-sub{font-size:11px;color:#666}' +
    '.pdf-date{font-size:10px;color:#999}' +
    'h2.pdf-title{font-size:22px;font-weight:700;color:#111;margin-bottom:3mm}' +
    '.pdf-price{font-size:20px;font-weight:700;color:#e50914;margin-bottom:6mm}' +
    '.foto-principal{width:100%;height:70mm;object-fit:cover;border-radius:4mm;margin-bottom:6mm}' +
    '.fotos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-bottom:6mm}' +
    '.fotos-grid img{width:100%;height:28mm;object-fit:cover;border-radius:2mm}' +
    '.pdf-specs{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-bottom:6mm}' +
    '.ps{background:#f4f4f5;border-radius:2mm;padding:3mm 4mm}' +
    '.ps strong{display:block;font-size:9px;color:#888;text-transform:uppercase;margin-bottom:1mm}' +
    '.ps span{font-size:12px;font-weight:600;color:#111}' +
    '.pdf-desc{font-size:11px;color:#555;line-height:1.6;margin-top:4mm}' +
    '.pdf-footer{margin-top:auto;padding-top:5mm;border-top:1px solid #e4e4e7;display:flex;justify-content:space-between;align-items:center}' +
    '.pdf-footer-broker{font-size:10px;color:#888}' +
    '.pdf-footer-compat{background:rgba(229,9,20,.1);color:#e50914;border-radius:10px;padding:2px 10px;font-size:11px;font-weight:700}' +
    '</style>' +
    '</head><body>' +
    '<div class="pagina">' +
    '<div class="pdf-header">' +
    '<div class="pdf-broker">' +
    '<span class="pdf-broker-name">' + BROKER_NOME + '</span>' +
    '<span class="pdf-broker-sub">' + BROKER_EMPRESA + (BROKER_EMPRESA && BROKER_TELEFONE ? ' \u00b7 ' : '') + BROKER_TELEFONE + '</span>' +
    '</div>' +
    '<span class="pdf-date">Gerado em ' + now + '</span>' +
    '</div>' +
    '<h2 class="pdf-title">' + card.titulo + '</h2>' +
    '<div class="pdf-price">R\u00a0' + Number(card.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>' +
    fotosPrincipal +
    '<div class="pdf-specs">' + specsHtml + '</div>' +
    (card.descricao ? '<p class="pdf-desc">' + card.descricao + '</p>' : '') +
    '<div class="pdf-footer">' +
    '<span class="pdf-footer-broker">' + BROKER_EMAIL + '</span>' +
    '<span class="pdf-footer-compat">' + card.compat + '% compat\u00edvel</span>' +
    '</div>' +
    '</div>' +
    (fotosExtras ? '<div class="pagina">' +
    '<div class="pdf-header">' +
    '<span class="pdf-broker-name">' + BROKER_NOME + '</span>' +
    '</div>' +
    '<h3 style="font-size:16px;font-weight:700;margin-bottom:5mm">Galeria de fotos</h3>' +
    fotosExtras +
    '</div>' : '') +
    '</body></html>';

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(htmlPdf);
  w.document.close();
  w.focus();
  setTimeout(function() { w.print(); }, 800);
}

/* ── LIGHTBOX ────────────────────────────────────────────────────────────── */
const LB_CATALOG = ${JSON.stringify(sorted.map(p => ({ id: p.id, fotos: p.fotos || [] })))};
let lbPhotos = [];
let lbIndex  = 0;
let lbStartX = 0;

function openLightbox(propId, idx) {
  const entry = LB_CATALOG.find(function(p){ return p.id === propId; });
  if (!entry || !entry.fotos.length) return;
  lbPhotos = entry.fotos;
  lbIndex  = idx || 0;
  lbRender();
  document.getElementById('lightbox-overlay').classList.add('lb-open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox-overlay').classList.remove('lb-open');
  document.body.style.overflow = '';
  lbPhotos = [];
}
function lbRender() {
  const img = document.getElementById('lb-img');
  img.style.opacity = '0';
  img.src = lbPhotos[lbIndex];
  img.onload = function(){ img.style.opacity = '1'; };
  document.getElementById('lb-counter').textContent =
    'Foto ' + (lbIndex + 1) + ' de ' + lbPhotos.length;
  document.getElementById('lb-prev').style.display = lbPhotos.length > 1 ? '' : 'none';
  document.getElementById('lb-next').style.display = lbPhotos.length > 1 ? '' : 'none';
}
function lbNav(dir) {
  lbIndex = (lbIndex + dir + lbPhotos.length) % lbPhotos.length;
  lbRender();
}
// Teclado: setas + ESC (ESC fecha lightbox primeiro se estiver aberto)
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('lightbox-overlay').classList.contains('lb-open')) return;
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'Escape')     closeLightbox();
});
// Swipe mobile
document.getElementById('lightbox-overlay').addEventListener('touchstart', function(e) {
  lbStartX = e.changedTouches[0].clientX;
}, { passive: true });
document.getElementById('lightbox-overlay').addEventListener('touchend', function(e) {
  const dx = e.changedTouches[0].clientX - lbStartX;
  if (Math.abs(dx) > 40) lbNav(dx < 0 ? 1 : -1);
});
// Fechar clicando no overlay fora da imagem
document.getElementById('lightbox-overlay').addEventListener('click', function(e) {
  if (e.target === document.getElementById('lightbox-overlay')) closeLightbox();
});
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
