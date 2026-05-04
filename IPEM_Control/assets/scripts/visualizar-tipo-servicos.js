// ═══════════════════════════════════════════════════════════════
//  visualizar-tipo-servicos.js
//  Atualizado para usar global.js:
//  - MOCK_MODE global (em vez de USAR_MOCK local)
//  - exigirAdm() em vez de verificarSessao() local
//  - showModal() / showToast() globais
//  - getAuthHeaders() / apiFetch() globais
//  - Endpoint /tipo-servicos correto (incluindo toggle e PUT)
// ═══════════════════════════════════════════════════════════════

// Proteção de rota — só ADM acessa
if (typeof exigirAdm === 'function') exigirAdm();
if (typeof initMenu === 'function') initMenu();
if (typeof ajustarMenuPorPerfil === 'function') ajustarMenuPorPerfil();

document.getElementById('btnMenu')?.addEventListener('click', () => {
  document.getElementById('navPrincipal')?.classList.toggle('open');
});

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_SERVICOS_TS = [
  { idTipoServico:1, nomeServico:'Fiscalização',          descricao:'Atividade de fiscalização em campo.',                           habilitado:true,  ehTrocaOleo:false },
  { idTipoServico:2, nomeServico:'Coleta de Amostras',    descricao:'Recolhimento de amostras para análise em laboratório.',          habilitado:true,  ehTrocaOleo:false },
  { idTipoServico:3, nomeServico:'Auditoria Técnica',     descricao:'Visita de auditoria a empresas e fornecedores.',                 habilitado:true,  ehTrocaOleo:false },
  { idTipoServico:4, nomeServico:'Transporte Administrativo', descricao:'Deslocamento para reuniões e treinamentos.',                  habilitado:false, ehTrocaOleo:false },
  { idTipoServico:5, nomeServico:'Vistoria Predial',      descricao:'Inspeção técnica de instalações e equipamentos.',               habilitado:true,  ehTrocaOleo:false },
  { idTipoServico:6, nomeServico:'Apoio Operacional',     descricao:'Suporte logístico a outras equipes em campo.',                   habilitado:true,  ehTrocaOleo:false },
  { idTipoServico:7, nomeServico:'Atendimento Externo',   descricao:null,                                                             habilitado:true,  ehTrocaOleo:false },
  { idTipoServico:8, nomeServico:'Troca de Óleo',         descricao:'Serviço de troca de óleo do veículo.',                          habilitado:true,  ehTrocaOleo:true  },
];

// ── ESTADO ────────────────────────────────────────────────────────
let todosServicos   = [];
let filtroAtual     = 'todos';
let buscaAtual      = '';
let servicoEditando = null;

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarServicos();
  initFiltros();
  initBusca();
  initModal();
});

// ── CARREGAR ──────────────────────────────────────────────────────
async function carregarServicos() {
  mostrarLoadingLista(true);
  try {
    if (typeof MOCK_MODE !== 'undefined' && MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400));
      todosServicos = MOCK_SERVICOS_TS;
    } else {
      const dados = await apiFetch('/tipo-servicos');
      todosServicos = Array.isArray(dados) ? dados : dados.content || [];
    }
    atualizarStatBar();
    renderizarLista();
  } catch (err) {
    if (typeof showModal === 'function')
      showModal('Erro ao carregar', err.message || 'Não foi possível carregar os tipos de serviço.', 'error');
  } finally {
    mostrarLoadingLista(false);
  }
}

// ── STATS ─────────────────────────────────────────────────────────
function atualizarStatBar() {
  const total    = todosServicos.length;
  const ativos   = todosServicos.filter(s => Boolean(s.habilitado)).length;
  const inativos = total - ativos;
  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-ativos').textContent  = ativos;
  document.getElementById('stat-inativos').textContent = inativos;
}

// ── FILTRO ────────────────────────────────────────────────────────
function filtrar() {
  return todosServicos.filter(s => {
    const hab = Boolean(s.habilitado);
    if (filtroAtual === 'ativos'   && !hab) return false;
    if (filtroAtual === 'inativos' &&  hab) return false;
    if (buscaAtual) {
      const nome = (s.nomeServico || s.nome_servico || '').toLowerCase();
      const desc = (s.descricao || '').toLowerCase();
      if (!nome.includes(buscaAtual) && !desc.includes(buscaAtual)) return false;
    }
    return true;
  });
}

// ── RENDER ────────────────────────────────────────────────────────
function renderizarLista() {
  const lista   = document.getElementById('lista_servicos');
  const empty   = document.getElementById('empty-state');
  const loading = document.getElementById('loading');
  if (!lista) return;

  // Remove cards antigos
  lista.querySelectorAll('.servico-card').forEach(c => c.remove());

  const filtrados = filtrar();
  empty.style.display = filtrados.length === 0 ? 'flex' : 'none';

  filtrados.forEach((s, i) => {
    const id         = s.idTipoServico || s.id_tipo_servico;
    const nome       = s.nomeServico   || s.nome_servico || '—';
    const desc       = s.descricao     || null;
    const hab        = Boolean(s.habilitado);
    const ehOleo     = Boolean(s.ehTrocaOleo || s.eh_troca_oleo);

    const card = document.createElement('div');
    card.className = `servico-card${hab ? '' : ' inativo'}`;
    card.style.animationDelay = `${i * 0.04}s`;

    card.innerHTML = `
      <div class="sc-main">
        <div class="sc-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <div class="sc-info">
          <div class="sc-nome">${nome} ${ehOleo ? '<span class="badge-oleo">Troca de óleo</span>' : ''}</div>
          <div class="sc-desc">${desc || '<em style="color:#aab4cc">Sem descrição</em>'}</div>
        </div>
        <div class="sc-actions">
          <span class="sc-status ${hab ? 'ativo' : 'inativo'}">${hab ? 'Ativo' : 'Inativo'}</span>
          <button class="sc-btn-edit" onclick="abrirModal(${id})" title="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    lista.appendChild(card);
  });
}

// ── MODAL ─────────────────────────────────────────────────────────
function initModal() {
  const nomeInput = document.getElementById('modal_nome_servico');
  const descInput = document.getElementById('modal_descricao_servico');
  const contNome  = document.getElementById('modal_counter_nome');
  const contDesc  = document.getElementById('modal_counter_desc');
  const toggle    = document.getElementById('modal_toggle_habilitado');
  const statusDesc = document.getElementById('modal_status_desc');

  nomeInput?.addEventListener('input', () => {
    const l = nomeInput.value.length;
    contNome.textContent = `${l}/100`;
    contNome.style.color = l >= 90 ? '#ef4444' : l >= 75 ? '#f59e0b' : '#8896b3';
  });
  descInput?.addEventListener('input', () => {
    const l = descInput.value.length;
    contDesc.textContent = `${l}/500`;
    contDesc.style.color = l >= 450 ? '#ef4444' : l >= 380 ? '#f59e0b' : '#8896b3';
  });
  toggle?.addEventListener('change', () => {
    statusDesc.textContent = toggle.checked
      ? 'Habilitado — aparece no registro de saída'
      : 'Desabilitado — não aparece no registro de saída';
  });
}

function abrirModal(id) {
  const s = todosServicos.find(x => (x.idTipoServico || x.id_tipo_servico) === id);
  if (!s) return;
  servicoEditando = s;

  document.getElementById('modal_id_servico').value          = id;
  document.getElementById('modal_nome_servico').value        = s.nomeServico || s.nome_servico || '';
  document.getElementById('modal_descricao_servico').value   = s.descricao || '';
  document.getElementById('modal_toggle_habilitado').checked = Boolean(s.habilitado);
  document.getElementById('modal_status_desc').textContent   = Boolean(s.habilitado)
    ? 'Habilitado — aparece no registro de saída'
    : 'Desabilitado — não aparece no registro de saída';
  document.getElementById('modal_counter_nome').textContent  = `${(s.nomeServico || '').length}/100`;
  document.getElementById('modal_counter_desc').textContent  = `${(s.descricao || '').length}/500`;

  document.getElementById('modal-edicao').classList.add('open');
  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('modal_nome_servico').focus();
}

function fecharModal() {
  document.getElementById('modal-edicao').classList.remove('open');
  document.getElementById('modal-backdrop').classList.remove('open');
  servicoEditando = null;
}

async function salvarEdicao() {
  const id   = parseInt(document.getElementById('modal_id_servico').value, 10);
  const nome = document.getElementById('modal_nome_servico').value.trim();
  const desc = document.getElementById('modal_descricao_servico').value.trim();
  const novoHabilitado = document.getElementById('modal_toggle_habilitado').checked;

  if (!nome) {
    if (typeof showToast === 'function') showToast('O nome do serviço é obrigatório.', 'error');
    return;
  }

  const btnSalvar    = document.getElementById('modal-btn-salvar');
  const modalLoading = document.getElementById('modal-loading');
  btnSalvar.disabled = true;
  modalLoading.classList.add('active');

  try {
    if (typeof MOCK_MODE !== 'undefined' && MOCK_MODE) {
      await new Promise(r => setTimeout(r, 600));
      const idx = todosServicos.findIndex(s => (s.idTipoServico || s.id_tipo_servico) === id);
      if (idx !== -1) Object.assign(todosServicos[idx], { nomeServico:nome, descricao:desc||null, habilitado:novoHabilitado });
    } else {
      // PUT nome + descrição
      await apiFetch(`/tipo-servicos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nomeServico:nome, descricao:desc||null }),
      });
      // PATCH toggle se o status mudou
      const statusAtual = Boolean(servicoEditando?.habilitado);
      if (statusAtual !== novoHabilitado) {
        await apiFetch(`/tipo-servicos/${id}/toggle`, { method:'PATCH' });
      }
      const idx = todosServicos.findIndex(s => (s.idTipoServico || s.id_tipo_servico) === id);
      if (idx !== -1) Object.assign(todosServicos[idx], { nomeServico:nome, descricao:desc||null, habilitado:novoHabilitado });
    }
    atualizarStatBar();
    if (typeof showToast === 'function') showToast(`Serviço "${nome}" atualizado com sucesso!`, 'success');
    fecharModal();
    renderizarLista();
  } catch (err) {
    const msg = err.message?.includes('Failed to fetch') ? 'Sem conexão com o servidor.' : (err.message || 'Erro inesperado.');
    if (typeof showToast === 'function') showToast(msg, 'error');
  } finally {
    btnSalvar.disabled = false;
    modalLoading.classList.remove('active');
  }
}

// ── FILTROS E BUSCA ───────────────────────────────────────────────
function initFiltros() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filtroAtual = chip.dataset.filtro;
      renderizarLista();
    });
  });
}

function initBusca() {
  const input = document.getElementById('busca_servico');
  if (!input) return;
  input.addEventListener('input', () => {
    buscaAtual = input.value.toLowerCase().trim();
    renderizarLista();
  });
}

function mostrarLoadingLista(show) {
  const el = document.getElementById('loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}
