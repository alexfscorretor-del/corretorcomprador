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

  /* ─── CARDS (mesma estrutura visual do PropertyCard interno) ──────────── */
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
<div class="card" data-id="${p.id}" onclick="openDetail('${p.id}')" tabindex="0" role="button" aria-label="Ver detalhes de ${p.titulo}">
  <div class="card-img-wrap">
    ${imgSrc
      ? `<img src="${imgSrc}" class="card-img" alt="${p.titulo}" loading="lazy">`
      : '<div class="card-img-placeholder"></div>'
    }
    ${cp !== undefined ? `<div class="compat-badge">${cp}% Compat\u00edvel</div>` : ''}
  </div>
  <div class="card-body">
    <h3 class="card-title">${p.titulo}</h3>
    <p class="card-price">R$\u00a0${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    <p class="card-meta">${p.bairro || ''} \u2022 ${p.tamanho || '?'}m\u00b2 \u2022 ${p.quartos ?? 0} qtos \u2022 ${p.vagas ?? 0} vaga(s)</p>
    <div class="stars-row" onclick="event.stopPropagation()">${stars}</div>
    <div class="card-actions" onclick="event.stopPropagation()">
      <button class="btn-detail" onclick="openDetail('${p.id}')">&#x1F441; Ver detalhes</button>
      <button class="btn-favorite" id="fav-${p.id}" onclick="toggleFavorite('${p.id}', this)" title="Favoritar">&#x2665;</button>
    </div>
  </div>
</div>`;
    })
    .join('');

  /* ─── MODAIS (mesma estrutura do modal interno, sem ações de edição) ──── */
  const detailModals = sorted
    .map((p) => {
      const cp = calculateCompatibility(client, p);
      const fotos = p.fotos || [];

      // Galeria com lightbox integrado
      const fotosH = fotos.length
        ? `<div class="detail-gallery">${fotos.map((f, i) => `
<div class="gallery-thumb" onclick="openLightbox('${p.id}',${i})">
  <img src="${f}" alt="Foto ${i + 1}" loading="lazy">
  <div class="gallery-overlay">&#x1F441;</div>
</div>`).join('')}</div>`
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
<!-- Modal: ${p.id} -->
<div class="modal-overlay" id="modal-${p.id}" onclick="if(event.target===this)closeDetail('${p.id}')">
  <div class="modal-box">
    <!-- Hero image modal -->
    <div class="modal-hero" onclick="openLightbox('${p.id}', 0)" title="Clique para ampliar">
      ${ fotos[0] ? `<img src="${fotos[0]}" alt="${p.titulo}" class="modal-hero-img">` : '<div class="modal-hero-placeholder">\uD83D\uDCF7</div>' }
      <div class="modal-hero-gradient"></div>
      ${cp !== undefined ? `<div class="modal-compat-badge">${cp}% Compat\u00edvel</div>` : ''}
      <button class="modal-close" onclick="event.stopPropagation();closeDetail('${p.id}')" aria-label="Fechar">&#x2715;</button>
    </div>

    <div class="modal-content">
      <div class="modal-head">
        <div>
          <h2 class="modal-title">${p.titulo}</h2>
          ${p.bairro ? `<p class="modal-bairro">${p.bairro}</p>` : ''}
        </div>
        <div class="modal-price-block">
          <div class="modal-price">R$\u00a0${Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          ${p.condominio ? `<div class="modal-cond">+ R$\u00a0${Number(p.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cond.</div>` : ''}
        </div>
      </div>

      <!-- Stars -->
      <div class="modal-stars" onclick="event.stopPropagation()">
        ${[1,2,3,4,5].map(n=>`<span class="star modal-star" data-id="${p.id}" data-val="${n}" style="color:${ (p.rating||0)>=n?'#facc15':'#3f3f46' };cursor:pointer;font-size:26px;">&#9733;</span>`).join('')}
      </div>

      <!-- Specs -->
      <div class="dspecs-grid">${specsH}</div>

      ${p.descricao ? `<div class="modal-desc">${p.descricao}</div>` : ''}

      ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener noreferrer" class="modal-link">Ver an\u00fancio original &#x2197;</a>` : ''}

      <!-- Galeria thumbnails -->
      ${fotos.length > 0 ? `
      <div class="gallery-section">
        <p class="gallery-label">Galeria (${fotos.length} foto${fotos.length !== 1 ? 's' : ''})</p>
        ${fotosH}
      </div>` : ''}

      <!-- Ações do cliente -->
      <div class="modal-actions">
        <button class="btn-interest" onclick="sendInterest('${p.id}','${p.titulo}')">&#x1F44D; Tenho interesse</button>
        <button class="btn-fav-modal" id="fav-modal-${p.id}" onclick="toggleFavorite('${p.id}', this)">&#x2665; Favoritar</button>
        <button class="btn-close-modal" onclick="closeDetail('${p.id}')">Fechar</button>
      </div>
    </div>
  </div>
</div>

<!-- Lightbox: ${p.id} -->
<div class="lightbox" id="lb-${p.id}" onclick="if(event.target===this||event.target.classList.contains('lb-backdrop'))closeLightbox('${p.id}')">
  <div class="lb-backdrop"></div>
  <button class="lb-close" onclick="closeLightbox('${p.id}')" aria-label="Fechar galeria">&#x2715;</button>
  <div class="lb-counter" id="lb-counter-${p.id}">1 de ${fotos.length}</div>
  <button class="lb-prev" onclick="lbNav('${p.id}',-1)" aria-label="Anterior">&#10094;</button>
  <button class="lb-next" onclick="lbNav('${p.id}',1)" aria-label="Pr\u00f3xima">&#10095;</button>
  <div class="lb-img-wrap">
    <img id="lb-img-${p.id}" src="${fotos[0] || ''}" alt="" class="lb-img">
  </div>
  <div class="lb-thumbs" id="lb-thumbs-${p.id}">
    ${fotos.map((f, i) => `<button class="lb-thumb ${ i===0?'active':'' }" data-prop="${p.id}" data-idx="${i}" onclick="lbGoto('${p.id}',${i})" style="background-image:url('${f}')"></button>`).join('')}
  </div>
</div>`;
    })
    .join('');

  /* ─── DADOS PARA PDF ─────────────────────────────────────────────────── */
  const printCardsData = sorted.map((p) => {
    const cp = calculateCompatibility(client, p);
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
      imgSrc: p.fotos?.[0] || '',
      fotos: p.fotos || [],
      specs,
      descricao: p.descricao || '',
      link: p.link || '',
    };
  });

  /* ─── FOTOS POR PROPRIEDADE (para lightbox JS) ──────────────────────── */
  const fotosMap: Record<string, string[]> = {};
  sorted.forEach(p => { fotosMap[p.id] = p.fotos || []; });

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
/* ── RESET ── */
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e4e4e7;font-family:'Inter',sans-serif;min-height:100vh}

/* ── HERO ── */
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

/* ── GRID ── */
.section{max-width:1180px;margin:0 auto;padding:40px 20px}
.section-title{font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:20px}

/* ── CARD (espelha CARD_TOKENS do PropertyCard.tsx) ── */
.card{
  background:rgba(255,255,255,0.05);
  backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:24px;
  padding:16px;
  cursor:pointer;
  transition:transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s,border-color .3s;
  outline:none;
}
.card:hover{transform:translateY(-5px);box-shadow:0 20px 25px -5px rgba(16,185,129,.2);border-color:rgba(16,185,129,.35)}
.card:focus-visible{outline:2px solid #e50914;outline-offset:2px}
.card-img-wrap{position:relative;width:100%;border-radius:16px;overflow:hidden;margin-bottom:16px;aspect-ratio:16/9;background:#1f2937}
.card-img{width:100%;height:100%;object-fit:cover;display:block}
.card-img-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:#52525b}
.compat-badge{position:absolute;top:8px;right:8px;background:rgba(229,9,20,0.9);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;z-index:2}
.card-body{}
.card-title{font-size:15px;font-weight:600;color:#fff;margin-bottom:4px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-price{font-size:20px;font-weight:700;color:#ef4444;margin-bottom:4px}
.card-meta{font-size:12px;color:#9ca3af;margin-bottom:12px}
.stars-row{margin:8px 0 12px;user-select:none}
.card-actions{display:flex;gap:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.btn-detail{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:16px;border:none;background:#E50914;color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:background .2s}
.btn-detail:hover{background:#b91c1c}
.btn-favorite{padding:10px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#9ca3af;font-size:16px;cursor:pointer;transition:all .2s}
.btn-favorite:hover,.btn-favorite.active{color:#ef4444;border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.1)}

/* ── MODAL ── */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:200;overflow-y:auto;padding:16px;align-items:flex-start;justify-content:center}
.modal-overlay.open{display:flex}
.modal-box{background:#181818;border:1px solid rgba(255,255,255,.08);border-radius:24px;width:100%;max-width:800px;overflow:hidden;position:relative;margin:auto}

/* Hero do modal */
.modal-hero{position:relative;width:100%;aspect-ratio:16/6;background:#1f2937;cursor:pointer;overflow:hidden}
.modal-hero-img{width:100%;height:100%;object-fit:cover;display:block}
.modal-hero-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:60px;color:#52525b}
.modal-hero-gradient{position:absolute;inset:0;background:linear-gradient(to top,#181818,transparent 60%)}
.modal-compat-badge{position:absolute;top:16px;left:16px;background:rgba(229,9,20,.9);color:#fff;font-size:13px;font-weight:700;padding:6px 14px;border-radius:12px;z-index:2}
.modal-close{position:absolute;top:12px;right:12px;background:rgba(0,0,0,.6);border:none;color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:18px;z-index:3;display:flex;align-items:center;justify-content:center;transition:background .2s}
.modal-close:hover{background:rgba(0,0,0,.85)}

/* Conteúdo do modal */
.modal-content{padding:24px 28px 28px}
.modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap}
.modal-title{font-size:24px;font-weight:700;color:#fff;margin-bottom:4px}
.modal-bairro{font-size:14px;color:#9ca3af}
.modal-price-block{text-align:right}
.modal-price{font-size:28px;font-weight:700;color:#ef4444}
.modal-cond{font-size:13px;color:#9ca3af;margin-top:2px}
.modal-stars{margin-bottom:20px;user-select:none}

/* Specs */
.dspecs-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px}
@media(min-width:600px){.dspecs-grid{grid-template-columns:repeat(4,1fr)}}
.dspec{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:12px}
.dspec strong{display:block;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.dspec span{font-size:13px;color:#f4f4f5;font-weight:600}
.modal-desc{font-size:13px;color:#a1a1aa;line-height:1.6;border-left:3px solid #e50914;padding-left:12px;margin-bottom:20px;background:rgba(255,255,255,.03);padding:14px 14px 14px 16px;border-radius:0 12px 12px 0}
.modal-link{display:inline-flex;align-items:center;gap:6px;color:#f87171;font-size:13px;text-decoration:none;margin-bottom:20px;transition:color .2s}
.modal-link:hover{color:#fca5a5}

/* Galeria no modal */
.gallery-section{margin-bottom:20px}
.gallery-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.detail-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(min-width:600px){.detail-gallery{grid-template-columns:repeat(4,1fr)}}
.gallery-thumb{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;cursor:pointer;}
.gallery-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
.gallery-thumb:hover img{transform:scale(1.05)}
.gallery-overlay{position:absolute;inset:0;background:rgba(0,0,0,.0);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;opacity:0;transition:all .2s}
.gallery-thumb:hover .gallery-overlay{background:rgba(0,0,0,.35);opacity:1}

/* Ações do modal cliente */
.modal-actions{display:flex;gap:10px;padding-top:20px;border-top:1px solid rgba(255,255,255,.08);flex-wrap:wrap}
.btn-interest{flex:1;min-width:120px;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border-radius:16px;border:none;background:#E50914;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s}
.btn-interest:hover{background:#b91c1c}
.btn-fav-modal{padding:12px 18px;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#9ca3af;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.btn-fav-modal:hover,.btn-fav-modal.active{color:#ef4444;border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.1)}
.btn-close-modal{flex:1;min-width:80px;padding:12px 16px;border-radius:16px;border:none;background:rgba(255,255,255,.08);color:#e4e4e7;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s}
.btn-close-modal:hover{background:rgba(255,255,255,.15)}

/* ── LIGHTBOX PREMIUM ── */
.lightbox{display:none;position:fixed;inset:0;z-index:500;}
.lightbox.open{display:flex;align-items:center;justify-content:center}
.lb-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.96)}
.lb-close{position:absolute;top:16px;right:16px;z-index:10;background:rgba(255,255,255,.12);border:none;color:#fff;width:42px;height:42px;border-radius:50%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;transition:background .2s}
.lb-close:hover{background:rgba(255,255,255,.25)}
.lb-counter{position:absolute;top:18px;left:50%;transform:translateX(-50%);z-index:10;background:rgba(0,0,0,.6);color:#fff;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;pointer-events:none;white-space:nowrap}
.lb-prev,.lb-next{position:absolute;top:50%;transform:translateY(-50%);z-index:10;background:rgba(255,255,255,.12);border:none;color:#fff;width:46px;height:46px;border-radius:50%;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;transition:background .2s}
.lb-prev{left:14px}
.lb-next{right:14px}
@media(min-width:768px){.lb-prev{left:28px}.lb-next{right:28px}}
.lb-prev:hover,.lb-next:hover{background:rgba(255,255,255,.28)}
.lb-img-wrap{position:relative;z-index:5;display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:60px 70px 90px}
.lb-img{max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;animation:lbFade .18s ease}
@keyframes lbFade{from{opacity:.3;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
.lb-thumbs{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;overflow-x:auto;max-width:90vw;padding:4px 8px;z-index:10;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}
.lb-thumb{flex-shrink:0;width:48px;height:32px;border-radius:8px;border:2px solid transparent;background-size:cover;background-position:center;cursor:pointer;opacity:.5;transition:all .2s}
.lb-thumb.active{border-color:#fff;opacity:1}
.lb-thumb:hover{opacity:.8}

/* ── PRINT ── */
@media print{
  body{background:#fff;color:#111}
  .hero,.section-title,.hero-actions,.stars-row,.card-actions,.modal-overlay,.lightbox,footer{display:none!important}
  .grid{display:block}
  .card{break-inside:avoid;border:1px solid #ddd;background:#fff;margin-bottom:20px;page-break-inside:avoid}
  .card-img-wrap{border-radius:8px}
  .compat-badge{background:#fef2f2;color:#b91c1c;border-color:#fca5a5}
  .card-title,.card-price{color:#111}
  .card-meta{color:#555}
}

/* ── FOOTER ── */
.footer{border-top:1px solid #1c1c1e;padding:40px 24px;text-align:center}
.footer-broker{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#e50914;font-style:italic;margin-bottom:6px}
.footer-contact{font-size:14px;color:#e4e4e7;margin-top:4px}
.footer-email{font-size:12px;color:#a1a1aa;margin-top:4px}
.footer-empresa{font-size:12px;color:#71717a;margin-top:3px;letter-spacing:.04em;text-transform:uppercase}

@media(max-width:700px){
  .hero-inner{flex-direction:column;align-items:flex-start}
  .hero-right{text-align:left;align-items:flex-start;min-width:unset;max-width:unset}
  .hero-feat-name{max-width:none}
  .modal-content{padding:18px 18px 22px}
  .lb-prev{left:6px}.lb-next{right:6px}
  .lb-img-wrap{padding:52px 52px 80px}
}
</style>
</head>
<body>

<!-- HERO -->
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

<!-- GRID DE CARDS -->
<div class="section">
  <p class="section-title">Im\u00f3veis selecionados para voc\u00ea</p>
  <div class="grid" id="cards-grid">
    ${cards}
  </div>
</div>

<!-- MODAIS + LIGHTBOXES -->
${detailModals}

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-broker">${brokerNome}</div>
  ${brokerTelefone ? `<div class="footer-contact">${brokerTelefone}</div>` : ''}
  ${brokerEmail ? `<div class="footer-email">${brokerEmail}</div>` : ''}
  ${brokerEmpresa ? `<div class="footer-empresa">${brokerEmpresa}</div>` : ''}
</footer>

<script>
const RATINGS_KEY = '${ratingsKey}';
const FOTOS_MAP = ${JSON.stringify(fotosMap)};
const LB_STATE = {}; // { [propId]: currentIndex }
const PRINT_CARDS = ${JSON.stringify(printCardsData)};
const BROKER_NOME = ${JSON.stringify(brokerNome)};
const BROKER_EMPRESA = ${JSON.stringify(brokerEmpresa)};
const BROKER_TELEFONE = ${JSON.stringify(brokerTelefone)};
const BROKER_EMAIL = ${JSON.stringify(brokerEmail)};
const CLIENT_NOME = ${JSON.stringify(client.nome)};

// ── Modal ──
function openDetail(id) {
  const el = document.getElementById('modal-' + id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeDetail(id) {
  const el = document.getElementById('modal-' + id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

// ── Lightbox ──
function openLightbox(propId, startIdx) {
  const lb = document.getElementById('lb-' + propId);
  if (!lb) return;
  LB_STATE[propId] = startIdx || 0;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  lbRender(propId);
}
function closeLightbox(propId) {
  const lb = document.getElementById('lb-' + propId);
  if (lb) { lb.classList.remove('open'); document.body.style.overflow = ''; }
}
function lbRender(propId) {
  const fotos = FOTOS_MAP[propId] || [];
  const idx = LB_STATE[propId] || 0;
  const img = document.getElementById('lb-img-' + propId);
  const counter = document.getElementById('lb-counter-' + propId);
  if (img) { img.src = fotos[idx] || ''; img.style.animation = 'none'; img.offsetHeight; img.style.animation = ''; }
  if (counter) counter.textContent = (idx + 1) + ' de ' + fotos.length;
  const thumbs = document.querySelectorAll('#lb-thumbs-' + propId + ' .lb-thumb');
  thumbs.forEach(function(t, i) { t.classList.toggle('active', i === idx); });
}
function lbNav(propId, dir) {
  const fotos = FOTOS_MAP[propId] || [];
  if (!fotos.length) return;
  LB_STATE[propId] = ((LB_STATE[propId] || 0) + dir + fotos.length) % fotos.length;
  lbRender(propId);
}
function lbGoto(propId, idx) {
  LB_STATE[propId] = idx;
  lbRender(propId);
}

// Teclado
document.addEventListener('keydown', function(e) {
  // Fechar modais
  if (e.key === 'Escape') {
    document.querySelectorAll('.lightbox.open').forEach(function(lb) {
      var id = lb.id.replace('lb-', '');
      closeLightbox(id);
    });
    document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
      var id = m.id.replace('modal-', '');
      closeDetail(id);
    });
  }
  // Navegar lightbox
  var openLb = document.querySelector('.lightbox.open');
  if (openLb) {
    var pid = openLb.id.replace('lb-', '');
    if (e.key === 'ArrowLeft') lbNav(pid, -1);
    if (e.key === 'ArrowRight') lbNav(pid, 1);
  }
});

// Swipe no lightbox
var lbTouchStart = 0;
document.addEventListener('touchstart', function(e) {
  var openLb = document.querySelector('.lightbox.open');
  if (openLb) lbTouchStart = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', function(e) {
  var openLb = document.querySelector('.lightbox.open');
  if (!openLb) return;
  var diff = lbTouchStart - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    var pid = openLb.id.replace('lb-', '');
    lbNav(pid, diff > 0 ? 1 : -1);
  }
}, { passive: true });

// ── Stars ──
function saveRatings(r) { try { localStorage.setItem(RATINGS_KEY, JSON.stringify(r)); } catch {} }
function loadRatings() { try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); } catch { return {}; } }
function applyRatings() {
  var saved = loadRatings();
  document.querySelectorAll('.star').forEach(function(s) {
    var id = s.dataset.id, val = parseInt(s.dataset.val), cur = saved[id] || 0;
    s.style.color = cur >= val ? '#facc15' : '#3f3f46';
  });
}
document.querySelectorAll('.star').forEach(function(star) {
  star.addEventListener('click', function() {
    var ratings = loadRatings();
    ratings[this.dataset.id] = parseInt(this.dataset.val);
    saveRatings(ratings);
    applyRatings();
  });
});
applyRatings();

// ── Favoritos ──
function loadFavorites() { try { return JSON.parse(localStorage.getItem('favorites_${client.id}') || '{}'); } catch { return {}; } }
function saveFavorites(f) { try { localStorage.setItem('favorites_${client.id}', JSON.stringify(f)); } catch {} }
function applyFavorites() {
  var favs = loadFavorites();
  document.querySelectorAll('[id^="fav-"]').forEach(function(btn) {
    var id = btn.id.replace('fav-modal-','').replace('fav-','');
    btn.classList.toggle('active', !!favs[id]);
  });
}
function toggleFavorite(id, btn) {
  var favs = loadFavorites();
  favs[id] = !favs[id];
  saveFavorites(favs);
  applyFavorites();
}
applyFavorites();

// ── Interesse ──
function sendInterest(id, titulo) {
  var msg = 'Ol\u00e1! Tenho interesse no im\u00f3vel: ' + titulo;
  var tel = ${JSON.stringify(brokerTelefone)};
  if (tel) {
    var num = tel.replace(/\D/g,'');
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank');
  } else {
    alert('Interesse registrado: ' + titulo);
  }
}

// ── PDF por imóvel ──
function printCard(id) {
  var card = PRINT_CARDS.find(function(c) { return c.id === id; });
  if (!card) return;
  var now = new Date().toLocaleDateString('pt-BR');
  var specsHtml = card.specs.map(function(s) {
    return '<div class="ps"><strong>' + s[0] + '</strong><span>' + s[1] + '</span></div>';
  }).join('');
  var fotosPrincipal = card.imgSrc ? '<img src="' + card.imgSrc + '" class="foto-principal" alt="">' : '';
  var fotosExtras = card.fotos.length > 1
    ? '<div class="fotos-grid">' + card.fotos.slice(1).map(function(f) { return '<img src="' + f + '" alt="">'; }).join('') + '</div>'
    : '';
  var htmlPdf = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>' + card.titulo + '</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#fff;color:#111;padding:0}@page{size:A4;margin:0}.pagina{width:210mm;min-height:297mm;padding:12mm 14mm;display:flex;flex-direction:column;page-break-after:always}.pagina:last-child{page-break-after:auto}.cabecalho{background:#e50914;color:#fff;border-radius:12px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.cab-titulo{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin-bottom:4px}.cab-bairro{font-size:26px;font-weight:700;line-height:1.1}.cab-para-label{font-size:10px;opacity:.75;text-align:right;margin-bottom:3px}.cab-para-nome{font-size:16px;font-weight:700;text-align:right}.corretor-box{background:#f8f8f8;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.corretor-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:6px}.corretor-nome{font-size:18px;font-weight:700;color:#111;margin-bottom:2px}.corretor-empresa{font-size:12px;color:#555;margin-bottom:4px}.corretor-contatos{font-size:12px;color:#333}.compat-box{text-align:center;background:#e50914;color:#fff;border-radius:10px;padding:12px 20px;min-width:110px}.compat-num{font-size:32px;font-weight:700;line-height:1}.compat-label{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.85;margin-top:2px}.preco-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.preco{font-size:28px;font-weight:700;color:#e50914}.titulo-imovel{font-size:14px;font-weight:600;color:#333}.foto-principal{width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-bottom:14px}.specs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.ps{background:#f8f8f8;border-radius:8px;padding:8px 10px}.ps strong{display:block;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:3px}.ps span{font-size:13px;font-weight:600;color:#111}.fotos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px}.fotos-grid img{width:100%;height:90px;object-fit:cover;border-radius:8px}.descricao{font-size:12px;color:#444;line-height:1.6;border-left:3px solid #e50914;padding-left:10px;margin-bottom:14px}.rodape{margin-top:auto;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#888}.rodape-marca{font-size:13px;font-weight:700;color:#e50914}@media print{button{display:none!important}}</style>'
    + '</head><body>'
    + '<div class="pagina">'
    + '<div class="cabecalho"><div><div class="cab-titulo">Apresenta\u00e7\u00e3o de Im\u00f3vel</div><div class="cab-bairro">' + (card.bairro || card.titulo) + '</div></div><div><div class="cab-para-label">Para:</div><div class="cab-para-nome">' + CLIENT_NOME + '</div></div></div>'
    + '<div class="corretor-box"><div><div class="corretor-label">Corretor Respons\u00e1vel</div><div class="corretor-nome">' + BROKER_NOME + '</div>' + (BROKER_EMPRESA ? '<div class="corretor-empresa">' + BROKER_EMPRESA + '</div>' : '') + '<div class="corretor-contatos">' + (BROKER_EMAIL ? BROKER_EMAIL + '<br>' : '') + (BROKER_TELEFONE || '') + '</div></div><div class="compat-box"><div class="compat-num">' + card.cp + '%</div><div class="compat-label">Compatibilidade</div></div></div>'
    + '<div class="preco-row"><div class="preco">R$\u00a0' + card.preco + '</div><div class="titulo-imovel">' + card.titulo + '</div></div>'
    + fotosPrincipal
    + '<div class="specs-grid">' + specsHtml + '</div>'
    + (card.descricao ? '<div class="descricao">' + card.descricao + '</div>' : '')
    + '<div class="rodape"><div><div class="rodape-marca">' + BROKER_NOME + '</div>' + (BROKER_TELEFONE ? '<div>' + BROKER_TELEFONE + '</div>' : '') + '</div><div>' + now + '</div></div>'
    + '</div>'
    + (card.fotos.length > 1 ? '<div class="pagina"><div class="cabecalho"><div><div class="cab-titulo">Detalhes do Im\u00f3vel</div><div class="cab-bairro">' + card.titulo + '</div></div><div><div class="cab-para-label">Para:</div><div class="cab-para-nome">' + CLIENT_NOME + '</div></div></div>' + fotosExtras + '<div class="rodape"><div><div class="rodape-marca">' + BROKER_NOME + '</div></div><div>' + now + '</div></div></div>' : '')
    + '</body></html>';
  var blob = new Blob([htmlPdf], { type: 'text/html;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var w = window.open(url, '_blank');
  if (w) w.addEventListener('load', function() { setTimeout(function() { w.print(); }, 600); });
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
