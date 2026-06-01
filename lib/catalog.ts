import { Client, Broker } from '@/types';

/**
 * Abre a página pública do catálogo do cliente.
 * Rota Next.js real: /catalogo/[id]
 */
export function generateClientCatalog(client: Client, _broker: Broker): void {
  if (!client.properties || client.properties.length === 0) {
    alert('Cadastre pelo menos um imóvel primeiro.');
    return;
  }
  const url = `${window.location.origin}/catalogo/${client.id}`;
  window.open(url, '_blank');
}
