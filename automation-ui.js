(() => {
  const cache = new Map();
  const SIGNAL_LABELS = {
    PROBABLE: 'Provável',
    POSSIBLE: 'Possível',
    NOT_DETECTED: 'Não identificado',
    UNVERIFIED: 'Não verificado',
  };
  const SIGNAL_CLASS = {
    PROBABLE: 'phone-status-verified',
    POSSIBLE: 'phone-status-needs_review',
    NOT_DETECTED: 'phone-status-missing',
    UNVERIFIED: 'phone-status-rejected',
  };

  function keyForLead(lead) {
    if (lead?.phone) return `phone:${String(lead.phone).replace(/\D/g, '')}`;
    return lead?.name ? `name:${String(lead.name).trim()}` : null;
  }

  function rememberLeads(leads) {
    if (!Array.isArray(leads)) return;
    leads.forEach((lead) => {
      const key = keyForLead(lead);
      if (key) cache.set(key, lead);
    });
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    try {
      const url = String(args[0]?.url || args[0] || '');
      if (url.includes('/api?')) {
        const clone = response.clone();
        const data = await clone.json();
        rememberLeads(data.leads);
      }
    } catch {
      // A falha na camada visual não deve interferir na pesquisa.
    }
    return response;
  };

  function currentLead() {
    const drawer = document.getElementById('drawer-content');
    if (!drawer) return null;
    const text = drawer.textContent || '';
    const phone = text.match(/\+55\s*\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
    if (phone) return cache.get(`phone:${phone[0].replace(/\D/g, '')}`) || null;
    const heading = drawer.querySelector('h2, h3');
    const name = heading?.textContent?.trim();
    return name ? cache.get(`name:${name}`) || null : null;
  }

  function render() {
    const drawer = document.getElementById('drawer-content');
    if (!drawer || !drawer.textContent.trim() || drawer.querySelector('[data-automation-signals]')) return;
    const lead = currentLead();
    if (!lead) return;

    const signal = lead.automationSignal || 'UNVERIFIED';
    const evidence = Array.isArray(lead.automationEvidence) ? lead.automationEvidence : [];
    const label = SIGNAL_LABELS[signal] || 'Não verificado';
    const className = SIGNAL_CLASS[signal] || 'phone-status-rejected';

    const section = document.createElement('section');
    section.className = 'detail-section';
    section.dataset.automationSignals = 'true';
    section.innerHTML = `
      <h3>Sinal de automação</h3>
      <div class="${className}"><strong>${label}</strong></div>
      <div class="muted">${lead.website ? 'Análise pública do site encontrada na pesquisa.' : 'Não há site público para análise automática.'}</div>
      ${evidence.map((item) => `<div class="reason">· ${escapeHtml(item)}</div>`).join('')}
      <div class="approach-note">Isso é um indício público, não uma confirmação de que a empresa usa bot no WhatsApp. A confirmação real continua sendo feita no contato.</div>
    `;

    const commercial = [...drawer.querySelectorAll('.detail-section')]
      .find((item) => item.querySelector('h3')?.textContent?.trim() === 'Sinais comerciais');
    if (commercial) commercial.after(section);
    else drawer.prepend(section);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  const observer = new MutationObserver(render);
  const start = () => {
    const drawer = document.getElementById('drawer-content');
    if (!drawer) return;
    observer.observe(drawer, { childList: true, subtree: true, characterData: true });
    render();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
