import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"

import { queryClient } from "@/app/queryClient"
import { router } from "@/app/router"
import { ThemeProvider } from "@/compartido/componentes/theme-provider"
import { Toaster } from "@/compartido/componentes/ui/sonner"
import { SesionProvider } from "@/compartido/sesion/ContextoSesion"

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SesionProvider>
          <RouterProvider router={router} />
        </SesionProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
