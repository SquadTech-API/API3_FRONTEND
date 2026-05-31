if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let allVehicles = [];
  let selectedVehicle = null;

  async function loadVehicles() {
    try {
      const data = await apiFetch('/vehicles');
      allVehicles = Array.isArray(data)?data:(data.content??[]);
      renderVehicleList(allVehicles);
    } catch(err) {
      document.getElementById('vehicle-list').innerHTML = `<div style="padding:16px;color:var(--danger);">${err.message}</div>`;
    }
  }

  function getOilStatus(v) {
    if (!v.nextOilChangeMileage||!v.currentMileage) return {cls:'ok',lbl:'Sem registro'};
    const km = v.nextOilChangeMileage - v.currentMileage;
    if (km<=0)   return {cls:'danger',lbl:'Troca vencida'};
    if (km<=500) return {cls:'warn',  lbl:`Faltam ${km.toLocaleString('pt-BR')} km`};
    return {cls:'ok', lbl:'Em dia'};
  }

  function renderVehicleList(list) {
    const container = document.getElementById('vehicle-list');
    if (!list.length) { container.innerHTML='<div style="padding:16px;color:var(--muted);">Nenhuma viatura.</div>'; return; }
    container.innerHTML='';
    list.forEach(v=>{
      const st = getOilStatus(v);
      const el = document.createElement('div');
      el.className=`veh-list-item${selectedVehicle?.id===v.id?' selected':''}`;
      el.dataset.id=v.id;
      el.innerHTML=`
        <div class="vli-prefix">${v.prefix??'—'}</div>
        <div class="vli-model">${v.brand??''} ${v.model??'—'}</div>
        <span class="vli-status ${st.cls}">${st.lbl}</span>`;
      el.addEventListener('click',()=>selectVehicle(v));
      container.appendChild(el);
    });
  }

  async function selectVehicle(vehicle) {
    selectedVehicle=vehicle;
    document.querySelectorAll('.veh-list-item').forEach(el=>el.classList.toggle('selected',el.dataset.id==vehicle.id));
    const panel = document.getElementById('detail-panel');
    panel.innerHTML='<div class="panel-empty">Carregando...</div>';
    try {
      const data = await apiFetch(`/oil-changes?vehicleId=${vehicle.id}`);
      const list = Array.isArray(data)?data:(data.content??[]);
      renderDetailPanel(vehicle, list);
    } catch(err) {
      panel.innerHTML=`<div class="panel-empty" style="color:var(--danger);">${err.message}</div>`;
    }
  }

  function renderDetailPanel(vehicle, changes) {
    const st = getOilStatus(vehicle);
    const latest = changes[0];
    const km   = vehicle.currentMileage??0;
    const nextKm = vehicle.nextOilChangeMileage;
    const pct  = latest ? Math.min(100,Math.round(((km-latest.changeMileage)/latest.intervalKm)*100)) : 0;

    const panel = document.getElementById('detail-panel');
    panel.innerHTML=`
      <div class="status-card">
        <div class="sc-top">
          <div>
            <div class="sc-prefix">${vehicle.prefix??'—'}</div>
            <div class="sc-model">${vehicle.brand??''} ${vehicle.model??'—'}</div>
            <div class="sc-km">KM atual: <strong style="color:#fff">${formatKm(km)}</strong></div>
          </div>
          <span class="sc-badge ${st.cls}">${st.lbl}</span>
        </div>
        ${latest?`
        <div class="progress-wrap">
          <div class="progress-labels"><span>Última: ${formatKm(latest.changeMileage)}</span><span>Próxima: ${nextKm?formatKm(nextKm):'—'}</span></div>
          <div class="progress-bar"><div class="progress-fill ${st.cls}" style="width:${pct}%"></div></div>
        </div>` : ''}
      </div>
      <div class="entries-card">
        <div class="entries-header">
          <span class="entries-title">Histórico de trocas</span>
          <button style="background:var(--navy);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);" onclick="window.location.href='./oil-change.html'" type="button">+ Registrar troca</button>
        </div>
        <div id="oil-entries">
          ${changes.length===0
            ? '<div class="panel-empty">Nenhuma troca registrada para esta viatura.</div>'
            : changes.map(c=>{
                const cKm = c.changeMileage??0;
                const nKm = c.nextChangeMileage??0;
                const remaining = nKm - km;
                const eSt = remaining<=0?'danger':remaining<=500?'warn':'ok';
                return `
                <div class="oil-entry">
                  <div class="oe-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12a10 10 0 0 1 10-10z"/><path d="M12 8v4l3 3"/></svg></div>
                  <div class="oe-main">
                    <div class="oe-date">${formatDate(c.changeDate)}</div>
                    <div class="oe-meta">KM na troca: ${formatKm(cKm)} · Intervalo: ${formatKm(c.intervalKm)}</div>
                    ${c.notes?`<div class="oe-notes">${c.notes}</div>`:''}
                    <div class="oe-next ${eSt}">Próxima: ${formatKm(nKm)} ${remaining<=0?'⚠ Vencida':''}</div>
                  </div>
                </div>`;}).join('')}
        </div>
      </div>
    `;
  }

  document.getElementById('vehicle-search').addEventListener('input', e=>{
    const q=e.target.value.toLowerCase().trim();
    renderVehicleList(q?allVehicles.filter(v=>(v.prefix??'').toLowerCase().includes(q)||(v.model??'').toLowerCase().includes(q)):allVehicles);
  });

  loadVehicles();
