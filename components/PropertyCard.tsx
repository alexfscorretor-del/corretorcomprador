'use client';
import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/types';
import { Pencil, Trash2, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  property: Property;
  compatibility?: number;
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
  onRating?: (p: Property, rating: number) => void;
  readonly?: boolean;
}

export default function PropertyCard({ property, compatibility, onEdit, onDelete, onRating, readonly = false }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);
  const r = property.rating || 0;
  const fotos = property.fotos ?? [];
  const totalFotos = fotos.length;

  const openLightbox = useCallback((idx: number) => {
    if (totalFotos === 0) return;
    setPhotoIdx(idx);
  }, [totalFotos]);

  const closeLightbox = useCallback(() => setPhotoIdx(null), []);

  const prevPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPhotoIdx(prev => prev === null ? null : (prev - 1 + totalFotos) % totalFotos);
  }, [totalFotos]);

  const nextPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPhotoIdx(prev => prev === null ? null : (prev + 1) % totalFotos);
  }, [totalFotos]);

  useEffect(() => {
    if (photoIdx === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevPhoto();
      else if (e.key === 'ArrowRight') nextPhoto();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [photoIdx, prevPhoto, nextPhoto, closeLightbox]);

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
      {/* CARD */}
      <div
        className="rounded-3xl p-4 cursor-pointer select-none"
        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all .3s cubic-bezier(.4,0,.2,1)' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 20px 25px -5px rgba(16,185,129,.2)'; el.style.borderColor = 'rgba(16,185,129,.35)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        onClick={() => setShowDetail(true)}
      >
        <div className="relative w-full rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '16/9', background: '#1f2937' }}>
          {fotos[0]
            ? <img src={fotos[0]} alt={property.titulo} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">📷</div>
          }
          {compatibility !== undefined && (
            <div className="absolute top-2 right-2 text-white text-xs font-bold px-2.5 py-1 rounded-xl" style={{ background: 'rgba(229,9,20,0.9)' }}>
              {compatibility}% Compatível
            </div>
          )}
          {totalFotos > 1 && (
            <div className="absolute bottom-2 right-2 text-white text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.6)' }}>
              {totalFotos} fotos
            </div>
          )}
        </div>

        <h4 className="font-semibold text-base text-white mb-1 leading-snug line-clamp-1">{property.titulo}</h4>
        <p className="text-xl font-bold mb-1" style={{ color: '#ef4444' }}>
          R$ {Number(property.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          {property.bairro || '-'} • {property.tamanho || '?'}m² • {property.quartos ?? 0} qtos • {property.vagas ?? 0} vaga(s)
        </p>

        <div className="flex gap-1 mb-3" onClick={e => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={e => { e.stopPropagation(); onRating?.(property, n); }}
              style={{ color: n <= r ? '#fbbf24' : '#4b5563', background: 'none', border: 'none', cursor: onRating ? 'pointer' : 'default', padding: 0, fontSize: '20px', lineHeight: 1 }}>
              ★
            </button>
          ))}
        </div>

        {!readonly && (
          <div className="flex gap-2 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); onEdit?.(property); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-2xl font-medium text-white transition-colors"
              style={{ background: '#E50914' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
              onMouseLeave={e => (e.currentTarget.style.background = '#E50914')}>
              <Pencil size={12} /> Editar
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete?.(property); }}
              className="px-3 py-2.5 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* MODAL DETALHE */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-[#181818] w-full max-w-4xl rounded-3xl max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>

            {/* Imagem de capa — clicável para abrir lightbox */}
            <div
              className="relative w-full rounded-t-3xl overflow-hidden group"
              style={{ aspectRatio: '16/6', background: '#1f2937', cursor: totalFotos > 0 ? 'zoom-in' : 'default' }}
              onClick={() => totalFotos > 0 && openLightbox(0)}
            >
              {fotos[0]
                ? <img src={fotos[0]} alt={property.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-6xl">📷</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              {totalFotos > 0 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">🔍 Ampliar foto</span>
                </div>
              )}
              <button onClick={e => { e.stopPropagation(); setShowDetail(false); }}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <X size={20} />
              </button>
              {compatibility !== undefined && (
                <div className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(229,9,20,0.9)' }}>
                  {compatibility}% Compatível
                </div>
              )}
              {totalFotos > 1 && (
                <div className="absolute bottom-4 right-4 text-white text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  1 / {totalFotos}
                </div>
              )}
            </div>

            <div className="p-6 md:p-8">
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

              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => onRating?.(property, n)}
                    style={{ color: n <= r ? '#fbbf24' : '#4b5563', background: 'none', border: 'none', cursor: onRating ? 'pointer' : 'default', padding: 0, fontSize: '28px', lineHeight: 1 }}>
                    ★
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {specs.map(([label, val]) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-white font-semibold text-sm">{val}</p>
                  </div>
                ))}
              </div>

              {property.descricao && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Descrição</p>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{property.descricao}</p>
                </div>
              )}

              {property.link && (
                <a href={property.link} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mb-6 transition-colors">
                  <ExternalLink size={14} /> Ver anúncio original
                </a>
              )}

              {/* GALERIA COM LIGHTBOX */}
              {totalFotos > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                    Galeria {totalFotos > 1 ? `(${totalFotos} fotos — clique para ampliar)` : '(clique para ampliar)'}
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {fotos.map((f, i) => (
                      <div
                        key={i}
                        className="aspect-video rounded-xl overflow-hidden cursor-zoom-in hover:opacity-80 transition-opacity relative group"
                        onClick={() => openLightbox(i)}
                      >
                        <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                          <span className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                {!readonly && (
                  <button onClick={() => { setShowDetail(false); onEdit?.(property); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white transition-colors"
                    style={{ background: '#E50914' }}>
                    <Pencil size={14} /> Editar
                  </button>
                )}
                <button onClick={() => setShowDetail(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors font-medium">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX — foto ampliada com navegação */}
      {photoIdx !== null && totalFotos > 0 && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[300] p-4"
          onClick={closeLightbox}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {/* Botão fechar */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-white w-11 h-11 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            aria-label="Fechar"
          >
            <X size={22} />
          </button>

          {/* Contador */}
          {totalFotos > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)' }}>
              {photoIdx + 1} / {totalFotos}
            </div>
          )}

          {/* Botão anterior */}
          {totalFotos > 1 && (
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              aria-label="Foto anterior"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* Imagem ampliada */}
          <img
            src={fotos[photoIdx]}
            alt={`Foto ${photoIdx + 1}`}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain select-none"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
            draggable={false}
          />

          {/* Botão próximo */}
          {totalFotos > 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              aria-label="Próxima foto"
            >
              <ChevronRight size={26} />
            </button>
          )}

          {/* Miniaturas na base */}
          {totalFotos > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto py-1 px-2">
              {fotos.map((f, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setPhotoIdx(i); }}
                  className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                  style={{
                    width: 56,
                    height: 40,
                    border: i === photoIdx ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.2)',
                    opacity: i === photoIdx ? 1 : 0.6,
                    transform: i === photoIdx ? 'scale(1.1)' : 'scale(1)',
                  }}
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <img src={f} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
