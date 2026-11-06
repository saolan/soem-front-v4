import { describe, expect, it } from "vitest"

import { nombreVisible } from "@/compartido/sesion/nombreUsuario"

describe("nombreVisible", () => {
  it("muestra el apellido y luego el nombre", () => {
    expect(
      nombreVisible({ apelli: "Pérez", nombre: "Ana", usuari: "aperez" })
    ).toBe("Pérez Ana")
  })

  it("sin nombre muestra solo el apellido", () => {
    expect(
      nombreVisible({ apelli: "Pérez", nombre: null, usuari: "aperez" })
    ).toBe("Pérez")
  })

  it("sin apellido ni nombre usa el usuario de acceso", () => {
    expect(nombreVisible({ apelli: " ", nombre: "", usuari: "aperez" })).toBe(
      "aperez"
    )
  })
})
