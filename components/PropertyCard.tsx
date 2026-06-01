'use client';
import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/types';
import { Pencil, Trash2, X, ExternalLink, ChevronLeft, ChevronRight, Heart, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';

// ─── TOKENS VISUAIS COMPARTILHADOS ──────────────────────────────────────────
export const CARD_TOKENS = {
  borderRadius: '24px',
  borderRadiusInner: '16px',
  padding: '16px',
  imageAspectRatio: '16/9',
  imageBackground: '#1f2937',
  gap: '16px',
  titleSize: '15px',
  priceSize: '20px',
  metaSize: '12px',
  background: 'rgba(255,255,255,0.05)',
  backdrop: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  hoverBorder: 'rgba(16,185,129,.35)',
  hoverShadow: '0 20px 25px -5px rgba(16,185,129,.2)',
  accentColor: '#E50914',
  accentColorHover: '#b91c1c',
  compatBg: 'rgba(229,9,20,0.9)',
};

// ─── LIGHTBOX ────────────────────────────────────────────────────────────────
function Lightbox({ fotos, startIndex, onClose }: { fotos: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx(i => (i - 1 + fotos.length) % fotos.length), [fotos.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % fotos.length), [fotos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  let startX = 0;
  const handleTouchStart = (e: React.TouchEvent) => { startX = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.96)' }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-sm font-medium px-4 py-1.5 rounded-full">
        {idx + 1} de {fotos.length}
      </div>

      {/* Prev */}
      {fotos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 md:left-6 z-10 bg-white/10 hover:bg-white/25 text-white w-11 h-11 rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <div className="w-full h-full flex items-center justify-center p-12 md:p-20" onClick={e => e.stopPropagation()}>
        <img
          key={idx}
          src={fotos[idx]}
          alt={`Foto ${idx + 1}`}
          className="max-w-full max-h-full object-contain rounded-xl"
          style={{ animation: 'fadeIn .18s ease' }}
        />
      </div>

      {/* Next */}
      {fotos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 md:right-6 z-10 bg-white/10 hover:bg-white/25 text-white w-11 h-11 rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Thumbnail strip */}
      {fotos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[90vw] px-2 pb-1">
          {fotos.map((f, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`flex-shrink-0 w-12 h-8 rounded-lg overflow-hidden transition-all border-2 ${
                i === idx ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
              }`}
            >
              <img src={f} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:.4;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── PROPS ───────────────────────────────────────────────────────────────────
interface Props {
  property: Property;
  compatibility?: number;
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
  onRating?: (p: Property, rating: number) => void;
  // 'broker' = tela interna (editar, deletar, PDF actions)
  // 'client' = página pública (avaliar, favoritar, interesse)
  variant?: 'broker' | 'client';
  /** @deprecated use variant='broker' para modo somente-leitura interno */
  readonly?: boolean;
  // ações do cliente
  onFavorite?: (p: Property) => void;
  onInterest?: (p: Property) => void;
  isFavorited?: boolean;
}

// ─── COMPONENTE ──────────────────────────────────────────────────────────────
export default function PropertyCard({
  property,
  compatibility,
  onEdit,
  onDelete,
  onRating,
  variant,
  readonly = false,
  onFavorite,
  onInterest,
  isFavorited = false,
}: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const r = property.rating || 0;

  // Determina contexto: se variant não passado, usa readonly legado
  const isClient = variant === 'client';
  const isBrokerReadonly = readonly && variant !== 'client';
  const showBrokerActions = !isClient && !isBrokerReadonly;

  const fotos = property.fotos || [];

  const specs: [string, string | number][] = [
    ['Tipo', property.tipoImovel || '-'],
    ['Bairro', property.bairro || '-'],
    ['Área', (property.tamanho || '?') + ' m²'],
    ['Quartos', property.quartos ?? '-'],
    ['Suítes', property.suites ?? '-'],
    ['Banheiros', property.banheiros ?? '-'],
    ['Vagas', property.vagas ?? '-'],
    ['Andar', property.andar ?? '-'],
    ['Condomínio', property.condominio ? 'R$ ' + Number(property.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
    ['Prédio Novo', property.predioNovo || '-'],
    ['Reformado', property.reformado || '-'],
    ['Mobiliado', property.mobiliado ? 'Sim' : 'Não'],
    ['Varanda', property.varanda ? 'Sim' : 'Não'],
    ['Área Lazer', property.areaLazer ? 'Sim' : 'Não'],
    ['Pet', property.aceitaPet ? 'Sim' : 'Não'],
    ['Financiamento', property.aceitaFinanciamento || '-'],
  ];

  return (
    <>
      {/* ─── CARD ──────────────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes de ${property.titulo}`}
        className="rounded-3xl p-4 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        style={{
          background: CARD_TOKENS.background,
          backdropFilter: CARD_TOKENS.backdrop,
          border: CARD_TOKENS.border,
          transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(-5px)';
          el.style.boxShadow = CARD_TOKENS.hoverShadow;
          el.style.borderColor = CARD_TOKENS.hoverBorder;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
          el.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
        onClick={() => setShowDetail(true)}
        onKeyDown={e => e.key === 'Enter' && setShowDetail(true)}
      >
        {/* Thumbnail */}
        <div
          className="relative w-full rounded-2xl overflow-hidden mb-4"
          style={{ aspectRatio: CARD_TOKENS.imageAspectRatio, background: CARD_TOKENS.imageBackground }}
        >
          {fotos[0]
            ? <img src={fotos[0]} alt={property.titulo} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">📷</div>
          }
          {compatibility !== undefined && (
            <div
              className="absolute top-2 right-2 text-white text-xs font-bold px-2.5 py-1 rounded-xl"
              style={{ background: CARD_TOKENS.compatBg }}
            >
              {compatibility}% Compatível
            </div>
          )}
          {isClient && isFavorited && (
            <div className="absolute top-2 left-2">
              <Heart size={18} fill="#ef4444" className="text-red-500" />
            </div>
          )}
        </div>

        {/* Title + Price */}
        <h4 className="font-semibold text-white mb-1 leading-snug line-clamp-1" style={{ fontSize: CARD_TOKENS.titleSize }}>
          {property.titulo}
        </h4>
        <p className="font-bold mb-1" style={{ fontSize: CARD_TOKENS.priceSize, color: '#ef4444' }}>
          R$ {Number(property.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-gray-400 mb-3" style={{ fontSize: CARD_TOKENS.metaSize }}>
          {property.bairro || '-'} • {property.tamanho || '?'}m² • {property.quartos ?? 0} qtos • {property.vagas ?? 0} vaga(s)
        </p>

        {/* Stars */}
        <div className="flex gap-1 mb-3" onClick={e => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={e => { e.stopPropagation(); onRating?.(property, n); }}
              style={{
                color: n <= r ? '#fbbf24' : '#4b5563',
                background: 'none', border: 'none',
                cursor: onRating ? 'pointer' : 'default',
                padding: 0, fontSize: '20px', lineHeight: 1,
              }}
              aria-label={`Avaliar ${n} estrela(s)`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Ações Broker */}
        {showBrokerActions && (
          <div className="flex gap-2 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <button
              onClick={e => { e.stopPropagation(); onEdit?.(property); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-2xl font-medium text-white transition-colors"
              style={{ background: CARD_TOKENS.accentColor }}
              onMouseEnter={e => (e.currentTarget.style.background = CARD_TOKENS.accentColorHover)}
              onMouseLeave={e => (e.currentTarget.style.background = CARD_TOKENS.accentColor)}
            >
              <Pencil size={12} /> Editar
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete?.(property); }}
              className="px-3 py-2.5 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Ações Client */}
        {isClient && (
          <div className="flex gap-2 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <button
              onClick={e => { e.stopPropagation(); setShowDetail(true); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-2xl font-medium text-white transition-colors"
              style={{ background: CARD_TOKENS.accentColor }}
              onMouseEnter={e => (e.currentTarget.style.background = CARD_TOKENS.accentColorHover)}
              onMouseLeave={e => (e.currentTarget.style.background = CARD_TOKENS.accentColor)}
            >
              <Eye size={12} /> Ver detalhes
            </button>
            <button
              onClick={e => { e.stopPropagation(); onFavorite?.(property); }}
              className={`px-3 py-2.5 rounded-2xl transition-colors ${
                isFavorited ? 'text-red-400 bg-red-500/15' : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
              }`}
              title={isFavorited ? 'Remover favorito' : 'Favoritar'}
            >
              <Heart size={14} fill={isFavorited ? '#ef4444' : 'none'} />
            </button>
          </div>
        )}
      </div>

      {/* ─── MODAL DETALHE ──────────────────────────────────────────────── */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-[#181818] w-full max-w-4xl rounded-3xl max-h-[92vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Hero image */}
            <div
              className="relative w-full rounded-t-3xl overflow-hidden"
              style={{ aspectRatio: '16/6', background: '#1f2937' }}
            >
              {fotos[0]
                ? <img src={fotos[0]} alt={property.titulo} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-6xl">📷</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              <button
                onClick={() => setShowDetail(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
              {compatibility !== undefined && (
                <div
                  className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(229,9,20,0.9)' }}
                >
                  {compatibility}% Compatível
                </div>
              )}
            </div>

            <div className="p-6 md:p-8">
              {/* Título + Preço */}
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{property.titulo}</h2>
                  {property.bairro && <p className="text-gray-400">{property.bairro}</p>}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                    R$ {Number(property.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {property.condominio ? (
                    <p className="text-gray-400 text-sm">
                      + R$ {Number(property.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cond.
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => onRating?.(property, n)}
                    style={{
                      color: n <= r ? '#fbbf24' : '#4b5563',
                      background: 'none', border: 'none',
                      cursor: onRating ? 'pointer' : 'default',
                      padding: 0, fontSize: '28px', lineHeight: 1,
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {specs.map(([label, val]) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-white font-semibold text-sm">{val}</p>
                  </div>
                ))}
              </div>

              {/* Descrição */}
              {property.descricao && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Descrição</p>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{property.descricao}</p>
                </div>
              )}

              {/* Link anúncio */}
              {property.link && (
                <a
                  href={property.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mb-6 transition-colors"
                >
                  <ExternalLink size={14} /> Ver anúncio original
                </a>
              )}

              {/* Galeria */}
              {fotos.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                    Galeria ({fotos.length} foto{fotos.length !== 1 ? 's' : ''})
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {fotos.map((f, i) => (
                      <div
                        key={i}
                        className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                        onClick={() => setLightboxIdx(i)}
                      >
                        <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações no modal */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                {showBrokerActions && (
                  <button
                    onClick={() => { setShowDetail(false); onEdit?.(property); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white transition-colors"
                    style={{ background: CARD_TOKENS.accentColor }}
                    onMouseEnter={e => (e.currentTarget.style.background = CARD_TOKENS.accentColorHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = CARD_TOKENS.accentColor)}
                  >
                    <Pencil size={14} /> Editar
                  </button>
                )}
                {isClient && (
                  <>
                    <button
                      onClick={() => onInterest?.(property)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white transition-colors"
                      style={{ background: CARD_TOKENS.accentColor }}
                      onMouseEnter={e => (e.currentTarget.style.background = CARD_TOKENS.accentColorHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = CARD_TOKENS.accentColor)}
                    >
                      <ThumbsUp size={14} /> Tenho interesse
                    </button>
                    <button
                      onClick={() => onFavorite?.(property)}
                      className={`px-5 py-3 rounded-2xl font-medium transition-colors flex items-center gap-2 ${
                        isFavorited ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <Heart size={14} fill={isFavorited ? '#ef4444' : 'none'} />
                      {isFavorited ? 'Favoritado' : 'Favoritar'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors font-medium text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX ───────────────────────────────────────────────────── */}
      {lightboxIdx !== null && fotos.length > 0 && (
        <Lightbox
          fotos={fotos}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}
