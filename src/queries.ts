export const DEFAULT_QUERIES = [
  'barbearia',
  'salão de beleza',
  'manicure nail designer',
] as const;

export function buildQueries(city: string): string[] {
  return DEFAULT_QUERIES.map((segment) => `${segment} em ${city}`);
}
