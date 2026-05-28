'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Archive,
  Settings,
  Menu,
  X,
  Building2,
  LogOut,
  Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'alexfs.corretor@gmail.com';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = (user?.email || '').toLowerCase();
      setIsAdmin(email === ADMIN_EMAIL.toLowerCase());
      setCheckingAdmin(false);
    }

    void checkAdmin();
  }, []);

  const nav = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/clientes', label: 'Clientes', icon: Users },
      { href: '/arquivados', label: 'Arquivados', icon: Archive },
      { href: '/perfil', label: 'Meu Perfil', icon: Settings },
    ];

    if (isAdmin) {
      base.push({ href: '/admin', label: 'Admin', icon: Shield });
    }

    return base;
  }, [isAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-white/10">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E50914] flex items-center justify-center shadow-lg shadow-red-900/30">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold leading-tight">Corretor Pro</p>
            <p className="text-[11px] text-zinc-500">Painel do corretor</p>
          </div>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-zinc-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {!checkingAdmin &&
          nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="px-3 pb-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>

      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-zinc-600">
        v1.0.0 — Produção
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-64">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpen(true)}
          className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-lg"
        >
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="w-72 max-w-[85vw] h-full">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}