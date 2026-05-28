'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push('/login');
        return;
      }

      router.push('/dashboard');
    }

    void checkUser();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
      <p className="text-zinc-500 text-sm">Redirecionando...</p>
    </div>
  );
}