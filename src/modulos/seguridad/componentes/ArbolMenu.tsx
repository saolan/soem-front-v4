import { ChevronRightIcon } from "lucide-react"
import { useId, useRef, useState, type KeyboardEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"

import { cn } from "@/compartido/utilidades/cn"
import type { MenuNodoDTO } from "@/modulos/seguridad/esquemas/menu"
import { ancestrosDe, paginaActual } from "@/modulos/seguridad/utilidades/menu"

interface ItemVisible {
  nodo: MenuNodoDTO
  padreId: number | null
}

/** Opciones visibles en orden de lectura (las de los grupos abiertos). */
function aplanarVisibles(
  nodos: MenuNodoDTO[],
  expandidos: Set<number>,
  padreId: number | null = null
): ItemVisible[] {
  return nodos.flatMap((nodo) => [
    { nodo, padreId },
    ...(!nodo.detall && expandidos.has(nodo.menuId)
      ? aplanarVisibles(nodo.hijos, expandidos, nodo.menuId)
      : []),
  ])
}

const claseOpcion =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"

interface PropiedadesNodo {
  nodo: MenuNodoDTO
  idArbol: string
  expandidos: Set<number>
  tabulable: number | null
  actualId: number | null
  registrar: (menuId: number, elemento: HTMLElement | null) => void
  alternar: (menuId: number) => void
  alEnfocar: (menuId: number) => void
  alTeclear: (evento: KeyboardEvent<HTMLElement>, nodo: MenuNodoDTO) => void
  alNavegar?: () => void
}

function NodoMenu(props: PropiedadesNodo) {
  const { nodo, idArbol, expandidos, tabulable, actualId, registrar } = props
  const comunes = {
    ref: (elemento: HTMLElement | null) => registrar(nodo.menuId, elemento),
    role: "treeitem",
    tabIndex: tabulable === nodo.menuId ? 0 : -1,
    onFocus: () => props.alEnfocar(nodo.menuId),
    onKeyDown: (evento: KeyboardEvent<HTMLElement>) =>
      props.alTeclear(evento, nodo),
  } as const

  if (nodo.detall) {
    const esActual = actualId === nodo.menuId
    return (
      <li role="none">
        <Link
          {...comunes}
          to={nodo.paginaRuta ?? "/"}
          aria-current={esActual ? "page" : undefined}
          onClick={props.alNavegar}
          className={cn(
            claseOpcion,
            "pl-8",
            // Barra decorativa (ámbar) que marca la opción actual sin mover el texto.
            esActual &&
              "relative bg-accent font-medium text-accent-foreground before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:bg-ambar"
          )}
        >
          {nodo.descri}
        </Link>
      </li>
    )
  }

  const abierto = expandidos.has(nodo.menuId)
  const idGrupo = `${idArbol}-grupo-${nodo.menuId}`
  return (
    <li role="none">
      <span
        {...comunes}
        aria-expanded={abierto}
        aria-owns={abierto ? idGrupo : undefined}
        // Con aria-owns el nombre calculado incluiría el texto de los hijos.
        aria-label={nodo.descri}
        onClick={() => props.alternar(nodo.menuId)}
        className={claseOpcion}
      >
        <ChevronRightIcon
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 transition-transform",
            abierto && "rotate-90"
          )}
        />
        {nodo.descri}
      </span>
      {abierto && (
        <ul id={idGrupo} role="group" className="ml-4 border-l pl-1">
          {nodo.hijos.map((hijo) => (
            <NodoMenu key={hijo.menuId} {...props} nodo={hijo} />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * Árbol de navegación (patrón WAI-ARIA Navigation Treeview) con roving
 * tabindex. Respeta el orden en que el back-end entrega los nodos.
 */
export function ArbolMenu({
  nodos,
  alNavegar,
}: {
  nodos: MenuNodoDTO[]
  alNavegar?: () => void
}) {
  const idArbol = useId()
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const elementos = useRef(new Map<number, HTMLElement>())

  const actual = paginaActual(nodos, pathname)
  const actualId = actual?.menuId ?? null

  // Al llegar otro árbol o cambiar de página se abren los grupos de la
  // página actual (ajuste de estado durante el render, sin efectos).
  const [origen, setOrigen] = useState({ nodos, actualId })
  const [expandidos, setExpandidos] = useState(
    () => new Set(actualId === null ? [] : ancestrosDe(nodos, actualId))
  )
  const [enfocado, setEnfocado] = useState<number | null>(null)
  if (origen.nodos !== nodos || origen.actualId !== actualId) {
    setOrigen({ nodos, actualId })
    setExpandidos((previos) => {
      const base = origen.nodos === nodos ? previos : new Set<number>()
      return actualId === null
        ? base
        : new Set([...base, ...ancestrosDe(nodos, actualId)])
    })
  }

  const visibles = aplanarVisibles(nodos, expandidos)
  const esVisible = (menuId: number | null) =>
    visibles.some(({ nodo }) => nodo.menuId === menuId)
  // Un único elemento entra en el orden de tabulación.
  const tabulable = esVisible(enfocado)
    ? enfocado
    : esVisible(actualId)
      ? actualId
      : (visibles[0]?.nodo.menuId ?? null)

  const registrar = (menuId: number, elemento: HTMLElement | null) => {
    if (elemento) {
      elementos.current.set(menuId, elemento)
    } else {
      elementos.current.delete(menuId)
    }
  }

  const alternar = (menuId: number) => {
    setEnfocado(menuId)
    setExpandidos((previos) => {
      const siguientes = new Set(previos)
      if (!siguientes.delete(menuId)) {
        siguientes.add(menuId)
      }
      return siguientes
    })
  }

  const mover = (item: ItemVisible | undefined) => {
    if (item) {
      setEnfocado(item.nodo.menuId)
      elementos.current.get(item.nodo.menuId)?.focus()
    }
  }

  const alTeclear = (evento: KeyboardEvent<HTMLElement>, nodo: MenuNodoDTO) => {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) {
      return
    }
    const indice = visibles.findIndex((v) => v.nodo.menuId === nodo.menuId)
    const item = visibles[indice]
    const abierto = !nodo.detall && expandidos.has(nodo.menuId)

    switch (evento.key) {
      case "ArrowDown":
        mover(visibles[indice + 1])
        break
      case "ArrowUp":
        mover(visibles[indice - 1])
        break
      case "Home":
        mover(visibles[0])
        break
      case "End":
        mover(visibles.at(-1))
        break
      case "ArrowRight":
        if (!nodo.detall) {
          if (abierto) {
            mover(visibles[indice + 1])
          } else {
            alternar(nodo.menuId)
          }
        }
        break
      case "ArrowLeft":
        if (abierto) {
          alternar(nodo.menuId)
        } else {
          mover(visibles.find((v) => v.nodo.menuId === item?.padreId))
        }
        break
      case "Enter":
        // En una página, Enter activa el enlace de forma nativa.
        if (nodo.detall) {
          return
        }
        alternar(nodo.menuId)
        break
      case " ":
        if (nodo.detall) {
          void navegar(nodo.paginaRuta ?? "/")
          alNavegar?.()
        } else {
          alternar(nodo.menuId)
        }
        break
      default:
        return
    }
    evento.preventDefault()
  }

  return (
    <ul
      role="tree"
      aria-label="Menú principal"
      className="flex flex-col gap-0.5"
    >
      {nodos.map((nodo) => (
        <NodoMenu
          key={nodo.menuId}
          nodo={nodo}
          idArbol={idArbol}
          expandidos={expandidos}
          tabulable={tabulable}
          actualId={actualId}
          registrar={registrar}
          alternar={alternar}
          alEnfocar={setEnfocado}
          alTeclear={alTeclear}
          alNavegar={alNavegar}
        />
      ))}
    </ul>
  )
}
