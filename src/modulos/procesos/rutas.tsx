import type { RouteObject } from "react-router"

import { rutasPendientes } from "@/compartido/utilidades/rutasMenu"

/** Pantallas del menú registradas en el router (aún sin implementar). */
export const rutasProcesos: RouteObject[] = rutasPendientes([
  "/procesos/documentos-electronicos",
])
