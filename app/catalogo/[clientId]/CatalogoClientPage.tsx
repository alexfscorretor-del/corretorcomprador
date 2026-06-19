'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Home, MapPin, BedDouble, Car, Maximize2, Star } from 'lucide-react';

interface RawClient {
  id: string;
  nome: string;
  tipo_imovel?: string | null;
  preco_min?: number | null;
  preco_max?: number | null;
  bairro?: string | null;
  quartos_min?: number | null;
  [key: string]: unknown;
}

interface RawProperty {
  id: string;
  titulo: string;
  preco?: number | null;
  bairro?: string | null;
  area?: number | null;
  quartos?: number | null;
  suites?: number | null;
  vagas?: number | null;
  tipo_imovel?: string | null;
  descricao?: string | null;
  fotos?: string[] | null;
  avaliacao?: number | null;
  favorito?: boolean | null;
  [key: string]: unknown;
}

interface RawBroker {
  nome?: string | null;
  nome_exibicao?: string | null;
  telefone?: string | null;
  email?: string | null;
  empresa?: string | null;
  creci?: string | null;
}

interface CatalogoClientPageProps {
  client: RawClient;
  properties: RawProperty[];
  broker: RawBroker | null;
}

function fmt(n: number | null | undefined) {
  if (!n) return '-';
  return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function Lightbox({
  fotos,
  startIndex,
  onClose,
}: {
  fotos: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + fotos.length) % fotos.length), [fotos.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % fotos.length), [fotos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Contador */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-1.5 rounded-full z-10">
        {current + 1} / {fotos.length}
      </div>

      {/* Fechar */}
      <button
        className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full z-10 transition-colors"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X size={22} />
      </button>

      {/* Anterior */}
      {fotos.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-3 rounded-full z-10 transition-colors"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Foto principal */}
      <div className="flex items-center justify-center w-full h-full px-20" onClick={(e) => e.stopPropagation()}>
        <img
          key={current}
          src={fotos[current]}
          alt={`Foto ${current + 1}`}
          className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Próxima */}
      {fotos.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-3 rounded-full z-10 transition-colors"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Miniaturas */}
      {fotos.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4 pb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {fotos.map((f, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-red-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={f} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ prop }: { prop: RawProperty }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const fotos = prop.fotos?.filter(Boolean) || [];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100">
      {/* Foto principal */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {fotos.length > 0 ? (
          <>
            <img
              src={fotos[0]}
              alt={prop.titulo}
              className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300"
              onClick={() => setLightbox(0)}
            />
            {fotos.length > 1 && (
              <button
                onClick={() => setLightbox(0)}
                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Maximize2 size={11} />
                {fotos.length} fotos
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Home size={48} />
          </div>
        )}

        {prop.favorito && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" /> Destaque
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2">{prop.titulo}</h3>

        {prop.bairro && (
          <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
            <MapPin size={13} /> {prop.bairro}
          </p>
        )}

        <p className="text-2xl font-black text-red-600 mb-3">{fmt(prop.preco)}</p>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
          {prop.area && (
            <span className="flex items-center gap-1">
              <Maximize2 size={13} /> {prop.area}m²
            </span>
          )}
          {prop.quartos && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} /> {prop.quartos} {prop.suites ? `(${prop.suites} suítes)` : 'quartos'}
            </span>
          )}
          {prop.vagas && (
            <span className="flex items-center gap-1">
              <Car size={13} /> {prop.vagas} vaga{prop.vagas > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {prop.descricao && (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{prop.descricao}</p>
        )}

        {/* Miniaturas clicáveis */}
        {fotos.length > 1 && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {fotos.slice(0, 5).map((f, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-red-400 transition-colors"
              >
                <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {fotos.length > 5 && (
              <button
                onClick={() => setLightbox(5)}
                className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-xs font-semibold hover:border-red-400 transition-colors flex items-center justify-center"
              >
                +{fotos.length - 5}
              </button>
            )}
          </div>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox fotos={fotos} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

export default function CatalogoClientPage({ client, properties, broker }: CatalogoClientPageProps) {
  const brokerNome = broker?.nome_exibicao || broker?.nome || 'Corretor';
  const brokerTel = broker?.telefone || '';
  const brokerEmpresa = broker?.empresa || '';

  const disponíveis = properties.filter((p) => !p.archived);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Seleção especial para</div>
            <h1 className="text-xl font-black text-gray-900">{client.nome}</h1>
          </div>
          {brokerTel && (
            <a
              href={`https://wa.me/55${brokerTel.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar com corretor
            </a>
          )}
        </div>
      </header>

      {/* Corpo */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Info corretor */}
        {broker && (
          <div className="bg-white rounded-2xl p-4 mb-8 border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Corretor responsável</p>
              <p className="font-bold text-gray-900 text-lg">{brokerNome}</p>
              {brokerEmpresa && <p className="text-sm text-gray-500">{brokerEmpresa}</p>}
              {broker.creci && <p className="text-xs text-gray-400">CRECI: {broker.creci}</p>}
            </div>
            <div className="text-right text-sm text-gray-600">
              {broker.email && <p>{broker.email}</p>}
              {brokerTel && <p className="font-semibold">{brokerTel}</p>}
            </div>
          </div>
        )}

        {disponíveis.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Home size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nenhum imóvel disponível no momento.</p>
            <p className="text-sm mt-2">Entre em contato com seu corretor para mais informações.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                {disponíveis.length} imóve{disponíveis.length === 1 ? 'l selecionado' : 'is selecionados'} para você
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {disponíveis.map((prop) => (
                <PropertyCard key={prop.id} prop={prop} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 text-center text-sm text-gray-400">
        <p>Página gerada por <strong className="text-gray-600">{brokerNome}</strong></p>
        {brokerEmpresa && <p className="mt-1">{brokerEmpresa}</p>}
      </footer>
    </div>
  );
}
