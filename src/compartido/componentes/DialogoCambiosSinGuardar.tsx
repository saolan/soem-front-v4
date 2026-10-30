import { DialogoConfirmacion } from "@/compartido/componentes/DialogoConfirmacion"
import type { AvisoCambiosSinGuardar } from "@/compartido/hooks/useAvisoCambiosSinGuardar"

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
      descripcion="Los cambios sin guardar se perderán. ¿Desea salir sin guardar?"
      textoConfirmar="Salir sin guardar"
      onConfirmar={salida.confirmar}
    />
  )
}
