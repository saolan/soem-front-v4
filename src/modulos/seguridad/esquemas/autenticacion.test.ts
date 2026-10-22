import { describe, expect, it } from "vitest"

import {
  esquemaCambioClave,
  esquemaLoginRequest,
} from "@/modulos/seguridad/esquemas/autenticacion"

function mensajes(resultado: {
  success: boolean
  error?: { issues: { message: string }[] }
}) {
  return resultado.error?.issues.map((issue) => issue.message) ?? []
}

describe("esquemaLoginRequest", () => {
  it("exige usuario y clave no vacíos", () => {
    const resultado = esquemaLoginRequest.safeParse({
      usuario: "  ",
      clave: " ",
    })

    expect(mensajes(resultado)).toEqual([
      "El usuario es obligatorio",
      "La clave es obligatoria",
    ])
  })

  it("respeta las longitudes máximas del DTO", () => {
    const resultado = esquemaLoginRequest.safeParse({
      usuario: "u".repeat(101),
      clave: "c".repeat(73),
    })

    expect(mensajes(resultado)).toEqual([
      "El usuario no puede superar los 100 caracteres",
      "La clave no puede superar los 72 caracteres",
    ])
  })

  it("acepta credenciales válidas sin sucursalId", () => {
    expect(
      esquemaLoginRequest.parse({ usuario: "admin", clave: "secreta" })
    ).toEqual({ usuario: "admin", clave: "secreta" })
  })
})

describe("esquemaCambioClave", () => {
  it("exige 8 caracteres y que la confirmación coincida", () => {
    const resultado = esquemaCambioClave.safeParse({
      claveActual: "actual",
      claveNueva: "corta",
      confirmacionClave: "corta",
    })

    expect(mensajes(resultado)).toEqual([
      "La clave nueva debe tener entre 8 y 72 caracteres",
    ])

    const sinCoincidir = esquemaCambioClave.safeParse({
      claveActual: "actual",
      claveNueva: "claveNueva1",
      confirmacionClave: "claveNueva2",
    })
    expect(mensajes(sinCoincidir)).toEqual([
      "La confirmación no coincide con la clave nueva",
    ])
  })
})
