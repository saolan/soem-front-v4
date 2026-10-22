import { createBrowserRouter } from "react-router"

import { LayoutPrincipal } from "@/app/LayoutPrincipal"
import { PaginaError } from "@/app/PaginaError"
import { PaginaInicio } from "@/app/PaginaInicio"
import { CargandoPagina } from "@/compartido/componentes/CargandoPagina"
import { RutaProtegida, RutaPublica } from "@/compartido/sesion/GuardasRuta"
import {
  rutasPublicasSeguridad,
  rutasSesionSeguridad,
} from "@/modulos/seguridad/rutas"

export const router = createBrowserRouter([
  {
    errorElement: <PaginaError />,
    hydrateFallbackElement: <CargandoPagina />,
    children: [
      { element: <RutaPublica />, children: rutasPublicasSeguridad },
      {
        element: <RutaProtegida />,
        children: [
          ...rutasSesionSeguridad,
          {
            element: <LayoutPrincipal />,
            children: [{ index: true, element: <PaginaInicio /> }],
          },
        ],
      },
    ],
  },
])
