import type { z } from "zod"

import { ErrorApi, mensajePorEstado } from "@/compartido/api/errores"
import { esquemaRespuestaApi, type Paginacion } from "@/compartido/api/esquemas"

const URL_BASE = "/api/v1"
const PREFIJO_AUTH = "/auth/"
// Endpoints públicos: su 401 es definitivo (credenciales inválidas, refresh
// vencido); renovar ahí provocaría un bucle.
const RUTAS_SIN_RENOVACION = ["/auth/login", "/auth/refresh", "/auth/logout"]

type Metodo = "GET" | "POST" | "PUT" | "DELETE"
type ValorParametro = string | number | boolean | null | undefined

export interface OpcionesPeticion<T extends z.ZodType> {
  esquema: T
  metodo?: Metodo
  cuerpo?: unknown
  parametros?: Record<string, ValorParametro>
}

export interface RespuestaHttp<T> {
  datos: T
  mensaje: string
  paginacion: Paginacion | null
}

interface ManejadoresSesion {
  /** Pide un access token nuevo; devuelve `true` si la sesión se renovó. */
  renovar: () => Promise<boolean>
  /** La sesión no se pudo renovar: limpiar estado y volver al login. */
  alExpirar: () => void
}

// El access token vive solo en memoria (nunca en storage ni en la URL).
let accessToken: string | null = null
let manejadores: ManejadoresSesion | null = null
let renovacionEnCurso: Promise<boolean> | null = null

export function establecerToken(token: string | null) {
  accessToken = token
}

export function registrarManejadoresSesion(nuevos: ManejadoresSesion) {
  manejadores = nuevos
  return () => {
    if (manejadores === nuevos) {
      manejadores = null
    }
  }
}

/**
 * Renovación single-flight: el refresh token rota en cada uso, así que todas
 * las llamadas concurrentes comparten la misma promesa.
 */
export function renovarSesion(): Promise<boolean> {
  if (!manejadores) {
    return Promise.resolve(false)
  }
  renovacionEnCurso ??= manejadores
    .renovar()
    .catch(() => false)
    .finally(() => {
      renovacionEnCurso = null
    })
  return renovacionEnCurso
}

function construirUrl(
  ruta: string,
  parametros?: Record<string, ValorParametro>
) {
  const busqueda = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== null && valor !== "") {
      busqueda.append(clave, String(valor))
    }
  }
  const consulta = busqueda.toString()
  return `${URL_BASE}${ruta}${consulta ? `?${consulta}` : ""}`
}

// Un 401 del contenedor MP-JWT puede llegar sin cuerpo o sin JSON.
async function leerCuerpo(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text()
  if (!texto) {
    return null
  }
  try {
    return JSON.parse(texto) as unknown
  } catch {
    return null
  }
}

function crearErrorApi(estado: number, cuerpo: unknown): ErrorApi {
  const resultado = esquemaRespuestaApi.safeParse(cuerpo)
  if (!resultado.success) {
    return new ErrorApi(estado, mensajePorEstado(estado))
  }
  return new ErrorApi(
    estado,
    resultado.data.mensaje || mensajePorEstado(estado),
    resultado.data.errores ?? []
  )
}

async function ejecutar<T extends z.ZodType>(
  ruta: string,
  opciones: OpcionesPeticion<T>,
  esReintento: boolean
): Promise<RespuestaHttp<z.infer<T>>> {
  const esAuth = ruta.startsWith(PREFIJO_AUTH)
  const encabezados: Record<string, string> = { Accept: "application/json" }
  if (opciones.cuerpo !== undefined) {
    encabezados["Content-Type"] = "application/json"
  }
  if (accessToken) {
    encabezados.Authorization = `Bearer ${accessToken}`
  }

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta, opciones.parametros), {
      method: opciones.metodo ?? "GET",
      headers: encabezados,
      body:
        opciones.cuerpo !== undefined
          ? JSON.stringify(opciones.cuerpo)
          : undefined,
      // La cookie del refresh token solo viaja a /api/v1/auth.
      credentials: esAuth ? "include" : "same-origin",
    })
  } catch {
    throw new ErrorApi(0, mensajePorEstado(0))
  }

  const cuerpo = await leerCuerpo(respuesta)

  if (!respuesta.ok) {
    if (
      respuesta.status === 401 &&
      !esReintento &&
      !RUTAS_SIN_RENOVACION.includes(ruta)
    ) {
      if (await renovarSesion()) {
        return ejecutar(ruta, opciones, true)
      }
      manejadores?.alExpirar()
    }
    throw crearErrorApi(respuesta.status, cuerpo)
  }

  const envoltorio = esquemaRespuestaApi.safeParse(cuerpo)
  // JSON-B omite las propiedades null: un `datos` ausente equivale a null.
  const datos = envoltorio.success
    ? opciones.esquema.safeParse(envoltorio.data.datos ?? null)
    : null
  if (!envoltorio.success || !datos?.success) {
    if (import.meta.env.DEV) {
      // Solo rutas y mensajes de Zod: nunca el cuerpo (puede traer tokens).
      const problemas = (envoltorio.success ? datos?.error : envoltorio.error)
        ?.issues
      console.warn(
        `Respuesta de ${ruta} no cumple el esquema:`,
        problemas?.map((p) => `${p.path.join(".") || "(raíz)"}: ${p.message}`)
      )
    }
    throw new ErrorApi(respuesta.status, "Respuesta inesperada del servidor")
  }
  return {
    datos: datos.data,
    mensaje: envoltorio.data.mensaje,
    paginacion: envoltorio.data.paginacion ?? null,
  }
}

export function clienteHttp<T extends z.ZodType>(
  ruta: string,
  opciones: OpcionesPeticion<T>
): Promise<RespuestaHttp<z.infer<T>>> {
  return ejecutar(ruta, opciones, false)
}
