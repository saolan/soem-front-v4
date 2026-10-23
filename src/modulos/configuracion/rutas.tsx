import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasConfiguracion: RouteObject[] = rutasPendientes([
  "/configuracion/certificados-emisor",
  "/configuracion/bodegas",
  "/configuracion/precios",
  "/configuracion/mesas",
  "/configuracion/sucursales",
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
])
