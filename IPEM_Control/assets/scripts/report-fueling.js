if (!requireAdmin()) {}
  initMenu();
  const user=getUser();
  if (user) {
    const initials=(user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  const now=new Date();
  document.getElementById('filter-month').value =
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  let reportData=[]; let monthlyChart=null; let pieChart=null; let vehicleChart=null;

  async function init() {
    try {
      const fuels=await apiFetch('/fuel-types');
      const list=Array.isArray(fuels)?fuels:(fuels.content??[]);
      const sel=document.getElementById('filter-fuel');
      sel.innerHTML='<option value="">Todos</option>'+list.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
    } catch {}
    loadReport();
  }

  async function loadReport() {
    const month=document.getElementById('filter-month').value;
    const prefix=document.getElementById('filter-prefix').value.trim();
    const fuelId=document.getElementById('filter-fuel').value;
    const overlay=document.getElementById('loading-overlay');
    overlay.classList.add('active');
    const [year,mon]=month?month.split('-'):[now.getFullYear(),now.getMonth()+1];
    document.getElementById('report-period').textContent =
      `Período: ${new Date(year,parseInt(mon)-1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`;
    try {
      const params=new URLSearchParams({year,month:mon,...(prefix?{prefix}:{}),...(fuelId?{fuelTypeId:fuelId}:{})});
      const data=await apiFetch(`/reports/fueling?${params}`);
      reportData=Array.isArray(data)?data:(data.content??[]);
      const summary=data.summary??{};
      renderMetrics(summary,reportData);
      renderFuelTypeCards(summary.byFuelType??[]);
      renderCharts(summary,reportData);
      renderTable(reportData);
    } catch(err) {
      document.getElementById('report-tbody').innerHTML=`<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--danger);">${err.message}</td></tr>`;
    } finally { overlay.classList.remove('active'); }
  }

  function renderMetrics(summary,data) {
    const totalLitros=data.reduce((s,f)=>s+(f.liters??0),0);
    const totalCusto =data.reduce((s,f)=>s+(f.totalValue??0),0);
    const avgPrice   =totalLitros>0?totalCusto/totalLitros:0;
    document.getElementById('m-abast').textContent  = data.length;
    document.getElementById('m-litros').textContent = totalLitros.toFixed(1)+' L';
    document.getElementById('m-custo').textContent  = formatCurrency(totalCusto);
    document.getElementById('m-media').textContent  = formatCurrency(avgPrice)+'/L';
  }

  function renderFuelTypeCards(byFuelType) {
    const container=document.getElementById('fuel-type-cards');
    if(!byFuelType.length){container.innerHTML='';return;}
    container.innerHTML=byFuelType.map(f=>`
      <div class="fuel-type-card">
        <div class="ftc-abbr">${f.abbreviation??'?'}</div>
        <div class="ftc-name">${f.name??'—'}</div>
        <div class="ftc-stats">
          <div class="ftc-row"><span>Abastecimentos</span><strong>${f.count??0}</strong></div>
          <div class="ftc-row"><span>Total (L)</span><strong>${(f.totalLiters??0).toFixed(1)}</strong></div>
          <div class="ftc-row"><span>Custo total</span><strong>${formatCurrency(f.totalCost??0)}</strong></div>
          <div class="ftc-row"><span>Preço médio/L</span><strong>${formatCurrency(f.avgPricePerLiter??0)}</strong></div>
        </div>
      </div>`).join('');
  }

  function renderCharts(summary,data) {
    /* Monthly cost — agrupado */
    const monthlyMap={};
    data.forEach(f=>{const d=new Date(f.fuelingDatetime);const k=`${d.getMonth()+1}/${d.getFullYear()}`;monthlyMap[k]=(monthlyMap[k]??0)+(f.totalValue??0);});
    const monthlyLabels=Object.keys(monthlyMap);
    const monthlyData=monthlyLabels.map(k=>monthlyMap[k]);
    if(monthlyChart) monthlyChart.destroy();
    monthlyChart=new Chart(document.getElementById('chart-monthly').getContext('2d'),{
      type:'line',data:{labels:monthlyLabels,datasets:[{label:'Custo (R$)',data:monthlyData,borderColor:'#0E2365',backgroundColor:'rgba(14,35,101,.08)',fill:true,tension:.35,pointRadius:4}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'}},x:{grid:{display:false}}}},
    });

    /* Pie por combustível */
    const byFuel=summary.byFuelType??[];
    const pieLabels=byFuel.map(f=>f.name??'—');
    const pieData=byFuel.map(f=>f.totalCost??0);
    const colors=['#0E2365','#223A8E','#3b82f6','#60a5fa','#93c5fd','#cbd5e1'];
    if(pieChart) pieChart.destroy();
    pieChart=new Chart(document.getElementById('chart-fuel-pie').getContext('2d'),{
      type:'doughnut',data:{labels:pieLabels,datasets:[{data:pieData,backgroundColor:colors,borderWidth:2,borderColor:'#fff'}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11},boxWidth:12}}}},
    });

    /* Top 10 viaturas */
    const byVehicle={};
    data.forEach(f=>{const k=f.vehiclePrefix??'—';byVehicle[k]=(byVehicle[k]??0)+(f.totalValue??0);});
    const sorted=Object.entries(byVehicle).sort((a,b)=>b[1]-a[1]).slice(0,10);
    if(vehicleChart) vehicleChart.destroy();
    vehicleChart=new Chart(document.getElementById('chart-vehicles').getContext('2d'),{
      type:'bar',data:{labels:sorted.map(e=>e[0]),datasets:[{label:'Custo (R$)',data:sorted.map(e=>e[1]),backgroundColor:'#223A8E',borderRadius:4}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'}},x:{grid:{display:false}}}},
    });
  }

  function renderTable(data,q='') {
    const filtered=q?data.filter(f=>(f.vehiclePrefix??'').toLowerCase().includes(q)||(f.conductorName??'').toLowerCase().includes(q)):data;
    const tbody=document.getElementById('report-tbody');
    if(!filtered.length){tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted);">Nenhum registro.</td></tr>';return;}
    tbody.innerHTML=filtered.map(f=>`
      <tr>
        <td style="white-space:nowrap;color:var(--muted);">${formatDate(f.fuelingDatetime)}</td>
        <td class="prefix-cell">${f.vehiclePrefix??'—'}</td>
        <td>${f.conductorName??'—'}</td>
        <td><span class="fuel-chip">${f.fuelTypeName??'—'}</span></td>
        <td>${(f.liters??0).toFixed(3)} L</td>
        <td>${f.pricePerLiter!=null?formatCurrency(f.pricePerLiter):'—'}</td>
        <td><strong>${formatCurrency(f.totalValue??0)}</strong></td>
        <td style="color:var(--muted);">${f.stationName??'—'}</td>
        <td>${f.invoiceNumber?`<span class="fuel-chip">${f.invoiceNumber}</span>`:'—'}</td>
      </tr>`).join('');
  }

  function exportCSV() {
    if(!reportData.length){showToast('Sem dados para exportar.','warning');return;}
    const headers=['Data','Viatura','Condutor','Combustível','Litros','Preço/L','Total','Posto','NF'];
    const rows=reportData.map(f=>[formatDate(f.fuelingDatetime),f.vehiclePrefix,f.conductorName,f.fuelTypeName,(f.liters??0).toFixed(3),f.pricePerLiter??'',f.totalValue??0,f.stationName??'',f.invoiceNumber??'']);
    const csv=[headers,...rows].map(r=>r.join(';')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`relatorio-abastecimentos-${document.getElementById('filter-month').value}.csv`}).click();
  }

  document.getElementById('btn-apply').addEventListener('click', loadReport);
  document.getElementById('search-table').addEventListener('input', e=>renderTable(reportData, e.target.value.toLowerCase().trim()));

  init();
