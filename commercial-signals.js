(() => {
  const STORAGE_KEY = 'liviaRevenueCommercialSignals';

  function readSignals() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function writeSignals(value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  function currentLeadKey() {
    const heading = document.querySelector('#drawer-content h2, #drawer-content h3');
    return heading ? heading.textContent.trim() : null;
  }

  function render() {
    const drawer = document.getElementById('drawer-content');
    if (!drawer || !drawer.textContent.trim()) return;
    if (drawer.querySelector('[data-commercial-signals]')) return;

    const key = currentLeadKey();
    if (!key) return;

    const text = drawer.textContent;
    const hasMaps = /Google Maps|Conferir no Maps|Revisar no Maps/i.test(text);
    const hasWebsite = /Conferir site|Revisar site/i.test(text);
    const reviewMatch = text.match(/(\d+) avaliações/i);
    const reviews = reviewMatch ? Number(reviewMatch[1]) : null;
    const signals = readSignals();
    const saved = signals[key] || {};

    const traffic = saved.paidTraffic || 'UNKNOWN';
    const trafficLabel = { YES: 'Sim', NO: 'Não', UNKNOWN: 'Não verificado' }[traffic];

    const section = document.createElement('section');
    section.className = 'detail-section';
    section.dataset.commercialSignals = 'true';
    section.innerHTML = `
      <h3>Sinais comerciais</h3>
      <div class="reason"><strong>Google / Perfil da empresa</strong> · ${hasMaps ? 'Encontrado' : 'Não confirmado'}</div>
      <div class="reason"><strong>Site</strong> · ${hasWebsite ? 'Encontrado' : 'Não encontrado'}</div>
      <div class="reason"><strong>Avaliações Google</strong> · ${reviews !== null ? `${reviews} avaliações` : 'Não informado'}</div>
      <div class="reason"><strong>Tráfego pago</strong> · <span data-paid-traffic>${trafficLabel}</span></div>
      <div class="detail-actions">
        <button class="secondary" type="button" data-traffic="YES">Roda tráfego</button>
        <button class="secondary" type="button" data-traffic="NO">Não roda</button>
        <button class="secondary" type="button" data-traffic="UNKNOWN">Não verificado</button>
      </div>
      <div class="approach-note">Os sinais são usados como contexto comercial. O Revenue Engine não deve afirmar que uma empresa anuncia se isso não foi confirmado.</div>
    `;

    const approach = drawer.querySelector('.detail-section h3')?.parentElement;
    if (approach) approach.before(section);
    else drawer.prepend(section);

    section.querySelectorAll('[data-traffic]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = { ...readSignals(), [key]: { paidTraffic: button.dataset.traffic } };
        writeSignals(next);
        const label = { YES: 'Sim', NO: 'Não', UNKNOWN: 'Não verificado' }[button.dataset.traffic];
        const target = section.querySelector('[data-paid-traffic]');
        if (target) target.textContent = label;
      });
    });
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
