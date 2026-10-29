import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { z } from "zod"

import { clienteHttp, type RespuestaHttp } from "@/compartido/api/clienteHttp"
import { ErrorApi } from "@/compartido/api/errores"
import { esquemaComboDTO } from "@/compartido/api/esquemas"
import type { OrdenListado } from "@/compartido/hooks/useParametrosListado"
import {
  aCuerpoCertificado,
  esquemaSucuCertEmisDTO,
  type CertificadoValidado,
} from "@/modulos/configuracion/esquemas/certificadoSucursal"
import {
  aCuerpoSucursal,
  esquemaSucursalDTO,
  type CampoOrdenSucursal,
  type FiltroSucursal,
  type SucursalDTO,
  type SucursalFormulario,
} from "@/modulos/configuracion/esquemas/sucursal"

export interface ParametrosSucursales {
  pagina: number
  tamanio: number
  orden: OrdenListado<CampoOrdenSucursal>
  filtros: Partial<Record<FiltroSucursal, string>>
}

export const clavesSucursales = {
  todas: ["sucursales"] as const,
  lista: (parametros: ParametrosSucursales) =>
    ["sucursales", "lista", parametros] as const,
  detalle: (id: number) => ["sucursales", "detalle", id] as const,
  certificado: (id: number) => ["sucursales", "certificado", id] as const,
}

/**
 * Tras crear o modificar: el detalle se toma de la respuesta (evita un GET) y
 * el resto del recurso se invalida, porque marcar una matriz desmarca la
 * anterior. La invalidación no se espera: así el formulario se libera en
 * cuanto responde el guardado.
 */
function actualizarCacheSucursal(
  queryClient: QueryClient,
  respuesta: RespuestaHttp<SucursalDTO>
) {
  const { sucursalId } = respuesta.datos
  queryClient.setQueryData(clavesSucursales.detalle(sucursalId), respuesta)
  void queryClient.invalidateQueries({
    queryKey: clavesSucursales.todas,
    // El certificado es un sub-recurso que el PUT de la sucursal no toca.
    predicate: ({ queryKey }) =>
      queryKey[1] !== "certificado" &&
      !(queryKey[1] === "detalle" && queryKey[2] === sucursalId),
  })
}

export function buscarSucursales({
  pagina,
  tamanio,
  orden,
  filtros,
}: ParametrosSucursales) {
  return clienteHttp("/sucursales", {
    esquema: z.array(esquemaSucursalDTO),
    parametros: { pagina, tamanio, ...orden, ...filtros },
  })
}

export function useSucursales(parametros: ParametrosSucursales) {
  return useQuery({
    queryKey: clavesSucursales.lista(parametros),
    queryFn: () => buscarSucursales(parametros),
    placeholderData: keepPreviousData,
  })
}

export function useSucursal(id: number | null) {
  return useQuery({
    queryKey: clavesSucursales.detalle(id ?? 0),
    queryFn: () =>
      clienteHttp(`/sucursales/${id}`, { esquema: esquemaSucursalDTO }),
    select: (respuesta) => respuesta.datos,
    enabled: id !== null,
  })
}

export function useCrearSucursal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: SucursalFormulario) =>
      clienteHttp("/sucursales", {
        metodo: "POST",
        cuerpo: aCuerpoSucursal(valores),
        esquema: esquemaSucursalDTO,
      }),
    onSuccess: (respuesta) => actualizarCacheSucursal(queryClient, respuesta),
  })
}

export function useModificarSucursal(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: SucursalFormulario) =>
      clienteHttp(`/sucursales/${id}`, {
        metodo: "PUT",
        cuerpo: aCuerpoSucursal(valores),
        esquema: esquemaSucursalDTO,
      }),
    onSuccess: (respuesta) => actualizarCacheSucursal(queryClient, respuesta),
  })
}

/** Borrado lógico: el back-end deja la sucursal con `estado = false`. */
export function useEliminarSucursal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      clienteHttp(`/sucursales/${id}`, { metodo: "DELETE", esquema: z.null() }),
    // Sin esperar la recarga del listado: el diálogo se cierra al responder.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesSucursales.todas })
    },
  })
}

/** Certificado de firma de la sucursal; `null` si aún no tiene (404). */
export function useCertificadoSucursal(id: number) {
  return useQuery({
    queryKey: clavesSucursales.certificado(id),
    queryFn: async () => {
      try {
        const { datos } = await clienteHttp(
          `/sucursales/${id}/certificado-emision`,
          { esquema: esquemaSucuCertEmisDTO }
        )
        return datos
      } catch (error) {
        if (error instanceof ErrorApi && error.estado === 404) {
          return null
        }
        throw error
      }
    },
  })
}

export function useGuardarCertificado(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: CertificadoValidado) =>
      clienteHttp(`/sucursales/${id}/certificado-emision`, {
        metodo: "PUT",
        cuerpo: aCuerpoCertificado(valores),
        esquema: esquemaSucuCertEmisDTO,
      }),
    // La respuesta ya es el certificado guardado: no hace falta otro GET.
    onSuccess: ({ datos }) =>
      queryClient.setQueryData(clavesSucursales.certificado(id), datos),
  })
}

export function useEliminarCertificado(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      clienteHttp(`/sucursales/${id}/certificado-emision`, {
        metodo: "DELETE",
        esquema: z.null(),
      }),
    onSuccess: () =>
      queryClient.setQueryData(clavesSucursales.certificado(id), null),
  })
}

/** Emisores de certificados activos (GET /certificados-emisor/combo). */
export function useComboCertificadosEmisor() {
  return useQuery({
    queryKey: ["certificados-emisor", "combo"],
    queryFn: () =>
      clienteHttp("/certificados-emisor/combo", {
        esquema: z.array(esquemaComboDTO),
      }),
    select: (respuesta) => respuesta.datos,
  })
}
