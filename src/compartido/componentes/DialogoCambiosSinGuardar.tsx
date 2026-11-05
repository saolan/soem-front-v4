import { DialogoConfirmacion } from "@/compartido/componentes/DialogoConfirmacion"
import type { AvisoCambiosSinGuardar } from "@/compartido/hooks/useAvisoCambiosSinGuardar"

const listaConjuncion = new Intl.ListFormat("es", { type: "conjunction" })

/** Texto del aviso, indicando qué cambios se perderían. */
function descripcionCambiosSinGuardar(pendientes: string[]) {
  if (pendientes.length === 0) {
    return "Los cambios sin guardar se perderán. ¿Desea salir sin guardar?"
  }
  return `Hay cambios sin guardar en ${listaConjuncion.format(pendientes)}. Si sale ahora, se perderán. ¿Desea salir sin guardar?`
}

/** Confirmación al salir de una pantalla con cambios sin guardar. */
export function DialogoCambiosSinGuardar({
  salida,
}: {
  salida: AvisoCambiosSinGuardar
}) {
  return (
    <DialogoConfirmacion
      abierto={salida.bloqueado}
      onAbiertoChange={(abierto) => {
        if (!abierto) {
          salida.cancelar()
        }
      }}
      titulo="Cambios sin guardar"
      descripcion={descripcionCambiosSinGuardar(salida.pendientes)}
      textoConfirmar="Salir sin guardar"
      onConfirmar={salida.confirmar}
    />
  )
}
