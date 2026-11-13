import { describe, expect, it } from "vitest"

import { detalleDeError, ErrorApi } from "@/compartido/api/errores"

describe("detalleDeError", () => {
  it("une los detalles de los errores del API", () => {
    const error = new ErrorApi(409, "No se puede desactivar", [
      { campo: "estado", detalle: "Está habilitada en 2 sucursales" },
      { campo: null, detalle: "Quítela de ellas antes" },
    ])
    expect(detalleDeError(error)).toBe(
      "Está habilitada en 2 sucursales. Quítela de ellas antes"
    )
  })

  it("sin detalles o con un error ajeno al API devuelve undefined", () => {
    expect(detalleDeError(new ErrorApi(500, "Error"))).toBeUndefined()
    expect(detalleDeError(new Error("x"))).toBeUndefined()
  })
})
