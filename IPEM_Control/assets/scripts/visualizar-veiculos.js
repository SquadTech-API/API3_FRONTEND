// ═══════════════════════════════════════════════════════════════
//  visualizar-veiculos.js — Gerenciamento de Veículos (ADM)
// ═══════════════════════════════════════════════════════════════

if (!exigirAdm()) { /* redireciona */ }

initMenu();

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_VEICULOS_FULL = [
  { idVeiculo:1, modelo:'SPIN', prefixo:'FJV-01', marca:'CHEVROLET', ano:2021, tipoCombustivel:'flex', habilitacaoCategoria:'B', kmAtual:52495, intervaloTrocaOleoKm:5000, nucleoDar:'Núcleo Capital', placa:'ABC1D23', disponivel:true, ativo:true, status:'disponivel', km:'52.495', ultimoUso:'08/04/25', ultimoMotorista:'Carlos Eduardo Silva', ultimoAbastecimento:'10/01/25' },
  { idVeiculo:2, modelo:'HB20', prefixo:'FJV-02', marca:'HYUNDAI', ano:2022, tipoCombustivel:'flex', habilitacaoCategoria:'B', kmAtual:28310, intervaloTrocaOleoKm:5000, nucleoDar:'Núcleo Capital', placa:'DEF2E34', disponivel:true, ativo:true, status:'disponivel', km:'28.310', ultimoUso:'10/02/25', ultimoMotorista:'Fernanda Lima Souza', ultimoAbastecimento:'03/02/25' },
  { idVeiculo:3, modelo:'HILUX', prefixo:'FJV-03', marca:'TOYOTA', ano:2020, tipoCombustivel:'diesel', habilitacaoCategoria:'B', kmAtual:89850, intervaloTrocaOleoKm:10000, nucleoDar:'Núcleo Interior', placa:'GHI3F45', disponivel:true, ativo:true, status:'disponivel', km:'89.850', ultimoUso:'05/03/25', ultimoMotorista:'Roberto Alves Costa', ultimoAbastecimento:'18/02/25' },
  { idVeiculo:4, modelo:'MASTER', prefixo:'FJV-04', marca:'RENAULT', ano:2019, tipoCombustivel:'diesel', habilitacaoCategoria:'D', kmAtual:145200, intervaloTrocaOleoKm:10000, nucleoDar:'Núcleo Interior', placa:'JKL4G56', disponivel:true, ativo:true, status:'disponivel', km:'145.200', ultimoUso:'—', ultimoMotorista:'—', ultimoAbastecimento:'—' },
  { idVeiculo:5, modelo:'ONIX', prefixo:'FJV-05', marca:'CHEVROLET', ano:2023, tipoCombustivel:'flex', habilitacaoCategoria:'B', kmAtual:15560, intervaloTrocaOleoKm:5000, nucleoDar:'DAR Campinas', placa:'MNO5H67', disponivel:true, ativo:true, status:'disponivel', km:'15.560', ultimoUso:'14/04/25', ultimoMotorista:'Mariana Oliveira', ultimoAbastecimento:'20/03/25' },
  { idVeiculo:9, modelo:'TRACKER', prefixo:'FJV-09', marca:'CHEVROLET', ano:2023, tipoCombustivel:'flex', habilitacaoCategoria:'B', kmAtual:9800, intervaloTrocaOleoKm:5000, nucleoDar:'Núcleo Capital', placa:'YZA9L01', disponivel:false, ativo:true, status:'em_uso', km:'9.800', ultimoUso:'30/04/25', ultimoMotorista:'Mariana Oliveira', ultimoAbastecimento:'30/04/25' },
  { idVeiculo:10, modelo:'PALIO', prefixo:'FJV-10', marca:'FIAT', ano:2015, tipoCombustivel:'gasolina', habilitacaoCategoria:'B', kmAtual:312000, intervaloTrocaOleoKm:5000, nucleoDar:'Núcleo Capital', placa:'BCD0M12', disponivel:true, ativo:false, status:'disponivel', km:'312.000', ultimoUso:'—', ultimoMotorista:'—', ultimoAbastecimento:'—' },
];

let todosVeiculos = [];
let filtroAtual   = 'todas';
let buscaAtual    = '';
let veiculoEditando = null;

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupHamburger();
  carregarVeiculos();
  setupFiltros();
  setupBusca();
  document.getElementById('btn-logout-mobile')?.addEventListener('click', logout);
});

function setupHamburger() {
  const h   = document.getElementById('hamburger');
  const nav = document.getElementById('mobile-nav');
  h?.addEventListener('click', () => { h.classList.toggle('open'); nav?.classList.toggle('open'); });
  document.querySelectorAll('.mobile-section-title').forEach(t => {
    t.addEventListener('click', () => {
      const sub = document.getElementById(t.dataset.target);
      sub?.classList.toggle('open');
      t.querySelector('.arrow')?.classList.toggle('rotate');
    });
  });
}

async function carregarVeiculos() {
  mostrarLoading(true);
  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400));
      todosVeiculos = MOCK_VEICULOS_FULL;
    } else {
      const dados = await apiFetch('/veiculos?todos=true');
      todosVeiculos = Array.isArray(dados) ? dados : dados.content || [];
    }
    renderizarCards();
  } catch (err) {
    document.getElementById('cards-container').innerHTML =
      `<p style="grid-column:1/-1;padding:2rem;color:#888;text-align:center;">Erro ao carregar veículos.<br><small>${err.message}</small></p>`;
  } finally {
    mostrarLoading(false);
  }
}

function filtrar() {
  return todosVeiculos.filter(v => {
    if (filtroAtual === 'disponivel' && v.status !== 'disponivel') return false;
    if (filtroAtual === 'em_uso'     && v.status !== 'em_uso')     return false;
    if (filtroAtual === 'inativos'   && v.ativo !== false)         return false;
    if (filtroAtual === 'todas') { /* mostra todos */ }
    if (buscaAtual) {
      const m = (v.modelo||'').toLowerCase();
      const p = (v.prefixo||'').toLowerCase();
      if (!m.includes(buscaAtual) && !p.includes(buscaAtual)) return false;
    }
    return true;
  });
}

function renderizarCards() {
  const container = document.getElementById('cards-container');
  container.querySelectorAll('.veiculo-card').forEach(c => c.remove());
  const filtrados = filtrar();
  const empty = document.getElementById('empty-state');

  if (!filtrados.length) { empty.style.display='flex'; return; }
  empty.style.display = 'none';
  filtrados.forEach((v,i) => container.appendChild(criarCard(v,i)));
}

function criarCard(v, index) {
  const eEmUso   = v.status === 'em_uso';
  const eInativo = v.ativo === false;
  const statusCls = eEmUso ? 'em_uso' : eInativo ? 'inativo' : 'disponivel';
  const statusTxt = eEmUso ? 'Em uso'  : eInativo ? 'Inativo' : 'Disponível';

  const card = document.createElement('div');
  card.className = `veiculo-card${eEmUso ? ' em-uso' : ''}`;
  card.style.animationDelay = `${index*0.05}s`;

  const inativoBadge = eInativo ? `<span class="inativo-badge">INATIVO</span>` : '';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-header-left">
        <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        <div>
          <div class="card-modelo">${v.modelo||'—'}${inativoBadge}</div>
          <div class="card-viatura">Viatura: ${v.prefixo||'—'} · CNH ${v.habilitacaoCategoria||'—'}</div>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-info-row"><span class="card-info-label">KM:</span><span class="card-info-value">${v.km||'—'}</span></div>
      <div class="card-info-row"><span class="card-info-label">Último uso:</span><span class="card-info-value">${v.ultimoUso||'—'}</span></div>
      <div class="card-info-row"><span class="card-info-label">Combustível:</span><span class="card-info-value">${v.tipoCombustivel||'—'}</span></div>
    </div>
    <div class="card-footer">
      <div class="card-status ${statusCls}">
        <span class="status-dot ${statusCls}"></span>${statusTxt}
      </div>
    </div>
    <div class="card-actions">
      <button class="btn-card-edit" onclick="abrirEditVeicModal(${v.idVeiculo})">✏ Editar</button>
    </div>
  `;
  return card;
}

function mostrarLoading(show) {
  const l = document.getElementById('loading');
  if (l) l.style.display = show ? 'flex' : 'none';
}

// ── FILTROS E BUSCA ───────────────────────────────────────────────
function setupFiltros() {
  const setFiltro = (f, btns) => {
    filtroAtual = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btns.forEach(b => b?.classList.add('active'));
    renderizarCards();
  };

  document.getElementById('btn-todos')?.addEventListener('click', () =>
    setFiltro('todas', [document.getElementById('btn-todos'), document.getElementById('btn-todos-m')]));
  document.getElementById('btn-disp')?.addEventListener('click', () =>
    setFiltro('disponivel', [document.getElementById('btn-disp'), document.getElementById('btn-disp-m')]));
  document.getElementById('btn-uso')?.addEventListener('click', () =>
    setFiltro('em_uso', [document.getElementById('btn-uso'), document.getElementById('btn-uso-m')]));
  document.getElementById('btn-inativos')?.addEventListener('click', () =>
    setFiltro('inativos', [document.getElementById('btn-inativos')]));
  document.getElementById('btn-todos-m')?.addEventListener('click', () =>
    setFiltro('todas', [document.getElementById('btn-todos'), document.getElementById('btn-todos-m')]));
  document.getElementById('btn-disp-m')?.addEventListener('click', () =>
    setFiltro('disponivel', [document.getElementById('btn-disp'), document.getElementById('btn-disp-m')]));
  document.getElementById('btn-uso-m')?.addEventListener('click', () =>
    setFiltro('em_uso', [document.getElementById('btn-uso'), document.getElementById('btn-uso-m')]));
}

function setupBusca() {
  const exec = val => { buscaAtual = val.trim().toLowerCase(); renderizarCards(); };
  document.getElementById('btn-search-adm')?.addEventListener('click', () =>
    exec(document.getElementById('txf-search-adm').value));
  document.getElementById('btn-search-mob')?.addEventListener('click', () =>
    exec(document.getElementById('txf-search-mob').value));
  document.getElementById('txf-search-adm')?.addEventListener('keyup', e => {
    if (e.key==='Enter'||!e.target.value) exec(e.target.value);
  });
  document.getElementById('txf-search-mob')?.addEventListener('keyup', e => {
    if (e.key==='Enter'||!e.target.value) exec(e.target.value);
  });
}

// ── EDIÇÃO ────────────────────────────────────────────────────────
function abrirEditVeicModal(id) {
  const v = todosVeiculos.find(x => x.idVeiculo === id);
  if (!v) return;
  veiculoEditando = v;

  document.getElementById('ev_id').value           = v.idVeiculo;
  document.getElementById('ev_prefixo').value      = v.prefixo      || '';
  document.getElementById('ev_placa').value        = v.placa        || '';
  document.getElementById('ev_marca').value        = v.marca        || '';
  document.getElementById('ev_modelo').value       = v.modelo       || '';
  document.getElementById('ev_ano').value          = v.ano          || '';
  document.getElementById('ev_km').value           = v.kmAtual      || '';
  document.getElementById('ev_combustivel').value  = v.tipoCombustivel || '';
  document.getElementById('ev_habilitacao').value  = v.habilitacaoCategoria || '';
  document.getElementById('ev_intervalo').value    = v.intervaloTrocaOleoKm || 5000;
  document.getElementById('ev_nucleo').value       = v.nucleoDar    || '';

  const btnToggle = document.getElementById('btn-toggle-ativo-veic');
  if (v.ativo === false) {
    btnToggle.textContent = '✓ Ativar veículo';
    btnToggle.className   = 'toggle-ativo-btn ativar';
  } else {
    btnToggle.textContent = '🔒 Desativar veículo';
    btnToggle.className   = 'toggle-ativo-btn desativar';
  }

  document.getElementById('editVeicModalOverlay').classList.add('active');
}

function fecharEditVeicModal() {
  document.getElementById('editVeicModalOverlay').classList.remove('active');
  veiculoEditando = null;
}

async function salvarEdicaoVeiculo() {
  if (!veiculoEditando) return;

  const payload = {
    prefixo:            document.getElementById('ev_prefixo').value.trim(),
    placa:              document.getElementById('ev_placa').value.trim().toUpperCase(),
    marca:              document.getElementById('ev_marca').value.trim(),
    modelo:             document.getElementById('ev_modelo').value.trim(),
    ano:                parseInt(document.getElementById('ev_ano').value),
    kmAtual:            parseFloat(document.getElementById('ev_km').value),
    tipoCombustivel:    document.getElementById('ev_combustivel').value,
    habilitacaoCategoria: document.getElementById('ev_habilitacao').value,
    intervaloTrocaOleoKm: parseFloat(document.getElementById('ev_intervalo').value) || 5000,
    nucleoDar:          document.getElementById('ev_nucleo').value.trim(),
    disponivel:         veiculoEditando.disponivel,
    ativo:              veiculoEditando.ativo !== false,
  };

  const erros = [];
  if (!payload.prefixo) erros.push('Prefixo é obrigatório.');
  if (!payload.placa)   erros.push('Placa é obrigatória.');
  if (!payload.modelo)  erros.push('Modelo é obrigatório.');

  if (erros.length) {
    showModal('Dados inválidos', erros.map(e=>`• ${e}`).join('<br>'), 'warning');
    return;
  }

  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 500));
      const idx = todosVeiculos.findIndex(x => x.idVeiculo === veiculoEditando.idVeiculo);
      if (idx >= 0) Object.assign(todosVeiculos[idx], payload,
        { km: String(Math.round(payload.kmAtual)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') });
    } else {
      await apiFetch(`/veiculos/${veiculoEditando.idVeiculo}`, {
        method: 'PUT', body: JSON.stringify(payload),
      });
      const idx = todosVeiculos.findIndex(x => x.idVeiculo === veiculoEditando.idVeiculo);
      if (idx >= 0) Object.assign(todosVeiculos[idx], payload);
    }
    fecharEditVeicModal();
    renderizarCards();
    showToast('Veículo atualizado com sucesso!', 'success');
  } catch (err) {
    showModal('Erro ao editar', err.message || 'Não foi possível atualizar o veículo.', 'error');
  } finally {
    overlay.classList.remove('active');
  }
}

async function toggleAtivoVeiculo() {
  if (!veiculoEditando) return;
  const ativoAtual = veiculoEditando.ativo !== false;
  const acao = ativoAtual ? 'desativar' : 'ativar';

  showModal(
    ativoAtual ? 'Desativar veículo' : 'Ativar veículo',
    ativoAtual
      ? `Deseja desativar o veículo ${veiculoEditando.prefixo}? Ele ficará invisível para os técnicos.`
      : `Deseja ativar o veículo ${veiculoEditando.prefixo}? Ele voltará a aparecer para os técnicos.`,
    ativoAtual ? 'warning' : 'info',
    async () => {
      const overlay = document.getElementById('loadingOverlay');
      overlay.classList.add('active');
      try {
        const novoAtivo = !ativoAtual;
        if (MOCK_MODE) {
          await new Promise(r => setTimeout(r, 500));
          const idx = todosVeiculos.findIndex(x => x.idVeiculo === veiculoEditando.idVeiculo);
          if (idx >= 0) todosVeiculos[idx].ativo = novoAtivo;
          veiculoEditando.ativo = novoAtivo;
        } else {
          await apiFetch(`/veiculos/${veiculoEditando.idVeiculo}/${acao}`, { method:'PATCH' });
          const idx = todosVeiculos.findIndex(x => x.idVeiculo === veiculoEditando.idVeiculo);
          if (idx >= 0) { todosVeiculos[idx].ativo = novoAtivo; veiculoEditando.ativo = novoAtivo; }
        }
        fecharEditVeicModal();
        renderizarCards();
        showToast(`Veículo ${ativoAtual ? 'desativado' : 'ativado'} com sucesso!`,
          ativoAtual ? 'warning' : 'success');
      } catch (err) {
        showModal('Erro', err.message || `Não foi possível ${acao} o veículo.`, 'error');
      } finally {
        overlay.classList.remove('active');
      }
    }
  );

  // Botão cancelar no modal
  setTimeout(() => {
    const ol = document.getElementById('_ipem_modal');
    if (!ol) return;
    const btnOk = ol.querySelector('.ipem-modal-btn');
    if (btnOk) {
      const btnC = document.createElement('button');
      btnC.className = 'ipem-modal-btn';
      btnC.textContent = 'Cancelar';
      btnC.style.cssText = 'background:#e8ecf5;color:#1a2d5a;margin-top:8px;';
      btnC.addEventListener('click', () => ol.remove());
      btnOk.parentNode.insertBefore(btnC, btnOk.nextSibling);
    }
  }, 50);
}
