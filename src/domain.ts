export const ICP_SEGMENTS = [
  // Beleza e bem-estar
  'barbearia',
  'salao_de_beleza',
  'manicure_nail_designer',
  'clinica_estetica',
  'depilacao',
  'lash_designer',
  'sobrancelhas_micropigmentacao',
  'massoterapia',
  'spa',
  'studio_tattoo_piercing',

  // Saúde
  'clinica_odontologica',
  'clinica_medica',
  'fisioterapia',
  'psicologia',
  'nutricao',
  'fonoaudiologia',
  'dermatologia',
  'oftalmologia',
  'veterinaria',
  'pet_shop',

  // Fitness e serviços locais
  'academia',
  'oficina_mecanica',
  'auto_eletrica',
  'funilaria_pintura',
  'ar_condicionado',
  'assistencia_tecnica',
  'empresa_limpeza',
  'dedetizadora',
  'marcenaria',
  'serralheria',
  'eletricista',
  'encanador',

  // Casa, construção e imóveis
  'imobiliaria',
  'corretor_imoveis',
  'arquitetura',
  'engenharia',
  'moveis_planejados',
  'vidracaria',
  'marmoraria',
  'empresa_reformas',
  'material_construcao',

  // Educação
  'escola_curso',
  'curso_idiomas',
  'curso_profissionalizante',
  'autoescola',
  'reforco_escolar',
  'curso_preparatorio',

  // Comércio
  'loja_roupas',
  'loja_calcados',
  'otica',
  'loja_moveis',
  'loja_eletronicos',
  'loja_celulares',
  'loja_cosmeticos',

  // Alimentação
  'restaurante',
  'pizzaria',
  'hamburgueria',
  'lanchonete',
  'cafeteria',
  'padaria',
  'doceria',
  'marmitaria',
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

export const PHONE_STATUSES = ['MISSING', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED'] as const;
export type PhoneStatus = (typeof PHONE_STATUSES)[number];

export const CRM_EVENT_TYPES = [
  'LEAD_CREATED',
  'LEAD_UPDATED',
  'PHONE_VERIFIED',
  'PHONE_REJECTED',
  'MESSAGE_PREPARED',
  'CONTACTED',
  'STAGE_CHANGED',
  'NOTE_ADDED',
  'OPT_OUT',
] as const;
export type CrmEventType = (typeof CRM_EVENT_TYPES)[number];

export interface CrmEvent {
  id: string;
  leadId: string;
  type: CrmEventType;
  occurredAt: string;
  fromStage?: PipelineStage;
  toStage?: PipelineStage;
  message?: string;
  note?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

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
  phoneStatus: PhoneStatus;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviews: number | null;
  source: 'apify' | 'manual' | 'import';
  sourceId: string | null;
  dataQualityScore: number;
  dataQualityReasons: string[];
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
