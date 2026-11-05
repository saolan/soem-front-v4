import { useEffect, useEffectEvent, useRef, useState } from "react"

import { renovarSesion } from "@/compartido/api/clienteHttp"
import { abrirCanalActividad } from "@/compartido/sesion/canalSesion"

/** Tiempo sin uso tras el que se cierra la sesión si el back-end no lo indica. */
export const INACTIVIDAD_POR_DEFECTO_SEGUNDOS = 30 * 60
/** Anticipación del aviso previo al cierre. */
export const AVISO_PREVIO_SEGUNDOS = 60

// Interacciones que cuentan como uso del sistema (escribir en un formulario
// cuenta aunque no haya llamadas al API).
const EVENTOS_ACTIVIDAD = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
] as const
// Límite de avisos a otras pestañas y de comprobaciones de renovación.
const INTERVALO_ANUNCIO_MS = 15_000
const INTERVALO_COMPROBACION_MS = 1_000

interface OpcionesCierrePorInactividad {
  /** Hay sesión iniciada; sin ella no se vigila nada. */
  activo: boolean
  inactividadSegundos: number
  avisoSegundos: number
  /**
   * Cambia cada vez que la sesión se renueva (ej. el objeto de sesión): marca
   * el inicio de la ventana del refresh token en el back-end.
   */
  marcaRenovacion: unknown
  /** Se agotó el tiempo sin uso: cerrar la sesión. */
  onVencer: () => void
}

/**
 * Cierra la sesión tras un tiempo sin uso, con aviso previo (WCAG 2.2.1).
 *
 * - La actividad (teclado, puntero, rueda, toque) reinicia el contador y se
 *   comparte con las demás pestañas: usar una mantiene viva la sesión en
 *   todas.
 * - Mientras hay actividad, renueva el token cuando ha pasado la mitad de la
 *   ventana desde la última renovación, para que la vigencia del refresh
 *   token en el back-end avance con el uso real aunque no haya peticiones.
 * - Mide con `Date.now()`: si el equipo se suspende, al despertar se cierra
 *   si ya venció.
 *
 * Devuelve los segundos que faltan mientras el aviso está visible (`null` si
 * no corresponde avisar) y `continuar` para seguir trabajando.
 */
export function useCierrePorInactividad({
  activo,
  inactividadSegundos,
  avisoSegundos,
  marcaRenovacion,
  onVencer,
}: OpcionesCierrePorInactividad) {
  const inactividadMs = inactividadSegundos * 1000
  const avisoMs = avisoSegundos * 1000
  const ultimaActividad = useRef(0)
  const ultimoAnuncio = useRef(0)
  const ultimaRenovacion = useRef(0)
  const canal = useRef<ReturnType<typeof abrirCanalActividad> | null>(null)
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(
    null
  )

  useEffect(() => {
    ultimaRenovacion.current = Date.now()
  }, [marcaRenovacion])

  const restanteMs = () =>
    inactividadMs - (Date.now() - ultimaActividad.current)

  /** Actividad de esta pestaña (`propia`) o anunciada por otra. */
  const registrarActividad = (propia: boolean) => {
    const ahora = Date.now()
    ultimaActividad.current = ahora
    setSegundosRestantes(null)
    if (!propia || ahora - ultimoAnuncio.current < INTERVALO_ANUNCIO_MS) {
      return
    }
    ultimoAnuncio.current = ahora
    canal.current?.anunciar()
    if (ahora - ultimaRenovacion.current >= inactividadMs / 2) {
      // Si falla, la siguiente petición al API vuelve a intentarlo.
      void renovarSesion()
    }
  }

  const alActividadRemota = useEffectEvent(() => registrarActividad(false))

  // Con el aviso visible, solo «Continuar» mantiene la sesión: mover el
  // puntero o pulsar teclas no la extiende sin que el usuario lo decida.
  const alInteractuar = useEffectEvent(() => {
    if (restanteMs() > avisoMs) {
      registrarActividad(true)
    }
  })

  const comprobar = useEffectEvent((vencer: () => void) => {
    const restante = restanteMs()
    if (restante <= 0) {
      setSegundosRestantes(null)
      vencer()
      return
    }
    setSegundosRestantes(
      restante <= avisoMs ? Math.ceil(restante / 1000) : null
    )
  })

  const vencer = useEffectEvent(() => onVencer())

  useEffect(() => {
    if (!activo) {
      return
    }
    ultimaActividad.current = Date.now()
    ultimoAnuncio.current = 0
    canal.current = abrirCanalActividad(alActividadRemota)

    let vencida = false
    const intervalo = window.setInterval(
      () =>
        comprobar(() => {
          if (!vencida) {
            vencida = true
            vencer()
          }
        }),
      INTERVALO_COMPROBACION_MS
    )
    const opciones = { passive: true, capture: true }
    for (const evento of EVENTOS_ACTIVIDAD) {
      window.addEventListener(evento, alInteractuar, opciones)
    }

    return () => {
      window.clearInterval(intervalo)
      for (const evento of EVENTOS_ACTIVIDAD) {
        window.removeEventListener(evento, alInteractuar, opciones)
      }
      canal.current?.cerrar()
      canal.current = null
      setSegundosRestantes(null)
    }
  }, [activo])

  return {
    segundosRestantes: activo ? segundosRestantes : null,
    /** Sigue trabajando: reinicia el contador en todas las pestañas. */
    continuar: () => {
      ultimoAnuncio.current = 0
      registrarActividad(true)
    },
  }
}
