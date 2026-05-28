'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Property } from '@/types';
import { X, Loader2 } from 'lucide-react';

interface Props {
  clientId: string;
  initial?: Property;
  onSave: (p: Property) => void;
  onCancel: () => void;
}

const fi =
  'w-full bg-white/10 border border-white/10 focus:border-red-400 rounded-2xl px-4 py-3 text-base outline-none text-white transition-colors placeholder-gray-500';
const fl = 'block text-xs uppercase tracking-wider text-gray-400 mb-1';

function parseMoeda(val: string) {
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatMoeda(num?: number | null) {
  if (!num) return '';
  return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export default function PropertyForm({ clientId, initial, onSave, onCancel }: Props) {
  const [titulo, setTitulo] = useState(initial?.titulo || '');
  const [tipoImovel, setTipoImovel] = useState(initial?.tipoImovel || '');
  const [precoStr, setPrecoStr] = useState(formatMoeda(initial?.preco));
  const [bairro, setBairro] = useState(initial?.bairro || '');
  const [tamanho, setTamanho] = useState(initial?.tamanho?.toString() || '');
  const [quartos, setQuartos] = useState(initial?.quartos?.toString() || '');
  const [suites, setSuites] = useState(initial?.suites?.toString() || '');
  const [banheiros, setBanheiros] = useState(initial?.banheiros?.toString() || '');
  const [vagas, setVagas] = useState(initial?.vagas?.toString() || '');
  const [tipoVagaCobertura, setTipoVagaCobertura] = useState(
    initial?.tipoVagaCobertura || ''
  );
  const [tipoVagaModelo, setTipoVagaModelo] = useState(
    initial?.tipoVagaModelo === 'gaveta' ? 'paralela' : initial?.tipoVagaModelo || ''
  );
  const [andar, setAndar] = useState(initial?.andar?.toString() || '');
  const [condominioStr, setCondominioStr] = useState(formatMoeda(initial?.condominio));
  const [predioNovo, setPredioNovo] = useState(initial?.predioNovo || '');
  const [reformado, setReformado] = useState(initial?.reformado || '');
  const [aceitaFinanciamento, setAceitaFinanciamento] = useState(
    initial?.aceitaFinanciamento || ''
  );
  const [mobiliado, setMobiliado] = useState(initial?.mobiliado || false);
  const [varanda, setVaranda] = useState(initial?.varanda || false);
  const [areaLazer, setAreaLazer] = useState(initial?.areaLazer || false);
  const [aceitaPet, setAceitaPet] = useState(initial?.aceitaPet || false);
  const [link, setLink] = useState(initial?.link || '');
  const [descricao, setDescricao] = useState(initial?.descricao || '');
  const [fotosUrls, setFotosUrls] = useState(
    initial?.fotos?.filter((f) => !f.startsWith('data:')).join(', ') || ''
  );
  const [fotosBase64, setFotosBase64] = useState(
    initial?.fotos?.filter((f) => f.startsWith('data:')) || []
  );
  const [processingImages, setProcessingImages] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));

      reader.onload = (ev) => {
        const img = new Image();

        img.onerror = () => reject(new Error('Falha ao processar imagem'));

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width;
          let h = img.height;

          if (w > h && w > MAX) {
            h = (h * MAX) / w;
            w = MAX;
          } else if (h > MAX) {
            w = (w * MAX) / h;
            h = MAX;
          }

          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas indisponível'));
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };

        img.src = ev.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setProcessingImages(true);
    setProcessingCount(files.length);

    try {
      const processed = await Promise.all(files.map(processFile));
      setFotosBase64((prev) => [...prev, ...processed]);
    } catch (error) {
      console.error(error);
      alert('Erro ao processar uma ou mais fotos.');
    } finally {
      setProcessingImages(false);
      setProcessingCount(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handlePrecoInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setPrecoStr('');
      return;
    }

    setPrecoStr(
      (parseInt(raw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    );
  };

  const handleCondInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setCondominioStr('');
      return;
    }

    setCondominioStr(
      (parseInt(raw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    );
  };

  const handleSubmit = () => {
    if (processingImages) {
      alert('Aguarde o processamento das fotos terminar antes de salvar.');
      return;
    }

    const urlArr = fotosUrls
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const fotos = [...fotosBase64, ...urlArr];

    const prop: Property = {
      id: initial?.id || String(Date.now()),
      clientId,
      titulo: titulo || 'Imóvel sem título',
      tipoImovel,
      bairro,
      link,
      descricao,
      preco: parseMoeda(precoStr),
      createdAt: initial?.createdAt || new Date().toISOString(),
      tamanho: parseFloat(tamanho) || 0,
      quartos: parseInt(quartos) || 0,
      suites: parseInt(suites) || 0,
      banheiros: parseInt(banheiros) || 0,
      vagas: parseInt(vagas) || 0,
      tipoVaga: [tipoVagaCobertura, tipoVagaModelo].filter(Boolean).join('|'),
      tipoVagaCobertura: tipoVagaCobertura as Property['tipoVagaCobertura'],
      tipoVagaModelo: tipoVagaModelo as Property['tipoVagaModelo'],
      andar: andar ? parseInt(andar) : null,
      condominio: parseMoeda(condominioStr),
      predioNovo: predioNovo as Property['predioNovo'],
      reformado: reformado as Property['reformado'],
      aceitaFinanciamento: aceitaFinanciamento as Property['aceitaFinanciamento'],
      mobiliado,
      varanda,
      areaLazer,
      aceitaPet,
      fotos,
      rating: initial?.rating || 0,
      favorito: initial?.favorito || false,
      status: initial?.status || 'disponivel',
      observacoes: initial?.observacoes || '',
      anotacaoPrivada: initial?.anotacaoPrivada || '',
    };

    onSave(prop);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {initial ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={fl}>Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={fi}
            placeholder="Ex: Apto 3Q Setor Bueno"
          />
        </div>

        <div>
          <label className={fl}>Tipo de imóvel</label>
          <select
            value={tipoImovel}
            onChange={(e) => setTipoImovel(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            {['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Terreno', 'Comercial'].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className={fl}>Preço (R$)</label>
          <input
            value={precoStr}
            onChange={handlePrecoInput}
            className={fi}
            inputMode="numeric"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className={fl}>Bairro</label>
          <input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            className={fi}
          />
        </div>

        <div>
          <label className={fl}>Área (m²)</label>
          <input
            value={tamanho}
            onChange={(e) => setTamanho(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={fl}>Quartos</label>
          <input
            value={quartos}
            onChange={(e) => setQuartos(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={fl}>Suítes</label>
          <input
            value={suites}
            onChange={(e) => setSuites(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={fl}>Banheiros</label>
          <input
            value={banheiros}
            onChange={(e) => setBanheiros(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={fl}>Vagas</label>
          <input
            value={vagas}
            onChange={(e) => setVagas(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={fl}>Tipo de Vaga — Cobertura</label>
          <select
            value={tipoVagaCobertura}
            onChange={(e) => setTipoVagaCobertura(e.target.value)}
            className={fi}
          >
            <option value="">Indiferente</option>
            <option value="coberta">Coberta</option>
            <option value="descoberta">Descoberta</option>
          </select>
        </div>

        <div>
          <label className={fl}>Tipo de Vaga — Modelo</label>
          <select
            value={tipoVagaModelo}
            onChange={(e) => setTipoVagaModelo(e.target.value)}
            className={fi}
          >
            <option value="">Indiferente</option>
            <option value="individual">Individual</option>
            <option value="paralela">Paralela</option>
          </select>
        </div>

        <div>
          <label className={fl}>Andar</label>
          <input
            value={andar}
            onChange={(e) => setAndar(e.target.value.replace(/\D/g, ''))}
            className={fi}
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={fl}>Condomínio (R$/mês)</label>
          <input
            value={condominioStr}
            onChange={handleCondInput}
            className={fi}
            inputMode="numeric"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className={fl}>Prédio novo?</label>
          <select
            value={predioNovo}
            onChange={(e) => setPredioNovo(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>

        <div>
          <label className={fl}>Reformado?</label>
          <select
            value={reformado}
            onChange={(e) => setReformado(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>

        <div>
          <label className={fl}>Financiamento?</label>
          <select
            value={aceitaFinanciamento}
            onChange={(e) => setAceitaFinanciamento(e.target.value)}
            className={fi}
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(
          [
            ['mobiliado', 'Mobiliado', mobiliado, setMobiliado],
            ['varanda', 'Varanda/Sacada', varanda, setVaranda],
            ['areaLazer', 'Área de Lazer', areaLazer, setAreaLazer],
            ['aceitaPet', 'Aceita Pet', aceitaPet, setAceitaPet],
          ] as const
        ).map(([key, label, val, setter]) => (
          <label
            key={key}
            className="flex items-center gap-3 text-white bg-white/5 border border-white/10 rounded-2xl px-4 py-3 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => setter(e.target.checked)}
              className="w-5 h-5 accent-red-600"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className={fl}>Link do anúncio</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className={fi}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-3">
        <label className={fl}>Fotos do imóvel</label>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className={fi}
        />

        {processingImages && (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Loader2 size={16} className="animate-spin" />
            <span>Processando {processingCount} foto(s)... aguarde antes de salvar.</span>
          </div>
        )}

        {fotosBase64.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {fotosBase64.map((src, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden border border-white/10">
                <img src={src} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setFotosBase64((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className={fl}>Ou cole URLs de fotos (separadas por vírgula)</label>
          <textarea
            value={fotosUrls}
            onChange={(e) => setFotosUrls(e.target.value)}
            className={fi + ' h-16'}
            placeholder="https://foto1.jpg, https://foto2.jpg"
          />
        </div>
      </div>

      <div>
        <label className={fl}>Descrição completa</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={fi + ' h-28'}
          placeholder="Descreva o imóvel..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={processingImages}
          className="flex-1 py-3 rounded-2xl bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {processingImages ? <Loader2 size={18} className="animate-spin" /> : null}
          {processingImages ? 'Processando fotos...' : 'Salvar Imóvel'}
        </button>
      </div>
    </div>
  );
}