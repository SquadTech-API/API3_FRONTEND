// ═══════════════════════════════════════════════════════════════
//  cadastrar-usuario.js
//  - Só ADM acessa
//  - Mock completo
//  - Modal de erro/sucesso padronizado
// ═══════════════════════════════════════════════════════════════

if (!exigirAdm()) { /* redireciona */ }

initMenu();
ajustarMenuPorPerfil();

// Menu mobile
document.getElementById('btnMenu')?.addEventListener('click', () => {
  document.getElementById('navPrincipal')?.classList.toggle('open');
});

const form = document.getElementById('form_motorista');
if (!form) throw new Error('form_motorista não encontrado');

form.addEventListener('submit', async e => {
  e.preventDefault();

  const nome              = document.getElementById('txf_nome').value.trim();
  const dataNascimento    = document.getElementById('txf_data').value.trim();
  const cpf               = document.getElementById('txf_cpf').value.trim().replace(/\D/g,'');
  const email             = document.getElementById('txf_email').value.trim();
  const cargo             = document.getElementById('txf_cargo').value.trim();
  const tipoUsuario       = document.getElementById('ddl_tipo_usuario').value;
  const numeroHabilitacao = document.getElementById('txf_registro').value.trim();
  const tipoHabilitacao   = document.getElementById('ddl_carteira').value;
  const senha             = document.getElementById('pwd_senha').value;
  const confirmaSenha     = document.getElementById('pwd_conf_senha').value;

  // Validações
  const erros = [];
  if (!nome||!dataNascimento||!cpf||!email||!senha||!confirmaSenha)
    erros.push('Preencha todos os campos obrigatórios: nome, nascimento, CPF, e-mail e senha.');
  if (cpf.length !== 11)     erros.push('CPF inválido. Informe os 11 dígitos sem pontos ou traços.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('E-mail inválido.');
  if (senha.length < 6)      erros.push('A senha deve ter pelo menos 6 caracteres.');
  if (senha !== confirmaSenha) erros.push('As senhas não coincidem.');

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e=>`• ${e}`).join('<br>'), 'warning');
    return;
  }

  const payload = {
    nome, dataNascimento, cpf, email,
    cargo: cargo || null,
    tipoUsuario,
    numeroHabilitacao: numeroHabilitacao || null,
    tipoHabilitacao:   tipoHabilitacao   || null,
    senha,
    colaboradorAtivo: true,
  };

  const btnSalvar = form.querySelector('.btn-cad-salvar');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 700));
      showModal('Usuário cadastrado!',
        `O usuário "${nome}" foi cadastrado com sucesso.`, 'success',
        () => form.reset());
    } else {
      await apiFetch('/usuarios', { method:'POST', body: JSON.stringify(payload) });
      showModal('Usuário cadastrado!',
        `O usuário "${nome}" foi cadastrado com sucesso.`, 'success',
        () => form.reset());
    }
  } catch (err) {
    let msg = err.message || 'Erro ao cadastrar usuário.';
    if (msg.toLowerCase().includes('cpf'))        msg = 'CPF já cadastrado no sistema.';
    else if (msg.toLowerCase().includes('email')) msg = 'E-mail já cadastrado no sistema.';
    else if (msg.toLowerCase().includes('habilitac')) msg = 'Número de habilitação já cadastrado.';
    showModal('Erro ao cadastrar', msg, 'error');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar';
  }
});
