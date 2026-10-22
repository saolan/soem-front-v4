import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { Button } from "@/compartido/componentes/ui/button"
import { FieldGroup } from "@/compartido/componentes/ui/field"
import { useLogin } from "@/modulos/seguridad/api/autenticacion"
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
    <PantallaAutenticacion
      titulo="Iniciar sesión"
      descripcion="Ingrese sus credenciales para acceder a SOEM."
    >
      <form onSubmit={enviar} noValidate>
        <FieldGroup>
          <AvisoError mensaje={aviso} />
          <CampoFormulario
            control={formulario.control}
            name="usuario"
            etiqueta="Usuario"
            autoComplete="username"
            autoFocus
          />
          <CampoFormulario
            control={formulario.control}
            name="clave"
            etiqueta="Clave"
            type="password"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Ingresando…" : "Ingresar"}
          </Button>
        </FieldGroup>
      </form>
    </PantallaAutenticacion>
  )
}
