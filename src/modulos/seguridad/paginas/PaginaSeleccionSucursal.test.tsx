import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { respuestaApi } from "@/compartido/pruebas/renderizarPagina"
import {
  ContextoSesion,
  type DatosSesion,
  type ValorSesion,
} from "@/compartido/sesion/ContextoSesion"
import { PaginaSeleccionSucursal } from "@/modulos/seguridad/paginas/PaginaSeleccionSucursal"

const sesionPendiente: DatosSesion = {
  expiraEnSegundos: 900,
  sucursalId: null,
  sucursales: [
    { valor: 1, etiqueta: "Matriz" },
    { valor: 2, etiqueta: "Sucursal Norte" },
  ],
  usuario: {
    cedulaRuc: "1",
    nombre: "Ana",
    apelli: "Pérez",
    usuari: "aa",
    estado: true,
  },
  permisos: [],
  claveCaducada: false,
  requiereSeleccionSucursal: true,
}

const sesionElegida = {
  ...sesionPendiente,
  accessToken: "token-norte",
  sucursalId: 2,
  permisos: ["sucursales:buscar"],
  requiereSeleccionSucursal: false,
}

describe("PaginaSeleccionSucursal", () => {
  const fetchSimulado = vi.fn<typeof fetch>()
  let valor: ValorSesion

  function renderizar(sucursalNoDisponible = false) {
    valor = {
      estado: "autenticado",
      sesion: sesionPendiente,
      sucursalNoDisponible,
      iniciarSesion: vi.fn(),
      cerrarSesion: vi.fn(),
    }
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { mutations: { retry: false } } })
        }
      >
        <ContextoSesion value={valor}>
          <PaginaSeleccionSucursal />
        </ContextoSesion>
      </QueryClientProvider>
    )
  }

  const elegir = async (
    usuario: ReturnType<typeof userEvent.setup>,
    etiqueta: string
  ) => {
    await usuario.click(screen.getByRole("combobox", { name: /Sucursal/ }))
    await usuario.click(await screen.findByRole("option", { name: etiqueta }))
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
  })

  afterEach(() => {
    cleanup()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it("muestra el usuario, enfoca el selector y ofrece cerrar sesión", async () => {
    renderizar()

    // El usuario va sobre el título, con contexto para el lector de pantalla.
    const usuario = screen.getByText("Pérez Ana")
    expect(usuario.textContent).toBe("Usuario:Pérez Ana")
    expect(
      usuario.compareDocumentPosition(
        screen.getByRole("heading", { name: "Seleccione una sucursal" })
      ) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("combobox", { name: /Sucursal/ })
      )
    )
    expect(screen.getByText(/¿No es usted?/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy()
  })

  it("exige elegir una sucursal antes de ingresar", async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole("button", { name: "Ingresar" }))

    // El mensaje coincide con el título: se busca el error del campo.
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Seleccione una sucursal"
    )
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  it("al confirmar cambia la sucursal y adopta la sesión nueva", async () => {
    fetchSimulado.mockResolvedValue(respuestaApi(sesionElegida))
    const usuario = userEvent.setup()
    renderizar()

    await elegir(usuario, "Sucursal Norte")
    await usuario.click(screen.getByRole("button", { name: "Ingresar" }))

    await vi.waitFor(() =>
      expect(valor.iniciarSesion).toHaveBeenCalledWith(sesionElegida)
    )
    const [url, init] = fetchSimulado.mock.calls[0] ?? []
    expect(url).toBe("/api/v1/auth/cambiar-sucursal")
    expect(init?.credentials).toBe("include")
    expect(JSON.parse(String(init?.body))).toEqual({ sucursalId: 2 })
  })

  it("preselecciona la última sucursal usada si sigue disponible", () => {
    localStorage.setItem("soem.ultima-sucursal", "2")
    renderizar()

    expect(
      screen.getByRole("combobox", { name: /Sucursal/ }).textContent
    ).toContain("Sucursal Norte")
  })

  it("no preselecciona una sucursal a la que ya no tiene acceso", () => {
    localStorage.setItem("soem.ultima-sucursal", "9")
    renderizar()

    expect(
      screen.getByRole("combobox", { name: /Sucursal/ }).textContent
    ).toContain("Seleccione")
  })

  it("avisa si la sucursal en la que trabajaba ya no está disponible", () => {
    renderizar(true)

    expect(
      screen.getByText(
        "La sucursal en la que trabajaba ya no está disponible. Seleccione otra para continuar."
      )
    ).toBeTruthy()
  })

  it("sin acceso a la sucursal muestra el error y sigue en el selector", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaApi(null, 400, {
        mensaje: "No tiene acceso a la sucursal solicitada",
        errores: [
          {
            campo: "sucursalId",
            detalle: "No tiene acceso a la sucursal solicitada",
          },
        ],
      })
    )
    const usuario = userEvent.setup()
    renderizar()

    await elegir(usuario, "Matriz")
    await usuario.click(screen.getByRole("button", { name: "Ingresar" }))

    // Aviso general y error del campo, asociado al selector.
    const alertas = await screen.findAllByRole("alert")
    expect(
      alertas.every((alerta) =>
        alerta.textContent?.includes("No tiene acceso a la sucursal solicitada")
      )
    ).toBe(true)
    expect(
      screen
        .getByRole("combobox", { name: /Sucursal/ })
        .getAttribute("aria-invalid")
    ).toBe("true")
    expect(valor.iniciarSesion).not.toHaveBeenCalled()
    expect(valor.cerrarSesion).not.toHaveBeenCalled()
  })

  it("ante un 401 cierra la sesión", async () => {
    fetchSimulado.mockResolvedValue(new Response("", { status: 401 }))
    const usuario = userEvent.setup()
    renderizar()

    await elegir(usuario, "Matriz")
    await usuario.click(screen.getByRole("button", { name: "Ingresar" }))

    await vi.waitFor(() => expect(valor.cerrarSesion).toHaveBeenCalled())
  })

  it("ante un fallo del servidor conserva la sesión y permite reintentar", async () => {
    fetchSimulado.mockResolvedValue(new Response("", { status: 502 }))
    const usuario = userEvent.setup()
    renderizar()

    await elegir(usuario, "Matriz")
    await usuario.click(screen.getByRole("button", { name: "Ingresar" }))

    expect((await screen.findByRole("alert")).textContent).toContain(
      "El servidor no está disponible"
    )
    expect(valor.cerrarSesion).not.toHaveBeenCalled()
    expect(
      screen.getByRole("button", { name: "Ingresar" }).hasAttribute("disabled")
    ).toBe(false)
  })
})
