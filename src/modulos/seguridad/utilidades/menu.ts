import type { MenuNodoDTO } from "@/modulos/seguridad/esquemas/menu"

/** Páginas (`detall: true`) del árbol, en el orden en que llegan. */
export function paginasDelMenu(nodos: MenuNodoDTO[]): MenuNodoDTO[] {
  return nodos.flatMap((nodo) =>
    nodo.detall ? [nodo] : paginasDelMenu(nodo.hijos)
  )
}

/** Rutas del router a las que el menú de la sesión da acceso. */
export function rutasDelMenu(nodos: MenuNodoDTO[]): Set<string> {
  return new Set(
    paginasDelMenu(nodos).flatMap(({ paginaRuta }) =>
      paginaRuta ? [paginaRuta] : []
    )
  )
}

function contieneRuta(ruta: string, pathname: string) {
  return pathname === ruta || pathname.startsWith(`${ruta}/`)
}

/**
 * Página del menú que corresponde a `pathname`. Gana la ruta más larga, para
 * que `/configuracion/dimms/modificar-iva` no marque `/configuracion/dimms`.
 */
export function paginaActual(
  nodos: MenuNodoDTO[],
  pathname: string
): MenuNodoDTO | null {
  let actual: MenuNodoDTO | null = null
  for (const pagina of paginasDelMenu(nodos)) {
    const ruta = pagina.paginaRuta
    if (
      ruta &&
      contieneRuta(ruta, pathname) &&
      ruta.length > (actual?.paginaRuta?.length ?? 0)
    ) {
      actual = pagina
    }
  }
  return actual
}

/** `menuId` de los grupos que contienen a `menuId`, de la raíz hacia abajo. */
export function ancestrosDe(nodos: MenuNodoDTO[], menuId: number): number[] {
  for (const nodo of nodos) {
    if (nodo.menuId === menuId) {
      return []
    }
    const camino = ancestrosDe(nodo.hijos, menuId)
    if (camino.length > 0 || nodo.hijos.some((h) => h.menuId === menuId)) {
      return [nodo.menuId, ...camino]
    }
  }
  return []
}
