// ═══════════════════════════════════════════════════════════════
//  visualizar-usuario.js — Gerenciamento de Usuários
//  - Só ADM
//  - Mock completo
//  - Edição e desativação via modal inline
// ═══════════════════════════════════════════════════════════════

if (!exigirAdm()) { /* redireciona */ }

initMenu();
document.getElementById('btnMenu')?.addEventListener('click', () => {
  document.getElementById('navPrincipal')?.classList.toggle('open');
});

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_USUARIOS_LIST = [
  { matricula:1, nome:'Administrador IPEM', cargo:'Diretor de TI', email:'admin@ipem.sp.gov.br', tipoUsuario:'adm', tipoHabilitacao:null, colaboradorAtivo:true, _emServico:false },
  { matricula:2, nome:'Carlos Eduardo Silva', cargo:'Técnico de Metrologia I', email:'carlos.silva@ipem.sp.gov.br', tipoUsuario:'tecnico', tipoHabilitacao:'B', colaboradorAtivo:true, _emServico:false },
  { matricula:3, nome:'Fernanda Lima Souza', cargo:'Técnica de Metrologia II', email:'fernanda.lima@ipem.sp.gov.br', tipoUsuario:'tecnico', tipoHabilitacao:'B', colaboradorAtivo:true, _emServico:false },
  { matricula:4, nome:'Roberto Alves Costa', cargo:'Fiscal de Medidas', email:'roberto.costa@ipem.sp.gov.br', tipoUsuario:'tecnico', tipoHabilitacao:'AB', colaboradorAtivo:false, _emServico:false },
  { matricula:5, nome:'Mariana Oliveira', cargo:'Técnica de Metrologia I', email:'mariana.oliveira@ipem.sp.gov.br', tipoUsuario:'tecnico', tipoHabilitacao:'B', colaboradorAtivo:true, _emServico:true },
  { matricula:6, nome:'Thiago Nascimento', cargo:'Motorista Oficial', email:'thiago.nascimento@ipem.sp.gov.br', tipoUsuario:'tecnico', tipoHabilitacao:'C', colaboradorAtivo:true, _emServico:false },
];

let todosUsuarios  = [];
let filtroAtual    = 'todos';
let textoBusca     = '';
let usuarioEditando = null;

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  iniciar();

  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      filtroAtual = btn.dataset.filtro;
      renderizarCards();
    });
  });

  document.getElementById('inputBusca')?.addEventListener('input', e => {
    textoBusca = e.target.value.toLowerCase();
    renderizarCards();
  });
});

async function iniciar() {
  const container = document.getElementById('lista_usuarios');
  container.innerHTML = '<div class="loading-msg">Carregando usuários...</div>';

  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 400));
    todosUsuarios = MOCK_USUARIOS_LIST;
  } else {
    try {
      const dados = await apiFetch('/usuarios');
      todosUsuarios = Array.isArray(dados) ? dados : dados.content || [];

      // Verifica saída ativa em paralelo
      await Promise.all(todosUsuarios.map(async u => {
        try {
          const resp = await fetch(
            `${API_BASE}/registro-saidas/ativo-usuario?matricula=${u.matricula}`,
            { headers: getAuthHeaders() }
          );
          u._emServico = resp.ok;
        } catch { u._emServico = false; }
      }));
    } catch (err) {
      container.innerHTML = `<div class="loading-msg">Erro ao carregar usuários.<br><small>${err.message}</small></div>`;
      return;
    }
  }

  renderizarCards();
}

function filtrar() {
  return todosUsuarios.filter(u => {
    if (filtroAtual === 'servico'  && !u._emServico)         return false;
    if (filtroAtual === 'inativos' && u.colaboradorAtivo)    return false;
    if (filtroAtual === 'todos'    && !u.colaboradorAtivo && !u._emServico) return true;
    if (textoBusca) {
      const n = (u.nome  || '').toLowerCase();
      const c = (u.cargo || '').toLowerCase();
      if (!n.includes(textoBusca) && !c.includes(textoBusca)) return false;
    }
    return true;
  });
}

function renderizarCards() {
  const container = document.getElementById('lista_usuarios');
  const filtrados = filtrar();
  if (!filtrados.length) {
    container.innerHTML = '<div class="loading-msg">Nenhum usuário encontrado.</div>';
    return;
  }

  container.innerHTML = '';
  filtrados.forEach(u => container.appendChild(criarCard(u)));
}

function criarCard(u) {
  const emServico = u._emServico;
  const ativo     = u.colaboradorAtivo !== false;

  const statusCls = emServico ? 'status-serv' : ativo ? 'status-ok' : 'status-inativo';
  const statusTxt = emServico ? '● Em serviço' : ativo ? '● Disponível' : '✕ Inativo';

  const card = document.createElement('div');
  card.className = `user-card${!ativo ? ' inativo' : ''}`;
  card.innerHTML = `
    <div class="user-card-topo"><h3>${u.nome || '—'}</h3></div>
    <div class="user-card-corpo">
      <p><strong>Matrícula:</strong> ${u.matricula}</p>
      <p><strong>Cargo:</strong> ${u.cargo || '—'}</p>
      <p><strong>Habilitação:</strong> ${u.tipoHabilitacao ? 'CNH '+u.tipoHabilitacao : '—'}</p>
      <p><strong>Tipo:</strong> ${u.tipoUsuario === 'adm' ? 'Administrador' : 'Técnico'}</p>
      <p class="user-status ${statusCls}">${statusTxt}</p>
    </div>
    <div class="user-card-actions">
      <button class="btn-editar-usr" onclick="abrirEditModal(${u.matricula})">✏ Editar</button>
      <button class="btn-toggle-usr ${!ativo?'ativar':''}"
        onclick="toggleAtivo(${u.matricula}, ${ativo})">
        ${ativo ? '🔒 Desativar' : '✓ Ativar'}
      </button>
    </div>
  `;
  return card;
}

// ── EDIÇÃO ────────────────────────────────────────────────────────
function abrirEditModal(matricula) {
  const u = todosUsuarios.find(x => x.matricula === matricula);
  if (!u) return;

  usuarioEditando = u;
  document.getElementById('edit_matricula').value = u.matricula;
  document.getElementById('edit_nome').value       = u.nome || '';
  document.getElementById('edit_email').value      = u.email || '';
  document.getElementById('edit_cargo').value      = u.cargo || '';
  document.getElementById('edit_tipo').value       = u.tipoUsuario || 'tecnico';
  document.getElementById('edit_habilitacao').value = u.tipoHabilitacao || '';

  document.getElementById('editModalOverlay').classList.add('active');
}

function fecharEditModal() {
  document.getElementById('editModalOverlay').classList.remove('active');
  usuarioEditando = null;
}

async function salvarEdicaoUsuario() {
  if (!usuarioEditando) return;

  const payload = {
    nome:             document.getElementById('edit_nome').value.trim(),
    cargo:            document.getElementById('edit_cargo').value.trim() || null,
    tipoUsuario:      document.getElementById('edit_tipo').value,
    tipoHabilitacao:  document.getElementById('edit_habilitacao').value || null,
  };

  if (!payload.nome) {
    showModal('Campo obrigatório', 'O nome não pode estar vazio.', 'warning');
    return;
  }

  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 500));
      const idx = todosUsuarios.findIndex(x => x.matricula === usuarioEditando.matricula);
      if (idx >= 0) Object.assign(todosUsuarios[idx], payload);
    } else {
      await apiFetch(`/usuarios/${usuarioEditando.matricula}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const idx = todosUsuarios.findIndex(x => x.matricula === usuarioEditando.matricula);
      if (idx >= 0) Object.assign(todosUsuarios[idx], payload);
    }

    fecharEditModal();
    renderizarCards();
    showToast('Usuário atualizado com sucesso!', 'success');

  } catch (err) {
    showModal('Erro ao editar', err.message || 'Não foi possível atualizar o usuário.', 'error');
  } finally {
    overlay.classList.remove('active');
  }
}

// ── ATIVAR/DESATIVAR ──────────────────────────────────────────────
async function toggleAtivo(matricula, ativoAtual) {
  const u = todosUsuarios.find(x => x.matricula === matricula);
  if (!u) return;

  const acao   = ativoAtual ? 'desativar' : 'ativar';
  const titulo = ativoAtual ? 'Desativar usuário' : 'Ativar usuário';
  const msg    = ativoAtual
    ? `Deseja desativar "${u.nome}"? O login será bloqueado mas o histórico será mantido.`
    : `Deseja ativar "${u.nome}"? O login será liberado novamente.`;

  showModal(titulo, msg, ativoAtual ? 'warning' : 'info', async () => {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    try {
      if (MOCK_MODE) {
        await new Promise(r => setTimeout(r, 500));
        const idx = todosUsuarios.findIndex(x => x.matricula === matricula);
        if (idx >= 0) todosUsuarios[idx].colaboradorAtivo = !ativoAtual;
      } else {
        await apiFetch(`/usuarios/${matricula}/${acao}`, { method:'PATCH' });
        const idx = todosUsuarios.findIndex(x => x.matricula === matricula);
        if (idx >= 0) todosUsuarios[idx].colaboradorAtivo = !ativoAtual;
      }
      renderizarCards();
      showToast(`Usuário ${ativoAtual ? 'desativado' : 'ativado'} com sucesso!`,
        ativoAtual ? 'warning' : 'success');
    } catch (err) {
      showModal('Erro', err.message || `Não foi possível ${acao} o usuário.`, 'error');
    } finally {
      overlay.classList.remove('active');
    }
  });

  // Adiciona botão cancelar
  setTimeout(() => {
    const overlay = document.getElementById('_ipem_modal');
    if (!overlay) return;
    const btnOk = overlay.querySelector('.ipem-modal-btn');
    if (btnOk) {
      const btnCancelNew = document.createElement('button');
      btnCancelNew.className = 'ipem-modal-btn';
      btnCancelNew.textContent = 'Cancelar';
      btnCancelNew.style.cssText = 'background:#e8ecf5;color:#1a2d5a;margin-top:8px;';
      btnCancelNew.addEventListener('click', () => overlay.remove());
      btnOk.parentNode.insertBefore(btnCancelNew, btnOk.nextSibling);
    }
  }, 50);
}
