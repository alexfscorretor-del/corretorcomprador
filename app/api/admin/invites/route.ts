import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerEnv } from '@/lib/env';
import { adminInviteSchema } from '@/schemas/auth';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

async function validarAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false as const, status: 401, message: 'Não autenticado.' };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const admin = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) {
    return { ok: false as const, status: 401, message: 'Sessão inválida.' };
  }

  const { ADMIN_EMAIL } = getServerEnv();
  if ((user.email || '').toLowerCase() !== ADMIN_EMAIL) {
    return { ok: false as const, status: 403, message: 'Acesso negado.' };
  }

  return { ok: true as const, user };
}

export async function GET(req: NextRequest) {
  const validacao = await validarAdmin(req);
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.message }, { status: validacao.status });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('broker_invites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('admin invites GET', error, undefined, 'api/admin/invites');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: data });
}

export async function POST(req: NextRequest) {
  const validacao = await validarAdmin(req);
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.message }, { status: validacao.status });
  }

  try {
    const body = await req.json();
    const parsed = adminInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join('; ') },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const nome = parsed.data.nome?.trim() || null;

    const { data, error } = await getSupabaseAdmin()
      .from('broker_invites')
      .insert({
        email,
        nome,
        ativo: true,
        invited_by: validacao.user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('admin invites POST', error, undefined, 'api/admin/invites');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invite: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const validacao = await validarAdmin(req);
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.message }, { status: validacao.status });
  }

  try {
    const body = await req.json();
    const id = body?.id as string | undefined;
    const ativo = body?.ativo as boolean | undefined;

    if (!id || typeof ativo !== 'boolean') {
      return NextResponse.json(
        { error: 'Payload inválido: id e ativo são obrigatórios.' },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from('broker_invites')
      .update({ ativo })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invite: data });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const validacao = await validarAdmin(req);
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.message }, { status: validacao.status });
  }

  try {
    const body = await req.json();
    const id = body?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('broker_invites')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
