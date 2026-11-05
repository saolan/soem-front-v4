import { z } from "zod"

const NOMBRE_CANAL = "soem-sesion"
const NOMBRE_CANAL_ACTIVIDAD = "soem-actividad"

// Solo viajan avisos entre pestañas: nunca tokens ni datos de la sesión.
export const esquemaEventoSesion = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("cerrada") }),
  z.object({ tipo: z.literal("iniciada") }),
])

export type EventoSesion = z.infer<typeof esquemaEventoSesion>

const esquemaEventoActividad = z.object({ tipo: z.literal("actividad") })

export interface CanalSesion {
  anunciar: (evento: EventoSesion) => void
  cerrar: () => void
}

export interface CanalActividad {
  anunciar: () => void
  cerrar: () => void
}

/**
 * Canal entre pestañas que solo entrega los mensajes válidos según
 * `esquema`. Sin BroadcastChannel cada pestaña sigue por su cuenta.
 */
function abrirCanal<T>(
  nombre: string,
  esquema: z.ZodType<T>,
  alRecibir: (evento: T) => void
): { anunciar: (evento: T) => void; cerrar: () => void } {
  if (typeof BroadcastChannel === "undefined") {
    return { anunciar: () => undefined, cerrar: () => undefined }
  }
  const canal = new BroadcastChannel(nombre)
  canal.onmessage = (mensaje: MessageEvent<unknown>) => {
    const evento = esquema.safeParse(mensaje.data)
    if (evento.success) {
      alRecibir(evento.data)
    }
  }
  return {
    anunciar: (evento: T) => canal.postMessage(evento),
    cerrar: () => canal.close(),
  }
}

/**
 * Avisa a las demás pestañas del mismo navegador cuando la sesión se cierra
 * o se inicia (comparten la cookie del refresh token).
 */
export function abrirCanalSesion(
  alRecibir: (evento: EventoSesion) => void
): CanalSesion {
  return abrirCanal(NOMBRE_CANAL, esquemaEventoSesion, alRecibir)
}

/**
 * Avisa a las demás pestañas de que el usuario está usando el sistema, para
 * que ninguna cierre la sesión por inactividad. Canal propio: así los avisos
 * frecuentes de actividad no llegan al manejador de la sesión.
 */
export function abrirCanalActividad(alRecibir: () => void): CanalActividad {
  const canal = abrirCanal(NOMBRE_CANAL_ACTIVIDAD, esquemaEventoActividad, () =>
    alRecibir()
  )
  return {
    anunciar: () => canal.anunciar({ tipo: "actividad" }),
    cerrar: canal.cerrar,
  }
}
