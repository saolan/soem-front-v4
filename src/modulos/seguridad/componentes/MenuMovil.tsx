import { MenuIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/compartido/componentes/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/compartido/componentes/ui/sheet"
import { MenuLateral } from "@/modulos/seguridad/componentes/MenuLateral"

/**
 * Menú en panel lateral para pantallas menores a `md`. El diálogo de Base UI
 * pone aria-expanded/aria-controls en el botón, atrapa el foco, cierra con
 * Esc y devuelve el foco al botón.
 */
export function MenuMovil() {
  const [abierto, setAbierto] = useState(false)

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menú principal"
          />
        }
      >
        <MenuIcon aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="w-72 gap-0">
        <SheetHeader className="flex-row items-center justify-between border-b">
          <SheetTitle className="text-primary">SOEM</SheetTitle>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Cerrar menú principal"
              />
            }
          >
            <XIcon aria-hidden="true" />
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-2">
          <MenuLateral alNavegar={() => setAbierto(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
