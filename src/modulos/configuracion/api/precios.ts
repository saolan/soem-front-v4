import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { z } from "zod"

import { clienteHttp, type RespuestaHttp } from "@/compartido/api/clienteHttp"
import type { OrdenListado } from "@/compartido/hooks/useParametrosListado"
import {
  aCuerpoPrecio,
  esquemaPrecioDTO,
  type CampoOrdenPrecio,
  type FiltroPrecio,
  type PrecioDTO,
  type PrecioFormulario,
} from "@/modulos/configuracion/esquemas/precio"

export interface ParametrosPrecios {
  pagina: number
  tamanio: number
  orden: OrdenListado<CampoOrdenPrecio>
  filtros: Partial<Record<FiltroPrecio, string>>
}

export const clavesPrecios = {
  todos: ["precios"] as const,
  lista: (parametros: ParametrosPrecios) =>
    ["precios", "lista", parametros] as const,
  detalle: (id: number) => ["precios", "detalle", id] as const,
}

/**
 * Tras crear o modificar: el detalle se toma de la respuesta (evita un GET) y
 * el resto del recurso (listados, combo) se invalida sin esperar, para liberar
 * el formulario en cuanto responde el guardado.
 */
function actualizarCachePrecio(
  queryClient: QueryClient,
  respuesta: RespuestaHttp<PrecioDTO>
) {
  const { precioId } = respuesta.datos
  queryClient.setQueryData(clavesPrecios.detalle(precioId), respuesta)
  void queryClient.invalidateQueries({
    queryKey: clavesPrecios.todos,
    predicate: ({ queryKey }) =>
      !(queryKey[1] === "detalle" && queryKey[2] === precioId),
  })
}

export function buscarPrecios({
  pagina,
  tamanio,
  orden,
  filtros,
}: ParametrosPrecios) {
  return clienteHttp("/precios", {
    esquema: z.array(esquemaPrecioDTO),
    parametros: { pagina, tamanio, ...orden, ...filtros },
  })
}

export function usePrecios(parametros: ParametrosPrecios) {
  return useQuery({
    queryKey: clavesPrecios.lista(parametros),
    queryFn: () => buscarPrecios(parametros),
    placeholderData: keepPreviousData,
  })
}

export function usePrecio(id: number | null) {
  return useQuery({
    queryKey: clavesPrecios.detalle(id ?? 0),
    queryFn: () => clienteHttp(`/precios/${id}`, { esquema: esquemaPrecioDTO }),
    select: (respuesta) => respuesta.datos,
    enabled: id !== null,
  })
}

export function useCrearPrecio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: PrecioFormulario) =>
      clienteHttp("/precios", {
        metodo: "POST",
        cuerpo: aCuerpoPrecio(valores),
        esquema: esquemaPrecioDTO,
      }),
    onSuccess: (respuesta) => actualizarCachePrecio(queryClient, respuesta),
  })
}

/** El PUT ignora `estado`: se cambia con DELETE o PUT /activar. */
export function useModificarPrecio(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: PrecioFormulario) =>
      clienteHttp(`/precios/${id}`, {
        metodo: "PUT",
        cuerpo: aCuerpoPrecio(valores),
        esquema: esquemaPrecioDTO,
      }),
    onSuccess: (respuesta) => actualizarCachePrecio(queryClient, respuesta),
  })
}

/**
 * Revierte el borrado lógico (PUT /precios/{id}/activar, mismo permiso que
 * eliminar): restablece el acceso de los roles a la lista (ROL_PREC). La respuesta es la lista
 * activa: actualiza el detalle sin otro GET.
 */
export function useActivarPrecio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      clienteHttp(`/precios/${id}/activar`, {
        metodo: "PUT",
        esquema: esquemaPrecioDTO,
      }),
    onSuccess: (respuesta) => actualizarCachePrecio(queryClient, respuesta),
  })
}

/**
 * Borrado lógico sin restricción: el back-end deja la lista con
 * `estado = false` y les quita a los roles el acceso a ella (ROL_PREC).
 */
export function useEliminarPrecio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      clienteHttp(`/precios/${id}`, { metodo: "DELETE", esquema: z.null() }),
    // El detalle se marca inactivo en caché en lugar de volver a pedirlo.
    onSuccess: (_respuesta, id) => {
      queryClient.setQueryData<RespuestaHttp<PrecioDTO>>(
        clavesPrecios.detalle(id),
        (previa) =>
          previa && { ...previa, datos: { ...previa.datos, estado: false } }
      )
      void queryClient.invalidateQueries({
        queryKey: clavesPrecios.todos,
        predicate: ({ queryKey }) =>
          !(queryKey[1] === "detalle" && queryKey[2] === id),
      })
    },
  })
}
