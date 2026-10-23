import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { abrirCanalSesion } from "@/compartido/sesion/canalSesion"
import { CanalFalso } from "@/compartido/sesion/pruebas/CanalFalso"

describe("abrirCanalSesion", () => {
  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", CanalFalso)
  })

  afterEach(() => {
    CanalFalso.reiniciar()
    vi.unstubAllGlobals()
  })

  it("entrega los avisos a las demás pestañas", () => {
    const recibidos = vi.fn()
    const pestanaA = abrirCanalSesion(recibidos)
    const pestanaB = abrirCanalSesion(vi.fn())

    pestanaB.anunciar({ tipo: "cerrada" })

    expect(recibidos).toHaveBeenCalledWith({ tipo: "cerrada" })
    pestanaA.cerrar()
    pestanaB.cerrar()
  })

  it("ignora los mensajes que no son avisos de sesión", () => {
    const recibidos = vi.fn()
    const pestana = abrirCanalSesion(recibidos)
    const ajena = new CanalFalso("soem-sesion")

    ajena.postMessage({ tipo: "iniciada", accessToken: "x" })
    ajena.postMessage({ tipo: "otro" })
    ajena.postMessage("cerrada")

    // El primero es válido: Zod descarta la propiedad extra.
    expect(recibidos.mock.calls).toEqual([[{ tipo: "iniciada" }]])
    pestana.cerrar()
  })

  it("funciona sin BroadcastChannel", () => {
    vi.stubGlobal("BroadcastChannel", undefined)
    const pestana = abrirCanalSesion(vi.fn())

    expect(() => pestana.anunciar({ tipo: "iniciada" })).not.toThrow()
    pestana.cerrar()
  })
})
