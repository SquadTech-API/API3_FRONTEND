if (!requireAdmin()) {}
  initMenu(); adjustMenuByRole();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let allVehicles = [];
  let activeFilter = 'all';
  let searchQuery  = '';
  let editingId    = null;
  let fuelTypes    = [];

  async function loadVehicles() {
    try {
      const data = await apiFetch('/vehicles?includeInactive=true');
      allVehicles = Array.isArray(data) ? data : (data.content??[]);
      renderGrid();
    } catch(err) {
      document.getElementById('vehicles-grid').innerHTML = `<div class="loading-state" style="color:var(--danger);">${err.message}</div>`;
    }
  }

  async function loadFuelTypes() {
    try {
      const data = await apiFetch('/fuel-types');
      fuelTypes = Array.isArray(data) ? data : (data.content??[]);
    } catch {}
  }

  function filterVehicles() {
    return allVehicles.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (v.prefix??'').toLowerCase().includes(q) || (v.model??'').toLowerCase().includes(q);
      const inactive = v.active === false;
      const inUse    = v.status === 'in_use';
      const matchFilter =
        activeFilter === 'all' ||
        (activeFilter === 'available' && !inUse && !inactive) ||
        (activeFilter === 'in_use'    && inUse) ||
        (activeFilter === 'inactive'  && inactive);
      return matchSearch && matchFilter;
    });
  }

  function renderGrid() {
    const grid = document.getElementById('vehicles-grid');
    const list = filterVehicles();
    if (!list.length) { grid.innerHTML = '<div class="empty-state">Nenhuma viatura encontrada.</div>'; return; }
    grid.innerHTML = '';
    list.forEach((v, i) => {
      const inUse    = v.status === 'in_use';
      const inactive = v.active === false;
      const card = document.createElement('div');
      card.className = `vehicle-card${inUse ? ' in-use' : ''}${inactive ? ' inactive' : ''}`;
      card.style.animationDelay = `${i*.04}s`;
      card.innerHTML = `
        <div class="vc-prefix">${v.prefix??'—'}</div>
        <div class="vc-model">${v.brand??''} ${v.model??'—'}</div>
        <div class="vc-sep"></div>
        <div class="vc-row"><span>Placa:</span><strong>${v.licensePlate??'—'}</strong></div>
        <div class="vc-row"><span>KM:</span><strong>${formatKm(v.currentMileage)}</strong></div>
        <div class="vc-row"><span>Combustível:</span><strong>${v.fuelTypeName??'—'}</strong></div>
        <div class="vc-row"><span>Habilitação:</span><strong>${v.licenseCategory??'—'}</strong></div>
        <div class="vc-status">
          <span class="vc-dot ${inactive?'':inUse?'in-use':'available'}"></span>
          <span class="vc-status-text ${inactive?'':inUse?'in-use':'available'}">${inactive?'Inativa':inUse?'Em uso':'Disponível'}</span>
        </div>
        <div class="vc-actions">
          <button class="vc-btn" onclick="openEditModal(${v.id})" type="button">✏ Editar</button>
          ${inactive
            ? `<button class="vc-btn activate" onclick="toggleActive(${v.id},false)" type="button">Ativar</button>`
            : `<button class="vc-btn danger" onclick="toggleActive(${v.id},true)" type="button" ${inUse?'disabled title="Viatura em uso"':''}>🔒</button>`}
        </div>`;
      grid.appendChild(card);
    });
  }

  /* ── Edit modal ── */
  async function openEditModal(id) {
    editingId = id;
    const vehicle = allVehicles.find(v => v.id === id);
    if (!vehicle) return;

    /* Popula combustíveis */
    const sel = document.getElementById('edit-fuel-type');
    sel.innerHTML = '<option value="">Selecione</option>' +
      fuelTypes.map(f => `<option value="${f.id}" ${f.id===vehicle.fuelTypeId?'selected':''}>${f.name}</option>`).join('');

    document.getElementById('edit-vehicle-id').value   = id;
    document.getElementById('edit-prefix').value       = vehicle.prefix??'';
    document.getElementById('edit-plate').value        = vehicle.licensePlate??'';
    document.getElementById('edit-brand').value        = vehicle.brand??'';
    document.getElementById('edit-model').value        = vehicle.model??'';
    document.getElementById('edit-year').value         = vehicle.manufactureYear??'';
    document.getElementById('edit-mileage').value      = vehicle.currentMileage??'';
    document.getElementById('edit-dar').value          = vehicle.darCenter??'';
    document.getElementById('edit-fl').value           = vehicle.flNumber??'';
    document.getElementById('edit-license').value      = vehicle.licenseCategory??'';
    document.getElementById('edit-oil-interval').value = vehicle.oilChangeIntervalKm??'';
    document.getElementById('edit-overlay').classList.add('active');
  }

  function closeEditModal() { document.getElementById('edit-overlay').classList.remove('active'); editingId=null; }

  document.getElementById('edit-save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('edit-save-btn');
    const overlay = document.getElementById('loading-overlay');
    btn.disabled = true; overlay.classList.add('active');
    try {
      const payload = {
        prefix:             document.getElementById('edit-prefix').value.trim(),
        licensePlate:       document.getElementById('edit-plate').value.trim().toUpperCase(),
        brand:              document.getElementById('edit-brand').value.trim(),
        model:              document.getElementById('edit-model').value.trim(),
        manufactureYear:    parseInt(document.getElementById('edit-year').value)||null,
        currentMileage:     parseFloat(document.getElementById('edit-mileage').value)||0,
        darCenter:          document.getElementById('edit-dar').value.trim(),
        flNumber:           document.getElementById('edit-fl').value.trim()||null,
        licenseCategory:    document.getElementById('edit-license').value||null,
        oilChangeIntervalKm: parseFloat(document.getElementById('edit-oil-interval').value)||5000,
        fuelTypeId:         parseInt(document.getElementById('edit-fuel-type').value)||null,
      };
      await apiFetch(`/vehicles/${editingId}`, { method:'PUT', body:JSON.stringify(payload) });
      closeEditModal();
      showToast('Viatura atualizada!', 'success');
      await loadVehicles();
    } catch(err) { showModal('Erro', err.message, 'error'); }
    finally { btn.disabled=false; overlay.classList.remove('active'); }
  });

  async function toggleActive(id, currentlyActive) {
    const action = currentlyActive ? 'deactivate' : 'activate';
    const msg    = currentlyActive
      ? 'Deseja desativar esta viatura? Ela não aparecerá mais para os técnicos.'
      : 'Deseja reativar esta viatura?';
    showModal(currentlyActive?'Desativar viatura':'Ativar viatura', msg, 'warning', async () => {
      try {
        await apiFetch(`/vehicles/${id}/${action}`, { method:'PATCH' });
        showToast(`Viatura ${currentlyActive?'desativada':'ativada'}!`, 'success');
        await loadVehicles();
      } catch(err) { showModal('Erro', err.message, 'error'); }
    });
  }

  /* ── Filtros e busca ── */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderGrid();
    });
  });
  document.getElementById('search-input').addEventListener('input', e => { searchQuery=e.target.value.trim(); renderGrid(); });

  loadFuelTypes().then(loadVehicles);
