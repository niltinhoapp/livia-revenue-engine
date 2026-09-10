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

  const observer = new MutationObserver(() => {
    refreshResultsUx();
    addOpportunityReason();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  refreshResultsUx();
})();
