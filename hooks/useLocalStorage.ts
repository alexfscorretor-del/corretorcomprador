'use client';
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [hydrated, setHydrated] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (e) {
      console.error('useLocalStorage read error:', e);
    }
    setHydrated(true);
  }, [key]);

  const setValue = (val: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = typeof val === 'function' ? (val as (prev: T) => T)(prev) : val;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (e) {
      console.error('useLocalStorage write error:', e);
    }
  };

  return [storedValue, setValue, hydrated];
}