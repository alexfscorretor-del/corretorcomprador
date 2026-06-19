import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { calculateCompatibility } from '@/lib/compatibility';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { clientId: string } }) {
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('nome')
    .eq('id', params.clientId)
    .single();
  return {
    title: client ? `Imóveis para ${client.nome}` : 'Catálogo de Imóveis',
  };
}

export default async function CatalogoPage({ params }: { params: { clientId: string } }) {
  const { clientId } = params;

  const { data: clientRow } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (!clientRow) notFound();

  const { data: propertiesRows } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('client_id', clientId)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  const { data: brokerRow } = await supabaseAdmin
    .from('brokers')
    .select('*')
    .eq('user_id', clientRow.user_id)
    .maybeSingle();

  const client = {
    id: clientRow.id,
    nome: clientRow.nome ?? '',
    tipoImovel: clientRow.tipo_imovel ?? '',
    precoMin: clientRow.preco_min ?? undefined,
    precoMax: clientRow.preco_max ?? undefined,
    orcamentoMin: clientRow.preco_min ?? undefined,
    orcamentoMax: clientRow.preco_max ?? undefined,
    bairro: clientRow.bairro ?? '',
    bairrosSecundarios: clientRow.bairros_secundarios ?? '',
    tamanho: clientRow.tamanho ?? undefined,
    quartosMin: clientRow.quartos_min ?? undefined,
    suitesMin: clientRow.suites_min ?? undefined,
    banheirosMin: clientRow.banheiros_min ?? undefined,
    vagasMin: clientRow.vagas_min ?? undefined,
    tipoVaga: clientRow.tipo_vaga ?? '',
    condominioMax: clientRow.condominio_max ?? undefined,
    prefAndar: clientRow.pref_andar ?? false,
    andarApartir: clientRow.andar_apartir ?? null,
    novo: clientRow.novo ?? 'indiferente',
    reformado: clientRow.reformado ?? 'indiferente',
    aceitaFinanciamento: clientRow.aceita_financiamento ?? 'indiferente',
    mobiliado: clientRow.mobiliado ?? 'indiferente',
    varanda: clientRow.varanda ?? 'indiferente',
    areaLazer: clientRow.area_lazer ?? 'indiferente',
    aceitaPet: clientRow.aceita_pet ?? 'indiferente',
    archived: clientRow.archived ?? false,
    statusNegocio: clientRow.status_negocio ?? 'em_andamento',
    observacoes: clientRow.observacoes ?? '',
    telefone: clientRow.telefone ?? '',
    email: clientRow.email ?? '',
    cpf: clientRow.cpf ?? '',
    aniversario: clientRow.aniversario ?? '',
    sexo: clientRow.sexo ?? '',
    estadoCivil: clientRow.estado_civil ?? '',
    temFilhos: clientRow.tem_filhos ?? false,
    quantFilhos: clientRow.quant_filhos ?? 0,
    prazo: clientRow.prazo ?? '',
    properties: [],
    createdAt: clientRow.created_at,
  } as any;

  const properties = (propertiesRows ?? []).map((row: any) => ({
    id: row.id,
    clientId: row.client_id,
    createdAt: row.created_at,
    titulo: row.titulo ?? '',
    tipoImovel: row.tipo_imovel ?? '',
    preco: Number(row.preco ?? 0),
    bairro: row.bairro ?? '',
    tamanho: row.area ?? undefined,
    quartos: row.quartos ?? undefined,
    suites: row.suites ?? undefined,
    banheiros: row.banheiros ?? undefined,
    vagas: row.vagas ?? undefined,
    tipoVagaCobertura: row.tipo_vaga_cobertura ?? '',
    tipoVagaModelo: row.tipo_vaga_modelo ?? '',
    andar: row.andar ?? null,
    condominio: row.condominio ?? null,
    predioNovo: row.predio_novo ?? '',
    reformado: row.reformado ?? '',
    aceitaFinanciamento: row.aceita_financiamento ?? '',
    mobiliado: row.mobiliado ?? false,
    varanda: row.varanda ?? false,
    areaLazer: row.area_lazer ?? false,
    aceitaPet: row.aceita_pet ?? false,
    descricao: row.descricao ?? '',
    favorito: row.favorito ?? false,
    rating: row.avaliacao ?? 0,
    link: '',
    fotos: row.fotos ?? [],
    status: 'disponivel',
    observacoes: row.endereco ?? '',
  }));

  client.properties = properties;

  const sorted = [...properties].sort(
    (a, b) => calculateCompatibility(client, b) - calculateCompatibility(client, a)
  );

  if (sorted.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontFamily: 'sans-serif' }}>
        <p>Nenhum imóvel disponível no momento.</p>
      </div>
    );
  }

  const brokerNome = brokerRow?.nome_exibicao || brokerRow?.nome || 'Corretor';
  const brokerTelefone = brokerRow?.telefone || '';
  const brokerEmail = brokerRow?.email || '';
  const brokerEmpresa = brokerRow?.empresa || '';

  const topProp = sorted[0];
  const cpTop = calculateCompatibility(client, topProp);
  const topImg = topProp.fotos?.[0] || '';
  const ratingsKey = `ratings_${clientId}`;

  const cards = sorted.map((p: any) => {
    const cp = calculateCompatibility(client, p);
    const imgSrc = p.fotos?.[0] || '';
    const extraCount = (p.fotos?.length || 0) - 1;
    const stars = [1,2,3,4,5].map((n) =>
      `<span class="star" data-id="${p.id}" data-val="${n}" style="color:${(p.rating||0)>=n?'#facc15':'#3f3f46'};font-size:20px;line-height:1;">★</span>`
    ).join('');
    return `
    <div class="card" data-id="${p.id}">
      <div class="card-media" onclick="openDetail('${p.id}')" style="cursor:pointer">
        ${ imgSrc
          ? `<img src="${imgSrc}" class="card-img" alt="${p.titulo}" loading="lazy">`
          : '<div class="card-img-placeholder"></div>'
        }
        <span class="compat-badge">${cp}% Compatível</span>
        ${ extraCount > 0 ? `<span class="photo-count">📷 +${extraCount} foto${extraCount>1?'s':''}</span>` : '' }
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.titulo}</h3>
        <p class="card-price">R$ ${Number(p.preco).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
        <p class="card-meta">${p.bairro||'-'} • ${p.tamanho||'?'}m² • ${p.quartos??0} qtos • ${p.vagas??0} vaga(s)</p>
        <div class="stars-row" data-id="${p.id}">${stars}</div>
        <div class="card-actions">
          <button class="btn-detail" onclick="openDetail('${p.id}')">
            <svg class="btn-icon" viewBox="0 0 24 24"><path d="M15 3h6v6h-2V6.41l-8.29 8.3-1.42-1.42 8.3-8.29H15V3Z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg>
            Ver detalhes
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  const detailModals = sorted.map((p: any) => {
    const cp = calculateCompatibility(client, p);
    const fotos = p.fotos || [];
    const fotosH = fotos.length
      ? fotos.map((f: string, i: number) =>
          `<img src="${f}" class="thumb" data-propid="${p.id}" data-idx="${i}" alt="Foto ${i+1}" loading="lazy" onclick="openLightbox('${p.id}',${i})">`
        ).join('')
      : '';
    const specs: [string, string|number][] = [
      ['Tipo', p.tipoImovel||'-'],['Bairro', p.bairro||'-'],
      ['Área', (p.tamanho||'?')+'m²'],['Quartos', p.quartos??'-'],
      ['Suítes', p.suites??'-'],['Banheiros', p.banheiros??'-'],
      ['Vagas', p.vagas??'-'],['Andar', p.andar??'-'],
      ['Condomínio', p.condominio ? 'R$ '+Number(p.condominio).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '-'],
      ['Prédio Novo', p.predioNovo||'-'],['Reformado', p.reformado||'-'],
      ['Mobiliado', p.mobiliado?'Sim':'Não'],['Varanda', p.varanda?'Sim':'Não'],
      ['Área Lazer', p.areaLazer?'Sim':'Não'],['Pet', p.aceitaPet?'Sim':'Não'],
      ['Financiamento', p.aceitaFinanciamento||'-'],
    ];
    const specsH = specs.map(([l,v]) =>
      `<div class="dspec"><strong>${l}</strong><span>${v}</span></div>`
    ).join('');
    return `
    <div class="modal-overlay" id="modal-${p.id}" onclick="if(event.target===this)closeDetail('${p.id}')">
      <div class="modal-box">
        <button class="modal-close" onclick="closeDetail('${p.id}')">✕</button>
        <div class="modal-compat">${cp}% compatível</div>
        <h2 class="modal-title">${p.titulo}</h2>
        <div class="modal-price">R$ ${Number(p.preco).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
        ${ fotos.length ? `<div class="detail-photos" id="thumbs-${p.id}">${fotosH}</div>` : '' }
        <div class="dspecs-grid">${specsH}</div>
        ${ p.descricao ? `<div class="modal-desc">${p.descricao}</div>` : '' }
        ${ p.link ? `<p style="margin:12px 0"><a href="${p.link}" target="_blank" rel="noopener noreferrer" style="color:#e50914">Ver anúncio ↗</a></p>` : '' }
      </div>
    </div>`;
  }).join('');

  const propertiesJson = JSON.stringify(sorted.map((p: any) => ({ id: p.id, fotos: p.fotos || [] })));

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Imóveis para ${client.nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#e4e4e7;font-family:'Inter',sans-serif;min-height:100vh}
.hero{position:relative;background:#111;overflow:hidden;padding:60px 24px 50px}
${topImg?`.hero::before{content:'';position:absolute;inset:0;background:url('${topImg}') center/cover no-repeat;opacity:.15;z-index:0}`:''}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.92) 0%,rgba(10,10,10,.68) 45%,rgba(10,10,10,.3) 100%);z-index:0}
.hero-inner{position:relative;z-index:1;max-width:1180px;margin:0 auto;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:24px}
.hero-left{max-width:720px}
.hero-greeting{font-size:13px;color:#a1a1aa;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.hero-name{font-family:'Inter',sans-serif;font-size:clamp(28px,5vw,48px);font-weight:700;color:#fff;line-height:1.05}
.hero-meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:14px;font-size:14px;font-weight:600;color:#f4f4f5}
.hero-meta .compat{color:#4ade80}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
.hero-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border-radius:14px;text-decoration:none;font-size:14px;font-weight:700;transition:.2s;border:0;cursor:pointer}
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
.photo-count{position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.65);color:#fff;border-radius:10px;padding:3px 9px;font-size:11px;font-weight:600;backdrop-filter:blur(4px)}
.card-body{padding:0}
.card-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-price{font-size:20px;font-weight:800;color:#ef4444;margin-bottom:6px;line-height:1.25}
.card-meta{font-size:12px;color:#a1a1aa;margin-bottom:10px;line-height:1.45}
.stars-row{display:flex;align-items:center;gap:3px;margin:8px 0 14px;user-select:none}
.card-actions{display:flex;gap:8px;flex-wrap:wrap}
.btn-detail{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 10px;border-radius:14px;border:0;background:#e50914;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s,transform .2s;min-width:0}
.btn-detail:hover{background:#b91c1c;transform:translateY(-1px)}
.btn-icon{width:15px;height:15px;fill:currentColor;flex:0 0 auto}

/* MODAL */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;overflow-y:auto;padding:20px}
.modal-overlay.open{display:flex;align-items:flex-start;justify-content:center}
.modal-box{background:#18181b;border:1px solid #27272a;border-radius:20px;width:100%;max-width:700px;padding:28px;position:relative;margin:auto}
.modal-close{position:absolute;top:16px;right:16px;background:#27272a;border:none;color:#a1a1aa;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
.modal-close:hover{background:#3f3f46;color:#fff}
.modal-compat{display:inline-block;background:rgba(229,9,20,.15);color:#ff4d57;border:1px solid rgba(229,9,20,.3);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;margin-bottom:10px}
.modal-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:6px}
.modal-price{font-size:26px;font-weight:700;color:#e50914;margin-bottom:16px}
.detail-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:16px}
.thumb{width:100%;height:120px;object-fit:cover;border-radius:10px;cursor:pointer;transition:opacity .2s,transform .2s,outline .15s}
.thumb:hover{opacity:.85;transform:scale(1.03);outline:2px solid #e50914}
.dspecs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.dspec strong{display:block;font-size:10px;color:#71717a;text-transform:uppercase;margin-bottom:2px}
.dspec span{font-size:13px;color:#e4e4e7}
.modal-desc{font-size:13px;color:#a1a1aa;line-height:1.6;border-left:3px solid #e50914;padding-left:12px}

/* LIGHTBOX */
#lightbox{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.97);flex-direction:column;align-items:center;justify-content:center}
#lightbox.active{display:flex}
#lb-counter{position:absolute;top:16px;left:50%;transform:translateX(-50%);color:#a1a1aa;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;letter-spacing:.04em}
#lb-close{position:absolute;top:16px;right:20px;background:rgba(255,255,255,.1);border:none;color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;transition:background .2s}
#lb-close:hover{background:rgba(255,255,255,.2)}
#lb-img{max-width:90vw;max-height:85vh;object-fit:contain;border-radius:8px;user-select:none;transition:opacity .18s}
#lb-img.fade{opacity:0}
#lb-prev,#lb-next{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.1);border:none;color:#fff;width:48px;height:48px;border-radius:50%;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;transition:background .2s;z-index:1}
#lb-prev{left:16px}
#lb-next{right:16px}
#lb-prev:hover,#lb-next:hover{background:rgba(255,255,255,.2)}
#lb-thumbs{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;max-width:90vw;overflow-x:auto;padding:4px}
.lb-thumb{width:52px;height:40px;object-fit:cover;border-radius:6px;cursor:pointer;opacity:.5;transition:opacity .2s,outline .15s;flex:0 0 auto}
.lb-thumb.active{opacity:1;outline:2px solid #e50914}

/* FOOTER */
.footer{border-top:1px solid #1c1c1e;padding:40px 24px;text-align:center}
.footer-broker{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#e50914;font-style:italic;margin-bottom:6px}
.footer-contact{font-size:14px;color:#e4e4e7;margin-top:4px}
.footer-email{font-size:12px;color:#a1a1aa;margin-top:4px}
.footer-empresa{font-size:12px;color:#71717a;margin-top:3px;letter-spacing:.04em;text-transform:uppercase}
@media(max-width:700px){
  .hero-inner{flex-direction:column;align-items:flex-start}
  .hero-right{text-align:left;align-items:flex-start;min-width:unset;max-width:unset}
  .dspecs-grid{grid-template-columns:repeat(2,1fr)}
  .card-actions{flex-direction:column}
  .btn-detail{width:100%}
  #lb-prev{left:6px}#lb-next{right:6px}
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
        <button class="hero-btn hero-btn-primary" onclick="openDetail('${topProp.id}')">▶ Ver Detalhes</button>
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
  <div class="grid">${cards}</div>
</div>

${detailModals}

<!-- LIGHTBOX -->
<div id="lightbox">
  <span id="lb-counter"></span>
  <button id="lb-close" onclick="closeLightbox()">✕</button>
  <button id="lb-prev" onclick="lbNav(-1)">&#8592;</button>
  <img id="lb-img" src="" alt="">
  <button id="lb-next" onclick="lbNav(1)">&#8594;</button>
  <div id="lb-thumbs"></div>
</div>

<footer class="footer">
  <div class="footer-broker">${brokerNome}</div>
  ${brokerTelefone ? `<div class="footer-contact">${brokerTelefone}</div>` : ''}
  ${brokerEmail ? `<div class="footer-email">${brokerEmail}</div>` : ''}
  ${brokerEmpresa ? `<div class="footer-empresa">${brokerEmpresa}</div>` : ''}
</footer>

<script>
const RATINGS_KEY = '${ratingsKey}';
const ALL_PROPS = ${propertiesJson};

function openDetail(id){
  document.getElementById('modal-'+id)?.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeDetail(id){
  document.getElementById('modal-'+id)?.classList.remove('open');
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    if(document.getElementById('lightbox').classList.contains('active')){
      closeLightbox();return;
    }
    document.querySelectorAll('.modal-overlay.open').forEach(function(m){
      m.classList.remove('open');document.body.style.overflow='';
    });
  }
  if(document.getElementById('lightbox').classList.contains('active')){
    if(e.key==='ArrowLeft')lbNav(-1);
    if(e.key==='ArrowRight')lbNav(1);
  }
});

// LIGHTBOX
var lbPropId=null,lbIdx=0,lbFotos=[];
function openLightbox(propId,idx){
  var prop=ALL_PROPS.find(function(p){return p.id===propId;});
  if(!prop||!prop.fotos||!prop.fotos.length)return;
  lbPropId=propId;lbFotos=prop.fotos;lbIdx=idx||0;
  renderLightbox();
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow='';
  // reabrir o modal do imovel
  if(lbPropId) document.getElementById('modal-'+lbPropId)?.classList.add('open');
}
function lbNav(dir){
  lbIdx=(lbIdx+dir+lbFotos.length)%lbFotos.length;
  var img=document.getElementById('lb-img');
  img.classList.add('fade');
  setTimeout(function(){renderLightbox(false);img.classList.remove('fade');},180);
}
function renderLightbox(updateThumbs){
  if(updateThumbs===undefined)updateThumbs=true;
  var img=document.getElementById('lb-img');
  img.src=lbFotos[lbIdx];
  document.getElementById('lb-counter').textContent=(lbIdx+1)+' / '+lbFotos.length;
  if(updateThumbs){
    var tc=document.getElementById('lb-thumbs');
    tc.innerHTML=lbFotos.map(function(f,i){
      return '<img class="lb-thumb'+(i===lbIdx?' active':'')+'" src="'+f+'" onclick="lbJump('+i+')" alt="Foto '+(i+1)+'">';
    }).join('');
  } else {
    document.querySelectorAll('.lb-thumb').forEach(function(t,i){
      t.classList.toggle('active',i===lbIdx);
    });
  }
}
function lbJump(idx){
  lbIdx=idx;
  var img=document.getElementById('lb-img');
  img.classList.add('fade');
  setTimeout(function(){renderLightbox(false);img.classList.remove('fade');},180);
}

// RATINGS
function saveRatings(r){try{localStorage.setItem(RATINGS_KEY,JSON.stringify(r));}catch{}}
function loadRatings(){try{return JSON.parse(localStorage.getItem(RATINGS_KEY)||'{}');}catch{return {};}}
function applyRatings(){
  var saved=loadRatings();
  document.querySelectorAll('.star').forEach(function(s){
    var id=s.dataset.id,val=parseInt(s.dataset.val),cur=saved[id]||0;
    s.style.color=cur>=val?'#facc15':'#3f3f46';
  });
}
document.querySelectorAll('.star').forEach(function(star){
  star.addEventListener('click',function(){
    var id=this.dataset.id,val=parseInt(this.dataset.val),ratings=loadRatings();
    ratings[id]=val;saveRatings(ratings);applyRatings();
  });
});
applyRatings();
<\/script>
</body>
</html>`;

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}
