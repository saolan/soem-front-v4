import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renovarSesion } from "@/compartido/api/clienteHttp"
import { CanalFalso } from "@/compartido/sesion/pruebas/CanalFalso"
import { useCierrePorInactividad } from "@/compartido/sesion/useCierrePorInactividad"

vi.mock("@/compartido/api/clienteHttp", () => ({
  renovarSesion: vi.fn(() => Promise.resolve("renovada")),
}))

const MINUTO = 60_000

function montar(activo = true) {
  const onVencer = vi.fn()
  const vista = renderHook(
    (props: { activo: boolean }) =>
      useCierrePorInactividad({
        activo: props.activo,
        inactividadSegundos: 30 * 60,
        avisoSegundos: 60,
        marcaRenovacion: null,
        onVencer,
      }),
    { initialProps: { activo } }
  )
  return { ...vista, onVencer }
}

const avanzar = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const teclear = () =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))
  })

describe("useCierrePorInactividad", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("BroadcastChannel", CanalFalso)
  })

  afterEach(() => {
    cleanup()
    CanalFalso.reiniciar()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.mocked(renovarSesion).mockClear()
  })

  it("avisa un minuto antes y cierra la sesión a los 30 minutos sin uso", () => {
    const { result, onVencer } = montar()

    avanzar(28 * MINUTO)
    expect(result.current.segundosRestantes).toBeNull()

    avanzar(MINUTO + 1_000)
    expect(result.current.segundosRestantes).toBe(59)
    expect(onVencer).not.toHaveBeenCalled()

    avanzar(MINUTO)
    expect(onVencer).toHaveBeenCalledTimes(1)
    expect(result.current.segundosRestantes).toBeNull()

    avanzar(5 * MINUTO)
    expect(onVencer).toHaveBeenCalledTimes(1)
  })

  it("el uso del teclado reinicia el contador", () => {
    const { onVencer } = montar()

    avanzar(20 * MINUTO)
    teclear()
    avanzar(20 * MINUTO)

    expect(onVencer).not.toHaveBeenCalled()
  })

  it("con el aviso visible solo «Continuar» mantiene la sesión", () => {
    const { result, onVencer } = montar()

    avanzar(29 * MINUTO + 30_000)
    teclear()
    expect(result.current.segundosRestantes).not.toBeNull()

    act(() => result.current.continuar())
    expect(result.current.segundosRestantes).toBeNull()

    avanzar(29 * MINUTO)
    expect(onVencer).not.toHaveBeenCalled()
  })

  it("la actividad en otra pestaña mantiene la sesión en esta", () => {
    const { onVencer } = montar()
    const otraPestana = new CanalFalso("soem-actividad")

    avanzar(20 * MINUTO)
    act(() => otraPestana.postMessage({ tipo: "actividad" }))
    avanzar(20 * MINUTO)

    expect(onVencer).not.toHaveBeenCalled()
  })

  it("anuncia la actividad propia a las demás pestañas", () => {
    montar()
    const recibidos: unknown[] = []
    const otraPestana = new CanalFalso("soem-actividad")
    otraPestana.onmessage = (mensaje) => recibidos.push(mensaje.data)

    avanzar(MINUTO)
    teclear()
    teclear()

    // Limitado: dos teclas seguidas generan un solo aviso.
    expect(recibidos).toEqual([{ tipo: "actividad" }])
  })

  it("renueva el token con actividad pasada la mitad de la ventana", () => {
    montar()

    avanzar(10 * MINUTO)
    teclear()
    expect(renovarSesion).not.toHaveBeenCalled()

    avanzar(6 * MINUTO)
    teclear()
    expect(renovarSesion).toHaveBeenCalledTimes(1)
  })

  it("sin sesión no vigila la inactividad", () => {
    const { result, onVencer } = montar(false)

    avanzar(40 * MINUTO)

    expect(onVencer).not.toHaveBeenCalled()
    expect(result.current.segundosRestantes).toBeNull()
  })
})
