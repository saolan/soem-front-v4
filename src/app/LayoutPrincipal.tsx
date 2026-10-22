import { Outlet } from "react-router"

import { MenuUsuario } from "@/modulos/seguridad/componentes/MenuUsuario"
import { SelectorSucursal } from "@/modulos/seguridad/componentes/SelectorSucursal"

export function LayoutPrincipal() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2 sm:px-6">
        <span className="font-heading text-lg font-semibold">SOEM</span>
        <div className="flex min-w-0 items-center gap-2">
          <SelectorSucursal />
          <MenuUsuario />
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
