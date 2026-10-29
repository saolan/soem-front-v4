import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { ErrorApi, mensajeDeError } from "@/compartido/api/errores"

/**
 * Refleja los `errores` del back-end en los campos del formulario y devuelve
 * el mensaje general a mostrar como aviso. `alias` traduce nombres de campo
 * que el back-end devuelve distintos al DTO (ej. `certificadoEmisor.clave`).
 */
export function aplicarErroresFormulario<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
  alias: Readonly<Record<string, Path<T>>> = {}
): string {
  if (error instanceof ErrorApi) {
    for (const { campo, detalle } of error.errores) {
      const nombre = campo ? (alias[campo] ?? campo) : null
      const campoFormulario = campos.find((c) => c === nombre)
      if (campoFormulario) {
        setError(campoFormulario, { type: "server", message: detalle })
      }
    }
  }
  return mensajeDeError(error)
}
