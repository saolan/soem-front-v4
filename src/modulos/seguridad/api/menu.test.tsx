import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, render, screen } from "@testing-library/react"
import { useEffect } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { establecerToken } from "@/compartido/api/clienteHttp"
import { SesionProvider } from "@/compartido/sesion/ContextoSesion"
import type { LoginRespuestaDTO } from "@/compartido/sesion/esquemas"
import { useSesion } from "@/compartido/sesion/useSesion"
import { useMenuSesion } from "@/modulos/seguridad/api/menu"

function sesionDe(usuari: string, personaId: number): LoginRespuestaDTO {
  return {
    accessToken: `token-${usuari}`,
    expiraEnSegundos: 900,
    sucursalId: 1,
    sucursales: [{ valor: 1, etiqueta: "Matriz" }],
    usuario: {
      personaId,
      cedulaRuc: "0102030405",
      apelli: usuari,
      usuari,
      estado: true,
    },
    permisos: [],
    claveCaducada: false,
  }
}

function pagina(menuId: number) {
  const paginaRuta = `/p/${menuId}`
  return {
    menuId,
    descri: paginaRuta,
    paginaRuta,
    detall: true,
    estado: true,
    hijos: [],
  }
}

// El administrador ve tres páginas y el cajero una.
const menuPorToken: Record<string, unknown[]> = {
  "Bearer token-aa": [pagina(1), pagina(2), pagina(3)],
  "Bearer token-cc": [pagina(1)],
}

function Menu() {
  const menu = useMenuSesion()
  return (
    <output aria-label="Opciones">{menu.data?.length ?? "cargando"}</output>
  )
}

// Expone la sesión del provider a la prueba (se actualiza tras cada render).
const capturada: { valor?: ReturnType<typeof useSesion> } = {}
const sesion = {
  get estado() {
    return capturada.valor?.estado
  },
  iniciarSesion: (respuesta: LoginRespuestaDTO) =>
    capturada.valor?.iniciarSesion(respuesta),
  cerrarSesion: () => capturada.valor?.cerrarSesion(),
}

function Sonda() {
  const valor = useSesion()
  useEffect(() => {
    capturada.valor = valor
  })
  // Igual que en la app: el layout (y el menú) solo existe con sesión.
  return valor.estado === "autenticado" ? <Menu /> : null
}

describe("useMenuSesion", () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
    fetchSimulado.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/auth/menu")) {
        const autorizacion =
          new Headers(init?.headers).get("Authorization") ?? ""
        return new Response(
          JSON.stringify({
            exito: true,
            mensaje: "",
            datos: menuPorToken[autorizacion],
          }),
          { status: 200 }
        )
      }
      return new Response(null, { status: 401 })
    })
  })

  afterEach(() => {
    cleanup()
    establecerToken(null)
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  it("pide el menú de cada usuario aunque compartan sucursal", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <SesionProvider>
          <Sonda />
        </SesionProvider>
      </QueryClientProvider>
    )
    await vi.waitFor(() => expect(sesion.estado).toBe("anonimo"))

    act(() => sesion.iniciarSesion(sesionDe("aa", 1)))
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Opciones").textContent).toBe("3")
    )

    act(() => sesion.cerrarSesion())
    act(() => sesion.iniciarSesion(sesionDe("cc", 2)))
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Opciones").textContent).toBe("1")
    )
  })

  it("recarga el menú si una renovación trae a otro usuario", async () => {
    // La cookie del refresh es una por navegador: si otra pestaña inicia
    // sesión con otro usuario, la renovación de esta pestaña devuelve a ese
    // usuario sin pasar por cerrarSesion.
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <SesionProvider>
          <Sonda />
        </SesionProvider>
      </QueryClientProvider>
    )
    await vi.waitFor(() => expect(sesion.estado).toBe("anonimo"))

    act(() => sesion.iniciarSesion(sesionDe("aa", 1)))
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Opciones").textContent).toBe("3")
    )

    act(() => sesion.iniciarSesion(sesionDe("cc", 2)))
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Opciones").textContent).toBe("1")
    )
  })
})
