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

  const clientDataStr = btoa(
    unescape(encodeURIComponent(JSON.stringify({ ...client, properties: sorted })))
  );
  const brokerDataStr = btoa(unescape(encodeURIComponent(JSON.stringify(broker))));
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

  const cards = sorted
    .map((p) => {
      const cp = calculateCompatibility(client, p);
      const imgSrc = p.fotos?.[0] || '';
      const photoCount = (p.fotos || []).length;
      const stars = [1, 2, 3, 4, 5]
        .map(
          (n) =>
            `<span class="star" data-id="${p.id}" data-val="${n}" style="color:${
              (p.rating || 0) >= n ? '#facc15' : '#3f3f46'
            };font-size:20px;line-height:1;">★</span>`
        )
        .join('');

      return `
    <div class="card" data-id="${p.id}">
      <div class="card-media" onclick="openDetail('${p.id}')" style="cursor:pointer">
        ${
          imgSrc
            ? `<img src="${imgSrc}" class="card-img" alt="${p.titulo}" loading="lazy">`
            : '<div class="card-img-placeholder"></div>'
        }
        <span class="compat-badge">${cp}% Compatível</span>
        ${photoCount > 1 ? `<span class="photo-count-badge">📷 ${photoCount} fotos</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.titulo}</h3>
        <p class="card-price">R$ ${Number(p.preco).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}</p>
        <p class="card-meta">${p.bairro || '-'} • ${p.tamanho || '?'}m² • ${
        p.quartos ?? 0
      } qtos • ${p.vagas ?? 0} vaga(s)</p>
        <div class="stars-row" data-id="${p.id}">${stars}</div>
        <div class="card-actions">
          <button class="btn-detail" onclick="openDetail('${p.id}')">
            <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6h-2V6.41l-8.29 8.3-1.42-1.42 8.3-8.29H15V3Z"></path><path d="M5 5h7v2H7v10h10v-5h2v7H5V5Z"></path></svg>
            Ver detalhes
          </button>
          <button class="btn-pdf-card" onclick="printSingleProperty('${p.id}')">
            <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            PDF
          </button>
        </div>
      </div>
    </div>`;
    })
    .join('');

  // Monta os modais de detalhe com thumbnails clicaveis que abrem o lightbox
  const detailModals = sorted
    .map((p) => {
      const cp = calculateCompatibility(client, p);
      const fotos = p.fotos || [];

      const fotosH = fotos.length
        ? `<div class="detail-photos">${fotos
            .map(
              (f, i) =>
                `<div class="thumb-wrap" onclick="openLightbox('${p.id}',${i})" title="Ampliar foto">
                   <img src="${f}" alt="Foto ${i + 1}" loading="lazy">
                   <div class="thumb-zoom-hint">🔍</div>
                 </div>`
            )
            .join('')}</div>`
        : '';

      const specs: [string, string | number][] = [
        ['Tipo', p.tipoImovel || '-'],
        ['Bairro', p.bairro || '-'],
        ['Área', (p.tamanho || '?') + 'm²'],
        ['Quartos', p.quartos ?? '-'],
        ['Suítes', p.suites ?? '-'],
        ['Banheiros', p.banheiros ?? '-'],
        ['Vagas', p.vagas ?? '-'],
        ['Andar', p.andar ?? '-'],
        [
          'Condomínio',
          p.condominio
            ? 'R$ ' +
              Number(p.condominio).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })
            : '-',
        ],
        ['Prédio Novo', p.predioNovo || '-'],
        ['Reformado', p.reformado || '-'],
        ['Mobiliado', p.mobiliado ? 'Sim' : 'Não'],
        ['Varanda', p.varanda ? 'Sim' : 'Não'],
        ['Área Lazer', p.areaLazer ? 'Sim' : 'Não'],
        ['Pet', p.aceitaPet ? 'Sim' : 'Não'],
        ['Financiamento', p.aceitaFinanciamento || '-'],
      ];

      const specsH = specs
        .map(
          ([l, v]) => `<div class="dspec"><strong>${l}</strong><span>${v}</span></div>`
        )
        .join('');

      // Serializa fotos desse imovel para injecao no script do lightbox
      const fotosJson = JSON.stringify(fotos)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");

      const safeId = p.id.replace(/-/g, '_');

      return `
    <div class="modal-overlay" id="modal-${p.id}" onclick="if(event.target===this)closeDetail('${p.id}')">
      <div class="modal-box">
        <button class="modal-close" onclick="closeDetail('${p.id}')">&#10005;</button>
        <div class="modal-compat">${cp}% compatível</div>
        <h2 class="modal-title">${p.titulo}</h2>
        <div class="modal-price">R$ ${Number(p.preco).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}</div>
        ${fotosH}
        <div class="dspecs-grid">${specsH}</div>
        ${p.descricao ? `<div class="modal-desc">${p.descricao}</div>` : ''}
        ${
          p.link
            ? `<p style="margin:12px 0"><a href="${p.link}" target="_blank" rel="noopener noreferrer" style="color:#e50914">Ver anúncio &#8599;</a></p>`
            : ''
        }
      </div>
    </div>
    <div class="lightbox-overlay" id="lb-${p.id}" onclick="if(event.target===this||event.target.closest('.lightbox-overlay')===this&&!event.target.closest('.lb-img-wrap')&&!event.target.closest('.lb-nav')&&!event.target.closest('.lb-thumbs')&&!event.target.closest('.lb-close'))closeLightbox('${p.id}')">
      <button class="lb-close" onclick="closeLightbox('${p.id}')" aria-label="Fechar">&#10005;</button>
      <button class="lb-nav lb-prev" onclick="lbNav('${p.id}',-1)" aria-label="Anterior">&#8592;</button>
      <button class="lb-nav lb-next" onclick="lbNav('${p.id}',1)" aria-label="Próxima">&#8594;</button>
      <div class="lb-counter" id="lb-counter-${p.id}"></div>
      <div class="lb-img-wrap">
        <img class="lb-img" id="lb-img-${p.id}" src="" alt="">
      </div>
      <div class="lb-thumbs" id="lb-thumbs-${p.id}"></div>
    </div>
    <script>window['_lbf_${safeId}']=${fotosJson};<\/script>`;
    })
    .join('');

  const propertiesJsonStr = btoa(
    unescape(encodeURIComponent(JSON.stringify(sorted)))
  );

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Imóveis para ${client.nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e4e4e7;font-family:'Inter',sans-serif;min-height:100vh}
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
.hero-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border-radius:14px;text-decoration:none;font-size:14px;font-weight:700;transition:.2s}
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
.section{max-width:1180px;margin:0 auto;padding:40px 20px}
.section-title{font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:20px}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px;transition:transform .2s,box-shadow .2s,border-color .2s;backdrop-filter:blur(20px)}
.card:hover{transform:translateY(-5px);box-shadow:0 20px 25px -5px rgba(0,0,0,.35);border-color:rgba(255,255,255,.16)}
.card-media{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#1f2937;margin-bottom:16px}
.card-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
.card-media:hover .card-img{transform:scale(1.04)}
.card-img-placeholder{width:100%;height:100%;background:#27272a}
.compat-badge{position:absolute;top:8px;right:8px;background:rgba(229,9,20,.9);color:#fff;border-radius:12px;padding:4px 10px;font-size:12px;font-weight:700;line-height:1.2;box-shadow:0 8px 20px rgba(0,0,0,.25)}
.photo-count-badge{position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.7);color:#fff;border-radius:8px;padding:3px 8px;font-size:11px;font-weight:600;backdrop-filter:blur(4px)}
.card-body{padding:0}
.card-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-price{font-size:20px;font-weight:800;color:#ef4444;margin-bottom:6px;line-height:1.25}
.card-meta{font-size:12px;color:#a1a1aa;margin-bottom:10px;line-height:1.45}
.stars-row{display:flex;align-items:center;gap:3px;margin:8px 0 14px;user-select:none}
.card-actions{display:flex;gap:8px;flex-wrap:wrap}
.btn-detail{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 10px;border-radius:14px;border:0;background:#e50914;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s,transform .2s;min-width:0}
.btn-detail:hover{background:#b91c1c;transform:translateY(-1px)}
.btn-pdf-card{display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#e4e4e7;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s,border-color .2s,transform .2s;white-space:nowrap}
.btn-pdf-card:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);transform:translateY(-1px)}
.btn-icon{width:15px;height:15px;fill:currentColor;flex:0 0 auto}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;overflow-y:auto;padding:20px}
.modal-overlay.open{display:flex;align-items:flex-start;justify-content:center}
.modal-box{background:#18181b;border:1px solid #27272a;border-radius:20px;width:100%;max-width:700px;padding:28px;position:relative;margin:auto}
.modal-close{position:absolute;top:16px;right:16px;background:#27272a;border:none;color:#a1a1aa;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
.modal-close:hover{background:#3f3f46;color:#fff}
.modal-compat{display:inline-block;background:rgba(229,9,20,.15);color:#ff4d57;border:1px solid rgba(229,9,20,.3);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:10px}
.modal-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:6px}
.modal-price{font-size:26px;font-weight:700;color:#e50914;margin-bottom:16px}
/* Thumbnails */
.detail-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:16px}
.thumb-wrap{position:relative;border-radius:10px;overflow:hidden;cursor:pointer;aspect-ratio:4/3;background:#27272a}
.thumb-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s,filter .25s}
.thumb-wrap:hover img{transform:scale(1.07);filter:brightness(.65)}
.thumb-zoom-hint{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;opacity:0;transition:opacity .2s;pointer-events:none;background:rgba(0,0,0,.25)}
.thumb-wrap:hover .thumb-zoom-hint{opacity:1}
.dspecs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.dspec strong{display:block;font-size:10px;color:#71717a;text-transform:uppercase;margin-bottom:2px}
.dspec span{font-size:13px;color:#e4e4e7}
.modal-desc{font-size:13px;color:#a1a1aa;line-height:1.6;border-left:3px solid #e50914;padding-left:12px}
/* LIGHTBOX */
.lightbox-overlay{display:none;position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.97);flex-direction:column;align-items:center;justify-content:center}
.lightbox-overlay.lb-open{display:flex}
.lb-close{position:fixed;top:16px;right:20px;z-index:3100;background:rgba(255,255,255,.15);border:none;color:#fff;width:48px;height:48px;border-radius:50%;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;transition:background .2s}
.lb-close:hover{background:rgba(255,255,255,.3)}
.lb-counter{position:fixed;top:20px;left:50%;transform:translateX(-50%);color:#fff;font-size:14px;font-weight:600;background:rgba(0,0,0,.6);padding:5px 16px;border-radius:20px;z-index:3100;pointer-events:none}
.lb-nav{position:fixed;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;width:56px;height:56px;border-radius:50%;cursor:pointer;font-size:28px;display:flex;align-items:center;justify-content:center;z-index:3100;transition:background .2s}
.lb-nav:hover{background:rgba(255,255,255,.3)}
.lb-prev{left:16px}
.lb-next{right:16px}
.lb-img-wrap{flex:1;width:100%;display:flex;align-items:center;justify-content:center;padding:64px 80px 8px}
.lb-img{max-width:100%;max-height:calc(100vh - 170px);object-fit:contain;border-radius:8px;transition:opacity .15s}
.lb-thumbs{display:flex;gap:8px;padding:8px 16px 18px;overflow-x:auto;max-width:100%;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}
.lb-thumbs::-webkit-scrollbar{height:4px}
.lb-thumbs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:4px}
.lb-thumb{flex:0 0 72px;height:52px;border-radius:6px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .15s,opacity .15s;opacity:.55}
.lb-thumb:hover{opacity:.85}
.lb-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.lb-thumb.lb-active{border-color:#e50914;opacity:1}
/* Footer */
.footer{border-top:1px solid #1c1c1e;padding:40px 24px;text-align:center}
.footer-broker{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#e50914;font-style:italic;margin-bottom:6px}
.footer-contact{font-size:14px;color:#e4e4e7;margin-top:4px}
.footer-email{font-size:12px;color:#a1a1aa;margin-top:4px}
.footer-empresa{font-size:12px;color:#71717a;margin-top:3px;letter-spacing:.04em;text-transform:uppercase}
@media print{
  body>*:not(#print-single-overlay){display:none!important}
  #print-single-overlay{display:block!important;position:static!important;background:#fff!important;color:#111!important;padding:32px!important}
  .print-prop-title{font-size:24px;font-weight:700;margin-bottom:4px}
  .print-prop-price{font-size:20px;font-weight:700;color:#e50914;margin-bottom:12px}
  .print-prop-badge{display:inline-block;background:#e50914;color:#fff;border-radius:8px;padding:3px 10px;font-size:12px;font-weight:700;margin-bottom:12px}
  .print-prop-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
  .print-prop-photos img{width:100%;height:140px;object-fit:cover;border-radius:6px}
  .print-specs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px}
  .print-spec strong{display:block;font-size:9px;color:#71717a;text-transform:uppercase}
  .print-spec span{font-size:13px}
  .print-desc{font-size:12px;color:#555;line-height:1.6;border-left:3px solid #e50914;padding-left:10px;margin-top:8px}
  .print-broker-footer{margin-top:24px;border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#555}
  .print-broker-name{font-size:18px;font-weight:700;color:#e50914}
}
@media(max-width:700px){
  .hero-inner{flex-direction:column;align-items:flex-start}
  .hero-right{text-align:left;align-items:flex-start;min-width:unset;max-width:unset}
  .dspecs-grid{grid-template-columns:repeat(2,1fr)}
  .card-actions{flex-direction:column}
  .btn-detail,.btn-pdf-card{width:100%}
  .lb-img-wrap{padding:64px 12px 8px}
  .lb-prev{left:6px}
  .lb-next{right:6px}
  .lb-nav{width:42px;height:42px;font-size:22px}
}
</style>
</head>
<body>

<div class="hero">
  <div class="hero-inner">
    <div class="hero-left">
      <p class="hero-greeting">Seleção de imóveis preparada para você</p>
      <h1 class="hero-name">${topProp.titulo}</h1>
      <div class="hero-meta">
        <span class="compat">${cpTop}% Compatível</span>
        ${topProp.quartos != null ? `<span>${topProp.quartos} Quartos</span>` : ''}
        ${topProp.bairro ? `<span>${topProp.bairro}</span>` : ''}
      </div>
      <div class="hero-actions">
        <a href="javascript:void(0)" class="hero-btn hero-btn-primary" onclick="openDetail('${topProp.id}')">▶ Ver Detalhes</a>
        <a href="javascript:void(0)" class="hero-btn hero-btn-secondary" onclick="window.print()">📄 PDF</a>
      </div>
      <div class="hero-client-line">Selecionados para ${client.nome}</div>
    </div>
    <div class="hero-right">
      <div class="hero-broker-label">Corretor responsável</div>
      <div class="hero-broker-name">${brokerNome}</div>
      ${brokerEmpresa ? `<div class="hero-broker-sub">${brokerEmpresa}</div>` : ''}
      ${brokerTelefone ? `<div class="hero-broker-phone">${brokerTelefone}</div>` : ''}
      ${brokerEmail ? `<div class="hero-broker-email">${brokerEmail}</div>` : ''}
      <div class="hero-compat">
        <div class="hero-compat-num">${cpTop}%</div>
        <div class="hero-compat-label">Compatibilidade</div>
        <div class="hero-feat-title">Imóvel em destaque</div>
        <div class="hero-feat-name">${topProp.titulo}</div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <p class="section-title">Imóveis selecionados para você</p>
  <div class="grid" id="cards-grid">${cards}</div>
</div>

${detailModals}

<div id="print-single-overlay" style="display:none"></div>

<footer class="footer">
  <div class="footer-broker">${brokerNome}</div>
  ${brokerTelefone ? `<div class="footer-contact">${brokerTelefone}</div>` : ''}
  ${brokerEmail ? `<div class="footer-email">${brokerEmail}</div>` : ''}
  ${brokerEmpresa ? `<div class="footer-empresa">${brokerEmpresa}</div>` : ''}
</footer>

<script>
var RATINGS_KEY='${ratingsKey}';
var ALL_PROPERTIES=JSON.parse(decodeURIComponent(escape(atob('${propertiesJsonStr}'))));
var CLIENT_DATA=JSON.parse(decodeURIComponent(escape(atob('${clientDataStr}'))));
var BROKER_DATA=JSON.parse(decodeURIComponent(escape(atob('${brokerDataStr}'))));

/* Modal */
function openDetail(id){
  var el=document.getElementById('modal-'+id);
  if(el){el.classList.add('open');document.body.style.overflow='hidden';}
}
function closeDetail(id){
  var el=document.getElementById('modal-'+id);
  if(el){el.classList.remove('open');document.body.style.overflow='';}
}

/* Lightbox */
var _lb={id:null,idx:0,fotos:[]};
function openLightbox(propId,startIdx){
  var key='_lbf_'+propId.replace(/-/g,'_');
  var fotos=window[key]||[];
  if(!fotos.length)return;
  _lb.id=propId;_lb.fotos=fotos;_lb.idx=startIdx||0;
  _lbRender();
  var el=document.getElementById('lb-'+propId);
  if(el){el.classList.add('lb-open');document.body.style.overflow='hidden';}
}
function closeLightbox(propId){
  var el=document.getElementById('lb-'+propId);
  if(el)el.classList.remove('lb-open');
  document.body.style.overflow='';
  _lb.id=null;
}
function lbNav(propId,dir){
  if(_lb.id!==propId)return;
  _lb.idx=(_lb.idx+dir+_lb.fotos.length)%_lb.fotos.length;
  _lbRender();
}
function _lbRender(){
  var id=_lb.id;var fotos=_lb.fotos;var idx=_lb.idx;
  if(!id||!fotos.length)return;
  var imgEl=document.getElementById('lb-img-'+id);
  var cntEl=document.getElementById('lb-counter-'+id);
  var tEl=document.getElementById('lb-thumbs-'+id);
  if(imgEl){imgEl.style.opacity='0';setTimeout(function(){imgEl.src=fotos[idx];imgEl.style.opacity='1';},100);}
  if(cntEl)cntEl.textContent=(idx+1)+' / '+fotos.length;
  if(tEl){
    tEl.innerHTML=fotos.map(function(f,i){
      var active=i===idx?' lb-active':'';
      var diff=i-idx;
      return '<div class="lb-thumb'+active+'" onclick="lbNav(\u0027'+id+'\u0027,'+diff+')"><img src="'+f+'" alt=""></div>';
    }).join('');
    setTimeout(function(){
      var a=tEl.querySelector('.lb-active');
      if(a)a.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    },60);
  }
}
document.addEventListener('keydown',function(e){
  if(_lb.id){
    if(e.key==='Escape'){closeLightbox(_lb.id);return;}
    if(e.key==='ArrowRight'){lbNav(_lb.id,1);return;}
    if(e.key==='ArrowLeft'){lbNav(_lb.id,-1);return;}
  } else if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(function(m){
      m.classList.remove('open');document.body.style.overflow='';
    });
  }
});

/* Ratings */
function _saveR(r){try{localStorage.setItem(RATINGS_KEY,JSON.stringify(r));}catch{}}
function _loadR(){try{return JSON.parse(localStorage.getItem(RATINGS_KEY)||'{}');}catch{return{};}}
function _applyR(){
  var s=_loadR();
  document.querySelectorAll('.star').forEach(function(el){
    var id=el.dataset.id;var v=parseInt(el.dataset.val);
    el.style.color=(s[id]||0)>=v?'#facc15':'#3f3f46';
  });
}
document.querySelectorAll('.star').forEach(function(s){
  s.addEventListener('click',function(){
    var r=_loadR();r[this.dataset.id]=parseInt(this.dataset.val);
    _saveR(r);_applyR();
  });
});
_applyR();

/* PDF individual */
function printSingleProperty(id){
  var p=ALL_PROPERTIES.find(function(x){return x.id===id;});
  if(!p)return;
  var badge=document.querySelector('.card[data-id="'+id+'"] .compat-badge');
  var compat=badge?badge.textContent.replace('% Compatível','').trim():'';
  var fotos=p.fotos||[];
  var fH=fotos.length?'<div class="print-prop-photos">'+fotos.map(function(f){return'<img src="'+f+'" alt="">';}).join('')+'</div>':'';
  var specs=[['Tipo',p.tipoImovel||'-'],['Bairro',p.bairro||'-'],['Área',(p.tamanho||'?')+'m²'],['Quartos',p.quartos!=null?p.quartos:'-'],['Suítes',p.suites!=null?p.suites:'-'],['Banheiros',p.banheiros!=null?p.banheiros:'-'],['Vagas',p.vagas!=null?p.vagas:'-'],['Andar',p.andar!=null?p.andar:'-'],['Condomínio',p.condominio?'R$ '+Number(p.condominio).toLocaleString('pt-BR',{minimumFractionDigits:2}):'-'],['Prédio Novo',p.predioNovo||'-'],['Reformado',p.reformado||'-'],['Mobiliado',p.mobiliado?'Sim':'Não'],['Varanda',p.varanda?'Sim':'Não'],['Área Lazer',p.areaLazer?'Sim':'Não'],['Pet',p.aceitaPet?'Sim':'Não'],['Financiamento',p.aceitaFinanciamento||'-']];
  var sH='<div class="print-specs-grid">'+specs.map(function(s){return'<div class="print-spec"><strong>'+s[0]+'</strong><span>'+s[1]+'</span></div>';}).join('')+'</div>';
  var dH=p.descricao?'<div class="print-desc">'+p.descricao+'</div>':'';
  var lH=p.link?'<p style="margin-top:8px;font-size:12px">Anúncio: <a href="'+p.link+'">'+p.link+'</a></p>':'';
  var bH='<div class="print-broker-footer"><div class="print-broker-name">'+BROKER_DATA.nome+'</div>'+(BROKER_DATA.telefone?'<div>'+BROKER_DATA.telefone+'</div>':'')+(BROKER_DATA.email?'<div>'+BROKER_DATA.email+'</div>':'')+(BROKER_DATA.empresa?'<div>'+BROKER_DATA.empresa+'</div>':'')+'</div>';
  var ov=document.getElementById('print-single-overlay');
  ov.innerHTML=(compat?'<div class="print-prop-badge">'+compat+'% Compatível</div>':'')+'<div class="print-prop-title">'+p.titulo+'</div><div class="print-prop-price">R$ '+Number(p.preco).toLocaleString('pt-BR',{minimumFractionDigits:2})+'</div>'+fH+sH+dH+lH+bH;
  ov.style.display='block';window.print();ov.style.display='none';
}
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}
