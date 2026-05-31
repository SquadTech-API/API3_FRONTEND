if (!requireLogin()) { /* redireciona */ }

  initMenu();
  adjustMenuByRole();

  /* ── Avatar com iniciais ── */
  const user = getUser();
  if (user) {
    const initials = (user.fullName ?? user.name ?? '')
      .split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
    const avatarEl = document.getElementById('header-avatar');
    if (avatarEl) avatarEl.textContent = initials || '?';
  }

  /* ── Estado ── */
  let allVehicles  = [];
  let activeFilter = 'all';
  let searchQuery  = '';

  /* ── Carregar viaturas ── */
  async function loadVehicles() {
    try {
      const data = await apiFetch('/vehicles');
      allVehicles = Array.isArray(data) ? data : (data.content ?? []);
      renderGrid();
    } catch (err) {
      document.getElementById('vehicles-grid').innerHTML =
        `<div class="loading-state" style="color:var(--danger);">${err.message}</div>`;
    }
  }

  /* ── Filtrar ── */
  function filterVehicles() {
    return allVehicles.filter(v => {
      const matchFilter =
        activeFilter === 'all' ||
        (activeFilter === 'available' && v.status === 'available') ||
        (activeFilter === 'in_use'    && v.status === 'in_use');

      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (v.prefix ?? '').toLowerCase().includes(q) ||
        (v.model  ?? '').toLowerCase().includes(q) ||
        (v.brand  ?? '').toLowerCase().includes(q);

      /* técnico só vê viaturas que pode conduzir */
      const matchLicense = canDrive(v.licenseCategory, getLicenseType());

      return matchFilter && matchSearch && matchLicense;
    });
  }

  /* ── Renderizar grid ── */
  function renderGrid() {
    const grid     = document.getElementById('vehicles-grid');
    const filtered = filterVehicles();

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">Nenhuma viatura encontrada.</div>`;
      return;
    }

    grid.innerHTML = '';
    filtered.forEach((v, i) => {
      const inUse = v.status === 'in_use';
      const card  = document.createElement('div');
      card.className = `vehicle-card${inUse ? ' in-use' : ''}`;
      card.style.animationDelay = `${i * 0.04}s`;
      card.dataset.id = v.id;

      card.innerHTML = `
        <div class="vc-prefix">${v.prefix ?? '—'}</div>
        <div class="vc-model">${v.brand ?? ''} ${v.model ?? '—'}</div>
        <div class="vc-sep"></div>
        <div class="vc-row"><span>Último uso:</span><strong>${formatDate(v.lastUsed) ?? '—'}</strong></div>
        <div class="vc-row"><span>KM atual:</span><strong>${formatKm(v.currentMileage)}</strong></div>
        <div class="vc-row"><span>Combustível:</span><strong>${v.fuelTypeName ?? '—'}</strong></div>
        <div class="vc-status">
          <span class="vc-dot ${inUse ? 'in-use' : 'available'}"></span>
          <span class="vc-status-text ${inUse ? 'in-use' : 'available'}">${inUse ? 'Em uso' : 'Disponível'}</span>
        </div>
        ${inUse && v.conductorName
          ? `<div class="vc-conductor">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
               ${v.conductorName}
             </div>`
          : ''}
        ${!inUse
          ? `<div class="vc-actions">
               <button class="vc-btn primary btn-new-departure" data-id="${v.id}" type="button">Nova saída</button>
             </div>`
          : ''}
      `;

      grid.appendChild(card);
    });

    /* Botões de nova saída */
    grid.querySelectorAll('.btn-new-departure').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        selectVehicle(btn.dataset.id);
      });
    });
  }

  /* ── Selecionar viatura e ir para nova saída ── */
  function selectVehicle(vehicleId) {
    sessionStorage.setItem('selectedVehicleId', vehicleId);
    const vehicle = allVehicles.find(v => String(v.id) === String(vehicleId));
    if (vehicle) sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
    window.location.href = './new-departure.html';
  }

  /* ── Filtros ── */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderGrid();
    });
  });

  /* ── Busca ── */
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    renderGrid();
  });
  document.getElementById('btn-search').addEventListener('click', () => {
    searchQuery = searchInput.value.trim();
    renderGrid();
  });

  /* ── Notificações ── */
  const btnNotif     = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notif-dropdown');

  btnNotif.addEventListener('click', e => {
    e.stopPropagation();
    notifDropdown.classList.toggle('open');
    if (notifDropdown.classList.contains('open')) loadNotifications();
  });

  document.addEventListener('click', e => {
    if (!btnNotif.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.classList.remove('open');
    }
  });

  async function loadNotifications() {
    try {
      const data = await apiFetch('/notifications');
      const list  = Array.isArray(data) ? data : (data.content ?? []);
      renderNotifications(list);
    } catch { /* silencioso */ }
  }

  function renderNotifications(list) {
    const container = document.getElementById('notif-list');
    const countEl   = document.getElementById('notif-count');
    const unread    = list.filter(n => !n.read);

    if (unread.length > 0) {
      countEl.textContent = unread.length > 9 ? '9+' : unread.length;
      countEl.style.display = 'flex';
    } else {
      countEl.style.display = 'none';
    }

    if (!list.length) {
      container.innerHTML = '<div class="notif-empty">Nenhuma notificação.</div>';
      return;
    }

    const iconMap = {
      schedule_rejection: { cls: 'rejection', icon: '✕' },
      schedule_approval:  { cls: 'approval',  icon: '✓' },
      oil_change_alert:   { cls: 'oil',        icon: '⚠' },
      system:             { cls: 'system',     icon: 'i' },
    };

    container.innerHTML = list.map(n => {
      const t = iconMap[n.type] ?? { cls: 'system', icon: 'i' };
      return `
        <div class="notif-item${n.read ? '' : ' unread'}" data-id="${n.id}">
          <div class="notif-icon ${t.cls}">${t.icon}</div>
          <div class="notif-body">
            <div class="notif-title">${n.title ?? 'Notificação'}</div>
            <div class="notif-msg">${n.message ?? ''}</div>
            ${n.reason ? `<div class="notif-reason">Motivo: ${n.reason}</div>` : ''}
            <div class="notif-time">${formatDateTime(n.createdAt)}</div>
          </div>
          ${!n.read ? '<div class="notif-dot"></div>' : ''}
        </div>
      `;
    }).join('');

    /* Marcar como lida ao clicar */
    container.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', () => markNotificationRead(el.dataset.id));
    });
  }

  async function markNotificationRead(id) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      loadNotifications();
    } catch { /* silencioso */ }
  }

  document.getElementById('btn-mark-all').addEventListener('click', async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      loadNotifications();
    } catch { /* silencioso */ }
  });

  /* ── Perfil ── */
  document.getElementById('btn-profile').addEventListener('click', () => {
    window.location.href = './profile.html';
  });

  /* ── Init ── */
  loadVehicles();
  loadNotifications();
