import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasCuentasPorPagar: RouteObject[] = rutasPendientes([
  "/cuentas-por-pagar/cuentas",
  "/cuentas-por-pagar/pagos",
  "/cuentas-por-pagar/pagos-detalles",
])
