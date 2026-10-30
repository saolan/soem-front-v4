import { describe, expect, it } from "vitest"

import { esquemaCertificadoFormulario } from "@/modulos/configuracion/esquemas/certificadoSucursal"
import {
  aCuerpoSucursal,
  esquemaSucursalDTO,
  esquemaSucursalFormulario,
  valoresSucursalNueva,
} from "@/modulos/configuracion/esquemas/sucursal"

const validos = {
  ...valoresSucursalNueva,
  codigo: "001",
  descri: "Matriz Quito",
  ruc: "1790011223001",
  razonSoci: "SAOLAN S.A.",
  ciudad: "Quito",
  direcc: "Av. Amazonas",
  direccEsta: "Av. Amazonas N1",
  telef1: "022345678",
  correo: "info@saolan.ec",
  repres: "Ana Pérez",
  represCedu: "1712345678",
  represDire: "Quito",
  rucCont: "1712345678001",
}

function errores(valores: unknown) {
  const resultado = esquemaSucursalFormulario.safeParse(valores)
  return resultado.success
    ? {}
    : Object.fromEntries(
        resultado.error.issues.map((i) => [i.path.join("."), i.message])
      )
}

describe("esquemaSucursalFormulario", () => {
  it("acepta una sucursal válida", () => {
    expect(errores(validos)).toEqual({})
  })

  it("replica las reglas de SucursalDTO", () => {
    expect(
      errores({
        ...validos,
        codigo: " ",
        ruc: "17900A",
        correo: "no-es-correo",
        telef1: "12345678901",
        rucCont: "1712345678",
      })
    ).toEqual({
      codigo: "El código es obligatorio",
      ruc: "El RUC debe tener exactamente 13 dígitos numéricos",
      rucCont: "El RUC contable debe tener exactamente 13 dígitos numéricos",
      correo: "El correo no tiene un formato válido",
      telef1: "El teléfono principal no puede superar los 10 caracteres",
    })
  })

  it("envía como null los opcionales vacíos", () => {
    const cuerpo = aCuerpoSucursal(esquemaSucursalFormulario.parse(validos))
    expect(cuerpo.nombreCome).toBeNull()
    expect(cuerpo.telef2).toBeNull()
    expect(cuerpo.contriEspe).toBeNull()
    expect(cuerpo.logoti).toBeNull()
  })
})

describe("esquemaSucursalDTO", () => {
  it("acepta los opcionales omitidos por JSON-B", () => {
    const { nombreCome, telef2, contriEspe, logoti, obligaCont, ...dto } = {
      ...validos,
      sucursalId: 1,
      obligaCont: null,
      // De solo lectura: llega en la respuesta, nunca en el formulario.
      estado: true,
    }
    void [nombreCome, telef2, contriEspe, logoti, obligaCont]
    expect(esquemaSucursalDTO.safeParse(dto).success).toBe(true)
  })
})

describe("esquemaCertificadoFormulario", () => {
  const certificado = {
    certEmisId: 1,
    ruta: "C:/firmas/matriz.p12",
    descri: "Firma matriz",
    clave: "",
  }

  it("exige la clave solo en un certificado nuevo", () => {
    expect(
      esquemaCertificadoFormulario(false).safeParse(certificado).success
    ).toBe(false)
    expect(
      esquemaCertificadoFormulario(true).safeParse(certificado).success
    ).toBe(true)
  })

  it("exige el emisor", () => {
    const resultado = esquemaCertificadoFormulario(true).safeParse({
      ...certificado,
      certEmisId: null,
    })
    expect(resultado.success).toBe(false)
  })
})
