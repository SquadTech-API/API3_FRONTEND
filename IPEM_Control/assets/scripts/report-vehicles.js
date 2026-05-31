if (!requireAdmin()) {}
  initMenu();
  const user=getUser();
  if (user) {
    const initials=(user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  /* Mês padrão = mês atual */
  const now = new Date();
  document.getElementById('filter-month').value =
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  let reportData = [];
  let kmChart=null, pieChart=null;

  /* ── Carregar relatório ── */
  async function loadReport() {
    const month  = document.getElementById('filter-month').value;
    const prefix = document.getElementById('filter-prefix').value.trim();
    const status = document.getElementById('filter-status').value;
    const overlay= document.getElementById('loading-overlay');
    overlay.classList.add('active');

    const [year, mon] = month ? month.split('-') : [now.getFullYear(), now.getMonth()+1];
    document.getElementById('report-period').textContent =
      `Período: ${new Date(year, parseInt(mon)-1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`;

    try {
      const params = new URLSearchParams({ year, month:mon, ...(prefix?{prefix}:{}), ...(status?{status}:{}) });
      const data   = await apiFetch(`/reports/vehicles?${params}`);
      reportData   = Array.isArray(data) ? data : (data.content ?? []);
      renderMetrics(reportData);
      renderCharts(reportData);
      renderTable(reportData);
    } catch(err) {
      document.getElementById('report-tbody').innerHTML =
        `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--danger);">${err.message}</td></tr>`;
    } finally { overlay.classList.remove('active'); }
  }

  function renderMetrics(data) {
    const totalSaidas = data.reduce((s,v)=>s+(v.totalDepartures??0), 0);
    const totalKm     = data.reduce((s,v)=>s+(v.totalMileage??0), 0);
    const totalCusto  = data.reduce((s,v)=>s+(v.totalFuelingCost??0), 0);
    document.getElementById('m-total').textContent  = data.length;
    document.getElementById('m-saidas').textContent = totalSaidas;
    document.getElementById('m-km').textContent     = totalKm.toLocaleString('pt-BR')+' km';
    document.getElementById('m-custo').textContent  = formatCurrency(totalCusto);
  }

  function renderCharts(data) {
    const sorted = [...data].sort((a,b)=>(b.totalMileage??0)-(a.totalMileage??0)).slice(0,10);

    if (kmChart) kmChart.destroy();
    kmChart = new Chart(document.getElementById('chart-km').getContext('2d'), {
      type: 'bar',
      data: {
        labels: sorted.map(v=>v.prefix??'—'),
        datasets: [{
          label: 'KM rodados',
          data:  sorted.map(v=>v.totalMileage??0),
          backgroundColor: '#223A8E',
          borderRadius: 5,
        }],
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ y:{ beginAtZero:true, grid:{color:'#f0f2f8'} }, x:{ grid:{display:false} } } },
    });

    const top5 = [...data].sort((a,b)=>(b.totalDepartures??0)-(a.totalDepartures??0)).slice(0,5);
    const others = data.length > 5 ? data.slice(5).reduce((s,v)=>s+(v.totalDepartures??0), 0) : 0;
    const pieLabels = top5.map(v=>v.prefix??'—'); if(others>0) pieLabels.push('Outras');
    const pieData   = top5.map(v=>v.totalDepartures??0); if(others>0) pieData.push(others);
    const colors = ['#0E2365','#223A8E','#3b82f6','#60a5fa','#93c5fd','#cbd5e1'];

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById('chart-pie').getContext('2d'), {
      type: 'doughnut',
      data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: colors, borderWidth: 2, borderColor:'#fff' }] },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom', labels:{ font:{size:11}, boxWidth:12 } } } },
    });
  }

  function renderTable(data, q='') {
    const filtered = q ? data.filter(v=>(v.prefix??'').toLowerCase().includes(q.toLowerCase())) : data;
    const sorted   = [...filtered].sort((a,b)=>(b.totalMileage??0)-(a.totalMileage??0));
    const tbody    = document.getElementById('report-tbody');
    if (!sorted.length) { tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted);">Nenhuma viatura encontrada.</td></tr>'; return; }
    const rankClass = i => i===0?'gold':i===1?'silver':i===2?'bronze':'other';
    tbody.innerHTML = sorted.map((v,i) => `
      <tr>
        <td><span class="rank-badge ${rankClass(i)}">${i+1}</span></td>
        <td class="prefix-cell">${v.prefix??'—'}</td>
        <td style="color:var(--muted);">${v.model??'—'}</td>
        <td><strong>${v.totalDepartures??0}</strong></td>
        <td><strong>${formatKm(v.totalMileage??0)}</strong></td>
        <td>${v.totalFuelings??0}</td>
        <td>${formatCurrency(v.totalFuelingCost??0)}</td>
        <td>${v.totalOilChanges??0}</td>
        <td>
          <button class="sgi-badge ${v.lastDepartureSgiTranscribed?'done':''}"
            onclick="toggleSgi(${v.vehicleId})" type="button">
            ${v.lastDepartureSgiTranscribed?'✓ Feito':'Marcar'}
          </button>
        </td>
      </tr>`).join('');
  }

  async function toggleSgi(vehicleId) {
    try {
      await apiFetch(`/vehicles/${vehicleId}/mark-transcribed`, {method:'PATCH'});
      showToast('Marcado como transcrito ao SGI!','success');
      await loadReport();
    } catch(err){ showToast(err.message,'error'); }
  }

  /* ── Exportações ── */
  function exportCSV() {
    if (!reportData.length) { showToast('Sem dados para exportar.','warning'); return; }
    const headers = ['Viatura','Modelo','Saídas','KM Rodados','Abastecimentos','Custo','Trocas de Óleo'];
    const rows    = reportData.map(v=>[v.prefix,v.model,v.totalDepartures,v.totalMileage,v.totalFuelings,v.totalFuelingCost,v.totalOilChanges]);
    const csv     = [headers, ...rows].map(r=>r.join(';')).join('\n');
    const blob    = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const a       = Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`relatorio-viaturas-${document.getElementById('filter-month').value}.csv`});
    a.click();
  }

  function exportExcel() {
    exportCSV(); /* fallback: gera CSV; integrar SheetJS se necessário */
    showToast('Arquivo gerado. Para Excel nativo, instale a lib SheetJS.','warning');
  }

  document.getElementById('btn-apply').addEventListener('click', loadReport);
  document.getElementById('search-table').addEventListener('input', e=>renderTable(reportData, e.target.value));

  loadReport();
