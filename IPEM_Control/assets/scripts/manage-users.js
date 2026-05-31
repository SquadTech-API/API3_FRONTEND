if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let allUsers     = [];
  let activeFilter = 'all';
  let searchQuery  = '';
  let editingReg   = null;

  async function loadUsers() {
    try {
      const data = await apiFetch('/users');
      const list = Array.isArray(data)?data:(data.content??[]);
      /* Verifica saída ativa em paralelo */
      await Promise.all(list.map(async u => {
        try {
          const resp = await fetch(`${API_BASE}/departure-logs/active-user?registration=${u.registration}`,{headers:getAuthHeaders()});
          u._inService = resp.ok;
        } catch { u._inService = false; }
      }));
      allUsers = list;
      renderGrid();
    } catch(err) {
      document.getElementById('users-grid').innerHTML = `<div class="loading-state" style="color:var(--danger);">${err.message}</div>`;
    }
  }

  function filterUsers() {
    return allUsers.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q||(u.name??'').toLowerCase().includes(q)||(u.role??'').toLowerCase().includes(q);
      const inactive = u.activeEmployee===false;
      const matchFilter =
        activeFilter==='all' ||
        (activeFilter==='in_service' && u._inService && !inactive) ||
        (activeFilter==='inactive'   && inactive);
      return matchSearch && matchFilter;
    });
  }

  function renderGrid() {
    const grid = document.getElementById('users-grid');
    const list = filterUsers();
    if (!list.length) { grid.innerHTML = '<div class="empty-state">Nenhum usuário encontrado.</div>'; return; }
    grid.innerHTML = '';
    list.forEach((u, i) => {
      const inactive  = u.activeEmployee===false;
      const inService = u._inService && !inactive;
      const isAdmin   = u.userType==='admin';
      const headerCls = inactive?'inactive':inService?'in-service':isAdmin?'admin':'technician';
      const statusTxt = inactive?'✕ Inativo':inService?'● Em serviço':'● Disponível';
      const statusCls = inactive?'inactive':inService?'in-service':'available';
      const card = document.createElement('div');
      card.className = `user-card${inactive?' inactive':''}`;
      card.style.animationDelay = `${i*.04}s`;
      card.innerHTML = `
        <div class="user-card-header ${headerCls}">
          <span>${u.name??'—'}</span>
          <span class="user-type-badge">${isAdmin?'Admin':'Técnico'}</span>
        </div>
        <div class="user-card-body">
          <p><strong>Matrícula:</strong> ${u.registration}</p>
          <p><strong>Cargo:</strong> ${u.role??'—'}</p>
          <p><strong>Habilitação:</strong> ${u.licenseType?`CNH ${u.licenseType}`:'—'}</p>
          <p><strong>E-mail:</strong> ${u.email??'—'}</p>
          <div class="user-card-status ${statusCls}">${statusTxt}</div>
        </div>
        <div class="user-card-actions">
          <button class="ua-btn edit" onclick="openEditModal(${u.registration})" type="button">✏ Editar</button>
          ${inactive
            ? `<button class="ua-btn activate" onclick="toggleActive(${u.registration},false)" type="button">✓ Ativar</button>`
            : `<button class="ua-btn deact" onclick="toggleActive(${u.registration},true)" type="button" ${inService?'disabled title="Em serviço"':''}>🔒 Desativar</button>`}
        </div>`;
      grid.appendChild(card);
    });
  }

  function openEditModal(registration) {
    editingReg = registration;
    const u = allUsers.find(x=>x.registration===registration);
    if (!u) return;
    document.getElementById('edit-registration').value = registration;
    document.getElementById('edit-name').value       = u.name??'';
    document.getElementById('edit-role').value       = u.role??'';
    document.getElementById('edit-user-type').value  = u.userType??'technician';
    document.getElementById('edit-license').value    = u.licenseType??'';
    document.getElementById('edit-overlay').classList.add('active');
  }

  function closeEditModal() { document.getElementById('edit-overlay').classList.remove('active'); editingReg=null; }

  document.getElementById('edit-save-btn').addEventListener('click', async () => {
    if (!editingReg) return;
    const payload = {
      name:        document.getElementById('edit-name').value.trim(),
      role:        document.getElementById('edit-role').value.trim()||null,
      userType:    document.getElementById('edit-user-type').value,
      licenseType: document.getElementById('edit-license').value||null,
    };
    if (!payload.name) { showModal('Campo obrigatório','Nome não pode ser vazio.','warning'); return; }
    const btn=document.getElementById('edit-save-btn'), overlay=document.getElementById('loading-overlay');
    btn.disabled=true; overlay.classList.add('active');
    try {
      await apiFetch(`/users/${editingReg}`,{method:'PUT',body:JSON.stringify(payload)});
      closeEditModal(); showToast('Usuário atualizado!','success'); await loadUsers();
    } catch(err) { showModal('Erro',err.message,'error'); }
    finally { btn.disabled=false; overlay.classList.remove('active'); }
  });

  async function toggleActive(registration, currentlyActive) {
    const u   = allUsers.find(x=>x.registration===registration);
    const msg = currentlyActive
      ? `Desativar "${u?.name}"? O login será bloqueado.`
      : `Ativar "${u?.name}"? O login será liberado.`;
    showModal(currentlyActive?'Desativar usuário':'Ativar usuário', msg, 'warning', async () => {
      try {
        await apiFetch(`/users/${registration}/${currentlyActive?'deactivate':'activate'}`,{method:'PATCH'});
        showToast(`Usuário ${currentlyActive?'desativado':'ativado'}!`, currentlyActive?'warning':'success');
        await loadUsers();
      } catch(err) { showModal('Erro',err.message,'error'); }
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); activeFilter=btn.dataset.filter; renderGrid();
    });
  });
  document.getElementById('search-input').addEventListener('input',e=>{searchQuery=e.target.value.trim();renderGrid();});

  loadUsers();
