import { QueryClient } from "@tanstack/react-query"

import { ErrorApi } from "@/compartido/api/errores"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Los errores 4xx (validación, permisos, no encontrado) no mejoran al
      // reintentar; solo se reintentan fallos de red o del servidor.
      retry: (intentos, error) =>
        intentos < 1 &&
        !(
          error instanceof ErrorApi &&
          error.estado >= 400 &&
          error.estado < 500
        ),
    },
    mutations: { retry: false },
  },
})
