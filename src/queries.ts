import type { IcpSegment } from './domain.js';

export const SEGMENT_QUERIES: Record<IcpSegment, readonly string[]> = {
  // Beleza e bem-estar
  barbearia: ['barbearia', 'barber shop', 'barbeiro'],
  salao_de_beleza: ['salão de beleza', 'cabeleireiro', 'hair salon'],
  manicure_nail_designer: ['manicure', 'nail designer', 'unhas e pedicure'],
  clinica_estetica: ['clínica de estética', 'estética', 'esteticista'],
  depilacao: ['depilação', 'depilação a laser', 'estúdio de depilação'],
  lash_designer: ['lash designer', 'extensão de cílios', 'cílios'],
  sobrancelhas_micropigmentacao: ['designer de sobrancelhas', 'micropigmentação', 'sobrancelhas'],
  massoterapia: ['massoterapia', 'massoterapeuta', 'massagem terapêutica'],
  spa: ['spa', 'day spa', 'spa urbano'],
  studio_tattoo_piercing: ['estúdio de tatuagem', 'tatuagem', 'piercing'],

  // Saúde
  clinica_odontologica: ['clínica odontológica', 'dentista', 'consultório odontológico'],
  clinica_medica: ['clínica médica', 'consultório médico', 'centro médico'],
  fisioterapia: ['fisioterapia', 'clínica de fisioterapia', 'fisioterapeuta'],
  psicologia: ['psicólogo', 'psicóloga', 'clínica de psicologia'],
  nutricao: ['nutricionista', 'consultório de nutrição', 'nutrição'],
  fonoaudiologia: ['fonoaudiólogo', 'fonoaudióloga', 'clínica de fonoaudiologia'],
  dermatologia: ['dermatologista', 'clínica dermatológica', 'dermatologia'],
  oftalmologia: ['oftalmologista', 'clínica de oftalmologia', 'oftalmologia'],
  veterinaria: ['veterinário', 'clínica veterinária', 'hospital veterinário'],
  pet_shop: ['pet shop', 'loja de animais', 'pet center'],

  // Fitness e serviços locais
  academia: ['academia', 'fitness', 'musculação'],
  oficina_mecanica: ['oficina mecânica', 'auto center', 'mecânica automotiva'],
  auto_eletrica: ['auto elétrica', 'autoeletrica', 'elétrica automotiva'],
  funilaria_pintura: ['funilaria e pintura', 'funilaria', 'pintura automotiva'],
  ar_condicionado: ['ar condicionado', 'instalação de ar condicionado', 'assistência ar condicionado'],
  assistencia_tecnica: ['assistência técnica', 'assistência técnica eletrônica', 'conserto de eletrônicos'],
  empresa_limpeza: ['empresa de limpeza', 'limpeza residencial', 'limpeza comercial'],
  dedetizadora: ['dedetizadora', 'controle de pragas', 'dedetização'],
  marcenaria: ['marcenaria', 'marceneiro', 'móveis sob medida'],
  serralheria: ['serralheria', 'serralheiro', 'estruturas metálicas'],
  eletricista: ['eletricista', 'instalação elétrica', 'serviços elétricos'],
  encanador: ['encanador', 'serviços hidráulicos', 'hidráulica residencial'],

  // Casa, construção e imóveis
  imobiliaria: ['imobiliária', 'corretora de imóveis', 'imóveis'],
  corretor_imoveis: ['corretor de imóveis', 'corretora de imóveis', 'consultor imobiliário'],
  arquitetura: ['arquitetura', 'arquiteto', 'escritório de arquitetura'],
  engenharia: ['engenharia', 'engenheiro civil', 'empresa de engenharia'],
  moveis_planejados: ['móveis planejados', 'móveis sob medida', 'marcenaria planejada'],
  vidracaria: ['vidraçaria', 'vidraceiro', 'vidros temperados'],
  marmoraria: ['marmoraria', 'mármores e granitos', 'pedras decorativas'],
  empresa_reformas: ['empresa de reformas', 'reformas residenciais', 'reforma comercial'],
  material_construcao: ['material de construção', 'loja de material de construção', 'materiais para construção'],

  // Educação
  escola_curso: ['escola', 'curso livre', 'instituição de ensino'],
  curso_idiomas: ['curso de idiomas', 'escola de inglês', 'escola de idiomas'],
  curso_profissionalizante: ['curso profissionalizante', 'escola profissionalizante', 'cursos técnicos'],
  autoescola: ['autoescola', 'centro de formação de condutores', 'CFC'],
  reforco_escolar: ['reforço escolar', 'aula de reforço', 'professor particular'],
  curso_preparatorio: ['curso preparatório', 'pré-vestibular', 'preparatório para concursos'],

  // Comércio
  loja_roupas: ['loja de roupas', 'boutique', 'moda feminina'],
  loja_calcados: ['loja de calçados', 'sapatos', 'calçados'],
  otica: ['ótica', 'óptica', 'ótica e relojoaria'],
  loja_moveis: ['loja de móveis', 'móveis e decoração', 'móveis'],
  loja_eletronicos: ['loja de eletrônicos', 'eletrônicos', 'eletroeletrônicos'],
  loja_celulares: ['loja de celulares', 'assistência de celulares', 'smartphones'],
  loja_cosmeticos: ['loja de cosméticos', 'cosméticos', 'perfumaria'],

  // Alimentação
  restaurante: ['restaurante', 'comida', 'restaurante delivery'],
  pizzaria: ['pizzaria', 'pizza', 'pizzaria delivery'],
  hamburgueria: ['hamburgueria', 'hambúrguer', 'burger'],
  lanchonete: ['lanchonete', 'lanche', 'lancheria'],
  cafeteria: ['cafeteria', 'café', 'coffee shop'],
  padaria: ['padaria', 'panificadora', 'confeitaria e padaria'],
  doceria: ['doceria', 'confeitaria', 'doces e bolos'],
  marmitaria: ['marmitaria', 'marmitas', 'comida caseira'],
};

export const DEFAULT_QUERIES = SEGMENT_QUERIES.barbearia;

export function buildQueries(_city: string, segment: IcpSegment = 'barbearia'): string[] {
  return [...SEGMENT_QUERIES[segment]];
}
