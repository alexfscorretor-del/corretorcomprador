'use client';
import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/types';
import { Pencil, Trash2, X, ExternalLink, ChevronLeft, ChevronRight, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';

// ─── DESIGN TOKENS (fonte única de verdade para ambos os contextos) ───────────
export const CARD_TOKENS = {
  radius:       '24px',        // border-radius do card
  radiusSm:     '16px',        // border-radius interno
  radiusXs:     '12px',        // border-radius menor (specs)
  imgAspect:    '16/9',        // proporção da thumbnail
  imgAspectHero:'16/6',        // proporção da imagem no modal
  pad:          '16px',        // padding interno do card
  gap:          '8px',         // gap entre elementos
  titleSize:    '15px',        // font-size título
  priceSize:    '20px',        // font-size preço
  metaSize:     '12px',        // font-size linha de atributos
  starSize:     '20px',        // tamanho das estrelas
  bg:           'rgba(255,255,255,0.05)',
  bgHover:      'rgba(255,255,255,0.08)',
  border:       'rgba(255,255,255,0.1)',
  borderHover:  'rgba(16,185,129,0.35)',
  shadowHover:  '0 20px 25px -5px rgba(16,185,129,.2)',
  red:          '#E50914',
  redHover:     '#b91c1c',
  redText:      '#ef4444',
  blur:         'blur(20px)',
  transition:   'all .3s cubic-bezier(.4,0,.2,1)',
} as const;

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type Variant = 'broker' | 'client';

interface ClientFeedback {
  liked?: boolean | null;   // true=gostei, false=não gostei, null=neutro
  favorited?: boolean;
  interested?: boolean;
}

interface Props {
  property: Property;
  compatibility?: number;
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
  onRating?: (p: Property, rating: number) => void;
  onFeedback?: (p: Property, fb: ClientFeedback) => void;
  readonly?: boolean;
  variant?: Variant;
}

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
function Lightbox({ fotos, startIdx, onClose }: { fotos: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  const total = fotos.length;

  const prev = useCallback(() => setIdx(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx(i => (i + 1) % total), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  // swipe touch
  let startX = 0;
  const onTouchStart = (e: React.TouchEvent) => { startX = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx < -50) next();
    if (dx >  50) prev();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.97)' }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/25 border-none rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-colors z-10"
      ><X size={22} /></button>

      {/* Prev */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 border-none rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-colors z-10"
        ><ChevronLeft size={30} /></button>
      )}

      {/* Image */}
      <img
        src={fotos[idx]}
        alt={`Foto ${idx + 1}`}
        className="max-w-[92vw] max-h-[86vh] rounded-xl object-contain select-none"
        style={{ transition: 'opacity .2s' }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />

      {/* Next */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 border-none rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-colors z-10"
        ><ChevronRight size={30} /></button>
      )}

      {/* Counter */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm px-4 py-1.5 rounded-full"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      >
        {idx + 1} de {total}
      </div>

      {/* Thumbnail strip (se > 1 foto) */}
      {total > 1 && (
        <div
          className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-1"
          onClick={e => e.stopPropagation()}
        >
          {fotos.map((f, i) => (
            <div
              key={i}
              className="shrink-0 w-14 h-10 rounded-lg overflow-hidden cursor-pointer transition-all"
              style={{ opacity: i === idx ? 1 : 0.45, border: i === idx ? '2px solid #E50914' : '2px solid transparent' }}
              onClick={() => setIdx(i)}
            >
              <img src={f} alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMPONENT PRINCIPAL ──────────────────────────────────────────────────────
export default function PropertyCard({
  property, compatibility, onEdit, onDelete, onRating, onFeedback,
  readonly = false, variant = 'broker'
}: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<ClientFeedback>({});
  const r = property.rating || 0;
  const fotos = property.fotos || [];
  const T = CARD_TOKENS;

  const isClient = variant === 'client';

  const specs: [string, string | number][] = [
    ['Tipo',          property.tipoImovel || '-'],
    ['Bairro',        property.bairro || '-'],
    ['\u00c1rea',         (property.tamanho || '?') + ' m\u00b2'],
    ['Quartos',       property.quartos ?? '-'],
    ['Su\u00edtes',       property.suites ?? '-'],
    ['Banheiros',     property.banheiros ?? '-'],
    ['Vagas',         property.vagas ?? '-'],
    ['Andar',         property.andar ?? '-'],
    ['Condom\u00ednio',    property.condominio ? 'R$ ' + Number(property.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
    ['Pr\u00e9dio Novo',   property.predioNovo || '-'],
    ['Reformado',     property.reformado || '-'],
    ['Mobiliado',     property.mobiliado ? 'Sim' : 'N\u00e3o'],
    ['Varanda',       property.varanda ? 'Sim' : 'N\u00e3o'],
    ['\u00c1rea Lazer',    property.areaLazer ? 'Sim' : 'N\u00e3o'],
    ['Pet',           property.aceitaPet ? 'Sim' : 'N\u00e3o'],
    ['Financiamento', property.aceitaFinanciamento || '-'],
  ];

  function setFb(partial: Partial<ClientFeedback>) {
    const next = { ...feedback, ...partial };
    setFeedback(next);
    onFeedback?.(property, next);
  }

  // ─── CARD ─────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="rounded-3xl cursor-pointer select-none"
        style={{
          background: T.bg,
          backdropFilter: T.blur,
          border: `1px solid ${T.border}`,
          transition: T.transition,
          padding: T.pad,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(-5px)';
          el.style.boxShadow = T.shadowHover;
          el.style.borderColor = T.borderHover;
          el.style.background = T.bgHover;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
          el.style.borderColor = T.border;
          el.style.background = T.bg;
        }}
        onClick={() => setShowDetail(true)}
      >
        {/* THUMBNAIL */}
        <div
          className="relative w-full overflow-hidden mb-4"
          style={{ aspectRatio: T.imgAspect, borderRadius: T.radiusSm, background: '#1f2937' }}
        >
          {fotos[0]
            ? <img src={fotos[0]} alt={property.titulo} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">📷</div>
          }
          {compatibility !== undefined && (
            <div
              className="absolute top-2 right-2 text-white text-xs font-bold px-2.5 py-1"
              style={{ background: 'rgba(229,9,20,0.9)', borderRadius: T.radiusXs }}
            >
              {compatibility}% Compat\u00edvel
            </div>
          )}
          {/* Favorito (só cliente) */}
          {isClient && (
            <button
              className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full border-none cursor-pointer transition-all"
              style={{ background: feedback.favorited ? '#E50914' : 'rgba(0,0,0,0.55)' }}
              onClick={e => { e.stopPropagation(); setFb({ favorited: !feedback.favorited }); }}
              title={feedback.favorited ? 'Remover favorito' : 'Favoritar'}
            >
              <Heart size={14} fill={feedback.favorited ? '#fff' : 'none'} color="#fff" />
            </button>
          )}
        </div>

        {/* INFO */}
        <h4 className="font-semibold text-white mb-1 leading-snug line-clamp-1" style={{ fontSize: T.titleSize }}>
          {property.titulo}
        </h4>
        <p className="font-bold mb-1" style={{ color: T.redText, fontSize: T.priceSize }}>
          R$ {Number(property.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-gray-400 mb-3" style={{ fontSize: T.metaSize }}>
          {property.bairro || '-'} \u2022 {property.tamanho || '?'}m\u00b2 \u2022 {property.quartos ?? 0} qtos \u2022 {property.vagas ?? 0} vaga(s)
        </p>

        {/* ESTRELAS */}
        <div className="flex gap-1 mb-3" onClick={e => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n}
              onClick={e => { e.stopPropagation(); onRating?.(property, n); }}
              style={{ color: n <= r ? '#fbbf24' : '#4b5563', background: 'none', border: 'none', cursor: onRating ? 'pointer' : 'default', padding: 0, fontSize: T.starSize, lineHeight: 1 }}
            >\u2605</button>
          ))}
        </div>

        {/* A\u00c7\u00d5ES INTERNAS — só broker */}
        {!readonly && !isClient && (
          <div className="flex gap-2 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <button
              onClick={e => { e.stopPropagation(); onEdit?.(property); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 font-medium text-white transition-colors"
              style={{ background: T.red, borderRadius: T.radiusSm, border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = T.redHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.red)}
            >
              <Pencil size={12} /> Editar
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete?.(property); }}
              className="px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              style={{ borderRadius: T.radiusSm, border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* A\u00c7\u00d5ES CLIENTE */}
        {isClient && (
          <div className="flex gap-2 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 font-semibold text-white transition-all"
              style={{
                background: feedback.liked === true ? '#16a34a' : 'rgba(255,255,255,0.08)',
                borderRadius: T.radiusSm, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer'
              }}
              onClick={e => { e.stopPropagation(); setFb({ liked: feedback.liked === true ? null : true }); }}
              onMouseEnter={e => { if (feedback.liked !== true) e.currentTarget.style.background = 'rgba(22,163,74,0.2)'; }}
              onMouseLeave={e => { if (feedback.liked !== true) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              <ThumbsUp size={12} /> Gostei
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 font-semibold text-white transition-all"
              style={{
                background: feedback.liked === false ? '#7f1d1d' : 'rgba(255,255,255,0.08)',
                borderRadius: T.radiusSm, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer'
              }}
              onClick={e => { e.stopPropagation(); setFb({ liked: feedback.liked === false ? null : false }); }}
              onMouseEnter={e => { if (feedback.liked !== false) e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
              onMouseLeave={e => { if (feedback.liked !== false) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              <ThumbsDown size={12} /> N\u00e3o gostei
            </button>
          </div>
        )}
      </div>

      {/* ─── MODAL DETALHE ─── */}
      {showDetail && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[110] p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowDetail(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl max-h-[92vh] overflow-auto"
            style={{ background: '#181818' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Hero foto */}
            <div
              className="relative w-full rounded-t-3xl overflow-hidden"
              style={{ aspectRatio: T.imgAspectHero, background: '#1f2937' }}
            >
              {fotos[0]
                ? <img src={fotos[0]} alt={property.titulo} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-6xl">📷</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              <button
                onClick={() => setShowDetail(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer"
              ><X size={20} /></button>
              {compatibility !== undefined && (
                <div
                  className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1.5"
                  style={{ background: 'rgba(229,9,20,0.9)', borderRadius: T.radiusXs }}
                >
                  {compatibility}% Compat\u00edvel
                </div>
              )}
            </div>

            <div className="p-6 md:p-8">
              {/* T\u00edtulo + pre\u00e7o */}
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{property.titulo}</h2>
                  {property.bairro && <p className="text-gray-400">{property.bairro}</p>}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: T.redText }}>
                    R$ {Number(property.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {property.condominio && (
                    <p className="text-gray-400 text-sm">
                      + R$ {Number(property.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cond.
                    </p>
                  )}
                </div>
              </div>

              {/* ESTRELAS MODAL */}
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => onRating?.(property, n)}
                    style={{ color: n <= r ? '#fbbf24' : '#4b5563', background: 'none', border: 'none', cursor: onRating ? 'pointer' : 'default', padding: 0, fontSize: '28px', lineHeight: 1 }}
                  >\u2605</button>
                ))}
              </div>

              {/* SPECS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {specs.map(([label, val]) => (
                  <div key={label} className="bg-white/5 border border-white/10 p-3" style={{ borderRadius: T.radiusXs }}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-white font-semibold text-sm">{val}</p>
                  </div>
                ))}
              </div>

              {/* DESCRI\u00c7\u00c3O */}
              {property.descricao && (
                <div className="bg-white/5 border border-white/10 p-4 mb-6" style={{ borderRadius: T.radiusXs }}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Descri\u00e7\u00e3o</p>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{property.descricao}</p>
                </div>
              )}

              {/* LINK ORIGINAL */}
              {property.link && (
                <a href={property.link} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mb-6 transition-colors"
                ><ExternalLink size={14} /> Ver an\u00fancio original</a>
              )}

              {/* GALERIA */}
              {fotos.length > 1 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                    Galeria \u2022 <span className="text-gray-500">{fotos.length} fotos \u2014 clique para ampliar</span>
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {fotos.map((f, i) => (
                      <div
                        key={i}
                        className="aspect-video rounded-xl overflow-hidden cursor-pointer transition-all hover:opacity-80 hover:scale-[1.03]"
                        onClick={() => setLbIdx(i)}
                        style={{ borderRadius: T.radiusXs }}
                      >
                        <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* A\u00c7\u00d5ES RODAP\u00c9 MODAL */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                {/* Broker: editar */}
                {!readonly && !isClient && (
                  <button
                    onClick={() => { setShowDetail(false); onEdit?.(property); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white transition-colors"
                    style={{ background: T.red, borderRadius: T.radiusSm, border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.redHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = T.red)}
                  ><Pencil size={14} /> Editar</button>
                )}
                {/* Cliente: feedback no modal */}
                {isClient && (
                  <>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white transition-all"
                      style={{
                        background: feedback.liked === true ? '#16a34a' : 'rgba(255,255,255,0.08)',
                        borderRadius: T.radiusSm, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer'
                      }}
                      onClick={() => setFb({ liked: feedback.liked === true ? null : true })}
                    ><ThumbsUp size={14} /> Gostei</button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white transition-all"
                      style={{
                        background: feedback.liked === false ? '#7f1d1d' : 'rgba(255,255,255,0.08)',
                        borderRadius: T.radiusSm, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer'
                      }}
                      onClick={() => setFb({ liked: feedback.liked === false ? null : false })}
                    ><ThumbsDown size={14} /> N\u00e3o gostei</button>
                  </>
                )}
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 transition-colors font-medium"
                  style={{ borderRadius: T.radiusSm, border: 'none', cursor: 'pointer', color: '#fff' }}
                >Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX ─── */}
      {lbIdx !== null && fotos.length > 0 && (
        <Lightbox fotos={fotos} startIdx={lbIdx} onClose={() => setLbIdx(null)} />
      )}
    </>
  );
}
