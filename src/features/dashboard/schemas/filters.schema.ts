import { z } from 'zod'

export const filtersSchema = z.object({
  provincia:  z.string().default(''),
  canton:     z.string().default(''),
  cultivo:    z.string().default(''),
  tipoEvento: z.string().default(''),
  anio:       z.string().default(''),
})

export type FiltersValues = z.infer<typeof filtersSchema>
