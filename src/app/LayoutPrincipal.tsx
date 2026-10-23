import { Outlet } from "react-router"

import { MenuLateral } from "@/modulos/seguridad/componentes/MenuLateral"
import { MenuMovil } from "@/modulos/seguridad/componentes/MenuMovil"
import { MenuUsuario } from "@/modulos/seguridad/componentes/MenuUsuario"
import { SelectorSucursal } from "@/modulos/seguridad/componentes/SelectorSucursal"

export function LayoutPrincipal() {
  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2">
          <MenuMovil />
          <span className="font-heading text-lg font-semibold">SOEM</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <SelectorSucursal />
          <MenuUsuario />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r p-2 md:block">
          <MenuLateral />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
