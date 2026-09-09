import OpenAI from 'openai';
import type { Lead } from './domain.js';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function personalizeLead(lead: Lead): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurado.');

  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  const response = await client.responses.create({
    model,
    store: false,
    instructions: [
      'Você é especialista em prospecção B2B da ConnectWeb.',
      'Escreva uma abordagem curta, humana e personalizada para o responsável por um negócio local.',
      'Oferta: Livia, uma recepcionista virtual que atende clientes no WhatsApp enquanto o negócio trabalha.',
      'Não diga que encontrou dados privados. Não invente funcionalidades, resultados ou informações.',
      'Não use pressão, urgência falsa ou spam. Não faça promessas de agendamento/integracões que não foram confirmadas.',
      'A mensagem deve convidar para conhecer a solução, sem tentar fechar a venda na primeira frase.',
      'Português do Brasil. Máximo de 450 caracteres.',
    ].join('\n'),
    input: JSON.stringify({
      empresa: lead.name,
      segmento: lead.segment,
      cidade: lead.city,
      avaliacao: lead.rating,
      quantidadeAvaliacoes: lead.reviews,
      site: lead.website,
    }),
  });

  return response.output_text.trim();
}

export async function personalizeQualified(leads: Lead[]): Promise<Lead[]> {
  const result: Lead[] = [];
  for (const lead of leads) {
    if (lead.score < 60 || !lead.phone || lead.optOut) {
      result.push(lead);
      continue;
    }
    try {
      const message = await personalizeLead(lead);
      result.push({ ...lead, personalizedMessage: message, updatedAt: new Date().toISOString() });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'erro desconhecido';
      result.push({ ...lead, notes: `IA: ${reason}`, updatedAt: new Date().toISOString() });
    }
  }
  return result;
}
