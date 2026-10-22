import { BuildingIcon, ChevronDownIcon } from "lucide-react"
import { toast } from "sonner"

import { mensajeDeError } from "@/compartido/api/errores"
import { Button } from "@/compartido/componentes/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import { useSesion } from "@/compartido/sesion/useSesion"
import { useCambiarSucursal } from "@/modulos/seguridad/api/autenticacion"

/** Muestra la sucursal activa y permite cambiarla sin volver a iniciar sesión. */
export function SelectorSucursal() {
  const { sesion } = useSesion()
  const cambiarSucursal = useCambiarSucursal()

  if (!sesion) {
    return null
  }

  const actual = sesion.sucursales.find(
    (sucursal) => sucursal.valor === sesion.sucursalId
  )

  const seleccionar = (valor: unknown) => {
    if (typeof valor !== "number" || valor === sesion.sucursalId) {
      return
    }
    cambiarSucursal.mutate(valor, {
      onSuccess: ({ mensaje }) => toast.success(mensaje),
      onError: (error) => toast.error(mensajeDeError(error)),
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="max-w-48 sm:max-w-64"
            disabled={cambiarSucursal.isPending || sesion.sucursales.length < 2}
            aria-label={`Sucursal activa: ${actual?.etiqueta ?? "sin sucursal"}. Cambiar sucursal`}
          />
        }
      >
        <BuildingIcon aria-hidden="true" />
        <span className="truncate">{actual?.etiqueta ?? "Sucursal"}</span>
        <ChevronDownIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sucursal</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={sesion.sucursalId}
            onValueChange={seleccionar}
          >
            {sesion.sucursales.map((sucursal) => (
              <DropdownMenuRadioItem
                key={sucursal.valor}
                value={sucursal.valor}
                closeOnClick
              >
                {sucursal.etiqueta}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
