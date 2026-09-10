const state = { leads: [], filtered: [], currentLeadId: null };

const CONTACTED_STORAGE_KEY = 'liviaRevenueContacted';

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
  barbearia: 'Barbearias',
  salao_de_beleza: 'Salões de beleza',
  manicure_nail_designer: 'Manicure / Nail Designer',
  clinica_odontologica: 'Clínicas odontológicas',
  clinica_estetica: 'Clínicas de estética',
  academia: 'Academias',
  pet_shop: 'Pet shops',
  veterinaria: 'Clínicas veterinárias',
  restaurante: 'Restaurantes',
  imobiliaria: 'Imobiliárias',
  oficina_mecanica: 'Oficinas mecânicas',
  escola_curso: 'Escolas / Cursos',
};

const stageNames = {
  NOVO: 'Novo',
  QUALIFICADO: 'Qualificado',
  CONTATADO: 'Contatado',
  RESPONDEU: 'Respondeu',
  INTERESSADO: 'Interessado',
  DEMONSTRAÇÃO: 'Demonstração',
  PROPOSTA: 'Proposta',
  NEGOCIAÇÃO: 'Negociação',
  GANHO: 'Ganho',
  PERDIDO: 'Perdido',
  'OPT-OUT': 'Opt-out',
};

const genericApproachTemplates = [
  (name) => `Oi, tudo bem? Vi a ${name} e queria te fazer uma pergunta rápida. Hoje vocês conseguem responder todos os clientes que chamam pelo WhatsApp, mesmo nos horários mais corridos? Trabalho com uma recepcionista virtual que cuida desse primeiro atendimento. Se fizer sentido, posso te mostrar como funciona.`,
  (name) => `Oi! Tudo certo? Vi a ${name} e fiquei curioso: quando chegam mensagens no WhatsApp enquanto vocês estão atendendo, alguém consegue responder todos os clientes? A Livia foi criada para ajudar nesse primeiro atendimento. Posso te mostrar rapidamente como funciona?`,
  (name) => `Oi! Tudo bem? Vi a ${name} e queria entender uma coisa: vocês já têm alguma forma de atender automaticamente quem chama no WhatsApp quando a equipe está ocupada? Tenho uma solução de recepção virtual para esse primeiro contato. Se quiser, te mostro sem compromisso.`,
];

const approachTemplates = {
  barbearia: genericApproachTemplates,
  salao_de_beleza: genericApproachTemplates,
  manicure_nail_designer: genericApproachTemplates,
  clinica_odontologica: genericApproachTemplates,
  clinica_estetica: genericApproachTemplates,
  academia: genericApproachTemplates,
  pet_shop: genericApproachTemplates,
  veterinaria: genericApproachTemplates,
  restaurante: genericApproachTemplates,
  imobiliaria: genericApproachTemplates,
  oficina_mecanica: genericApproachTemplates,
  escola_curso: genericApproachTemplates,
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function scoreClass(score) {
  if (score >= 80) return 'score high';
  if (score >= 60) return 'score good';
  return 'score';
}

function formatPhone(phone) {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length === 13) return `+55 (${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`;
  if (digits.startsWith('55') && digits.length === 12) return `+55 (${digits.slice(2,4)}) ${digits.slice(4,8)}-${digits.slice(8)}`;
  return phone;
}

function formatRating(rating, reviews) {
  if (rating == null) return '—';
  return `${rating}${reviews != null ? ` · ${reviews} avaliações` : ''}`;
}

function linkOrText(url, label) {
  if (!url) return '<span class="muted">Não informado</span>';
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a>`;
}

function readContacted() {
  try {
    const value = JSON.parse(localStorage.getItem(CONTACTED_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeContacted(contacted) {
  localStorage.setItem(CONTACTED_STORAGE_KEY, JSON.stringify([...contacted]));
}

function isContacted(lead) {
  return readContacted().has(String(lead.id)) || lead.stage === 'CONTATADO';
}

function markLeadContacted(id) {
  const contacted = readContacted();
  contacted.add(String(id));
  writeContacted(contacted);
  const lead = state.leads.find((item) => item.id === id);
  if (lead) lead.stage = 'CONTATADO';
  renderTable();
}

function normalizedPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function getApproachVariations(lead) {
  const name = String(lead.name || '').trim();
  const templates = approachTemplates[lead.segment] || genericApproachTemplates;
  const safeName = name || 'seu negócio';
  return templates.map((template) => template(safeName));
}

function renderApproach(lead, variationIndex = 0) {
  const variations = getApproachVariations(lead);
  const index = ((variationIndex % variations.length) + variations.length) % variations.length;
  return `
    <div class="detail-section">
      <h3>Abordagem</h3>
      <p class="approach-help">Prepare uma mensagem personalizada para iniciar a conversa. O envio não é automático.</p>
      <textarea id="approach-message" class="approach-message" maxlength="450" aria-label="Mensagem de abordagem">${escapeHtml(variations[index])}</textarea>
      <div class="approach-meta"><span>Variação ${index + 1} de ${variations.length}</span><span id="approach-count">${variations[index].length}/450</span></div>
      <div class="detail-actions approach-actions">
        <button class="secondary" type="button" id="approach-another">Gerar outra</button>
        <button class="secondary" type="button" id="approach-copy">Copiar</button>
      </div>
      <div class="detail-actions approach-actions">
        ${lead.phone ? `<button class="primary" type="button" id="approach-whatsapp">Abrir WhatsApp</button>` : ''}
        <button class="secondary" type="button" id="approach-contacted">${isContacted(lead) ? 'Já está CONTATADO' : 'Marcar como CONTATADO'}</button>
      </div>
      <div class="approach-note">WhatsApp não é enviado automaticamente. Revise a mensagem antes de continuar.</div>
    </div>
  `;
}

async function copyApproach() {
  const textarea = $('approach-message');
  if (!textarea) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
  } catch {
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
  }
  const copyButton = $('approach-copy');
  if (copyButton) {
    const original = copyButton.textContent;
    copyButton.textContent = 'Copiado!';
    setTimeout(() => { copyButton.textContent = original; }, 1200);
  }
}

function openWhatsApp(lead) {
  const phone = normalizedPhone(lead.phone);
  const textarea = $('approach-message');
  const message = textarea ? textarea.value.trim() : '';
  if (!phone || !message) return;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function searchLeads(event) {
  event.preventDefault();
  const city = $('city').value.trim();
  const max = $('max').value;
  const segment = searchSegment.value;
  if (!city || !segment) return;

  errorBox.classList.add('hidden');
  loading.classList.remove('hidden');
  button.disabled = true;
  button.textContent = 'Buscando...';

  try {
    const response = await fetch(`/api?city=${encodeURIComponent(city)}&segment=${encodeURIComponent(segment)}&max=${encodeURIComponent(max)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível concluir a busca.');
    state.leads = Array.isArray(data.leads) ? data.leads : [];
    const contacted = readContacted();
    state.leads.forEach((lead) => {
      if (contacted.has(String(lead.id))) lead.stage = 'CONTATADO';
    });
    updateSummary(data);
    renderTable();
    summary.classList.remove('hidden');
    results.classList.remove('hidden');
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : 'Erro inesperado.';
    errorBox.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    button.disabled = false;
    button.textContent = 'Buscar empresas';
  }
}

function updateSummary(data) {
  $('metric-found').textContent = data.collected ?? state.leads.length;
  $('metric-qualified').textContent = data.qualified ?? state.leads.filter((lead) => lead.stage === 'QUALIFICADO').length;
  $('metric-phone').textContent = state.leads.filter((lead) => Boolean(lead.phone)).length;
  const found = Number(data.collected ?? state.leads.length);
  const qualified = Number(data.qualified ?? 0);
  $('metric-rate').textContent = found ? `${Math.round((qualified / found) * 100)}%` : '0%';
  selectedSegmentLabel.textContent = segmentNames[data.segment] || segmentNames[searchSegment.value] || 'Segmento selecionado';
}

function renderTable() {
  const segment = segmentFilter.value;
  const minimumScore = Number(scoreFilter.value);
  state.filtered = state.leads.filter((lead) => {
    return (segment === 'all' || lead.segment === segment) && Number(lead.score || 0) >= minimumScore;
  });

  table.innerHTML = state.filtered.map((lead) => `
    <tr>
      <td><div class="company">${escapeHtml(lead.name)}</div><div class="muted">${escapeHtml([lead.city, lead.state].filter(Boolean).join(' · '))}</div></td>
      <td><span class="segment-label">${escapeHtml(segmentNames[lead.segment] || 'Outro')}</span></td>
      <td><span class="${scoreClass(Number(lead.score || 0))}">${Number(lead.score || 0)}</span></td>
      <td>${escapeHtml(formatPhone(lead.phone))}</td>
      <td><span class="stage">${escapeHtml(isContacted(lead) ? stageNames.CONTATADO : (stageNames[lead.stage] || lead.stage || '—'))}</span></td>
      <td><button class="details-btn" data-lead-id="${escapeHtml(lead.id)}">Ver lead</button></td>
    </tr>
  `).join('');

  empty.classList.toggle('hidden', state.filtered.length !== 0);
  $('results-subtitle').textContent = `${state.filtered.length} lead${state.filtered.length === 1 ? '' : 's'} exibido${state.filtered.length === 1 ? '' : 's'} · ${segmentNames[searchSegment.value] || 'segmento'} · resultado da última busca`;
}

function bindApproach(lead, variationIndex) {
  const textarea = $('approach-message');
  const count = $('approach-count');
  if (textarea && count) textarea.addEventListener('input', () => { count.textContent = `${textarea.value.length}/450`; });

  $('approach-another')?.addEventListener('click', () => {
    const nextIndex = (variationIndex + 1) % getApproachVariations(lead).length;
    const section = document.querySelector('.detail-section .approach-help')?.closest('.detail-section');
    if (!section) return;
    section.outerHTML = renderApproach(lead, nextIndex);
    bindApproach(lead, nextIndex);
  });

  $('approach-copy')?.addEventListener('click', copyApproach);
  $('approach-whatsapp')?.addEventListener('click', () => openWhatsApp(lead));
  $('approach-contacted')?.addEventListener('click', () => {
    markLeadContacted(lead.id);
    const contactButton = $('approach-contacted');
    if (contactButton) {
      contactButton.textContent = 'Já está CONTATADO';
      contactButton.disabled = true;
    }
  });
}

function openLead(id) {
  const lead = state.leads.find((item) => item.id === id);
  if (!lead) return;
  state.currentLeadId = id;
  const reasons = Array.isArray(lead.scoreReasons) && lead.scoreReasons.length
    ? lead.scoreReasons.map((reason) => `<div class="reason">• ${escapeHtml(reason)}</div>`).join('')
    : '<div class="muted">Sem justificativas registradas.</div>';

  drawerContent.innerHTML = `
    <div class="detail-eyebrow">Lead · ${escapeHtml(isContacted(lead) ? stageNames.CONTATADO : (stageNames[lead.stage] || lead.stage || 'Novo'))}</div>
    <h2 class="detail-title">${escapeHtml(lead.name)}</h2>
    <span class="detail-score">Score ${Number(lead.score || 0)}</span>
    <div class="detail-grid">
      <div class="detail-item"><span>Segmento</span><strong>${escapeHtml(segmentNames[lead.segment] || 'Não identificado')}</strong></div>
      <div class="detail-item"><span>Avaliação</span><strong>${escapeHtml(formatRating(lead.rating, lead.reviews))}</strong></div>
      <div class="detail-item"><span>Telefone</span><strong>${escapeHtml(formatPhone(lead.phone))}</strong></div>
      <div class="detail-item"><span>Cidade</span><strong>${escapeHtml([lead.city, lead.state].filter(Boolean).join(' · ') || '—')}</strong></div>
    </div>
    <div class="detail-section">
      <h3>Por que foi qualificado</h3>
      ${reasons}
    </div>
    <div class="detail-section">
      <h3>Endereço</h3>
      <div class="muted">${escapeHtml(lead.address || 'Não informado')}</div>
    </div>
    <div class="detail-section">
      <h3>Links</h3>
      <div class="detail-actions">
        ${lead.googleMapsUrl ? `<a class="secondary" href="${escapeHtml(lead.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">Abrir no Maps</a>` : ''}
        ${lead.website ? `<a class="secondary" href="${escapeHtml(lead.website)}" target="_blank" rel="noopener noreferrer">Abrir site</a>` : ''}
      </div>
    </div>
    ${renderApproach(lead)}
  `;
  bindApproach(lead, 0);
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}

form.addEventListener('submit', searchLeads);
searchSegment.addEventListener('change', () => {
  selectedSegmentLabel.textContent = segmentNames[searchSegment.value] || 'Segmento selecionado';
});
segmentFilter.addEventListener('change', renderTable);
scoreFilter.addEventListener('change', renderTable);
table.addEventListener('click', (event) => {
  const buttonElement = event.target.closest('[data-lead-id]');
  if (buttonElement) openLead(buttonElement.dataset.leadId);
});
$('drawer-close').addEventListener('click', closeDrawer);
$('drawer-backdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
