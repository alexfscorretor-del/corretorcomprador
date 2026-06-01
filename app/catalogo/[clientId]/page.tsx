'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateCompatibility } from '@/lib/compatibility';
import { X, ChevronLeft, ChevronRight, ExternalLink, Heart, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

/* ─── tipos locais ──────────────────────────────────────────────── */
type Prop = {
  id: string;
  titulo: string;
  tipoImovel: string;
  preco: number;
  bairro: string;
  tamanho?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  andar?: number | null;
  condominio?: number | null;
  predioNovo?: string;
  reformado?: string;
  mobiliado?: boolean;
  varanda?: boolean;
  areaLazer?: boolean;
  aceitaPet?: boolean;
  aceitaFinanciamento?: string;
  descricao?: string;
  link?: string;
  fotos?: string[];
  rating?: number;
};

type ClientData = {
  id: string;
  nome: string;
  tipoImovel?: string;
  precoMin?: number;
  precoMax?: number;
  bairro?: string;
  bairrosSecundarios?: string;
  tamanho?: number;
  quartosMin?: number;
  suitesMin?: number;
  banheirosMin?: number;
  vagasMin?: number;
  tipoVaga?: string;
  condominioMax?: number;
  prefAndar?: boolean;
  andarApartir?: number | null;
  novo?: string;
  reformado?: string;
  aceitaFinanciamento?: string;
  mobiliado?: string;
  varanda?: string;
  areaLazer?: string;
  aceitaPet?: string;
  properties?: Prop[];
};

type BrokerData = {
  nome: string;
  nomeExibicao?: string;
  telefone?: string;
  email?: string;
  empresa?: string;
};

/* ─── Lightbox ──────────────────────────────────────────────────── */
function Lightbox({
  fotos,
  startIdx,
  onClose,
}: {
  fotos: string[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setIdx((i) => (i - 1 + fotos.length) % fotos.length), [fotos.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % fotos.length), [fotos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.97)' }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
        touchStartX.current = null;
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/60 text-sm font-medium">{idx + 1} de {fotos.length}</span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center relative px-12 min-h-0">
        <button
          onClick={prev}
          className="absolute left-2 md:left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft size={22} />
        </button>

        <img
          key={idx}
          src={fotos[idx]}
          alt={`Foto ${idx + 1}`}
          className="max-w-full max-h-full object-contain rounded-xl"
          style={{ animation: 'lbFade .2s ease' }}
        />

        <button
          onClick={next}
          className="absolute right-2 md:right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Thumbnail strip */}
      {fotos.length > 1 && (
        <div className="flex-shrink-0 px-4 py-3 flex gap-2 overflow-x-auto justify-center">
          {fotos.map((f, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
              style={{
                width: 52,
                height: 36,
                outline: i === idx ? '2px solid #e50914' : '2px solid transparent',
                opacity: i === idx ? 1 : 0.5,
              }}
            >
              <img src={f} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes lbFade{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ─── PropertyCardClient ────────────────────────────────────────── */
function PropertyCardClient({
  prop,
  compatibility,
  brokerTelefone,
  ratings,
  onRate,
}: {
  prop: Prop;
  compatibility: number;
  brokerTelefone: string;
  ratings: Record<string, number>;
  onRate: (id: string, val: number) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [favorito, setFavorito] = useState(false);
  const r = ratings[prop.id] ?? prop.rating ?? 0;
  const fotos = prop.fotos ?? [];

  const specs: [string, string | number][] = [
    ['Tipo', prop.tipoImovel || '-'],
    ['Bairro', prop.bairro || '-'],
    ['Área', (prop.tamanho || '?') + ' m²'],
    ['Quartos', prop.quartos ?? '-'],
    ['Suítes', prop.suites ?? '-'],
    ['Banheiros', prop.banheiros ?? '-'],
    ['Vagas', prop.vagas ?? '-'],
    ['Andar', prop.andar ?? '-'],
    ['Condomínio', prop.condominio ? 'R$ ' + Number(prop.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'],
    ['Prédio Novo', prop.predioNovo || '-'],
    ['Reformado', prop.reformado || '-'],
    ['Mobiliado', prop.mobiliado ? 'Sim' : 'Não'],
    ['Varanda', prop.varanda ? 'Sim' : 'Não'],
    ['Área Lazer', prop.areaLazer ? 'Sim' : 'Não'],
    ['Pet', prop.aceitaPet ? 'Sim' : 'Não'],
    ['Financiamento', prop.aceitaFinanciamento || '-'],
  ];

  const handleInteresse = () => {
    if (!brokerTelefone) { alert('Contato do corretor não disponível.'); return; }
    const tel = brokerTelefone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${prop.titulo}`);
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
  };

  return (
    <>
      {/* CARD */}
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
        {/* Thumbnail */}
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
        </div>

        <h4 className="font-semibold text-base text-white mb-1 leading-snug line-clamp-1">{prop.titulo}</h4>
        <p className="text-xl font-bold mb-1" style={{ color: '#ef4444' }}>
          R$ {Number(prop.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          {prop.bairro || '-'} • {prop.tamanho || '?'}m² • {prop.quartos ?? 0} qtos • {prop.vagas ?? 0} vaga(s)
        </p>

        <div className="flex gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={(e) => { e.stopPropagation(); onRate(prop.id, n); }}
              style={{
                color: n <= r ? '#fbbf24' : '#4b5563',
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
                fontSize: '20px', lineHeight: 1,
              }}
            >★</button>
          ))}
        </div>

        <div className="pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); handleInteresse(); }}
            className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-2xl font-medium text-white transition-colors"
            style={{ background: '#E50914' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#E50914')}
          >
            <MessageCircle size={13} /> Tenho interesse
          </button>
        </div>
      </div>

      {/* MODAL DETALHE */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-[#181818] w-full max-w-4xl rounded-3xl max-h-[92vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero foto */}
            <div
              className="relative w-full rounded-t-3xl overflow-hidden"
              style={{ aspectRatio: '16/6', background: '#1f2937' }}
            >
              {fotos[0]
                ? <img src={fotos[0]} alt={prop.titulo} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightboxIdx(0)} />
                : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-6xl">📷</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent pointer-events-none" />
              <button
                onClick={() => setShowDetail(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
              <div
                className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(229,9,20,0.9)' }}
              >
                {compatibility}% Compatível
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{prop.titulo}</h2>
                  {prop.bairro && <p className="text-gray-400">{prop.bairro}</p>}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                    R$ {Number(prop.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {prop.condominio ? (
                    <p className="text-gray-400 text-sm">
                      + R$ {Number(prop.condominio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cond.
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Estrelas */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => onRate(prop.id, n)}
                    style={{
                      color: n <= r ? '#fbbf24' : '#4b5563',
                      background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                      fontSize: '28px', lineHeight: 1,
                    }}
                  >★</button>
                ))}
              </div>

              {/* Ações cliente */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleInteresse}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white text-sm transition-colors"
                  style={{ background: '#E50914' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#E50914')}
                >
                  <MessageCircle size={15} /> Tenho interesse
                </button>
                <button
                  onClick={() => { setFavorito((v) => !v); }}
                  className="px-4 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-colors"
                  style={{
                    background: favorito ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.07)',
                    color: favorito ? '#ef4444' : '#9ca3af',
                    border: `1px solid ${favorito ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <Heart size={15} fill={favorito ? '#ef4444' : 'none'} />
                  {favorito ? 'Salvo' : 'Salvar'}
                </button>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {specs.map(([label, val]) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-white font-semibold text-sm">{val}</p>
                  </div>
                ))}
              </div>

              {prop.descricao && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Descrição</p>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{prop.descricao}</p>
                </div>
              )}

              {prop.link && (
                <a
                  href={prop.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mb-6 transition-colors"
                >
                  <ExternalLink size={14} /> Ver anúncio original
                </a>
              )}

              {/* Galeria clicável */}
              {fotos.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                    Galeria de fotos ({fotos.length})
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {fotos.map((f, i) => (
                      <div
                        key={i}
                        className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                        onClick={() => setLightboxIdx(i)}
                      >
                        <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <span className="text-white text-xs font-bold">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDetail(false)}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors font-medium text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxIdx !== null && fotos.length > 0 && (
        <Lightbox
          fotos={fotos}
          startIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

/* ─── Página principal ──────────────────────────────────────────── */
export default function CatalogPage() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [broker, setBroker] = useState<BrokerData | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  /* Carregar dados públicos do cliente */
  useEffect(() => {
    if (!clientId) return;

    const load = async () => {
      setLoading(true);

      /* cliente */
      const { data: clientRow, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (clientError || !clientRow) { setNotFound(true); setLoading(false); return; }

      /* imóveis */
      const { data: propsRows } = await supabase
        .from('properties')
        .select('*')
        .eq('client_id', clientId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      const properties: Prop[] = (propsRows || []).map((r: any) => ({
        id: r.id,
        titulo: r.titulo ?? '',
        tipoImovel: r.tipo_imovel ?? '',
        preco: Number(r.preco ?? 0),
        bairro: r.bairro ?? '',
        tamanho: r.area ?? undefined,
        quartos: r.quartos ?? undefined,
        suites: r.suites ?? undefined,
        banheiros: r.banheiros ?? undefined,
        vagas: r.vagas ?? undefined,
        andar: r.andar ?? null,
        condominio: r.condominio ?? null,
        predioNovo: r.predio_novo ?? '',
        reformado: r.reformado ?? '',
        mobiliado: r.mobiliado ?? false,
        varanda: r.varanda ?? false,
        areaLazer: r.area_lazer ?? false,
        aceitaPet: r.aceita_pet ?? false,
        aceitaFinanciamento: r.aceita_financiamento ?? '',
        descricao: r.descricao ?? '',
        link: r.link ?? '',
        fotos: r.fotos ?? [],
        rating: r.avaliacao ?? 0,
      }));

      /* broker */
      const { data: brokerRow } = await supabase
        .from('brokers')
        .select('nome, nome_exibicao, telefone, email, empresa')
        .eq('user_id', clientRow.user_id)
        .maybeSingle();

      const clientMapped: ClientData = {
        id: clientRow.id,
        nome: clientRow.nome ?? '',
        tipoImovel: clientRow.tipo_imovel ?? '',
        precoMin: clientRow.preco_min ?? undefined,
        precoMax: clientRow.preco_max ?? undefined,
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
        properties,
      };

      setClient(clientMapped);
      setBroker({
        nome: brokerRow?.nome_exibicao || brokerRow?.nome || 'Corretor',
        nomeExibicao: brokerRow?.nome_exibicao ?? '',
        telefone: brokerRow?.telefone ?? '',
        email: brokerRow?.email ?? '',
        empresa: brokerRow?.empresa ?? '',
      });

      /* ratings do localStorage */
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
    /* persiste no Supabase (melhor esforço, sem autenticação necessária) */
    await supabase.from('properties').update({ avaliacao: val }).eq('id', propId);
  }, [clientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Carregando imóveis...</p>
        </div>
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Página não encontrada.</p>
      </div>
    );
  }

  const sorted = [...(client.properties || [])].sort(
    (a, b) => calculateCompatibility(client as any, b as any) - calculateCompatibility(client as any, a as any)
  );

  const topProp = sorted[0];
  const topImg = topProp?.fotos?.[0] || '';
  const cpTop = topProp ? calculateCompatibility(client as any, topProp as any) : 0;
  const brokerNome = broker?.nomeExibicao || broker?.nome || 'Corretor';
  const brokerTelefone = broker?.telefone || '';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: '#111' }}
      >
        {topImg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${topImg}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.15,
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg,rgba(10,10,10,.93) 0%,rgba(10,10,10,.65) 50%,rgba(10,10,10,.35) 100%)' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-5 py-12 md:py-16 flex flex-wrap justify-between items-end gap-8">
          <div className="max-w-xl">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Seleção de imóveis preparada para você</p>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
              {topProp?.titulo || 'Imóveis selecionados'}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm font-semibold">
              <span style={{ color: '#4ade80' }}>{cpTop}% Compatível</span>
              {topProp?.quartos != null && <span>{topProp.quartos} Quartos</span>}
              {topProp?.bairro && <span>{topProp.bairro}</span>}
            </div>
            <p className="mt-3 text-zinc-300 text-sm font-medium">Selecionados para {client.nome}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Corretor responsável</p>
            <p
              className="font-bold text-3xl md:text-4xl italic leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: '#e50914' }}
            >{brokerNome}</p>
            {broker?.empresa && <p className="text-zinc-400 text-xs mt-1">{broker.empresa}</p>}
            {brokerTelefone && <p className="text-zinc-200 text-sm font-semibold mt-1">{brokerTelefone}</p>}
            {broker?.email && <p className="text-zinc-400 text-xs mt-0.5">{broker.email}</p>}
            <div
              className="inline-block mt-3 rounded-2xl px-4 py-3 text-right"
              style={{ background: 'rgba(229,9,20,.12)', border: '1px solid rgba(229,9,20,.3)' }}
            >
              <p className="text-4xl font-black" style={{ color: '#e50914', lineHeight: 1 }}>{cpTop}%</p>
              <p className="text-xs text-zinc-400 uppercase tracking-wide mt-1">Compatibilidade</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRID DE CARDS ── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
          {sorted.length} imóvel{sorted.length !== 1 ? 's' : ''} selecionado{sorted.length !== 1 ? 's' : ''} para você
        </p>

        {sorted.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-lg">Nenhum imóvel disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* ── FOOTER ── */}
      <footer
        className="text-center py-10 px-4 mt-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-3xl font-bold italic mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#e50914' }}
        >{brokerNome}</p>
        {brokerTelefone && <p className="text-zinc-300 text-sm">{brokerTelefone}</p>}
        {broker?.email && <p className="text-zinc-500 text-xs mt-0.5">{broker.email}</p>}
        {broker?.empresa && <p className="text-zinc-600 text-xs mt-0.5 uppercase tracking-wide">{broker.empresa}</p>}
        <p className="text-zinc-700 text-xs mt-6">Página gerada pelo Corretor Pro · {new Date().getFullYear()}</p>
      </footer>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
    </div>
  );
}
