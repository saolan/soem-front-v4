import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasIngreso: RouteObject[] = rutasPendientes([
  "/ingreso/proveedor-grupos",
  "/ingreso/proveedor-grupos-plan-cuentas",
  "/ingreso/proveedores",
  "/ingreso/ingresos",
  "/ingreso/compras",
  "/ingreso/ingresos-detalles-impuestos",
  "/ingreso/retenciones",
  "/ingreso/retenciones-detalles",
])
