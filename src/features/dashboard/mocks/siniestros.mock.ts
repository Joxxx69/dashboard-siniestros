import type { Siniestro, TipoEvento, EstadoTramite } from '../types'

const PROVINCIAS_DATA = [
  { provincia: 'Los Ríos', cantones: ['Babahoyo', 'Quevedo', 'Vinces', 'Puebloviejo'] },
  { provincia: 'Guayas', cantones: ['Guayaquil', 'Milagro', 'Naranjal', 'Balzar'] },
  { provincia: 'Manabí', cantones: ['Portoviejo', 'Manta', 'Chone', 'Tosagua'] },
  { provincia: 'Loja', cantones: ['Loja', 'Catamayo', 'Calvas', 'Espíndola'] },
  { provincia: 'El Oro', cantones: ['Machala', 'Santa Rosa', 'El Guabo', 'Pasaje'] },
  { provincia: 'Chimborazo', cantones: ['Riobamba', 'Guano', 'Chambo', 'Alausí'] },
  { provincia: 'Cotopaxi', cantones: ['Latacunga', 'Salcedo', 'Pangua', 'Sigchos'] },
  { provincia: 'Pichincha', cantones: ['Cayambe', 'Mejía', 'Rumiñahui', 'Pedro Moncayo'] },
  { provincia: 'Azuay', cantones: ['Gualaceo', 'Paute', 'Girón', 'Santa Isabel'] },
  { provincia: 'Imbabura', cantones: ['Ibarra', 'Otavalo', 'Cotacachi', 'Antonio Ante'] },
]

const CULTIVOS = ['Arroz', 'Maíz', 'Banano', 'Cacao', 'Palma', 'Papa', 'Tomate', 'Quinua', 'Cebolla', 'Caña de azúcar']
const TIPOS_EVENTO: TipoEvento[] = ['Inundación', 'Sequía', 'Granizo', 'Helada', 'Plaga', 'Viento']
const ESTADOS: EstadoTramite[] = ['Inspeccionado', 'Pendiente', 'En proceso', 'Rechazado', 'Aprobado']
const TECNICOS = ['María López', 'Juan Pérez', 'Carlos García', 'Ana Martínez', 'Luis Rodríguez', 'Sofía Torres']
const PRODUCTORES = [
  'José Martínez', 'Carmen Silva', 'Pedro Alvarado', 'Rosa Quiñones', 'Diego Morales',
  'Elena Vásquez', 'Andrés Castillo', 'Patricia Ramos', 'Héctor Mendoza', 'Lucía Peralta',
  'Fernando Ortiz', 'Gloria Suárez', 'Ramiro Aguirre', 'Mónica Herrera', 'Santiago Ponce',
]

const HA_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 60, 80, 100]
const PCT_OPTIONS = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]

function createSiniestro(idx: number): Siniestro {
  const pIdx = idx % PROVINCIAS_DATA.length
  const { provincia, cantones } = PROVINCIAS_DATA[pIdx]
  const canton = cantones[Math.floor(idx / PROVINCIAS_DATA.length) % cantones.length]

  const month = (idx % 12) + 1
  const day = (idx % 28) + 1
  const year = idx < 30 ? 2024 : 2025
  const fecha = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`

  const haAseguradas = HA_OPTIONS[idx % HA_OPTIONS.length]
  const pctAfectacion = PCT_OPTIONS[idx % PCT_OPTIONS.length]
  const haAfectadas = Math.round(haAseguradas * pctAfectacion / 100 * 10) / 10

  return {
    id: `SIN-${year}-${String(idx + 1).padStart(4, '0')}`,
    fecha,
    provincia,
    canton,
    parroquia: `Parroquia ${canton.split(' ')[0]}`,
    cultivo: CULTIVOS[idx % CULTIVOS.length],
    productor: PRODUCTORES[idx % PRODUCTORES.length],
    hectareasAseguradas: haAseguradas,
    hectareasAfectadas: haAfectadas,
    porcentajeAfectacion: pctAfectacion,
    tipoEvento: TIPOS_EVENTO[Math.floor(idx * 1.618) % TIPOS_EVENTO.length],
    estado: ESTADOS[(idx * 7 + 3) % ESTADOS.length],
    tecnico: TECNICOS[idx % TECNICOS.length],
  }
}

export const MOCK_SINIESTROS: Siniestro[] = Array.from({ length: 80 }, (_, i) => createSiniestro(i))
