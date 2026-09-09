import crypto from 'node:crypto';
import type { Lead, IcpSegment, RawPlace } from './domain.js';

const clean = (value: unknown): string => String(value ?? '').trim();

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function normalizePhone(value: unknown): string | null {
  const digits = clean(value).replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function inferSegment(name: string, categories: unknown): IcpSegment | null {
  const haystack = normalizeText(`${name} ${Array.isArray(categories) ? categories.join(' ') : clean(categories)}`);
  if (/barbear|barber/.test(haystack)) return 'barbearia';
  if (/manicure|nail|unha|nails|pedicure/.test(haystack)) return 'manicure_nail_designer';
  if (/salao|cabeleireir|hair|beauty|beleza|estetica/.test(haystack)) return 'salao_de_beleza';
  return null;
}

function stableId(name: string, phone: string | null, address: string): string {
  return crypto.createHash('sha256').update(`${normalizeText(name)}|${phone ?? ''}|${normalizeText(address)}`).digest('hex').slice(0, 16);
}

export function normalizePlace(raw: RawPlace, now = new Date().toISOString()): Lead | null {
  const name = clean(raw.title ?? raw.name ?? raw.businessName);
  if (!name) return null;

  const address = clean(raw.address ?? raw.street ?? raw.fullAddress);
  const phone = normalizePhone(raw.phone ?? raw.phoneNumber ?? raw.contactPhone);
  const website = clean(raw.website ?? raw.url ?? raw.site) || null;
  const categories = raw.categories ?? raw.categoryName ?? raw.category;
  const segment = inferSegment(name, categories);

  const city = clean(raw.city ?? raw.cityName);
  const state = clean(raw.state ?? raw.stateCode);
  const country = clean(raw.country ?? raw.countryCode ?? 'Brasil');
  const googleMapsUrl = clean(raw.url ?? raw.googleMapsUrl ?? raw.placeUrl) || null;
  const sourceId = clean(raw.placeId ?? raw.cid ?? raw.googlePlaceId) || null;
  const reviewsRaw = raw.reviewsCount ?? raw.reviews ?? raw.totalReviews;
  const ratingRaw = raw.totalScore ?? raw.rating ?? raw.stars;
  const reviews = Number.isFinite(Number(reviewsRaw)) ? Number(reviewsRaw) : null;
  const rating = Number.isFinite(Number(ratingRaw)) ? Number(ratingRaw) : null;

  const id = sourceId || stableId(name, phone, address);
  return {
    id,
    name,
    segment,
    city,
    state,
    country,
    address,
    phone,
    whatsapp: phone,
    website,
    googleMapsUrl,
    rating,
    reviews,
    source: 'apify',
    sourceId,
    score: 0,
    scoreReasons: [],
    stage: 'NOVO',
    optOut: false,
    contactedAt: null,
    lastContactAt: null,
    personalizedMessage: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function dedupeLeads(leads: Lead[]): Lead[] {
  const seen = new Set<string>();
  const result: Lead[] = [];
  for (const lead of leads) {
    const key = lead.sourceId || lead.phone || `${normalizeText(lead.name)}|${normalizeText(lead.address)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(lead);
  }
  return result;
}
