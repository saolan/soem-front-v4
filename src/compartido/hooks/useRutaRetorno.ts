import { useLocation } from "react-router"
import { z } from "zod"

// `state` de la navegación que sale de un listado: sus parámetros (filtros,
// orden y página) para volver a él tal como estaba.
const esquemaEstadoRetorno = z.object({ retorno: z.string().startsWith("?") })

export type EstadoRetorno = z.infer<typeof esquemaEstadoRetorno>

/** `state` para los enlaces que salen del listado (`location.search`). */
export function estadoRetorno(search: string): EstadoRetorno | undefined {
  return search ? { retorno: search } : undefined
}

/**
 * Ruta para volver al listado `rutaBase` con los parámetros que tenía, y el
 * `state` a propagar si se navega a otra pantalla de detalle.
 */
export function useRutaRetorno(rutaBase: string) {
  const { state } = useLocation()
  const resultado = esquemaEstadoRetorno.safeParse(state)
  return resultado.success
    ? { ruta: `${rutaBase}${resultado.data.retorno}`, estado: resultado.data }
    : { ruta: rutaBase, estado: undefined }
}
