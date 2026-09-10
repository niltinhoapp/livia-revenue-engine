(() => {
  const STORAGE_KEY = 'liviaRevenueCommercialSignals';

  function readSignals() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function writeSignals(value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  function currentLeadKey() {
    const drawer = document.querySelector('#drawer-content');
    if (!drawer) return null;
    const phoneMatch = drawer.textContent.match(/\+55\s*\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
    if (phoneMatch) return `phone:${phoneMatch[0].replace(/\D/g, '')}`;
    const heading = drawer.querySelector('h2, h3');
    const name = heading?.textContent?.trim();
    return name ? `name:${name}` : null;
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
    const saved = readSignals()[key] || {};
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

    const approach = [...drawer.querySelectorAll('.detail-section')]
      .find((item) => item.querySelector('h3')?.textContent?.trim() === 'Abordagem');
    if (approach) approach.before(section);
    else drawer.prepend(section);

    section.querySelectorAll('[data-traffic]').forEach((button) => {
      button.addEventListener('click', () => {
        const signals = readSignals();
        signals[key] = { paidTraffic: button.dataset.traffic };
        writeSignals(signals);
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
