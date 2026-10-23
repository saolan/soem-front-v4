import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasCuentasPorCobrar: RouteObject[] = rutasPendientes([
  "/cuentas-por-cobrar/cuentas",
  "/cuentas-por-cobrar/cobros",
  "/cuentas-por-cobrar/cobros-detalles",
])
