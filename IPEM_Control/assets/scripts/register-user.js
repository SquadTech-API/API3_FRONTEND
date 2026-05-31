if (!requireAdmin()) {}
  initMenu();
  const user = getUser();
  if (user) {
    const initials = (user.fullName??user.name??'').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('');
    document.getElementById('header-avatar').textContent    = initials||'AD';
    document.getElementById('header-user-name').textContent = user.fullName??user.name??'';
  }

  /* CPF mask */
  document.getElementById('input-cpf').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,11);
    if (v.length>9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4');
    else if (v.length>6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/,'$1.$2.$3');
    else if (v.length>3) v = v.replace(/(\d{3})(\d{1,3})/,'$1.$2');
    e.target.value = v;
  });

  document.getElementById('btn-save').addEventListener('click', async () => {
    const name     = document.getElementById('input-name').value.trim();
    const birth    = document.getElementById('input-birth').value;
    const cpf      = document.getElementById('input-cpf').value.replace(/\D/g,'');
    const email    = document.getElementById('input-email').value.trim();
    const role     = document.getElementById('input-role').value.trim()||null;
    const userType = document.getElementById('select-user-type').value;
    const license  = document.getElementById('select-license').value||null;
    const licNum   = document.getElementById('input-license-number').value.trim()||null;
    const password = document.getElementById('input-password').value;
    const confirm  = document.getElementById('input-confirm-password').value;

    const errors = [];
    if (!name)                          errors.push('Nome completo é obrigatório.');
    if (!birth)                         errors.push('Data de nascimento é obrigatória.');
    if (cpf.length!==11)               errors.push('CPF inválido. Informe os 11 dígitos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('E-mail inválido.');
    if (!password)                      errors.push('Senha é obrigatória.');
    if (password.length<6&&password)    errors.push('A senha deve ter pelo menos 6 caracteres.');
    if (password!==confirm)             errors.push('As senhas não coincidem.');
    if (errors.length) { showModal('Dados inválidos',errors.map(e=>`• ${e}`).join('<br/>'),'warning'); return; }

    const payload = { name, birthDate:birth, cpf, email, role, userType, licenseType:license,
      driverLicenseNumber:licNum, password, activeEmployee:true };

    const btn=document.getElementById('btn-save'), overlay=document.getElementById('loading-overlay');
    btn.disabled=true; overlay.classList.add('active');
    try {
      await apiFetch('/users',{method:'POST',body:JSON.stringify(payload)});
      showModal('Usuário cadastrado!',`O usuário "${name}" foi cadastrado com sucesso.`,'success',
        ()=>window.location.href='./manage-users.html');
    } catch(err) {
      let msg=err.message;
      if (msg.toLowerCase().includes('cpf'))    msg='CPF já cadastrado no sistema.';
      if (msg.toLowerCase().includes('email'))  msg='E-mail já cadastrado no sistema.';
      showModal('Erro ao cadastrar',msg,'error');
    } finally { btn.disabled=false; overlay.classList.remove('active'); }
  });
