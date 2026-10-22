import type { RouteObject } from "react-router"

import { RUTA_CAMBIO_CLAVE, RUTA_LOGIN } from "@/compartido/sesion/GuardasRuta"

/** Rutas para usuarios sin sesión. */
export const rutasPublicasSeguridad: RouteObject[] = [
  {
    path: RUTA_LOGIN,
    lazy: async () => ({
      Component: (await import("@/modulos/seguridad/paginas/PaginaLogin"))
        .PaginaLogin,
    }),
  },
]

/** Rutas con sesión que se muestran fuera del layout principal. */
export const rutasSesionSeguridad: RouteObject[] = [
  {
    path: RUTA_CAMBIO_CLAVE,
    lazy: async () => ({
      Component: (await import("@/modulos/seguridad/paginas/PaginaCambioClave"))
        .PaginaCambioClave,
    }),
  },
]
