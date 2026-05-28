import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_EMAIL = 'alexfs.corretor@gmail.com';

async function validarAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Não autenticado.' };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { ok: false, status: 401, message: 'Sessão inválida.' };
  }

  if ((user.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { ok: false, status: 403, message: 'Acesso negado.' };
  }

  return { ok: true, user };
}

export async function GET(req: NextRequest) {
  const validacao = await validarAdmin(req);

  if (!validacao.ok) {
    return NextResponse.json(
      { error: validacao.message },
      { status: validacao.status }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('broker_invites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: data });
}

export async function POST(req: NextRequest) {
  const validacao = await validarAdmin(req);

  if (!validacao.ok) {
    return NextResponse.json(
      { error: validacao.message },
      { status: validacao.status }
    );
  }

  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const nome = String(body.nome || '').trim();

  if (!email) {
    return NextResponse.json(
      { error: 'E-mail é obrigatório.' },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from('broker_invites').upsert(
    {
      email,
      nome: nome || null,
      ativo: true,
      invited_by: validacao.user.id,
    },
    { onConflict: 'email' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const validacao = await validarAdmin(req);

  if (!validacao.ok) {
    return NextResponse.json(
      { error: validacao.message },
      { status: validacao.status }
    );
  }

  const body = await req.json();
  const id = String(body.id || '').trim();
  const ativo = Boolean(body.ativo);

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('broker_invites')
    .update({ ativo })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const validacao = await validarAdmin(req);

  if (!validacao.ok) {
    return NextResponse.json(
      { error: validacao.message },
      { status: validacao.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('broker_invites')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}