import { QueryClient } from "@tanstack/react-query"

import { esReintentable } from "@/compartido/api/errores"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Solo se reintentan fallos de red o del servidor.
      retry: (intentos, error) => intentos < 1 && esReintentable(error),
    },
    mutations: { retry: false },
  },
})
