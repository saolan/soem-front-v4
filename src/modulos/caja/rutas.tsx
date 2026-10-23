import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasCaja: RouteObject[] = rutasPendientes([
  "/caja/perifericos",
  "/caja/cajeros",
  "/caja/cajas",
  "/caja/cajas-documentos",
  "/caja/cajas-perifericos",
  "/caja/cajas-formas-pago",
  "/caja/movimientos",
])
