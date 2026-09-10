import fs from 'node:fs/promises';
import path from 'node:path';
import type { CrmEvent, Lead } from './domain.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const JSON_PATH = path.join(DATA_DIR, 'leads.json');
const CSV_PATH = path.join(DATA_DIR, 'leads.csv');
const EVENTS_PATH = path.join(DATA_DIR, 'crm-events.json');

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

export async function saveCrmEvents(events: CrmEvent[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(EVENTS_PATH, JSON.stringify(events, null, 2), 'utf8');
}

export async function loadCrmEvents(): Promise<CrmEvent[]> {
  try {
    return JSON.parse(await fs.readFile(EVENTS_PATH, 'utf8')) as CrmEvent[];
  } catch {
    return [];
  }
}

export async function appendCrmEvent(event: CrmEvent): Promise<void> {
  const events = await loadCrmEvents();
  events.push(event);
  await saveCrmEvents(events);
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
  return { json: JSON_PATH, csv: CSV_PATH, events: EVENTS_PATH };
}
