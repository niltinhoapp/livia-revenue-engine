export const DEFAULT_QUERIES = [
  'barbearia',
  'barber',
  'salão de beleza',
  'cabeleireiro',
  'manicure',
  'nail designer',
  'estética',
] as const;

export function buildQueries(_city: string): string[] {
  return [...DEFAULT_QUERIES];
}
