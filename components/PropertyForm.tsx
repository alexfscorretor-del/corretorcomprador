'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Property } from '@/types';
import { formatMoeda } from '@/lib/formatters';
import { parseMoeda } from '@/lib/parsers';
import { assertUploadFile } from '@/lib/uploadPhotos';
import { getErrorMessage } from '@/lib/errors';
import { validatePropertyInput } from '@/services/propertyService';
import { BasicInfoSection } from '@/components/forms/property/BasicInfoSection';
import { FeaturesSection } from '@/components/forms/property/FeaturesSection';
import { MediaSection } from '@/components/forms/property/MediaSection';

interface Props {
  clientId: string;
  initial?: Property;
  onSave: (p: Property) => void;
  onCancel: () => void;
}

export default function PropertyForm({
  clientId,
  initial,
  onSave,
  onCancel,
}: Props) {
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
  const [tipoVagaModelo, setTipoVagaModelo] = useState(() => {
    const raw = String(initial?.tipoVagaModelo || '');
    return raw === 'paralela' ? 'gaveta' : raw;
  });
  const [andar, setAndar] = useState(initial?.andar?.toString() || '');
  const [condominioStr, setCondominioStr] = useState(
    formatMoeda(initial?.condominio)
  );
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
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const processFile = (file: File): Promise<string> => {
    assertUploadFile(file);
    const { promise, resolve, reject } = Promise.withResolvers<string>();
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
    return promise;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setProcessingImages(true);
    setProcessingCount(files.length);
    setError('');
    try {
      const processed = await Promise.all(files.map(processFile));
      setFotosBase64((prev) => [...prev, ...processed]);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao processar uma ou mais fotos.'));
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
      (parseInt(raw, 10) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })
    );
  };

  const handleCondInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setCondominioStr('');
      return;
    }
    setCondominioStr(
      (parseInt(raw, 10) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })
    );
  };

  const handleSubmit = () => {
    if (processingImages) {
      setError('Aguarde o processamento das fotos terminar antes de salvar.');
      return;
    }
    setError('');
    try {
      const urlArr = fotosUrls
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      const fotos = [...fotosBase64, ...urlArr];

      const draft = {
        id: initial?.id,
        clientId,
        titulo: titulo || 'Imóvel sem título',
        tipoImovel,
        bairro,
        link,
        descricao,
        preco: parseMoeda(precoStr),
        createdAt: initial?.createdAt,
        tamanho: parseFloat(tamanho) || 0,
        quartos: parseInt(quartos, 10) || 0,
        suites: parseInt(suites, 10) || 0,
        banheiros: parseInt(banheiros, 10) || 0,
        vagas: parseInt(vagas, 10) || 0,
        tipoVaga: [tipoVagaCobertura, tipoVagaModelo].filter(Boolean).join('|'),
        tipoVagaCobertura: tipoVagaCobertura as Property['tipoVagaCobertura'],
        tipoVagaModelo: tipoVagaModelo as Property['tipoVagaModelo'],
        andar: andar ? parseInt(andar, 10) : null,
        condominio: parseMoeda(condominioStr),
        predioNovo: predioNovo as Property['predioNovo'],
        reformado: reformado as Property['reformado'],
        aceitaFinanciamento:
          aceitaFinanciamento as Property['aceitaFinanciamento'],
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

      const prop = validatePropertyInput(draft);
      onSave(prop);
    } catch (err) {
      setError(getErrorMessage(err, 'Dados do imóvel inválidos.'));
    }
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

      {error ? (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      ) : null}

      <BasicInfoSection
        titulo={titulo}
        setTitulo={setTitulo}
        tipoImovel={tipoImovel}
        setTipoImovel={setTipoImovel}
        precoStr={precoStr}
        onPrecoInput={handlePrecoInput}
        bairro={bairro}
        setBairro={setBairro}
        tamanho={tamanho}
        setTamanho={setTamanho}
        link={link}
        setLink={setLink}
        descricao={descricao}
        setDescricao={setDescricao}
      />

      <FeaturesSection
        quartos={quartos}
        setQuartos={setQuartos}
        suites={suites}
        setSuites={setSuites}
        banheiros={banheiros}
        setBanheiros={setBanheiros}
        vagas={vagas}
        setVagas={setVagas}
        tipoVagaCobertura={tipoVagaCobertura}
        setTipoVagaCobertura={setTipoVagaCobertura}
        tipoVagaModelo={tipoVagaModelo}
        setTipoVagaModelo={setTipoVagaModelo}
        andar={andar}
        setAndar={setAndar}
        condominioStr={condominioStr}
        onCondInput={handleCondInput}
        predioNovo={predioNovo}
        setPredioNovo={setPredioNovo}
        reformado={reformado}
        setReformado={setReformado}
        aceitaFinanciamento={aceitaFinanciamento}
        setAceitaFinanciamento={setAceitaFinanciamento}
        mobiliado={mobiliado}
        setMobiliado={setMobiliado}
        varanda={varanda}
        setVaranda={setVaranda}
        areaLazer={areaLazer}
        setAreaLazer={setAreaLazer}
        aceitaPet={aceitaPet}
        setAceitaPet={setAceitaPet}
      />

      <MediaSection
        inputRef={inputRef}
        onFileUpload={handleFileUpload}
        processingImages={processingImages}
        processingCount={processingCount}
        fotosBase64={fotosBase64}
        setFotosBase64={setFotosBase64}
        fotosUrls={fotosUrls}
        setFotosUrls={setFotosUrls}
      />

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
