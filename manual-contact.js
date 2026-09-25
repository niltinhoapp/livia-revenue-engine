(function () {
  const openButton = document.getElementById('manual-contact-open');
  const modal = document.getElementById('manual-contact-modal');
  const form = document.getElementById('manual-contact-form');
  if (!openButton || !modal || !form) return;

  const nameInput = document.getElementById('manual-name');
  const phoneInput = document.getElementById('manual-phone');
  const segmentSelect = document.getElementById('manual-segment');
  const typeSelect = document.getElementById('manual-type');
  const errorBox = document.getElementById('manual-error');
  const submitButton = document.getElementById('manual-submit');

  function showError(html) { errorBox.innerHTML = html; errorBox.classList.remove('hidden'); }
  function clearError() { errorBox.innerHTML = ''; errorBox.classList.add('hidden'); }

  function openModal() {
    form.reset();
    typeSelect.value = 'revenue';
    clearError();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    nameInput.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function buildManualLead({ name, phone, segment, isDemo }) {
    return {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      phone,
      segment,
      score: 0,
      scoreReasons: ['Contato cadastrado manualmente — sem sinais do Google Maps.'],
      stage: 'NOVO',
      source: 'manual',
      phoneStatus: 'VERIFIED',
      city: '',
      state: '',
      address: '',
      website: '',
      googleMapsUrl: '',
      rating: null,
      reviews: null,
      ...(isDemo ? { isDemo: true, channel: 'demo' } : {})
    };
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();

    const name = nameInput.value.trim();
    const rawPhone = phoneInput.value.trim();
    const segment = segmentSelect.value;
    const isDemo = typeSelect.value === 'demo';

    if (!name) { showError('Informe o nome do estabelecimento.'); return; }

    const digits = normalizedPhone(rawPhone);
    if (!digits || digits.length < 12 || digits.length > 13) {
      showError('Informe um telefone válido com DDI e DDD. Ex.: +55 14 99999-9999');
      return;
    }

    // Reuse the existing phone-based dedup rule for real commercial leads.
    if (!isDemo) {
      const existing = findLeadByPhone(digits);
      if (existing) {
        showError(`Este telefone já pertence ao lead <strong>${escapeHtml(existing.name)}</strong>. <button type="button" class="link-btn" id="manual-open-existing">Abrir lead existente</button>`);
        const openExisting = document.getElementById('manual-open-existing');
        if (openExisting) openExisting.addEventListener('click', () => { closeModal(); openLead(existing.id); });
        return;
      }
    }

    submitButton.disabled = true;
    try {
      const lead = buildManualLead({ name, phone: digits, segment, isDemo });
      state.leads.push(lead);
      setPhoneStatus(lead, 'VERIFIED');
      persistManualLeads();
      recordCrmEvent(lead, 'LEAD_UPDATED', { note: isDemo ? 'Contato de demonstração cadastrado manualmente.' : 'Lead cadastrado manualmente.' });
      revealResults();
      renderTable();
      updateSummary({});
      closeModal();
      openLead(lead.id);
    } finally {
      submitButton.disabled = false;
    }
  });

  openButton.addEventListener('click', openModal);
  document.getElementById('manual-contact-close')?.addEventListener('click', closeModal);
  document.getElementById('manual-contact-backdrop')?.addEventListener('click', closeModal);
  document.getElementById('manual-cancel')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });
})();
