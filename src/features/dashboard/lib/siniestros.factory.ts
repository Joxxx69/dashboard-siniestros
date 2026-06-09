import { SupabaseSiniestrosAdapter } from '../adapters/supabase.adapter'
import { SiniestrosService } from '../services/siniestros.service'

export function createSiniestrosService(): SiniestrosService {
  return new SiniestrosService(new SupabaseSiniestrosAdapter())
}
