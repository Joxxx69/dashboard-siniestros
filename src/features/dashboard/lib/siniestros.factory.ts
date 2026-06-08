import { ExcelSiniestrosAdapter } from '../adapters/excel.adapter'
import { MockSiniestrosAdapter } from '../adapters/mock.adapter'
import { SiniestrosService } from '../services/siniestros.service'

// En producción apunta a NEXT_PUBLIC_DATA_URL (Supabase Storage, CDN, etc.)
// En desarrollo sin URL configurada cae al mock automáticamente
const DATA_URL = process.env.NEXT_PUBLIC_DATA_URL ?? ''

export function createSiniestrosService(): SiniestrosService {
  const adapter = DATA_URL
    ? new ExcelSiniestrosAdapter(DATA_URL)
    : new MockSiniestrosAdapter()

  return new SiniestrosService(adapter)
}
