import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { afterEach, describe, expect, it } from "vitest"

import { CampoClave } from "@/compartido/componentes/CampoClave"

function Formulario() {
  const { control } = useForm({ defaultValues: { clave: "" } })
  return (
    <CampoClave
      control={control}
      name="clave"
      etiqueta="Clave"
      autoComplete="current-password"
    />
  )
}

function FormularioConAyuda() {
  const { control } = useForm({ defaultValues: { clave: "" } })
  return (
    <CampoClave
      control={control}
      name="clave"
      etiqueta="Clave del certificado"
      descripcion="Déjela vacía para conservar la clave actual."
    />
  )
}

describe("CampoClave", () => {
  afterEach(() => {
    cleanup()
  })

  it("oculta la clave y permite mostrarla con el botón o el teclado", async () => {
    const usuario = userEvent.setup()
    render(<Formulario />)
    const campo = screen.getByLabelText("Clave")
    const boton = screen.getByRole("button", { name: "Mostrar clave" })

    expect(campo.getAttribute("type")).toBe("password")
    expect(boton.getAttribute("aria-pressed")).toBe("false")

    await usuario.click(boton)
    expect(campo.getAttribute("type")).toBe("text")
    expect(boton.getAttribute("aria-pressed")).toBe("true")

    // Teclado: Tab desde el campo llega al botón y Enter vuelve a ocultar.
    campo.focus()
    await usuario.tab()
    expect(document.activeElement).toBe(boton)
    await usuario.keyboard("{Enter}")
    expect(campo.getAttribute("type")).toBe("password")
  })

  it("avisa cuando Bloq Mayús está activado y lo quita al salir", () => {
    render(<Formulario />)
    const campo = screen.getByLabelText("Clave")

    fireEvent.keyDown(campo, { key: "A", modifierCapsLock: true })
    const aviso = screen.getByText("Bloq Mayús está activado.")
    expect(campo.getAttribute("aria-describedby")).toContain(aviso.id)

    fireEvent.keyUp(campo, { key: "CapsLock", modifierCapsLock: false })
    expect(screen.queryByText("Bloq Mayús está activado.")).toBeNull()

    fireEvent.keyDown(campo, { key: "A", modifierCapsLock: true })
    fireEvent.blur(campo)
    expect(screen.queryByText("Bloq Mayús está activado.")).toBeNull()
  })

  it("con Bloq Mayús conserva la ayuda del campo", () => {
    render(<FormularioConAyuda />)
    const campo = screen.getByLabelText("Clave del certificado")

    fireEvent.keyDown(campo, { key: "A", modifierCapsLock: true })

    expect(
      screen.getByText(
        "Bloq Mayús está activado. Déjela vacía para conservar la clave actual."
      )
    ).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Mostrar clave del certificado" })
    ).toBeTruthy()
  })
})
