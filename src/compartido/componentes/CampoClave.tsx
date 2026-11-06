import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"
import type { FieldValues } from "react-hook-form"

import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { Button } from "@/compartido/componentes/ui/button"

const AVISO_BLOQ_MAYUS = "Bloq Mayús está activado."

type PropsCampoClave<T extends FieldValues> = Omit<
  React.ComponentProps<typeof CampoFormulario<T>>,
  "type" | "accionFinal"
>

/**
 * Campo de clave con botón para mostrarla u ocultarla y aviso de Bloq Mayús.
 * La clave nunca se guarda ni se registra: solo cambia el `type` del input.
 */
export function CampoClave<T extends FieldValues>({
  descripcion,
  onKeyDown,
  onKeyUp,
  onBlurCapture,
  ...props
}: PropsCampoClave<T>) {
  const [visible, setVisible] = useState(false)
  const [bloqMayus, setBloqMayus] = useState(false)

  const leerBloqMayus = (evento: React.KeyboardEvent<HTMLInputElement>) =>
    setBloqMayus(evento.getModifierState("CapsLock"))

  return (
    <CampoFormulario
      {...props}
      type={visible ? "text" : "password"}
      // El aviso se antepone a la ayuda del campo, sin reemplazarla.
      descripcion={
        bloqMayus
          ? [AVISO_BLOQ_MAYUS, descripcion].filter(Boolean).join(" ")
          : descripcion
      }
      onKeyDown={(evento) => {
        leerBloqMayus(evento)
        onKeyDown?.(evento)
      }}
      onKeyUp={(evento) => {
        leerBloqMayus(evento)
        onKeyUp?.(evento)
      }}
      onBlurCapture={(evento) => {
        setBloqMayus(false)
        onBlurCapture?.(evento)
      }}
      accionFinal={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          // Nombre fijo + aria-pressed (el lector anuncia el estado); incluye
          // la etiqueta para distinguir varios campos de clave en un formulario.
          aria-label={`Mostrar ${props.etiqueta.toLocaleLowerCase("es")}`}
          aria-pressed={visible}
          onClick={() => setVisible((actual) => !actual)}
        >
          {visible ? (
            <EyeOffIcon aria-hidden="true" />
          ) : (
            <EyeIcon aria-hidden="true" />
          )}
        </Button>
      }
    />
  )
}
