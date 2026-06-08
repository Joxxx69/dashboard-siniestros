import type { EstadoTramite, TipoEvento } from '../types'

export const PROVINCIAS_DATA = [
  { value: 'Los Ríos', label: 'Los Ríos', cantones: ['Babahoyo', 'Quevedo', 'Vinces', 'Puebloviejo'] },
  { value: 'Guayas', label: 'Guayas', cantones: ['Guayaquil', 'Milagro', 'Naranjal', 'Balzar'] },
  { value: 'Manabí', label: 'Manabí', cantones: ['Portoviejo', 'Manta', 'Chone', 'Tosagua'] },
  { value: 'Loja', label: 'Loja', cantones: ['Loja', 'Catamayo', 'Calvas', 'Espíndola'] },
  { value: 'El Oro', label: 'El Oro', cantones: ['Machala', 'Santa Rosa', 'El Guabo', 'Pasaje'] },
  { value: 'Chimborazo', label: 'Chimborazo', cantones: ['Riobamba', 'Guano', 'Chambo', 'Alausí'] },
  { value: 'Cotopaxi', label: 'Cotopaxi', cantones: ['Latacunga', 'Salcedo', 'Pangua', 'Sigchos'] },
  { value: 'Pichincha', label: 'Pichincha', cantones: ['Cayambe', 'Mejía', 'Rumiñahui', 'Pedro Moncayo'] },
  { value: 'Azuay', label: 'Azuay', cantones: ['Gualaceo', 'Paute', 'Girón', 'Santa Isabel'] },
  { value: 'Imbabura', label: 'Imbabura', cantones: ['Ibarra', 'Otavalo', 'Cotacachi', 'Antonio Ante'] },
] as const

export const CULTIVOS = [
  'Arroz', 'Maíz', 'Banano', 'Cacao', 'Palma', 'Papa', 'Tomate', 'Quinua', 'Cebolla', 'Caña de azúcar',
] as const

export const TIPOS_EVENTO: TipoEvento[] = [
  'Inundación', 'Sequía', 'Granizo', 'Helada', 'Plaga', 'Viento',
]

export const ESTADOS_TRAMITE: EstadoTramite[] = [
  'Inspeccionado', 'Pendiente', 'En proceso', 'Rechazado', 'Aprobado',
]

export const ANIOS = ['2022', '2023', '2024', '2025'] as const

export const CHART_COLORS = [
  '#014d1d', '#006b28', '#15803d', '#16a34a', '#22c55e',
  '#4ade80', '#086429', '#0d9a38', '#1a7b35', '#2d8a4e',
] as const


3
2
0.4
0.5
0.4