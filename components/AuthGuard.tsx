'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checando, setChecando] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getUser();

      // Rotas públicas (não precisam de login)
      const rotasPublicas = ['/login'];
      if (rotasPublicas.includes(pathname)) {
        setChecando(false);
        return;
      }

      // Rota admin tem verificação própria depois
      if (pathname.startsWith('/admin')) {
        setChecando(false);
        return;
      }

      if (!data.user) {
        router.push('/login');
        return;
      }

      setChecando(false);
    };

    verificar();
  }, [pathname, router]);

  if (checando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}