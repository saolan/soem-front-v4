import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { ErrorApi, mensajeDeError } from "@/compartido/api/errores"

/**
 * Refleja los `errores` del back-end en los campos del formulario y devuelve
 * el mensaje general a mostrar como aviso.
 */
export function aplicarErroresFormulario<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[]
): string {
  if (error instanceof ErrorApi) {
    for (const { campo, detalle } of error.errores) {
      const campoFormulario = campos.find((nombre) => nombre === campo)
      if (campoFormulario) {
        setError(campoFormulario, { type: "server", message: detalle })
      }
    }
  }
  return mensajeDeError(error)
}
