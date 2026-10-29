import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
  type RouteObject,
} from "react-router"
import { vi } from "vitest"

import {
  ContextoSesion,
  type ValorSesion,
} from "@/compartido/sesion/ContextoSesion"

/** Respuesta del API envuelta en RespuestaApi. */
export function respuestaApi(
  datos: unknown,
  status = 200,
  extra: Record<string, unknown> = {}
) {
  return new Response(
    JSON.stringify({ exito: status < 400, mensaje: "ok", datos, ...extra }),
    { status }
  )
}

/** Muestra la ruta actual para comprobar navegaciones. */
export function Ubicacion() {
  const { pathname, search } = useLocation()
  return <output aria-label="Ubicación">{`${pathname}${search}`}</output>
}

/** Renderiza rutas con sesión simulada (permisos dados), Query y router. */
export function renderizarPagina({
  rutas,
  url,
  permisos,
}: {
  rutas: RouteObject[]
  url: string
  permisos: string[]
}) {
  const sesion: ValorSesion = {
    estado: "autenticado",
    sesion: {
      expiraEnSegundos: 900,
      sucursalId: 1,
      sucursales: [{ valor: 1, etiqueta: "Matriz" }],
      usuario: { cedulaRuc: "1", apelli: "Pérez", usuari: "aa", estado: true },
      permisos,
      claveCaducada: false,
    },
    iniciarSesion: vi.fn(),
    cerrarSesion: vi.fn(),
  }
  const queryClient = new QueryClient({
    // Mismo staleTime que src/app/queryClient.ts: los datos recién puestos en
    // caché no se vuelven a pedir al montar.
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  })
  const router = createMemoryRouter(rutas, { initialEntries: [url] })
  render(
    <QueryClientProvider client={queryClient}>
      <ContextoSesion value={sesion}>
        <RouterProvider router={router} />
      </ContextoSesion>
    </QueryClientProvider>
  )
  return { router }
}
