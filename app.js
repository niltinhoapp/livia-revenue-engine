const state = { leads: [], filtered: [], currentLeadId: null };

const CONTACTED_STORAGE_KEY = 'liviaRevenueContacted';
const PHONE_STATUS_STORAGE_KEY = 'liviaRevenuePhoneStatus';
const CRM_EVENTS_STORAGE_KEY = 'liviaRevenueCrmEvents';
const MANUAL_LEADS_STORAGE_KEY = 'liviaRevenueManualLeads';

const $ = (id) => document.getElementById(id);
const form = $('search-form');
const button = $('search-button');
const loading = $('loading');
const errorBox = $('error');
const summary = $('summary');
const results = $('results');
const table = $('lead-table');
const empty = $('empty');
const searchSegment = $('search-segment');
const selectedSegmentLabel = $('selected-segment-label');
const segmentFilter = $('segment-filter');
const scoreFilter = $('score-filter');
const drawer = $('drawer');
const drawerContent = $('drawer-content');

const segmentNames = {
  barbearia: 'Barbearias', salao_de_beleza: 'Salões de beleza', manicure_nail_designer: 'Manicure / Nail Designer',
  clinica_odontologica: 'Clínicas odontológicas', clinica_estetica: 'Clínicas de estética', academia: 'Academias',
  pet_shop: 'Pet shops', veterinaria: 'Clínicas veterinárias', restaurante: 'Restaurantes', imobiliaria: 'Imobiliárias',
  oficina_mecanica: 'Oficinas mecânicas', escola_curso: 'Escolas / Cursos',
};
const stageNames = {
  NOVO: 'Novo', QUALIFICADO: 'Qualificado', CONTATADO: 'Contatado', RESPONDEU: 'Respondeu', INTERESSADO: 'Interessado',
  DEMONSTRAÇÃO: 'Demonstração', PROPOSTA: 'Proposta', NEGOCIAÇÃO: 'Negociação', GANHO: 'Ganho', PERDIDO: 'Perdido', 'OPT-OUT': 'Opt-out',
};
const phoneStatusNames = { MISSING: 'Sem telefone', NEEDS_REVIEW: 'Precisa revisar', VERIFIED: 'Telefone verificado', REJECTED: 'Telefone rejeitado' };
const phoneStatusReasons = {
  MISSING: 'O Google Maps não forneceu um telefone empresarial utilizável.',
  NEEDS_REVIEW: 'O telefone tem estrutura válida, mas ainda precisa ser confirmado como pertencente ao estabelecimento.',
  VERIFIED: 'O telefone foi confirmado manualmente como pertencente ao estabelecimento.',
  REJECTED: 'O telefone foi considerado incorreto ou inválido e não deve ser usado para contato.',
};
const crmEventNames = {
  PHONE_VERIFIED: 'Telefone verificado', PHONE_REJECTED: 'Telefone rejeitado', MESSAGE_PREPARED: 'Mensagem preparada',
  CONTACTED: 'Contato realizado', STAGE_CHANGED: 'Etapa alterada', NOTE_ADDED: 'Nota adicionada', OPT_OUT: 'Opt-out', LEAD_UPDATED: 'Lead atualizado',
};
const genericApproachTemplates = [
  (name) => `Oi, tudo bem? Vi a ${name} e queria te fazer uma pergunta rápida. Hoje vocês conseguem responder todos os clientes que chamam pelo WhatsApp, mesmo nos horários mais corridos? Trabalho com uma recepcionista virtual que cuida desse primeiro atendimento. Se fizer sentido, posso te mostrar como funciona.`,
  (name) => `Oi! Tudo certo? Vi a ${name} e fiquei curioso: quando chegam mensagens no WhatsApp enquanto vocês estão atendendo, alguém consegue responder todos os clientes? A Livia foi criada para ajudar nesse primeiro atendimento. Posso te mostrar rapidamente como funciona?`,
  (name) => `Oi! Tudo bem? Vi a ${name} e queria entender uma coisa: vocês já têm alguma forma de atender automaticamente quem chama no WhatsApp quando a equipe está ocupada? Tenho uma solução de recepção virtual para esse primeiro contato. Se quiser, te mostro sem compromisso.`,
];
const approachTemplates = Object.fromEntries(Object.keys(segmentNames).map((segment) => [segment, genericApproachTemplates]));

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function scoreClass(score) { if (score >= 80) return 'score high'; if (score >= 60) return 'score good'; return 'score'; }
function formatPhone(phone) { if (!phone) return '—'; const digits = String(phone).replace(/\D/g, ''); if (digits.startsWith('55') && digits.length === 13) return `+55 (${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`; if (digits.startsWith('55') && digits.length === 12) return `+55 (${digits.slice(2,4)}) ${digits.slice(4,8)}-${digits.slice(8)}`; return phone; }
function formatRating(rating, reviews) { if (rating == null) return '—'; return `${rating}${reviews != null ? ` · ${reviews} avaliações` : ''}`; }
function normalizedPhone(phone) { const digits = String(phone || '').replace(/\D/g, ''); if (!digits) return ''; if (digits.startsWith('55')) return digits; if (digits.length === 10 || digits.length === 11) return `55${digits}`; return digits; }

function readContacted() { try { const value = JSON.parse(localStorage.getItem(CONTACTED_STORAGE_KEY) || '[]'); return new Set(Array.isArray(value) ? value.map(String) : []); } catch { return new Set(); } }
function writeContacted(contacted) { localStorage.setItem(CONTACTED_STORAGE_KEY, JSON.stringify([...contacted])); }
function isContacted(lead) { return readContacted().has(String(lead.id)) || lead.stage === 'CONTATADO'; }

function isDemoLead(lead) { return Boolean(lead && lead.isDemo); }
function isManualLead(lead) { return Boolean(lead && lead.source === 'manual'); }
function readManualLeads() { try { const value = JSON.parse(localStorage.getItem(MANUAL_LEADS_STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function writeManualLeads(leads) { localStorage.setItem(MANUAL_LEADS_STORAGE_KEY, JSON.stringify(leads)); }
function persistManualLeads() { writeManualLeads(state.leads.filter(isManualLead)); }
function findLeadByPhone(phone) { const target = normalizedPhone(phone); if (!target) return null; return state.leads.find((lead) => !isDemoLead(lead) && normalizedPhone(lead.phone) === target) || null; }

function readPhoneStatusOverrides() { try { const value = JSON.parse(localStorage.getItem(PHONE_STATUS_STORAGE_KEY) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } }
function writePhoneStatusOverrides(overrides) { localStorage.setItem(PHONE_STATUS_STORAGE_KEY, JSON.stringify(overrides)); }
function getPhoneStatus(lead) { const override = readPhoneStatusOverrides()[String(lead.id)]; return override || lead.phoneStatus || (lead.phone ? 'NEEDS_REVIEW' : 'MISSING'); }
function setPhoneStatus(lead, status) { const overrides = readPhoneStatusOverrides(); overrides[String(lead.id)] = status; writePhoneStatusOverrides(overrides); lead.phoneStatus = status; }
function canOpenWhatsApp(lead) { return Boolean(lead.phone) && !lead.optOut && getPhoneStatus(lead) === 'VERIFIED'; }

function readCrmEvents() { try { const value = JSON.parse(localStorage.getItem(CRM_EVENTS_STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function writeCrmEvents(events) { localStorage.setItem(CRM_EVENTS_STORAGE_KEY, JSON.stringify(events.slice(-1000))); }
function recordCrmEvent(lead, type, details = {}) {
  if (!lead || !lead.id) return;
  const event = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, leadId: String(lead.id), type, occurredAt: new Date().toISOString(), ...details };
  const events = readCrmEvents(); events.push(event); writeCrmEvents(events);
}
function getLeadEvents(lead) { return readCrmEvents().filter((event) => String(event.leadId) === String(lead.id)).sort((a,b) => new Date(b.occurredAt) - new Date(a.occurredAt)); }
function formatEventDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR'); }
function renderCrmHistory(lead) {
  const events = getLeadEvents(lead);
  if (!events.length) return '<div class="detail-section"><h3>Histórico CRM</h3><div class="muted">Nenhum evento operacional registrado ainda.</div></div>';
  const items = events.slice(0, 20).map((event) => {
    const label = crmEventNames[event.type] || event.type;
    const detail = event.message || event.note || (event.fromStage && event.toStage ? `${stageNames[event.fromStage] || event.fromStage} → ${stageNames[event.toStage] || event.toStage}` : '');
    return `<div class="reason"><strong>${escapeHtml(label)}</strong> · ${escapeHtml(formatEventDate(event.occurredAt))}${detail ? `<div class="muted">${escapeHtml(detail)}</div>` : ''}</div>`;
  }).join('');
  return `<div class="detail-section"><h3>Histórico CRM</h3>${items}</div>`;
}

function phoneStatusClass(status) { return `phone-status phone-status-${String(status || '').toLowerCase()}`; }
function renderPhoneVerification(lead) {
  const status = getPhoneStatus(lead); const hasMaps = Boolean(lead.googleMapsUrl); const statusLabel = phoneStatusNames[status] || 'Status desconhecido'; const reason = phoneStatusReasons[status] || 'Revise os dados antes de usar o telefone.';
  let actions = '';
  if (status === 'NEEDS_REVIEW') actions = `<div class="detail-actions">${hasMaps ? `<a class="secondary" href="${escapeHtml(lead.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">Conferir no Maps</a>` : ''}${lead.website ? `<a class="secondary" href="${escapeHtml(lead.website)}" target="_blank" rel="noopener noreferrer">Conferir site</a>` : ''}<button class="secondary" type="button" id="phone-verify">Confirmar telefone</button><button class="secondary" type="button" id="phone-reject">Reprovar telefone</button></div>`;
  else if (status === 'VERIFIED') actions = '<div class="detail-actions"><button class="secondary" type="button" id="phone-reject">Reprovar telefone</button></div>';
  else if (status === 'REJECTED') actions = `<div class="detail-actions">${hasMaps ? `<a class="secondary" href="${escapeHtml(lead.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">Revisar no Maps</a>` : ''}${lead.website ? `<a class="secondary" href="${escapeHtml(lead.website)}" target="_blank" rel="noopener noreferrer">Revisar site</a>` : ''}${lead.phone ? '<button class="secondary" type="button" id="phone-verify">Confirmar após revisão</button>' : ''}</div>`;
  return `<div class="detail-section"><h3>Validação do telefone</h3><div class="${phoneStatusClass(status)}"><strong>${escapeHtml(statusLabel)}</strong></div><div class="muted">${escapeHtml(reason)}</div>${actions}${status !== 'VERIFIED' ? '<div class="approach-note">Somente telefone VERIFICADO libera a abertura do WhatsApp. A verificação do telefone não autoriza o envio de mensagens por si só.</div>' : '<div class="approach-note">Telefone confirmado. Ainda é necessário revisar a autorização/base adequada para o contato antes de enviar qualquer mensagem.</div>'}</div>`;
}

function getApproachVariations(lead) { const name = String(lead.name || '').trim(); const templates = approachTemplates[lead.segment] || genericApproachTemplates; return templates.map((template) => template(name || 'seu negócio')); }
function renderApproach(lead, variationIndex = 0) {
  const variations = getApproachVariations(lead); const index = ((variationIndex % variations.length) + variations.length) % variations.length; const whatsappAllowed = canOpenWhatsApp(lead); const phoneStatus = getPhoneStatus(lead);
  return `<div class="detail-section"><h3>Abordagem</h3><p class="approach-help">Prepare uma mensagem personalizada para iniciar a conversa. O envio não é automático.</p><textarea id="approach-message" class="approach-message" maxlength="450" aria-label="Mensagem de abordagem">${escapeHtml(variations[index])}</textarea><div class="approach-meta"><span>Variação ${index + 1} de ${variations.length}</span><span id="approach-count">${variations[index].length}/450</span></div><div class="detail-actions approach-actions"><button class="secondary" type="button" id="approach-another">Gerar outra</button><button class="secondary" type="button" id="approach-copy">Copiar</button></div><div class="detail-actions approach-actions">${whatsappAllowed ? '<button class="primary" type="button" id="approach-whatsapp">Abrir WhatsApp</button>' : `<button class="secondary" type="button" disabled title="O telefone precisa estar VERIFICADO">WhatsApp bloqueado · ${escapeHtml(phoneStatusNames[phoneStatus] || 'telefone não verificado')}</button>`}<button class="secondary" type="button" id="approach-contacted">${isContacted(lead) ? 'Já está CONTATADO' : 'Marcar como CONTATADO'}</button></div><div class="approach-note">WhatsApp não é enviado automaticamente. Revise a mensagem antes de continuar.</div></div>`;
}

async function copyApproach() {
  const textarea = $('approach-message'); if (!textarea) return;
  try { await navigator.clipboard.writeText(textarea.value); } catch { textarea.focus(); textarea.select(); document.execCommand('copy'); }
  const lead = state.leads.find((item) => item.id === state.currentLeadId); if (lead) recordCrmEvent(lead, 'MESSAGE_PREPARED', { message: textarea.value.trim() });
  const copyButton = $('approach-copy'); if (copyButton) { const original = copyButton.textContent; copyButton.textContent = 'Copiado!'; setTimeout(() => { copyButton.textContent = original; }, 1200); }
}

function openWhatsApp(lead) { if (!canOpenWhatsApp(lead)) return; const phone = normalizedPhone(lead.phone); const textarea = $('approach-message'); const message = textarea ? textarea.value.trim() : ''; if (!phone || !message) return; window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer'); }

function markLeadContacted(id) {
  const contacted = readContacted(); contacted.add(String(id)); writeContacted(contacted);
  const lead = state.leads.find((item) => item.id === id); if (!lead) return;
  const fromStage = lead.stage; lead.stage = 'CONTATADO'; const now = new Date().toISOString(); lead.contactedAt = lead.contactedAt || now; lead.lastContactAt = now;
  recordCrmEvent(lead, 'CONTACTED');
  if (fromStage !== 'CONTATADO') recordCrmEvent(lead, 'STAGE_CHANGED', { fromStage, toStage: 'CONTATADO' });
  renderTable();
}

async function searchLeads(event) {
  event.preventDefault(); const city = $('city').value.trim(); const max = $('max').value; const segment = searchSegment.value; if (!city || !segment) return;
  errorBox.classList.add('hidden'); loading.classList.remove('hidden'); button.disabled = true; button.textContent = 'Buscando...';
  try {
    const response = await fetch(`/api?city=${encodeURIComponent(city)}&segment=${encodeURIComponent(segment)}&max=${encodeURIComponent(max)}`); const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível concluir a busca.');
    const manualLeads = state.leads.filter(isManualLead); state.leads = [...(Array.isArray(data.leads) ? data.leads : []), ...manualLeads]; const contacted = readContacted(); state.leads.forEach((lead) => { if (contacted.has(String(lead.id))) lead.stage = 'CONTATADO'; });
    updateSummary(data); renderTable(); summary.classList.remove('hidden'); results.classList.remove('hidden');
  } catch (error) { errorBox.textContent = error instanceof Error ? error.message : 'Erro inesperado.'; errorBox.classList.remove('hidden'); }
  finally { loading.classList.add('hidden'); button.disabled = false; button.textContent = 'Buscar empresas'; }
}
function updateSummary(data) { const revenueLeads = state.leads.filter((lead) => !isDemoLead(lead)); $('metric-found').textContent = data.collected ?? revenueLeads.length; $('metric-qualified').textContent = data.qualified ?? revenueLeads.filter((lead) => lead.stage === 'QUALIFICADO').length; $('metric-phone').textContent = revenueLeads.filter((lead) => Boolean(lead.phone)).length; const found = Number(data.collected ?? revenueLeads.length); const qualified = Number(data.qualified ?? 0); $('metric-rate').textContent = found ? `${Math.round((qualified / found) * 100)}%` : '0%'; selectedSegmentLabel.textContent = segmentNames[data.segment] || segmentNames[searchSegment.value] || 'Segmento selecionado'; }
function leadRowHtml(lead) { const origin = isManualLead(lead) ? `<span class="origin-tag">${isDemoLead(lead) ? 'Demonstração' : 'Cadastro manual'}</span>` : ''; const sub = escapeHtml([lead.city, lead.state].filter(Boolean).join(' · ')); return `<tr${isDemoLead(lead) ? ' class="demo-row"' : ''}><td><div class="company">${escapeHtml(lead.name)}${origin}</div><div class="muted">${sub}</div></td><td><span class="segment-label">${escapeHtml(segmentNames[lead.segment] || 'Outro')}</span></td><td><span class="${scoreClass(Number(lead.score || 0))}">${Number(lead.score || 0)}</span></td><td>${escapeHtml(formatPhone(lead.phone))}</td><td><span class="stage">${escapeHtml(isDemoLead(lead) ? 'Demonstração' : (isContacted(lead) ? stageNames.CONTATADO : (stageNames[lead.stage] || lead.stage || '—')))}</span></td><td><button class="details-btn" data-lead-id="${escapeHtml(lead.id)}">Ver lead</button></td></tr>`; }
function renderTable() { const segment = segmentFilter.value; const minimumScore = Number(scoreFilter.value); state.filtered = state.leads.filter((lead) => !isDemoLead(lead) && (segment === 'all' || lead.segment === segment) && Number(lead.score || 0) >= minimumScore); const demoLeads = state.leads.filter(isDemoLead); table.innerHTML = state.filtered.map(leadRowHtml).join('') + demoLeads.map(leadRowHtml).join(''); empty.classList.toggle('hidden', state.filtered.length + demoLeads.length !== 0); $('results-subtitle').textContent = `${state.filtered.length} lead${state.filtered.length === 1 ? '' : 's'} exibido${state.filtered.length === 1 ? '' : 's'} · ${segmentNames[searchSegment.value] || 'segmento'} · resultado da última busca${demoLeads.length ? ` · ${demoLeads.length} demonstração${demoLeads.length === 1 ? '' : 'ões'} (fora do funil)` : ''}`; }

function bindApproach(lead, variationIndex) {
  const textarea = $('approach-message'); const count = $('approach-count'); if (textarea && count) textarea.addEventListener('input', () => { count.textContent = `${textarea.value.length}/450`; });
  $('approach-another')?.addEventListener('click', () => { const nextIndex = (variationIndex + 1) % getApproachVariations(lead).length; const section = document.querySelector('.detail-section .approach-help')?.closest('.detail-section'); if (!section) return; section.outerHTML = renderApproach(lead, nextIndex); bindApproach(lead, nextIndex); });
  $('approach-copy')?.addEventListener('click', copyApproach); $('approach-whatsapp')?.addEventListener('click', () => openWhatsApp(lead));
  $('approach-contacted')?.addEventListener('click', () => { markLeadContacted(lead.id); const contactButton = $('approach-contacted'); if (contactButton) { contactButton.textContent = 'Já está CONTATADO'; contactButton.disabled = true; } openLead(lead.id); });
}
function bindPhoneVerification(lead) {
  $('phone-verify')?.addEventListener('click', () => { setPhoneStatus(lead, 'VERIFIED'); recordCrmEvent(lead, 'PHONE_VERIFIED'); openLead(lead.id); });
  $('phone-reject')?.addEventListener('click', () => { setPhoneStatus(lead, 'REJECTED'); recordCrmEvent(lead, 'PHONE_REJECTED'); openLead(lead.id); });
}
function openLead(id) {
  const lead = state.leads.find((item) => item.id === id); if (!lead) return; state.currentLeadId = id;
  const reasons = Array.isArray(lead.scoreReasons) && lead.scoreReasons.length ? lead.scoreReasons.map((reason) => `<div class="reason">• ${escapeHtml(reason)}</div>`).join('') : '<div class="muted">Sem justificativas registradas.</div>';
  drawerContent.innerHTML = `<div class="detail-eyebrow">Lead · ${escapeHtml(isContacted(lead) ? stageNames.CONTATADO : (stageNames[lead.stage] || lead.stage || 'Novo'))}</div><h2 class="detail-title">${escapeHtml(lead.name)}</h2><span class="detail-score">Score ${Number(lead.score || 0)}</span><div class="detail-grid"><div class="detail-item"><span>Segmento</span><strong>${escapeHtml(segmentNames[lead.segment] || 'Não identificado')}</strong></div><div class="detail-item"><span>Avaliação</span><strong>${escapeHtml(formatRating(lead.rating, lead.reviews))}</strong></div><div class="detail-item"><span>Telefone</span><strong>${escapeHtml(formatPhone(lead.phone))}</strong></div><div class="detail-item"><span>Cidade</span><strong>${escapeHtml([lead.city, lead.state].filter(Boolean).join(' · ') || '—')}</strong></div><div class="detail-item"><span>Origem</span><strong>${escapeHtml(isDemoLead(lead) ? 'Demonstração (manual)' : (isManualLead(lead) ? 'Cadastro manual' : 'Google Maps'))}</strong></div></div>${renderPhoneVerification(lead)}<div class="detail-section"><h3>Por que foi qualificado</h3>${reasons}</div><div class="detail-section"><h3>Endereço</h3><div class="muted">${escapeHtml(lead.address || 'Não informado')}</div></div><div class="detail-section"><h3>Links</h3><div class="detail-actions">${lead.googleMapsUrl ? `<a class="secondary" href="${escapeHtml(lead.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">Abrir no Maps</a>` : ''}${lead.website ? `<a class="secondary" href="${escapeHtml(lead.website)}" target="_blank" rel="noopener noreferrer">Abrir site</a>` : ''}</div></div>${renderApproach(lead)}${renderCrmHistory(lead)}`;
  bindPhoneVerification(lead); bindApproach(lead, 0); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
}
function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }

form.addEventListener('submit', searchLeads);
searchSegment.addEventListener('change', () => { selectedSegmentLabel.textContent = segmentNames[searchSegment.value] || 'Segmento selecionado'; });
segmentFilter.addEventListener('change', renderTable); scoreFilter.addEventListener('change', renderTable);
table.addEventListener('click', (event) => { const buttonElement = event.target.closest('[data-lead-id]'); if (buttonElement) openLead(buttonElement.dataset.leadId); });
$('drawer-close').addEventListener('click', closeDrawer); $('drawer-backdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

function revealResults() { summary.classList.remove('hidden'); results.classList.remove('hidden'); }
function hydrateManualLeads() {
  const stored = readManualLeads();
  if (!stored.length) return;
  const known = new Set(state.leads.map((lead) => String(lead.id)));
  stored.forEach((lead) => { if (!known.has(String(lead.id))) state.leads.push(lead); });
  revealResults(); renderTable(); updateSummary({});
}
hydrateManualLeads();