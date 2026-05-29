import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
  }

  // Verificar se o e-mail está liberado (convite ativo e não usado)
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('broker_invites')
    .select('id')
    .eq('email', email)
    .eq('used', false)
    .eq('ativo', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .maybeSingle();

  if (inviteError) {
    return NextResponse.json({ error: 'Erro ao validar liberação.' }, { status: 500 });
  }

  if (!invite) {
    return NextResponse.json({ error: 'Este e-mail não está liberado para cadastro.' }, { status: 403 });
  }

  // Criar usuário com e-mail já confirmado
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // Se usuário já existe, retornar mensagem amigável
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return NextResponse.json({ error: 'Este e-mail já possui cadastro. Faça login.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userId = data.user?.id;

  if (userId) {
    // Criar perfil na tabela brokers
    await supabaseAdmin.from('brokers').upsert(
      {
        user_id: userId,
        email,
        nome: email,
        telefone: 'Não informado',
        ativo: true,
        plano: 'free',
      },
      { onConflict: 'user_id' }
    );

    // Marcar convite como usado
    await supabaseAdmin
      .from('broker_invites')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  return NextResponse.json({ success: true });
}
