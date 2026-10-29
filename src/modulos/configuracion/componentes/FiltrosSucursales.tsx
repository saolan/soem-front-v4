import { SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import {
  CampoFiltroSeleccion,
  CampoFiltroTexto,
} from "@/compartido/componentes/CampoFiltro"
import { PanelFiltros } from "@/compartido/componentes/PanelFiltros"
import { Button } from "@/compartido/componentes/ui/button"
import type { FiltroSucursal } from "@/modulos/configuracion/esquemas/sucursal"

type Filtros = Partial<Record<FiltroSucursal, string>>

const CAMPOS_TEXTO: { nombre: FiltroSucursal; etiqueta: string }[] = [
  { nombre: "codigo", etiqueta: "Código" },
  { nombre: "descri", etiqueta: "Descripción" },
  { nombre: "ruc", etiqueta: "RUC" },
]

// En xl los campos se reparten la línea y los botones van al final.
const CLASE_CAMPO = "xl:min-w-0 xl:flex-1"

const OPCIONES_ESTADO = [
  { value: "", label: "Todos" },
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" },
]

const OPCIONES_MATRIZ = [
  { value: "", label: "Todas" },
  { value: "true", label: "Solo matriz" },
  { value: "false", label: "Sin matriz" },
]

/**
 * Filtros del listado. Se aplican al enviar el formulario; el componente se
 * monta de nuevo cuando cambian los filtros de la URL.
 */
export function FiltrosSucursales({
  filtros,
  onAplicar,
}: {
  filtros: Filtros
  onAplicar: (filtros: Filtros) => void
}) {
  const [valores, setValores] = useState<Filtros>(filtros)
  const cambiar = (nombre: FiltroSucursal, valor: string) =>
    setValores((previos) => ({ ...previos, [nombre]: valor }))

  return (
    <PanelFiltros
      etiqueta="Filtros de sucursales"
      activos={Object.values(filtros).filter(Boolean).length}
    >
      <form
        className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:items-end"
        onSubmit={(evento) => {
          evento.preventDefault()
          onAplicar(valores)
        }}
      >
        {CAMPOS_TEXTO.map(({ nombre, etiqueta }) => (
          <CampoFiltroTexto
            key={nombre}
            etiqueta={etiqueta}
            className={CLASE_CAMPO}
            valor={valores[nombre] ?? ""}
            inputMode={nombre === "ruc" ? "numeric" : undefined}
            onCambio={(valor) => cambiar(nombre, valor)}
          />
        ))}
        <CampoFiltroSeleccion
          className={CLASE_CAMPO}
          etiqueta="Matriz"
          opciones={OPCIONES_MATRIZ}
          valor={valores.matriz ?? ""}
          onCambio={(valor) => cambiar("matriz", valor)}
        />
        <CampoFiltroSeleccion
          className={CLASE_CAMPO}
          etiqueta="Estado"
          opciones={OPCIONES_ESTADO}
          valor={valores.estado ?? ""}
          onCambio={(valor) => cambiar("estado", valor)}
        />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3 xl:shrink-0">
          {/* Mismo ancho que el botón Nuevo (w-24) */}
          <Button type="submit" className="w-24">
            <SearchIcon aria-hidden="true" />
            Buscar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-24"
            onClick={() => onAplicar({})}
          >
            <XIcon aria-hidden="true" />
            Limpiar
          </Button>
        </div>
      </form>
    </PanelFiltros>
  )
}
