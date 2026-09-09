import 'dotenv/config';
import fs from 'node:fs/promises';
import { collectFromApify } from './apify.js';
import { personalizeQualified } from './ai.js';
import { dedupeLeads, normalizePlace } from './normalize.js';
import { qualifyAll } from './qualify.js';
import { buildQueries } from './queries.js';
import { dataPaths, loadLeads, saveLeads } from './storage.js';
import type { Lead, RawPlace } from './domain.js';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const has = (name: string): boolean => process.argv.includes(name);

async function loadRaw(file: string): Promise<RawPlace[]> {
  const content = await fs.readFile(file, 'utf8');
  if (file.endsWith('.json')) return JSON.parse(content) as RawPlace[];
  throw new Error('Importação aceita JSON nesta primeira versão.');
}

async function collect() {
  const city = arg('--city') || process.env.DEFAULT_CITY || 'Macatuba, SP, Brasil';
  const max = Number(arg('--max') || 100);
  const queries = buildQueries(city);
  console.log(`Coletando até ${max} resultados por busca: ${city}`);
  const raw = await collectFromApify({ queries, maxItems: max });
  const normalized = raw.map((item) => normalizePlace(item)).filter((x): x is Lead => Boolean(x));
  const qualified = qualifyAll(dedupeLeads(normalized));
  await saveLeads(qualified);
  printSummary(qualified);
}

async function importJson() {
  const file = arg('--file');
  if (!file) throw new Error('Use --file caminho/arquivo.json');
  const raw = await loadRaw(file);
  const normalized = raw.map((item) => normalizePlace(item)).filter((x): x is Lead => Boolean(x));
  const qualified = qualifyAll(dedupeLeads(normalized));
  await saveLeads(qualified);
  printSummary(qualified);
}

async function personalize() {
  const leads = await loadLeads();
  if (!leads.length) throw new Error('Nenhum lead em data/leads.json. Rode collect ou import primeiro.');
  const updated = await personalizeQualified(leads);
  await saveLeads(updated);
  console.log(`Personalização concluída. ${updated.filter((x) => Boolean(x.personalizedMessage)).length} mensagens geradas.`);
}

async function show() {
  const leads = await loadLeads();
  printSummary(leads);
  for (const lead of leads.filter((x) => x.stage === 'QUALIFICADO').slice(0, 20)) {
    console.log(`${lead.score}\t${lead.segment}\t${lead.name}\t${lead.phone ?? '-'}\t${lead.personalizedMessage ?? ''}`);
  }
}

function printSummary(leads: Lead[]) {
  const qualified = leads.filter((x) => x.stage === 'QUALIFICADO').length;
  const withPhone = leads.filter((x) => Boolean(x.phone)).length;
  console.log(`Leads: ${leads.length} | Qualificados: ${qualified} | Com telefone: ${withPhone}`);
  console.log(`Arquivos: ${dataPaths().json} | ${dataPaths().csv}`);
}

async function main() {
  const command = process.argv[2];
  if (command === 'collect') return collect();
  if (command === 'import') return importJson();
  if (command === 'personalize') return personalize();
  if (command === 'show') return show();
  if (has('--help') || !command) {
    console.log(`Uso:\n  npm run prospect -- collect --city "Bauru, SP, Brasil" --max 100\n  npm run prospect -- import --file ./data/raw.json\n  npm run prospect -- personalize\n  npm run prospect -- show`);
    return;
  }
  throw new Error(`Comando desconhecido: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
