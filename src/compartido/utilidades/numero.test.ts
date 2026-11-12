import { describe, expect, it } from "vitest"

import { formatoDecimal } from "@/compartido/utilidades/numero"

// Quita los separadores propios de la configuración regional de la prueba.
const sinEspacios = (texto: string) => texto.replace(/\s/g, "")

describe("formatoDecimal", () => {
  it("muestra el decimal con coma y sin ceros de relleno", () => {
    expect(formatoDecimal("12.000000")).toBe("12")
    expect(formatoDecimal("0.500000")).toBe("0,5")
    expect(sinEspacios(formatoDecimal("123456.123456"))).toBe("123.456,123456")
  })

  it("devuelve tal cual un texto que no es decimal", () => {
    expect(formatoDecimal("abc")).toBe("abc")
    expect(formatoDecimal("")).toBe("")
  })
})
