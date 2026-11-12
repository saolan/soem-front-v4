import { describe, expect, it } from "vitest"

import {
  aCuerpoPrecio,
  aFormularioPrecio,
  esquemaPrecioDTO,
  esquemaPrecioFormulario,
  valoresPrecioNuevo,
} from "@/modulos/configuracion/esquemas/precio"

const validos = {
  ...valoresPrecioNuevo,
  codigo: "DOC",
  descri: "Docena",
  factor: "12",
}

function errores(valores: unknown) {
  const resultado = esquemaPrecioFormulario.safeParse(valores)
  return resultado.success
    ? {}
    : Object.fromEntries(
        resultado.error.issues.map((i) => [i.path.join("."), i.message])
      )
}

describe("esquemaPrecioFormulario", () => {
  it("acepta una lista de precio válida", () => {
    expect(errores(validos)).toEqual({})
    expect(errores({ ...validos, factor: "123456.123456" })).toEqual({})
  })

  it("replica los obligatorios y longitudes de PrecioDTO", () => {
    expect(
      errores({ ...validos, codigo: " ", descri: "x".repeat(101), factor: "" })
    ).toEqual({
      codigo: "El código es obligatorio",
      descri: "La descripción no puede superar los 100 caracteres",
      factor: "El factor es obligatorio",
    })
    expect(errores({ ...validos, codigo: "x".repeat(33) })).toEqual({
      codigo: "El código no puede superar los 32 caracteres",
    })
  })

  it("factor: hasta 6 enteros y 6 decimales con punto", () => {
    const mensaje = "El factor admite hasta 6 enteros y 6 decimales"
    for (const factor of ["1234567", "1.1234567", "1,5", "-1", "1e3", "abc"]) {
      expect(errores({ ...validos, factor })).toEqual({ factor: mensaje })
    }
  })

  it("factor: mayor que cero", () => {
    for (const factor of ["0", "0.000000", "000"]) {
      expect(errores({ ...validos, factor })).toEqual({
        factor: "El factor debe ser mayor que cero",
      })
    }
    expect(errores({ ...validos, factor: "0.000001" })).toEqual({})
  })

  it("alcance: solo TODOS o NINGUNO (en mayúsculas)", () => {
    expect(errores({ ...validos, alcanc: "TODOS" })).toEqual({})
    for (const alcanc of ["todos", "ALGUNOS", 1, ""]) {
      expect(errores({ ...validos, alcanc })).toEqual({
        alcanc: "El alcance debe ser TODOS o NINGUNO",
      })
    }
  })
})

describe("aCuerpoPrecio", () => {
  it("envía el PrecioDTO sin id, con el factor como string y sin espacios", () => {
    const valores = esquemaPrecioFormulario.parse({
      ...validos,
      codigo: " DOC ",
      factor: " 12.5 ",
    })
    expect(aCuerpoPrecio(valores)).toEqual({
      codigo: "DOC",
      descri: "Docena",
      alcanc: "NINGUNO",
      factor: "12.5",
      estado: true,
    })
  })
})

describe("esquemaPrecioDTO", () => {
  it("valida la respuesta y la pasa al formulario", () => {
    const dto = esquemaPrecioDTO.parse({
      precioId: 3,
      codigo: "DOC",
      descri: "Docena",
      alcanc: "TODOS",
      factor: "12.000000",
      estado: false,
    })
    expect(aFormularioPrecio(dto)).toEqual({
      codigo: "DOC",
      descri: "Docena",
      alcanc: "TODOS",
      factor: "12.000000",
      estado: false,
    })
  })

  it("rechaza el factor como número JSON (BigDecimal viaja como string)", () => {
    expect(
      esquemaPrecioDTO.safeParse({
        precioId: 3,
        codigo: "DOC",
        descri: "Docena",
        alcanc: "TODOS",
        factor: 12,
        estado: true,
      }).success
    ).toBe(false)
  })
})
