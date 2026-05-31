if (!requireLogin()) { /* redireciona */ }

  let uploadedFileUrl = null;
  let activeDepartureId = null;

  document.addEventListener('DOMContentLoaded', () => {
    const { date, time } = currentDateTime();
    document.getElementById('input-date').value = date;
    document.getElementById('input-time').value = time;

    const user = getUser();
    document.getElementById('conductor-name').textContent = user?.fullName ?? user?.name ?? '—';

    loadVehicle();
    loadFuelTypes();
    checkActiveDeparture();
    initPriceCalc();
  });

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
    document.getElementById('vehicle-prefix').textContent = vehicle.prefix ?? '—';
    document.getElementById('vehicle-model').textContent  = `${vehicle.brand ?? ''} ${vehicle.model ?? '—'}`.trim();
    if (vehicle.currentMileage != null)
      document.getElementById('input-mileage').value = vehicle.currentMileage;
  }

  /* ── Tipos de combustível ── */
  async function loadFuelTypes() {
    try {
      const data  = await apiFetch('/fuel-types');
      const list  = Array.isArray(data) ? data : (data.content ?? []);
      const select = document.getElementById('select-fuel-type');
      select.innerHTML = '<option value="">Selecione</option>';
      list.filter(f => f.active !== false).forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.name} (${f.abbreviation ?? f.name})`;
        if (f.pricePerLiter) opt.dataset.price = f.pricePerLiter;
        select.appendChild(opt);
      });

      /* Pré-preenche preço ao selecionar combustível */
      select.addEventListener('change', () => {
        const selected = select.options[select.selectedIndex];
        if (selected?.dataset.price) {
          document.getElementById('input-price-per-liter').value = selected.dataset.price;
          updateTotalPreview();
        }
      });
    } catch (err) {
      showToast('Erro ao carregar tipos de combustível.', 'error');
    }
  }

  /* ── Verificar saída ativa ── */
  async function checkActiveDeparture() {
    const storedId = sessionStorage.getItem('activeDepartureId');
    if (storedId) { activeDepartureId = parseInt(storedId, 10); return; }

    const registration = getRegistration();
    if (!registration) return;
    try {
      const resp = await fetch(
        `${API_BASE}/departure-logs/active-user?registration=${registration}`,
        { headers: getAuthHeaders() }
      );
      if (!resp.ok) {
        showModal('Saída necessária',
          'Para registrar um abastecimento é necessário ter uma saída ativa em andamento.',
          'warning', () => window.location.href = './vehicles.html');
        return;
      }
      const d = await resp.json();
      if (d?.status === 'in_progress') activeDepartureId = d.id;
      else showModal('Saída necessária', 'Nenhuma saída ativa encontrada.', 'warning',
        () => window.location.href = './vehicles.html');
    } catch { /* silencioso */ }
  }

  /* ── Preview de total ── */
  function initPriceCalc() {
    const liters  = document.getElementById('input-liters');
    const priceL  = document.getElementById('input-price-per-liter');
    const total   = document.getElementById('input-total');

    [liters, priceL].forEach(el => el.addEventListener('input', updateTotalPreview));

    liters.addEventListener('blur', () => {
      if (!total.value) {
        const t = parseFloat(liters.value) * parseFloat(priceL.value);
        if (!isNaN(t) && t > 0) total.value = t.toFixed(2);
      }
    });
  }

  function updateTotalPreview() {
    const l = parseFloat(document.getElementById('input-liters').value);
    const p = parseFloat(document.getElementById('input-price-per-liter').value);
    const preview = document.getElementById('price-preview');
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      document.getElementById('total-preview').textContent = formatCurrency(l * p);
      preview.style.display = 'flex';
    } else {
      preview.style.display = 'none';
    }
  }

  /* ── Upload NF ── */
  document.getElementById('nf-file-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('attach-filename').textContent = file.name;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token') ?? ''}` },
        body: formData,
      });
      if (resp.ok) uploadedFileUrl = await resp.text();
    } catch {
      showToast('Upload da NF falhou.', 'warning');
    }
  });

  /* ── Validação ── */
  function validateForm() {
    const errors = [];
    const fuelId  = document.getElementById('select-fuel-type').value;
    const date    = document.getElementById('input-date').value;
    const time    = document.getElementById('input-time').value;
    const liters  = parseFloat(document.getElementById('input-liters').value);
    const total   = parseFloat(document.getElementById('input-total').value);
    const mileage = parseFloat(document.getElementById('input-mileage').value);

    if (!activeDepartureId)         errors.push('Nenhuma saída ativa encontrada.');
    if (!fuelId)                    errors.push('Selecione o tipo de combustível.');
    if (!date || !time)             errors.push('Data e hora são obrigatórias.');
    if (isNaN(liters) || liters <= 0) errors.push('Quantidade de litros inválida.');
    if (isNaN(total)  || total  <= 0) errors.push('Valor total inválido.');
    if (isNaN(mileage) || mileage < 0) errors.push('Odômetro inválido.');

    if (errors.length) {
      showModal('Dados inválidos', errors.map(e => `• ${e}`).join('<br/>'), 'warning');
      return null;
    }

    return {
      departureLogId:  activeDepartureId,
      fuelTypeId:      parseInt(fuelId, 10),
      fuelingDatetime: `${date}T${time}:00`,
      liters,
      totalValue:      total,
      mileageAtFueling: mileage,
      stationName:     document.getElementById('input-station').value.trim() || null,
      invoiceNumber:   document.getElementById('input-invoice-number').value.trim() || null,
      receiptUrl:      uploadedFileUrl ?? null,
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
      await apiFetch('/fueling', { method: 'POST', body: JSON.stringify(payload) });
      showModal('Abastecimento registrado!',
        'O abastecimento foi salvo com sucesso.',
        'success', () => window.location.href = './vehicles.html');
    } catch (err) {
      showModal('Erro ao salvar', err.message, 'error');
    } finally {
      btnSave.disabled = false;
      overlay.classList.remove('active');
    }
  });
