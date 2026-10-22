import { useSesion } from "@/compartido/sesion/useSesion"

export type AccionPermiso =
  | "buscar"
  | "crear"
  | "modificar"
  | "eliminar"
  | "anular"
  | "desprocesar"
  | "convertir"
  | "imprimir"

/**
 * Indica si el usuario tiene el permiso `recurso:accion` (ej.
 * `usuarios:buscar`). Solo es experiencia de usuario: la autorización real la
 * aplica el back-end.
 */
export function useTienePermiso(recurso: string, accion: AccionPermiso) {
  const { sesion } = useSesion()
  return sesion?.permisos.includes(`${recurso}:${accion}`) ?? false
}
