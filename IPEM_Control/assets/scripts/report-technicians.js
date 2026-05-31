if (!requireAdmin()) {}
  initMenu();
  const user=getUser();
  if (user) {
    const initials=(user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  const now = new Date();
  document.getElementById('filter-month').value =
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  let reportData=[]; let tecChart=null; let selectedTec=null;

  async function loadReport() {
    const month = document.getElementById('filter-month').value;
    const name  = document.getElementById('filter-name').value.trim();
    const overlay=document.getElementById('loading-overlay');
    overlay.classList.add('active');
    const [year,mon] = month?month.split('-'):[now.getFullYear(),now.getMonth()+1];
    document.getElementById('report-period').textContent =
      `Período: ${new Date(year,parseInt(mon)-1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`;
    try {
      const params = new URLSearchParams({year,month:mon,...(name?{name}:{})});
      const data   = await apiFetch(`/reports/technicians?${params}`);
      reportData   = Array.isArray(data)?data:(data.content??[]);
      renderMetrics(reportData);
      renderChart(reportData);
      renderTecList(reportData);
      renderTable(reportData);
    } catch(err) {
      document.getElementById('report-tbody').innerHTML=`<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--danger);">${err.message}</td></tr>`;
    } finally { overlay.classList.remove('active'); }
  }

  function renderMetrics(data) {
    const totalSaidas = data.reduce((s,t)=>s+(t.totalDepartures??0),0);
    const totalKm     = data.reduce((s,t)=>s+(t.totalMileage??0),0);
    document.getElementById('m-tecnicos').textContent = data.length;
    document.getElementById('m-saidas').textContent   = totalSaidas;
    document.getElementById('m-km').textContent       = totalKm.toLocaleString('pt-BR')+' km';
    document.getElementById('m-media').textContent    = data.length?Math.round(totalKm/data.length).toLocaleString('pt-BR')+' km':'—';
  }

  function renderChart(data) {
    const sorted=[...data].sort((a,b)=>(b.totalDepartures??0)-(a.totalDepartures??0)).slice(0,10);
    if(tecChart) tecChart.destroy();
    tecChart=new Chart(document.getElementById('chart-tec').getContext('2d'),{
      type:'bar',
      data:{
        labels:sorted.map(t=>t.name?.split(' ')[0]??'—'),
        datasets:[
          {label:'Saídas',data:sorted.map(t=>t.totalDepartures??0),backgroundColor:'#0E2365',borderRadius:4},
          {label:'KM (÷10)',data:sorted.map(t=>Math.round((t.totalMileage??0)/10)),backgroundColor:'#60a5fa',borderRadius:4},
        ],
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:11},boxWidth:12}}},
        scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'}},x:{grid:{display:false}}}},
    });
  }

  function renderTecList(data) {
    const list=document.getElementById('tec-list');
    if(!data.length){list.innerHTML='<div style="padding:16px;color:var(--muted);">Nenhum técnico.</div>';return;}
    list.innerHTML='';
    [...data].sort((a,b)=>(b.totalDepartures??0)-(a.totalDepartures??0)).forEach(t=>{
      const el=document.createElement('div');
      el.className=`tec-item${selectedTec?.registration===t.registration?' selected':''}`;
      el.dataset.reg=t.registration;
      el.innerHTML=`<div class="tec-name">${t.name??'—'}</div><div class="tec-meta">${t.role??'—'} · Mat. ${t.registration}</div><div class="tec-km">${t.totalDepartures??0} saídas · ${formatKm(t.totalMileage??0)}</div>`;
      el.addEventListener('click',()=>selectTechnician(t));
      list.appendChild(el);
    });
  }

  async function selectTechnician(tec) {
    selectedTec=tec;
    document.querySelectorAll('.tec-item').forEach(el=>el.classList.toggle('selected',el.dataset.reg==tec.registration));
    const detail=document.getElementById('tec-detail');
    detail.innerHTML='<div class="panel-empty">Carregando...</div>';
    try {
      const month=document.getElementById('filter-month').value;
      const [year,mon]=month?month.split('-'):[now.getFullYear(),now.getMonth()+1];
      const deps=await apiFetch(`/departure-logs?registration=${tec.registration}&year=${year}&month=${mon}&limit=20`);
      const list=Array.isArray(deps)?deps:(deps.content??[]);
      detail.innerHTML=`
        <div class="tec-detail">
          <div class="tec-detail-header">
            <div class="tec-detail-name">${tec.name??'—'}</div>
            <div class="tec-detail-role">${tec.role??'—'} · Mat. ${tec.registration}</div>
          </div>
          <div class="tec-stats">
            <div class="tec-stat"><div class="tec-stat-val">${tec.totalDepartures??0}</div><div class="tec-stat-lbl">Saídas</div></div>
            <div class="tec-stat"><div class="tec-stat-val">${formatKm(tec.totalMileage??0)}</div><div class="tec-stat-lbl">KM total</div></div>
            <div class="tec-stat"><div class="tec-stat-val">${tec.totalFuelings??0}</div><div class="tec-stat-lbl">Abastec.</div></div>
            <div class="tec-stat"><div class="tec-stat-val">${tec.totalDepartures?Math.round((tec.totalMileage??0)/(tec.totalDepartures)):0} km</div><div class="tec-stat-lbl">Média/saída</div></div>
          </div>
          <div>
            ${list.length===0
              ? '<div class="panel-empty">Nenhuma saída no período.</div>'
              : list.map(d=>`
                <div class="dep-row">
                  <div class="dep-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/></svg></div>
                  <div class="dep-info">
                    <div class="dep-service">${d.vehiclePrefix??'—'} · ${d.serviceTypeName??'—'}</div>
                    <div class="dep-meta">${formatDateTime(d.departureDatetime)} · ${d.destination??'—'}</div>
                  </div>
                  <div class="dep-km">+${formatKm(d.drivenMileage??0)}</div>
                </div>`).join('')}
          </div>
        </div>`;
    } catch(err) {
      detail.innerHTML=`<div class="panel-empty" style="color:var(--danger);">${err.message}</div>`;
    }
  }

  function renderTable(data) {
    const sorted=[...data].sort((a,b)=>(b.totalDepartures??0)-(a.totalDepartures??0));
    const tbody=document.getElementById('report-tbody');
    if(!sorted.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Nenhum dado.</td></tr>';return;}
    tbody.innerHTML=sorted.map((t,i)=>`
      <tr>
        <td>${i+1}</td>
        <td><strong>${t.name??'—'}</strong><br/><span style="font-size:10px;color:var(--muted);">Mat. ${t.registration}</span></td>
        <td style="color:var(--muted);">${t.role??'—'}</td>
        <td><strong>${t.totalDepartures??0}</strong></td>
        <td><strong>${formatKm(t.totalMileage??0)}</strong></td>
        <td>${t.totalDepartures?formatKm(Math.round((t.totalMileage??0)/(t.totalDepartures))):'—'}</td>
        <td>${t.totalFuelings??0}</td>
      </tr>`).join('');
  }

  function exportCSV() {
    if(!reportData.length){showToast('Sem dados para exportar.','warning');return;}
    const headers=['Técnico','Matrícula','Cargo','Saídas','KM Total','Média KM/saída'];
    const rows=reportData.map(t=>[t.name,t.registration,t.role,t.totalDepartures,t.totalMileage,t.totalDepartures?Math.round((t.totalMileage??0)/(t.totalDepartures)):0]);
    const csv=[headers,...rows].map(r=>r.join(';')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`relatorio-tecnicos-${document.getElementById('filter-month').value}.csv`}).click();
  }

  document.getElementById('btn-apply').addEventListener('click', loadReport);
  loadReport();
