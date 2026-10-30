import { useEffect, useRef } from "react"
import { useBlocker } from "react-router"

/**
 * Pide confirmación antes de salir de la pantalla con cambios sin guardar:
 * navegación del router (`useBlocker`) y recarga o cierre de la pestaña
 * (`beforeunload`). Requiere un data router (`createBrowserRouter`).
 *
 * El router admite un solo bloqueador activo: se usa una vez por página y
 * recibe los cambios pendientes de cada formulario (ej.
 * `{ sucursal: true, certificado: false }`).
 */
export function useAvisoCambiosSinGuardar(cambios: Record<string, boolean>) {
  // Orígenes cuyos cambios se ignoran durante `sinAviso`.
  const omitidos = useRef(new Set<string>())
  const pendientes = (omitir: Set<string>) =>
    Object.entries(cambios).some(
      ([origen, hayCambios]) => hayCambios && !omitir.has(origen)
    )
  const hayCambios = pendientes(new Set())

  const bloqueador = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      pendientes(omitidos.current)
  )

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
