import { z } from "zod"

import { esquemaComboDTO } from "@/compartido/api/esquemas"

// Espejo de UsuarioDTO (../soem/.../seguridad/dto/UsuarioDTO.java) tal como
// lo devuelve el back-end. JSON-B (Yasson) omite las propiedades null, por
// eso los campos opcionales son nullish.
export const esquemaUsuarioDTO = z.object({
  personaId: z.number().int().nullish(),
  cedulaRuc: z.string(),
  apelli: z.string(),
  nombre: z.string().nullish(),
  direcc: z.string().nullish(),
  telefo: z.string().nullish(),
  correo: z.string().nullish(),
  fechaNaci: z.string().nullish(),
  usuari: z.string(),
  caducaClav: z.boolean().nullish(),
  caducaFechHora: z.string().nullish(),
  estado: z.boolean(),
})

// Espejo de LoginRespuestaDTO: lo devuelven /auth/login, /auth/refresh,
// /auth/cambiar-sucursal y /auth/cambiar-clave.
export const esquemaLoginRespuestaDTO = z.object({
  accessToken: z.string(),
  expiraEnSegundos: z.number(),
  sucursalId: z.number().int(),
  sucursales: z.array(esquemaComboDTO),
  usuario: esquemaUsuarioDTO,
  permisos: z.array(z.string()),
  claveCaducada: z.boolean(),
})

export type UsuarioDTO = z.infer<typeof esquemaUsuarioDTO>
export type LoginRespuestaDTO = z.infer<typeof esquemaLoginRespuestaDTO>
