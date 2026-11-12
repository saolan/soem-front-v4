import type { RouteObject } from "react-router"

import {
  rutasPendientes,
  type HandleRutaMenu,
} from "@/compartido/utilidades/rutasMenu"
import {
  RUTA_NUEVA_SUCURSAL,
  RUTA_NUEVO_PRECIO,
  RUTA_PRECIOS,
  RUTA_SUCURSALES,
} from "@/modulos/configuracion/constantes"

// Las subrutas (nueva, edición) se autorizan con la página del menú.
const menuSucursales = {
  rutaMenu: RUTA_SUCURSALES,
} satisfies HandleRutaMenu

const rutasSucursales: RouteObject[] = [
  {
    path: RUTA_SUCURSALES,
    handle: menuSucursales,
    lazy: async () => ({
      Component: (
        await import("@/modulos/configuracion/paginas/PaginaSucursales")
      ).PaginaSucursales,
    }),
  },
  {
    path: RUTA_NUEVA_SUCURSAL,
    handle: menuSucursales,
    lazy: async () => ({
      Component: (
        await import("@/modulos/configuracion/paginas/PaginaSucursal")
      ).PaginaNuevaSucursal,
    }),
  },
  {
    path: `${RUTA_SUCURSALES}/:sucursalId`,
    handle: menuSucursales,
    lazy: async () => ({
      Component: (
        await import("@/modulos/configuracion/paginas/PaginaSucursal")
      ).PaginaSucursal,
    }),
  },
]

const menuPrecios = {
  rutaMenu: RUTA_PRECIOS,
} satisfies HandleRutaMenu

const rutasPrecios: RouteObject[] = [
  {
    path: RUTA_PRECIOS,
    handle: menuPrecios,
    lazy: async () => ({
      Component: (await import("@/modulos/configuracion/paginas/PaginaPrecios"))
        .PaginaPrecios,
    }),
  },
  {
    path: RUTA_NUEVO_PRECIO,
    handle: menuPrecios,
    lazy: async () => ({
      Component: (await import("@/modulos/configuracion/paginas/PaginaPrecio"))
        .PaginaNuevoPrecio,
    }),
  },
  {
    path: `${RUTA_PRECIOS}/:precioId`,
    handle: menuPrecios,
    lazy: async () => ({
      Component: (await import("@/modulos/configuracion/paginas/PaginaPrecio"))
        .PaginaPrecio,
    }),
  },
]

export const rutasConfiguracion: RouteObject[] = [
  ...rutasSucursales,
  ...rutasPrecios,
  // Pantallas del menú registradas en el router (aún sin implementar).
  ...rutasPendientes([
    "/configuracion/certificados-emisor",
    "/configuracion/bodegas",
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
