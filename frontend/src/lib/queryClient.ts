import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Persistidor usando localStorage para evitar errores de sincronización asíncrona.
 */
export const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos se consideran "frescos" por 5 minutos antes de intentar revalidar
      staleTime: 1000 * 60 * 5,
      // Cacheamos los datos por 24 horas
      gcTime: 1000 * 60 * 60 * 24,
      // Reintentos automáticos en caso de fallo de red
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});
