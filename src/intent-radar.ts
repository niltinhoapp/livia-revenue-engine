/** Análise determinística de sinais públicos: NÃO busca usuários nem envia mensagens. */
export interface IntentSignal { text: string; sourceUrl: string; source?: string; publishedAt?: string }
export interface IntentAssessment {
  score: number; level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  decision: 'REVIEW' | 'WATCH' | 'DISCARD';
  evidence: string[]; blockers: string[]; sourceUrl: string;
}
const need = /\b(procuro|procurando|preciso|busco|indicam|recomendam|recomenda[cç][aã]o|algu[eé]m indica|qual sistema|qual ferramenta|quanto custa|or[cç]amento|contratar)\b/i;
const pain = /perdendo clientes|n[aã]o (?:dou conta|consigo) (?:de )?responder|demoro (?:a|para) responder|mensagens acumuladas|atendimento sobrecarregado/i;
const solution = /whats\s?app|atendimento|agendament|marcar hor[aá]rio|recepcionista|chatbot|assistente virtual|automa[çc][aã]o|automatizar|pedidos/i;
const buyer = /(?:tenho|meu|minha|sou don[oa]|sou propriet[aá]ri[oa]|sou gestor[ao]?)\s+(?:(?:um|uma|de|do|da)\s+)?(?:sal[aã]o|barbearia|cl[ií]nica|restaurante|pizzaria|lanchonete|neg[oó]cio|empresa|est[uú]dio)/i;
const excluded = /(?:sou cliente|como cliente|sou paciente|sou estudante|trabalho como vendedor|vendo (?:rob[oô]s|automa[çc][aã]o)|ofere[cç]o servi[cç]os|meus clientes precisam)/i;
const validUrl = (value: string) => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && Boolean(u.hostname); } catch { return false; } };
export function assessIntent(signal: IntentSignal): IntentAssessment {
  const text = typeof signal?.text === 'string' ? signal.text.trim().slice(0, 6000) : '';
  const sourceUrl = typeof signal?.sourceUrl === 'string' ? signal.sourceUrl : '';
  const evidence: string[] = [];
  const blockers: string[] = [];
  if (!validUrl(sourceUrl)) blockers.push('Fonte não verificável');
  if (text.length < 15) blockers.push('Texto insuficiente');
  if (excluded.test(text)) blockers.push('Possível não comprador ou fornecedor');
  let score = 0;
  if (need.test(text)) { score += 35; evidence.push('Busca explícita'); }
  if (pain.test(text)) { score += 35; evidence.push('Dor operacional'); }
  if (solution.test(text)) { score += 25; evidence.push('Necessidade compatível com a Lívia'); }
  if (buyer.test(text)) { score += 20; evidence.push('Vínculo declarado com negócio'); }
  score = Math.min(score, 100);
  if (!solution.test(text)) blockers.push('Sem relação clara com solução Lívia');
  if (!buyer.test(text)) blockers.push('Responsável pelo negócio não confirmado');
  const qualified = validUrl(sourceUrl) && text.length >= 15 && !excluded.test(text) && solution.test(text);
  const level: IntentAssessment['level'] = qualified && score >= 75 && buyer.test(text) ? 'HIGH' : qualified && score >= 55 ? 'MEDIUM' : qualified && score >= 25 ? 'LOW' : 'NONE';
  return { score, level, decision: level === 'HIGH' || level === 'MEDIUM' ? 'REVIEW' : level === 'LOW' ? 'WATCH' : 'DISCARD', evidence, blockers, sourceUrl };
}
