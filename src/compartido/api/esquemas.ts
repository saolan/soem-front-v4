import { z } from "zod"

// Espejo de ../soem/src/main/java/com/saolan/soem/compartido/dto

export const esquemaErrorCampo = z.object({
  campo: z.string().nullish(),
  detalle: z.string(),
})

export const esquemaPaginacion = z.object({
  pagina: z.number().int(),
  tamanio: z.number().int(),
  totalRegistros: z.number().int(),
  totalPaginas: z.number().int(),
})

export const esquemaComboDTO = z.object({
  valor: z.number().int(),
  etiqueta: z.string(),
})

// Envoltorio RespuestaApi; `datos` se valida aparte con el esquema de cada
// endpoint.
export const esquemaRespuestaApi = z.object({
  exito: z.boolean(),
  mensaje: z.string(),
  datos: z.unknown().optional(),
  errores: z.array(esquemaErrorCampo).nullish(),
  paginacion: esquemaPaginacion.nullish(),
})

export type ErrorCampo = z.infer<typeof esquemaErrorCampo>
export type Paginacion = z.infer<typeof esquemaPaginacion>
export type ComboDTO = z.infer<typeof esquemaComboDTO>
