if (!requireLogin()) { /* redireciona */ }

  let activeDeparture = null;

  document.addEventListener('DOMContentLoaded', () => {
    fillReturnDateTime();
    loadVehicle();
    loadActiveDeparture();
  });

  function fillReturnDateTime() {
    const { date, time } = currentDateTime();
    document.getElementById('input-return-date').value = date;
    document.getElementById('input-return-time').value = time;
  }

  /* ── Viatura ── */
  async function loadVehicle() {
    const vehicleId = sessionStorage.getItem('selectedVehicleId');
    if (!vehicleId) return;
    let vehicle;
    try {
      vehicle = await apiFetch(`/vehicles/${vehicleId}`);
    } catch {
      try { vehicle = JSON.parse(sessionStorage.getItem('selectedVehicle')); } catch { return; }
    }
    if (!vehicle) return;
    document.getElementById('vehicle-prefix').textContent  = vehicle.prefix ?? '—';
    document.getElementById('vehicle-model').textContent   = `${vehicle.brand ?? ''} ${vehicle.model ?? '—'}`.trim();
    document.getElementById('vehicle-license').textContent = vehicle.licenseCategory ?? '—';
  }

  /* ── Saída ativa ── */
  async function loadActiveDeparture() {
    const departureId  = sessionStorage.getItem('activeDepartureId');
    const registration = getRegistration();

    try {
      if (departureId) {
        activeDeparture = await apiFetch(`/departure-logs/${departureId}`);
      } else if (registration) {
        const resp = await fetch(
          `${API_BASE}/departure-logs/active-user?registration=${registration}`,
          { headers: getAuthHeaders() }
        );
        if (resp.ok) activeDeparture = await resp.json();
      }

      if (!activeDeparture || activeDeparture.status !== 'in_progress') {
        showModal('Sem saída ativa',
          'Você não tem nenhuma saída em andamento para registrar retorno.',
          'warning', () => window.location.href = './vehicles.html');
        return;
      }

      fillDepartureData(activeDeparture);

    } catch (err) {
      showModal('Erro', err.message, 'error');
    }
  }

  function fillDepartureData(d) {
    document.getElementById('input-service').value =
      d.serviceType?.serviceName ?? d.serviceType?.service_name ?? '—';
    document.getElementById('input-destination').value  = d.destination ?? '—';
    document.getElementById('input-departure-date').value = formatDateTime(d.departureDatetime);
    document.getElementById('input-start-mileage').value  = formatKm(d.startingMileage);

    /* KM mínimo */
    const finalKmInput = document.getElementById('input-final-mileage');
    if (d.startingMileage != null) {
      finalKmInput.min         = d.startingMileage;
      finalKmInput.placeholder = `Mín: ${d.startingMileage}`;
    }

    /* Nome condutor */
    const user = getUser();
    document.getElementById('conductor-name').textContent =
      user?.fullName ?? user?.name ?? '—';
  }

  /* ── Validação ── */
  function validateForm() {
    const errors    = [];
    const date      = document.getElementById('input-return-date').value;
    const time      = document.getElementById('input-return-time').value;
    const finalKm   = parseFloat(document.getElementById('input-final-mileage').value);
    const departureId = activeDeparture?.id;

    if (!date || !time)           errors.push('Data e hora do retorno são obrigatórias.');
    if (isNaN(finalKm) || finalKm < 0) errors.push('Odômetro final inválido.');
    if (!departureId)             errors.push('ID da saída não encontrado.');

    if (activeDeparture?.startingMileage != null && !isNaN(finalKm)) {
      if (finalKm < activeDeparture.startingMileage)
        errors.push(`Odômetro final (${finalKm}) não pode ser menor que o de saída (${activeDeparture.startingMileage}).`);
    }

    if (activeDeparture?.departureDatetime && date && time) {
      const returnDt   = new Date(`${date}T${time}:00`);
      const departureDt = new Date(activeDeparture.departureDatetime);
      if (returnDt < departureDt)
        errors.push('Data/hora do retorno não pode ser anterior à saída.');
    }

    if (errors.length) {
      showModal('Dados inválidos', errors.map(e => `• ${e}`).join('<br/>'), 'warning');
      return null;
    }

    return {
      returnDatetime: `${date}T${time}:00`,
      finishingMileage: finalKm,
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
      await apiFetch(`/departure-logs/${activeDeparture.id}/return`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      /* Limpa sessão */
      ['activeDepartureId', 'selectedVehicleId', 'selectedVehicle', 'allowNavigate']
        .forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });

      showModal('Retorno registrado!',
        'O retorno foi registrado com sucesso.',
        'success', () => window.location.href = './vehicles.html');

    } catch (err) {
      showModal('Erro ao registrar retorno', err.message, 'error');
    } finally {
      btnSave.disabled = false;
      overlay.classList.remove('active');
    }
  });
