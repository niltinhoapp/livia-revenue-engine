(function () {
  const summary = document.getElementById('summary');
  const results = document.getElementById('results');
  const table = document.getElementById('lead-table');
  const drawer = document.getElementById('drawer');
  const drawerContent = document.getElementById('drawer-content');
  if (!summary || !results || !table) return;

  function scoreFromRow(row) {
    const score = row.querySelector('.score');
    if (!score) return 0;
    const value = Number.parseInt(score.textContent || '0', 10);
    return Number.isFinite(value) ? value : 0;
  }

  function ensureOpportunityMetric() {
    if (document.getElementById('metric-opportunities')) return;
    const metric = document.createElement('div');
    metric.className = 'metric metric-opportunity';
    metric.innerHTML = '<span>Oportunidades para Lívia</span><strong id="metric-opportunities">0</strong>';
    summary.appendChild(metric);
  }

  function updateOpportunityMetric() {
    ensureOpportunityMetric();
    const rows = Array.from(table.querySelectorAll('tr'));
    const opportunities = rows.filter((row) => scoreFromRow(row) >= 60).length;
    const target = document.getElementById('metric-opportunities');
    if (target) target.textContent = String(opportunities);
  }

  function addPriorityBanner() {
    if (document.getElementById('priority-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'priority-banner';
    banner.className = 'priority-banner';
    banner.innerHTML = '<strong>Priorize quem tem mais potencial para a Lívia</strong><span>Score 80+ = alta prioridade · 60+ = oportunidade · abaixo de 60 = baixa prioridade</span>';
    const header = results.querySelector('.results-header');
    if (header) header.after(banner);
  }

  function refreshResultsUx() {
    if (results.classList.contains('hidden')) return;
    ensureOpportunityMetric();
    updateOpportunityMetric();
    addPriorityBanner();
  }

  function addOpportunityReason() {
    if (!drawer || !drawerContent || drawer.getAttribute('aria-hidden') === 'true') return;
    if (drawerContent.querySelector('.livia-opportunity-reason')) return;

    const text = drawerContent.textContent || '';
    const scoreMatch = text.match(/\b(100|[1-9]?\d)\b/);
    const score = scoreMatch ? Number(scoreMatch[1]) : 0;
    const reasons = [];
    if (score >= 80) reasons.push('Score alto de oportunidade');
    else if (score >= 60) reasons.push('Score compatível com prospecção');
    if (/whatsapp|telefone/i.test(text)) reasons.push('Possui canal de contato identificado');
    if (/automa[cç][aã]o/i.test(text)) reasons.push('Apresenta sinais de automação comercial');
    if (!reasons.length) reasons.push('Vale revisar o contexto antes de abordar');

    const section = document.createElement('div');
    section.className = 'detail-section livia-opportunity-reason';
    section.innerHTML = `<h3>Por que pode ser uma boa oportunidade</h3><div class="reason-list">${reasons.map((reason) => `<div class="reason">${reason}</div>`).join('')}</div>`;
    drawerContent.prepend(section);
  }

  let pollingInterval = null;
  let syncing = false;
  const prospectingChannels = new Map();

  function getProspectingChannel(leadId) {
    return prospectingChannels.get(String(leadId)) || 'revenue';
  }

  function setProspectingChannel(leadId, channel) {
    prospectingChannels.set(String(leadId), channel);
  }

  async function apiProspecting(payload) {
    const res = await fetch('/api/prospecting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.status === 401) {
      if (window.__revenueForceLogin) window.__revenueForceLogin();
      return { status: 401, data: null };
    }
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    return { status: res.status, data };
  }

  function getStatusLabel(status) {
    const map = {
      PREPARED: "Demonstração preparada",
      WAITING_REPLY: "Mensagem enviada — aguardando resposta",
      LIVIA_ACTIVE: "Demonstração em andamento",
      REVEALED: "Lívia se apresentou",
      INTERESTED: "Estabelecimento demonstrou interesse",
      HUMAN: "Atendimento comercial humano",
      NOT_INTERESTED: "Sem interesse",
      OPTED_OUT: "Não deseja novos contatos",
      CLOSED: "Prospecção encerrada",
      EXPIRED: "Preparação expirada"
    };
    return map[status] || status;
  }

  function isTerminalStatus(status) {
    return ['HUMAN', 'NOT_INTERESTED', 'OPTED_OUT', 'CLOSED', 'EXPIRED'].includes(status);
  }

  async function syncProspectingUI() {
    if (syncing) return;
    syncing = true;
    try { await _syncProspectingUI(); } finally { syncing = false; }
  }

  async function _syncProspectingUI() {
    if (!drawer || !drawerContent || drawer.getAttribute('aria-hidden') === 'true') {
      if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
      return;
    }
    
    const lead = state?.leads?.find(l => l.id === state.currentLeadId);
    if (!lead) return;

    let statusSection = drawerContent.querySelector('.livia-prospecting-status');
    if (!statusSection) {
      statusSection = document.createElement('div');
      statusSection.className = 'detail-section livia-prospecting-status';
      const approachSection = Array.from(drawerContent.querySelectorAll('.detail-section')).find(s => s.querySelector('h3')?.textContent === 'Abordagem');
      if (approachSection) approachSection.after(statusSection);
      else drawerContent.appendChild(statusSection);
    }

    const approachMessage = document.getElementById('approach-message');
    const approachCopy = document.getElementById('approach-copy');
    const approachWhatsapp = document.getElementById('approach-whatsapp');
    const approachAnother = document.getElementById('approach-another');

    // Mute original actions to avoid auto-sends and bypasses
    if (approachCopy) approachCopy.style.display = 'none';
    if (approachWhatsapp) approachWhatsapp.style.display = 'none';

    let ourActions = drawerContent.querySelector('.livia-prospecting-actions');
    if (!ourActions) {
      ourActions = document.createElement('div');
      ourActions.className = 'detail-actions livia-prospecting-actions';
      if (approachCopy) approachCopy.parentNode.after(ourActions);
    }

    const updateUI = (session) => {
      ourActions.innerHTML = '';
      if (!session) {
        statusSection.innerHTML = `<h3>Status da Lívia</h3><div class="muted">Nenhuma demonstração ativa.</div>`;
        if (approachMessage) {
           approachMessage.readOnly = false;
           approachMessage.style.backgroundColor = '';
        }
        if (approachAnother) approachAnother.style.display = '';
        
        const channel = getProspectingChannel(lead.id);
        ourActions.innerHTML = `<label class="muted" for="livia-channel">Canal</label>
          <select id="livia-channel"><option value="revenue">Revenue</option><option value="demo">Demonstração</option></select>
          <button class="primary" id="livia-prepare">Preparar demonstração</button>`;
        const channelSelect = document.getElementById('livia-channel');
        channelSelect.value = channel;
        channelSelect.addEventListener('change', () => {
          setProspectingChannel(lead.id, channelSelect.value);
          syncProspectingUI();
        });
        document.getElementById('livia-prepare').addEventListener('click', async () => {
           const btn = document.getElementById('livia-prepare');
           btn.disabled = true; btn.textContent = 'Preparando...';
           const selectedChannel = channelSelect.value;
           setProspectingChannel(lead.id, selectedChannel);
           const payload = { action: 'prepare', leadId: String(lead.id), phone: lead.phone || '', businessName: lead.name || '', segment: lead.segment || '', initialManualMessage: approachMessage ? approachMessage.value.trim() : '', ...(selectedChannel === 'demo' ? { channel: 'demo' } : {}) };
           try {
             const res = await apiProspecting(payload);
             if (res.status === 401) return;
             else if (res.status === 200 || res.status === 201) syncProspectingUI();
             else alert('Erro ao preparar: ' + (res.data?.error || res.status));
           } catch(e) { alert('Falha de rede.'); }
           btn.disabled = false; btn.textContent = 'Preparar demonstração';
        });
        return;
      }

    // Session exists
      if (session.channel === 'demo') setProspectingChannel(lead.id, 'demo');
      statusSection.innerHTML = `<h3>Status da Lívia</h3>
        <div class="reason"><strong>${getStatusLabel(session.status)}</strong></div>
        <div class="muted">Atualizado em: ${new Date().toLocaleTimeString()}</div>`;
        
      if (approachAnother) approachAnother.style.display = 'none';
      if (approachMessage) {
        approachMessage.value = session.initialManualMessage || approachMessage.value;
        approachMessage.readOnly = true;
        approachMessage.style.backgroundColor = '#f5f5f5';
      }

      if (session.status === 'OPTED_OUT') {
        statusSection.innerHTML += `<div class="error" style="color:red; margin-top:8px">🚫 Lead solicitou descadastramento (Opt-out)</div>`;
        return;
      }
      if (session.status === 'EXPIRED') return;
      if (session.status === 'HUMAN') statusSection.innerHTML += `<div class="error" style="color:red; font-weight:bold; margin-top:8px">⚠️ Transbordo Solicitado! Assuma no WhatsApp.</div>`;
      if (session.status === 'INTERESTED') statusSection.innerHTML += `<div style="color:green; font-weight:bold; margin-top:8px">🔥 Oportunidade Quente! A Lívia está conduzindo.</div>`;

      if (session.status === 'PREPARED') {
        ourActions.innerHTML = `
          <button class="primary" id="livia-copy">Copiar mensagem</button>
          <button class="secondary" id="livia-confirm">Já enviei pelo WhatsApp</button>
          <button class="secondary" id="livia-abort" style="color: red">Cancelar preparação</button>
        `;
        document.getElementById('livia-copy').addEventListener('click', () => {
          if (approachCopy) approachCopy.click();
        });
        document.getElementById('livia-confirm').addEventListener('click', async () => {
          document.getElementById('livia-confirm').disabled = true;
          try {
            const res = await apiProspecting({ action: 'confirm_manual_send', normalizedPhone: session.normalizedPhone, ...(getProspectingChannel(lead.id) === 'demo' ? { channel: 'demo' } : {}) });
            if (res.status === 200 || res.status === 201) syncProspectingUI();
            else alert('Erro ao confirmar: ' + (res.data?.error || res.status));
          } catch(e) { alert('Falha de rede.'); }
          if (document.getElementById('livia-confirm')) document.getElementById('livia-confirm').disabled = false;
        });
        document.getElementById('livia-abort').addEventListener('click', async () => {
          document.getElementById('livia-abort').disabled = true;
          try {
            const res = await apiProspecting({ action: 'abort', normalizedPhone: session.normalizedPhone, ...(getProspectingChannel(lead.id) === 'demo' ? { channel: 'demo' } : {}) });
            if (res.status === 200 || res.status === 201) syncProspectingUI();
            else alert('Erro ao cancelar: ' + (res.data?.error || res.status));
          } catch(e) { alert('Falha de rede.'); }
          if (document.getElementById('livia-abort')) document.getElementById('livia-abort').disabled = false;
        });
      }
    };

    try {
      const channel = getProspectingChannel(lead.id);
      const res = await apiProspecting({ action: 'get', leadId: String(lead.id), ...(channel === 'demo' ? { channel: 'demo' } : {}) });
      const session = res.status === 200 ? (res.data?.session ?? res.data) : null;
      updateUI(session);
      if (session && !isTerminalStatus(session.status)) {
        if (!pollingInterval) pollingInterval = setInterval(syncProspectingUI, 8000);
      } else {
        if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
      }
    } catch(e) {
      updateUI(null);
    }
  }

  const resultsObserver = new MutationObserver(() => {
    refreshResultsUx();
  });
  resultsObserver.observe(results, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  if (drawer) {
    const drawerObserver = new MutationObserver(() => {
      addOpportunityReason();
      syncProspectingUI();
    });
    // Observar childList porque "Gerar outra" recria a section toda
    drawerObserver.observe(drawer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-hidden']
    });
  }

  // Export for testing pure functions
  window.LiviaProspectingClient = { apiProspecting, getStatusLabel, isTerminalStatus };

  refreshResultsUx();
})();
