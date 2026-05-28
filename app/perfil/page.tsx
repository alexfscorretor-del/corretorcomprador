'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [creci, setCreci] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setMensagem('Usuário não autenticado.');
        setLoading(false);
        return;
      }

      setEmail(userData.user.email || '');

      const { data, error } = await supabase
        .from('brokers')
        .select('nome, nome_exibicao, telefone, email, empresa, creci')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error) {
        setMensagem('Erro ao carregar perfil.');
        setLoading(false);
        return;
      }

      if (data) {
        setNome(data.nome || '');
        setNomeExibicao(data.nome_exibicao || '');
        setTelefone(data.telefone || '');
        setEmpresa(data.empresa || '');
        setCreci(data.creci || '');
      }

      setLoading(false);
    };

    void loadProfile();
  }, []);

  const handleSave = async () => {
    setMensagem('');

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setMensagem('Usuário não autenticado.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('brokers').upsert(
      {
        user_id: userData.user.id,
        email: userData.user.email,
        nome: nome.trim() || 'Sem nome',
        nome_exibicao: nomeExibicao.trim() || null,
        telefone: telefone.trim() || 'Não informado',
        empresa: empresa.trim() || null,
        creci: creci.trim() || null,
        ativo: true,
        plano: 'free',
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      setMensagem(`Erro ao salvar: ${error.message}`);
      setSaving(false);
      return;
    }

    setMensagem('Perfil salvo com sucesso.');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <p className="text-zinc-500">Carregando perfil...</p>
      </div>
    );
  }

  const inputClass =
    'w-full bg-white/10 border border-white/10 focus:border-red-500 rounded-2xl py-3.5 px-5 text-white placeholder-gray-500 outline-none transition-colors';
  const labelClass =
    'block text-xs uppercase tracking-wider text-gray-400 mb-1';

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-6">
        <div className="max-w-3xl mx-auto pt-12 lg:pt-0">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Meu Perfil</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Esses dados identificam o corretor dentro do sistema e na página enviada ao cliente.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
            <div>
              <label className={labelClass}>Email da conta</label>
              <input value={email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
            </div>

            <div>
              <label className={labelClass}>Nome do corretor</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex. Alexandre Fernandes Sampaio"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Nome que quer que apareça na página do cliente</label>
              <input
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
                placeholder="Ex. Alex Sampaio"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex. 62 99999-0000"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Empresa</label>
              <input
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ex. Imobiliária XYZ"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>CRECI</label>
              <input
                value={creci}
                onChange={(e) => setCreci(e.target.value)}
                placeholder="Ex. 12345-GO"
                className={inputClass}
              />
            </div>

            {mensagem && (
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-yellow-400">
                {mensagem}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-[#E50914] hover:bg-red-700 disabled:opacity-50 rounded-2xl text-white font-semibold text-base transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}