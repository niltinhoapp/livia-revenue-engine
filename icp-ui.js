(() => {
  const ICP_NAMES = {
    barbearia: 'Barbearias', salao_de_beleza: 'Salões de beleza', manicure_nail_designer: 'Manicure / Nail Designer',
    clinica_estetica: 'Clínicas de estética', depilacao: 'Depilação', lash_designer: 'Lash Designers',
    sobrancelhas_micropigmentacao: 'Sobrancelhas / Micropigmentação', massoterapia: 'Massoterapia', spa: 'Spas',
    studio_tattoo_piercing: 'Estúdios de tatuagem / Piercing', clinica_odontologica: 'Clínicas odontológicas',
    clinica_medica: 'Clínicas médicas', fisioterapia: 'Fisioterapia', psicologia: 'Psicologia', nutricao: 'Nutrição',
    fonoaudiologia: 'Fonoaudiologia', dermatologia: 'Dermatologia', oftalmologia: 'Oftalmologia', veterinaria: 'Clínicas veterinárias',
    pet_shop: 'Pet shops', oficina_mecanica: 'Oficinas mecânicas', auto_eletrica: 'Autoelétrica',
    funilaria_pintura: 'Funilaria / Pintura automotiva', ar_condicionado: 'Ar-condicionado', assistencia_tecnica: 'Assistência técnica',
    empresa_limpeza: 'Empresas de limpeza', dedetizadora: 'Dedetizadoras', marcenaria: 'Marcenarias', serralheria: 'Serralherias',
    eletricista: 'Eletricistas', encanador: 'Encanadores', imobiliaria: 'Imobiliárias', corretor_imoveis: 'Corretores de imóveis',
    arquitetura: 'Arquitetura', engenharia: 'Engenharia', moveis_planejados: 'Móveis planejados', vidracaria: 'Vidraçarias',
    marmoraria: 'Marmorarias', empresa_reformas: 'Empresas de reformas', material_construcao: 'Materiais de construção',
    escola_curso: 'Escolas / Cursos', curso_idiomas: 'Cursos de idiomas', curso_profissionalizante: 'Cursos profissionalizantes',
    autoescola: 'Autoescolas', reforco_escolar: 'Reforço escolar', curso_preparatorio: 'Cursos preparatórios',
    loja_roupas: 'Lojas de roupas', loja_calcados: 'Lojas de calçados', otica: 'Óticas', loja_moveis: 'Lojas de móveis',
    loja_eletronicos: 'Lojas de eletrônicos', loja_celulares: 'Lojas de celulares', loja_cosmeticos: 'Lojas de cosméticos',
    restaurante: 'Restaurantes', pizzaria: 'Pizzarias', hamburgueria: 'Hamburguerias', lanchonete: 'Lanchonetes',
    cafeteria: 'Cafeterias', padaria: 'Padarias', doceria: 'Docerias / Confeitarias', marmitaria: 'Marmitarias',
  };

  const fillSelect = (select, includeAll = false) => {
    if (!select) return;
    const current = select.value;
    const fragment = document.createDocumentFragment();
    if (includeAll) {
      const all = document.createElement('option');
      all.value = 'all';
      all.textContent = 'Todos os segmentos';
      fragment.appendChild(all);
    }
    Object.entries(ICP_NAMES).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      fragment.appendChild(option);
    });
    select.replaceChildren(fragment);
    if (ICP_NAMES[current] || (includeAll && current === 'all')) select.value = current;
    else if (!includeAll) select.value = 'barbearia';
    else select.value = 'all';
  };

  const syncSelectedLabel = () => {
    const select = document.getElementById('search-segment');
    const label = document.getElementById('selected-segment-label');
    if (select && label && ICP_NAMES[select.value]) label.textContent = ICP_NAMES[select.value];
  };

  const normalizeTableSegments = () => {
    const rows = document.querySelectorAll('#lead-table tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const key = cells[1].textContent.trim();
      if (ICP_NAMES[key]) cells[1].textContent = ICP_NAMES[key];
    });
  };

  const init = () => {
    fillSelect(document.getElementById('search-segment'));
    fillSelect(document.getElementById('segment-filter'), true);
    const select = document.getElementById('search-segment');
    if (select) select.addEventListener('change', syncSelectedLabel);
    syncSelectedLabel();
    normalizeTableSegments();
    const observer = new MutationObserver(() => {
      syncSelectedLabel();
      normalizeTableSegments();
    });
    const target = document.getElementById('results') || document.body;
    observer.observe(target, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
