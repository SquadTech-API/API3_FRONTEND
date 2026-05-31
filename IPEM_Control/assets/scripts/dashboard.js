if (!requireAdmin()) { /* redireciona */ }
  initMenu();

  const user = getUser();
  if (user) {
    const initials = (user.fullName ?? user.name ?? '').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials || 'AD';
    document.getElementById('header-user-name').textContent = user.fullName ?? user.name ?? '';
    document.getElementById('welcome-name').textContent     = user.fullName ?? user.name ?? 'Administrador';
  }

  /* Data de hoje por extenso */
  document.getElementById('welcome-date').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  /* ══════════════════════════════════════════
     CARREGAR TODOS OS DADOS
  ══════════════════════════════════════════ */
  async function loadDashboard() {
    await Promise.allSettled([
      loadSummary(),
      loadVehiclesInUse(),
      loadPendingSchedules(),
      loadRecentDepartures(),
      loadOilAlerts(),
      loadNotifications(),
    ]);
  }

  /* ── Métricas gerais ── */
  async function loadSummary() {
    try {
      const data = await apiFetch('/dashboard/summary');
      document.getElementById('metric-vehicles-in-use').textContent = data.vehiclesInUse ?? '—';
      document.getElementById('metric-vehicles-sub').textContent    = `de ${data.totalVehicles ?? '—'} disponíveis`;
      document.getElementById('metric-active-users').textContent    = data.activeUsers ?? '—';
      document.getElementById('metric-users-sub').textContent       = `de ${data.totalUsers ?? '—'} cadastrados`;
      document.getElementById('metric-departures-today').textContent = data.departuresToday ?? '—';
      document.getElementById('metric-departures-sub').textContent  = `${data.departuresThisMonth ?? '—'} este mês`;
      document.getElementById('metric-oil-alerts').textContent      = data.oilChangeAlerts ?? '—';
    } catch { /* mantém —  */ }
  }

  /* ── Viaturas em uso ── */
  async function loadVehiclesInUse() {
    const container = document.getElementById('vehicles-in-use-list');
    try {
      const data = await apiFetch('/vehicles?status=in_use');
      const list = Array.isArray(data) ? data : (data.content ?? []);
      if (!list.length) {
        container.innerHTML = '<div class="card-empty">Nenhuma viatura em uso no momento.</div>';
        return;
      }
      container.innerHTML = list.slice(0, 6).map(v => `
        <div class="vehicle-in-use-row">
          <div>
            <div class="viu-prefix">${v.prefix ?? '—'}</div>
            <div class="viu-model">${v.model ?? '—'}</div>
          </div>
          <div class="viu-info">
            <div class="viu-conductor">${v.conductorName ?? '—'}</div>
            <div class="viu-service">${v.currentServiceName ?? '—'}</div>
          </div>
          <div class="viu-time">${v.departureDatetime ? formatDateTime(v.departureDatetime) : '—'}</div>
        </div>
      `).join('');
    } catch {
      container.innerHTML = '<div class="card-empty">Erro ao carregar dados.</div>';
    }
  }

  /* ── Agendamentos pendentes ── */
  let pendingScheduleIdToReject = null;

  async function loadPendingSchedules() {
    const container = document.getElementById('pending-schedules-list');
    try {
      const data = await apiFetch('/schedules?status=pending');
      const list = Array.isArray(data) ? data : (data.content ?? []);
      if (!list.length) {
        container.innerHTML = '<div class="card-empty">Nenhum agendamento pendente.</div>';
        return;
      }
      container.innerHTML = list.slice(0, 5).map(s => {
        const prio = s.priority ?? 'low';
        return `
          <div class="sched-row">
            <span class="sched-prio ${prio}"></span>
            <div class="sched-info">
              <div class="sched-title">${s.title ?? '—'}</div>
              <div class="sched-meta">${s.vehiclePrefix ?? '—'} · ${s.requesterName ?? '—'} · ${formatDate(s.scheduledDatetime)}</div>
            </div>
            <div class="sched-actions">
              <button class="sched-btn approve" onclick="approveSchedule(${s.id})" type="button">✓ Aceitar</button>
              <button class="sched-btn reject"  onclick="openRejectModal(${s.id}, '${(s.requesterName ?? '').replace(/'/g,"\\'")}', '${s.title?.replace(/'/g,"\\'")?? ''}')" type="button">✕ Recusar</button>
            </div>
          </div>
        `;
      }).join('');
    } catch {
      container.innerHTML = '<div class="card-empty">Erro ao carregar agendamentos.</div>';
    }
  }

  async function approveSchedule(id) {
    try {
      await apiFetch(`/schedules/${id}/approve`, { method: 'PATCH' });
      showToast('Agendamento aprovado!', 'success');
      loadPendingSchedules();
      loadSummary();
    } catch (err) {
      showModal('Erro', err.message, 'error');
    }
  }

  function openRejectModal(scheduleId, requesterName, title) {
    pendingScheduleIdToReject = scheduleId;
    document.getElementById('reject-modal-sub').textContent =
      `Agendamento de ${requesterName}: "${title}". Informe o motivo — o técnico será notificado.`;
    document.getElementById('reject-reason').value = '';
    document.getElementById('reject-modal').classList.add('active');
    setTimeout(() => document.getElementById('reject-reason').focus(), 100);
  }

  function closeRejectModal() {
    document.getElementById('reject-modal').classList.remove('active');
    pendingScheduleIdToReject = null;
  }

  document.getElementById('reject-confirm-btn').addEventListener('click', async () => {
    const reason = document.getElementById('reject-reason').value.trim();
    if (!reason) {
      document.getElementById('reject-reason').style.borderColor = 'var(--danger)';
      document.getElementById('reject-reason').placeholder = 'Motivo é obrigatório.';
      return;
    }
    const btn = document.getElementById('reject-confirm-btn');
    btn.disabled = true;
    try {
      await apiFetch(`/schedules/${pendingScheduleIdToReject}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      closeRejectModal();
      showToast('Agendamento recusado. Técnico notificado.', 'warning');
      loadPendingSchedules();
      loadSummary();
    } catch (err) {
      showModal('Erro', err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  /* ── Saídas recentes ── */
  async function loadRecentDepartures() {
    const tbody = document.getElementById('recent-departures-body');
    try {
      const data = await apiFetch('/departure-logs?limit=8&sort=desc');
      const list = Array.isArray(data) ? data : (data.content ?? []);
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--muted);">Nenhuma saída registrada.</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(d => `
        <tr>
          <td><span class="dep-prefix">${d.vehiclePrefix ?? '—'}</span></td>
          <td>${d.primaryConductorName ?? '—'}</td>
          <td style="color:var(--muted);">${d.serviceTypeName ?? '—'}</td>
          <td style="color:var(--muted);">${formatDateTime(d.departureDatetime)}</td>
          <td>
            <span class="status-badge ${d.status === 'in_progress' ? 'in-progress' : 'completed'}">
              ${d.status === 'in_progress' ? 'Em andamento' : 'Encerrada'}
            </span>
          </td>
        </tr>
      `).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--danger);">Erro ao carregar saídas.</td></tr>';
    }
  }

  /* ── Alertas de troca de óleo ── */
  async function loadOilAlerts() {
    const container = document.getElementById('oil-alerts-list');
    try {
      const data = await apiFetch('/vehicles/oil-change-alerts');
      const list = Array.isArray(data) ? data : (data.content ?? []);
      if (!list.length) {
        container.innerHTML = '<div class="card-empty">Nenhum alerta de troca de óleo.</div>';
        return;
      }
      container.innerHTML = list.slice(0, 6).map(v => {
        const overdue = v.kmToNextChange != null && v.kmToNextChange <= 0;
        return `
          <div class="oil-alert-row">
            <div class="oil-alert-prefix">${v.prefix ?? '—'}</div>
            <div class="oil-alert-info">
              <div class="oil-alert-label">${v.model ?? '—'}</div>
              <div class="oil-alert-sub">
                ${overdue
                  ? `Vencida há ${Math.abs(v.kmToNextChange).toLocaleString('pt-BR')} km`
                  : `Faltam ${(v.kmToNextChange ?? 0).toLocaleString('pt-BR')} km`}
              </div>
            </div>
            <span class="oil-badge ${overdue ? 'overdue' : 'soon'}">${overdue ? 'Vencida' : 'Próxima'}</span>
          </div>
        `;
      }).join('');
    } catch {
      container.innerHTML = '<div class="card-empty">Erro ao carregar alertas.</div>';
    }
  }

  /* ── Notificações ── */
  const btnNotif      = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notif-dropdown');

  btnNotif.addEventListener('click', e => {
    e.stopPropagation();
    notifDropdown.classList.toggle('open');
    if (notifDropdown.classList.contains('open')) loadNotifications();
  });
  document.addEventListener('click', e => {
    if (!btnNotif.contains(e.target) && !notifDropdown.contains(e.target))
      notifDropdown.classList.remove('open');
  });

  async function loadNotifications() {
    try {
      const data = await apiFetch('/notifications');
      const list = Array.isArray(data) ? data : (data.content ?? []);
      const countEl = document.getElementById('notif-count');
      const unread  = list.filter(n => !n.read);
      if (unread.length) {
        countEl.textContent    = unread.length > 9 ? '9+' : unread.length;
        countEl.style.display  = 'flex';
      } else {
        countEl.style.display  = 'none';
      }
      const container = document.getElementById('notif-list');
      if (!list.length) {
        container.innerHTML = '<div class="notif-empty">Nenhuma notificação.</div>';
        return;
      }
      const iconMap = {
        schedule_rejection: { cls:'rejection', icon:'✕' },
        schedule_approval:  { cls:'approval',  icon:'✓' },
        oil_change_alert:   { cls:'oil',        icon:'⚠' },
        system:             { cls:'system',     icon:'i' },
      };
      container.innerHTML = list.map(n => {
        const t = iconMap[n.type] ?? { cls:'system', icon:'i' };
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
      container.querySelectorAll('.notif-item').forEach(el => {
        el.addEventListener('click', async () => {
          try {
            await apiFetch(`/notifications/${el.dataset.id}/read`, { method:'PATCH' });
            loadNotifications();
          } catch { /* silencioso */ }
        });
      });
    } catch { /* silencioso */ }
  }

  document.getElementById('btn-mark-all').addEventListener('click', async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      loadNotifications();
    } catch { /* silencioso */ }
  });

  document.getElementById('btn-profile').addEventListener('click', () => {
    window.location.href = './profile.html';
  });

  /* ── Init ── */
  loadDashboard();
