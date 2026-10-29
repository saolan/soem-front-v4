import { z } from "zod"

// Espejo de SucuCertEmisDTO (../soem/.../configuracion/dto/SucuCertEmisDTO.java).
// La clave nunca se devuelve (SucuCertEmisMapeador la ignora).
export const esquemaSucuCertEmisDTO = z.object({
  certEmisId: z.number().int(),
  ruta: z.string(),
  descri: z.string(),
})

export type SucuCertEmisDTO = z.infer<typeof esquemaSucuCertEmisDTO>

/**
 * Formulario del certificado. La clave solo es obligatoria al configurar un
 * certificado nuevo: en una modificación, si queda vacía se conserva la
 * almacenada (SucursalServicio#guardarCertificadoEmisor).
 */
export function esquemaCertificadoFormulario(existe: boolean) {
  return z.object({
    certEmisId: z
      .number({ error: "El certificado emisor es obligatorio" })
      .int()
      .nullable()
      .refine(
        (valor) => valor !== null,
        "El certificado emisor es obligatorio"
      ),
    ruta: z
      .string()
      .trim()
      .min(1, "La ruta del certificado es obligatoria")
      .max(100, "La ruta no puede superar los 100 caracteres"),
    descri: z
      .string()
      .trim()
      .min(1, "La descripción del certificado es obligatoria")
      .max(100, "La descripción no puede superar los 100 caracteres"),
    clave: z
      .string()
      .max(32, "La clave no puede superar los 32 caracteres")
      .refine(
        (valor) => existe || valor.length > 0,
        "La clave del certificado es obligatoria"
      ),
  })
}

type EsquemaCertificado = ReturnType<typeof esquemaCertificadoFormulario>

/** Valores del formulario (el emisor puede no estar elegido aún). */
export type CertificadoFormulario = z.input<EsquemaCertificado>
/** Valores ya validados que se envían al API. */
export type CertificadoValidado = z.output<EsquemaCertificado>

export const CAMPOS_CERTIFICADO = [
  "certEmisId",
  "ruta",
  "descri",
  "clave",
] as const satisfies readonly (keyof CertificadoFormulario)[]

/** Cuerpo del PUT: una clave vacía conserva la almacenada. */
export function aCuerpoCertificado(valores: CertificadoValidado) {
  return {
    certEmisId: valores.certEmisId,
    ruta: valores.ruta,
    descri: valores.descri,
    clave: valores.clave === "" ? null : valores.clave,
  }
}
