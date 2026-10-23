import { createBrowserRouter } from "react-router"

import { LayoutPrincipal } from "@/app/LayoutPrincipal"
import { PaginaError } from "@/app/PaginaError"
import { PaginaInicio } from "@/app/PaginaInicio"
import { CargandoPagina } from "@/compartido/componentes/CargandoPagina"
import { RutaProtegida, RutaPublica } from "@/compartido/sesion/GuardasRuta"
import { rutasCaja } from "@/modulos/caja/rutas"
import { rutasConfiguracion } from "@/modulos/configuracion/rutas"
import { rutasContabilidad } from "@/modulos/contabilidad/rutas"
import { rutasCuentasPorCobrar } from "@/modulos/cuentasporcobrar/rutas"
import { rutasCuentasPorPagar } from "@/modulos/cuentasporpagar/rutas"
import { rutasEgreso } from "@/modulos/egreso/rutas"
import { rutasIngreso } from "@/modulos/ingreso/rutas"
import { rutasInventario } from "@/modulos/inventario/rutas"
import { rutasProcesos } from "@/modulos/procesos/rutas"
import { rutasReportes } from "@/modulos/reportes/rutas"
import { GuardaMenu } from "@/modulos/seguridad/componentes/GuardaMenu"
import {
  rutasPaginasSeguridad,
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
            children: [
              { index: true, element: <PaginaInicio /> },
              {
                // Las páginas del menú solo se abren si están en el menú
                // de la sesión.
                element: <GuardaMenu />,
                children: [
                  ...rutasConfiguracion,
                  ...rutasPaginasSeguridad,
                  ...rutasCaja,
                  ...rutasContabilidad,
                  ...rutasCuentasPorCobrar,
                  ...rutasCuentasPorPagar,
                  ...rutasEgreso,
                  ...rutasIngreso,
                  ...rutasInventario,
                  ...rutasProcesos,
                  ...rutasReportes,
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
