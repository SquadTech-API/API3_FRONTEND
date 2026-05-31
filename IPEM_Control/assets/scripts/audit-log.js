if (!requireAdmin()) {}
  initMenu();
  const user=getUser();
  if (user) {
    const initials=(user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let currentPage=0, totalPages=0, pageSize=20;
  let filters={registration:'',entity:'',action:'',from:'',to:''};

  async function loadLogs(page=0) {
    const tbody=document.getElementById('log-body');
    tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">Carregando...</td></tr>';
    try {
      const params=new URLSearchParams({page,size:pageSize,...Object.fromEntries(Object.entries(filters).filter(([,v])=>v))});
      const data=await apiFetch(`/audit-logs?${params}`);
      const list=Array.isArray(data)?data:(data.content??[]);
      totalPages=data.totalPages??1;
      currentPage=page;

      document.getElementById('btn-prev').disabled = page===0;
      document.getElementById('btn-next').disabled = page>=totalPages-1;
      document.getElementById('page-info').textContent = `Página ${page+1} de ${totalPages}`;

      if(!list.length){
        tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">Nenhum registro encontrado.</td></tr>';
        return;
      }

      tbody.innerHTML=list.map(l=>`
        <tr>
          <td style="white-space:nowrap;color:var(--muted);">${formatDateTime(l.createdAt)}</td>
          <td class="log-user">${l.userName??'—'}<br/><span style="font-size:10px;color:var(--muted);">Mat. ${l.registration??'—'}</span></td>
          <td><span class="action-badge ${l.action??''}">${l.action??'—'}</span></td>
          <td><span class="log-entity">${l.entity??'—'}</span></td>
          <td style="color:var(--muted);">${l.entityId??'—'}</td>
          <td class="log-desc">${l.description??'—'}</td>
        </tr>`).join('');
    } catch(err){
      tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--danger);">${err.message}</td></tr>`;
    }
  }

  document.getElementById('btn-apply-filter').addEventListener('click',()=>{
    filters={
      registration: document.getElementById('filter-registration').value.trim(),
      entity:       document.getElementById('filter-entity').value,
      action:       document.getElementById('filter-action').value,
      from:         document.getElementById('filter-from').value,
      to:           document.getElementById('filter-to').value,
    };
    loadLogs(0);
  });

  document.getElementById('btn-clear-filter').addEventListener('click',()=>{
    document.getElementById('filter-registration').value='';
    document.getElementById('filter-entity').value='';
    document.getElementById('filter-action').value='';
    document.getElementById('filter-from').value='';
    document.getElementById('filter-to').value='';
    filters={registration:'',entity:'',action:'',from:'',to:''};
    loadLogs(0);
  });

  document.getElementById('btn-prev').addEventListener('click',()=>loadLogs(currentPage-1));
  document.getElementById('btn-next').addEventListener('click',()=>loadLogs(currentPage+1));

  loadLogs();
