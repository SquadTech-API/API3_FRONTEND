if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let allVehicles    = [];
  let allServices    = [];
  let selectedVehicle= null;
  let linkedIds      = new Set();

  async function loadAll() {
    try {
      const [vData, sData] = await Promise.all([
        apiFetch('/vehicles?includeInactive=false'),
        apiFetch('/service-types?enabled=true'),
      ]);
      allVehicles = Array.isArray(vData)?vData:(vData.content??[]);
      allServices = Array.isArray(sData)?sData:(sData.content??[]);
      renderVehicleList(allVehicles);
    } catch(err) {
      document.getElementById('vehicle-list').innerHTML = `<div style="padding:16px;color:var(--danger);">${err.message}</div>`;
    }
  }

  function renderVehicleList(list) {
    const container = document.getElementById('vehicle-list');
    if (!list.length) { container.innerHTML = '<div style="padding:16px;color:var(--muted);">Nenhuma viatura.</div>'; return; }
    container.innerHTML = '';
    list.forEach(v => {
      const el = document.createElement('div');
      el.className = `veh-list-item${selectedVehicle?.id===v.id?' selected':''}`;
      el.dataset.id = v.id;
      el.innerHTML = `<div><div class="vli-prefix">${v.prefix??'—'}</div><div class="vli-model">${v.model??'—'}</div></div>`;
      el.addEventListener('click', () => selectVehicle(v));
      container.appendChild(el);
    });
  }

  async function selectVehicle(vehicle) {
    selectedVehicle = vehicle;
    document.querySelectorAll('.veh-list-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.id == vehicle.id);
    });
    try {
      const data = await apiFetch(`/vehicle-service/${vehicle.id}`);
      const linked = Array.isArray(data)?data:(data.content??[]);
      linkedIds = new Set(linked.map(l => l.serviceTypeId??l.id));
      renderServicesPanel(vehicle);
    } catch { linkedIds = new Set(); renderServicesPanel(vehicle); }
  }

  function renderServicesPanel(vehicle) {
    const panel = document.getElementById('services-panel');
    panel.innerHTML = `
      <div class="sp-header">
        <div>
          <div class="sp-title">${vehicle.prefix} — ${vehicle.model??'—'}</div>
          <div class="sp-subtitle">Selecione os serviços habilitados para esta viatura</div>
        </div>
        <div style="display:flex;gap:7px;">
          <button style="font-size:11px;color:var(--blue);background:none;border:none;cursor:pointer;font-family:var(--font);" onclick="selectAll(true)" type="button">Marcar todos</button>
          <button style="font-size:11px;color:var(--muted);background:none;border:none;cursor:pointer;font-family:var(--font);" onclick="selectAll(false)" type="button">Desmarcar</button>
        </div>
      </div>
      <div id="svc-items">
        ${allServices.map(s=>
          `<div class="svc-item">
            <input class="svc-checkbox" type="checkbox" value="${s.id}" ${linkedIds.has(s.id)?'checked':''}/>
            <div>
              <div class="svc-item-name">${s.serviceName??'—'}</div>
              ${s.description?`<div class="svc-item-desc">${s.description}</div>`:''}
            </div>
            ${s.isOilChange?'<span class="svc-oil-tag">Troca de óleo</span>':''}
          </div>`).join('')}
      </div>
      <div class="sp-footer">
        <button class="btn-sp-cancel" onclick="cancelChanges()" type="button">Cancelar</button>
        <button class="btn-sp-save" id="btn-save-links" type="button">Salvar vínculos</button>
      </div>
    `;
    document.getElementById('btn-save-links').addEventListener('click', saveLinks);
  }

  function selectAll(checked) {
    document.querySelectorAll('.svc-checkbox').forEach(cb => cb.checked = checked);
  }

  function cancelChanges() {
    document.getElementById('services-panel').innerHTML = '<div class="sp-empty">Selecione uma viatura para gerenciar seus serviços habilitados.</div>';
    selectedVehicle = null;
    document.querySelectorAll('.veh-list-item').forEach(el => el.classList.remove('selected'));
  }

  async function saveLinks() {
    if (!selectedVehicle) return;
    const selected = [...document.querySelectorAll('.svc-checkbox:checked')].map(cb=>parseInt(cb.value));
    const overlay = document.getElementById('loading-overlay');
    const btn = document.getElementById('btn-save-links');
    btn.disabled=true; overlay.classList.add('active');
    try {
      await apiFetch(`/vehicle-service/sync/${selectedVehicle.id}`,{method:'POST',body:JSON.stringify(selected)});
      showToast(`Serviços de ${selectedVehicle.prefix} atualizados!`,'success');
      linkedIds = new Set(selected);
    } catch(err) { showModal('Erro',err.message,'error'); }
    finally { btn.disabled=false; overlay.classList.remove('active'); }
  }

  document.getElementById('vehicle-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = q ? allVehicles.filter(v=>(v.prefix??'').toLowerCase().includes(q)||(v.model??'').toLowerCase().includes(q)) : allVehicles;
    renderVehicleList(filtered);
  });

  loadAll();
