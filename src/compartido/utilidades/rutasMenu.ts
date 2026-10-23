import type { RouteObject, UIMatch } from "react-router"

/**
 * `handle` de las rutas que corresponden a una página del menú: la guarda del
 * menú solo deja entrar si `rutaMenu` está en el menú de la sesión.
 */
export interface HandleRutaMenu {
  rutaMenu: string
}

function esHandleRutaMenu(handle: unknown): handle is HandleRutaMenu {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "rutaMenu" in handle &&
    typeof handle.rutaMenu === "string"
  )
}

/** `rutaMenu` de la coincidencia más profunda que lo declare. */
export function rutaMenuDe(coincidencias: UIMatch[]): string | null {
  for (let i = coincidencias.length - 1; i >= 0; i--) {
    const { handle } = coincidencias[i]
    if (esHandleRutaMenu(handle)) {
      return handle.rutaMenu
    }
  }
  return null
}

/** Registra páginas del menú que aún no tienen pantalla propia. */
export function rutasPendientes(rutas: string[]): RouteObject[] {
  return rutas.map((ruta) => ({
    path: ruta,
    handle: { rutaMenu: ruta } satisfies HandleRutaMenu,
    lazy: async () => ({
      Component: (await import("@/compartido/componentes/PaginaEnConstruccion"))
        .PaginaEnConstruccion,
    }),
  }))
}
