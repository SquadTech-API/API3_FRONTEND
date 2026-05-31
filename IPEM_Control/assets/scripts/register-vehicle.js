if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  async function loadFuelTypes() {
    try {
      const data = await apiFetch('/fuel-types');
      const list = Array.isArray(data)?data:(data.content??[]);
      const sel  = document.getElementById('select-fuel');
      sel.innerHTML = '<option value="">Selecione</option>' +
        list.filter(f=>f.active!==false).map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
    } catch {}
  }

  async function loadServiceTypes() {
    try {
      const data = await apiFetch('/service-types');
      const list = Array.isArray(data)?data:(data.content??[]);
      const grid = document.getElementById('services-grid');
      if (!list.length) { grid.innerHTML = '<span style="color:var(--muted);font-size:13px;">Nenhum tipo de serviço cadastrado.</span>'; return; }
      grid.innerHTML = list.filter(s=>s.enabled!==false).map(s=>
        `<label class="svc-check-item">
          <input type="checkbox" value="${s.id}"/>
          ${s.serviceName}
        </label>`).join('');
    } catch {}
  }

  document.getElementById('btn-save').addEventListener('click', async () => {
    const prefix      = document.getElementById('input-prefix').value.trim();
    const plate       = document.getElementById('input-plate').value.trim().toUpperCase().replace(/\s/g,'');
    const dar         = document.getElementById('input-dar').value.trim();
    const brand       = document.getElementById('input-brand').value.trim();
    const model       = document.getElementById('input-model').value.trim();
    const year        = parseInt(document.getElementById('input-year').value)||null;
    const fuelId      = parseInt(document.getElementById('select-fuel').value)||null;
    const mileage     = parseFloat(document.getElementById('input-mileage').value)||0;
    const oilInterval = parseFloat(document.getElementById('input-oil-interval').value)||5000;
    const license     = document.getElementById('select-license').value||null;
    const fl          = document.getElementById('input-fl').value.trim()||null;

    const errors = [];
    if (!prefix)   errors.push('Prefixo é obrigatório.');
    if (!plate)    errors.push('Placa é obrigatória.');
    if (!dar)      errors.push('Núcleo/DAR é obrigatório.');
    if (!brand)    errors.push('Marca é obrigatória.');
    if (!model)    errors.push('Modelo é obrigatório.');
    if (!year)     errors.push('Ano é obrigatório.');
    if (!fuelId)   errors.push('Tipo de combustível é obrigatório.');
    if (mileage<0) errors.push('KM atual inválido.');
    if (errors.length) { showModal('Dados inválidos', errors.map(e=>`• ${e}`).join('<br/>'), 'warning'); return; }

    const serviceIds = [...document.querySelectorAll('#services-grid input:checked')].map(c=>parseInt(c.value));

    const payload = { prefix, licensePlate:plate, darCenter:dar, flNumber:fl, brand, model,
      manufactureYear:year, fuelTypeId:fuelId, licenseCategory:license,
      currentMileage:mileage, oilChangeIntervalKm:oilInterval, active:true };

    const btn = document.getElementById('btn-save');
    const overlay = document.getElementById('loading-overlay');
    btn.disabled = true; overlay.classList.add('active');
    try {
      const vehicle = await apiFetch('/vehicles', { method:'POST', body:JSON.stringify(payload) });
      if (serviceIds.length && vehicle?.id) {
        await apiFetch(`/vehicle-service/sync/${vehicle.id}`, { method:'POST', body:JSON.stringify(serviceIds) });
      }
      showModal('Viatura cadastrada!', `A viatura ${prefix} foi cadastrada com sucesso.`, 'success',
        () => window.location.href = './manage-vehicles.html');
    } catch(err) {
      let msg = err.message;
      if (msg.toLowerCase().includes('plate')||msg.toLowerCase().includes('placa')) msg = 'Placa já cadastrada no sistema.';
      showModal('Erro ao cadastrar', msg, 'error');
    } finally { btn.disabled=false; overlay.classList.remove('active'); }
  });

  loadFuelTypes();
  loadServiceTypes();
