const state = { leads: [], filtered: [] };

const $ = (id) => document.getElementById(id);
const form = $('search-form');
const button = $('search-button');
const loading = $('loading');
const errorBox = $('error');
const summary = $('summary');
const results = $('results');
const table = $('lead-table');
const empty = $('empty');
const segmentFilter = $('segment-filter');
const scoreFilter = $('score-filter');
const drawer = $('drawer');
const drawerContent = $('drawer-content');

const segmentNames = {
  barbearia: 'Barbearia',
  salao_de_beleza: 'Salão de beleza',
  manicure_nail_designer: 'Manicure / Nail',
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

async function searchLeads(event) {
  event.preventDefault();
  const city = $('city').value.trim();
  const max = $('max').value;
  if (!city) return;

  errorBox.classList.add('hidden');
  loading.classList.remove('hidden');
  button.disabled = true;
  button.textContent = 'Buscando...';

  try {
    const response = await fetch(`/api?city=${encodeURIComponent(city)}&max=${encodeURIComponent(max)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível concluir a busca.');
    state.leads = Array.isArray(data.leads) ? data.leads : [];
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
      <td><span class="stage">${escapeHtml(stageNames[lead.stage] || lead.stage || '—')}</span></td>
      <td><button class="details-btn" data-lead-id="${escapeHtml(lead.id)}">Ver lead</button></td>
    </tr>
  `).join('');

  empty.classList.toggle('hidden', state.filtered.length !== 0);
  $('results-subtitle').textContent = `${state.filtered.length} lead${state.filtered.length === 1 ? '' : 's'} exibido${state.filtered.length === 1 ? '' : 's'} · resultado da última busca`;
}

function openLead(id) {
  const lead = state.leads.find((item) => item.id === id);
  if (!lead) return;
  const reasons = Array.isArray(lead.scoreReasons) && lead.scoreReasons.length
    ? lead.scoreReasons.map((reason) => `<div class="reason">• ${escapeHtml(reason)}</div>`).join('')
    : '<div class="muted">Sem justificativas registradas.</div>';

  drawerContent.innerHTML = `
    <div class="detail-eyebrow">Lead · ${escapeHtml(stageNames[lead.stage] || lead.stage || 'Novo')}</div>
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
    <div class="detail-section">
      <h3>Abordagem</h3>
      ${lead.personalizedMessage ? `<div class="message-box">${escapeHtml(lead.personalizedMessage)}</div>` : '<div class="muted">Ainda não gerada. Nesta versão o painel não envia mensagens automaticamente.</div>'}
    </div>
    <div class="detail-section">
      <h3>Próxima ação</h3>
      <div class="detail-actions">
        <button class="primary" type="button" disabled title="Envio automático será implementado depois da validação do processo">Preparar abordagem</button>
        ${lead.phone ? `<button class="secondary" type="button" disabled title="Envio automático não está habilitado">Contato manual</button>` : ''}
      </div>
    </div>
  `;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}

form.addEventListener('submit', searchLeads);
segmentFilter.addEventListener('change', renderTable);
scoreFilter.addEventListener('change', renderTable);
table.addEventListener('click', (event) => {
  const buttonElement = event.target.closest('[data-lead-id]');
  if (buttonElement) openLead(buttonElement.dataset.leadId);
});
$('drawer-close').addEventListener('click', closeDrawer);
$('drawer-backdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
