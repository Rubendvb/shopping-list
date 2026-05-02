export type Unit = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'CX' | 'PCT'

export interface UnitOption {
  value: Unit
  label: string
  abbr: string
}

export const UNITS: UnitOption[] = [
  { value: 'UN', label: 'Unidade', abbr: 'un' },
  { value: 'KG', label: 'Quilograma', abbr: 'kg' },
  { value: 'G', label: 'Grama', abbr: 'g' },
  { value: 'L', label: 'Litro', abbr: 'L' },
  { value: 'ML', label: 'Mililitro', abbr: 'ml' },
  { value: 'CX', label: 'Caixa', abbr: 'cx' },
  { value: 'PCT', label: 'Pacote', abbr: 'pct' },
]

const UNIT_CODES = new Set<string>(UNITS.map((u) => u.value))

const LEGACY_MAP: Record<string, Unit> = {
  un: 'UN',
  und: 'UN',
  unid: 'UN',
  unidade: 'UN',
  unidades: 'UN',
  kg: 'KG',
  kilo: 'KG',
  quilograma: 'KG',
  quilogramas: 'KG',
  g: 'G',
  gr: 'G',
  grama: 'G',
  gramas: 'G',
  l: 'L',
  litro: 'L',
  litros: 'L',
  ml: 'ML',
  mililitro: 'ML',
  mililitros: 'ML',
  cx: 'CX',
  caixa: 'CX',
  caixas: 'CX',
  pct: 'PCT',
  pacote: 'PCT',
  pacotes: 'PCT',
}

/** Converts any stored string (legacy or current code) to a typed Unit. */
export function normalizeUnit(raw: string | undefined): Unit | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (UNIT_CODES.has(trimmed)) return trimmed as Unit
  return LEGACY_MAP[trimmed.toLowerCase()]
}

/** Returns the display abbreviation for a unit code. */
export function unitAbbr(unit: Unit): string {
  return UNITS.find((u) => u.value === unit)?.abbr ?? unit.toLowerCase()
}
