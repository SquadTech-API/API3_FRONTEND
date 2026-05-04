// ═══════════════════════════════════════════════════════════════
//  cadastrar-tipo-servico.js
//  - Só ADM
//  - Mock completo
// ═══════════════════════════════════════════════════════════════

if (!exigirAdm()) { /* redireciona */ }

// ── CONTADORES ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const nomeInput = document.getElementById('txf_nome_servico');
  const descInput = document.getElementById('txf_descricao_servico');
  const contNome  = document.getElementById('counter_nome');
  const contDesc  = document.getElementById('counter_descricao');

  function atualizarContador(input, contador, max) {
    const len = input.value.length;
    contador.textContent = `${len}/${max}`;
    contador.className   = 'field-counter';
    if (len >= max)            contador.classList.add('limit');
    else if (len >= max * 0.8) contador.classList.add('warning');
  }

  nomeInput?.addEventListener('input', () => atualizarContador(nomeInput, contNome, 100));
  descInput?.addEventListener('input', () => atualizarContador(descInput, contDesc, 500));
});

// ── SALVAR ────────────────────────────────────────────────────────
async function salvarTipoServico() {
  const nome = document.getElementById('txf_nome_servico').value.trim();
  const desc = document.getElementById('txf_descricao_servico').value.trim();

  const erros = [];
  if (!nome)        erros.push('O nome do serviço é obrigatório.');
  if (nome.length < 3 && nome) erros.push('O nome deve ter pelo menos 3 caracteres.');

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e=>`• ${e}`).join('<br>'), 'warning');
    document.getElementById('txf_nome_servico').focus();
    return;
  }

  const payload = { nomeServico: nome, descricao: desc || null };

  const btnSalvar = document.getElementById('Btn_salvar_servico');
  const overlay   = document.getElementById('loadingOverlay');
  btnSalvar.disabled = true;
  overlay.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 700));
    } else {
      await apiFetch('/tipo-servicos', { method:'POST', body:JSON.stringify(payload) });
    }

    showModal('Serviço cadastrado!',
      `O tipo de serviço "${nome}" foi cadastrado com sucesso.`, 'success',
      () => window.location.href = 'visualizar-tipo-servicos.html');

  } catch (err) {
    let msg = err.message || 'Erro ao cadastrar serviço.';
    if (msg.toLowerCase().includes('duplicate')||msg.toLowerCase().includes('nome_servico'))
      msg = `Já existe um serviço com o nome "${nome}". Escolha outro nome.`;
    showModal('Erro ao cadastrar', msg, 'error');
    document.getElementById('txf_nome_servico').focus();
  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}
