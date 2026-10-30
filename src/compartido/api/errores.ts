import type { ErrorCampo } from "@/compartido/api/esquemas"

/**
 * Error normalizado de una llamada al API. `estado` es el código HTTP
 * (0 si no hubo respuesta del servidor).
 */
export class ErrorApi extends Error {
  readonly estado: number
  readonly errores: ErrorCampo[]

  constructor(estado: number, mensaje: string, errores: ErrorCampo[] = []) {
    super(mensaje)
    this.name = "ErrorApi"
    this.estado = estado
    this.errores = errores
  }
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  0: "No se pudo conectar con el servidor",
  401: "Debe iniciar sesión nuevamente",
  403: "No tiene permiso para realizar esta acción",
  404: "El recurso solicitado no existe",
  409: "La operación entra en conflicto con otro registro",
}

export function mensajePorEstado(estado: number): string {
  return (
    MENSAJES_POR_ESTADO[estado] ?? "Ocurrió un error al procesar la solicitud"
  )
}

/**
 * Los errores 4xx (validación, permisos, no encontrado) no mejoran al
 * reintentar; sí los fallos de red o del servidor.
 */
export function esReintentable(error: unknown): boolean {
  return !(
    error instanceof ErrorApi &&
    error.estado >= 400 &&
    error.estado < 500
  )
}

export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorApi ? error.message : mensajePorEstado(-1)
}
