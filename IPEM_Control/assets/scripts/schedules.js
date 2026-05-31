if (!requireLogin()) {}
  initMenu(); adjustMenuByRole();
  const user=getUser();
  const admin=isAdmin();
  if (user) {
    const initials=(user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'??';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let allSchedules=[]; let activeFilter='all'; let rejectId=null;

  /* Mostrar/ocultar botão novo apenas para técnicos */
  if (admin) document.getElementById('btn-new-sched').style.display='none';
  else document.getElementById('btn-new-sched').addEventListener('click',()=>{
    document.getElementById('new-sched-form').style.display='';
    document.getElementById('sched-title').focus();
    loadFormData();
  });

  async function loadFormData() {
    try {
      const [vData,sData]=await Promise.all([apiFetch('/vehicles?status=available'),apiFetch('/service-types')]);
      const vehicles=Array.isArray(vData)?vData:(vData.content??[]);
      const services=Array.isArray(sData)?sData:(sData.content??[]);
      const vSel=document.getElementById('sched-vehicle');
      const sSel=document.getElementById('sched-service');
      vSel.innerHTML='<option value="">Selecione</option>'+vehicles.map(v=>`<option value="${v.id}">${v.prefix} — ${v.model??'—'}</option>`).join('');
      sSel.innerHTML='<option value="">Selecione</option>'+services.filter(s=>s.enabled!==false).map(s=>`<option value="${s.id}">${s.serviceName}</option>`).join('');
    } catch {}
  }

  document.getElementById('btn-save-sched').addEventListener('click', async()=>{
    const title=document.getElementById('sched-title').value.trim();
    const vehicleId=parseInt(document.getElementById('sched-vehicle').value)||null;
    const serviceId=parseInt(document.getElementById('sched-service').value)||null;
    const dt=document.getElementById('sched-datetime').value;
    const prio=document.getElementById('sched-priority').value;
    const km=parseFloat(document.getElementById('sched-mileage').value)||null;
    const errors=[];
    if(!title)    errors.push('Título é obrigatório.');
    if(!vehicleId)errors.push('Selecione a viatura.');
    if(!serviceId)errors.push('Selecione o tipo de serviço.');
    if(!dt)       errors.push('Data e hora são obrigatórias.');
    if(errors.length){showModal('Dados inválidos',errors.map(e=>`• ${e}`).join('<br/>'),'warning');return;}
    const btn=document.getElementById('btn-save-sched'),overlay=document.getElementById('loading-overlay');
    btn.disabled=true; overlay.classList.add('active');
    try {
      await apiFetch('/schedules',{method:'POST',body:JSON.stringify({title,vehicleId,serviceTypeId:serviceId,scheduledDatetime:dt,priority:prio,estimatedMileage:km})});
      document.getElementById('new-sched-form').style.display='none';
      showToast('Agendamento solicitado!','success');
      await loadSchedules();
    } catch(err){showModal('Erro',err.message,'error');}
    finally{btn.disabled=false;overlay.classList.remove('active');}
  });

  async function loadSchedules() {
    try {
      const url=admin?'/schedules':'/schedules/my';
      const data=await apiFetch(url);
      allSchedules=Array.isArray(data)?data:(data.content??[]);
      updateStats();
      renderSchedules();
    } catch(err){
      document.getElementById('schedules-list').innerHTML=`<div style="color:var(--danger);">${err.message}</div>`;
    }
  }

  function updateStats() {
    const row=document.getElementById('stats-row');
    const counts={pending:0,confirmed:0,rejected:0,completed:0};
    allSchedules.forEach(s=>{ if(counts[s.status]!==undefined) counts[s.status]++; });
    row.innerHTML=Object.entries(counts).map(([k,v])=>`
      <div class="stat-pill"><span class="stat-pill-num">${v}</span><span class="stat-pill-lbl">${{pending:'Pendentes',confirmed:'Confirmados',rejected:'Recusados',completed:'Concluídos'}[k]}</span></div>`).join('');
  }

  function renderSchedules(q='') {
    const list=document.getElementById('schedules-list');
    let filtered=allSchedules.filter(s=>{
      if(activeFilter!=='all'&&s.status!==activeFilter) return false;
      if(q&&!(s.title??'').toLowerCase().includes(q)&&!(s.vehiclePrefix??'').toLowerCase().includes(q)) return false;
      return true;
    });
    if(!filtered.length){list.innerHTML='<div style="color:var(--muted);padding:20px 0;">Nenhum agendamento encontrado.</div>';return;}
    list.innerHTML='';
    filtered.forEach((s,i)=>{
      const prio=s.priority??'low';
      const statusLabels={pending:'Pendente',confirmed:'Confirmado',rejected:'Recusado',completed:'Concluído',cancelled:'Cancelado',in_progress:'Em andamento'};
      const card=document.createElement('div');
      card.className='sched-card';
      card.style.animationDelay=`${i*.04}s`;
      card.innerHTML=`
        <div class="sched-top">
          <div>
            <div class="sched-title-row">
              <span class="prio-dot ${prio}"></span>
              <span class="sched-title">${s.title??'—'}</span>
            </div>
            <div class="sched-meta">
              <span>${s.vehiclePrefix??'—'}</span>
              <span>${s.requesterName??'—'}</span>
              <span>${formatDateTime(s.scheduledDatetime)}</span>
              <span>Prioridade: ${prio==='high'?'Alta':prio==='medium'?'Média':'Baixa'}</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            <span class="sched-status ${s.status}">${statusLabels[s.status]??s.status}</span>
            ${admin&&s.status==='pending'?`
              <div class="sched-actions">
                <button class="btn-approve" onclick="approveSchedule(${s.id})" type="button">✓ Aceitar</button>
                <button class="btn-reject"  onclick="openRejectModal(${s.id},'${(s.requesterName??'').replace(/'/g,"\\'")}','${(s.title??'').replace(/'/g,"\\'")}')}" type="button">✕ Recusar</button>
              </div>` : ''}
          </div>
        </div>
        ${s.rejectionReason?`<div class="rejection-reason"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg><div><strong>Motivo da recusa:</strong> ${s.rejectionReason}</div></div>`:''}
      `;
      list.appendChild(card);
    });
  }

  async function approveSchedule(id) {
    try {
      await apiFetch(`/schedules/${id}/approve`,{method:'PATCH'});
      showToast('Agendamento aprovado!','success');
      await loadSchedules();
    } catch(err){showModal('Erro',err.message,'error');}
  }

  function openRejectModal(id,name,title) {
    rejectId=id;
    document.getElementById('reject-sub').textContent=`Agendamento de ${name}: "${title}". O técnico será notificado com o motivo.`;
    document.getElementById('reject-reason').value='';
    document.getElementById('reject-reason').style.borderColor='';
    document.getElementById('reject-overlay').classList.add('active');
    setTimeout(()=>document.getElementById('reject-reason').focus(),100);
  }

  function closeRejectModal(){document.getElementById('reject-overlay').classList.remove('active');rejectId=null;}

  document.getElementById('btn-reject-confirm').addEventListener('click', async()=>{
    const reason=document.getElementById('reject-reason').value.trim();
    if(!reason){
      document.getElementById('reject-reason').style.borderColor='var(--danger)';
      document.getElementById('reject-reason').placeholder='O motivo é obrigatório.';
      return;
    }
    const btn=document.getElementById('btn-reject-confirm'),overlay=document.getElementById('loading-overlay');
    btn.disabled=true; overlay.classList.add('active');
    try {
      await apiFetch(`/schedules/${rejectId}/reject`,{method:'PATCH',body:JSON.stringify({reason})});
      closeRejectModal();
      showToast('Agendamento recusado. Técnico notificado.','warning');
      await loadSchedules();
    } catch(err){showModal('Erro',err.message,'error');}
    finally{btn.disabled=false;overlay.classList.remove('active');}
  });

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); activeFilter=btn.dataset.filter; renderSchedules();
    });
  });
  document.getElementById('sched-search').addEventListener('input',e=>renderSchedules(e.target.value.toLowerCase().trim()));

  loadSchedules();
