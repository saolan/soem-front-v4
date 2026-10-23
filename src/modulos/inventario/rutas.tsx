import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasInventario: RouteObject[] = rutasPendientes([
  "/inventario/producto-grupos-niveles",
  "/inventario/producto-grupos",
  "/inventario/producto-tipos",
  "/inventario/producto-tipos-plan-cuentas",
  "/inventario/productos",
  "/inventario/productos-dimm",
  "/inventario/productos-bodegas",
  "/inventario/productos-precios",
  "/inventario/productos-costos",
  "/inventario/tomas-fisicas",
])
