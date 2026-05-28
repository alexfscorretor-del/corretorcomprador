'use client';

import { useEffect } from 'react';
import { initializeStorage } from '@/lib/initializeStorage';

export default function StorageInitializer() {
  useEffect(() => {
    void initializeStorage();
  }, []);

  return null;
}