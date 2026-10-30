import { z } from "zod"

// Espejo de SucursalDTO (../soem/.../configuracion/dto/SucursalDTO.java).
// JSON-B omite las propiedades null: los opcionales son nullish.
export const esquemaSucursalDTO = z.object({
  sucursalId: z.number().int(),
  codigo: z.string(),
  matriz: z.boolean(),
  descri: z.string(),
  ruc: z.string(),
  razonSoci: z.string(),
  nombreCome: z.string().nullish(),
  ciudad: z.string(),
  direcc: z.string(),
  direccEsta: z.string(),
  telef1: z.string(),
  telef2: z.string().nullish(),
  correo: z.string(),
  repres: z.string(),
  represCedu: z.string(),
  represDire: z.string(),
  rucCont: z.string(),
  contriEspe: z.string().nullish(),
  obligaCont: z.boolean().nullish(),
  logoti: z.string().nullish(),
  estado: z.boolean(),
})

export type SucursalDTO = z.infer<typeof esquemaSucursalDTO>

// Longitudes máximas de SucursalDTO (@Size; ruc y rucCont por su @Pattern de
// 13 dígitos). Las usan el esquema y el `maxLength` de cada input.
export const LONGITUDES_SUCURSAL = {
  codigo: 32,
  descri: 100,
  ruc: 13,
  razonSoci: 256,
  nombreCome: 256,
  ciudad: 100,
  direcc: 100,
  direccEsta: 100,
  telef1: 10,
  telef2: 10,
  correo: 100,
  repres: 100,
  represCedu: 13,
  represDire: 100,
  rucCont: 13,
  contriEspe: 13,
  logoti: 255,
} as const

// ruc y rucCont: exactamente 13 dígitos (@Pattern de SucursalDTO).
const RUC_13_DIGITOS = /^[0-9]{13}$/

const obligatorio = (mensaje: string, max: number, mensajeMax: string) =>
  z.string().trim().min(1, mensaje).max(max, mensajeMax)

const opcional = (max: number, mensajeMax: string) =>
  z.string().trim().max(max, mensajeMax)

// Replica las reglas de Bean Validation de SucursalDTO. La validación
// definitiva la hace el back-end (unicidad de código y RUC, etc.). `estado`
// es de solo lectura en la API (POST crea la sucursal activa): el formulario
// lo edita y la página lo aplica con DELETE o PUT /{id}/activar.
export const esquemaSucursalFormulario = z.object({
  codigo: obligatorio(
    "El código es obligatorio",
    LONGITUDES_SUCURSAL.codigo,
    "El código no puede superar los 32 caracteres"
  ),
  matriz: z.boolean(),
  descri: obligatorio(
    "La descripción es obligatoria",
    LONGITUDES_SUCURSAL.descri,
    "La descripción no puede superar los 100 caracteres"
  ),
  ruc: z
    .string()
    .trim()
    .min(1, "El RUC es obligatorio")
    .regex(
      RUC_13_DIGITOS,
      "El RUC debe tener exactamente 13 dígitos numéricos"
    ),
  razonSoci: obligatorio(
    "La razón social es obligatoria",
    LONGITUDES_SUCURSAL.razonSoci,
    "La razón social no puede superar los 256 caracteres"
  ),
  nombreCome: opcional(
    LONGITUDES_SUCURSAL.nombreCome,
    "El nombre comercial no puede superar los 256 caracteres"
  ),
  ciudad: obligatorio(
    "La ciudad es obligatoria",
    LONGITUDES_SUCURSAL.ciudad,
    "La ciudad no puede superar los 100 caracteres"
  ),
  direcc: obligatorio(
    "La dirección es obligatoria",
    LONGITUDES_SUCURSAL.direcc,
    "La dirección no puede superar los 100 caracteres"
  ),
  direccEsta: obligatorio(
    "La dirección del establecimiento es obligatoria",
    LONGITUDES_SUCURSAL.direccEsta,
    "La dirección del establecimiento no puede superar los 100 caracteres"
  ),
  telef1: obligatorio(
    "El teléfono principal es obligatorio",
    LONGITUDES_SUCURSAL.telef1,
    "El teléfono principal no puede superar los 10 caracteres"
  ),
  telef2: opcional(
    LONGITUDES_SUCURSAL.telef2,
    "El teléfono secundario no puede superar los 10 caracteres"
  ),
  correo: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .max(
      LONGITUDES_SUCURSAL.correo,
      "El correo no puede superar los 100 caracteres"
    )
    .pipe(z.email("El correo no tiene un formato válido")),
  repres: obligatorio(
    "El representante legal es obligatorio",
    LONGITUDES_SUCURSAL.repres,
    "El representante legal no puede superar los 100 caracteres"
  ),
  represCedu: obligatorio(
    "La cédula del representante legal es obligatoria",
    LONGITUDES_SUCURSAL.represCedu,
    "La cédula del representante legal no puede superar los 13 caracteres"
  ),
  represDire: obligatorio(
    "La dirección del representante legal es obligatoria",
    LONGITUDES_SUCURSAL.represDire,
    "La dirección del representante legal no puede superar los 100 caracteres"
  ),
  rucCont: z
    .string()
    .trim()
    .min(1, "El RUC contable es obligatorio")
    .regex(
      RUC_13_DIGITOS,
      "El RUC contable debe tener exactamente 13 dígitos numéricos"
    ),
  contriEspe: opcional(
    LONGITUDES_SUCURSAL.contriEspe,
    "El contribuyente especial no puede superar los 13 caracteres"
  ),
  obligaCont: z.boolean(),
  logoti: opcional(
    LONGITUDES_SUCURSAL.logoti,
    "La ruta del logotipo no puede superar los 255 caracteres"
  ),
  estado: z.boolean(),
})

export type SucursalFormulario = z.infer<typeof esquemaSucursalFormulario>

export const CAMPOS_SUCURSAL = Object.keys(
  esquemaSucursalFormulario.shape
) as (keyof SucursalFormulario)[]

export const valoresSucursalNueva: SucursalFormulario = {
  codigo: "",
  matriz: false,
  descri: "",
  ruc: "",
  razonSoci: "",
  nombreCome: "",
  ciudad: "",
  direcc: "",
  direccEsta: "",
  telef1: "",
  telef2: "",
  correo: "",
  repres: "",
  represCedu: "",
  represDire: "",
  rucCont: "",
  contriEspe: "",
  obligaCont: false,
  logoti: "",
  estado: true,
}

/** Valores del formulario a partir del DTO (los null pasan a ""). */
export function aFormularioSucursal(dto: SucursalDTO): SucursalFormulario {
  return {
    codigo: dto.codigo,
    matriz: dto.matriz,
    descri: dto.descri,
    ruc: dto.ruc,
    razonSoci: dto.razonSoci,
    nombreCome: dto.nombreCome ?? "",
    ciudad: dto.ciudad,
    direcc: dto.direcc,
    direccEsta: dto.direccEsta,
    telef1: dto.telef1,
    telef2: dto.telef2 ?? "",
    correo: dto.correo,
    repres: dto.repres,
    represCedu: dto.represCedu,
    represDire: dto.represDire,
    rucCont: dto.rucCont,
    contriEspe: dto.contriEspe ?? "",
    obligaCont: dto.obligaCont ?? false,
    logoti: dto.logoti ?? "",
    estado: dto.estado,
  }
}

const vacioANull = (valor: string) => (valor === "" ? null : valor)

/**
 * Cuerpo de POST/PUT: los opcionales vacíos viajan como null y sin `estado`
 * (la API lo ignora; se cambia con DELETE y PUT /{id}/activar).
 */
export function aCuerpoSucursal(formulario: SucursalFormulario) {
  const { estado, ...valores } = formulario
  void estado
  return {
    ...valores,
    nombreCome: vacioANull(valores.nombreCome),
    telef2: vacioANull(valores.telef2),
    contriEspe: vacioANull(valores.contriEspe),
    logoti: vacioANull(valores.logoti),
  }
}

// Campos que acepta `ordenarPor` (SucursalRepositorio#CAMPOS_ORDEN_PERMITIDOS).
export const CAMPOS_ORDEN_SUCURSAL = [
  "sucursalId",
  "codigo",
  "descri",
  "ruc",
  "ciudad",
  "matriz",
  "estado",
] as const

export type CampoOrdenSucursal = (typeof CAMPOS_ORDEN_SUCURSAL)[number]

// Query params de GET /sucursales (SucursalControlador#buscar).
export const FILTROS_SUCURSAL = [
  "codigo",
  "descri",
  "ruc",
  "ciudad",
  "matriz",
  "estado",
] as const

export type FiltroSucursal = (typeof FILTROS_SUCURSAL)[number]
