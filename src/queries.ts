import type { IcpSegment } from './domain.js';

export const SEGMENT_QUERIES: Record<IcpSegment, readonly string[]> = {
  barbearia: ['barbearia', 'barber shop', 'barbeiro'],
  salao_de_beleza: ['salão de beleza', 'cabeleireiro', 'hair salon'],
  manicure_nail_designer: ['manicure', 'nail designer', 'unhas e pedicure'],
  clinica_odontologica: ['clínica odontológica', 'dentista', 'consultório odontológico'],
  clinica_estetica: ['clínica de estética', 'estética', 'esteticista'],
  academia: ['academia', 'fitness', 'musculação'],
  pet_shop: ['pet shop', 'loja de animais', 'pet center'],
  veterinaria: ['veterinário', 'clínica veterinária', 'hospital veterinário'],
  restaurante: ['restaurante', 'pizzaria', 'lanchonete'],
  imobiliaria: ['imobiliária', 'corretora de imóveis', 'imóveis'],
  oficina_mecanica: ['oficina mecânica', 'auto center', 'mecânica automotiva'],
  escola_curso: ['escola', 'curso profissionalizante', 'curso livre'],
};

export const DEFAULT_QUERIES = SEGMENT_QUERIES.barbearia;

export function buildQueries(_city: string, segment: IcpSegment = 'barbearia'): string[] {
  return [...SEGMENT_QUERIES[segment]];
}
