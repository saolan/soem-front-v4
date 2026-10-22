import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { Button } from "@/compartido/componentes/ui/button"
import { FieldGroup } from "@/compartido/componentes/ui/field"
import { RUTA_INICIO } from "@/compartido/sesion/GuardasRuta"
import { useSesion } from "@/compartido/sesion/useSesion"
import {
  useCambiarClave,
  useLogout,
} from "@/modulos/seguridad/api/autenticacion"
import { PantallaAutenticacion } from "@/modulos/seguridad/componentes/PantallaAutenticacion"
import {
  esquemaCambioClave,
  type CambioClave,
} from "@/modulos/seguridad/esquemas/autenticacion"

export function PaginaCambioClave() {
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const cambiarClave = useCambiarClave()
  const logout = useLogout()
  const [aviso, setAviso] = useState<string | null>(null)
  const formulario = useForm<CambioClave>({
    resolver: zodResolver(esquemaCambioClave),
    defaultValues: { claveActual: "", claveNueva: "", confirmacionClave: "" },
  })
  const claveCaducada = sesion?.claveCaducada ?? false

  const enviar = formulario.handleSubmit(async (valores) => {
    setAviso(null)
    try {
      const { datos, mensaje } = await cambiarClave.mutateAsync(valores)
      toast.success(mensaje)
      // Sin datos la sesión se cerró y RutaProtegida lleva al login.
      if (datos) {
        void navegar(RUTA_INICIO, { replace: true })
      }
    } catch (error) {
      setAviso(
        aplicarErroresFormulario(error, formulario.setError, [
          "claveActual",
          "claveNueva",
        ])
      )
    }
  })

  return (
    <PantallaAutenticacion
      titulo="Cambiar clave"
      descripcion={
        claveCaducada
          ? "Su clave está caducada. Debe cambiarla para continuar."
          : "Ingrese su clave actual y la nueva clave."
      }
    >
      <form onSubmit={enviar} noValidate>
        <FieldGroup>
          <AvisoError mensaje={aviso} />
          <CampoFormulario
            control={formulario.control}
            name="claveActual"
            etiqueta="Clave actual"
            type="password"
            autoComplete="current-password"
            autoFocus
          />
          <CampoFormulario
            control={formulario.control}
            name="claveNueva"
            etiqueta="Clave nueva"
            type="password"
            autoComplete="new-password"
          />
          <CampoFormulario
            control={formulario.control}
            name="confirmacionClave"
            etiqueta="Confirmar clave nueva"
            type="password"
            autoComplete="new-password"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={cambiarClave.isPending}
            >
              {cambiarClave.isPending ? "Guardando…" : "Cambiar clave"}
            </Button>
            {claveCaducada ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                Cerrar sesión
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void navegar(-1)}
              >
                Cancelar
              </Button>
            )}
          </div>
        </FieldGroup>
      </form>
    </PantallaAutenticacion>
  )
}
