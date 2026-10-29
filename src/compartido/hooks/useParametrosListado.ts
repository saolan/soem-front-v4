import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  TAMANIO_PAGINA_PREDETERMINADO,
  TAMANIOS_PAGINA,
  type Direccion,
} from "@/compartido/api/paginacion"

export interface OrdenListado<C extends string> {
  ordenarPor: C
  direccion: Direccion
}

export interface ConfiguracionListado<C extends string, F extends string> {
  /** Campos que el repositorio del back-end acepta en `ordenarPor`. */
  camposOrden: readonly C[]
  ordenPredeterminado: OrdenListado<C>
  /** Nombres de los filtros (idénticos a los query params del API). */
  filtros: readonly F[]
}

function entero(valor: string | null): number | null {
  return valor !== null && /^\d+$/.test(valor) ? Number(valor) : null
}

/**
 * Página, tamaño, orden y filtros de un listado guardados en la URL, para que
 * se pueda recargar y compartir. Los valores inválidos usan el
 * predeterminado (el API respondería 400).
 */
export function useParametrosListado<C extends string, F extends string>({
  camposOrden,
  ordenPredeterminado,
  filtros: nombresFiltros,
}: ConfiguracionListado<C, F>) {
  const [parametros, setParametros] = useSearchParams()

  const pagina = Math.max(entero(parametros.get("pagina")) ?? 1, 1)
  const tamanioUrl = entero(parametros.get("tamanio"))
  const tamanio = TAMANIOS_PAGINA.some((t) => t === tamanioUrl)
    ? (tamanioUrl as number)
    : TAMANIO_PAGINA_PREDETERMINADO
  const ordenarPorUrl = parametros.get("ordenarPor")
  const direccionUrl = parametros.get("direccion")
  const ordenValido = camposOrden.some((c) => c === ordenarPorUrl)
  const orden: OrdenListado<C> = ordenValido
    ? {
        ordenarPor: ordenarPorUrl as C,
        direccion: direccionUrl === "desc" ? "desc" : "asc",
      }
    : ordenPredeterminado

  const clave = parametros.toString()
  const filtros = useMemo(() => {
    const actuales = new URLSearchParams(clave)
    const resultado: Partial<Record<F, string>> = {}
    for (const nombre of nombresFiltros) {
      const valor = actuales.get(nombre)
      if (valor) {
        resultado[nombre] = valor
      }
    }
    return resultado
  }, [clave, nombresFiltros])

  const actualizar = useCallback(
    (cambios: Record<string, string | number | null>) => {
      setParametros((previos) => {
        const siguientes = new URLSearchParams(previos)
        for (const [nombre, valor] of Object.entries(cambios)) {
          if (valor === null || valor === "") {
            siguientes.delete(nombre)
          } else {
            siguientes.set(nombre, String(valor))
          }
        }
        return siguientes
      })
    },
    [setParametros]
  )

  const cambiarPagina = useCallback(
    (nueva: number) => actualizar({ pagina: nueva > 1 ? nueva : null }),
    [actualizar]
  )

  const cambiarTamanio = useCallback(
    (nuevo: number) => actualizar({ tamanio: nuevo, pagina: null }),
    [actualizar]
  )

  const cambiarOrden = useCallback(
    (nuevo: OrdenListado<C>) =>
      actualizar({
        ordenarPor: nuevo.ordenarPor,
        direccion: nuevo.direccion,
        pagina: null,
      }),
    [actualizar]
  )

  const cambiarFiltros = useCallback(
    (nuevos: Partial<Record<F, string>>) => {
      const cambios: Record<string, string | null> = { pagina: null }
      for (const nombre of nombresFiltros) {
        cambios[nombre] = nuevos[nombre]?.trim() || null
      }
      actualizar(cambios)
    },
    [actualizar, nombresFiltros]
  )

  return {
    pagina,
    tamanio,
    orden,
    filtros,
    cambiarPagina,
    cambiarTamanio,
    cambiarOrden,
    cambiarFiltros,
  }
}
