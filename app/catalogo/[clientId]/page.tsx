import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import CatalogoClientPage from './CatalogoClientPage';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 0;

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function CatalogoPage({ params }: PageProps) {
  const { clientId } = await params;

  const { data: clientData, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('archived', false)
    .single();

  if (clientError || !clientData) {
    notFound();
  }

  const { data: propertiesData } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('client_id', clientId)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  const { data: brokerData } = await supabaseAdmin
    .from('brokers')
    .select('id, nome, nome_exibicao, telefone, email, empresa, creci')
    .eq('user_id', clientData.user_id)
    .maybeSingle();

  return (
    <CatalogoClientPage
      client={clientData}
      properties={propertiesData || []}
      broker={brokerData || null}
    />
  );
}
