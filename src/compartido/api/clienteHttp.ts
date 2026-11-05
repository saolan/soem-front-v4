import type { z } from "zod"

import { ErrorApi, mensajePorEstado } from "@/compartido/api/errores"
import { esquemaRespuestaApi, type Paginacion } from "@/compartido/api/esquemas"

const URL_BASE = "/api/v1"
const PREFIJO_AUTH = "/auth/"
// Endpoints públicos: su 401 es definitivo (credenciales inválidas, refresh
// vencido); renovar ahí provocaría un bucle.
const RUTAS_SIN_RENOVACION = ["/auth/login", "/auth/refresh", "/auth/logout"]
const NOMBRE_LOCK_REFRESH = "soem-refresh"
const MENSAJE_RENOVACION_FALLIDA =
  "No se pudo conectar con el servidor para renovar la sesión. Intente nuevamente."

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

/**
 * Resultado de renovar el access token:
 * - `renovada`: hay un access token nuevo.
 * - `rechazada`: el servidor respondió 401 (refresh vencido, revocado o sin
 *   cookie); la sesión terminó de verdad.
 * - `fallida`: no se pudo consultar (red caída, servidor reiniciándose,
 *   5xx); la sesión puede seguir vigente y se reintenta en la siguiente
 *   petición.
 */
export type ResultadoRenovacion = "renovada" | "rechazada" | "fallida"

interface ManejadoresSesion {
  /** Pide un access token nuevo; falla con `ErrorApi` si no lo consigue. */
  renovar: () => Promise<boolean>
  /** La sesión no se pudo renovar: limpiar estado y volver al login. */
  alExpirar: () => void
}

// El access token vive solo en memoria (nunca en storage ni en la URL).
let accessToken: string | null = null
let manejadores: ManejadoresSesion | null = null
let renovacionEnCurso: Promise<ResultadoRenovacion> | null = null

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
 * Las pestañas comparten la cookie del refresh token: un lock del navegador
 * evita dos refresh simultáneos, que el back-end trataría como reuso y
 * revocaría todas las sesiones del usuario.
 */
function conLockDeRefresh<T>(accion: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    return accion()
  }
  return navigator.locks.request(NOMBRE_LOCK_REFRESH, accion)
}

/**
 * Renovación single-flight: el refresh token rota en cada uso, así que todas
 * las llamadas concurrentes comparten la misma promesa.
 */
export function renovarSesion(): Promise<ResultadoRenovacion> {
  const actuales = manejadores
  if (!actuales) {
    return Promise.resolve("rechazada")
  }
  renovacionEnCurso ??= conLockDeRefresh(() => actuales.renovar())
    .then((renovada): ResultadoRenovacion =>
      renovada ? "renovada" : "rechazada"
    )
    .catch((error: unknown): ResultadoRenovacion => {
      // Solo un 401 del refresh termina la sesión; cualquier otro fallo es
      // transitorio y no debe sacar al usuario del sistema.
      const estado = error instanceof ErrorApi ? error.estado : 0
      if (import.meta.env.DEV) {
        // Solo el código HTTP: nunca el cuerpo ni la cookie.
        console.warn(`No se pudo renovar la sesión (HTTP ${estado})`)
      }
      return estado === 401 ? "rechazada" : "fallida"
    })
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
      const renovacion = await renovarSesion()
      if (renovacion === "renovada") {
        return ejecutar(ruta, opciones, true)
      }
      if (renovacion === "fallida") {
        throw new ErrorApi(0, MENSAJE_RENOVACION_FALLIDA)
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
