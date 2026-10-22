# SOEM Front-end

Actúa como un Arquitecto de Software Senior experto en desarrollo front-end
empresarial con React y TypeScript.

Front-end del ERP SOEM (caja, contabilidad, cuentas por cobrar, cuentas por
pagar, egresos, ingresos, inventario, parámetros y seguridad). Es una SPA
independiente que consume la API REST del back-end ubicado en `../soem`.

## RELACIÓN CON EL BACK-END

- `../soem` es la **fuente de verdad** de endpoints, DTO, validaciones, permisos
  y reglas de negocio. Es de **solo lectura** desde este proyecto: nunca
  modifiques sus archivos. Si hace falta un cambio en la API, descríbelo
  (endpoint, DTO, motivo) y pide confirmación.
- Antes de crear o modificar un servicio, esquema o formulario, lee el código
  correspondiente en el back-end; no asumas la forma de la API.
  - Controladores: `../soem/src/main/java/com/saolan/soem/<modulo>/controlador`
  - DTO: `../soem/src/main/java/com/saolan/soem/<modulo>/dto`
  - Contrato común: `../soem/src/main/java/com/saolan/soem/compartido/dto`
    (`RespuestaApi`, `Paginacion`, `ErrorCampo`, `ComboDTO`)
  - Seguridad: `../soem/src/main/java/com/saolan/soem/compartido/seguridad`
    y `../soem/src/main/java/com/saolan/soem/seguridad`
  - Esquema de BD: `../soem/db/soem-postgres-4.sql`
- Los nombres de campos del front deben ser **idénticos** a los del DTO
  (`descri`, `apelli`, `cedulaRuc`, `razonSoci`, `fechaNaci`...). No los
  traduzcas, abrevies ni "embellezcas": la etiqueta visible puede ser legible,
  el nombre del campo no.

## FRONTEND - ENTORNO

- React + **TypeScript** (modo `strict`) + Vite.
- Tailwind CSS v4 + shadcn/ui (componentes copiados al repositorio, basados en
  Base UI: paquete `@base-ui/react`, estilo `base-nova`) + lucide-react para
  iconos.
  - La composición se hace con la prop `render` de Base UI, no con `asChild`
    (es de Radix): adapta los ejemplos de Radix al copiarlos.
  - No instales paquetes `@radix-ui/*` ni `radix-ui`, ni cambies el `style` de
    `components.json`.
  - `sonner.tsx` de shadcn importa `next-themes`: se adapta a `useTheme` de
    `compartido/componentes/theme-provider.tsx`; no instales `next-themes`.
  - `Menu.RadioItem` de Base UI no cierra el menú por defecto: usa
    `closeOnClick` en selectores de opción única.
  - Los componentes de shadcn importan `cn` del paquete `cn` (oficial de
    shadcn, reemplaza a clsx + tailwind-merge); el código propio lo importa
    desde `@/compartido/utilidades/cn`, que lo reexporta.
- React Router (paquete `react-router`).
- TanStack Query (`@tanstack/react-query`) para el estado de servidor.
- TanStack Table (`@tanstack/react-table`) para listados y grillas.
- React Hook Form + Zod + `@hookform/resolvers` para formularios y validación.
- Buscadores y combos con búsqueda: `Combobox`/`Autocomplete` de Base UI
  (componentes de shadcn) cuando cubran el caso; `cmdk` (componente Command de
  shadcn) para paletas de búsqueda y comandos. Para cantidades, `NumberField`
  de Base UI.
- `fetch` nativo encapsulado en un cliente HTTP propio (`clienteHttp`); no usar
  axios ni otros clientes HTTP.
- Context API **solo** para la sesión (access token en memoria, usuario,
  sucursal y permisos) y el tema claro/oscuro (`ThemeProvider`). Prohibido usar Context o estado local para cachear datos
  del servidor: eso es responsabilidad de TanStack Query.
- Testing: Vitest + jsdom, Testing Library (`react`, `user-event`), Playwright
  para pruebas de extremo a extremo.
- Calidad: ESLint (`typescript-eslint`, `eslint-plugin-react-hooks`) + Prettier.
- Nginx como servidor web de la SPA y reverse proxy de `/api` hacia WildFly.
- Base generada por `shadcn init` (permitida, no eliminar): `@base-ui/react`,
  `cn`, `class-variance-authority`, `shadcn` (lo importa `src/index.css`),
  `tw-animate-css`, `@fontsource-variable/geist`, `@tailwindcss/vite`; de
  desarrollo: `prettier-plugin-tailwindcss`, `eslint-plugin-react-refresh`,
  `globals`, `@types/node`.
- No agregues librerías fuera de esta lista sin justificación técnica y
  confirmación previa. Para importes y fechas usa `Intl.NumberFormat`,
  `Intl.DateTimeFormat` e `<input type="date">`; no agregues librerías de
  fechas ni de números.

## CONVENCIÓN DE IDIOMA

- Igual que el back-end: nombres de dominio, componentes, hooks, funciones y
  variables en **español** (`PaginaUsuarios`, `FormularioSucursal`,
  `useBuscarRoles`, `clienteHttp`).
- Prefijos y sufijos técnicos en inglés cuando son convención del ecosistema:
  `use...` en hooks y `...DTO` en tipos que reflejan un DTO del back-end. Los
  esquemas Zod se nombran en español (`esquemaUsuario`).
- Comentarios, textos de la interfaz y mensajes de error en español.

## ESTRUCTURA DEL PROYECTO

Organización por módulo, espejo de los módulos del back-end
(`seguridad`, `configuracion`, `caja`, `contabilidad`, `cuentasporcobrar`,
`cuentasporpagar`, `egreso`, `ingreso`, `inventario`):

```text
src/
  app/                      # arranque, proveedores, router raíz, layout
  compartido/
    api/                    # clienteHttp, esquema RespuestaApi, utilidades de paginación
    componentes/
      ui/                   # componentes generados por shadcn (no editar a mano salvo ajuste de tema)
      ...                   # componentes propios reutilizables (TablaPaginada, CampoFormulario, DialogoConfirmacion, Combo...)
    hooks/                  # hooks transversales (incluidos los que genere shadcn)
    sesion/                 # contexto de sesión, guardas de ruta y de permiso
    utilidades/             # cn, formato de importes y fechas, etc.
  modulos/
    <modulo>/
      api/                  # funciones que llaman a clienteHttp + hooks de TanStack Query
      esquemas/             # esquemas Zod (tipos derivados con z.infer)
      componentes/
      paginas/
      rutas.tsx             # rutas del módulo (con lazy loading)
```

- `src/main.tsx` es el punto de entrada (lo referencia `index.html`). `App`
  se mueve a `src/app/` al crear el router.
- Los tipos de los DTO se derivan de los esquemas Zod (`z.infer`); no declares
  interfaces duplicadas a mano.
- `compartido` nunca importa de `modulos`. Por eso `compartido/sesion/`
  contiene los esquemas de sesión (`LoginRespuestaDTO`, `UsuarioDTO`) y la
  llamada a `/auth/refresh`; el resto de `/auth/*` y sus páginas viven en
  `modulos/seguridad`.
- Piezas existentes a reutilizar: `clienteHttp` y `ErrorApi`
  (`compartido/api`), `aplicarErroresFormulario`, `CampoFormulario`,
  `AvisoError`, `CargandoPagina`, `LimiteErrores`, `useSesion`,
  `useTienePermiso`, `RutaProtegida`/`RutaPublica`
  (`compartido/sesion/GuardasRuta.tsx`).
- Los archivos generados por shadcn (`compartido/componentes/ui/*` y
  `compartido/componentes/theme-provider.tsx`) conservan sus nombres en
  inglés (`Button`, `ThemeProvider`, `useTheme`); el código propio sigue la
  convención en español.
- shadcn/ui se adapta a esta estructura mediante los alias de `components.json`.
  Se configuran justo después de `npx shadcn@latest init` y antes del primer
  `npx shadcn@latest add`; requieren el alias `@/*` → `src/*` en `tsconfig.json`
  y `vite.config.ts`. No cambies estos alias:

```json
"aliases": {
  "components": "@/compartido/componentes",
  "ui": "@/compartido/componentes/ui",
  "lib": "@/compartido/utilidades",
  "utils": "@/compartido/utilidades/cn",
  "hooks": "@/compartido/hooks"
}
```

- Al copiar ejemplos de la documentación de shadcn (que importan desde
  `@/components/ui/...` y `@/lib/utils`), corrige los imports a estas rutas.
- Antes de crear componentes nuevos, revisa la estructura y los componentes
  existentes. Si la estructura aplicable aún no existe, propón primero la
  arquitectura y pide confirmación antes de una implementación extensa.

## CONTRATO DEL API

- Base: `/api/v1`. Recursos en plural y kebab-case (`/certificados-emisor`).
- Toda respuesta (éxito o error) viene envuelta en `RespuestaApi`:

```json
{
  "exito": true,
  "mensaje": "Operación realizada correctamente",
  "datos": {},
  "errores": [{ "campo": "descri", "detalle": "La descripción es obligatoria" }],
  "paginacion": { "pagina": 1, "tamanio": 20, "totalRegistros": 150, "totalPaginas": 8 }
}
```

- `paginacion` solo existe en listados paginados. Valida el envoltorio y los
  `datos` con Zod en `clienteHttp` o en la capa `api` del módulo.
- Patrón CRUD estándar por recurso:
  - `GET /recurso?pagina&tamanio&ordenarPor&direccion&<filtros>` → listado paginado
  - `GET /recurso/{id}`, `POST /recurso`, `PUT /recurso/{id}`, `DELETE /recurso/{id}`
    (DELETE es borrado lógico salvo indicación contraria)
  - `GET /recurso/combo` → `ComboDTO[] { valor, etiqueta }`, sin paginar, solo activos
  - Sub-recursos en bloque con `PUT` (ej. `PUT /roles/{id}/permisos`,
    `PUT /roles/{id}/sucursales`, `PUT /usuarios/{id}/roles`) y sub-recursos
    singulares (`GET|PUT|DELETE /sucursales/{id}/certificado-emision`)
- No todos los recursos exponen todas las operaciones (ej. `/permisos` no tiene
  DELETE): verifica en el controlador antes de mostrar la acción.
- Paginación:
  - `pagina` empieza en **1** en el API; TanStack Table usa `pageIndex` desde 0:
    convierte en un único lugar (utilidad compartida).
  - `tamanio` entre 1 y 200; `direccion` solo `asc` o `desc`.
  - `ordenarPor` solo con los campos que el repositorio del back-end permite.
  - Usa la tabla en modo servidor (`manualPagination`, `manualSorting`,
    `manualFiltering`, `pageCount = totalPaginas`).
  - Página, tamaño, orden y filtros viven en los parámetros de la URL
    (React Router), para que los listados se puedan recargar y compartir.
- Códigos HTTP que el front debe manejar:
  - `400` validación o regla de negocio → mostrar `errores` en cada campo
    (`setError(campo, { message: detalle })`) y `mensaje` como aviso general.
  - `401` no autenticado → flujo de refresh (ver SEGURIDAD).
  - `403` sin permiso → mensaje de acceso denegado; no reintentar.
  - `404` no encontrado; `409` conflicto (duplicados, registro en uso).
  - `500` → mostrar `mensaje` genérico; nunca detalles técnicos.
  - Un `401` emitido por el contenedor MP-JWT (token vencido o inválido) puede
    llegar **sin cuerpo JSON**: `clienteHttp` no debe asumir que todo error trae
    `RespuestaApi`.
- Tipos de datos:
  - El back-end serializa con JSON-B (Yasson), que **omite las propiedades
    `null`** (incluido `datos` del envoltorio). En Zod los campos opcionales
    son `.nullish()` (no `.nullable()`); `clienteHttp` trata un `datos`
    ausente como `null`.
  - Enums (ej. `Accion`) viajan en MAYÚSCULAS en JSON y en query params
    (`BUSCAR`, `CREAR`...). Un valor inválido en un query param produce `404`.
  - `LocalDate` viaja como `"YYYY-MM-DD"` (compatible directo con
    `<input type="date">`); `OffsetDateTime` como ISO-8601 con zona.
  - Importes y cantidades (`BigDecimal`): el front **nunca** hace aritmética
    con ellos (subtotales, impuestos, descuentos y totales los calcula el
    back-end; el front envía la línea y recibe el documento recalculado). Se
    tratan como string decimal y se muestran con `Intl.NumberFormat`. Si un
    endpoint los devuelve como `number` JSON, no los conviertas ni operes:
    señálalo como cambio pendiente en el back-end.
  - Archivos referenciados por ruta (certificado de firma `ruta`, logotipo
    `logoti`) son strings; no hay subida de archivos salvo que el back-end
    exponga un endpoint para ello.

## SEGURIDAD

- Autenticación con MicroProfile JWT del back-end:
  - `POST /auth/login` `{ usuario, clave, sucursalId? }` → `LoginRespuestaDTO`
    (`accessToken`, `expiraEnSegundos`, `sucursalId`, `sucursales`
    (`ComboDTO[]` accesibles), `usuario`, `permisos`, `claveCaducada`) +
    cookie `refreshToken`. El login del front no pide sucursal: el back-end
    asigna una por defecto y se cambia desde la cabecera.
  - `POST /auth/refresh` → mismo `LoginRespuestaDTO` + rotación de la cookie;
    al recargar repone toda la sesión (no hace falta `/auth/me`).
  - `POST /auth/cambiar-sucursal` `{ sucursalId }` → requiere access token y
    cookie, rota el refresh y devuelve `LoginRespuestaDTO`; `400` si la clave
    está caducada.
  - `POST /auth/logout` → revoca el refresh token y borra la cookie.
  - `GET /auth/me` → sesión actual; `POST /auth/cambiar-clave`
    `{ claveActual, claveNueva }` → `LoginRespuestaDTO`, o `datos: null` si no
    llegó la cookie (la sesión queda cerrada y hay que volver al login).
- El access token (15 min) se guarda **solo en memoria** (contexto de sesión) y
  se envía como `Authorization: Bearer <token>`.
- El refresh token (7 días) vive en una cookie `HttpOnly`, `Secure`,
  `SameSite=Strict`, `path=/api/v1/auth`. El front no puede ni debe leerlo.
  Las llamadas a `/auth/*` se hacen con `credentials: 'include'`.
- Prohibido guardar tokens en `localStorage`, `sessionStorage`, IndexedDB,
  cookies accesibles por JS o en la URL. Prohibido registrarlos en consola.
- `clienteHttp`:
  - Ante un `401`, ejecuta **un único refresh concurrente** (single-flight):
    las peticiones que fallen mientras tanto esperan ese mismo refresh y luego
    se reintentan una sola vez. El refresh token rota en cada uso, por lo que
    dos refresh simultáneos invalidan la sesión.
  - No intenta refresh ante un `401` de `/auth/login`, `/auth/refresh` ni
    `/auth/logout` (credenciales inválidas llegan como `401` **con**
    `RespuestaApi`); sí en `/auth/me`, `/cambiar-clave` y `/cambiar-sucursal`,
    que usan el access token.
  - Si el refresh falla, limpia la sesión, el caché de TanStack Query y
    redirige a login conservando la ruta de retorno.
  - No envíes encabezados fuera de `Authorization`, `Content-Type` y `Accept`
    (son los únicos permitidos por CORS).
- Al iniciar la aplicación (o recargar la página) se llama a `/auth/refresh`
  para recuperar la sesión, ya que el access token en memoria se pierde.
- Si `claveCaducada` es `true`, se fuerza la pantalla de cambio de clave antes
  de permitir cualquier otra navegación.
- Permisos:
  - Vienen en el login y en `/auth/me` como `"recurso:accion"` en minúsculas
    (ej. `usuarios:buscar`, `sucursales:modificar`). Acciones posibles:
    `buscar`, `crear`, `modificar`, `eliminar`, `anular`, `desprocesar`,
    `convertir`, `imprimir`.
  - Protege rutas, menús y acciones (botones Nuevo, Editar, Eliminar...) con
    estos permisos mediante un componente o hook único (ej. `useTienePermiso`).
  - Ocultar en el front es solo experiencia de usuario: la autorización real
    la aplica el back-end.
- Menús dinámicos: se generan a partir de una definición de menú del front
  filtrada por los permisos del usuario, mientras el back-end no exponga un
  endpoint de menús.
- Documentos PDF (facturas, reportes): se descargan con `clienteHttp` como
  `Blob` y se muestran en `<iframe>` con `URL.createObjectURL` (liberar con
  `revokeObjectURL`). Nunca pongas el token en la URL del iframe.
- Prohibido `dangerouslySetInnerHTML`, `eval` y construir HTML con strings.
- Nunca muestres contraseñas, hashes ni tokens; los campos de clave usan
  `type="password"` y `autoComplete` adecuado.
- Entornos:
  - La URL base del API es **siempre relativa**: `/api/v1`. El back-end se
    despliega como `soem.war` (context root `/soem`) y el proxy reescribe
    `/api` → `/soem/api`.
  - El back-end emite la cookie del refresh con
    `path=<contextPath>/api/v1/auth` (`/soem/api/v1/auth`,
    `../soem/.../seguridad/controlador/AuthControlador.java` `rutaCookie()`).
    Como el navegador llama a `/api/v1/auth`, el proxy **debe reescribir el
    path de la cookie**; si no, la cookie no se envía y el refresh falla.
  - Desarrollo: `server.proxy` de Vite (ya configurado en `vite.config.ts`),
    con `cookiePathRewrite: { "/soem/api/v1/auth": "/api/v1/auth" }` (la clave
    se compara con el path completo, no es un prefijo). El destino se define
    con `SOEM_API_DESTINO` en `.env.local` (por defecto
    `http://localhost:8080`), sin prefijo `VITE_`. No hace falta Nginx en
    desarrollo. La cookie es `Secure`: abre la app en `http://localhost`
    (no por IP ni otro host en http).
  - Producción: Nginx sirve la SPA con fallback a `index.html` para las rutas
    del cliente y hace reverse proxy en el mismo dominio:
    `location /api/ { proxy_pass http://<wildfly>:8080/soem/api/; proxy_cookie_path /soem/api/ /api/; }`.
  - Nunca coloques secretos ni la URL del back-end en variables `VITE_*` (se
    incrustan en el bundle).

## FRONTEND - ESTÁNDARES

Generar interfaces:

- Modernas y mantenibles.
- Responsive obligatorio para desktop, laptop, tablet y móvil usando los
  breakpoints de Tailwind (`sm`, `md`, `lg`, `xl`). Los listados con muchas
  columnas deben tener una presentación usable en móvil (scroll horizontal
  controlado dentro de la tabla o vista de tarjetas), nunca scroll horizontal
  de toda la página.
- Cumplir WCAG 2.2 nivel AA, como mínimo:
  - Labels asociados a todos los controles de formulario (`FormLabel` de shadcn).
  - HTML semántico (`nav`, `main`, `header`, `button`, `table`) en lugar de
    `div` genéricos.
  - Contraste mínimo 4.5:1 para texto.
  - Navegación completa por teclado: Tab, Shift+Tab, Enter, Space, Escape y
    flechas en componentes compuestos (menús, tabs, tablas, Command).
  - Indicador de foco siempre visible.
  - Prohibidos los atajos de teclado de una sola tecla sin modificador
    (WCAG 2.1.4); usa combinaciones con Ctrl/Alt o atajos configurables.
  - Mensajes de error claros y asociados al campo (`aria-describedby`,
    `FormMessage`).
  - Notificaciones de operaciones asíncronas anunciadas mediante regiones
    `aria-live` (toasts de `sonner`).
  - Atributos ARIA solo cuando sean necesarios; no anular la accesibilidad que
    ya aportan los componentes Base UI de shadcn.
  - Compatibilidad con lectores de pantalla.
- Estilos con Tailwind CSS v4 y shadcn/ui:
  - Design tokens (colores corporativos, tipografía, espaciados, radios)
    definidos en CSS con `@theme` y las variables CSS del tema de shadcn
    (`--primary`, `--background`...), con modo claro y oscuro. No uses
    `tailwind.config.js` para el tema.
  - Prohibido usar valores arbitrarios (ej. `p-[13px]`, `text-[#123456]`); usa
    únicamente la escala del tema. Excepción: los componentes generados por
    shadcn en `compartido/componentes/ui`, que se mantienen como los genera el
    CLI.
  - Usa primero los componentes de shadcn (`src/compartido/componentes/ui`,
    configurado en los alias de `components.json`; no cambies esos alias). Todo patrón
    visual repetido debe extraerse a un componente propio reutilizable en
    `compartido/componentes` (ej. `TablaPaginada`, `CampoFormulario`,
    `DialogoConfirmacion`, `ComboBuscador`); nunca dupliques cadenas largas de
    clases entre archivos. Combina clases con la utilidad `cn`.
- Estado:
  - Estado de servidor solo con TanStack Query: `queryKey` jerárquicas por
    recurso (`['usuarios', 'lista', filtros]`, `['usuarios', 'detalle', id]`),
    invalidación tras cada mutación y `placeholderData` para mantener la página
    anterior al paginar.
  - Context API solo para la sesión y el tema (`ThemeProvider`). La
    preferencia de tema puede guardarse en `localStorage` porque no es un dato
    sensible; los tokens, nunca.
  - Estado de UI local con `useState`/`useReducer`.
- Formularios:
  - React Hook Form + Zod; los esquemas replican las reglas de Bean Validation
    del DTO (obligatorios, longitudes `@Size`, `@Email`, `@Pattern`, rangos).
  - La validación definitiva siempre la realiza el back-end; los `errores`
    devueltos se reflejan en sus campos.
  - Formularios de alta y edición pueden usar DTO distintos
    (ej. `UsuarioCreacionDTO` vs `UsuarioDTO`): respeta el DTO de cada endpoint.
  - Los combos de selección consumen `/recurso/combo`; usa `Combobox` de Base
    UI cuando la lista requiera búsqueda.
  - Deshabilita el envío mientras la mutación está en curso para evitar
    duplicados.
- Grillas editables (detalle de documentos): TanStack Table con celdas
  editables y navegación por teclado tipo hoja de cálculo; los totales se
  muestran tal como los devuelve el back-end.
- Manejo visual consistente de carga (skeletons), errores y estados vacíos en
  toda operación asíncrona.
- Confirmación explícita (`AlertDialog`) antes de eliminar, anular o
  desprocesar.
- Error boundaries para capturar errores de renderizado sin tumbar la
  aplicación (`errorElement` de React Router por ruta y un boundary global).
- Lazy loading de rutas con `React.lazy` y `Suspense` (o `lazy` de React Router),
  una división por módulo.
- Protección de rutas por autenticación y permisos.
- Componentes con responsabilidad única (SRP); la lógica de acceso a datos va
  en hooks de la capa `api`, nunca dentro de los componentes de presentación.
- Código TypeScript sin `any`; usa `unknown` y valida con Zod en los bordes.

## TESTING

- Unitarias y de componentes con Vitest + Testing Library: esquemas Zod,
  `clienteHttp` (refresh single-flight, errores sin cuerpo), utilidades de
  paginación y formato, formularios (errores del back-end en cada campo).
- Interacción con `@testing-library/user-event` (incluida la navegación por
  teclado de grillas y combos).
- Playwright para los flujos críticos de extremo a extremo (login, refresh,
  CRUD de mantenimiento, facturar y cobrar).
- Consulta por roles y labels accesibles (`getByRole`, `getByLabelText`), no
  por clases CSS.
- `npm run test` ejecuta `vitest run` (jsdom, archivos `*.test.ts(x)` junto al
  código). Sin globals: importa `describe/it/expect/vi` de `vitest` y llama a
  `cleanup()` en `afterEach`. No hay jest-dom: usa aserciones de Vitest.

## FORMA DE RESPONDER

- Explica brevemente la solución antes de generar código completo y funcional;
  no omitas imports ni uses pseudocódigo.
- Señala las decisiones de diseño tomadas y las alternativas descartadas.
- Pregunta antes de asumir reglas de negocio no especificadas.
- No modifiques archivos o módulos ajenos a la solicitud.
- Si detectas una incoherencia entre el front y el contrato del back-end,
  repórtala con la referencia al archivo del back-end (`ruta:línea`).

## VERIFICACIÓN ANTES DE FINALIZAR

1. Revisa los archivos modificados.
2. Confirma que los nombres de campos y tipos coinciden con los DTO de `../soem`.
3. Ejecuta `npm run typecheck`, `npm run lint`, `npm run test` y
   `npm run build`.
4. Confirma que no se guardan tokens fuera de memoria ni se exponen en URLs o
   logs, y que no se usó `dangerouslySetInnerHTML`.
5. Confirma que no se agregaron librerías fuera de la lista aprobada.
6. Informa los archivos modificados, las pruebas ejecutadas y cualquier
   validación que no se haya podido completar.
