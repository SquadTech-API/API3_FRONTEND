if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let allServices  = [];
  let activeFilter = 'all';
  let searchQuery  = '';
  let editingId    = null;

  document.getElementById('modal-enabled').addEventListener('change', e => {
    document.getElementById('toggle-desc').textContent = e.target.checked
      ? 'Aparece no registro de saída'
      : 'Não aparece no registro de saída';
  });

  async function loadServices() {
    try {
      const data = await apiFetch('/service-types');
      allServices = Array.isArray(data)?data:(data.content??[]);
      updateStats();
      renderList();
    } catch(err) {
      document.getElementById('svc-list').innerHTML = `<div style="color:var(--danger);">${err.message}</div>`;
    }
  }

  function updateStats() {
    const active = allServices.filter(s=>s.enabled!==false).length;
    document.getElementById('stat-total').textContent   = allServices.length;
    document.getElementById('stat-active').textContent  = active;
    document.getElementById('stat-inactive').textContent = allServices.length - active;
  }

  function filterServices() {
    return allServices.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q||(s.serviceName??'').toLowerCase().includes(q)||(s.description??'').toLowerCase().includes(q);
      const active = s.enabled!==false;
      const matchFilter = activeFilter==='all'||(activeFilter==='active'&&active)||(activeFilter==='inactive'&&!active);
      return matchSearch && matchFilter;
    });
  }

  function renderList() {
    const container = document.getElementById('svc-list');
    const list = filterServices();
    if (!list.length) { container.innerHTML = '<div style="color:var(--muted);padding:20px 0;">Nenhum tipo de serviço encontrado.</div>'; return; }
    container.innerHTML = '';
    list.forEach((s, i) => {
      const active = s.enabled!==false;
      const isOil  = s.isOilChange===true;
      const el = document.createElement('div');
      el.className = `svc-card${active?'':' inactive'}`;
      el.style.animationDelay = `${i*.04}s`;
      el.innerHTML = `
        <div class="svc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
        <div class="svc-info">
          <div class="svc-name">
            ${s.serviceName??'—'}
            ${isOil?'<span class="svc-oil-badge">Troca de óleo</span>':''}
          </div>
          <div class="svc-desc">${s.description||'<em style="color:var(--muted)">Sem descrição</em>'}</div>
        </div>
        <div class="svc-actions">
          <span class="svc-status ${active?'active':'inactive'}">${active?'Ativo':'Inativo'}</span>
          <button class="svc-edit-btn" onclick="openModal(${s.id})" type="button">✏ Editar</button>
        </div>`;
      container.appendChild(el);
    });
  }

  function openModal(id = null) {
    editingId = id;
    document.getElementById('modal-title-text').textContent = id ? 'Editar tipo de serviço' : 'Novo tipo de serviço';
    document.getElementById('modal-svc-id').value = id??'';
    if (id) {
      const s = allServices.find(x=>x.id===id);
      if (!s) return;
      document.getElementById('modal-name').value    = s.serviceName??'';
      document.getElementById('modal-desc').value    = s.description??'';
      document.getElementById('modal-enabled').checked = s.enabled!==false;
      document.getElementById('modal-is-oil').checked  = s.isOilChange===true;
      document.getElementById('toggle-desc').textContent = s.enabled!==false
        ? 'Aparece no registro de saída' : 'Não aparece no registro de saída';
    } else {
      document.getElementById('modal-name').value    = '';
      document.getElementById('modal-desc').value    = '';
      document.getElementById('modal-enabled').checked = true;
      document.getElementById('modal-is-oil').checked  = false;
      document.getElementById('toggle-desc').textContent = 'Aparece no registro de saída';
    }
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('modal-name').focus();
  }

  function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); editingId=null; }

  document.getElementById('modal-save-btn').addEventListener('click', async () => {
    const name    = document.getElementById('modal-name').value.trim();
    const desc    = document.getElementById('modal-desc').value.trim()||null;
    const enabled = document.getElementById('modal-enabled').checked;
    const isOil   = document.getElementById('modal-is-oil').checked;
    if (!name) { showToast('Nome do serviço é obrigatório.','error'); return; }

    const btn=document.getElementById('modal-save-btn'), overlay=document.getElementById('loading-overlay');
    btn.disabled=true; overlay.classList.add('active');
    try {
      if (editingId) {
        const prev = allServices.find(s=>s.id===editingId);
        await apiFetch(`/service-types/${editingId}`,{method:'PUT',body:JSON.stringify({serviceName:name,description:desc,isOilChange:isOil})});
        if ((prev?.enabled!==false)!==enabled)
          await apiFetch(`/service-types/${editingId}/toggle`,{method:'PATCH'});
      } else {
        await apiFetch('/service-types',{method:'POST',body:JSON.stringify({serviceName:name,description:desc,enabled,isOilChange:isOil})});
      }
      closeModal(); showToast(`Serviço "${name}" ${editingId?'atualizado':'criado'}!`,'success');
      await loadServices();
    } catch(err) { showModal('Erro',err.message,'error'); }
    finally { btn.disabled=false; overlay.classList.remove('active'); }
  });

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); activeFilter=btn.dataset.filter; renderList();
    });
  });
  document.getElementById('search-input').addEventListener('input',e=>{searchQuery=e.target.value.trim();renderList();});

  loadServices();
