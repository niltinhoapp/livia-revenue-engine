/**
 * Radar de Oportunidades 2.0 — Frontend Controller
 * Inteligência comercial baseada em sinais reais de intenção pública.
 * Connect Web — Livia Revenue Engine.
 */

(function () {
  const RADAR_STORAGE_KEY = 'liviaRevenueRadarOpportunities';
  const RADAR_HISTORY_KEY = 'liviaRevenueRadarHistory';

  const state = {
    opportunities: [],
    filtered: [],
    discarded: [],
    metricsBySource: {},
    rejectionBreakdown: {},
    totalCollected: 0,
    activeTab: 'opps',
    currentId: null,
    isScanning: false,
    sourcesQueried: [],
    limitations: [],
  };

  const segmentLabels = {
    barbearia: '💈 Barbearia',
    salao_de_beleza: '💇 Salão de beleza',
    manicure_nail_designer: '💅 Manicure / Esmalteria',
    clinica_estetica: '✨ Clínica de estética',
    clinica_odontologica: '🦷 Odontologia',
    clinica_medica: '🩺 Clínica médica',
    restaurante: '🍽️ Restaurante / Delivery',
    servicos_locais: '🏢 Serviços locais',
    all: 'Todos os segmentos',
  };

  const statusLabels = {
    NOVO: 'Nova',
    EM_ANALISE: 'Em análise',
    ABORDAGEM_APROVADA: 'Abordagem aprovada',
    CONTATADO: 'Contatado',
    ENCAMINHADO_LIVIA: 'Encaminhado para Lívia',
    DESCARTADO: 'Descartada',
  };

  const levelLabels = {
    HIGH: 'Alta intenção',
    MEDIUM: 'Média intenção',
    LOW: 'Baixa intenção',
    NONE: 'Não qualificada',
  };

  const urgencyLabels = {
    HIGH: '🚨 Urgência alta',
    MEDIUM: '⚠️ Urgência média',
    LOW: 'ℹ️ Informativa',
  };

  const rejectionLabels = {
    TECH_OR_DEVOPS: '💻 Código / DevOps / Infra',
    VENDOR_OR_SELLER: '📢 Fornecedor / Anúncio / Curso',
    JOB_OR_RECRUITMENT: '👔 Vaga de Emprego / RH',
    CONSUMER_COMPLAINT: '🗣️ Reclamação de Consumidor',
    ACADEMIC_OR_STUDENT: '🎓 Estudante / Faculdade',
    FOREIGN_LANGUAGE: '🌐 Idioma Estrangeiro',
    NO_BUSINESS_LINK: '👤 Sem Vínculo de Estabelecimento',
    NO_SOLUTION_FIT: '❓ Sem Aderência à Lívia',
    NO_COMMERCIAL_NEED: '🔍 Sem Necessidade Comercial',
    INVALID_URL: '🚫 Link Inválido ou Restrito',
    TEXT_TOO_SHORT: '📝 Texto Insuficiente',
    OUTROS: '⚪ Filtro Geral',
  };

  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>'"]/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[c]));
  }

  function readStoredOpportunities() {
    try {
      const data = JSON.parse(localStorage.getItem(RADAR_STORAGE_KEY) || '[]');
      if (!Array.isArray(data)) return [];
      // Filtra registros descartados ou sem qualificação para não poluir
      return data.filter((item) => item && item.level && item.level !== 'NONE');
    } catch {
      return [];
    }
  }

  function writeStoredOpportunities(list) {
    try {
      const cleanList = (list || []).filter((item) => item && item.level && item.level !== 'NONE');
      localStorage.setItem(RADAR_STORAGE_KEY, JSON.stringify(cleanList));
    } catch (e) {
      console.warn('Erro ao salvar oportunidades no localStorage:', e);
    }
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(RADAR_HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function recordHistory(oppId, action, details) {
    const history = readHistory();
    history.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      oppId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(RADAR_HISTORY_KEY, JSON.stringify(history.slice(-500)));
  }

  function formatDate(isoStr) {
    if (!isoStr) return 'Recente';
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return 'Recente';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Recente';
    }
  }

  function mergeOpportunities(incoming) {
    // Apenas oportunidades qualificadas (HIGH, MEDIUM, LOW)
    const validIncoming = (incoming || []).filter((item) => item && item.level && item.level !== 'NONE');
    const existingMap = new Map(state.opportunities.map((o) => [o.sourceUrl, o]));

    for (const item of validIncoming) {
      if (existingMap.has(item.sourceUrl)) {
        const prev = existingMap.get(item.sourceUrl);
        existingMap.set(item.sourceUrl, {
          ...item,
          commercialStatus: prev.commercialStatus || item.commercialStatus,
          notes: prev.notes || item.notes,
          leadPhone: prev.leadPhone || item.leadPhone,
        });
      } else {
        existingMap.set(item.sourceUrl, item);
      }
    }

    state.opportunities = Array.from(existingMap.values());
    writeStoredOpportunities(state.opportunities);
  }

  function switchTab(tabName) {
    state.activeTab = tabName;

    const tabOpps = document.getElementById('radar-tab-opps');
    const tabDiscarded = document.getElementById('radar-tab-discarded');
    const oppsContainer = document.getElementById('radar-opps-container');
    const discardedContainer = document.getElementById('radar-discarded-container');
    const filtersBar = document.getElementById('radar-filters-bar');
    const titleEl = document.getElementById('radar-table-title');

    if (tabName === 'opps') {
      if (tabOpps) tabOpps.classList.add('active');
      if (tabDiscarded) tabDiscarded.classList.remove('active');
      if (oppsContainer) oppsContainer.classList.remove('hidden');
      if (discardedContainer) discardedContainer.classList.add('hidden');
      if (filtersBar) filtersBar.classList.remove('hidden');
      if (titleEl) titleEl.textContent = 'Oportunidades Comerciais Identificadas';
    } else {
      if (tabOpps) tabOpps.classList.remove('active');
      if (tabDiscarded) tabDiscarded.classList.add('active');
      if (oppsContainer) oppsContainer.classList.add('hidden');
      if (discardedContainer) discardedContainer.classList.remove('hidden');
      if (titleEl) titleEl.textContent = 'Auditoria de Sinais Descartados (Filtro Anti-Ruído)';
    }

    renderTable();
  }

  function filterAndSort() {
    const segFilter = document.getElementById('radar-filter-segment')?.value || 'all';
    const levelFilter = document.getElementById('radar-filter-level')?.value || 'all';
    const statusFilter = document.getElementById('radar-filter-status')?.value || 'all';

    state.filtered = state.opportunities.filter((op) => {
      if (segFilter !== 'all' && op.segment !== segFilter) return false;
      if (levelFilter !== 'all' && op.level !== levelFilter) return false;
      if (statusFilter !== 'all' && op.commercialStatus !== statusFilter) return false;
      return true;
    });

    // Ordenação: HIGH > MEDIUM > LOW; scores maiores primeiro
    const levelOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
    state.filtered.sort((a, b) => {
      const diff = (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0);
      if (diff !== 0) return diff;
      return (b.score || 0) - (a.score || 0);
    });

    renderMetrics();
    renderAuditBox();
    renderTable();
  }

  function renderMetrics() {
    const totalOpps = state.opportunities.length;
    const high = state.opportunities.filter((o) => o.level === 'HIGH').length;
    const medium = state.opportunities.filter((o) => o.level === 'MEDIUM').length;
    const discardedCount = state.discarded.length;
    const totalCollected = state.totalCollected || (totalOpps + discardedCount);

    const elTotal = document.getElementById('radar-metric-total');
    const elQualified = document.getElementById('radar-metric-qualified');
    const elHigh = document.getElementById('radar-metric-high');
    const elDiscarded = document.getElementById('radar-metric-discarded');

    const tabOppsCount = document.getElementById('radar-tab-opps-count');
    const tabDiscardedCount = document.getElementById('radar-tab-discarded-count');

    if (elTotal) elTotal.textContent = String(totalCollected);
    if (elQualified) elQualified.textContent = String(high + medium);
    if (elHigh) elHigh.textContent = String(high);
    if (elDiscarded) elDiscarded.textContent = String(discardedCount);

    if (tabOppsCount) tabOppsCount.textContent = String(totalOpps);
    if (tabDiscardedCount) tabDiscardedCount.textContent = String(discardedCount);
  }

  function renderAuditBox() {
    const auditBox = document.getElementById('radar-audit-box');
    const metricsGrid = document.getElementById('radar-audit-metrics');
    if (!auditBox || !metricsGrid) return;

    const sources = Object.values(state.metricsBySource || {});
    const rejections = Object.entries(state.rejectionBreakdown || {});

    if (!sources.length && !rejections.length) {
      auditBox.classList.add('hidden');
      return;
    }

    auditBox.classList.remove('hidden');

    let html = '';

    // Cards por conector
    for (const src of sources) {
      html += `
        <div class="audit-metric-card">
          <span>${escapeHtml(src.sourceName)}</span>
          <strong>${Number(src.qualified || 0)} qualificados</strong>
          <small>${Number(src.collected || 0)} capturados · ${Number(src.discarded || 0)} descartados</small>
        </div>
      `;
    }

    // Card de motivos de descarte principais
    if (rejections.length) {
      const topRejections = rejections
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([cat, count]) => `
          <div style="margin-top:3px;font-size:11px;">
            <span class="rejection-badge rejection-${cat.toLowerCase()}">${escapeHtml(rejectionLabels[cat] || cat)}</span>: <strong>${count}</strong>
          </div>
        `).join('');

      html += `
        <div class="audit-metric-card" style="grid-column: span 2;">
          <span>Principais Motivos de Eliminação</span>
          <div style="margin-top:6px;">${topRejections}</div>
        </div>
      `;
    }

    metricsGrid.innerHTML = html;
  }

  function renderTable() {
    if (state.activeTab === 'discarded') {
      renderDiscardedTable();
      return;
    }

    const tableBody = document.getElementById('radar-table-body');
    const emptyEl = document.getElementById('radar-empty');
    const countSub = document.getElementById('radar-results-subtitle');

    if (!tableBody) return;

    if (countSub) {
      countSub.textContent = `${state.filtered.length} oportunidade${state.filtered.length === 1 ? '' : 's'} qualificada${state.filtered.length === 1 ? '' : 's'} exibida${state.filtered.length === 1 ? '' : 's'} · ${state.opportunities.length} no total acumulado`;
    }

    if (!state.filtered.length) {
      tableBody.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    tableBody.innerHTML = state.filtered.map((op) => {
      const levelClass = op.level === 'HIGH' ? 'score-high' : op.level === 'MEDIUM' ? 'score-medium' : 'score-low';
      const statusClass = `status-${String(op.commercialStatus || 'novo').toLowerCase()}`;
      const isPrioritySeg = ['barbearia', 'salao_de_beleza', 'manicure_nail_designer'].includes(op.segment);
      const displayTitle = op.title || op.problemDescription || 'Publicação sem título';
      const evidenceSnippet = op.exactEvidenceSnippet || op.snippet;

      return `
        <tr class="radar-row ${isPrioritySeg ? 'priority-seg-row' : ''}">
          <td>
            <div class="company">${escapeHtml(displayTitle)}</div>
            <div class="radar-evidence-highlight">
              <span class="evidence-icon">🎯 Evidência de intenção:</span>
              <span class="evidence-text">"${escapeHtml(evidenceSnippet)}"</span>
            </div>
            <div class="radar-problem-detail">
              <strong>Diagnóstico:</strong> ${escapeHtml(op.problemDescription)}
            </div>
            <div class="radar-meta-row">
              <span class="radar-source-tag">${escapeHtml(op.source || 'Fonte pública')}</span>
              <a href="${escapeHtml(op.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="radar-source-link">Abrir publicação original ↗</a>
              <span class="muted">· ${escapeHtml(formatDate(op.publishedAt))}</span>
              ${op.author ? `<span class="muted">· Autor: @${escapeHtml(op.author)}</span>` : ''}
            </div>
          </td>
          <td>
            <span class="segment-badge ${isPrioritySeg ? 'priority-segment' : ''}">
              ${escapeHtml(segmentLabels[op.segment] || op.segment)}
            </span>
          </td>
          <td>
            <div class="intent-pill ${levelClass}">
              <strong>${Number(op.score || 0)}</strong>
              <span>${escapeHtml(levelLabels[op.level] || op.level)}</span>
            </div>
            <div class="urgency-pill urgency-${String(op.urgency || 'low').toLowerCase()}">
              ${escapeHtml(urgencyLabels[op.urgency] || op.urgency)}
            </div>
          </td>
          <td>
            <span class="commercial-status-pill ${statusClass}">
              ${escapeHtml(statusLabels[op.commercialStatus] || op.commercialStatus || 'Nova')}
            </span>
          </td>
          <td class="action-cell">
            <button class="primary radar-detail-btn" type="button" data-opp-id="${escapeHtml(op.id)}">
              Ver Dossiê
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderDiscardedTable() {
    const tableBody = document.getElementById('radar-discarded-body');
    const emptyEl = document.getElementById('radar-discarded-empty');
    const countSub = document.getElementById('radar-results-subtitle');

    if (!tableBody) return;

    if (countSub) {
      countSub.textContent = `${state.discarded.length} sinal(is) descartado(s) pelo filtro anti-ruído na última busca.`;
    }

    if (!state.discarded.length) {
      tableBody.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    tableBody.innerHTML = state.discarded.map((item) => {
      const catClass = `rejection-${String(item.rejectionCategory || 'outros').toLowerCase()}`;
      const catLabel = rejectionLabels[item.rejectionCategory] || item.rejectionCategory || 'Descarte';

      return `
        <tr class="radar-discard-row">
          <td>
            <div class="company" style="font-size:13px;">${escapeHtml(item.title || item.snippet.slice(0, 70))}</div>
            <div class="muted snippet-preview" style="font-size:11.5px;">${escapeHtml(item.snippet)}</div>
            <div style="margin-top:4px;">
              <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="radar-source-link">Abrir publicação original ↗</a>
            </div>
          </td>
          <td>
            <span class="radar-source-tag">${escapeHtml(item.source || 'Fonte pública')}</span>
          </td>
          <td>
            <span class="rejection-badge ${catClass}">${escapeHtml(catLabel)}</span>
          </td>
          <td class="muted" style="font-size:11.5px;max-width:260px;">
            ${escapeHtml(item.rejectionReason || 'Não atendeu aos requisitos mínimos de compra.')}
          </td>
        </tr>
      `;
    }).join('');
  }

  function openOpportunityDrawer(id) {
    const op = state.opportunities.find((o) => o.id === id);
    if (!op) return;

    state.currentId = id;
    const drawer = document.getElementById('radar-drawer');
    const content = document.getElementById('radar-drawer-content');
    if (!drawer || !content) return;

    const isPriority = ['barbearia', 'salao_de_beleza', 'manicure_nail_designer'].includes(op.segment);
    const oppHistory = readHistory().filter((h) => h.oppId === op.id);

    const historyItems = oppHistory.length
      ? oppHistory.slice(-5).reverse().map((h) => `
          <div class="reason">
            <strong>${escapeHtml(h.action)}</strong> · ${new Date(h.timestamp).toLocaleTimeString('pt-BR')}
            ${h.details ? `<div class="muted">${escapeHtml(h.details)}</div>` : ''}
          </div>
        `).join('')
      : '<div class="muted">Nenhuma interação registrada ainda.</div>';

    const evidenceHtml = (op.evidence || []).map((e) => `<div class="radar-evidence-tag">✓ ${escapeHtml(e)}</div>`).join('');
    const blockersHtml = (op.blockers || []).map((b) => `<div class="radar-blocker-tag">⚠️ ${escapeHtml(b)}</div>`).join('');
    const displayTitle = op.title || op.problemDescription || 'Publicação original';
    const evidenceSnippet = op.exactEvidenceSnippet || op.snippet;

    content.innerHTML = `
      <div class="detail-eyebrow">
        Oportunidade Radar · ${escapeHtml(levelLabels[op.level] || op.level)} · Score ${Number(op.score || 0)}
      </div>
      <h2 class="detail-title">${escapeHtml(displayTitle)}</h2>

      <div class="detail-grid">
        <div class="detail-item">
          <span>Segmento Comercial</span>
          <strong>${escapeHtml(segmentLabels[op.segment] || op.segment)} ${isPriority ? '★' : ''}</strong>
        </div>
        <div class="detail-item">
          <span>Grau de Urgência</span>
          <strong>${escapeHtml(urgencyLabels[op.urgency] || op.urgency)}</strong>
        </div>
        <div class="detail-item">
          <span>Intenção Detectada</span>
          <strong>${escapeHtml(op.intentType === 'COMMERCIAL' ? 'Comercial Explícita' : op.intentType === 'CURIOSITY' ? 'Curiosidade' : 'Informativa')}</strong>
        </div>
        <div class="detail-item">
          <span>Data da Publicação</span>
          <strong>${escapeHtml(formatDate(op.publishedAt))}</strong>
        </div>
      </div>

      <div class="detail-section">
        <h3>Trecho Exato da Evidência</h3>
        <div class="radar-evidence-highlight" style="padding:10px 14px;font-size:13px;">
          <span class="evidence-icon">🎯 Frase identificada pelo Radar:</span>
          <span class="evidence-text">"${escapeHtml(evidenceSnippet)}"</span>
        </div>
      </div>

      <div class="detail-section">
        <h3>Diagnóstico & Aderência à Lívia</h3>
        <p class="approach-help"><strong>Problema factual:</strong> ${escapeHtml(op.problemDescription)}</p>
        <p class="approach-help"><strong>Como a Lívia atende:</strong> ${escapeHtml(op.fitWithLivia)}</p>
        <p class="approach-help"><strong>Vínculo do estabelecimento:</strong> ${escapeHtml(op.businessEvidence)}</p>
        <div class="radar-tags-container">
          ${evidenceHtml}
          ${blockersHtml}
        </div>
      </div>

      <div class="detail-section">
        <h3>Texto Completo da Publicação</h3>
        <div class="message-box">${escapeHtml(op.snippet)}</div>
        <div class="detail-actions" style="margin-top: 10px;">
          <a class="secondary" href="${escapeHtml(op.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            Abrir publicação original na íntegra ↗
          </a>
        </div>
      </div>

      <div class="detail-section">
        <h3>Abordagem Personalizada Recomendada</h3>
        <p class="approach-help">Mensagem consultiva sob medida baseada na dor verificada. Revise antes de interagir (sem disparos em massa).</p>
        <textarea id="radar-pitch-text" class="approach-message" maxlength="600">${escapeHtml(op.suggestedApproach)}</textarea>
        <div class="detail-actions" style="margin-top: 10px;">
          <button class="primary" type="button" id="radar-copy-pitch">Copiar abordagem</button>
          <a class="secondary" href="${escapeHtml(op.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            Responder na fonte ↗
          </a>
        </div>
      </div>

      <div class="detail-section">
        <h3>Situação Comercial & Encaminhamento</h3>
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;margin-bottom:12px;">
          Status comercial
          <select id="radar-status-select" style="height:38px;border-radius:8px;padding:0 10px;border:1px solid #ccc;">
            <option value="NOVO" ${op.commercialStatus === 'NOVO' ? 'selected' : ''}>Nova oportunidade</option>
            <option value="EM_ANALISE" ${op.commercialStatus === 'EM_ANALISE' ? 'selected' : ''}>Em análise / Estudo de abordagem</option>
            <option value="ABORDAGEM_APROVADA" ${op.commercialStatus === 'ABORDAGEM_APROVADA' ? 'selected' : ''}>Abordagem aprovada para contato</option>
            <option value="CONTATADO" ${op.commercialStatus === 'CONTATADO' ? 'selected' : ''}>Contatado manualmente na fonte</option>
            <option value="ENCAMINHADO_LIVIA" ${op.commercialStatus === 'ENCAMINHADO_LIVIA' ? 'selected' : ''}>Interesse confirmado → Lívia</option>
            <option value="DESCARTADO" ${op.commercialStatus === 'DESCARTADO' ? 'selected' : ''}>Descartada</option>
          </select>
        </label>

        <div class="radar-forward-box">
          <h4>Demonstração da Lívia (WhatsApp)</h4>
          <p class="approach-help">
            Quando o prospect demonstrar interesse na resposta e solicitar demonstração, registre o WhatsApp para a Lívia conduzir.
          </p>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="radar-lead-phone" type="tel" placeholder="+55 14 99999-9999" value="${escapeHtml(op.leadPhone || '')}" style="height:38px;flex:1;border-radius:8px;border:1px solid #ccc;padding:0 10px;" />
            <button class="primary" type="button" id="radar-forward-livia">Encaminhar para Lívia</button>
          </div>
          <div id="radar-livia-feedback" class="muted" style="margin-top:6px;font-size:11px;"></div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Histórico de Interações</h3>
        ${historyItems}
      </div>
    `;

    bindDrawerEvents(op);
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function bindDrawerEvents(op) {
    const copyBtn = document.getElementById('radar-copy-pitch');
    const pitchText = document.getElementById('radar-pitch-text');
    const statusSelect = document.getElementById('radar-status-select');
    const forwardBtn = document.getElementById('radar-forward-livia');
    const phoneInput = document.getElementById('radar-lead-phone');
    const feedback = document.getElementById('radar-livia-feedback');

    if (copyBtn && pitchText) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pitchText.value.trim());
          const orig = copyBtn.textContent;
          copyBtn.textContent = 'Copiado!';
          setTimeout(() => { copyBtn.textContent = orig; }, 1400);
          recordHistory(op.id, 'Abordagem copiada', pitchText.value.trim().slice(0, 100));
        } catch {
          pitchText.select();
          document.execCommand('copy');
        }
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        const prev = op.commercialStatus;
        op.commercialStatus = statusSelect.value;
        writeStoredOpportunities(state.opportunities);
        recordHistory(op.id, 'Status alterado', `${prev} → ${op.commercialStatus}`);
        filterAndSort();
      });
    }

    if (forwardBtn && phoneInput) {
      forwardBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        if (!phone) {
          if (feedback) feedback.textContent = 'Informe o telefone do prospect para encaminhar.';
          return;
        }

        forwardBtn.disabled = true;
        forwardBtn.textContent = 'Encaminhando...';
        op.leadPhone = phone;

        try {
          const res = await fetch('/api/prospecting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'prepare',
              leadId: op.id,
              phone,
              businessName: op.author || op.title || op.problemDescription.slice(0, 40),
              segment: op.segment || 'barbearia',
              initialManualMessage: pitchText ? pitchText.value.trim() : op.suggestedApproach,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            op.commercialStatus = 'ENCAMINHADO_LIVIA';
            writeStoredOpportunities(state.opportunities);
            recordHistory(op.id, 'Encaminhado para demonstração Lívia', `Telefone: ${phone}`);
            if (feedback) feedback.textContent = '✅ Sucesso! Demonstração preparada na Lívia.';
            if (statusSelect) statusSelect.value = 'ENCAMINHADO_LIVIA';
            filterAndSort();
          } else {
            if (feedback) feedback.textContent = `Aviso Lívia: ${data.error || 'Não foi possível preparar'}`;
          }
        } catch (e) {
          if (feedback) feedback.textContent = 'Erro de comunicação com o servidor da Lívia.';
        } finally {
          forwardBtn.disabled = false;
          forwardBtn.textContent = 'Encaminhar para Lívia';
        }
      });
    }
  }

  function closeRadarDrawer() {
    const drawer = document.getElementById('radar-drawer');
    if (drawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
  }

  async function handleScanSubmit(e) {
    if (e) e.preventDefault();
    if (state.isScanning) return;

    const queryInput = document.getElementById('radar-query-input');
    const presetSelect = document.getElementById('radar-preset-select');
    const segmentSelect = document.getElementById('radar-segment-select');
    const btn = document.getElementById('radar-scan-btn');
    const errorEl = document.getElementById('radar-error');
    const limitationEl = document.getElementById('radar-limitations');

    const query = (queryInput?.value || presetSelect?.value || '').trim();
    const segment = segmentSelect?.value !== 'all' ? segmentSelect?.value : undefined;

    state.isScanning = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Escaneando fontes públicas...';
    }
    if (errorEl) errorEl.classList.add('hidden');

    try {
      const res = await fetch('/api/intent-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          query: query || undefined,
          segment,
          limit: 15,
          includeLowAndDiscarded: false, // Oportunidades são estritamente separadas de descartados
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao escanear o radar.');
      }

      state.sourcesQueried = data.queriedSources || [];
      state.limitations = data.sourceLimitations || [];
      state.totalCollected = data.totalSignalsCollected || 0;
      state.metricsBySource = data.metricsBySource || {};
      state.rejectionBreakdown = data.rejectionBreakdown || {};
      state.discarded = Array.isArray(data.discardedAudit) ? data.discardedAudit : [];

      if (limitationEl) {
        if (state.limitations.length) {
          limitationEl.textContent = `Fontes consultadas: ${state.sourcesQueried.join(', ')}. Observação: ${state.limitations.join(' · ')}`;
          limitationEl.classList.remove('hidden');
        } else {
          limitationEl.textContent = `Fontes auditadas e ativas: ${state.sourcesQueried.join(', ')}.`;
          limitationEl.classList.remove('hidden');
        }
      }

      // Adiciona apenas as qualificadas
      if (Array.isArray(data.opportunities)) {
        mergeOpportunities(data.opportunities);
      }

      filterAndSort();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err instanceof Error ? err.message : 'Falha na varredura.';
        errorEl.classList.remove('hidden');
      }
    } finally {
      state.isScanning = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Escanear Radar';
      }
    }
  }

  async function handleManualSignalSubmit(e) {
    e.preventDefault();
    const textInput = document.getElementById('manual-signal-text');
    const urlInput = document.getElementById('manual-signal-url');
    const segInput = document.getElementById('manual-signal-segment');
    const errorEl = document.getElementById('manual-signal-error');
    const modal = document.getElementById('manual-signal-modal');

    const text = textInput ? textInput.value.trim() : '';
    const sourceUrl = urlInput ? urlInput.value.trim() : '';
    const segment = segInput ? segInput.value : undefined;

    if (!text || !sourceUrl) {
      if (errorEl) {
        errorEl.textContent = 'Preencha o link da fonte e o texto da publicação.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    try {
      const res = await fetch('/api/intent-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signals: [{ text, sourceUrl, segment }],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok || !Array.isArray(data.results)) {
        throw new Error(data.error || 'Erro ao avaliar sinal.');
      }

      mergeOpportunities(data.results);
      filterAndSort();

      if (modal) modal.classList.add('hidden');
      if (textInput) textInput.value = '';
      if (urlInput) urlInput.value = '';
      if (errorEl) errorEl.classList.add('hidden');

      if (data.results[0]?.id && data.results[0]?.level !== 'NONE') {
        openOpportunityDrawer(data.results[0].id);
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err instanceof Error ? err.message : 'Falha ao processar sinal.';
        errorEl.classList.remove('hidden');
      }
    }
  }

  function init() {
    state.opportunities = readStoredOpportunities();

    // Sincronização dos presets
    const presetSelect = document.getElementById('radar-preset-select');
    const queryInput = document.getElementById('radar-query-input');
    if (presetSelect && queryInput) {
      presetSelect.addEventListener('change', () => {
        if (presetSelect.value) {
          queryInput.value = presetSelect.value;
        }
      });
    }

    // Tabs
    document.getElementById('radar-tab-opps')?.addEventListener('click', () => switchTab('opps'));
    document.getElementById('radar-tab-discarded')?.addEventListener('click', () => switchTab('discarded'));

    // Filtros
    document.getElementById('radar-filter-segment')?.addEventListener('change', filterAndSort);
    document.getElementById('radar-filter-level')?.addEventListener('change', filterAndSort);
    document.getElementById('radar-filter-status')?.addEventListener('change', filterAndSort);

    // Formulário de busca
    document.getElementById('radar-search-form')?.addEventListener('submit', handleScanSubmit);

    // Delegação de cliques na tabela
    document.getElementById('radar-table-body')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-opp-id]');
      if (btn) {
        openOpportunityDrawer(btn.dataset.oppId);
      }
    });

    // Drawer close
    document.getElementById('radar-drawer-close')?.addEventListener('click', closeRadarDrawer);
    document.getElementById('radar-drawer-backdrop')?.addEventListener('click', closeRadarDrawer);

    // Modal de sinal manual
    document.getElementById('radar-manual-signal-open')?.addEventListener('click', () => {
      const modal = document.getElementById('manual-signal-modal');
      if (modal) modal.classList.remove('hidden');
    });

    document.getElementById('manual-signal-form')?.addEventListener('submit', handleManualSignalSubmit);

    // Render inicial
    filterAndSort();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exportação para testes
  window.RadarUi = {
    state,
    filterAndSort,
    switchTab,
    handleScanSubmit,
    openOpportunityDrawer,
    closeRadarDrawer,
    mergeOpportunities,
  };
})();
