import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CampoClave } from "@/compartido/componentes/CampoClave"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { Button } from "@/compartido/componentes/ui/button"
import { FieldGroup } from "@/compartido/componentes/ui/field"
import { useLogin } from "@/modulos/seguridad/api/autenticacion"
import {
  CAMPO_AUTENTICACION,
  BOTON_AUTENTICACION,
} from "@/modulos/seguridad/componentes/clasesAutenticacion"
import { PantallaAutenticacion } from "@/modulos/seguridad/componentes/PantallaAutenticacion"
import {
  esquemaLoginRequest,
  type LoginRequest,
} from "@/modulos/seguridad/esquemas/autenticacion"

export function PaginaLogin() {
  const login = useLogin()
  const [aviso, setAviso] = useState<string | null>(null)
  const formulario = useForm<LoginRequest>({
    resolver: zodResolver(esquemaLoginRequest),
    defaultValues: { usuario: "", clave: "" },
  })

  // Tras el login, RutaPublica redirige a la ruta de retorno (o al cambio de
  // clave si está caducada).
  const enviar = formulario.handleSubmit(async (valores) => {
    setAviso(null)
    try {
      await login.mutateAsync(valores)
    } catch (error) {
      formulario.setValue("clave", "")
      setAviso(
        aplicarErroresFormulario(error, formulario.setError, [
          "usuario",
          "clave",
        ])
      )
    }
  })

  return (
    <PantallaAutenticacion titulo="Iniciar sesión">
      <form onSubmit={enviar} noValidate>
        <FieldGroup>
          <AvisoError mensaje={aviso} />
          <CampoFormulario
            control={formulario.control}
            name="usuario"
            etiqueta="Usuario"
            autoComplete="username"
            autoFocus
            className={CAMPO_AUTENTICACION}
          />
          <CampoClave
            control={formulario.control}
            name="clave"
            etiqueta="Clave"
            autoComplete="current-password"
            className={CAMPO_AUTENTICACION}
          />
          <Button
            type="submit"
            className={BOTON_AUTENTICACION}
            disabled={login.isPending}
          >
            {login.isPending ? "Ingresando…" : "Ingresar"}
          </Button>
        </FieldGroup>
      </form>
    </PantallaAutenticacion>
  )
}
