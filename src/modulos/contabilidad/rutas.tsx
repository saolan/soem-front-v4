import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasContabilidad: RouteObject[] = rutasPendientes([
  "/contabilidad/plan-cuentas-niveles",
  "/contabilidad/plan-cuentas",
  "/contabilidad/transacciones-plantillas",
  "/contabilidad/transacciones",
  "/contabilidad/transacciones-detalles",
])
