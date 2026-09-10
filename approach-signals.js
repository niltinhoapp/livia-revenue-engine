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
    const opening = context.hasMaps
      ? `Oi, tudo bem? Aqui é da Conect Web. Vi a ${name} no Google e entrei em contato porque estamos conversando com alguns negócios sobre atendimento pelo WhatsApp.`
      : `Oi, tudo bem? Aqui é da Conect Web. Encontrei a ${name} e entrei em contato porque estamos conversando com alguns negócios sobre atendimento pelo WhatsApp.`;

    const contextLine = context.hasWebsite
      ? 'Vi que vocês já têm uma presença digital estruturada e queria entender como o atendimento acompanha as oportunidades que chegam pelo WhatsApp.'
      : 'Queria entender como vocês estão cuidando hoje das mensagens que chegam pelo WhatsApp, principalmente quando a equipe está ocupada.';

    const opportunityLine = context.paidTraffic === 'YES'
      ? 'Quando existe divulgação, uma parte importante é conseguir acompanhar bem os contatos que chegam.'
      : context.paidTraffic === 'NO'
        ? 'Antes de pensar em aumentar a divulgação, muitas empresas acabam encontrando oportunidades de melhoria no próprio atendimento.'
        : 'Em muitos negócios, algumas oportunidades acabam ficando sem resposta justamente nos horários mais corridos.';

    return [
      `${opening} A gente desenvolveu a Livia, uma recepcionista virtual para WhatsApp que ajuda a cuidar do primeiro atendimento quando a equipe está ocupada ou fora do horário. ${contextLine} Hoje vocês conseguem responder rapidamente todos os clientes que chamam por lá?`,
      `Oi! Tudo certo? Aqui é da Conect Web. ${contextLine} A gente desenvolveu a Livia para ajudar empresas a organizar e agilizar o primeiro atendimento pelo WhatsApp, sem substituir a equipe. Queria saber como vocês fazem isso hoje e, se fizer sentido, te mostro rapidamente como funciona.`,
      `${opening} ${opportunityLine} A Livia foi criada justamente para apoiar esse primeiro atendimento no WhatsApp, mantendo a equipe focada no trabalho. Posso te explicar em 1 minuto como funciona e você me diz se faria sentido para a ${name}?`,
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
      note.textContent = 'Abordagem profissional ajustada com os sinais comerciais disponíveis. Revise antes de enviar.';
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
