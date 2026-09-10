(function () {
  const board = document.getElementById('pipeline-board');
  const pipelineEmpty = document.getElementById('pipeline-empty');
  const tableEl = document.getElementById('lead-table');
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const titleEl = document.getElementById('view-title');
  const subtitleEl = document.getElementById('view-subtitle');
  if (!board) return;

  const VIEW_META = {
    prospeccao: { title: 'Prospecção', subtitle: 'Encontre, qualifique e organize seus próximos clientes da Livia.' },
    pipeline:   { title: 'Pipeline de prospecção', subtitle: 'Leads da última busca organizados por estágio do funil (visualização somente leitura).' },
  };

  // ORDEM DE EXIBIÇÃO das colunas (apenas apresentação — NÃO é regra de transição).
  const STAGE_ORDER = ['NOVO','QUALIFICADO','CONTATADO','RESPONDEU','INTERESSADO','DEMONSTRAÇÃO','PROPOSTA','NEGOCIAÇÃO','GANHO','PERDIDO','OPT-OUT'];
  const FALLBACK_STAGES = {NOVO:'Novo',QUALIFICADO:'Qualificado',CONTATADO:'Contatado',RESPONDEU:'Respondeu',INTERESSADO:'Interessado','DEMONSTRAÇÃO':'Demonstração',PROPOSTA:'Proposta','NEGOCIAÇÃO':'Negociação',GANHO:'Ganho',PERDIDO:'Perdido','OPT-OUT':'Opt-out'};

  const esc = (v) => (typeof window.escapeHtml === 'function'
    ? window.escapeHtml(v)
    : String(v ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])));

  function stageLabels(){ try { return (typeof stageNames !== 'undefined' && stageNames) ? stageNames : FALLBACK_STAGES; } catch { return FALLBACK_STAGES; } }
  function segLabels(){ try { return (typeof segmentNames !== 'undefined' && segmentNames) ? segmentNames : {}; } catch { return {}; } }

  function getData(){
    try {
      if (typeof state !== 'undefined' && state && Array.isArray(state.leads)) {
        const filtered = Array.isArray(state.filtered) ? state.filtered : state.leads;
        return { all: state.leads, filtered };
      }
    } catch (_) {}
    return { all: [], filtered: [] };
  }

  function effectiveStage(lead){
    try { if (typeof window.isContacted === 'function' && window.isContacted(lead)) return 'CONTATADO'; } catch (_) {}
    return lead.stage || 'NOVO';
  }

  function scoreCls(score){ return (typeof window.scoreClass === 'function') ? window.scoreClass(score) : 'score'; }

  function phoneBadge(lead){
    let status = 'MISSING';
    try { if (typeof window.getPhoneStatus === 'function') status = window.getPhoneStatus(lead); } catch (_) {}
    let label = status;
    try { if (typeof phoneStatusNames !== 'undefined' && phoneStatusNames[status]) label = phoneStatusNames[status]; } catch (_) {}
    return `<span class="phone-status phone-status-${String(status).toLowerCase()}">${esc(label)}</span>`;
  }

  function cardHtml(lead){
    const segs = segLabels();
    const sub = [lead.city, lead.state].filter(Boolean).join(' · ');
    return `<button class="kanban-card" type="button" data-lead-id="${esc(lead.id)}">
      <div class="kanban-card-top">
        <span class="${scoreCls(Number(lead.score||0))}">${Number(lead.score||0)}</span>
        ${phoneBadge(lead)}
      </div>
      <div class="kanban-card-name">${esc(lead.name)}</div>
      <div class="kanban-card-sub">${esc(sub || '—')}</div>
      <div class="kanban-card-foot"><span class="segment-label">${esc(segs[lead.segment] || 'Outro')}</span></div>
    </button>`;
  }

  function renderKanban(){
    const { all, filtered } = getData();
    if (!all.length){
      if (pipelineEmpty) pipelineEmpty.classList.remove('hidden');
      board.innerHTML = '';
      return;
    }
    if (pipelineEmpty) pipelineEmpty.classList.add('hidden');
    const labels = stageLabels();
    board.innerHTML = STAGE_ORDER.map((stage) => {
      const leadsInStage = filtered.filter((l) => effectiveStage(l) === stage);
      const cards = leadsInStage.length
        ? leadsInStage.map(cardHtml).join('')
        : '<div class="kanban-empty">Nenhum lead neste estágio</div>';
      return `<div class="kanban-col" data-stage="${esc(stage)}">
        <div class="kanban-col-head">
          <span class="kanban-col-title">${esc(labels[stage] || stage)}</span>
          <span class="kanban-count">${leadsInStage.length}</span>
        </div>
        <div class="kanban-col-body">${cards}</div>
      </div>`;
    }).join('');
  }

  // Abrir o mesmo drawer da tabela — reutiliza a lógica existente.
  board.addEventListener('click', (e) => {
    const el = e.target.closest('[data-lead-id]');
    if (el && typeof window.openLead === 'function') window.openLead(el.dataset.leadId);
  });

  // Navegação entre views (Prospecção / Pipeline).
  navItems.forEach((item) => item.addEventListener('click', () => {
    const view = item.dataset.view;
    navItems.forEach((i) => i.classList.toggle('active', i === item));
    views.forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
    const meta = VIEW_META[view];
    if (meta && titleEl && subtitleEl){ titleEl.textContent = meta.title; subtitleEl.textContent = meta.subtitle; }
    if (view === 'pipeline') renderKanban();
  }));

  // Mantém o Kanban em sincronia com a tabela (busca/filtros re-renderizam a tabela).
  if (tableEl && 'MutationObserver' in window){
    const mo = new MutationObserver(() => renderKanban());
    mo.observe(tableEl, { childList: true, subtree: true });
  }

  renderKanban();
})();