/**
 * BroadcastChannel en memoria para pruebas: entrega cada mensaje a las demás
 * instancias abiertas con el mismo nombre, como hacen las pestañas.
 */
export class CanalFalso {
  static abiertos: CanalFalso[] = []

  readonly name: string
  onmessage: ((mensaje: MessageEvent<unknown>) => void) | null = null

  constructor(name: string) {
    this.name = name
    CanalFalso.abiertos.push(this)
  }

  postMessage(data: unknown) {
    for (const otro of CanalFalso.abiertos) {
      if (otro !== this && otro.name === this.name) {
        otro.onmessage?.(new MessageEvent("message", { data }))
      }
    }
  }

  close() {
    CanalFalso.abiertos = CanalFalso.abiertos.filter((c) => c !== this)
  }

  static reiniciar() {
    CanalFalso.abiertos = []
  }
}
