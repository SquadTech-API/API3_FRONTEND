if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials=(user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let activePane='departures';
  let departures=[], fuelings=[], oilChanges=[];
  let currentRecord=null, currentType=null;
  let depFilter='all';

  /* ── Tabs ── */
  document.querySelectorAll('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      activePane=tab.dataset.pane;
      document.getElementById(`pane-${activePane}`).classList.add('active');
      loadPane(activePane);
    });
  });

  /* ── Filtros de saída ── */
  document.querySelectorAll('[data-filter-dep]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('[data-filter-dep]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); depFilter=btn.dataset.filterDep;
      renderDepartures();
    });
  });

  document.getElementById('search-departures').addEventListener('input',e=>{
    const q=e.target.value.toLowerCase().trim();
    renderDepartures(q);
  });

  async function loadPane(pane) {
    try {
      if (pane==='departures'&&!departures.length){
        const d=await apiFetch('/departure-logs?limit=50&sort=desc');
        departures=Array.isArray(d)?d:(d.content??[]); renderDepartures();
      }
      if (pane==='fueling'&&!fuelings.length){
        const d=await apiFetch('/fueling?limit=50&sort=desc');
        fuelings=Array.isArray(d)?d:(d.content??[]); renderFueling();
      }
      if (pane==='oil'&&!oilChanges.length){
        const d=await apiFetch('/oil-changes?limit=50&sort=desc');
        oilChanges=Array.isArray(d)?d:(d.content??[]); renderOil();
      }
    } catch(err){ console.error(err); }
  }

  function renderDepartures(q='') {
    const list=document.getElementById('departures-list');
    let filtered=departures.filter(d=>{
      if(depFilter==='in_progress'&&d.status!=='in_progress') return false;
      if(depFilter==='completed'&&d.status!=='completed')     return false;
      if(q&&!(d.vehiclePrefix??'').toLowerCase().includes(q)&&!(d.primaryConductorName??'').toLowerCase().includes(q)) return false;
      return true;
    });
    if(!filtered.length){list.innerHTML='<div style="color:var(--muted);padding:20px 0;">Nenhuma saída encontrada.</div>';return;}
    list.innerHTML=filtered.map(d=>`
      <div class="record-row">
        <div class="rr-id">#${d.id}</div>
        <div class="rr-info">
          <div class="rr-main"><strong>${d.vehiclePrefix??'—'}</strong> · ${d.primaryConductorName??'—'} ${d.secondConductorName?'· '+d.secondConductorName:''}</div>
          <div class="rr-meta">${d.serviceTypeName??'—'} · ${formatDateTime(d.departureDatetime)} · ${d.destination??'—'}</div>
        </div>
        <div class="rr-right">
          <span class="rr-status ${d.status}">${d.status==='in_progress'?'Em andamento':'Encerrada'}</span>
          <div style="display:flex;gap:5px;">
            <button class="sgi-badge ${d.sgiTranscribed?'done':''}" onclick="toggleSgi(${d.id}, ${d.sgiTranscribed??false})" type="button">${d.sgiTranscribed?'✓ SGI':'SGI'}</button>
            <button class="rr-edit-btn" onclick="openDepartureEdit(${d.id})" type="button">✏ Editar</button>
          </div>
        </div>
      </div>`).join('');
  }

  function renderFueling() {
    const list=document.getElementById('fueling-list');
    if(!fuelings.length){list.innerHTML='<div style="color:var(--muted);padding:20px 0;">Nenhum abastecimento.</div>';return;}
    list.innerHTML=fuelings.map(f=>`
      <div class="record-row">
        <div class="rr-id">#${f.id}</div>
        <div class="rr-info">
          <div class="rr-main"><strong>${f.vehiclePrefix??'—'}</strong> · ${f.fuelTypeName??'—'}</div>
          <div class="rr-meta">${formatDateTime(f.fuelingDatetime)} · ${f.liters??'—'} L · ${formatCurrency(f.totalValue)}</div>
        </div>
        <div class="rr-right"><button class="rr-edit-btn" onclick="openFuelingEdit(${f.id})" type="button">✏ Editar</button></div>
      </div>`).join('');
  }

  function renderOil() {
    const list=document.getElementById('oil-list');
    if(!oilChanges.length){list.innerHTML='<div style="color:var(--muted);padding:20px 0;">Nenhuma troca de óleo.</div>';return;}
    list.innerHTML=oilChanges.map(c=>`
      <div class="record-row">
        <div class="rr-id">#${c.id}</div>
        <div class="rr-info">
          <div class="rr-main"><strong>${c.vehiclePrefix??'—'}</strong></div>
          <div class="rr-meta">${formatDate(c.changeDate)} · KM ${formatKm(c.changeMileage)} · Próxima ${formatKm(c.nextChangeMileage)}</div>
        </div>
        <div class="rr-right"><button class="rr-edit-btn" onclick="openOilEdit(${c.id})" type="button">✏ Editar</button></div>
      </div>`).join('');
  }

  /* ── Drawer ── */
  function openDepartureEdit(id) {
    currentType='departure'; currentRecord=departures.find(d=>d.id===id);
    if(!currentRecord) return;
    document.getElementById('drawer-title').textContent=`Editar saída #${id}`;
    document.getElementById('drawer-content').innerHTML=`
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Viatura</label><input class="form-input readonly-field" value="${currentRecord.vehiclePrefix??'—'}" readonly/></div>
        <div class="form-row"><label class="form-label">Condutor principal</label><input class="form-input readonly-field" value="${currentRecord.primaryConductorName??'—'}" readonly/></div>
        <div class="form-row full"><label class="form-label">Destino</label><input class="form-input" id="edit-destination" value="${currentRecord.destination??''}"/></div>
        <div class="form-row"><label class="form-label">KM de saída</label><input class="form-input" id="edit-start-km" type="number" value="${currentRecord.startingMileage??''}"/></div>
        <div class="form-row"><label class="form-label">KM de retorno</label><input class="form-input" id="edit-finish-km" type="number" value="${currentRecord.finishingMileage??''}" ${currentRecord.status==='in_progress'?'disabled':''}/ /></div>
        <div class="form-row full"><label class="form-label">Observações (motivo da edição)</label><textarea class="form-textarea" id="edit-obs" placeholder="Descreva o motivo desta edição..." rows="2"></textarea></div>
      </div>`;
    document.getElementById('edit-overlay').classList.add('active');
  }

  function openFuelingEdit(id) {
    currentType='fueling'; currentRecord=fuelings.find(f=>f.id===id);
    if(!currentRecord) return;
    document.getElementById('drawer-title').textContent=`Editar abastecimento #${id}`;
    document.getElementById('drawer-content').innerHTML=`
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Viatura</label><input class="form-input readonly-field" value="${currentRecord.vehiclePrefix??'—'}" readonly/></div>
        <div class="form-row"><label class="form-label">Combustível</label><input class="form-input readonly-field" value="${currentRecord.fuelTypeName??'—'}" readonly/></div>
        <div class="form-row"><label class="form-label">Litros</label><input class="form-input" id="edit-liters" type="number" step="0.001" value="${currentRecord.liters??''}"/></div>
        <div class="form-row"><label class="form-label">Valor total (R$)</label><input class="form-input" id="edit-total" type="number" step="0.01" value="${currentRecord.totalValue??''}"/></div>
        <div class="form-row"><label class="form-label">KM no abastecimento</label><input class="form-input" id="edit-mileage" type="number" value="${currentRecord.mileageAtFueling??''}"/></div>
        <div class="form-row"><label class="form-label">Nome do posto</label><input class="form-input" id="edit-station" value="${currentRecord.stationName??''}"/></div>
        <div class="form-row full"><label class="form-label">Motivo da edição</label><textarea class="form-textarea" id="edit-obs" placeholder="Descreva o motivo..." rows="2"></textarea></div>
      </div>`;
    document.getElementById('edit-overlay').classList.add('active');
  }

  function openOilEdit(id) {
    currentType='oil'; currentRecord=oilChanges.find(c=>c.id===id);
    if(!currentRecord) return;
    document.getElementById('drawer-title').textContent=`Editar troca de óleo #${id}`;
    document.getElementById('drawer-content').innerHTML=`
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Viatura</label><input class="form-input readonly-field" value="${currentRecord.vehiclePrefix??'—'}" readonly/></div>
        <div class="form-row"><label class="form-label">Data da troca</label><input class="form-input" id="edit-date" type="date" value="${currentRecord.changeDate??''}"/></div>
        <div class="form-row"><label class="form-label">KM na troca</label><input class="form-input" id="edit-km" type="number" value="${currentRecord.changeMileage??''}"/></div>
        <div class="form-row"><label class="form-label">Intervalo (km)</label><input class="form-input" id="edit-interval" type="number" value="${currentRecord.intervalKm??5000}"/></div>
        <div class="form-row full"><label class="form-label">Observações</label><textarea class="form-textarea" id="edit-notes" rows="2">${currentRecord.notes??''}</textarea></div>
        <div class="form-row full"><label class="form-label">Motivo da edição</label><textarea class="form-textarea" id="edit-obs" placeholder="Descreva o motivo..." rows="2"></textarea></div>
      </div>`;
    document.getElementById('edit-overlay').classList.add('active');
  }

  function closeDrawer() { document.getElementById('edit-overlay').classList.remove('active'); currentRecord=null; currentType=null; }

  document.getElementById('drawer-save-btn').addEventListener('click', async()=>{
    const obs = document.getElementById('edit-obs')?.value.trim();
    if (!obs) { showToast('Informe o motivo da edição.','error'); return; }
    const btn=document.getElementById('drawer-save-btn'),overlay=document.getElementById('loading-overlay');
    btn.disabled=true; overlay.classList.add('active');
    try {
      let payload={},url='';
      if(currentType==='departure'){
        payload={destination:document.getElementById('edit-destination')?.value.trim(),startingMileage:parseFloat(document.getElementById('edit-start-km')?.value)||null,finishingMileage:parseFloat(document.getElementById('edit-finish-km')?.value)||null,editReason:obs};
        url=`/admin/departure-logs/${currentRecord.id}`;
      } else if(currentType==='fueling'){
        payload={liters:parseFloat(document.getElementById('edit-liters')?.value)||null,totalValue:parseFloat(document.getElementById('edit-total')?.value)||null,mileageAtFueling:parseFloat(document.getElementById('edit-mileage')?.value)||null,stationName:document.getElementById('edit-station')?.value.trim()||null,editReason:obs};
        url=`/admin/fueling/${currentRecord.id}`;
      } else if(currentType==='oil'){
        const km=parseFloat(document.getElementById('edit-km')?.value)||0;
        const interval=parseFloat(document.getElementById('edit-interval')?.value)||5000;
        payload={changeMileage:km,intervalKm:interval,nextChangeMileage:km+interval,changeDate:document.getElementById('edit-date')?.value,notes:document.getElementById('edit-notes')?.value.trim()||null,editReason:obs};
        url=`/admin/oil-changes/${currentRecord.id}`;
      }
      await apiFetch(url,{method:'PATCH',body:JSON.stringify(payload)});
      closeDrawer();
      showToast('Registro atualizado! Edição salva no audit log.','success');
      departures=[]; fuelings=[]; oilChanges=[];
      await loadPane(activePane);
    } catch(err){ showModal('Erro',err.message,'error'); }
    finally{ btn.disabled=false; overlay.classList.remove('active'); }
  });

  async function toggleSgi(id, current) {
    try {
      await apiFetch(`/departure-logs/${id}/mark-transcribed`,{method:'PATCH'});
      const dep=departures.find(d=>d.id===id);
      if(dep) dep.sgiTranscribed=!current;
      renderDepartures(document.getElementById('search-departures').value.toLowerCase().trim());
      showToast(`Saída #${id} ${!current?'marcada como transcrita ao SGI':'desmarcada'}.`,'success');
    } catch(err){ showModal('Erro',err.message,'error'); }
  }

  loadPane('departures');
