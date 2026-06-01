import { Client, Broker } from '@/types';

/**
 * Redireciona o corretor para a página pública do catálogo do cliente.
 * A página é uma rota Next.js real em /catalogo/[clientId],
 * eliminando a geração de HTML via Blob (abordagem anterior).
 */
export function generateClientCatalog(client: Client, _broker: Broker): void {
  if (!client.properties || client.properties.length === 0) {
    alert('Cadastre pelo menos um imóvel primeiro.');
    return;
  }

  const url = `${window.location.origin}/catalogo/${client.id}`;
  window.open(url, '_blank');
}
