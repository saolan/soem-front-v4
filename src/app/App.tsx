import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"

import { queryClient } from "@/app/queryClient"
import { router } from "@/app/router"
import { ThemeProvider } from "@/compartido/componentes/theme-provider"
import { Toaster } from "@/compartido/componentes/ui/sonner"
import { TooltipProvider } from "@/compartido/componentes/ui/tooltip"
import { SesionProvider } from "@/compartido/sesion/ContextoSesion"

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* Retraso común de los tooltips (Base UI usa 600 ms por defecto) */}
        <TooltipProvider delay={300}>
          <SesionProvider>
            <RouterProvider router={router} />
          </SesionProvider>
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
