import { KeyRoundIcon, LogOutIcon, UserIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { Button } from "@/compartido/componentes/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import { RUTA_CAMBIO_CLAVE } from "@/compartido/sesion/GuardasRuta"
import { nombreVisible } from "@/compartido/sesion/nombreUsuario"
import { useSesion } from "@/compartido/sesion/useSesion"
import { useLogout } from "@/modulos/seguridad/api/autenticacion"

export function MenuUsuario() {
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const logout = useLogout()

  if (!sesion) {
    return null
  }

  // Apellido y nombre: el usuario de acceso no queda a la vista.
  const nombre = nombreVisible(sesion.usuario)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" aria-label={`Menú de usuario ${nombre}`} />
        }
      >
        <UserIcon aria-hidden="true" />
        <span className="hidden max-w-48 truncate sm:inline">{nombre}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{nombre}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navegar(RUTA_CAMBIO_CLAVE)}>
          <KeyRoundIcon aria-hidden="true" />
          Cambiar clave
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOutIcon aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
