if (!requireLogin()) { /* redireciona */ }

  let selectedVehicle   = null;
  let activeDepartureId = null;
  let vehicleCurrentKm  = 0;

  document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const pad   = n => String(n).padStart(2, '0');
    document.getElementById('input-date').value =
      `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

    loadVehicle();
    checkActiveDeparture();
    initPreview();
  });

  /* ── Viatura ── */
  async function loadVehicle() {
    const vehicleId = sessionStorage.getItem('selectedVehicleId');
    if (!vehicleId) return;
    try {
      selectedVehicle = await apiFetch(`/vehicles/${vehicleId}`);
    } catch {
      try { selectedVehicle = JSON.parse(sessionStorage.getItem('selectedVehicle')); } catch { return; }
    }
    if (!selectedVehicle) return;

    document.getElementById('vehicle-prefix').textContent = selectedVehicle.prefix ?? '—';
    document.getElementById('vehicle-model').textContent  =
      `${selectedVehicle.brand ?? ''} ${selectedVehicle.model ?? '—'}`.trim();

    vehicleCurrentKm = selectedVehicle.currentMileage ?? 0;
    document.getElementById('current-mileage').textContent = formatKm(vehicleCurrentKm);

    if (vehicleCurrentKm) {
      document.getElementById('input-change-mileage').value = vehicleCurrentKm;
      updatePreview();
    }
    if (selectedVehicle.oilChangeIntervalKm)
      document.getElementById('input-interval').value = selectedVehicle.oilChangeIntervalKm;
  }

  /* ── Saída ativa ── */
  async function checkActiveDeparture() {
    const storedId = sessionStorage.getItem('activeDepartureId');
    if (storedId) {
      activeDepartureId = parseInt(storedId, 10);
      await loadDepartures();
      return;
    }
    const registration = getRegistration();
    if (!registration) return;
    try {
      const resp = await fetch(
        `${API_BASE}/departure-logs/active-user?registration=${registration}`,
        { headers: getAuthHeaders() }
      );
      if (!resp.ok) {
        showModal('Saída necessária',
          'Para registrar uma troca de óleo é necessário ter uma saída ativa.',
          'warning', () => window.location.href = './vehicles.html');
        return;
      }
      const d = await resp.json();
      if (d?.status === 'in_progress') {
        activeDepartureId = d.id;
        await loadDepartures();
      }
    } catch { /* silencioso */ }
  }

  /* ── Saídas do veículo para vincular ── */
  async function loadDepartures() {
    const vehicleId = sessionStorage.getItem('selectedVehicleId');
    if (!vehicleId) return;
    try {
      const data = await apiFetch(`/departure-logs/vehicle/${vehicleId}/oil-change`);
      const list = Array.isArray(data) ? data : (data.content ?? []);
      const select = document.getElementById('select-departure');
      select.innerHTML = '<option value="">Selecione</option>';
      list.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `Saída #${d.id} — ${d.serviceType?.serviceName ?? '—'} — ${formatDate(d.departureDatetime)}`;
        if (d.id === activeDepartureId) opt.selected = true;
        select.appendChild(opt);
      });
    } catch { /* silencioso */ }
  }

  /* ── Preview próxima troca ── */
  function initPreview() {
    document.getElementById('input-change-mileage').addEventListener('input', updatePreview);
    document.getElementById('input-interval').addEventListener('input', updatePreview);
  }

  function updatePreview() {
    const km       = parseFloat(document.getElementById('input-change-mileage').value);
    const interval = parseFloat(document.getElementById('input-interval').value);
    const preview  = document.getElementById('next-change-preview');
    const kmEl     = document.getElementById('next-change-km');

    if (isNaN(km) || isNaN(interval) || interval <= 0) {
      kmEl.textContent = '—';
      return;
    }

    const next = km + interval;
    kmEl.textContent = formatKm(next);

    if (vehicleCurrentKm && next <= vehicleCurrentKm) {
      preview.className = 'next-change-preview warning';
      preview.querySelector('svg').innerHTML = '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    } else {
      preview.className = 'next-change-preview ok';
      preview.querySelector('svg').innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    }
  }

  /* ── Validação ── */
  function validateForm() {
    const errors    = [];
    const date      = document.getElementById('input-date').value;
    const changKm   = parseFloat(document.getElementById('input-change-mileage').value);
    const interval  = parseFloat(document.getElementById('input-interval').value);
    const departureId = parseInt(document.getElementById('select-departure').value || '0', 10);
    const vehicleId = sessionStorage.getItem('selectedVehicleId');

    if (!date)                        errors.push('Data da troca é obrigatória.');
    if (isNaN(changKm) || changKm < 0)  errors.push('KM da troca é inválido.');
    if (isNaN(interval) || interval <= 0) errors.push('Intervalo de KM é inválido.');
    if (!vehicleId)                    errors.push('Nenhuma viatura selecionada.');
    if (!departureId)                  errors.push('Selecione a saída vinculada.');

    if (errors.length) {
      showModal('Dados inválidos', errors.map(e => `• ${e}`).join('<br/>'), 'warning');
      return null;
    }

    return {
      vehicleId:        parseInt(vehicleId, 10),
      departureLogId:   departureId,
      changeMileage:    changKm,
      intervalKm:       interval,
      nextChangeMileage: changKm + interval,
      changeDate:       date,
      notes:            document.getElementById('input-notes').value.trim() || null,
    };
  }

  /* ── Salvar ── */
  document.getElementById('btn-save').addEventListener('click', async () => {
    const payload = validateForm();
    if (!payload) return;

    const btnSave = document.getElementById('btn-save');
    const overlay = document.getElementById('loading-overlay');
    btnSave.disabled = true;
    overlay.classList.add('active');

    try {
      await apiFetch('/oil-changes', { method: 'POST', body: JSON.stringify(payload) });
      showModal('Troca registrada!',
        'A troca de óleo foi registrada com sucesso.',
        'success', () => window.location.href = './vehicles.html');
    } catch (err) {
      showModal('Erro ao registrar', err.message, 'error');
    } finally {
      btnSave.disabled = false;
      overlay.classList.remove('active');
    }
  });
