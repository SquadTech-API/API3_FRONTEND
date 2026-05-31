if (!requireLogin()) { /* redireciona */ }

  /* ── Preenche dados da sessão ── */
  document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user) return;

    const fullName = user.fullName ?? user.name ?? '—';
    const initials = fullName.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
    const admin    = user.userType === 'admin';

    document.getElementById('avatar-initials').textContent = initials || '?';
    document.getElementById('profile-name').textContent    = fullName;
    document.getElementById('profile-role').textContent    = user.role ?? '—';

    const badge = document.getElementById('profile-badge');
    badge.textContent = admin ? 'ADMINISTRADOR' : 'TÉCNICO';
    if (admin) badge.classList.add('admin');

    document.getElementById('info-registration').textContent = user.registration ?? '—';
    document.getElementById('info-email').textContent        = user.email ?? '—';
    document.getElementById('info-license').textContent      = user.licenseType ? `CNH ${user.licenseType}` : 'Não informada';
    document.getElementById('info-role').textContent         = user.role ?? '—';
    document.getElementById('info-user-type').textContent    = admin ? 'Administrador' : 'Técnico';
  });

  /* ── Alterar senha ── */
  document.getElementById('btn-save-pwd').addEventListener('click', async () => {
    const current  = document.getElementById('pwd-current').value;
    const newPwd   = document.getElementById('pwd-new').value;
    const confirm  = document.getElementById('pwd-confirm').value;
    const user     = getUser();

    const errors = [];
    if (!current)                 errors.push('Informe a senha atual.');
    if (!newPwd)                  errors.push('Informe a nova senha.');
    if (newPwd.length < 6 && newPwd) errors.push('A nova senha deve ter pelo menos 6 caracteres.');
    if (newPwd !== confirm)       errors.push('A confirmação não confere com a nova senha.');
    if (newPwd === current)       errors.push('A nova senha deve ser diferente da atual.');

    if (errors.length) {
      showModal('Dados inválidos', errors.map(e => `• ${e}`).join('<br/>'), 'warning');
      return;
    }

    const btn     = document.getElementById('btn-save-pwd');
    const overlay = document.getElementById('loading-overlay');
    btn.disabled  = true;
    overlay.classList.add('active');

    try {
      await apiFetch('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          email:           user.email,
          currentPassword: current,
          newPassword:     newPwd,
        }),
      });

      showModal('Senha alterada!', 'Sua senha foi alterada com sucesso.', 'success', () => {
        document.getElementById('pwd-current').value = '';
        document.getElementById('pwd-new').value     = '';
        document.getElementById('pwd-confirm').value = '';
      });
    } catch (err) {
      showModal('Erro ao alterar senha', err.message ?? 'Verifique a senha atual e tente novamente.', 'error');
    } finally {
      btn.disabled = false;
      overlay.classList.remove('active');
    }
  });

  /* ── Logout ── */
  document.getElementById('btn-logout').addEventListener('click', () => {
    showModal(
      'Sair do sistema',
      'Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.',
      'warning',
      () => logout()
    );

    /* Adiciona botão cancelar ao modal */
    setTimeout(() => {
      const overlay = document.getElementById('_ipem-modal');
      if (!overlay) return;
      const btnOk = overlay.querySelector('.ipem-modal-btn');
      if (!btnOk) return;
      btnOk.textContent = 'Sim, sair';
      btnOk.style.background = '#dc2626';
      const btnCancel = document.createElement('button');
      btnCancel.className   = 'ipem-modal-btn';
      btnCancel.textContent = 'Cancelar';
      btnCancel.style.cssText = 'background:#e8ecf5;color:#1a2d5a;margin-top:8px;';
      btnCancel.addEventListener('click', () => overlay.remove());
      btnOk.parentNode.insertBefore(btnCancel, btnOk.nextSibling);
    }, 50);
  });
