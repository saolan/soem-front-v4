import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ContextoSesion,
  type ValorSesion,
} from "@/compartido/sesion/ContextoSesion"
import { GuardaMenu } from "@/modulos/seguridad/componentes/GuardaMenu"

const sesion: ValorSesion = {
  estado: "autenticado",
  sesion: {
    expiraEnSegundos: 900,
    sucursalId: 1,
    sucursales: [{ valor: 1, etiqueta: "Matriz" }],
    usuario: {
      cedulaRuc: "0102030405",
      apelli: "Pérez",
      usuari: "aperez",
      estado: true,
    },
    permisos: [],
    claveCaducada: false,
  },
  iniciarSesion: vi.fn(),
  cerrarSesion: vi.fn(),
}

const menu = [
  {
    menuId: 1000,
    descri: "Seguridad",
    detall: false,
    estado: true,
    hijos: [
      {
        menuId: 1300,
        descri: "Rol",
        paginaRuta: "/seguridad/roles",
        detall: true,
        estado: true,
        hijos: [],
      },
    ],
  },
]

function renderizar(ruta: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>Inicio</p> },
      {
        element: <GuardaMenu />,
        children: [
          {
            path: "/seguridad/roles",
            handle: { rutaMenu: "/seguridad/roles" },
            element: <p>Roles</p>,
          },
          {
            path: "/caja/cajas",
            handle: { rutaMenu: "/caja/cajas" },
            element: <p>Cajas</p>,
          },
        ],
      },
    ],
    { initialEntries: [ruta] }
  )
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ContextoSesion value={sesion}>
        <RouterProvider router={router} />
      </ContextoSesion>
    </QueryClientProvider>
  )
}

describe("GuardaMenu", () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify({ exito: true, mensaje: "", datos: menu }), {
        status: 200,
      })
    )
  })

  afterEach(() => {
    cleanup()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  it("muestra la página si está en el menú de la sesión", async () => {
    renderizar("/seguridad/roles")

    expect(await screen.findByText("Roles")).toBeTruthy()
    expect(fetchSimulado.mock.calls[0]?.[0]).toBe("/api/v1/auth/menu")
  })

  it("vuelve al inicio si la página no está en el menú", async () => {
    renderizar("/caja/cajas")

    expect(await screen.findByText("Inicio")).toBeTruthy()
    expect(screen.queryByText("Cajas")).toBeNull()
  })
})
