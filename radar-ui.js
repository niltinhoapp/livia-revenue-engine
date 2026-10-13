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
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function writeStoredOpportunities(list) {
    try {
      localStorage.setItem(RADAR_STORAGE_KEY, JSON.stringify(list));
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
    const existingMap = new Map(state.opportunities.map((o) => [o.sourceUrl, o]));

    for (const item of incoming) {
      if (existingMap.has(item.sourceUrl)) {
        // Preserva status e anotações já feitas
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
    renderTable();
  }

  function renderMetrics() {
    const total = state.opportunities.length;
    const high = state.opportunities.filter((o) => o.level === 'HIGH').length;
    const medium = state.opportunities.filter((o) => o.level === 'MEDIUM').length;
    const priority = state.opportunities.filter((o) =>
      ['barbearia', 'salao_de_beleza', 'manicure_nail_designer'].includes(o.segment),
    ).length;

    const elTotal = document.getElementById('radar-metric-total');
    const elQualified = document.getElementById('radar-metric-qualified');
    const elHigh = document.getElementById('radar-metric-high');
    const elPriority = document.getElementById('radar-metric-priority');

    if (elTotal) elTotal.textContent = String(total);
    if (elQualified) elQualified.textContent = String(high + medium);
    if (elHigh) elHigh.textContent = String(high);
    if (elPriority) elPriority.textContent = String(priority);
  }

  function renderTable() {
    const tableBody = document.getElementById('radar-table-body');
    const emptyEl = document.getElementById('radar-empty');
    const countSub = document.getElementById('radar-results-subtitle');

    if (!tableBody) return;

    if (countSub) {
      countSub.textContent = `${state.filtered.length} oportunidade${state.filtered.length === 1 ? '' : 's'} exibida${state.filtered.length === 1 ? '' : 's'} · ${state.opportunities.length} no total acumulado`;
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

      return `
        <tr class="radar-row ${isPrioritySeg ? 'priority-seg-row' : ''}">
          <td>
            <div class="company">${escapeHtml(op.problemDescription)}</div>
            <div class="muted snippet-preview">${escapeHtml(op.snippet)}</div>
            <div class="radar-meta-row">
              <span class="radar-source-tag">${escapeHtml(op.source || 'Fonte pública')}</span>
              <a href="${escapeHtml(op.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="radar-source-link">Abrir publicação original ↗</a>
              <span class="muted">· ${escapeHtml(formatDate(op.publishedAt))}</span>
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

    content.innerHTML = `
      <div class="detail-eyebrow">
        Oportunidade Radar · ${escapeHtml(levelLabels[op.level] || op.level)} · Score ${Number(op.score || 0)}
      </div>
      <h2 class="detail-title">${escapeHtml(op.problemDescription)}</h2>

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
        <h3>Diagnóstico & Aderência à Lívia</h3>
        <p class="approach-help"><strong>Como a Lívia atende:</strong> ${escapeHtml(op.fitWithLivia)}</p>
        <p class="approach-help"><strong>Vínculo do estabelecimento:</strong> ${escapeHtml(op.businessEvidence)}</p>
        <div class="radar-tags-container">
          ${evidenceHtml}
          ${blockersHtml}
        </div>
      </div>

      <div class="detail-section">
        <h3>Publicação Original Verificada</h3>
        <div class="message-box">${escapeHtml(op.snippet)}</div>
        <div class="detail-actions" style="margin-top: 10px;">
          <a class="secondary" href="${escapeHtml(op.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            Abrir publicação original na íntegra ↗
          </a>
        </div>
      </div>

      <div class="detail-section">
        <h3>Abordagem Personalizada Recomendada</h3>
        <p class="approach-help">Mensagem sob medida com base na dor identificada. Revise antes de interagir (sem disparos em massa).</p>
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
              businessName: op.author || op.problemDescription.slice(0, 40),
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
          includeLowAndDiscarded: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao escanear o radar.');
      }

      state.sourcesQueried = data.queriedSources || [];
      state.limitations = data.sourceLimitations || [];

      if (limitationEl) {
        if (state.limitations.length) {
          limitationEl.textContent = `Fontes consultadas: ${state.sourcesQueried.join(', ')}. Observação: ${state.limitations.join(' · ')}`;
          limitationEl.classList.remove('hidden');
        } else {
          limitationEl.textContent = `Fontes ativas e verificadas: ${state.sourcesQueried.join(', ')}.`;
          limitationEl.classList.remove('hidden');
        }
      }

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

      if (data.results[0]?.id) {
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

    // Preset selector synchronization
    const presetSelect = document.getElementById('radar-preset-select');
    const queryInput = document.getElementById('radar-query-input');
    if (presetSelect && queryInput) {
      presetSelect.addEventListener('change', () => {
        if (presetSelect.value) {
          queryInput.value = presetSelect.value;
        }
      });
    }

    // Filter bindings
    document.getElementById('radar-filter-segment')?.addEventListener('change', filterAndSort);
    document.getElementById('radar-filter-level')?.addEventListener('change', filterAndSort);
    document.getElementById('radar-filter-status')?.addEventListener('change', filterAndSort);

    // Form submit
    document.getElementById('radar-search-form')?.addEventListener('submit', handleScanSubmit);

    // Table click delegation
    document.getElementById('radar-table-body')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-opp-id]');
      if (btn) {
        openOpportunityDrawer(btn.dataset.oppId);
      }
    });

    // Drawer close buttons
    document.getElementById('radar-drawer-close')?.addEventListener('click', closeRadarDrawer);
    document.getElementById('radar-drawer-backdrop')?.addEventListener('click', closeRadarDrawer);

    // Manual Signal Modal
    const manualBtn = document.getElementById('radar-manual-signal-open');
    const modal = document.getElementById('manual-signal-modal');
    const cancelBtn = document.getElementById('manual-signal-cancel');
    const modalBackdrop = document.getElementById('manual-signal-backdrop');

    if (manualBtn && modal) {
      manualBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    }
    if (cancelBtn && modal) {
      cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modalBackdrop && modal) {
      modalBackdrop.addEventListener('click', () => modal.classList.add('hidden'));
    }
    document.getElementById('manual-signal-form')?.addEventListener('submit', handleManualSignalSubmit);

    filterAndSort();

    // Auto-scan initial preset if empty
    if (!state.opportunities.length) {
      handleScanSubmit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RadarUi = {
    state,
    filterAndSort,
    handleScanSubmit,
    openOpportunityDrawer,
  };
})();
