import type { RouteObject } from "react-router"

import { RUTA_CAMBIO_CLAVE, RUTA_LOGIN } from "@/compartido/sesion/GuardasRuta"
import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

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

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasPaginasSeguridad: RouteObject[] = rutasPendientes([
  "/seguridad/menus",
  "/seguridad/permisos",
  "/seguridad/usuarios",
  "/seguridad/roles",
  "/seguridad/roles-usuarios",
  "/seguridad/roles-permisos",
  "/seguridad/roles-menus",
  "/seguridad/roles-sucursales",
  "/seguridad/roles-bodegas",
  "/seguridad/roles-precios",
  "/seguridad/roles-documentos",
  "/seguridad/roles-formas-pago",
  "/seguridad/secuenciales",
  "/seguridad/auditorias",
  "/seguridad/respaldos",
])
