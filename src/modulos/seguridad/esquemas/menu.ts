import { z } from "zod"

// Espejo de MenuNodoDTO (../soem/.../seguridad/dto/MenuNodoDTO.java). Los
// grupos no traen paginaRuta: JSON-B omite las propiedades null.
export const esquemaMenuNodoDTO = z.object({
  menuId: z.number().int(),
  descri: z.string(),
  paginaRuta: z.string().nullish(),
  detall: z.boolean(),
  estado: z.boolean(),
  get hijos(): z.ZodArray<typeof esquemaMenuNodoDTO> {
    return z.array(esquemaMenuNodoDTO)
  },
})

export type MenuNodoDTO = z.infer<typeof esquemaMenuNodoDTO>
