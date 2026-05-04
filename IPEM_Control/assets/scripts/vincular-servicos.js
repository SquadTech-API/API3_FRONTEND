// ═══════════════════════════════════════════════════════════════
//  vincular-servicos.js — Gerenciar veiculo_servico
//  - Só ADM acessa
//  - Lista veículos na coluna esquerda
//  - Ao selecionar veículo, carrega serviços habilitados (veiculo_servico)
//  - Permite marcar/desmarcar e salvar via POST /veiculo-servico/sincronizar/{id}
//  - MOCK_MODE completo
// ═══════════════════════════════════════════════════════════════

if (typeof exigirAdm === 'function') exigirAdm();
if (typeof initMenu === 'function') initMenu();
if (typeof ajustarMenuPorPerfil === 'function') ajustarMenuPorPerfil();

document.getElementById('btnMenu')?.addEventListener('click', () => {
  document.getElementById('navPrincipal')?.classList.toggle('open');
});

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_VEICULOS_VS = [
  { idVeiculo:1, modelo:'SPIN',    prefixo:'FJV-01', habilitacaoCategoria:'B', ativo:true  },
  { idVeiculo:2, modelo:'HB20',    prefixo:'FJV-02', habilitacaoCategoria:'B', ativo:true  },
  { idVeiculo:3, modelo:'HILUX',   prefixo:'FJV-03', habilitacaoCategoria:'B', ativo:true  },
  { idVeiculo:4, modelo:'MASTER',  prefixo:'FJV-04', habilitacaoCategoria:'D', ativo:true  },
  { idVeiculo:5, modelo:'ONIX',    prefixo:'FJV-05', habilitacaoCategoria:'B', ativo:true  },
  { idVeiculo:7, modelo:'RANGER',  prefixo:'FJV-07', habilitacaoCategoria:'B', ativo:true  },
  { idVeiculo:9, modelo:'TRACKER', prefixo:'FJV-09', habilitacaoCategoria:'B', ativo:true  },
  { idVeiculo:10,modelo:'PALIO',   prefixo:'FJV-10', habilitacaoCategoria:'B', ativo:false },
];

const MOCK_TODOS_SERVICOS = [
  { idTipoServico:1, nomeServico:'Troca de Óleo',          descricao:'Troca de óleo do veículo.',                  habilitado:true, ehTrocaOleo:true  },
  { idTipoServico:2, nomeServico:'Inspeção de Campo',      descricao:'Fiscalização em campo com equipe técnica.',  habilitado:true, ehTrocaOleo:false },
  { idTipoServico:3, nomeServico:'Entrega de Documentos',  descricao:'Entrega de documentos e notificações.',       habilitado:true, ehTrocaOleo:false },
  { idTipoServico:4, nomeServico:'Manutenção Veicular',    descricao:'Deslocamento para manutenção em oficina.',   habilitado:true, ehTrocaOleo:false },
  { idTipoServico:5, nomeServico:'Apoio Operacional',      descricao:'Suporte logístico a outras equipes.',        habilitado:true, ehTrocaOleo:false },
  { idTipoServico:6, nomeServico:'Capacitação Externa',    descricao:'Transporte para treinamentos externos.',     habilitado:true, ehTrocaOleo:false },
  { idTipoServico:7, nomeServico:'Coleta de Amostra',      descricao:'Coleta de amostras em campo.',               habilitado:true, ehTrocaOleo:false },
  { idTipoServico:8, nomeServico:'Fiscalização',           descricao:'Atividade de fiscalização regulatória.',     habilitado:true, ehTrocaOleo:false },
  { idTipoServico:9, nomeServico:'Transporte Administrativo', descricao:'Deslocamentos administrativos internos.', habilitado:false, ehTrocaOleo:false },
];

// Vínculos iniciais do mock (simula tabela veiculo_servico)
const MOCK_VINCULOS = {
  1: [1,2,3,5,8],
  2: [2,3,6,7],
  3: [1,2,5,7,8],
  4: [5,6],
  5: [1,2,3,4,8],
  7: [1,5,7,8],
  9: [1,2,3,4,5,8],
  10: [],
};

// ── ESTADO ────────────────────────────────────────────────────────
let todosVeiculos    = [];
let todosServicos    = [];
let veiculoAtivo     = null;       // veículo selecionado
let selecionadosSet  = new Set();  // IDs de serviços marcados
let selecionadosOrig = new Set();  // estado original para detectar mudanças
let todasMarcadas    = false;

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await carregarDados();
  initBusca();
});

async function carregarDados() {
  try {
    if (typeof MOCK_MODE !== 'undefined' && MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400));
      todosVeiculos = MOCK_VEICULOS_VS;
      todosServicos = MOCK_TODOS_SERVICOS;
    } else {
      [todosVeiculos, todosServicos] = await Promise.all([
        apiFetch('/veiculos?todos=true').then(d => Array.isArray(d) ? d : d.content || []),
        apiFetch('/tipo-servicos').then(d => Array.isArray(d) ? d : d.content || []),
      ]);
    }
    renderizarVeiculos(todosVeiculos);
  } catch (err) {
    if (typeof showModal === 'function')
      showModal('Erro ao carregar', err.message || 'Não foi possível carregar os dados.', 'error');
  } finally {
    document.getElementById('loading-veiculos').style.display = 'none';
  }
}

// ── RENDERIZAR LISTA DE VEÍCULOS ──────────────────────────────────
function renderizarVeiculos(lista) {
  const container = document.getElementById('lista_veiculos');
  container.querySelectorAll('.vs-veiculo-item').forEach(e => e.remove());

  lista.forEach(v => {
    const item = document.createElement('div');
    item.className = 'vs-veiculo-item';
    item.dataset.id = v.idVeiculo;

    const inativo = v.ativo === false;

    item.innerHTML = `
      <div class="vs-item-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
      <div class="vs-item-info">
        <div class="vs-item-modelo">${v.modelo || '—'} ${inativo ? '<span style="color:#ef4444;font-size:10px;">(inativo)</span>' : ''}</div>
        <div class="vs-item-prefixo">${v.prefixo || '—'} · CNH ${v.habilitacaoCategoria || '—'}</div>
      </div>
    `;

    item.addEventListener('click', () => selecionarVeiculo(v, item));
    container.appendChild(item);
  });
}

// ── SELECIONAR VEÍCULO ────────────────────────────────────────────
async function selecionarVeiculo(v, itemEl) {
  // Confirma saída se há alterações não salvas
  if (veiculoAtivo && temAlteracoes()) {
    if (!confirm('Você tem alterações não salvas. Deseja descartar e trocar de veículo?')) return;
  }

  // Destaca o item
  document.querySelectorAll('.vs-veiculo-item').forEach(i => i.classList.remove('selecionado'));
  itemEl.classList.add('selecionado');

  veiculoAtivo = v;

  // Atualiza cabeçalho
  document.getElementById('vs-veiculo-nome').textContent    = `${v.modelo} — ${v.prefixo}`;
  document.getElementById('vs-veiculo-detalhe').textContent = `CNH ${v.habilitacaoCategoria || '—'} · KM: ${v.kmAtual ? Number(v.kmAtual).toLocaleString('pt-BR') : '—'}`;

  // Mostra painel
  document.getElementById('vs-empty-painel').style.display    = 'none';
  document.getElementById('vs-servicos-painel').style.display = 'flex';

  await carregarVinculos(v.idVeiculo);
}

// ── CARREGAR VÍNCULOS DO VEÍCULO ──────────────────────────────────
async function carregarVinculos(idVeiculo) {
  document.getElementById('loading-servicos').style.display = 'flex';
  document.getElementById('vs-servicos-lista').querySelectorAll('.vs-servico-item').forEach(e => e.remove());

  try {
    let idsHabilitados = [];

    if (typeof MOCK_MODE !== 'undefined' && MOCK_MODE) {
      await new Promise(r => setTimeout(r, 300));
      idsHabilitados = MOCK_VINCULOS[idVeiculo] || [];
    } else {
      // Busca serviços habilitados para este veículo
      const lista = await apiFetch(`/tipo-servicos/veiculo/${idVeiculo}/ativos`);
      idsHabilitados = (Array.isArray(lista) ? lista : []).map(s => s.idTipoServico);
    }

    selecionadosSet  = new Set(idsHabilitados);
    selecionadosOrig = new Set(idsHabilitados);

    renderizarServicos();
    atualizarContador();

  } catch (err) {
    if (typeof showToast === 'function') showToast('Erro ao carregar vínculos do veículo.', 'error');
  } finally {
    document.getElementById('loading-servicos').style.display = 'none';
  }
}

// ── RENDERIZAR SERVIÇOS COM CHECKBOXES ────────────────────────────
function renderizarServicos() {
  const lista = document.getElementById('vs-servicos-lista');
  lista.querySelectorAll('.vs-servico-item').forEach(e => e.remove());

  todosServicos.forEach(s => {
    const id       = s.idTipoServico;
    const nome     = s.nomeServico || '—';
    const desc     = s.descricao;
    const ehOleo   = Boolean(s.ehTrocaOleo || s.eh_troca_oleo);
    const tsAtivo  = Boolean(s.habilitado);
    const marcado  = selecionadosSet.has(id);

    const item = document.createElement('div');
    item.className = `vs-servico-item${marcado ? ' marcado' : ''}`;
    item.dataset.id = id;

    item.innerHTML = `
      <div class="vs-checkbox">
        <svg class="vs-check-tick" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="vs-servico-info">
        <div class="vs-servico-nome">
          ${nome}
          ${ehOleo ? '<span class="badge-oleo-sm">Troca de óleo</span>' : ''}
        </div>
        ${desc ? `<div class="vs-servico-desc">${desc}</div>` : ''}
      </div>
      ${!tsAtivo ? '<span class="vs-servico-status inativo-ts">Desabilitado</span>' : ''}
    `;

    item.addEventListener('click', () => toggleServico(id, item));
    lista.appendChild(item);
  });
}

// ── TOGGLE INDIVIDUAL ─────────────────────────────────────────────
function toggleServico(id, itemEl) {
  if (selecionadosSet.has(id)) {
    selecionadosSet.delete(id);
    itemEl.classList.remove('marcado');
  } else {
    selecionadosSet.add(id);
    itemEl.classList.add('marcado');
  }
  atualizarContador();
  atualizarBtnTodos();
}

// ── MARCAR/DESMARCAR TODOS ────────────────────────────────────────
function toggleTodos() {
  const btnTodos = document.getElementById('btn-selecionar-todos');
  todasMarcadas = !todasMarcadas;

  document.querySelectorAll('.vs-servico-item').forEach(item => {
    const id = parseInt(item.dataset.id, 10);
    if (todasMarcadas) {
      selecionadosSet.add(id);
      item.classList.add('marcado');
    } else {
      selecionadosSet.delete(id);
      item.classList.remove('marcado');
    }
  });

  btnTodos.textContent = todasMarcadas ? 'Desmarcar todos' : 'Marcar todos';
  atualizarContador();
}

function atualizarBtnTodos() {
  const btnTodos = document.getElementById('btn-selecionar-todos');
  const todos = document.querySelectorAll('.vs-servico-item').length;
  todasMarcadas = selecionadosSet.size === todos;
  btnTodos.textContent = todasMarcadas ? 'Desmarcar todos' : 'Marcar todos';
}

// ── CONTADOR ──────────────────────────────────────────────────────
function atualizarContador() {
  document.getElementById('vs-counter-num').textContent = selecionadosSet.size;
}

// ── DETECTAR ALTERAÇÕES ───────────────────────────────────────────
function temAlteracoes() {
  if (selecionadosSet.size !== selecionadosOrig.size) return true;
  for (const id of selecionadosSet) {
    if (!selecionadosOrig.has(id)) return true;
  }
  return false;
}

// ── CANCELAR ─────────────────────────────────────────────────────
function cancelarEdicao() {
  if (!veiculoAtivo) return;

  // Restaura estado original
  selecionadosSet = new Set(selecionadosOrig);
  renderizarServicos();
  atualizarContador();
  if (typeof showToast === 'function') showToast('Alterações descartadas.', 'warning');
}

// ── SALVAR VÍNCULOS ───────────────────────────────────────────────
async function salvarVinculos() {
  if (!veiculoAtivo) return;

  if (!temAlteracoes()) {
    if (typeof showToast === 'function') showToast('Nenhuma alteração para salvar.', 'warning');
    return;
  }

  const idVeiculo = veiculoAtivo.idVeiculo;
  const lista     = Array.from(selecionadosSet);

  const btnSalvar = document.getElementById('btn-salvar-vinculos');
  const overlay   = document.getElementById('loadingOverlay');
  btnSalvar.disabled = true;
  overlay.classList.add('active');

  try {
    if (typeof MOCK_MODE !== 'undefined' && MOCK_MODE) {
      await new Promise(r => setTimeout(r, 700));
      // Atualiza mock local
      MOCK_VINCULOS[idVeiculo] = lista;
    } else {
      await apiFetch(`/veiculo-servico/sincronizar/${idVeiculo}`, {
        method: 'POST',
        body: JSON.stringify(lista),
      });
    }

    // Atualiza estado original
    selecionadosOrig = new Set(lista);

    if (typeof showModal === 'function') {
      showModal(
        'Vínculos salvos!',
        `Os serviços de <strong>${veiculoAtivo.prefixo} — ${veiculoAtivo.modelo}</strong> foram atualizados com sucesso.`,
        'success'
      );
    } else if (typeof showToast === 'function') {
      showToast('Vínculos salvos com sucesso!', 'success');
    }

  } catch (err) {
    if (typeof showModal === 'function')
      showModal('Erro ao salvar', err.message || 'Não foi possível salvar os vínculos.', 'error');
  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}

// ── BUSCA ─────────────────────────────────────────────────────────
function initBusca() {
  const input = document.getElementById('busca_veiculo');
  if (!input) return;
  input.addEventListener('input', () => {
    const val = input.value.toLowerCase().trim();
    const filtrados = val
      ? todosVeiculos.filter(v =>
          (v.modelo||'').toLowerCase().includes(val) ||
          (v.prefixo||'').toLowerCase().includes(val)
        )
      : todosVeiculos;

    document.getElementById('lista_veiculos').querySelectorAll('.vs-veiculo-item').forEach(e => e.remove());
    renderizarVeiculos(filtrados);

    // Mantém o item selecionado destacado após filtrar
    if (veiculoAtivo) {
      const itemAtivo = document.querySelector(`.vs-veiculo-item[data-id="${veiculoAtivo.idVeiculo}"]`);
      itemAtivo?.classList.add('selecionado');
    }
  });
}
