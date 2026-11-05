import { useEffect, useSyncExternalStore } from "react"

/**
 * Registro de los cambios sin guardar de las páginas abiertas, para avisos
 * globales (ej. el cierre de sesión por inactividad). Solo guarda
 * descripciones legibles ("los datos de la sucursal"), nunca valores de los
 * formularios. Es estado de interfaz en memoria: no usa Context, reservado a
 * la sesión y al tema.
 */
const registros = new Map<string, readonly string[]>()
const suscriptores = new Set<() => void>()
let instantanea: readonly string[] = []

function publicar() {
  instantanea = [...new Set([...registros.values()].flat())]
  for (const avisar of suscriptores) {
    avisar()
  }
}

function suscribir(avisar: () => void) {
  suscriptores.add(avisar)
  return () => {
    suscriptores.delete(avisar)
  }
}

const leer = () => instantanea

/** Publica las descripciones pendientes de `id` mientras el llamador esté montado. */
export function usePublicarCambiosPendientes(
  id: string,
  descripciones: readonly string[]
) {
  // Clave estable: el arreglo cambia de identidad en cada render.
  const clave = JSON.stringify(descripciones)
  useEffect(() => {
    const lista = JSON.parse(clave) as string[]
    if (lista.length > 0) {
      registros.set(id, lista)
    } else {
      registros.delete(id)
    }
    publicar()
    return () => {
      registros.delete(id)
      publicar()
    }
  }, [id, clave])
}

/** Descripciones de todos los cambios sin guardar, sin repetir. */
export function useCambiosPendientes(): readonly string[] {
  return useSyncExternalStore(suscribir, leer)
}
