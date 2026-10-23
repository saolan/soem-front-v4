import { z } from "zod"

const NOMBRE_CANAL = "soem-sesion"

// Solo viajan avisos entre pestañas: nunca tokens ni datos de la sesión.
export const esquemaEventoSesion = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("cerrada") }),
  z.object({ tipo: z.literal("iniciada") }),
])

export type EventoSesion = z.infer<typeof esquemaEventoSesion>

export interface CanalSesion {
  anunciar: (evento: EventoSesion) => void
  cerrar: () => void
}

/**
 * Avisa a las demás pestañas del mismo navegador cuando la sesión se cierra
 * o se inicia (comparten la cookie del refresh token). Sin BroadcastChannel
 * cada pestaña sigue funcionando por su cuenta.
 */
export function abrirCanalSesion(
  alRecibir: (evento: EventoSesion) => void
): CanalSesion {
  if (typeof BroadcastChannel === "undefined") {
    return { anunciar: () => undefined, cerrar: () => undefined }
  }
  const canal = new BroadcastChannel(NOMBRE_CANAL)
  canal.onmessage = (mensaje: MessageEvent<unknown>) => {
    const evento = esquemaEventoSesion.safeParse(mensaje.data)
    if (evento.success) {
      alRecibir(evento.data)
    }
  }
  return {
    anunciar: (evento) => canal.postMessage(evento),
    cerrar: () => canal.close(),
  }
}
