import type { UsuarioDTO } from "@/compartido/sesion/esquemas"

/**
 * Nombre que se muestra del usuario de la sesión: apellido y nombre de la
 * persona (`persona.apelli`, `persona.nombre`). El usuario de acceso
 * (`pers_usua.usuari`) solo se usa si la persona no tiene ninguno, para no
 * dejarlo a la vista.
 */
export function nombreVisible(
  usuario: Pick<UsuarioDTO, "apelli" | "nombre" | "usuari">
): string {
  const nombre = [usuario.apelli, usuario.nombre]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(" ")
  return nombre || usuario.usuari
}
