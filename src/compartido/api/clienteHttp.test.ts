import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import {
  clienteHttp,
  establecerToken,
  registrarManejadoresSesion,
  renovarSesion,
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

  it("serializa el refresh entre pestañas con un lock del navegador", async () => {
    const request = vi.fn((_nombre: string, accion: () => Promise<unknown>) =>
      accion()
    )
    Object.defineProperty(navigator, "locks", {
      value: { request },
      configurable: true,
    })
    const renovar = vi.fn(async () => true)
    desregistrar = registrarManejadoresSesion({ renovar, alExpirar: vi.fn() })

    try {
      expect(await renovarSesion()).toBe("renovada")
      expect(request).toHaveBeenCalledTimes(1)
      expect(request.mock.calls[0]?.[0]).toBe("soem-refresh")
      expect(renovar).toHaveBeenCalledTimes(1)
    } finally {
      Reflect.deleteProperty(navigator, "locks")
    }
  })

  it("con 401 sin cuerpo y refresh rechazado (401) expira la sesión", async () => {
    const alExpirar = vi.fn()
    desregistrar = registrarManejadoresSesion({
      renovar: () =>
        Promise.reject(new ErrorApi(401, "Sesión inválida o expirada")),
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

  it.each([
    ["sin conexión", 0],
    ["error del servidor", 503],
  ])(
    "si el refresh falla por %s conserva la sesión y no expira",
    async (_caso, estado) => {
      const alExpirar = vi.fn()
      desregistrar = registrarManejadoresSesion({
        renovar: () => Promise.reject(new ErrorApi(estado, "fallo")),
        alExpirar,
      })
      fetchSimulado.mockResolvedValue(new Response("", { status: 401 }))

      const error = await clienteHttp("/a", { esquema: esquemaPrueba }).catch(
        (e: unknown) => e
      )

      expect(error).toBeInstanceOf(ErrorApi)
      // Estado 0: TanStack Query lo reintenta (esReintentable).
      expect((error as ErrorApi).estado).toBe(0)
      expect((error as ErrorApi).message).toBe(
        "No se pudo conectar con el servidor para renovar la sesión. Intente nuevamente."
      )
      expect(alExpirar).not.toHaveBeenCalled()
    }
  )

  it("tras un refresh fallido, la siguiente petición vuelve a renovar", async () => {
    const renovar = vi
      .fn<() => Promise<boolean>>()
      .mockRejectedValueOnce(new ErrorApi(0, "sin conexión"))
      .mockImplementationOnce(async () => {
        establecerToken("nuevo")
        return true
      })
    desregistrar = registrarManejadoresSesion({ renovar, alExpirar: vi.fn() })
    fetchSimulado.mockImplementation(async (_url, init) =>
      encabezado(init, "Authorization") === "Bearer nuevo"
        ? exito({ id: 1 })
        : new Response("", { status: 401 })
    )

    await expect(
      clienteHttp("/a", { esquema: esquemaPrueba })
    ).rejects.toBeInstanceOf(ErrorApi)
    const { datos } = await clienteHttp("/a", { esquema: esquemaPrueba })

    expect(datos.id).toBe(1)
    expect(renovar).toHaveBeenCalledTimes(2)
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

  it.each([502, 503, 504])(
    "un %i del proxy sin cuerpo indica que el servidor no está disponible",
    async (estado) => {
      fetchSimulado.mockResolvedValue(new Response("", { status: estado }))

      await expect(
        clienteHttp("/auth/login", { metodo: "POST", esquema: esquemaPrueba })
      ).rejects.toMatchObject({
        estado,
        message:
          "El servidor no está disponible en este momento. Intente nuevamente en unos minutos.",
      })
    }
  )

  it("un 503 con RespuestaApi conserva el mensaje del back-end", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        { exito: false, mensaje: "Servicio de firma no disponible" },
        503
      )
    )

    await expect(
      clienteHttp("/a", { esquema: esquemaPrueba })
    ).rejects.toMatchObject({ message: "Servicio de firma no disponible" })
  })
})
