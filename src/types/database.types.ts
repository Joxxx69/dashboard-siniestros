export interface Database {
  public: {
    Tables: {
      provincias: {
        Row: { id: number; nombre: string; created_at: string }
        Insert: { nombre: string }
        Update: { nombre?: string }
      }
      cantones: {
        Row: { id: number; nombre: string; provincia_id: number; created_at: string }
        Insert: { nombre: string; provincia_id: number }
        Update: { nombre?: string; provincia_id?: number }
      }
      cultivos: {
        Row: { id: number; nombre: string; created_at: string }
        Insert: { nombre: string }
        Update: { nombre?: string }
      }
      causas_siniestro: {
        Row: { id: number; descripcion: string; created_at: string }
        Insert: { descripcion: string }
        Update: { descripcion?: string }
      }
      estados_siniestro: {
        Row: { id: number; codigo: string; nombre: string; created_at: string }
        Insert: { codigo: string; nombre: string }
        Update: { codigo?: string; nombre?: string }
      }
      siniestros: {
        Row: {
          id: number
          numero_tramite: string
          cultivo_id: number
          canton_id: number
          has_afectadas: number
          causa_id: number
          estado_id: number | null
          fecha_ocurrencia: string
          anio_siniestro: number
          created_at: string
          updated_at: string
        }
        Insert: {
          numero_tramite: string
          cultivo_id: number
          canton_id: number
          has_afectadas: number
          causa_id: number
          estado_id?: number | null
          fecha_ocurrencia: string
        }
        Update: {
          numero_tramite?: string
          cultivo_id?: number
          canton_id?: number
          has_afectadas?: number
          causa_id?: number
          estado_id?: number | null
          fecha_ocurrencia?: string
        }
      }
    }
    Views: {
      vw_kpis: {
        Row: {
          total_siniestros: number
          total_has_afectadas: number
          total_provincias: number
          total_cantones: number
          total_cultivos: number
          promedio_has: number
        }
      }
      vw_siniestros_por_provincia: {
        Row: { provincia: string; total_siniestros: number; total_has: number }
      }
      vw_siniestros_por_canton: {
        Row: { provincia: string; canton: string; total_siniestros: number; total_has: number }
      }
      vw_siniestros_por_causa: {
        Row: { causa: string; total_siniestros: number; total_has: number }
      }
      vw_siniestros_por_cultivo: {
        Row: { cultivo: string; total_siniestros: number; total_has: number; promedio_has: number }
      }
      vw_siniestros_por_anio: {
        Row: { anio_siniestro: number; total_siniestros: number; total_has: number }
      }
      vw_siniestros_por_mes: {
        Row: { mes: string; total_siniestros: number; total_has: number }
      }
    }
    Functions: Record<string, never>
  }
}
