/**
 * Análise determinística de sinais públicos de intenção comercial.
 * NÃO realiza disparos em massa nem abordagens automáticas não autorizadas.
 * Compatível com LGPD e regras de privacidade.
 */

export interface IntentSignal {
  id?: string;
  text: string;
  sourceUrl: string;
  source?: string;
  author?: string;
  title?: string;
  publishedAt?: string;
  segment?: string;
}

export type IntentLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type IntentDecision = 'REVIEW' | 'WATCH' | 'DISCARD';
export type IntentType = 'COMMERCIAL' | 'CURIOSITY' | 'INFORMATIONAL' | 'NONE';
export type UrgencyLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type OpportunityCommercialStatus =
  | 'NOVO'
  | 'EM_ANALISE'
  | 'ABORDAGEM_APROVADA'
  | 'CONTATADO'
  | 'ENCAMINHADO_LIVIA'
  | 'DESCARTADO';

export type RejectionCategory =
  | 'INVALID_URL'
  | 'TEXT_TOO_SHORT'
  | 'TECH_OR_DEVOPS'
  | 'VENDOR_OR_SELLER'
  | 'JOB_OR_RECRUITMENT'
  | 'CONSUMER_COMPLAINT'
  | 'ACADEMIC_OR_STUDENT'
  | 'FOREIGN_LANGUAGE'
  | 'NO_SOLUTION_FIT'
  | 'NO_BUSINESS_LINK'
  | 'NO_COMMERCIAL_NEED';

export interface IntentAssessment {
  id: string;
  score: number;
  level: IntentLevel;
  decision: IntentDecision;
  problemDescription: string;
  intentType: IntentType;
  businessEvidence: string;
  fitWithLivia: string;
  urgency: UrgencyLevel;
  segment: string;
  evidence: string[];
  blockers: string[];
  sourceUrl: string;
  source: string;
  author?: string;
  title?: string;
  snippet: string;
  exactEvidenceSnippet?: string;
  rejectionCategory?: RejectionCategory;
  rejectionReason?: string;
  publishedAt?: string;
  suggestedApproach: string;
  commercialStatus: OpportunityCommercialStatus;
}

const needPattern = /\b(procuro|procurando|preciso|precisando|busco|buscando|indicam|recomenda[cç][aã]o|recomendam|algu[eé]m indica|algu[eé]m recomenda|algu[eé]m usa|qual sistema|qual software|qual ferramenta|qual aplicativo|qual app|qual programa|quanto custa|or[cç]amento|contratar|querendo colocar|pensando em colocar|como automatizar|como voc[eê]s fazem|como voc[eê]s atendem|dicas de sistema|dicas de ferramenta|preciso de uma? (?:recepcionista|secret[aá]ria|atendente)|procuro (?:recepcionista|secret[aá]ria|atendente)|quero automatizar)\b/i;

const painPattern = /\b(perdendo clientes?|perco clientes?|n[aã]o (?:dou conta|consigo|d[aá] conta) (?:de )?responder|demoro (?:a|para) responder|demora (?:no|para) atendimento|mensagens acumuladas?|mensagens acumulando|mensagens atrasadas?|whatsapp lotado|caixa de entrada cheia|atendimento sobrecarregado|clientes reclamando|reclama[cç][aã]o de demora|muita mensagem no whatsapp|n[aã]o dou conta de atender|responder e atender ao mesmo tempo|responder e cortar|perco muito tempo respondendo|deixo clientes esperando|atendimento demorado|deixar cliente no v[aá]cuo|n[aã]o responder a tempo)\b/i;

const solutionPattern = /\b(whats\s?app|atendimento|agendament[oa]s?|marcar hor[aá]rio|marcar consulta|recepcionista|secret[aá]ria|chatbot|assistente virtual|automa[çc][aã]o|automatizar|pedidos|atendente virtual|ia no atendimento|bot de atendimento|resposta autom[aá]tica|lembrete de hor[aá]rio|confirma[cç][aã]o de hor[aá]rio|sistema para sal[aã]o|sistema para barbearia|software para sal[aã]o|app de agendamento)\b/i;

const buyerPattern = /(?:(?:tenho|meu|minha|aqui n[ao]|sou don[oa]|sou propriet[aá]ri[oa]|sou gestor[ao]?|sou s[oó]ci[oa]|sou gerente)\s+(?:(?:de|do|da|um|uma|nosso|nossa)\s+){0,3}(?:sal[aã]o|barbearia|esmalteria|studio|est[uú]dio|cl[ií]nica|consult[oó]rio|restaurante|pizzaria|lanchonete|neg[oó]cio|empresa|com[eé]rcio|loja|espa[cç]o)|(?:sou (?:barbeiro|cabeleireir[oa]|manicure|nail designer|lash designer|tatuador[a]?|esteticista|m[eé]dic[oa]|dentista|fisioterapeuta))|(?:na minha barbearia|no meu sal[aã]o|na minha cl[ií]nica|no meu est[uú]dio|na minha esmalteria|aqui na barbearia|aqui no sal[aã]o|aqui na cl[ií]nica|meu neg[oó]cio|meus clientes agendam))/i;

// Filtros específicos de descarte
const techDevPattern = /\b(?:github|gitlab|docker|kubernetes|devops|vps|deploy|ci\/cd|webhook|api rest|rest api|endpoint|pull request|commit|repositório|código fonte|open source|vibecoding|vibe coding|n8n|typebot|evolution api|baileys|wppconnect|z-api|zenvia|twilio|postman|swagger|backend|frontend|fullstack|stack|javascript|typescript|python|php|laravel|react|node\.js|nodejs|sqlite|postgresql|mysql|mongodb|aws|google cloud|azure|linux|ubuntu|template gratuito|boilerplate|package\.json|npm run|claude|chatgpt|codex|cursor|copilot|openai|llm|ia generativa|prompts?|programador[a]?|desenvolvedor[a]?|engenheiro de software|carreira em ti|transição de carreira)\b/i;

const vendorAgencyPattern = /\b(?:vendo (?:rob[oô]s?|automa[çc][aã]o|chatbots?|leads?|disparador)|ofere[cç]o servi[cç]os?|crio automa[cç][aã]o|desenvolvo (?:rob[oô]s?|bots?|sites?)|fa[cç]o tr[aá]fego|gestor de tr[aá]fego|assessoria de marketing|sou afiliad[oa]|compre meu|compre o curso|arraste pra cima|link na bio|me chama no direct|chama no pv|lançamento de infoproduto|trabalho como vendedor|venda mais no whatsapp|pacote de leads|automação de leads|funil de vendas|copywriting|tráfego pago|gancho de dor|criativo em vídeo|marketing de conteúdo|seo local|pesquisas locais|como serralheiros podem|como creches podem|como \w+ podem (?:atrair|usar conteúdo|ser encontrad[ao]s)|dicas para lotar sua agenda|estratégia para vender mais|leadfy|post patrocinado)\b/i;

const jobPattern = /\b(?:vagas? de emprego|procuro vaga|busco vaga|envio meu curr[ií]culo|enviar curr[ií]culo|processo seletivo|est[aá]gio|contrata-se|estamos contratando|vaga -|vagas -|clt ou pj|sal[aá]rio a combinar|trabalhe conosco)\b/i;

const consumerComplaintPattern = /(?:(?:sou cliente|como cliente|fui cliente|fui atendid[oa]|sou paciente|como paciente|fui na barbearia e|fui no sal[aã]o e|o atendimento que recebi|mandei mensagem pra um (?:sal[aã]o|barbearia) e|fui tentar marcar|para minha (?:av[oó]|m[aã]e|fam[ií]lia)|como consumidor|reclame aqui|a operadora|a tim|a claro|a vivo|pior desgraça|odeio chatbot)\b)/i;

const academicPattern = /\b(?:sou estudante|projeto de faculdade|trabalho da faculdade|tcc|monografia|artigo acad[eê]mico|aula de|curso de|tutorial de como)\b/i;

const foreignSpanishPattern = /\b(?:awebao|tu papá|huelga|sanidad pública|muy salao|he tenido|experiencia sobre|cordialidad|ayuda😭😭|ayuda por favor|servicios públicos)\b/i;


export function isValidPublicUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (!['https:', 'http:'].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (!host || host === 'localhost' || host === '0.0.0.0') return false;
    if (/^127\.\d+\.\d+\.\d+$/.test(host)) return false;
    if (/^10\.\d+\.\d+\.\d+$/.test(host)) return false;
    if (/^192\.168\.\d+\.\d+$/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)) return false;
    if (host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (host === '::1') return false;
    return host.includes('.');
  } catch {
    return false;
  }
}

function detectSegment(text: string, fallback?: string): string {
  if (/(?:barbearia|barbeiro|corte masculino|barba)/i.test(text)) return 'barbearia';
  if (/(?:sal[aã]o(?: de beleza)?|cabeleireir[oa]|escova|mechas|corte feminino)/i.test(text)) return 'salao_de_beleza';
  if (/(?:manicure|nail designer|esmalteria|alongamento de unhas?|pedicure)/i.test(text)) return 'manicure_nail_designer';
  if (/(?:cl[ií]nica est[eé]tica|esteticista|depila[cç][aã]o|lash designer|sobrancelhas?)/i.test(text)) return 'clinica_estetica';
  if (/(?:dentista|odontol[oó]gic[ao]|consult[oó]rio dent[aá]rio)/i.test(text)) return 'clinica_odontologica';
  if (/(?:cl[ií]nica m[eé]dica|consult[oó]rio m[eé]dico|fisioterapia|psicologia)/i.test(text)) return 'clinica_medica';
  if (/(?:restaurante|pizzaria|hamburgueria|delivery|lanchonete)/i.test(text)) return 'restaurante';
  return fallback || 'servicos_locais';
}

function extractProblemDescription(text: string): string {
  if (/perdendo clientes/i.test(text)) {
    return 'Perda de clientes decorrente de demora ou falha no atendimento.';
  }
  if (/n[aã]o (?:dou conta|consigo) (?:de )?responder|mensagens acumuladas/i.test(text)) {
    return 'Sobrecarga de mensagens no WhatsApp sem conseguir responder a tempo.';
  }
  if (/agendament|marcar hor[aá]rio/i.test(text)) {
    return 'Dificuldade para organizar horários e agendamentos de clientes.';
  }
  if (/recepcionista|secret[aá]ria|atendente virtual/i.test(text)) {
    return 'Necessidade de recepcionista/atendente para primeiro contato dos clientes.';
  }
  if (/automa[cç][aã]o|automatizar/i.test(text)) {
    return 'Busca por automação e agilidade no atendimento comercial via WhatsApp.';
  }
  return 'Necessidade de agilidade e organização no contato com clientes.';
}

function extractExactEvidenceSnippet(text: string): string {
  // Encontra a melhor sentença ou trecho onde a dor/vínculo ocorre
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  for (const sentence of sentences) {
    if ((painPattern.test(sentence) || needPattern.test(sentence)) && (buyerPattern.test(sentence) || solutionPattern.test(sentence))) {
      return sentence.trim().slice(0, 260);
    }
  }
  for (const sentence of sentences) {
    if (painPattern.test(sentence) || needPattern.test(sentence)) {
      return sentence.trim().slice(0, 260);
    }
  }
  for (const sentence of sentences) {
    if (buyerPattern.test(sentence)) {
      return sentence.trim().slice(0, 260);
    }
  }
  return text.trim().slice(0, 220);
}

function generateSuggestedApproach(segment: string, problem: string, text: string): string {
  const segmentLabel = segment === 'barbearia'
    ? 'na barbearia'
    : segment === 'salao_de_beleza'
    ? 'no salão'
    : segment === 'manicure_nail_designer'
    ? 'no espaço de unhas/esmalteria'
    : 'no seu espaço';

  if (/agendament/i.test(text)) {
    return `Olá! Vi sua postagem sobre sistema de agendamento ${segmentLabel}. A Lívia foi criada exatamente para isso: ela responde no WhatsApp em segundos, mostra horários vagos e confirma agendamentos automaticamente no sistema, sem você precisar interromper o atendimento. Quer ver uma prévia rápida de como ela opera?`;
  }
  if (/perdendo clientes|demoro|n[aã]o (?:dou conta|consigo)/i.test(text)) {
    return `Olá! Vi seu relato sobre o desafio de conciliar o trabalho manual com as mensagens no WhatsApp ${segmentLabel}. A Lívia assume o primeiro atendimento receptivo 24/7 com IA humanizada para você não perder clientes em momentos de pico. Se fizer sentido, posso te mostrar uma demonstração de 2 minutos.`;
  }
  return `Olá! Vi seu post buscando soluções de atendimento para WhatsApp ${segmentLabel}. A Lívia é uma recepcionista virtual inteligente que tira dúvidas e organiza horários com naturalidade. Fico à disposição se quiser testar sem compromisso!`;
}

export function assessIntent(signal: IntentSignal): IntentAssessment {
  const text = typeof signal?.text === 'string' ? signal.text.trim().slice(0, 6000) : '';
  const sourceUrl = typeof signal?.sourceUrl === 'string' ? signal.sourceUrl.trim() : '';
  const source = signal?.source || (sourceUrl ? new URL(sourceUrl, 'https://unknown').hostname : 'public_source');
  const evidence: string[] = [];
  const blockers: string[] = [];

  const isUrlValid = isValidPublicUrl(sourceUrl);
  if (!isUrlValid) blockers.push('Fonte não verificável ou endereço restrito');
  if (text.length < 15) blockers.push('Texto insuficiente para avaliação comercial');

  // Detecção precisa de categorias de descarte
  let rejectionCategory: RejectionCategory | undefined;
  let rejectionReason: string | undefined;

  if (!isUrlValid) {
    rejectionCategory = 'INVALID_URL';
    rejectionReason = 'URL da fonte é inválida, restrita ou não acessível publicamente.';
  } else if (text.length < 15) {
    rejectionCategory = 'TEXT_TOO_SHORT';
    rejectionReason = 'Publicação com conteúdo textual insuficiente para análise comercial.';
  } else if (techDevPattern.test(text)) {
    rejectionCategory = 'TECH_OR_DEVOPS';
    rejectionReason = 'Publicação técnica sobre código, infraestrutura, DevOps ou template open source (não é comprador final).';
    blockers.push('Conteúdo técnico/desenvolvimento de software identificado');
  } else if (vendorAgencyPattern.test(text)) {
    rejectionCategory = 'VENDOR_OR_SELLER';
    rejectionReason = 'Fornecedor vendendo automação, agência de marketing, infoproduto ou venda de leads.';
    blockers.push('Possível fornecedor de automação ou vendedor de serviços');
  } else if (academicPattern.test(text)) {
    rejectionCategory = 'ACADEMIC_OR_STUDENT';
    rejectionReason = 'Estudante ou projeto acadêmico de faculdade/TCC.';
    blockers.push('Projeto estudantil ou acadêmico');
  } else if (consumerComplaintPattern.test(text)) {
    rejectionCategory = 'CONSUMER_COMPLAINT';
    rejectionReason = 'Reclamação de consumidor final ou cliente insatisfeito (não possui estabelecimento).';
    blockers.push('Consumidor final sem vínculo de negócio');
  } else if (jobPattern.test(text)) {
    rejectionCategory = 'JOB_OR_RECRUITMENT';
    rejectionReason = 'Oferta de emprego, contratação CLT/PJ ou busca de vaga.';
    blockers.push('Oferta ou busca de emprego');
  } else if (foreignSpanishPattern.test(text)) {
    rejectionCategory = 'FOREIGN_LANGUAGE';
    rejectionReason = 'Publicação em língua estrangeira (falso positivo de termos).';
    blockers.push('Idioma estrangeiro não condizente com mercado brasileiro');
  }

  const hasNeed = needPattern.test(text);
  const hasPain = painPattern.test(text);
  const hasSolution = solutionPattern.test(text);
  const hasBuyer = buyerPattern.test(text);

  if (!rejectionCategory && !hasSolution) {
    rejectionCategory = 'NO_SOLUTION_FIT';
    rejectionReason = 'Sem relação com recepção no WhatsApp, agendamento de serviços ou atendimento comercial.';
  } else if (!rejectionCategory && !hasNeed && !hasPain) {
    rejectionCategory = 'NO_COMMERCIAL_NEED';
    rejectionReason = 'Publicação genérica sem manifestação de dor operacional ou intenção de contratação.';
  } else if (!rejectionCategory && !hasBuyer && (hasNeed || hasPain)) {
    // Se tem dor/necessidade mas não tem evidência explícita de estabelecimento
    // Não bloqueia categoricamente, mas rebaixa para LOW e anota falta de vínculo
  }

  let score = 0;
  if (hasNeed) { score += 35; evidence.push('Busca explícita por recomendação ou sistema'); }
  if (hasPain) { score += 35; evidence.push('Dor operacional declarada (demora, sobrecarga, perda de clientes)'); }
  if (hasSolution) { score += 25; evidence.push('Necessidade diretamente compatível com a Lívia (WhatsApp, agendamento, recepção)'); }
  if (hasBuyer) { score += 20; evidence.push('Vínculo comercial com estabelecimento verificado'); }

  const detectedSegment = detectSegment(text, signal?.segment);
  if (['barbearia', 'salao_de_beleza', 'manicure_nail_designer'].includes(detectedSegment)) {
    if (hasBuyer || hasPain) {
      score += 5;
      evidence.push(`Segmento prioritário identificado: ${detectedSegment}`);
    }
  }

  score = Math.min(score, 100);

  if (!hasSolution) blockers.push('Sem relação clara com atendimento ou automação Lívia');
  if (!hasBuyer) blockers.push('Responsável pelo estabelecimento não confirmado explicitamente');

  // REGRA RIGOROSA DE QUALIFICAÇÃO:
  // Se caiu em qualquer filtro de exclusão, NÃO é qualificada.
  const isExcluded = Boolean(rejectionCategory);

  let level: IntentLevel = 'NONE';
  if (!isExcluded) {
    if (hasSolution && hasBuyer && (hasPain || hasNeed) && score >= 75) {
      level = 'HIGH';
    } else if (hasSolution && hasBuyer && (hasPain || hasNeed) && score >= 55) {
      level = 'MEDIUM';
    } else if (hasSolution && hasNeed && score >= 35) {
      // Pergunta real sobre ferramenta/sistema sem menção explícita de porte do negócio (observação)
      level = 'LOW';
    } else {
      level = 'NONE';
    }
  }

  // Se foi descartado mas ainda não tem categoria de rejeição definida:
  if (level === 'NONE' && !rejectionCategory) {
    if (!hasBuyer) {
      rejectionCategory = 'NO_BUSINESS_LINK';
      rejectionReason = 'Sem evidência de vínculo com estabelecimento comercial.';
    } else {
      rejectionCategory = 'NO_COMMERCIAL_NEED';
      rejectionReason = 'Não atingiu pontuação mínima de intenção comercial.';
    }
  }

  const decision: IntentDecision =
    level === 'HIGH' || level === 'MEDIUM' ? 'REVIEW' : level === 'LOW' ? 'WATCH' : 'DISCARD';

  const intentType: IntentType =
    hasNeed && hasBuyer ? 'COMMERCIAL' : hasNeed ? 'CURIOSITY' : hasPain ? 'INFORMATIONAL' : 'NONE';

  const urgency: UrgencyLevel =
    hasPain ? 'HIGH' : hasNeed && hasBuyer ? 'MEDIUM' : 'LOW';

  const problemDescription = extractProblemDescription(text);
  const exactEvidenceSnippet = extractExactEvidenceSnippet(text);

  const businessEvidence = hasBuyer
    ? 'Declarou vínculo explícito com estabelecimento (proprietário, equipe ou espaço próprio).'
    : 'Perfil pessoal ou consumidor; sem comprovação de estabelecimento próprio.';

  const fitWithLivia = hasSolution
    ? 'A Lívia resolve com atendimento WhatsApp 24/7 humanizado, agendamentos e lembretes automáticos.'
    : 'Necessidade apresentada não tem aderência direta ao portfólio da Lívia.';

  const suggestedApproach = generateSuggestedApproach(detectedSegment, problemDescription, text);

  // Título real da publicação: se fornecido, usa o original; se não, primeira linha não vazia
  const resolvedTitle = (signal?.title || text.split('\n')[0] || 'Publicação sem título').trim().slice(0, 150);

  const snippet = text.length > 280 ? `${text.slice(0, 277)}...` : text;
  const id = signal?.id || `intent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    score: level === 'NONE' ? 0 : score,
    level,
    decision,
    problemDescription,
    intentType,
    businessEvidence,
    fitWithLivia,
    urgency,
    segment: detectedSegment,
    evidence,
    blockers,
    sourceUrl,
    source,
    author: signal?.author,
    title: resolvedTitle,
    snippet,
    exactEvidenceSnippet,
    rejectionCategory,
    rejectionReason,
    publishedAt: signal?.publishedAt,
    suggestedApproach,
    commercialStatus: 'NOVO',
  };
}

