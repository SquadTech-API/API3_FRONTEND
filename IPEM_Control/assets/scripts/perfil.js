// ═══════════════════════════════════════════════════════════════
//  perfil.js — Tela de Perfil do Usuário
//  - Exibe dados da sessão
//  - Alteração de senha (conecta ao backend na próxima sprint)
//  - Logout funcional
// ═══════════════════════════════════════════════════════════════

if (!exigirLogin()) { /* redireciona */ }

// ── PREENCHER DADOS ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  preencherPerfil();
});

function preencherPerfil() {
  const u = getUsuario();
  if (!u) return;

  const nome  = u.nomeCompleto || u.nome || '—';
  const cargo = u.cargo || '—';
  const tipo  = u.tipoUsuario || 'tecnico';
  const hab   = u.tipoHabilitacao
    ? `CNH ${u.tipoHabilitacao}` : 'Não informada';

  // Avatar com iniciais
  const iniciais = nome.split(' ').slice(0,2).map(p => p[0]?.toUpperCase() || '').join('');
  const avatarEl = document.getElementById('perfilAvatar');
  if (avatarEl) avatarEl.textContent = iniciais || '?';

  // Dados header
  setText('perfilNome',  nome);
  setText('perfilCargo', cargo);

  const tipoEl = document.getElementById('perfilTipo');
  if (tipoEl) {
    tipoEl.textContent = tipo === 'adm' ? 'ADMINISTRADOR' : 'TÉCNICO';
    tipoEl.className   = `perfil-tipo ${tipo}`;
  }

  // Informações
  setText('infoMatricula',  u.matricula || '—');
  setText('infoEmail',      u.email     || '—');
  setText('infoHabilitacao', hab);
  setText('infoTipoAcesso', tipo === 'adm' ? 'Administrador' : 'Técnico');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── ALTERAR SENHA ─────────────────────────────────────────────────
async function alterarSenha() {
  const senhaAtual     = document.getElementById('senhaAtual').value;
  const novaSenha      = document.getElementById('novaSenha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  const u = getUsuario();

  // Validações
  const erros = [];
  if (!senhaAtual)         erros.push('Informe a senha atual.');
  if (!novaSenha)          erros.push('Informe a nova senha.');
  if (novaSenha.length < 6 && novaSenha) erros.push('A nova senha deve ter ao menos 6 caracteres.');
  if (novaSenha !== confirmarSenha) erros.push('A confirmação não confere com a nova senha.');
  if (novaSenha === senhaAtual)     erros.push('A nova senha deve ser diferente da atual.');

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e => `• ${e}`).join('<br>'), 'warning');
    return;
  }

  const btnAlt  = document.getElementById('btnAlterarSenha');
  const overlay = document.getElementById('loadingOverlay');
  btnAlt.disabled = true;
  overlay.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 700));
      // No mock, aceita qualquer senha atual
      showModal('Senha alterada!',
        'Sua senha foi alterada com sucesso. Use a nova senha no próximo acesso.',
        'success', () => {
          document.getElementById('senhaAtual').value     = '';
          document.getElementById('novaSenha').value      = '';
          document.getElementById('confirmarSenha').value = '';
        });
    } else {
      await apiFetch('/usuarios/atualizar-senha', {
        method: 'POST',
        body: JSON.stringify({
          email:      u.email,
          senhaAtual,
          novaSenha,
        }),
      });
      showModal('Senha alterada!',
        'Sua senha foi alterada com sucesso.',
        'success', () => {
          document.getElementById('senhaAtual').value     = '';
          document.getElementById('novaSenha').value      = '';
          document.getElementById('confirmarSenha').value = '';
        });
    }
  } catch (err) {
    showModal('Erro ao alterar senha',
      err.message || 'Verifique a senha atual e tente novamente.',
      'error');
  } finally {
    btnAlt.disabled = false;
    overlay.classList.remove('active');
  }
}

// ── CONFIRMAR LOGOUT ──────────────────────────────────────────────
function confirmarLogout() {
  showModal(
    'Sair do sistema',
    'Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.',
    'warning',
    () => logout()
  );

  // Adiciona botão "Cancelar" extra (sobrescreve o modal padrão)
  const overlay = document.getElementById('_ipem_modal');
  if (!overlay) return;

  const modal = overlay.querySelector('.ipem-modal');
  if (!modal) return;

  const btnOk = modal.querySelector('.ipem-modal-btn');
  if (btnOk) {
    btnOk.textContent = 'Sim, sair';
    btnOk.style.background = '#dc2626';

    const btnCancel = document.createElement('button');
    btnCancel.className   = 'ipem-modal-btn';
    btnCancel.textContent = 'Cancelar';
    btnCancel.style.cssText = 'background:#e8ecf5;color:#1a2d5a;margin-top:8px;';
    btnCancel.addEventListener('click', () => overlay.remove());

    btnOk.parentNode.insertBefore(btnCancel, btnOk.nextSibling);
  }
}
