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

  const brokerNome     = broker.nome     || 'Seu corretor';
  const brokerEmpresa  = broker.empresa  || '';
  const brokerTelefone = broker.telefone || '';
  const brokerEmail    = broker.email    || '';
  const brokerCreci    = broker.creci    || '';

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

  /* ─── MODAIS ───────────────────────────────────────────────────────────── */
  const detailModals = sorted
    .map((p) => {
      const cp = calculateCompatibility(client, p);
      const fotos = p.fotos || [];
      const fotosH = fotos.length
        ? `<div class="detail-photos">${fotos.map((f) => `<img src="${f}" alt="" loading="lazy">`).join('')}</div>`
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

  /* ─── PRINT CARDS DATA ─────────────────────────────────────────────────────────── */
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

  /* ─── HTML FINAL ───────────────────────────────────────────────────────── */
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
.hero{position:relative;background:#111;overflow:hidden;padding:60px 24px 50px}
${topImg ? `.hero::before{content:'';position:absolute;inset:0;background:url('${topImg}') center/cover no-repeat;opacity:.15;z-index:0}` : ''}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.92) 0%,rgba(10,10,10,.68) 45%,rgba(10,10,10,.3) 100%);z-index:0}
.hero-inner{position:relative;z-index:1;max-width:1180px;margin:0 auto;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:24px}
.hero-left{max-width:720px}
.hero-greeting{font-size:13px;color:#a1a1aa;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.hero-name{font-size:clamp(28px,5vw,48px);font-weight:700;color:#fff;line-height:1.05}
.hero-meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:14px;font-size:14px;font-weight:600;color:#f4f4f5}
.hero-meta .compat{color:#4ade80}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
.hero-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border-radius:14px;font-size:14px;font-weight:700;transition:.2s;cursor:pointer;border:none}
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
.detail-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:16px}
.detail-photos img{width:100%;height:140px;object-fit:cover;border-radius:10px}
.dspecs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.dspec strong{display:block;font-size:10px;color:#71717a;text-transform:uppercase;margin-bottom:2px}
.dspec span{font-size:13px;color:#e4e4e7}
.modal-desc{font-size:13px;color:#a1a1aa;line-height:1.6;border-left:3px solid #e50914;padding-left:12px}
.footer{border-top:1px solid #1c1c1e;padding:40px 24px;text-align:center}
.footer-broker{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#e50914;font-style:italic;margin-bottom:6px}
.footer-contact{font-size:14px;color:#e4e4e7;margin-top:4px}
.footer-email{font-size:12px;color:#a1a1aa;margin-top:4px}
.footer-empresa{font-size:12px;color:#71717a;margin-top:3px;letter-spacing:.04em;text-transform:uppercase}
.footer-creci{font-size:11px;color:#52525b;margin-top:3px}
@media(max-width:700px){
  .hero-inner{flex-direction:column;align-items:flex-start}
  .hero-right{text-align:left;align-items:flex-start;min-width:unset;max-width:unset}
  .hero-feat-name{max-width:none}
  .dspecs-grid{grid-template-columns:repeat(2,1fr)}
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
      ${brokerEmpresa  ? `<div class="hero-broker-sub">${brokerEmpresa}</div>` : ''}
      ${brokerTelefone ? `<div class="hero-broker-phone">${brokerTelefone}</div>` : ''}
      ${brokerEmail    ? `<div class="hero-broker-email">${brokerEmail}</div>` : ''}
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
  <div class="grid">${cards}</div>
</div>
${detailModals}
<footer class="footer">
  <div class="footer-broker">${brokerNome}</div>
  ${brokerTelefone ? `<div class="footer-contact">${brokerTelefone}</div>` : ''}
  ${brokerEmail    ? `<div class="footer-email">${brokerEmail}</div>` : ''}
  ${brokerEmpresa  ? `<div class="footer-empresa">${brokerEmpresa}</div>` : ''}
  ${brokerCreci    ? `<div class="footer-creci">CRECI: ${brokerCreci}</div>` : ''}
</footer>
<script>
const RATINGS_KEY = '${ratingsKey}';
const PRINT_CARDS = ${JSON.stringify(printCardsData)};
const BROKER_NOME = ${JSON.stringify(brokerNome)};
const BROKER_EMPRESA = ${JSON.stringify(brokerEmpresa)};
const BROKER_TELEFONE = ${JSON.stringify(brokerTelefone)};
const BROKER_EMAIL = ${JSON.stringify(brokerEmail)};
const CLIENT_NOME = ${JSON.stringify(client.nome)};
function openDetail(id){document.getElementById('modal-'+id)?.classList.add('open');document.body.style.overflow='hidden';}
function closeDetail(id){document.getElementById('modal-'+id)?.classList.remove('open');document.body.style.overflow='';}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';})}});
function saveRatings(r){try{localStorage.setItem(RATINGS_KEY,JSON.stringify(r));}catch{}}
function loadRatings(){try{return JSON.parse(localStorage.getItem(RATINGS_KEY)||'{}');}catch{return{};}}
function applyRatings(){const s=loadRatings();document.querySelectorAll('.star').forEach(st=>{const id=st.dataset.id;const v=parseInt(st.dataset.val);st.style.color=(s[id]||0)>=v?'#facc15':'#3f3f46';});}
document.querySelectorAll('.star').forEach(star=>{star.addEventListener('click',function(){const id=this.dataset.id;const v=parseInt(this.dataset.val);const r=loadRatings();r[id]=v;saveRatings(r);applyRatings();});});
applyRatings();
function printCard(id){
  const card=PRINT_CARDS.find(c=>c.id===id);
  if(!card)return;
  const now=new Date().toLocaleDateString('pt-BR');
  const specsHtml=card.specs.map(s=>'<div class="ps"><strong>'+s[0]+'</strong><span>'+s[1]+'</span></div>').join('');
  const fotosPrincipal=card.imgSrc?'<img src="'+card.imgSrc+'" class="foto-principal" alt="">' :'';
  const fotosExtras=card.fotos.length>1?'<div class="fotos-grid">'+card.fotos.slice(1).map(f=>'<img src="'+f+'" alt="">').join('')+'</div>':'';
  const htmlPdf='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>'+card.titulo+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#fff;color:#111}'+
    '@page{size:A4;margin:0}.pagina{width:210mm;min-height:297mm;padding:12mm 14mm;display:flex;flex-direction:column;page-break-after:always}.pagina:last-child{page-break-after:auto}'+
    '.cabecalho{background:#e50914;color:#fff;border-radius:12px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}'+
    '.cab-titulo{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin-bottom:4px}'+
    '.cab-bairro{font-size:26px;font-weight:700;line-height:1.1}.cab-para-label{font-size:10px;opacity:.75;text-align:right;margin-bottom:3px}.cab-para-nome{font-size:16px;font-weight:700;text-align:right}'+
    '.corretor-box{background:#f8f8f8;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}'+
    '.corretor-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:6px}'+
    '.corretor-nome{font-size:18px;font-weight:700;color:#111;margin-bottom:2px}.corretor-empresa{font-size:12px;color:#555;margin-bottom:4px}.corretor-contatos{font-size:12px;color:#333}'+
    '.compat-box{text-align:center;background:#e50914;color:#fff;border-radius:10px;padding:12px 20px;min-width:110px}'+
    '.compat-num{font-size:32px;font-weight:700;line-height:1}.compat-label{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.85;margin-top:2px}'+
    '.preco-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.preco{font-size:28px;font-weight:700;color:#e50914}.titulo-imovel{font-size:14px;font-weight:600;color:#333}'+
    '.foto-principal{width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-bottom:14px}'+
    '.specs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}'+
    '.ps{background:#f8f8f8;border-radius:8px;padding:8px 10px}.ps strong{display:block;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:3px}.ps span{font-size:13px;font-weight:600;color:#111}'+
    '.fotos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px}.fotos-grid img{width:100%;height:90px;object-fit:cover;border-radius:8px}'+
    '.descricao{font-size:12px;color:#444;line-height:1.6;border-left:3px solid #e50914;padding-left:10px;margin-bottom:14px}'+
    '.rodape{margin-top:auto;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#888}.rodape-marca{font-size:13px;font-weight:700;color:#e50914}'+
    '.p2-atendimento{background:#f8f8f8;border-radius:10px;padding:18px 22px;margin-bottom:20px}'+
    '.p2-at-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:10px}.p2-at-nome{font-size:18px;font-weight:700;color:#111;margin-bottom:4px}.p2-at-contato{font-size:13px;color:#333;margin-bottom:2px}.p2-nota{font-size:11px;color:#888;line-height:1.6;margin-top:20px}'+
    '@media print{button{display:none!important}}</style></head><body>'+
    '<div class="pagina">'+
    '<div class="cabecalho"><div><div class="cab-titulo">Apresenta\u00e7\u00e3o de Im\u00f3vel</div><div class="cab-bairro">'+(card.bairro||card.titulo)+'</div></div>'+
    '<div><div class="cab-para-label">Para:</div><div class="cab-para-nome">'+CLIENT_NOME+'</div></div></div>'+
    '<div class="corretor-box"><div><div class="corretor-label">Corretor Respons\u00e1vel</div>'+
    '<div class="corretor-nome">'+BROKER_NOME+'</div>'+(BROKER_EMPRESA?'<div class="corretor-empresa">'+BROKER_EMPRESA+'</div>':'')+
    '<div class="corretor-contatos">'+(BROKER_EMAIL?BROKER_EMAIL+'<br>':'')+(BROKER_TELEFONE?BROKER_TELEFONE:'')+'</div></div>'+
    '<div class="compat-box"><div class="compat-num">'+card.cp+'%</div><div class="compat-label">Compatibilidade</div></div></div>'+
    '<div class="preco-row"><div class="preco">R\u00a0'+card.preco+'</div><div class="titulo-imovel">'+card.titulo+'</div></div>'+
    fotosPrincipal+
    '<div class="specs-grid">'+specsHtml+'</div>'+
    (card.descricao?'<div class="descricao">'+card.descricao+'</div>':'')+
    '<div class="rodape"><div><div class="rodape-marca">'+BROKER_NOME+'</div>'+(BROKER_TELEFONE?'<div>'+BROKER_TELEFONE+'</div>':'')+' </div><div>'+now+'</div></div>'+
    '</div>'+
    '<div class="pagina">'+
    '<div class="cabecalho"><div><div class="cab-titulo">Detalhes do Im\u00f3vel</div><div class="cab-bairro">'+card.titulo+'</div></div>'+
    '<div><div class="cab-para-label">Para:</div><div class="cab-para-nome">'+CLIENT_NOME+'</div></div></div>'+
    (card.fotos.length>1?fotosExtras:'')+
    '<div class="p2-atendimento"><div class="p2-at-label">Atendimento</div><div class="p2-at-nome">'+BROKER_NOME+'</div>'+
    (BROKER_TELEFONE?'<div class="p2-at-contato">Contato: '+BROKER_TELEFONE+(BROKER_EMPRESA?' | '+BROKER_EMPRESA:'')+'</div>':'')+
    '<div class="p2-nota">Documento gerado para apresenta\u00e7\u00e3o do im\u00f3vel ao cliente.</div></div>'+
    '<div class="rodape"><div><div class="rodape-marca">'+BROKER_NOME+'</div></div><div>'+now+'</div></div>'+
    '</div></body></html>';
  const blob=new Blob([htmlPdf],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,'_blank');
  if(w){w.addEventListener('load',function(){setTimeout(function(){w.print();},600)});}
  setTimeout(function(){URL.revokeObjectURL(url);},120000);
}
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}
