import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import {
  clienteHttp,
  establecerToken,
  registrarManejadoresSesion,
} from "@/compartido/api/clienteHttp"
import { ErrorApi } from "@/compartido/api/errores"

const esquemaPrueba = z.object({ id: z.number() })

function respuestaJson(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function exito(datos: unknown) {
  return respuestaJson({ exito: true, mensaje: "ok", datos, errores: [] })
}

function encabezado(init: RequestInit | undefined, nombre: string) {
  return (init?.headers as Record<string, string> | undefined)?.[nombre]
}

describe("clienteHttp", () => {
  const fetchSimulado = vi.fn<typeof fetch>()
  let desregistrar: (() => void) | undefined

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
  })

  afterEach(() => {
    desregistrar?.()
    desregistrar = undefined
    establecerToken(null)
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  it("devuelve datos, mensaje y paginación validados", async () => {
    fetchSimulado.mockResolvedValue(exito({ id: 7 }))

    const respuesta = await clienteHttp("/recursos/7", {
      esquema: esquemaPrueba,
    })

    expect(respuesta).toEqual({
      datos: { id: 7 },
      mensaje: "ok",
      paginacion: null,
    })
    expect(fetchSimulado.mock.calls[0]?.[0]).toBe("/api/v1/recursos/7")
  })

  it("solo envía Authorization, Content-Type y Accept, y omite parámetros vacíos", async () => {
    establecerToken("token-a")
    fetchSimulado.mockResolvedValue(exito({ id: 1 }))

    await clienteHttp("/recursos", {
      metodo: "POST",
      cuerpo: { descri: "x" },
      parametros: { pagina: 1, filtro: "", estado: undefined },
      esquema: esquemaPrueba,
    })

    const [url, init] = fetchSimulado.mock.calls[0] ?? []
    expect(url).toBe("/api/v1/recursos?pagina=1")
    expect(Object.keys(init?.headers ?? {}).sort()).toEqual([
      "Accept",
      "Authorization",
      "Content-Type",
    ])
    expect(encabezado(init, "Authorization")).toBe("Bearer token-a")
    expect(init?.credentials).toBe("same-origin")
  })

  it("ante 401 concurrentes ejecuta un único refresh y reintenta una vez", async () => {
    establecerToken("vencido")
    const renovar = vi.fn(async () => {
      await new Promise((resolver) => setTimeout(resolver, 10))
      establecerToken("nuevo")
      return true
    })
    desregistrar = registrarManejadoresSesion({ renovar, alExpirar: vi.fn() })
    fetchSimulado.mockImplementation(async (_url, init) =>
      encabezado(init, "Authorization") === "Bearer nuevo"
        ? exito({ id: 1 })
        : new Response(null, { status: 401 })
    )

    const resultados = await Promise.all([
      clienteHttp("/a", { esquema: esquemaPrueba }),
      clienteHttp("/b", { esquema: esquemaPrueba }),
      clienteHttp("/c", { esquema: esquemaPrueba }),
    ])

    expect(renovar).toHaveBeenCalledTimes(1)
    expect(fetchSimulado).toHaveBeenCalledTimes(6)
    expect(resultados.map((r) => r.datos.id)).toEqual([1, 1, 1])
  })

  it("con 401 sin cuerpo y refresh fallido expira la sesión", async () => {
    const alExpirar = vi.fn()
    desregistrar = registrarManejadoresSesion({
      renovar: () => Promise.reject(new Error("refresh vencido")),
      alExpirar,
    })
    fetchSimulado.mockResolvedValue(new Response("", { status: 401 }))

    const error = await clienteHttp("/a", { esquema: esquemaPrueba }).catch(
      (e: unknown) => e
    )

    expect(error).toBeInstanceOf(ErrorApi)
    expect((error as ErrorApi).estado).toBe(401)
    expect((error as ErrorApi).message).toBe("Debe iniciar sesión nuevamente")
    expect(alExpirar).toHaveBeenCalledTimes(1)
  })

  it("no intenta refresh ante 401 de /auth/login y conserva el mensaje", async () => {
    const renovar = vi.fn(async () => true)
    desregistrar = registrarManejadoresSesion({ renovar, alExpirar: vi.fn() })
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        {
          exito: false,
          mensaje: "Usuario o clave incorrectos",
          datos: null,
          errores: [],
        },
        401
      )
    )

    await expect(
      clienteHttp("/auth/login", {
        metodo: "POST",
        cuerpo: { usuario: "a", clave: "b" },
        esquema: esquemaPrueba,
      })
    ).rejects.toThrow("Usuario o clave incorrectos")
    expect(renovar).not.toHaveBeenCalled()
    expect(fetchSimulado.mock.calls[0]?.[1]?.credentials).toBe("include")
  })

  it("expone los errores por campo de un 400", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        {
          exito: false,
          mensaje: "Error de validación en los datos enviados",
          datos: null,
          errores: [
            { campo: "descri", detalle: "La descripción es obligatoria" },
          ],
        },
        400
      )
    )

    const error = await clienteHttp("/a", { esquema: esquemaPrueba }).catch(
      (e: unknown) => e
    )

    expect(error).toBeInstanceOf(ErrorApi)
    expect((error as ErrorApi).errores).toEqual([
      { campo: "descri", detalle: "La descripción es obligatoria" },
    ])
  })

  it("rechaza datos que no cumplen el esquema", async () => {
    fetchSimulado.mockResolvedValue(exito({ id: "no-numero" }))

    await expect(clienteHttp("/a", { esquema: esquemaPrueba })).rejects.toThrow(
      "Respuesta inesperada del servidor"
    )
  })

  it("trata como null los datos omitidos por JSON-B", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson({ exito: true, mensaje: "Sesión cerrada", errores: [] })
    )

    const respuesta = await clienteHttp("/auth/logout", {
      metodo: "POST",
      esquema: z.null(),
    })

    expect(respuesta.datos).toBeNull()
  })

  it("convierte un fallo de red en ErrorApi con estado 0", async () => {
    fetchSimulado.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(
      clienteHttp("/a", { esquema: esquemaPrueba })
    ).rejects.toMatchObject({ estado: 0 })
  })
})
