'use client';

import type { ChangeEvent, RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import {
  propertyInputClass as fi,
  propertyLabelClass as fl,
} from '@/components/forms/shared';

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  processingImages: boolean;
  processingCount: number;
  fotosBase64: string[];
  setFotosBase64: (updater: (prev: string[]) => string[]) => void;
  fotosUrls: string;
  setFotosUrls: (v: string) => void;
};

export function MediaSection(props: Props) {
  return (
    <div className="space-y-3">
      <label className={fl}>Fotos do imóvel</label>
      <input
        ref={props.inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        multiple
        onChange={props.onFileUpload}
        className={fi}
      />

      {props.processingImages && (
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Loader2 size={16} className="animate-spin" />
          <span>
            Processando {props.processingCount} foto(s)... aguarde antes de
            salvar.
          </span>
        </div>
      )}

      {props.fotosBase64.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {props.fotosBase64.map((src, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden border border-white/10"
            >
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="w-full h-28 object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  props.setFotosBase64((prev) => prev.filter((_, j) => j !== i))
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
          value={props.fotosUrls}
          onChange={(e) => props.setFotosUrls(e.target.value)}
          className={fi + ' h-16'}
          placeholder="https://foto1.jpg, https://foto2.jpg"
        />
      </div>
    </div>
  );
}
