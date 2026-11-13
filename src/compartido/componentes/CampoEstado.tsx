import type { Control, FieldValues, Path } from "react-hook-form"

import { CampoInterruptor } from "@/compartido/componentes/CampoInterruptor"
import { EtiquetaEstado } from "@/compartido/componentes/EtiquetaEstado"

/**
 * Interruptor del campo `estado` (borrado lógico) con su valor visible:
 * Activo o Inactivo, igual que en los listados.
 */
export function CampoEstado<T extends FieldValues>({
  control,
  name,
  puedeCambiar,
  soloLectura,
  etiquetaArriba = false,
}: {
  control: Control<T>
  name: Path<T>
  /** Desactivar es un borrado lógico: requiere permiso para eliminar. */
  puedeCambiar: boolean
  soloLectura: boolean
  /** Comparte fila con campos de texto (ver `CampoInterruptor`). */
  etiquetaArriba?: boolean
}) {
  return (
    <CampoInterruptor
      control={control}
      name={name}
      etiqueta="Estado"
      disabled={!puedeCambiar}
      descripcion={
        puedeCambiar || soloLectura
          ? undefined
          : "Requiere permiso para eliminar."
      }
      textoValor={(activo) => <EtiquetaEstado activo={activo} />}
      etiquetaArriba={etiquetaArriba}
    />
  )
}
