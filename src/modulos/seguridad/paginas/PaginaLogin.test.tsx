import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { establecerToken } from "@/compartido/api/clienteHttp"
import {
  ContextoSesion,
  type ValorSesion,
} from "@/compartido/sesion/ContextoSesion"
import { PaginaLogin } from "@/modulos/seguridad/paginas/PaginaLogin"

const respuestaLogin = {
  accessToken: "token",
  expiraEnSegundos: 900,
  sucursalId: 1,
  sucursales: [{ valor: 1, etiqueta: "Matriz" }],
  usuario: {
    personaId: 1,
    cedulaRuc: "0102030405",
    apelli: "Pérez",
    nombre: "Ana",
    direcc: null,
    telefo: null,
    correo: null,
    fechaNaci: null,
    usuari: "aperez",
    caducaClav: false,
    caducaFechHora: null,
    estado: true,
  },
  permisos: ["usuarios:buscar"],
  claveCaducada: false,
}

function respuestaJson(cuerpo: unknown, status: number) {
  return new Response(JSON.stringify(cuerpo), { status })
}

function renderizar() {
  const sesion: ValorSesion = {
    estado: "anonimo",
    sesion: null,
    iniciarSesion: vi.fn(),
    cerrarSesion: vi.fn(),
  }
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ContextoSesion value={sesion}>
        <PaginaLogin />
      </ContextoSesion>
    </QueryClientProvider>
  )
  return sesion
}

async function ingresar(usuario: string, clave: string) {
  const usuarioEvento = userEvent.setup()
  await usuarioEvento.type(screen.getByLabelText("Usuario"), usuario)
  await usuarioEvento.type(screen.getByLabelText("Clave"), clave)
  await usuarioEvento.click(screen.getByRole("button", { name: "Ingresar" }))
}

describe("PaginaLogin", () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
  })

  afterEach(() => {
    cleanup()
    establecerToken(null)
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  it("valida los campos obligatorios sin llamar al API", async () => {
    renderizar()

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Ingresar" }))

    expect(await screen.findByText("El usuario es obligatorio")).toBeTruthy()
    expect(screen.getByText("La clave es obligatoria")).toBeTruthy()
    expect(screen.getByLabelText("Usuario").getAttribute("aria-invalid")).toBe(
      "true"
    )
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  it("envía solo usuario y clave e inicia la sesión", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        {
          exito: true,
          mensaje: "Inicio de sesión exitoso",
          datos: respuestaLogin,
        },
        200
      )
    )
    const sesion = renderizar()

    await ingresar("aperez", "secreta")

    await vi.waitFor(() =>
      expect(sesion.iniciarSesion).toHaveBeenCalledWith(respuestaLogin)
    )
    const [url, init] = fetchSimulado.mock.calls[0] ?? []
    expect(url).toBe("/api/v1/auth/login")
    expect(JSON.parse(String(init?.body))).toEqual({
      usuario: "aperez",
      clave: "secreta",
    })
  })

  it("muestra el mensaje del back-end ante credenciales inválidas", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        {
          exito: false,
          mensaje: "Usuario o clave incorrectos",
          datos: null,
          errores: [],
        },
        401
      )
    )
    const sesion = renderizar()

    await ingresar("aperez", "mala")

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Usuario o clave incorrectos"
    )
    expect((screen.getByLabelText("Clave") as HTMLInputElement).value).toBe("")
    expect(sesion.iniciarSesion).not.toHaveBeenCalled()
  })

  it("asocia los errores de campo del back-end a cada control", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        {
          exito: false,
          mensaje: "Error de validación en los datos enviados",
          datos: null,
          errores: [
            {
              campo: "usuario",
              detalle: "El usuario no puede superar los 100 caracteres",
            },
          ],
        },
        400
      )
    )
    renderizar()

    await ingresar("aperez", "secreta")

    const error = await screen.findByText(
      "El usuario no puede superar los 100 caracteres"
    )
    expect(
      screen.getByLabelText("Usuario").getAttribute("aria-describedby")
    ).toBe(error.id)
    expect(
      screen.getByText("Error de validación en los datos enviados")
    ).toBeTruthy()
  })
})
