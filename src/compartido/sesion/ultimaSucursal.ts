// Última sucursal elegida en este navegador, para preseleccionarla en el
// selector. Solo se guarda el id (no es sensible): nunca tokens ni datos de
// la sesión. El usuario siempre confirma la sucursal.
const CLAVE = "soem.ultima-sucursal"

export function leerUltimaSucursal(): number | null {
  try {
    const valor = Number(localStorage.getItem(CLAVE))
    return Number.isInteger(valor) && valor > 0 ? valor : null
  } catch {
    // Almacenamiento bloqueado (modo privado estricto): sin preselección.
    return null
  }
}

export function guardarUltimaSucursal(sucursalId: number) {
  try {
    localStorage.setItem(CLAVE, String(sucursalId))
  } catch {
    // Sin almacenamiento disponible la preselección es solo una ayuda.
  }
}
