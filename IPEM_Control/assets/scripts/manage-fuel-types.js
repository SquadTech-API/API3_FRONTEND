if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  let allFuels = [];
  let editingId = null;

  async function loadFuels() {
    try {
      const data = await apiFetch('/fuel-types');
      allFuels = Array.isArray(data)?data:(data.content??[]);
      renderGrid();
    } catch(err) {
      document.getElementById('fuel-grid').innerHTML = `<div style="color:var(--danger);">${err.message}</div>`;
    }
  }

  function renderGrid() {
    const grid = document.getElementById('fuel-grid');
    if (!allFuels.length) { grid.innerHTML = '<div style="color:var(--muted);padding:20px 0;grid-column:1/-1;">Nenhum tipo de combustível cadastrado.</div>'; return; }
    grid.innerHTML = '';
    allFuels.forEach((f, i) => {
      const active = f.active!==false;
      const card = document.createElement('div');
      card.className = `fuel-card${active?'':' inactive'}`;
      card.style.animationDelay = `${i*.04}s`;
      card.innerHTML = `
        <div class="fuel-abbr">${f.abbreviation??'?'}</div>
        <div class="fuel-name">${f.name??'—'}</div>
        <div class="fuel-category">${f.category??'—'}</div>
        <div class="fuel-price-row">
          <span class="fuel-price-lbl">Preço/L</span>
          <span class="fuel-price-val">${f.pricePerLiter!=null?formatCurrency(f.pricePerLiter):'—'}</span>
        </div>
        <div class="fuel-actions">
          <span class="fuel-status ${active?'active':'inactive'}">${active?'Ativo':'Inativo'}</span>
          <button class="fuel-edit-btn" onclick="openModal(${f.id})" type="button">✏ Editar</button>
        </div>`;
      grid.appendChild(card);
    });
  }

  function openModal(id=null) {
    editingId=id;
    document.getElementById('modal-title-text').textContent = id?'Editar combustível':'Novo combustível';
    document.getElementById('modal-fuel-id').value = id??'';
    if (id) {
      const f = allFuels.find(x=>x.id===id);
      if (!f) return;
      document.getElementById('modal-name').value     = f.name??'';
      document.getElementById('modal-abbr').value     = f.abbreviation??'';
      document.getElementById('modal-category').value = f.category??'';
      document.getElementById('modal-price').value    = f.pricePerLiter??'';
      document.getElementById('modal-active').checked = f.active!==false;
    } else {
      document.getElementById('modal-name').value     = '';
      document.getElementById('modal-abbr').value     = '';
      document.getElementById('modal-category').value = '';
      document.getElementById('modal-price').value    = '';
      document.getElementById('modal-active').checked = true;
    }
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('modal-name').focus();
  }

  function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); editingId=null; }

  document.getElementById('modal-save-btn').addEventListener('click', async () => {
    const name  = document.getElementById('modal-name').value.trim();
    const abbr  = document.getElementById('modal-abbr').value.trim().toUpperCase();
    const cat   = document.getElementById('modal-category').value||null;
    const price = parseFloat(document.getElementById('modal-price').value)||null;
    const active= document.getElementById('modal-active').checked;
    if (!name||!abbr) { showToast('Nome e sigla são obrigatórios.','error'); return; }
    const payload = {name,abbreviation:abbr,category:cat,pricePerLiter:price,active};
    const btn=document.getElementById('modal-save-btn'),overlay=document.getElementById('loading-overlay');
    btn.disabled=true; overlay.classList.add('active');
    try {
      if (editingId) await apiFetch(`/fuel-types/${editingId}`,{method:'PUT',body:JSON.stringify(payload)});
      else await apiFetch('/fuel-types',{method:'POST',body:JSON.stringify(payload)});
      closeModal(); showToast(`Combustível "${name}" ${editingId?'atualizado':'criado'}!`,'success');
      await loadFuels();
    } catch(err) { showModal('Erro',err.message,'error'); }
    finally { btn.disabled=false; overlay.classList.remove('active'); }
  });

  loadFuels();
