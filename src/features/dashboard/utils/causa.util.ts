function normKey(s: string): string {
  return s.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

export function normalizeCausa(raw: string): string {
  const k = normKey(raw).split(' - ')[0].trim()
  if (k.includes('inundacion'))                             return 'Inundación'
  if (k.includes('exceso') || k.includes('humedad'))       return 'Exceso de humedad'
  if (k.includes('sequia'))                                 return 'Sequía'
  if (k.includes('granizada') || k.includes('granizo'))    return 'Granizo'
  if (k.includes('helada') || k.includes('bajas temp'))    return 'Helada'
  if (k.includes('plagas'))                                 return 'Plaga'
  if (k.includes('enferm'))                                 return 'Enfermedad'
  if (k.includes('vientos'))                                return 'Viento'
  if (k.includes('desliz'))                                 return 'Deslizamiento'
  if (k.includes('tapon'))                                  return 'Taponamiento'
  if (k.includes('incendio') || k.includes('ceniza'))      return 'Incendio'
  return raw
}
