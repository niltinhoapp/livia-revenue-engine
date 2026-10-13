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
  publishedAt?: string;
  suggestedApproach: string;
  commercialStatus: OpportunityCommercialStatus;
}

const needPattern = /\b(procuro|procurando|preciso|precisando|busco|buscando|indicam|recomenda[cç][aã]o|recomendam|algu[eé]m indica|algu[eé]m recomenda|algu[eé]m usa|qual sistema|qual software|qual ferramenta|qual aplicativo|qual app|qual programa|quanto custa|or[cç]amento|contratar|querendo colocar|pensando em colocar|como automatizar|como voc[eê]s fazem|como voc[eê]s atendem|dicas de sistema|dicas de ferramenta|preciso de uma? (?:recepcionista|secret[aá]ria|atendente)|procuro (?:recepcionista|secret[aá]ria|atendente)|quero automatizar)\b/i;

const painPattern = /\b(perdendo clientes?|perco clientes?|n[aã]o (?:dou conta|consigo|d[aá] conta) (?:de )?responder|demoro (?:a|para) responder|demora (?:no|para) atendimento|mensagens acumuladas?|mensagens acumulando|mensagens atrasadas?|whatsapp lotado|caixa de entrada cheia|atendimento sobrecarregado|clientes reclamando|reclama[cç][aã]o de demora|muita mensagem no whatsapp|n[aã]o dou conta de atender|responder e atender ao mesmo tempo|responder e cortar|perco muito tempo respondendo|deixo clientes esperando|atendimento demorado|deixar cliente no v[aá]cuo|n[aã]o responder a tempo)\b/i;

const solutionPattern = /\b(whats\s?app|atendimento|agendament[oa]s?|marcar hor[aá]rio|marcar consulta|recepcionista|secret[aá]ria|chatbot|assistente virtual|automa[çc][aã]o|automatizar|pedidos|atendente virtual|ia no atendimento|bot de atendimento|resposta autom[aá]tica|lembrete de hor[aá]rio|confirma[cç][aã]o de hor[aá]rio|sistema para sal[aã]o|sistema para barbearia|software para sal[aã]o|app de agendamento)\b/i;

const buyerPattern = /(?:(?:tenho|meu|minha|aqui n[ao]|sou don[oa]|sou propriet[aá]ri[oa]|sou gestor[ao]?|sou s[oó]ci[oa]|sou gerente)\s+(?:(?:de|do|da|um|uma|nosso|nossa)\s+){0,3}(?:sal[aã]o|barbearia|esmalteria|studio|est[uú]dio|cl[ií]nica|consult[oó]rio|restaurante|pizzaria|lanchonete|neg[oó]cio|empresa|com[eé]rcio|loja|espa[cç]o)|(?:sou (?:barbeiro|cabeleireir[oa]|manicure|nail designer|lash designer|tatuador[a]?|esteticista|m[eé]dic[oa]|dentista|fisioterapeuta))|(?:na minha barbearia|no meu sal[aã]o|na minha cl[ií]nica|no meu est[uú]dio|na minha esmalteria|aqui na barbearia|aqui no sal[aã]o|aqui na cl[ií]nica|meu neg[oó]cio|meus clientes agendam))/i;

const excludedPattern = /(?:(?:sou cliente|como cliente|fui cliente|fui atendid[oa]|sou paciente|como paciente|fui na barbearia e|fui no sal[aã]o e|o atendimento que recebi|precisei marcar|fui tentar marcar|para minha (?:av[oó]|m[aã]e|fam[ií]lia)|como usu[aá]rio)|(?:sou estudante|projeto de faculdade|trabalho da faculdade|tutorial de como|aula de|curso de)|(?:trabalho como vendedor|vendo (?:rob[oô]s?|automa[çc][aã]o|chatbots?|leads?)|ofere[cç]o servi[cç]os?|crio automa[cç][aã]o|desenvolvo (?:rob[oô]s?|bots?)|fa[cç]o tr[aá]fego|sou afiliad[oa]|compre meu|arraste pra cima)|(?:procuro vaga|busco vaga|envio meu curr[ií]culo|vaga de emprego|procuro emprego)|(?:pior desgra[cç]a|odeio chatbot))/i;

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
  return 'Necessidade de modernização e organização do atendimento de clientes.';
}

function generateSuggestedApproach(segment: string, problem: string, text: string): string {
  const isSalonOrBarber = ['barbearia', 'salao_de_beleza', 'manicure_nail_designer'].includes(segment);
  const segmentLabel = segment === 'barbearia'
    ? 'na barbearia'
    : segment === 'salao_de_beleza'
    ? 'no salão'
    : segment === 'manicure_nail_designer'
    ? 'no espaço de unhas/esmalteria'
    : 'no seu negócio';

  if (/agendament/i.test(text)) {
    return `Olá! Vi seu comentário sobre sistema de agendamento ${segmentLabel}. A Lívia foi desenvolvida exatamente para resolver isso: ela atende no WhatsApp 24/7, apresenta os horários disponíveis e confirma o agendamento automaticamente sem você precisar parar o atendimento manual. Se fizer sentido, posso te mostrar como funciona em 2 minutos!`;
  }
  if (/perdendo clientes|demoro|n[aã]o (?:dou conta|consigo)/i.test(text)) {
    return `Olá! Vi seu relato sobre a correria de responder o WhatsApp ${segmentLabel}. Criamos a Lívia para cuidar desse primeiro atendimento imediato com IA humanizada, para você nunca mais deixar um cliente esperando ou perder agendamento nos horários de pico. Posso te enviar uma breve demonstração de como ela atende?`;
  }
  return `Olá! Vi seu post buscando soluções de atendimento e automação para WhatsApp ${segmentLabel}. A Lívia é uma recepcionista virtual inteligente que cuida de tirar dúvidas e agendar clientes com total naturalidade. Se você ainda estiver avaliando opções, fico à disposição para te apresentar sem compromisso!`;
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
  if (excludedPattern.test(text)) blockers.push('Possível fornecedor de bot, estudante ou não comprador');

  const hasNeed = needPattern.test(text);
  const hasPain = painPattern.test(text);
  const hasSolution = solutionPattern.test(text);
  const hasBuyer = buyerPattern.test(text);

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

  const qualified = isUrlValid && text.length >= 15 && !excludedPattern.test(text) && hasSolution;

  let level: IntentLevel = 'NONE';
  if (qualified && score >= 75 && hasBuyer) {
    level = 'HIGH';
  } else if (qualified && score >= 55 && (hasBuyer || hasPain)) {
    level = 'MEDIUM';
  } else if (qualified && score >= 25) {
    level = 'LOW';
  } else {
    level = 'NONE';
  }

  const decision: IntentDecision =
    level === 'HIGH' || level === 'MEDIUM' ? 'REVIEW' : level === 'LOW' ? 'WATCH' : 'DISCARD';

  const intentType: IntentType =
    hasNeed && hasBuyer ? 'COMMERCIAL' : hasNeed ? 'CURIOSITY' : hasPain ? 'INFORMATIONAL' : 'NONE';

  const urgency: UrgencyLevel =
    hasPain ? 'HIGH' : hasNeed && hasBuyer ? 'MEDIUM' : 'LOW';

  const problemDescription = extractProblemDescription(text);
  const businessEvidence = hasBuyer
    ? 'Declarou vínculo com estabelecimento (proprietário, equipe ou espaço próprio).'
    : 'Não foi possível confirmar se é o proprietário do estabelecimento.';

  const fitWithLivia = hasSolution
    ? 'A Lívia resolve com atendimento WhatsApp 24/7 humanizado, agendamentos e lembretes automáticos.'
    : 'Necessidade apresentada não tem aderência direta ao portfólio da Lívia.';

  const suggestedApproach = generateSuggestedApproach(detectedSegment, problemDescription, text);

  const snippet = text.length > 280 ? `${text.slice(0, 277)}...` : text;

  const id = signal?.id || `intent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    score,
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
    title: signal?.title,
    snippet,
    publishedAt: signal?.publishedAt,
    suggestedApproach,
    commercialStatus: 'NOVO',
  };
}
