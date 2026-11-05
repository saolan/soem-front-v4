import { useEffect, useRef, useState } from "react"
import { useBlocker } from "react-router"

/** Formulario de la página que puede tener cambios sin guardar. */
export interface OrigenCambios {
  /** Hay cambios sin guardar. */
  pendiente: boolean
  /**
   * Qué se perdería, para el aviso al salir (ej. "los datos de la
   * sucursal").
   */
  descripcion: string
}

/**
 * Pide confirmación antes de salir de la pantalla con cambios sin guardar:
 * navegación del router (`useBlocker`) y recarga o cierre de la pestaña
 * (`beforeunload`). Requiere un data router (`createBrowserRouter`).
 *
 * El router admite un solo bloqueador activo: se usa una vez por página y
 * recibe los cambios pendientes de cada formulario (ej.
 * `{ sucursal: { pendiente: true, descripcion: "los datos de la sucursal" } }`).
 */
export function useAvisoCambiosSinGuardar(
  cambios: Record<string, OrigenCambios>
) {
  // Orígenes cuyos cambios se ignoran durante `sinAviso`.
  const omitidos = useRef(new Set<string>())
  // Descripciones de lo pendiente al bloquear la navegación. Se fijan en ese
  // momento: tras guardar un formulario su `reset` puede reflejarse después.
  const [pendientes, setPendientes] = useState<string[]>([])
  const describirPendientes = (omitir: Set<string>) =>
    Object.entries(cambios)
      .filter(([origen, { pendiente }]) => pendiente && !omitir.has(origen))
      .map(([, { descripcion }]) => descripcion)
  const hayCambios = describirPendientes(new Set()).length > 0

  const bloqueador = useBlocker(({ currentLocation, nextLocation }) => {
    if (currentLocation.pathname === nextLocation.pathname) {
      return false
    }
    const descripciones = describirPendientes(omitidos.current)
    setPendientes(descripciones)
    return descripciones.length > 0
  })

  useEffect(() => {
    if (!hayCambios) {
      return
    }
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [hayCambios])

  return {
    bloqueado: bloqueador.state === "blocked",
    /** Descripciones de los cambios que se perderían al salir. */
    pendientes,
    /** Sale de la pantalla descartando los cambios. */
    confirmar: () => bloqueador.proceed?.(),
    /** Permanece en la pantalla. */
    cancelar: () => bloqueador.reset?.(),
    /**
     * Ejecuta una acción que puede navegar (ej. guardar y volver al listado)
     * sin avisar por los cambios de `origen`, que la acción guarda. Los demás
     * orígenes siguen avisando.
     */
    sinAviso: async <T>(origen: string, accion: () => Promise<T>) => {
      omitidos.current.add(origen)
      try {
        return await accion()
      } finally {
        omitidos.current.delete(origen)
      }
    },
  }
}

export type AvisoCambiosSinGuardar = ReturnType<
  typeof useAvisoCambiosSinGuardar
>
