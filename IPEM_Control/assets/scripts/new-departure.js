if (!requireLogin()) { /* redireciona */ }

  /* ── Estado ── */
  let selectedVehicle   = null;
  let secondConductor   = null;
  let serviceTypes      = [];

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    fillDateTime();
    loadVehicle();
    checkActiveDeparture();
  });

  /* ── Preenche data/hora atual ── */
  function fillDateTime() {
    const { date, time } = currentDateTime();
    document.getElementById('input-date').value = date;
    document.getElementById('input-time').value = time;
  }

  /* ── Carrega dados do condutor logado ── */
  const user = getUser();
  if (user) {
    document.getElementById('conductor-name').textContent =
      user.fullName ?? user.name ?? '—';
  }

  /* ── Carrega viatura selecionada ── */
  async function loadVehicle() {
    const vehicleId = sessionStorage.getItem('selectedVehicleId');
    if (!vehicleId) {
      showModal('Viatura não selecionada',
        'Nenhuma viatura foi selecionada. Volte e selecione uma viatura.',
        'error', () => window.location.href = './vehicles.html');
      return;
    }

    try {
      selectedVehicle = await apiFetch(`/vehicles/${vehicleId}`);
    } catch {
      try {
        selectedVehicle = JSON.parse(sessionStorage.getItem('selectedVehicle'));
      } catch { /* silent */ }
    }

    if (!selectedVehicle) return;

    document.getElementById('vehicle-prefix').textContent  = selectedVehicle.prefix ?? '—';
    document.getElementById('vehicle-model').textContent   = `${selectedVehicle.brand ?? ''} ${selectedVehicle.model ?? '—'}`.trim();
    document.getElementById('vehicle-license').textContent = selectedVehicle.licenseCategory ?? '—';

    if (selectedVehicle.currentMileage != null) {
      document.getElementById('input-mileage').value = selectedVehicle.currentMileage;
    }

    loadServiceTypes(vehicleId);
  }

  /* ── Carrega serviços habilitados para a viatura ── */
  async function loadServiceTypes(vehicleId) {
    try {
      const data = await apiFetch(`/service-types/vehicle/${vehicleId}/active`);
      serviceTypes = Array.isArray(data) ? data : (data.content ?? []);
      const select = document.getElementById('select-service');
      select.innerHTML = '<option value="">Selecione</option>';
      serviceTypes.forEach(s => {
        const opt = document.createElement('option');
        opt.value       = s.id;
        opt.textContent = s.serviceName;
        select.appendChild(opt);
      });
    } catch (err) {
      showToast('Erro ao carregar tipos de serviço.', 'error');
    }
  }

  /* ── Verifica saída ativa ── */
  async function checkActiveDeparture() {
    const registration = getRegistration();
    if (!registration) return;

    try {
      const resp = await fetch(
        `${API_BASE}/departure-logs/active-user?registration=${registration}`,
        { headers: getAuthHeaders() }
      );
      if (resp.status === 404 || !resp.ok) return;
      const departure = await resp.json();
      if (!departure || departure.status !== 'in_progress') return;

      blockFormWithWarning(departure);
    } catch { /* silencioso */ }
  }

  function blockFormWithWarning(departure) {
    /* Bloqueia botão salvar */
    const btnSave = document.getElementById('btn-save');
    btnSave.disabled = true;
    btnSave.style.opacity = '0.45';

    const serviceName = departure.serviceType?.serviceName ?? '—';
    const dateStr     = formatDateTime(departure.departureDatetime);

    const warning = document.createElement('div');
    warning.id        = 'active-departure-warning';
    warning.className = 'departure-warning';
    warning.innerHTML = `
      <strong>⚠ Você já tem uma saída em andamento</strong>
      Serviço: <b>${serviceName}</b> — iniciada em ${dateStr}.<br/>
      Registre o retorno antes de iniciar uma nova saída.
      <br/>
      <button class="btn-go-return" onclick="window.location.href='./register-return.html'" type="button">
        → Registrar retorno agora
      </button>
    `;

    const formCard = document.getElementById('form-card');
    formCard.parentNode.insertBefore(warning, formCard);
  }

  /* ── 2º Condutor ── */
  function renderConductorSection() {
    const section = document.getElementById('conductor-section');

    if (secondConductor) {
      section.innerHTML = `
        <div class="conductor-card">
          <div class="conductor-card-info">
            <div class="conductor-card-name">${secondConductor.fullName ?? secondConductor.name}</div>
            <div class="conductor-card-license">CNH ${secondConductor.licenseType ?? '—'} · Matrícula ${secondConductor.registration}</div>
          </div>
          <button class="conductor-card-remove" onclick="removeConductor()" aria-label="Remover condutor" type="button">✕</button>
        </div>
      `;
    } else {
      section.innerHTML = `
        <div class="conductor-add">
          <div class="conductor-add-info">
            <div class="conductor-add-title">2º condutor</div>
            <div class="conductor-add-sub">Opcional</div>
          </div>
          <button class="conductor-add-btn" onclick="openConductorSearch()" type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Adicionar
          </button>
        </div>
      `;
    }
  }

  function openConductorSearch() {
    const section = document.getElementById('conductor-section');
    section.innerHTML = `
      <div class="conductor-add" style="flex-direction:column;align-items:stretch;gap:8px;">
        <div class="conductor-search-wrap">
          <input class="conductor-search-input" id="conductor-search-input"
            placeholder="Buscar por nome ou matrícula..." autocomplete="off" type="text"/>
          <div class="conductor-results" id="conductor-results"></div>
        </div>
        <button style="background:none;border:none;font-size:11px;color:var(--muted);cursor:pointer;text-align:left;font-family:var(--font);"
          onclick="renderConductorSection()" type="button">Cancelar</button>
      </div>
    `;

    const input   = document.getElementById('conductor-search-input');
    const results = document.getElementById('conductor-results');

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => searchConductors(input.value.trim(), results), 300);
    });

    input.focus();
  }

  async function searchConductors(query, resultsEl) {
    if (query.length < 2) { resultsEl.classList.remove('open'); return; }

    try {
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(query)}&hasLicense=true`);
      const list = Array.isArray(data) ? data : (data.content ?? []);

      /* Filtra: não pode ser o próprio usuário, precisa ter habilitação compatível */
      const filtered = list.filter(u =>
        u.registration !== getRegistration() &&
        canDrive(selectedVehicle?.licenseCategory, u.licenseType)
      );

      if (!filtered.length) {
        resultsEl.innerHTML = '<div class="conductor-result-item"><div class="cri-name" style="color:var(--muted);">Nenhum resultado.</div></div>';
      } else {
        resultsEl.innerHTML = filtered.map(u => `
          <div class="conductor-result-item" data-id="${u.registration}">
            <div class="cri-name">${u.fullName ?? u.name}</div>
            <div class="cri-meta">CNH ${u.licenseType ?? '—'} · Mat. ${u.registration}</div>
          </div>
        `).join('');

        resultsEl.querySelectorAll('.conductor-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const conductor = filtered.find(u => String(u.registration) === item.dataset.id);
            if (conductor) selectConductor(conductor);
          });
        });
      }

      resultsEl.classList.add('open');
    } catch { /* silencioso */ }
  }

  function selectConductor(conductor) {
    secondConductor = conductor;
    renderConductorSection();
  }

  function removeConductor() {
    secondConductor = null;
    renderConductorSection();
  }

  /* ── Validação ── */
  function validateForm() {
    const errors = [];
    const mileage     = parseFloat(document.getElementById('input-mileage').value);
    const date        = document.getElementById('input-date').value;
    const time        = document.getElementById('input-time').value;
    const serviceId   = document.getElementById('select-service').value;
    const destination = document.getElementById('input-destination').value.trim();
    const vehicleId   = sessionStorage.getItem('selectedVehicleId');

    if (!vehicleId)             errors.push('Nenhuma viatura selecionada.');
    if (!date || !time)         errors.push('Data e hora são obrigatórias.');
    if (isNaN(mileage) || mileage < 0) errors.push('Odômetro inválido.');
    if (!serviceId)             errors.push('Selecione o tipo de serviço.');
    if (!destination)           errors.push('O destino é obrigatório.');
    if (!getRegistration())     errors.push('Usuário não autenticado. Faça login novamente.');

    if (errors.length) {
      showModal('Dados inválidos', errors.map(e => `• ${e}`).join('<br/>'), 'warning');
      return null;
    }

    const complement  = document.getElementById('input-complement').value.trim();
    const fullDest    = complement ? `${destination} — ${complement}` : destination;

    return {
      vehicleId:         parseInt(vehicleId, 10),
      primaryRegistration: getRegistration(),
      secondRegistration: secondConductor?.registration ?? null,
      serviceTypeId:     parseInt(serviceId, 10),
      destination:       fullDest,
      departureDatetime: `${date}T${time}:00`,
      startingMileage:   mileage,
    };
  }

  /* ── Salvar saída ── */
  document.getElementById('btn-save').addEventListener('click', async () => {
    if (document.getElementById('active-departure-warning')) {
      showModal('Saída em andamento',
        'Você já tem uma saída em andamento. Registre o retorno antes de criar uma nova.',
        'warning');
      return;
    }

    const payload = validateForm();
    if (!payload) return;

    const btnSave = document.getElementById('btn-save');
    const overlay = document.getElementById('loading-overlay');
    btnSave.disabled = true;
    overlay.classList.add('active');

    try {
      const data = await apiFetch('/departure-logs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data?.id) {
        sessionStorage.setItem('activeDepartureId', data.id);
      }

      showModal('Saída registrada!',
        'A saída foi registrada com sucesso.',
        'success', () => {
          sessionStorage.setItem('allowNavigate', 'true');
          window.location.href = './vehicles.html';
        });

    } catch (err) {
      showModal('Erro ao registrar saída', err.message, 'error');
    } finally {
      btnSave.disabled = false;
      overlay.classList.remove('active');
    }
  });

  /* ── Render inicial ── */
  renderConductorSection();
