import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/compartido/utilidades/cn"

/**
 * Logotipo provisional de SOEM: insignia con el color primario del tema y el
 * nombre del sistema. Para usar el logo oficial basta con cambiar este
 * componente y `public/favicon.svg` (mismo dibujo, con colores fijos).
 */
const variantesLogo = cva("flex items-center", {
  variants: {
    variante: {
      // Login y cambio de clave: insignia grande junto al nombre.
      destacada: "gap-3",
      // Cabecera y menú móvil.
      horizontal: "gap-2",
    },
  },
  defaultVariants: { variante: "horizontal" },
})

const variantesInsignia = cva(
  "flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
  {
    variants: {
      variante: {
        destacada: "size-12 rounded-xl shadow-md ring-4 ring-primary/15",
        horizontal: "size-7 rounded-lg",
      },
    },
    defaultVariants: { variante: "horizontal" },
  }
)

const variantesIcono = cva("", {
  variants: {
    variante: { destacada: "size-7", horizontal: "size-4" },
  },
  defaultVariants: { variante: "horizontal" },
})

const variantesNombre = cva("font-heading font-bold text-primary", {
  variants: {
    variante: {
      destacada: "text-3xl tracking-widest",
      horizontal: "text-lg tracking-wide",
    },
  },
  defaultVariants: { variante: "horizontal" },
})

type PropsLogoSoem = VariantProps<typeof variantesLogo> & {
  className?: string
}

// Raíz `span`: puede ir dentro de un encabezado (ej. título del menú móvil).
export function LogoSoem({ variante, className }: PropsLogoSoem) {
  return (
    <span className={cn(variantesLogo({ variante }), className)}>
      <span className={variantesInsignia({ variante })}>
        {/* Módulos apilados: el ERP integra caja, contabilidad, inventario… */}
        <svg
          viewBox="0 0 24 24"
          className={variantesIcono({ variante })}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
          <path d="m3 12 9 4.5 9-4.5" />
          <path d="m3 16.5 9 4.5 9-4.5" />
        </svg>
      </span>
      <span className={variantesNombre({ variante })}>SOEM</span>
    </span>
  )
}
