import { describe, expect, it, vi } from "vitest"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { ErrorApi } from "@/compartido/api/errores"

type Formulario = { codigo: string; ruc: string; clave: string }

describe("aplicarErroresFormulario", () => {
  it("marca cada campo y enfoca solo el primero", () => {
    const setError = vi.fn()
    const error = new ErrorApi(400, "Datos inválidos", [
      { campo: "otro", detalle: "No es del formulario" },
      { campo: "ruc", detalle: "RUC inválido" },
      { campo: "codigo", detalle: "Código repetido" },
    ])

    const mensaje = aplicarErroresFormulario<Formulario>(error, setError, [
      "codigo",
      "ruc",
    ])

    expect(mensaje).toBe("Datos inválidos")
    expect(setError.mock.calls).toEqual([
      [
        "ruc",
        { type: "server", message: "RUC inválido" },
        { shouldFocus: true },
      ],
      [
        "codigo",
        { type: "server", message: "Código repetido" },
        { shouldFocus: false },
      ],
    ])
  })

  it("traduce los alias de campo del back-end", () => {
    const setError = vi.fn()
    const error = new ErrorApi(400, "Datos inválidos", [
      { campo: "certificadoEmisor.clave", detalle: "Clave incorrecta" },
    ])

    aplicarErroresFormulario<Formulario>(error, setError, ["clave"], {
      "certificadoEmisor.clave": "clave",
    })

    expect(setError).toHaveBeenCalledWith(
      "clave",
      { type: "server", message: "Clave incorrecta" },
      { shouldFocus: true }
    )
  })
})
