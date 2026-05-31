if (!requireLogin()) { /* redireciona */ }
  initMenu();
  adjustMenuByRole();

  const user = getUser();
  if (user) {
    const initials = (user.fullName ?? user.name ?? '').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials || '?';
    document.getElementById('header-user-name').textContent = user.fullName ?? user.name ?? '';
  }

  let allVehicles     = [];
  let selectedVehicle = null;
  let activeChip      = 'all';

  /* ── Carregar viaturas ── */
  async function loadVehicles() {
    try {
      const data = await apiFetch('/vehicles');
      allVehicles = Array.isArray(data) ? data : (data.content ?? []);
      renderVehicleList(allVehicles);
    } catch (err) {
      document.getElementById('vehicle-list').innerHTML =
        `<div style="color:var(--danger);font-size:12px;">${err.message}</div>`;
    }
  }

  /* ── Renderizar lista de viaturas ── */
  function renderVehicleList(list) {
    const container = document.getElementById('vehicle-list');
    if (!list.length) {
      container.innerHTML = '<div style="color:var(--muted);font-size:12px;">Nenhuma viatura.</div>';
      return;
    }
    container.innerHTML = '';
    list.forEach(v => {
      const inUse = v.status === 'in_use';
      const el    = document.createElement('div');
      el.className = `veh-item${selectedVehicle?.id === v.id ? ' selected' : ''}`;
      el.dataset.id = v.id;
      el.innerHTML = `
        <div class="veh-item-header ${inUse ? 'in-use' : ''}">
          <div>
            <div class="veh-item-prefix">${v.prefix ?? '—'}</div>
            <div class="veh-item-model">${v.brand ?? ''} ${v.model ?? '—'}</div>
          </div>
          <span class="veh-item-status ${inUse ? 'in-use' : 'available'}">${inUse ? 'Em uso' : 'Disponível'}</span>
        </div>
        <div class="veh-item-meta">
          <span>Último uso: <strong>${formatDate(v.lastUsed) ?? '—'}</strong></span>
          <span>KM atual: <strong>${formatKm(v.currentMileage)}</strong></span>
        </div>
      `;
      el.addEventListener('click', () => selectVehicle(v));
      container.appendChild(el);
    });
  }

  /* ── Selecionar viatura ── */
  async function selectVehicle(vehicle) {
    selectedVehicle = vehicle;
    /* Atualiza seleção visual */
    document.querySelectorAll('.veh-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.id == vehicle.id);
    });
    activeChip = 'all';
    await loadEntries(vehicle.id);
  }

  /* ── Carregar saídas da viatura ── */
  async function loadEntries(vehicleId) {
    const panel = document.getElementById('detail-panel');
    panel.innerHTML = '<div class="panel-empty">Carregando...</div>';

    try {
      const data    = await apiFetch(`/vehicles/${vehicleId}/history`);
      const entries = Array.isArray(data) ? data : (data.content ?? []);
      renderDetailPanel(selectedVehicle, entries);
    } catch (err) {
      panel.innerHTML = `<div class="panel-empty" style="color:var(--danger);">${err.message}</div>`;
    }
  }

  /* ── Renderizar painel de detalhe ── */
  function renderDetailPanel(vehicle, entries) {
    const panel = document.getElementById('detail-panel');

    const totalDep  = entries.length;
    const totalKm   = entries.reduce((s, e) => s + (e.drivenMileage ?? 0), 0);
    const totalFuel = entries.filter(e => e.hasFueling).length;
    const kmToNext  = vehicle.nextOilChangeMileage != null && vehicle.currentMileage != null
      ? vehicle.nextOilChangeMileage - vehicle.currentMileage
      : null;

    panel.innerHTML = `
      <div class="detail-header">
        <div class="dh-top">
          <div class="dh-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div>
            <div class="dh-prefix">${vehicle.prefix ?? '—'}</div>
            <div class="dh-model">${vehicle.brand ?? ''} ${vehicle.model ?? '—'} · ${vehicle.fuelTypeName ?? '—'} · Hab. ${vehicle.licenseCategory ?? '—'}</div>
          </div>
        </div>
        <div class="dh-stats">
          <div class="dh-stat">
            <div class="dh-stat-val">${formatKm(vehicle.currentMileage)}</div>
            <div class="dh-stat-lbl">KM atual</div>
          </div>
          <div class="dh-stat">
            <div class="dh-stat-val">${totalDep}</div>
            <div class="dh-stat-lbl">Saídas</div>
          </div>
          <div class="dh-stat">
            <div class="dh-stat-val">${totalFuel}</div>
            <div class="dh-stat-lbl">Abastecimentos</div>
          </div>
          <div class="dh-stat ${kmToNext != null && kmToNext <= 500 ? 'warn' : ''}">
            <div class="dh-stat-val">${kmToNext != null ? formatKm(kmToNext) : '—'}</div>
            <div class="dh-stat-lbl">Km p/ próx. troca</div>
          </div>
        </div>
      </div>
      <div class="entries-card" id="entries-card">
        <div class="entries-header">
          <span class="entries-title">Saídas registradas</span>
          <div class="filter-chips">
            <button class="chip active" data-chip="all" type="button">Todas</button>
            <button class="chip" data-chip="fuel" type="button">Com abast.</button>
            <button class="chip" data-chip="oil"  type="button">Troca de óleo</button>
          </div>
        </div>
        <div id="entries-list"></div>
      </div>
    `;

    /* Chips */
    panel.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        panel.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeChip = chip.dataset.chip;
        renderEntries(entries);
      });
    });

    renderEntries(entries);
  }

  function renderEntries(entries) {
    const filtered = entries.filter(e => {
      if (activeChip === 'fuel') return e.hasFueling;
      if (activeChip === 'oil')  return e.hasOilChange;
      return true;
    });

    const list = document.getElementById('entries-list');
    if (!list) return;

    if (!filtered.length) {
      list.innerHTML = '<div class="panel-empty">Nenhuma saída encontrada.</div>';
      return;
    }

    list.innerHTML = filtered.map(e => {
      const twoCond = e.conductors?.length > 1;
      const conductorNames = twoCond
        ? e.conductors.map(c => c.fullName ?? c.name ?? '—').join(' · ')
        : (e.primaryConductorName ?? '—');

      return `
        <div class="entry-row">
          <div class="entry-icon ${twoCond ? 'two-conductors' : ''}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div class="entry-main">
            <div class="entry-conductors">${conductorNames}</div>
            ${twoCond ? '<div class="entry-two-badge">2 condutores</div>' : ''}
            <div class="entry-meta">${formatDateTime(e.departureDatetime)} · ${e.serviceTypeName ?? '—'}</div>
            <div class="entry-dest">${e.destination ?? ''}</div>
          </div>
          <div class="entry-right">
            <div class="entry-km">+${formatKm(e.drivenMileage ?? 0)}</div>
            <div class="entry-tags">
              ${e.hasFueling   ? '<span class="tag-fuel">Abast.</span>'    : ''}
              ${e.hasOilChange ? '<span class="tag-oil">Óleo</span>'        : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Busca de viaturas ── */
  document.getElementById('search-vehicles').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = q
      ? allVehicles.filter(v =>
          (v.prefix ?? '').toLowerCase().includes(q) ||
          (v.model  ?? '').toLowerCase().includes(q))
      : allVehicles;
    renderVehicleList(filtered);
  });

  loadVehicles();
