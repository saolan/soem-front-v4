import { z } from "zod"

import type { OpcionTarjeta } from "@/compartido/componentes/CampoOpcionesTarjeta"

// Valores de `alcanc` (enum AlcancePrecio; viajan por nombre en MAYÚSCULAS).
export const ALCANCES_PRECIO = ["NINGUNO", "TODOS"] as const

export type AlcancePrecio = (typeof ALCANCES_PRECIO)[number]

// Espejo de PrecioDTO (../soem/.../configuracion/dto/PrecioDTO.java).
// `factor` es BigDecimal: viaja como string decimal y el front no opera con él.
export const esquemaPrecioDTO = z.object({
  precioId: z.number().int(),
  codigo: z.string(),
  descri: z.string(),
  alcanc: z.enum(ALCANCES_PRECIO),
  factor: z.string(),
  estado: z.boolean(),
})

export type PrecioDTO = z.infer<typeof esquemaPrecioDTO>

// Longitudes máximas de PrecioDTO (@Size). `factor` admite 6 enteros, punto y
// 6 decimales (@Digits(integer = 6, fraction = 6)).
export const LONGITUDES_PRECIO = {
  codigo: 32,
  descri: 100,
  factor: 13,
} as const

// Texto legible de `alcanc`; al API viaja el valor (TODOS / NINGUNO).
export const ETIQUETAS_ALCANCE: Record<AlcancePrecio, string> = {
  TODOS: "Todos",
  NINGUNO: "Ninguno",
}

// Consecuencia de cada alcance al crear la lista (PrecioServicio#crear).
export const OPCIONES_ALCANCE: OpcionTarjeta[] = [
  {
    valor: "TODOS",
    titulo: ETIQUETAS_ALCANCE.TODOS,
    descripcion: "Crea el precio en cero de cada producto activo.",
  },
  {
    valor: "NINGUNO",
    titulo: ETIQUETAS_ALCANCE.NINGUNO,
    descripcion:
      "No se crean precios para esta lista. El usuario debe crear los precios de los productos que necesite.",
  },
]

// Hasta 6 enteros y 6 decimales, con punto decimal (formato de BigDecimal).
const FACTOR_DECIMAL = /^\d{1,6}(\.\d{1,6})?$/
// Mayor que cero: algún dígito distinto de 0 (sin convertir a número).
const DIGITO_NO_CERO = /[1-9]/

const obligatorio = (mensaje: string, max: number, mensajeMax: string) =>
  z.string().trim().min(1, mensaje).max(max, mensajeMax)

// Replica las reglas de Bean Validation de PrecioDTO. La validación
// definitiva la hace el back-end (unicidad de código y descripción).
export const esquemaPrecioFormulario = z.object({
  codigo: obligatorio(
    "El código es obligatorio",
    LONGITUDES_PRECIO.codigo,
    "El código no puede superar los 32 caracteres"
  ),
  descri: obligatorio(
    "La descripción es obligatoria",
    LONGITUDES_PRECIO.descri,
    "La descripción no puede superar los 100 caracteres"
  ),
  // @Pattern(regexp = "TODOS|NINGUNO") de PrecioDTO.
  alcanc: z.enum(ALCANCES_PRECIO, {
    error: "El alcance debe ser TODOS o NINGUNO",
  }),
  // Zod 4 ejecuta todas las validaciones aunque una falle: `abort` corta la
  // cadena para mostrar un único mensaje (el más relevante) por campo.
  factor: z
    .string()
    .trim()
    .min(1, { error: "El factor es obligatorio", abort: true })
    .regex(FACTOR_DECIMAL, {
      error: "El factor admite hasta 6 enteros y 6 decimales",
      abort: true,
    })
    .refine(
      (valor) => DIGITO_NO_CERO.test(valor),
      "El factor debe ser mayor que cero"
    ),
  estado: z.boolean(),
})

export type PrecioFormulario = z.infer<typeof esquemaPrecioFormulario>

export const CAMPOS_PRECIO = Object.keys(
  esquemaPrecioFormulario.shape
) as (keyof PrecioFormulario)[]

export const valoresPrecioNuevo: PrecioFormulario = {
  codigo: "",
  descri: "",
  alcanc: "NINGUNO",
  factor: "1",
  estado: true,
}

/** Valores del formulario a partir del DTO. */
export function aFormularioPrecio(dto: PrecioDTO): PrecioFormulario {
  return {
    codigo: dto.codigo,
    descri: dto.descri,
    alcanc: dto.alcanc,
    factor: dto.factor,
    estado: dto.estado,
  }
}

/**
 * Cuerpo de POST/PUT (PrecioDTO sin `precioId` ni `estado`). El PUT ignora
 * `alcanc` (inmutable). `estado` es de solo lectura en la API: el alta crea
 * la lista activa y solo cambia con DELETE y PUT /precios/{id}/activar
 * (../soem/.../configuracion/dto/PrecioDTO.java).
 */
export function aCuerpoPrecio(formulario: PrecioFormulario) {
  return {
    codigo: formulario.codigo,
    descri: formulario.descri,
    alcanc: formulario.alcanc,
    factor: formulario.factor,
  }
}

// Campos que acepta `ordenarPor` (PrecioRepositorio#CAMPOS_ORDEN_PERMITIDOS).
export const CAMPOS_ORDEN_PRECIO = [
  "precioId",
  "codigo",
  "descri",
  "alcanc",
  "factor",
  "estado",
] as const

export type CampoOrdenPrecio = (typeof CAMPOS_ORDEN_PRECIO)[number]

// Query params de GET /precios (PrecioControlador#buscar).
export const FILTROS_PRECIO = ["codigo", "descri", "estado"] as const

export type FiltroPrecio = (typeof FILTROS_PRECIO)[number]
