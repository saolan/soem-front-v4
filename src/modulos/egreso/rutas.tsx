import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasEgreso: RouteObject[] = rutasPendientes([
  "/egreso/cliente-grupos",
  "/egreso/cliente-grupos-plan-cuentas",
  "/egreso/clientes",
  "/egreso/vendedores",
  "/egreso/cobradores",
  "/egreso/egresos",
  "/egreso/ventas",
  "/egreso/egresos-detalles-impuestos",
])
