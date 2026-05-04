// ═══════════════════════════════════════════════════════════════
//  editar-troca-de-oleo.js — Histórico e Edição de Trocas
//  - irParaNovaTroca() implementada
//  - Mock completo
// ═══════════════════════════════════════════════════════════════

if (!exigirLogin()) { /* redireciona */ }

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_VEICULOS_OLEO = [
  { idVeiculo:1, prefixo:'FJV-01', modelo:'SPIN', kmAtual:52495 },
  { idVeiculo:3, prefixo:'FJV-03', modelo:'HILUX', kmAtual:89850 },
  { idVeiculo:5, prefixo:'FJV-05', modelo:'ONIX', kmAtual:15560 },
  { idVeiculo:7, prefixo:'FJV-07', modelo:'RANGER', kmAtual:66050 },
];

const MOCK_TROCAS = {
  1: [
    { idTrocaOleo:1, idVeiculo:1, kmTroca:50490, intervaloKm:5000, kmProximaTroca:55490, dataTroca:'2025-04-08', observacoes:'Óleo 5W30 sintético — filtro Mahle — 4,5L', alertaEnviado:false },
  ],
  5: [
    { idTrocaOleo:2, idVeiculo:5, kmTroca:15555, intervaloKm:5000, kmProximaTroca:20555, dataTroca:'2025-04-14', observacoes:'Óleo 5W30 semi-sintético — filtro WIX', alertaEnviado:false },
  ],
  3: [], 7: [],
};

let veiculoSelecionadoId = null;
let troca_editando = null;

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarVeiculos();

  document.getElementById('select_veiculo')?.addEventListener('change', e => {
    veiculoSelecionadoId = e.target.value ? parseInt(e.target.value) : null;
    if (veiculoSelecionadoId) carregarTrocas(veiculoSelecionadoId);
    else limparTrocas();
  });

  // Campos do modal → atualizar hint de próxima troca
  ['modal_km_troca','modal_intervalo_km'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', atualizarHintProxima);
  });
});

// ── NOVA TROCA ────────────────────────────────────────────────────
function irParaNovaTroca() {
  // Passa o veículo selecionado para a tela de troca de óleo
  if (veiculoSelecionadoId) {
    sessionStorage.setItem('veiculoSelecionadoId', veiculoSelecionadoId);
    localStorage.setItem('veiculoSelecionadoId', veiculoSelecionadoId);

    // Tenta passar o veículo completo
    const veiculo = MOCK_VEICULOS_OLEO.find(v => v.idVeiculo === veiculoSelecionadoId);
    if (veiculo) sessionStorage.setItem('veiculoSelecionado', JSON.stringify(veiculo));
  }
  window.location.href = 'troca-de-oleo.html';
}

// ── CARREGAR VEÍCULOS ─────────────────────────────────────────────
async function carregarVeiculos() {
  const select = document.getElementById('select_veiculo');
  if (!select) return;

  let lista;
  if (MOCK_MODE) {
    lista = MOCK_VEICULOS_OLEO;
  } else {
    try {
      const dados = await apiFetch('/veiculos?todos=true');
      lista = Array.isArray(dados) ? dados : dados.content || [];
    } catch { lista = []; }
  }

  select.innerHTML = '<option value="">Selecione um veículo...</option>';
  lista.forEach(v => {
    const opt = document.createElement('option');
    opt.value       = v.idVeiculo;
    opt.textContent = `${v.prefixo} — ${v.modelo}`;
    select.appendChild(opt);
  });
}

// ── CARREGAR TROCAS ───────────────────────────────────────────────
async function carregarTrocas(idVeiculo) {
  mostrarLoading(true);
  try {
    let trocas;
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 300));
      trocas = MOCK_TROCAS[idVeiculo] || [];
    } else {
      const dados = await apiFetch(`/troca-oleo?veiculoId=${idVeiculo}`);
      trocas = Array.isArray(dados) ? dados : dados.content || [];
    }

    renderizarStatusCard(idVeiculo, trocas);
    renderizarTrocas(trocas);
  } catch (err) {
    showToast('Erro ao carregar trocas.', 'error');
  } finally {
    mostrarLoading(false);
  }
}

function limparTrocas() {
  const statusCard = document.getElementById('status_card');
  if (statusCard) statusCard.style.display = 'none';
  const lista = document.getElementById('lista_trocas');
  if (lista) {
    lista.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.id = 'empty-inicial';
    empty.innerHTML = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Selecione um veículo para ver o histórico</span>`;
    lista.appendChild(empty);
  }
}

function renderizarStatusCard(idVeiculo, trocas) {
  const statusCard = document.getElementById('status_card');
  if (!statusCard) return;

  const veiculo = MOCK_VEICULOS_OLEO.find(v => v.idVeiculo === idVeiculo);
  const kmAtual = veiculo?.kmAtual || 0;

  document.getElementById('status_veiculo_nome').textContent = veiculo
    ? `${veiculo.prefixo} — ${veiculo.modelo}` : '—';
  document.getElementById('status_km_atual').textContent = kmAtual
    ? kmAtual.toLocaleString('pt-BR') + ' km' : '—';

  if (trocas.length > 0) {
    const ultima = trocas[0];
    const proxima = ultima.kmProximaTroca;
    const pct = Math.min(100, Math.round(((kmAtual - ultima.kmTroca) / ultima.intervaloKm) * 100));
    const statusCls = pct >= 100 ? 'vencida' : pct >= 80 ? 'alerta' : 'ok';
    const statusTxt = pct >= 100 ? '⚠ Troca vencida!' : pct >= 80 ? '⚠ Troca próxima' : '✓ Em dia';

    const badgeWrap = document.getElementById('status_badge_wrap');
    if (badgeWrap) badgeWrap.innerHTML = `<span class="status-badge ${statusCls}"><span class="badge-dot-sm"></span>${statusTxt}</span>`;

    const progWrap = document.getElementById('status_progress_wrap');
    if (progWrap) {
      progWrap.style.display = '';
      document.getElementById('prog_val_troca').textContent   = ultima.kmTroca.toLocaleString('pt-BR') + ' km';
      document.getElementById('prog_val_proxima').textContent = proxima.toLocaleString('pt-BR') + ' km';
      const fill = document.getElementById('prog_fill');
      if (fill) { fill.style.width = pct + '%'; fill.className = `status-progress-fill ${statusCls}`; }
    }
  }

  statusCard.style.display = '';
}

function renderizarTrocas(trocas) {
  const lista = document.getElementById('lista_trocas');
  if (!lista) return;
  lista.innerHTML = '';

  if (!trocas.length) {
    lista.innerHTML = `<div class="empty-state" id="empty-sem-trocas"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Nenhuma troca registrada para este veículo.</span></div>`;
    return;
  }

  trocas.forEach(t => {
    const card = document.createElement('div');
    card.className = 'troca-card';
    const dataFmt = t.dataTroca ? new Date(t.dataTroca+'T00:00:00').toLocaleDateString('pt-BR') : '—';
    card.innerHTML = `
      <div class="troca-card-main">
        <div class="troca-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 1 0 0 14.14"/><path d="M20 2l2 2-2 2"/></svg></div>
        <div class="troca-card-info">
          <div class="troca-card-data">${dataFmt}</div>
          <div class="troca-card-km">KM na troca: ${(t.kmTroca||0).toLocaleString('pt-BR')} km</div>
          <div class="troca-card-prox ok">Próxima: ${(t.kmProximaTroca||0).toLocaleString('pt-BR')} km</div>
        </div>
        <svg class="troca-card-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
    card.addEventListener('click', () => abrirModal(t));
    lista.appendChild(card);
  });
}

// ── MODAL ─────────────────────────────────────────────────────────
function abrirModal(troca) {
  troca_editando = troca;
  document.getElementById('modal_id_troca').value    = troca.idTrocaOleo;
  document.getElementById('modal_data_troca').value  = troca.dataTroca || '';
  document.getElementById('modal_km_troca').value    = troca.kmTroca   || '';
  document.getElementById('modal_intervalo_km').value = troca.intervaloKm || 5000;
  document.getElementById('modal_observacoes').value  = troca.observacoes || '';
  atualizarHintProxima();
  document.getElementById('modal-edicao').classList.add('open');
  document.getElementById('modal-backdrop').classList.add('open');
}

function fecharModal() {
  document.getElementById('modal-edicao').classList.remove('open');
  document.getElementById('modal-backdrop').classList.remove('open');
  troca_editando = null;
}

function atualizarHintProxima() {
  const km   = parseFloat(document.getElementById('modal_km_troca')?.value||'0');
  const int  = parseFloat(document.getElementById('modal_intervalo_km')?.value||'0');
  const hint = document.getElementById('modal_hint_proxima');
  if (!hint) return;
  hint.textContent = (!isNaN(km)&&!isNaN(int)&&int>0)
    ? `Próxima troca: ${(km+int).toLocaleString('pt-BR')} km` : '—';
}

async function salvarEdicao() {
  if (!troca_editando) return;

  const km       = parseFloat(document.getElementById('modal_km_troca').value);
  const intervalo = parseFloat(document.getElementById('modal_intervalo_km').value);
  const data     = document.getElementById('modal_data_troca').value;
  const obs      = document.getElementById('modal_observacoes').value.trim();

  const erros = [];
  if (!data)                erros.push('Data é obrigatória.');
  if (isNaN(km)||km<0)     erros.push('KM inválido.');
  if (isNaN(intervalo)||intervalo<=0) erros.push('Intervalo inválido.');

  if (erros.length) { showModal('Dados inválidos', erros.join('<br>'), 'warning'); return; }

  const payload = { kmTroca:km, intervaloKm:intervalo, kmProximaTroca:km+intervalo, dataTroca:data, observacoes:obs||null };

  const loading = document.getElementById('modal-loading');
  if (loading) loading.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 600));
      // Atualiza mock local
      const lista = MOCK_TROCAS[veiculoSelecionadoId] || [];
      const idx   = lista.findIndex(t => t.idTrocaOleo === troca_editando.idTrocaOleo);
      if (idx >= 0) Object.assign(lista[idx], payload);
    } else {
      await apiFetch(`/troca-oleo/${troca_editando.idTrocaOleo}`, {
        method: 'PUT', body: JSON.stringify(payload),
      });
    }
    fecharModal();
    carregarTrocas(veiculoSelecionadoId);
    showToast('Troca de óleo atualizada!', 'success');
  } catch (err) {
    showModal('Erro ao salvar', err.message || 'Não foi possível salvar a troca.', 'error');
  } finally {
    if (loading) loading.classList.remove('active');
  }
}

function mostrarLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.toggle('active', show);
}
