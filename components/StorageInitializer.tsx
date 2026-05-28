'use client';

import { useEffect } from 'react';
import { initializePhotoStorage } from '@/lib/initializeStorage';

export default function StorageInitializer() {
  useEffect(() => {
    // Inicializar o armazenamento de fotos quando o app carrega
    initializePhotoStorage();
  }, []);

  return null;
}
