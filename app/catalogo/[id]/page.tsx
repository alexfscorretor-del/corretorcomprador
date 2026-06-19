'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '@/lib/supabase';
import { calculateCompatibility } from '@/lib/compatibility';
import { X, ChevronLeft, ChevronRight, ExternalLink, Heart, MessageCircle } from 'lucide-react';

type Prop = {
  id: string; titulo: string; tipoImovel: string; preco: number; bairro: string;
  tamanho?: number; quartos?: number; suites?: number; banheiros?: number; vagas?: number;
  andar?: number | null; condominio?: number | null; predioNovo?: string; reformado?: string;
  mobiliado?: boolean; varanda?: boolean; areaLazer?: boolean; aceitaPet?: boolean;
  aceitaFinanciamento?: string; descricao?: string; link?: string; fotos?: string[]; rating?: number;
};

type ClientData = {
  id: string; nome: string; user_id?: string;
  tipoImovel?: string; precoMin?: number; precoMax?: number;
  bairro?: string; bairrosSecundarios?: string; tamanho?: number;
  quartosMin?: number; suitesMin?: number; banheirosMin?: number; vagasMin?: number;
  tipoVaga?: string; condominioMax?: number; prefAndar?: boolean; andarApartir?: number | null;
  novo?: string; reformado?: string; aceitaFinanciamento?: string;
  mobiliado?: string; varanda?: string; areaLazer?: string; aceitaPet?: string;
  properties?: Prop[];
};

type BrokerData = {
  nome: string; nomeExibicao?: string; telefone?: string; email?: string; empresa?: string;
};

/* ============================================================
   LIGHTBOX — Portal no document.body para escapar qualquer
   stacking context criado por overflow/transform/opacity
   ============================================================ */
function Lightbox({
  fotos, startIdx, onClose,
}: {
  fotos: string[]; startIdx: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const touchX = useRef<number | null>(null);

  const prev = useCallback(
    () => setIdx((i) => (i - 1 + fotos.length) % fotos.length),
    [fotos.length]
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % fotos.length),
    [fotos.length]
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [prev, next, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const content = (
    <div
      style={{
        /* position:fixed + inset:0 no body — não herda nenhum stacking context */
        position: 'fixed', inset: 0,
        zIndex: 2147483647,           /* máximo possível — acima de tudo */
        display: 'flex', flexDirection: 'column',
        background: 'rgba(0,0,0,0.97)',
        /* isolation:isolate garante que este elemento seja o root do seu próprio stacking */
        isolation: 'isolate',
      }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const d = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(d) > 40) d > 0 ? next() : prev();
        touchX.current = null;
      }}
    >
      <style>{`
        @keyframes lbIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        .lb-btn{background:rgba(255,255,255,0.12);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;transition:background .2s;}
        .lb-btn:hover{background:rgba(255,255,255,0.28);}
      `}</style>

      {/* barra superior */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: 'rgba(0,0,0,0.55)', flexShrink: 0,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600 }}>
          {idx + 1} / {fotos.length}
        </span>
        <button
          className="lb-btn"
          onClick={onClose}
          aria-label="Fechar galeria"
          style={{ width: 44, height: 44, borderRadius: '50%' }}
        >
          <X size={22} />
        </button>
      </div>

      {/* imagem principal */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', minHeight: 0, padding: '0 68px',
      }}>
        <button
          className="lb-btn"
          onClick={prev}
          aria-label="Foto anterior"
          style={{ position: 'absolute', left: 10, width: 52, height: 52, borderRadius: '50%' }}
        >
          <ChevronLeft size={30} />
        </button>

        <img
          key={idx}
          src={fotos[idx]}
          alt={`Foto ${idx + 1}`}
          style={{
            maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain', borderRadius: 12,
            animation: 'lbIn .22s ease',
            userSelect: 'none', pointerEvents: 'none',
          }}
          draggable={false}
        />

        <button
          className="lb-btn"
          onClick={next}
          aria-label="Próxima foto"
          style={{ position: 'absolute', right: 10, width: 52, height: 52, borderRadius: '50%' }}
        >
          <ChevronRight size={30} />
        </button>
      </div>

      {/* thumbnails */}
      {fotos.length > 1 && (
        <div style={{
          flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'center',
          overflowX: 'auto', padding: '10px 16px 18px',
          background: 'rgba(0,0,0,0.55)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.2) transparent',
        }}>
          {fotos.map((f, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ver foto ${i + 1}`}
              style={{
                flexShrink: 0, width: 60, height: 42,
                borderRadius: 8, overflow: 'hidden',
                border: 'none', cursor: 'pointer', padding: 0,
                outline: i === idx ? '2.5px solid #e50914' : '2.5px solid transparent',
                outlineOffset: 2,
                opacity: i === idx ? 1 : 0.45,
                transition: 'opacity .2s, outline-color .2s',
                background: 'transparent',
              }}
            >
              <img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Portal: injeta diretamente no <body> — fora de qualquer elemento com overflow, transform ou opacity
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}

/* ============================================================
   CARD DO CLIENTE
   ============================================================ */
function PropertyCardClient({
  prop, compatibility, brokerTelefone, ratings, onRate,
}: {
  prop: Prop; compatibility: number; brokerTelefone: string;
  ratings: Record<string, number>; onRate: (id: string, val: number) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [favorito, setFavorito] = useState(false);
  const r = ratings[prop.id] ?? prop.rating ?? 0;
  const fotos = prop.fotos ?? [];

  const specs: [string, string | number][] = [
    ['Tipo', prop.tipoImovel || '-'], ['Bairro', prop.bairro || '-'],
    ['Área', (prop.tamanho || '?') + ' m²'], ['Quartos', prop.quartos ?? '-'],
    ['Suítes', prop.suites ?? '-'], ['Banheiros', prop.banheiros ?? '-'],
    ['Vagas', prop.vagas ?? '-'], ['Andar', prop.andar ?? '-'],
    ['Condomínio', prop.condominio ? 'R$ ' + Number(prop.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
    ['Prédio Novo', prop.predioNovo || '-'], ['Reformado', prop.reformado || '-'],
    ['Mobiliado', prop.mobiliado ? 'Sim' : 'Não'],
    ['Varanda', prop.varanda ? 'Sim' : 'Não'],
    ['Área Lazer', prop.areaLazer ? 'Sim' : 'Não'],
    ['Pet', prop.aceitaPet ? 'Sim' : 'Não'],
    ['Financiamento', prop.aceitaFinanciamento || '-'],
  ];

  const handleInteresse = () => {
    if (!brokerTelefone) { alert('Contato do corretor não disponível.'); return; }
    const tel = brokerTelefone.replace(/\D/g, '');
    window.open(
      `https://wa.me/55${tel}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${prop.titulo}`)}`,
      '_blank'
    );
  };

  const openLightbox = (i: number) => {
    // Pequeno delay para garantir que o estado do modal já estabilizou
    setTimeout(() => setLightboxIdx(i), 0);
  };

  return (
    <>
      {/* ── CARD ── */}
      <div
        className="rounded-3xl p-4 cursor-pointer select-none"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(-5px)';
          el.style.boxShadow = '0 20px 25px -5px rgba(16,185,129,.2)';
          el.style.borderColor = 'rgba(16,185,129,.35)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
          el.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
        onClick={() => setShowDetail(true)}
      >
        <div
          className="relative w-full rounded-2xl overflow-hidden mb-4"
          style={{ aspectRatio: '16/9', background: '#1f2937' }}
        >
          {fotos[0]
            ? <img src={fotos[0]} alt={prop.titulo} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">📷</div>
          }
          <div
            className="absolute top-2 right-2 text-white text-xs font-bold px-2.5 py-1 rounded-xl"
            style={{ background: 'rgba(229,9,20,0.9)' }}
          >
            {compatibility}% Compatível
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFavorito((v) => !v); }}
            className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: favorito ? 'rgba(229,9,20,0.9)' : 'rgba(0,0,0,0.5)' }}
          >
            <Heart size={14} fill={favorito ? '#fff' : 'none'} stroke="#fff" />
          </button>
          {fotos.length > 1 && (
            <div
              className="absolute bottom-2 left-2 text-white text-xs font-semibold px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            >
              📷 {fotos.length} fotos
            </div>
          )}
        </div>

        <h4 className="font-semibold text-base text-white mb-1 leading-snug line-clamp-1">{prop.titulo}</h4>
        <p className="text-xl font-bold mb-1" style={{ color: '#ef4444' }}>
          R$ {Number(prop.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          {prop.bairro || '-'} • {prop.tamanho || '?'}m² • {prop.quartos ?? 0} qtos • {prop.vagas ?? 0} vaga(s)
        </p>

        <div className="flex gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              onClick={(e) => { e.stopPropagation(); onRate(prop.id, n); }}
              style={{ color: n <= r ? '#fbbf24' : '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '20px', lineHeight: 1 }}
            >★</button>
          ))}
        </div>

        <div className="pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); handleInteresse(); }}
            className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-2xl font-medium text-white"
            style={{ background: '#E50914', transition: 'background .2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#E50914')}
          >
            <MessageCircle size={13} /> Tenho interesse
          </button>
        </div>
      </div>

      {/* ── MODAL DETALHE ──
          ATENÇÃO: não usar overflow:hidden nem transform neste wrapper,
          pois criaria um stacking context que prenderia o Portal do Lightbox.
          O scroll é feito pelo inner box. */}
      {showDetail && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 500,
            padding: 16,
            /* SEM overflow:hidden aqui — o Portal do lightbox precisa escapar */
          }}
          onClick={() => setShowDetail(false)}
        >
          <div
            style={{
              background: '#181818',
              width: '100%', maxWidth: 860,
              borderRadius: 24,
              maxHeight: '92vh',
              overflowY: 'auto',   /* scroll APENAS no inner box */
              /* SEM transform/opacity animados aqui — evita stacking context */
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* hero foto */}
            <div
              style={{
                position: 'relative', width: '100%',
                aspectRatio: '16/6', background: '#1f2937',
                borderRadius: '24px 24px 0 0', overflow: 'hidden',
              }}
            >
              {fotos[0] ? (
                <img
                  src={fotos[0]} alt={prop.titulo}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }}
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                  title="Clique para ampliar"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: 48 }}>📷</div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #181818 0%, transparent 40%)', pointerEvents: 'none' }} />
              <button
                onClick={(e) => { e.stopPropagation(); setShowDetail(false); }}
                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <X size={20} />
              </button>
              <div
                style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(229,9,20,0.9)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 12 }}
              >
                {compatibility}% Compatível
              </div>
              {fotos.length > 1 && (
                <div
                  style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, backdropFilter: 'blur(4px)', cursor: 'zoom-in' }}
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                >
                  🔍 Ampliar · {fotos.length} fotos
                </div>
              )}
            </div>

            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{prop.titulo}</h2>
                  {prop.bairro && <p style={{ color: '#9ca3af', fontSize: 14 }}>{prop.bairro}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>
                    R$ {Number(prop.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {prop.condominio ? (
                    <p style={{ color: '#9ca3af', fontSize: 13 }}>
                      + R$ {Number(prop.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cond.
                    </p>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n} onClick={() => onRate(prop.id, n)}
                    style={{ color: n <= r ? '#fbbf24' : '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 28, lineHeight: 1 }}
                  >★</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button
                  onClick={handleInteresse}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 16, background: '#E50914', border: 'none', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background .2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#E50914')}
                >
                  <MessageCircle size={15} /> Tenho interesse
                </button>
                <button
                  onClick={() => setFavorito((v) => !v)}
                  style={{ padding: '12px 20px', borderRadius: 16, background: favorito ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${favorito ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.1)'}`, color: favorito ? '#ef4444' : '#9ca3af', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
                >
                  <Heart size={15} fill={favorito ? '#ef4444' : 'none'} />
                  {favorito ? 'Salvo' : 'Salvar'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 10, marginBottom: 24 }}>
                {specs.map(([label, val]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px' }}>
                    <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{val}</p>
                  </div>
                ))}
              </div>

              {prop.descricao && (
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px', marginBottom: 24 }}>
                  <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Descrição</p>
                  <p style={{ fontSize: 14, color: '#e4e4e7', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{prop.descricao}</p>
                </div>
              )}

              {prop.link && (
                <a
                  href={prop.link} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: 14, marginBottom: 24, textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#f87171')}
                >
                  <ExternalLink size={14} /> Ver anúncio original
                </a>
              )}

              {/* GALERIA — clique em qualquer thumb abre o lightbox */}
              {fotos.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Galeria ({fotos.length} foto{fotos.length !== 1 ? 's' : ''}) — clique para ampliar
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
                    {fotos.map((f, i) => (
                      <div
                        key={i}
                        style={{ aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }}
                        onClick={(e) => { e.stopPropagation(); openLightbox(i); }}
                        onMouseEnter={(e) => {
                          const img = e.currentTarget.querySelector('img') as HTMLImageElement | null;
                          if (img) img.style.transform = 'scale(1.07)';
                        }}
                        onMouseLeave={(e) => {
                          const img = e.currentTarget.querySelector('img') as HTMLImageElement | null;
                          if (img) img.style.transform = 'scale(1)';
                        }}
                      >
                        <img src={f} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .25s', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background .2s', fontSize: 20 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
                        >
                          <span style={{ opacity: 0, transition: 'opacity .2s' }}>🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDetail(false)}
                style={{ width: '100%', padding: '12px 0', borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e4e4e7', fontWeight: 500, fontSize: 14, cursor: 'pointer', transition: 'background .2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX via Portal — injeta no document.body, fora de qualquer stacking context */}
      {lightboxIdx !== null && fotos.length > 0 && (
        <Lightbox fotos={fotos} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}

/* ============================================================
   PÁGINA PRINCIPAL
   ============================================================ */
export default function CatalogPage() {
  const params = useParams();
  const clientId = params?.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [broker, setBroker] = useState<BrokerData | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      setLoading(true);
      const { data: clientRow, error } = await supabase
        .from('clients').select('*').eq('id', clientId).maybeSingle();
      if (error || !clientRow) { setNotFound(true); setLoading(false); return; }

      const { data: propsRows } = await supabase
        .from('properties').select('*')
        .eq('client_id', clientId).eq('archived', false)
        .order('created_at', { ascending: false });

      const properties: Prop[] = (propsRows || []).map((r: any) => ({
        id: r.id, titulo: r.titulo ?? '', tipoImovel: r.tipo_imovel ?? '',
        preco: Number(r.preco ?? 0), bairro: r.bairro ?? '',
        tamanho: r.area ?? undefined, quartos: r.quartos ?? undefined,
        suites: r.suites ?? undefined, banheiros: r.banheiros ?? undefined,
        vagas: r.vagas ?? undefined, andar: r.andar ?? null,
        condominio: r.condominio ?? null, predioNovo: r.predio_novo ?? '',
        reformado: r.reformado ?? '', mobiliado: r.mobiliado ?? false,
        varanda: r.varanda ?? false, areaLazer: r.area_lazer ?? false,
        aceitaPet: r.aceita_pet ?? false, aceitaFinanciamento: r.aceita_financiamento ?? '',
        descricao: r.descricao ?? '', link: r.link ?? '',
        fotos: r.fotos ?? [], rating: r.avaliacao ?? 0,
      }));

      const { data: brokerRow } = await supabase.from('brokers')
        .select('nome,nome_exibicao,telefone,email,empresa')
        .eq('user_id', clientRow.user_id).maybeSingle();

      setClient({
        id: clientRow.id, nome: clientRow.nome ?? '', user_id: clientRow.user_id,
        tipoImovel: clientRow.tipo_imovel ?? '',
        precoMin: clientRow.preco_min ?? undefined, precoMax: clientRow.preco_max ?? undefined,
        bairro: clientRow.bairro ?? '', bairrosSecundarios: clientRow.bairros_secundarios ?? '',
        tamanho: clientRow.tamanho ?? undefined, quartosMin: clientRow.quartos_min ?? undefined,
        suitesMin: clientRow.suites_min ?? undefined, banheirosMin: clientRow.banheiros_min ?? undefined,
        vagasMin: clientRow.vagas_min ?? undefined, tipoVaga: clientRow.tipo_vaga ?? '',
        condominioMax: clientRow.condominio_max ?? undefined, prefAndar: clientRow.pref_andar ?? false,
        andarApartir: clientRow.andar_apartir ?? null, novo: clientRow.novo ?? 'indiferente',
        reformado: clientRow.reformado ?? 'indiferente',
        aceitaFinanciamento: clientRow.aceita_financiamento ?? 'indiferente',
        mobiliado: clientRow.mobiliado ?? 'indiferente', varanda: clientRow.varanda ?? 'indiferente',
        areaLazer: clientRow.area_lazer ?? 'indiferente', aceitaPet: clientRow.aceita_pet ?? 'indiferente',
        properties,
      });

      setBroker({
        nome: brokerRow?.nome_exibicao || brokerRow?.nome || 'Corretor',
        nomeExibicao: brokerRow?.nome_exibicao ?? '',
        telefone: brokerRow?.telefone ?? '',
        email: brokerRow?.email ?? '',
        empresa: brokerRow?.empresa ?? '',
      });

      try {
        const saved = JSON.parse(localStorage.getItem(`ratings_${clientId}`) || '{}');
        setRatings(saved);
      } catch {}

      setLoading(false);
    };
    void load();
  }, [clientId]);

  const handleRate = useCallback(async (propId: string, val: number) => {
    setRatings((prev) => {
      const next = { ...prev, [propId]: val };
      try { localStorage.setItem(`ratings_${clientId}`, JSON.stringify(next)); } catch {}
      return next;
    });
    await supabase.from('properties').update({ avaliacao: val }).eq('id', propId);
  }, [clientId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e50914', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#71717a', fontSize: 14 }}>Carregando imóveis...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (notFound || !client) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#71717a' }}>Página não encontrada.</p>
    </div>
  );

  const sorted = [...(client.properties || [])].sort(
    (a, b) => calculateCompatibility(client as any, b as any) - calculateCompatibility(client as any, a as any)
  );
  const topProp = sorted[0];
  const topImg = topProp?.fotos?.[0] || '';
  const cpTop = topProp ? calculateCompatibility(client as any, topProp as any) : 0;
  const brokerNome = broker?.nomeExibicao || broker?.nome || 'Corretor';
  const brokerTelefone = broker?.telefone || '';

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden', background: '#111' }}>
        {topImg && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${topImg}')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(10,10,10,.93) 0%,rgba(10,10,10,.65) 50%,rgba(10,10,10,.35) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '48px 24px 56px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
          <div style={{ maxWidth: 580 }}>
            <p style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Seleção de imóveis preparada para você</p>
            <h1 style={{ fontSize: 'clamp(26px,5vw,48px)', fontWeight: 900, color: '#fff', lineHeight: 1.08, margin: 0 }}>
              {topProp?.titulo || 'Imóveis selecionados'}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: '#4ade80' }}>{cpTop}% Compatível</span>
              {topProp?.quartos != null && <span>{topProp.quartos} Quartos</span>}
              {topProp?.bairro && <span>{topProp.bairro}</span>}
            </div>
            <p style={{ marginTop: 10, color: '#d4d4d8', fontSize: 14 }}>Selecionados para {client.nome}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Corretor responsável</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 600, color: '#e50914', fontStyle: 'italic', lineHeight: 1.05, margin: 0 }}>
              {brokerNome}
            </p>
            {broker?.empresa && <p style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>{broker.empresa}</p>}
            {brokerTelefone && <p style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 600, marginTop: 4 }}>{brokerTelefone}</p>}
            {broker?.email && <p style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{broker.email}</p>}
            <div style={{ display: 'inline-block', marginTop: 12, borderRadius: 16, padding: '12px 18px', background: 'rgba(229,9,20,.12)', border: '1px solid rgba(229,9,20,.3)', textAlign: 'right' }}>
              <p style={{ fontSize: 38, fontWeight: 900, color: '#e50914', lineHeight: 1, margin: 0 }}>{cpTop}%</p>
              <p style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Compatibilidade</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        <p style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
          {sorted.length} imóvel{sorted.length !== 1 ? 's' : ''} selecionado{sorted.length !== 1 ? 's' : ''} para você
        </p>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#52525b' }}>
            <p style={{ fontSize: 18 }}>Nenhum imóvel disponível no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 20 }}>
            {sorted.map((prop) => (
              <PropertyCardClient
                key={prop.id}
                prop={prop}
                compatibility={calculateCompatibility(client as any, prop as any)}
                brokerTelefone={brokerTelefone}
                ratings={ratings}
                onRate={handleRate}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '40px 20px', marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: '#e50914', fontStyle: 'italic', marginBottom: 4 }}>{brokerNome}</p>
        {brokerTelefone && <p style={{ color: '#d4d4d8', fontSize: 14 }}>{brokerTelefone}</p>}
        {broker?.email && <p style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{broker.email}</p>}
        {broker?.empresa && <p style={{ color: '#52525b', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{broker.empresa}</p>}
        <p style={{ color: '#3f3f46', fontSize: 11, marginTop: 20 }}>Página gerada pelo Corretor Pro · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
