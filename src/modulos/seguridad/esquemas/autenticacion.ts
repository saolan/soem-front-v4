import { z } from "zod"

const noVacio = (valor: string) => valor.trim().length > 0

// Espejo de LoginRequestDTO (../soem/.../seguridad/dto/LoginRequestDTO.java).
// La sucursal no se elige en el login: con varias, la respuesta trae
// requiereSeleccionSucursal y se elige luego con /auth/cambiar-sucursal.
export const esquemaLoginRequest = z.object({
  usuario: z
    .string()
    .trim()
    .min(1, "El usuario es obligatorio")
    .max(100, "El usuario no puede superar los 100 caracteres"),
  clave: z
    .string()
    .refine(noVacio, "La clave es obligatoria")
    .max(72, "La clave no puede superar los 72 caracteres"),
})

// Espejo de CambioClaveDTO; `confirmacionClave` solo existe en el front.
export const esquemaCambioClave = z
  .object({
    claveActual: z.string().refine(noVacio, "La clave actual es obligatoria"),
    claveNueva: z
      .string()
      .min(8, "La clave nueva debe tener entre 8 y 72 caracteres")
      .max(72, "La clave nueva debe tener entre 8 y 72 caracteres"),
    confirmacionClave: z.string(),
  })
  .refine((valores) => valores.claveNueva === valores.confirmacionClave, {
    path: ["confirmacionClave"],
    message: "La confirmación no coincide con la clave nueva",
  })

// Cuerpo de POST /auth/cambiar-sucursal ({ sucursalId }). null: aún sin
// elegir en el selector.
export const esquemaSeleccionSucursal = z.object({
  sucursalId: z
    .number({ error: "Seleccione una sucursal" })
    .int()
    .nullable()
    .refine((valor) => valor !== null, "Seleccione una sucursal"),
})

export type LoginRequest = z.infer<typeof esquemaLoginRequest>
export type SeleccionSucursalFormulario = z.input<
  typeof esquemaSeleccionSucursal
>
export type CambioClave = z.infer<typeof esquemaCambioClave>
