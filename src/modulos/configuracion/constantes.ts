// Recurso de permisos de los mantenimientos de configuración
// (SucursalControlador#RECURSO).
export const RECURSO_CONFIGURACION = "configuracion-crud"

export const RUTA_SUCURSALES = "/configuracion/sucursales"
export const RUTA_NUEVA_SUCURSAL = `${RUTA_SUCURSALES}/nueva`

export const rutaSucursal = (sucursalId: number) =>
  `${RUTA_SUCURSALES}/${sucursalId}`

export const RUTA_PRECIOS = "/configuracion/precios"
export const RUTA_NUEVO_PRECIO = `${RUTA_PRECIOS}/nuevo`

export const rutaPrecio = (precioId: number) => `${RUTA_PRECIOS}/${precioId}`
