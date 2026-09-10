(() => {
  const stageOrder = [
    'NOVO',
    'QUALIFICADO',
    'CONTATADO',
    'RESPONDEU',
    'INTERESSADO',
    'DEMONSTRAÇÃO',
    'PROPOSTA',
    'NEGOCIAÇÃO',
    'GANHO',
    'PERDIDO',
    'OPT-OUT',
  ];

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

  const SELECT_ID = 'crm-stage-select';

  function getCurrentLead() {
    if (typeof state === 'undefined' || !Array.isArray(state.leads)) return null;
    return state.leads.find((lead) => String(lead.id) === String(state.currentLeadId)) || null;
  }

  function record(lead, type, details) {
    if (typeof recordCrmEvent === 'function') recordCrmEvent(lead, type, details);
  }

  function render() {
    const drawerContent = document.getElementById('drawer-content');
    const lead = getCurrentLead();
    if (!drawerContent || !lead || document.getElementById(SELECT_ID)) return;

    const anchor = drawerContent.querySelector('.detail-eyebrow');
    if (!anchor) return;

    const section = document.createElement('div');
    section.className = 'detail-section';
    section.innerHTML = `
      <h3>Etapa do funil</h3>
      <label for="${SELECT_ID}">Atualize a etapa conforme a evolução comercial.</label>
      <select id="${SELECT_ID}" aria-label="Etapa do funil">
        ${stageOrder.map((stage) => `<option value="${stage}">${stageNames[stage]}</option>`).join('')}
      </select>
      <div class="approach-note">A mudança de etapa é manual e fica registrada no histórico CRM.</div>
    `;

    anchor.insertAdjacentElement('afterend', section);
    const select = document.getElementById(SELECT_ID);
    if (!select) return;
    select.value = stageOrder.includes(lead.stage) ? lead.stage : 'NOVO';

    select.addEventListener('change', () => {
      const currentLead = getCurrentLead();
      if (!currentLead) return;
      const fromStage = currentLead.stage;
      const toStage = select.value;
      if (fromStage === toStage) return;

      currentLead.stage = toStage;
      currentLead.updatedAt = new Date().toISOString();
      if (toStage === 'OPT-OUT') currentLead.optOut = true;
      if (fromStage === 'OPT-OUT' && toStage !== 'OPT-OUT') currentLead.optOut = false;

      record(currentLead, 'STAGE_CHANGED', { fromStage, toStage });
      if (toStage === 'OPT-OUT') record(currentLead, 'OPT_OUT', { note: 'Lead marcado manualmente como opt-out.' });

      if (typeof renderTable === 'function') renderTable();
      if (typeof openLead === 'function') openLead(currentLead.id);
    });
  }

  const observer = new MutationObserver(render);
  observer.observe(document.getElementById('drawer-content') || document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', render);
})();
