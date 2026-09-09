import fs from 'node:fs/promises';
import path from 'node:path';
import type { Lead } from './domain.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const JSON_PATH = path.join(DATA_DIR, 'leads.json');
const CSV_PATH = path.join(DATA_DIR, 'leads.csv');

export async function saveLeads(leads: Lead[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, JSON.stringify(leads, null, 2), 'utf8');
  await fs.writeFile(CSV_PATH, toCsv(leads), 'utf8');
}

export async function loadLeads(): Promise<Lead[]> {
  try {
    return JSON.parse(await fs.readFile(JSON_PATH, 'utf8')) as Lead[];
  } catch {
    return [];
  }
}

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(leads: Lead[]): string {
  const columns: (keyof Lead)[] = [
    'id','name','segment','city','state','country','address','phone','whatsapp','website',
    'googleMapsUrl','rating','reviews','source','sourceId','score','scoreReasons','stage',
    'optOut','contactedAt','lastContactAt','personalizedMessage','notes','createdAt','updatedAt'
  ];
  const rows = [columns.map(csvCell).join(',')];
  for (const lead of leads) {
    rows.push(columns.map((column) => csvCell(Array.isArray(lead[column]) ? lead[column].join(' | ') : lead[column])).join(','));
  }
  return `${rows.join('\n')}\n`;
}

export function dataPaths() {
  return { json: JSON_PATH, csv: CSV_PATH };
}
