export const ICP_SEGMENTS = [
  'barbearia',
  'salao_de_beleza',
  'manicure_nail_designer',
] as const;

export type IcpSegment = (typeof ICP_SEGMENTS)[number];

export const PIPELINE_STAGES = [
  'NOVO',
  'QUALIFICADO',
  'CONTATADO',
  'RESPONDEU',
  'INTERESSADO',
  'DEMONSTRAÇÃO',
  'PROPOSTA',
  'NEGOCIAÇÃO',
  'GANHO',
  'PERDIDO',
  'OPT-OUT',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface Lead {
  id: string;
  name: string;
  segment: IcpSegment | null;
  city: string;
  state: string;
  country: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviews: number | null;
  source: 'apify' | 'manual' | 'import';
  sourceId: string | null;
  score: number;
  scoreReasons: string[];
  stage: PipelineStage;
  optOut: boolean;
  contactedAt: string | null;
  lastContactAt: string | null;
  personalizedMessage: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawPlace {
  [key: string]: unknown;
}
