(() => {
  const SIGNALS_STORAGE_KEY = 'liviaRevenueCommercialSignals';

  function readSignals() {
    try {
      const value = JSON.parse(localStorage.getItem(SIGNALS_STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function leadKeyFromDrawer(drawer) {
    const phoneMatch = drawer.textContent.match(/\+55\s*\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
    if (phoneMatch) return `phone:${phoneMatch[0].replace(/\D/g, '')}`;
    const heading = drawer.querySelector('h2, h3');
    const name = heading?.textContent?.trim();
    return name ? `name:${name}` : null;
  }

  function getContext(drawer) {
    const text = drawer.textContent;
    const key = leadKeyFromDrawer(drawer);
    const saved = key ? readSignals()[key] || {} : {};
    const hasMaps = /Google Maps|Conferir no Maps|Revisar no Maps/i.test(text);
    const hasWebsite = /Conferir site|Revisar site/i.test(text);
    const reviewMatch = text.match(/(\d+) avaliações/i);
    const reviews = reviewMatch ? Number(reviewMatch[1]) : null;
    const paidTraffic = saved.paidTraffic || 'UNKNOWN';
    return { key, hasMaps, hasWebsite, reviews, paidTraffic };
  }

  function businessName(drawer) {
    const heading = drawer.querySelector('h2, h3');
    return heading?.textContent?.trim() || 'seu negócio';
  }

  function buildVariations(name, context) {
    const presence = context.hasMaps
      ? `Vi a ${name} no Google e queria te fazer uma pergunta rápida.`
      : `Encontrei a ${name} e queria te fazer uma pergunta rápida.`;

    const digital = context.hasWebsite
      ? 'Vi que vocês também têm site.'
      : 'Queria entender como vocês estão cuidando do atendimento online.';

    const traffic = context.paidTraffic === 'YES'
      ? 'Como vocês já trabalham a divulgação, queria entender se o WhatsApp consegue acompanhar as oportunidades que chegam.'
      : context.paidTraffic === 'NO'
        ? 'Talvez exista uma oportunidade simples de melhorar o atendimento antes mesmo de investir mais em divulgação.'
        : 'Queria entender se hoje vocês conseguem atender rapidamente quem chama no WhatsApp quando a equipe está ocupada.';

    return [
      `${presence} Hoje vocês conseguem responder todos os clientes que chamam pelo WhatsApp, mesmo nos horários mais corridos? A Livia é uma recepcionista virtual para esse primeiro atendimento. Se fizer sentido, posso te mostrar como funciona.`,
      `Oi! Tudo certo? ${digital} Quando chegam mensagens enquanto vocês estão atendendo, alguém consegue responder todos os clientes? A Livia ajuda justamente nesse primeiro atendimento. Posso te mostrar rapidamente como funciona?`,
      `Oi! Tudo bem? ${traffic} A Livia pode cuidar desse primeiro atendimento no WhatsApp enquanto vocês trabalham. Se quiser, te mostro sem compromisso.`,
    ].map((message) => message.slice(0, 450));
  }

  function applyToNewApproach() {
    const drawer = document.getElementById('drawer-content');
    if (!drawer) return;
    const textarea = drawer.querySelector('#approach-message');
    if (!textarea || textarea.dataset.signalContextApplied === 'true') return;

    const context = getContext(drawer);
    if (!context.key) return;

    const variationMatch = drawer.textContent.match(/Variação\s+(\d+)\s+de\s+(\d+)/i);
    const variation = variationMatch ? Math.max(1, Number(variationMatch[1])) : 1;
    const variations = buildVariations(businessName(drawer), context);
    const index = (variation - 1) % variations.length;

    textarea.value = variations[index];
    textarea.dataset.signalContextApplied = 'true';
    textarea.dataset.signalContextKey = context.key;

    const counter = drawer.querySelector('#approach-count');
    if (counter) counter.textContent = `${textarea.value.length}/450`;

    let note = drawer.querySelector('[data-approach-context-note]');
    if (!note) {
      note = document.createElement('div');
      note.className = 'approach-note';
      note.dataset.approachContextNote = 'true';
      note.textContent = 'Abordagem ajustada com os sinais comerciais disponíveis. Revise antes de enviar.';
      textarea.parentElement?.appendChild(note);
    }
  }

  const start = () => {
    const drawer = document.getElementById('drawer-content');
    if (!drawer) return;
    const observer = new MutationObserver(() => applyToNewApproach());
    observer.observe(drawer, { childList: true, subtree: true });
    applyToNewApproach();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
