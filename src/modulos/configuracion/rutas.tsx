import type { RouteObject } from "react-router"

import {
  rutasPendientes,
  type HandleRutaMenu,
} from "@/compartido/utilidades/rutasMenu"

// Las subrutas (nueva, edición) se autorizan con la página del menú.
const menuSucursales = {
  rutaMenu: "/configuracion/sucursales",
} satisfies HandleRutaMenu

const rutasSucursales: RouteObject[] = [
  {
    path: "/configuracion/sucursales",
    handle: menuSucursales,
    lazy: async () => ({
      Component: (
        await import("@/modulos/configuracion/paginas/PaginaSucursales")
      ).PaginaSucursales,
    }),
  },
  {
    path: "/configuracion/sucursales/nueva",
    handle: menuSucursales,
    lazy: async () => ({
      Component: (
        await import("@/modulos/configuracion/paginas/PaginaSucursal")
      ).PaginaNuevaSucursal,
    }),
  },
  {
    path: "/configuracion/sucursales/:sucursalId",
    handle: menuSucursales,
    lazy: async () => ({
      Component: (
        await import("@/modulos/configuracion/paginas/PaginaSucursal")
      ).PaginaSucursal,
    }),
  },
]

export const rutasConfiguracion: RouteObject[] = [
  ...rutasSucursales,
  // Pantallas del menú registradas en el router (aún sin implementar).
  ...rutasPendientes([
    "/configuracion/certificados-emisor",
    "/configuracion/bodegas",
    "/configuracion/precios",
    "/configuracion/mesas",
    "/configuracion/sucursales-bodegas",
    "/configuracion/sucursales-precios",
    "/configuracion/sucursales-parametros",
    "/configuracion/parametros",
    "/configuracion/personas-parametros",
    "/configuracion/personas",
    "/configuracion/dimms",
    "/configuracion/formas-pago",
    "/configuracion/mapas-niveles",
    "/configuracion/mapas",
    "/configuracion/dimms/modificar-iva",
    "/configuracion/parametros/registrar-licencia",
    "/configuracion/documentos",
    "/configuracion/documentos-ingreso",
    "/configuracion/documentos-egreso",
    "/configuracion/documentos-caja",
    "/configuracion/documentos-movimiento-ingreso",
    "/configuracion/documentos-movimiento-egreso",
    "/configuracion/documentos-transaccion",
  ]),
]
