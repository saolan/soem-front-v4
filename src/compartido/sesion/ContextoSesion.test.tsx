import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, render } from "@testing-library/react"
import { useEffect } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { establecerToken, renovarSesion } from "@/compartido/api/clienteHttp"
import {
  SesionProvider,
  type ValorSesion,
} from "@/compartido/sesion/ContextoSesion"
import type { LoginRespuestaDTO } from "@/compartido/sesion/esquemas"
import { CanalFalso } from "@/compartido/sesion/pruebas/CanalFalso"
import { useSesion } from "@/compartido/sesion/useSesion"

function sesionDe(usuari: string): LoginRespuestaDTO {
  return {
    accessToken: `token-${usuari}`,
    expiraEnSegundos: 900,
    sucursalId: 1,
    sucursales: [{ valor: 1, etiqueta: "Matriz" }],
    usuario: { cedulaRuc: "0102030405", apelli: usuari, usuari, estado: true },
    permisos: [],
    claveCaducada: false,
  }
}

function respuesta(datos: unknown, status = 200) {
  return new Response(
    JSON.stringify({ exito: status < 400, mensaje: "", datos }),
    { status }
  )
}

const capturada: { valor?: ValorSesion } = {}
function Sonda() {
  const valor = useSesion()
  useEffect(() => {
    capturada.valor = valor
  })
  return null
}

const actual = () => capturada.valor

describe("SesionProvider entre pestañas", () => {
  const fetchSimulado = vi.fn<typeof fetch>()
  // La "otra pestaña" escucha y envía por el mismo canal.
  let otraPestana: CanalFalso
  let recibidos: unknown[]
  // Usuario que devolverá /auth/refresh (null = sin cookie vigente).
  let usuarioDelRefresh: string | null

  beforeEach(async () => {
    vi.stubGlobal("BroadcastChannel", CanalFalso)
    vi.stubGlobal("fetch", fetchSimulado)
    usuarioDelRefresh = null
    fetchSimulado.mockImplementation(async (url) => {
      if (String(url).endsWith("/auth/refresh")) {
        return usuarioDelRefresh
          ? respuesta(sesionDe(usuarioDelRefresh))
          : respuesta(null, 401)
      }
      return respuesta(null)
    })
    recibidos = []
    otraPestana = new CanalFalso("soem-sesion")
    otraPestana.onmessage = (mensaje) => recibidos.push(mensaje.data)

    render(
      <QueryClientProvider client={new QueryClient()}>
        <SesionProvider>
          <Sonda />
        </SesionProvider>
      </QueryClientProvider>
    )
    await vi.waitFor(() => expect(actual()?.estado).toBe("anonimo"))
  })

  afterEach(() => {
    cleanup()
    establecerToken(null)
    CanalFalso.reiniciar()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  const llamadas = (ruta: string) =>
    fetchSimulado.mock.calls.filter(([url]) => String(url).endsWith(ruta))

  it("anuncia el inicio y el cierre de sesión a las demás pestañas", () => {
    act(() => actual()?.iniciarSesion(sesionDe("aa")))
    act(() => actual()?.cerrarSesion())

    expect(recibidos).toEqual([{ tipo: "iniciada" }, { tipo: "cerrada" }])
  })

  it("la renovación del token no se anuncia", async () => {
    act(() => actual()?.iniciarSesion(sesionDe("aa")))
    usuarioDelRefresh = "aa"

    await act(() => renovarSesion())

    expect(recibidos).toEqual([{ tipo: "iniciada" }])
  })

  it("cierra la sesión local si otra pestaña la cerró, sin llamar al API", async () => {
    act(() => actual()?.iniciarSesion(sesionDe("aa")))

    act(() => otraPestana.postMessage({ tipo: "cerrada" }))

    expect(actual()?.estado).toBe("anonimo")
    expect(actual()?.sesion).toBeNull()
    expect(llamadas("/auth/logout")).toHaveLength(0)
  })

  it("adopta la sesión que otra pestaña inició con otro usuario", async () => {
    act(() => actual()?.iniciarSesion(sesionDe("aa")))
    usuarioDelRefresh = "cc"
    const refreshPrevios = llamadas("/auth/refresh").length

    act(() => otraPestana.postMessage({ tipo: "iniciada" }))

    await vi.waitFor(() => expect(actual()?.sesion?.usuario.usuari).toBe("cc"))
    expect(llamadas("/auth/refresh")).toHaveLength(refreshPrevios + 1)
    // Adoptar la sesión no genera un nuevo aviso.
    expect(recibidos).toEqual([{ tipo: "iniciada" }])
  })

  it("una pestaña en el login adopta la sesión iniciada en otra", async () => {
    usuarioDelRefresh = "cc"

    act(() => otraPestana.postMessage({ tipo: "iniciada" }))

    await vi.waitFor(() => expect(actual()?.estado).toBe("autenticado"))
    expect(actual()?.sesion?.usuario.usuari).toBe("cc")
  })
})
