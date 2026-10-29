import { Link } from "react-router"

import { Button, buttonVariants } from "@/compartido/componentes/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip"

/**
 * Botón de solo icono con tooltip. `etiqueta` es el texto del tooltip y, si no
 * se indica `aria-label`, también su nombre accesible.
 */
export function BotonIcono({
  etiqueta,
  "aria-label": nombreAccesible,
  ...props
}: React.ComponentProps<typeof Button> & { etiqueta: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={nombreAccesible ?? etiqueta}
            {...props}
          />
        }
      />
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Enlace de solo icono con tooltip y aspecto de BotonIcono. Para navegar se usa
 * `<Link>` (rol "link"), no `Button` de Base UI, que con `nativeButton={false}`
 * le pondría `role="button"`.
 */
export function EnlaceIcono({
  etiqueta,
  ruta,
  "aria-label": nombreAccesible,
  className,
  children,
}: {
  etiqueta: string
  ruta: string
  "aria-label"?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={ruta}
            aria-label={nombreAccesible ?? etiqueta}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className,
            })}
          >
            {children}
          </Link>
        }
      />
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  )
}
