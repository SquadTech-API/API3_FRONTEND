// ═══════════════════════════════════════════════════════════════
//  historico-viatura.js — Histórico de Viaturas
//  CORRIGIDO:
//  P1 — buscarVeiculos() e buscarSaidas() com MOCK_MODE + fetch real
//  P2 — menu já corrigido no HTML
//  P3 — exigirLogin()
//  P4 — espaco_nome começa hidden no HTML
//  P5 — exigirLogin() adicionado
//  P6 — IDs únicos nos dados mock
//  P7 — campo km → kmRodados; dataSaida tratada como ISO string
// ═══════════════════════════════════════════════════════════════

// CORRIGIDO P3 + P5: proteção de rota — qualquer usuário autenticado acessa
if (typeof exigirLogin === 'function') exigirLogin();
if (typeof initMenu === 'function') initMenu();
if (typeof ajustarMenuPorPerfil === 'function') ajustarMenuPorPerfil();

// ── MOCK MODE ────────────────────────────────────────────────────
const MOCK_MODE_HIST = typeof MOCK_MODE !== 'undefined' ? MOCK_MODE : true;
const API = typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8080';

// ── MOCK DE VEÍCULOS (CORRIGIDO P6: IDs únicos) ──────────────────
const MOCK_VEICULOS = [
  { id:1, nome:'SPIN',    prefixo:'FJV-01', ultimoUso:'08/04/25', ultimoMotorista:'Carlos Eduardo Silva', abastecimento:'10/01/25' },
  { id:2, nome:'HB20',    prefixo:'FJV-02', ultimoUso:'10/02/25', ultimoMotorista:'Fernanda Lima Souza',  abastecimento:'03/02/25' },
  { id:3, nome:'HILUX',   prefixo:'FJV-03', ultimoUso:'05/03/25', ultimoMotorista:'Roberto Alves Costa', abastecimento:'18/02/25' },
  { id:4, nome:'MASTER',  prefixo:'FJV-04', ultimoUso:'—',        ultimoMotorista:'—',                   abastecimento:'—'        },
  { id:5, nome:'ONIX',    prefixo:'FJV-05', ultimoUso:'14/04/25', ultimoMotorista:'Mariana Oliveira',    abastecimento:'20/03/25' },
  { id:6, nome:'KWID',    prefixo:'FJV-06', ultimoUso:'—',        ultimoMotorista:'—',                   abastecimento:'—'        },
  { id:7, nome:'RANGER',  prefixo:'FJV-07', ultimoUso:'02/04/25', ultimoMotorista:'Thiago Nascimento',   abastecimento:'02/04/25' },
  { id:9, nome:'TRACKER', prefixo:'FJV-09', ultimoUso:'30/04/25', ultimoMotorista:'Mariana Oliveira',    abastecimento:'30/04/25' },
];

// CORRIGIDO P7: campo km renomeado para kmRodados para bater com HistoricoUsoCardDTO
const MOCK_SAIDAS = [
  { idVeiculo:1, motorista:'Carlos Eduardo Silva', dataSaida:'2025-04-08T08:30:00', tipoServico:'Inspeção de Campo',     kmRodados:120, abasteceu:true  },
  { idVeiculo:1, motorista:'Fernanda Lima Souza',  dataSaida:'2025-03-20T10:00:00', tipoServico:'Entrega de Documentos', kmRodados:80,  abasteceu:false },
  { idVeiculo:1, motorista:'Carlos Eduardo Silva', dataSaida:'2025-03-05T09:15:00', tipoServico:'Fiscalização',          kmRodados:95,  abasteceu:true  },
  { idVeiculo:2, motorista:'Fernanda Lima Souza',  dataSaida:'2025-04-10T07:45:00', tipoServico:'Inspeção de Campo',     kmRodados:65,  abasteceu:false },
  { idVeiculo:2, motorista:'Thiago Nascimento',    dataSaida:'2025-03-28T08:00:00', tipoServico:'Fiscalização',          kmRodados:110, abasteceu:true  },
  { idVeiculo:3, motorista:'Roberto Alves Costa',  dataSaida:'2025-04-05T06:30:00', tipoServico:'Coleta de Amostra',     kmRodados:200, abasteceu:true  },
  { idVeiculo:5, motorista:'Mariana Oliveira',     dataSaida:'2025-04-14T09:00:00', tipoServico:'Apoio Operacional',     kmRodados:55,  abasteceu:false },
  { idVeiculo:7, motorista:'Thiago Nascimento',    dataSaida:'2025-04-02T07:00:00', tipoServico:'Fiscalização',          kmRodados:185, abasteceu:true  },
  { idVeiculo:9, motorista:'Mariana Oliveira',     dataSaida:'2025-04-30T08:15:00', tipoServico:'Inspeção de Campo',     kmRodados:75,  abasteceu:true  },
];

// ── ESTADO ───────────────────────────────────────────────────────
let veiculos     = [];
let textoBusca   = '';

// ── ELEMENTOS ────────────────────────────────────────────────────
const container          = document.getElementById('lista_veiculos');
const areaBusca          = document.querySelector('.busca_filtros');
const campoBusca         = document.querySelector('.barra_pesquisa input');
const espacoNome         = document.getElementById('espaco_nome');
const veiculoSelecionadoEl = document.getElementById('veiculo_selecionado');
const btnEsc             = document.querySelector('.buton-esc');

// ── BUSCAR VEÍCULOS (CORRIGIDO P1) ────────────────────────────────
async function buscarVeiculos() {
  if (MOCK_MODE_HIST) {
    return MOCK_VEICULOS;
  }
  try {
    const resp = await fetch(`${API}/veiculos`, {
      headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type':'application/json' }
    });
    if (!resp.ok) throw new Error(`Erro ${resp.status}`);
    const dados = await resp.json();
    const lista = Array.isArray(dados) ? dados : dados.content || [];

    return lista.map(v => ({
      id:              v.idVeiculo,
      nome:            v.modelo,
      prefixo:         v.prefixo,
      ultimoUso:       v.ultimoUso   || '—',
      ultimoMotorista: v.ultimoMotorista || '—',
      abastecimento:   v.ultimoAbastecimento || '—',
    }));
  } catch (err) {
    console.error('Erro ao buscar veículos:', err);
    if (typeof showToast === 'function') showToast('Erro ao carregar veículos. Usando dados locais.', 'warning');
    return MOCK_VEICULOS; // fallback
  }
}

// ── BUSCAR SAÍDAS (CORRIGIDO P1 + P7) ────────────────────────────
// CORRIGIDO P7: mapeia kmRodados corretamente do HistoricoUsoCardDTO
async function buscarSaidas(idVeiculo) {
  if (MOCK_MODE_HIST) {
    return MOCK_SAIDAS.filter(s => s.idVeiculo === Number(idVeiculo));
  }
  try {
    const resp = await fetch(`${API}/historico/veiculo/${idVeiculo}`, {
      headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type':'application/json' }
    });
    if (!resp.ok) throw new Error(`Erro ${resp.status}`);
    const lista = await resp.json();

    return (Array.isArray(lista) ? lista : []).map(h => ({
      idVeiculo:   idVeiculo,
      motorista:   h.motorista   || '—',
      // CORRIGIDO P7: dataSaida é LocalDateTime (ISO string) — formatar corretamente
      dataSaida:   h.dataSaida,
      tipoServico: h.tipoServico || '—',
      // CORRIGIDO P7: campo correto do HistoricoUsoCardDTO
      kmRodados:   h.kmRodados   ?? 0,
      abasteceu:   h.abasteceu   ?? false,
    }));
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    if (typeof showToast === 'function') showToast('Erro ao carregar histórico.', 'error');
    return MOCK_SAIDAS.filter(s => s.idVeiculo === Number(idVeiculo));
  }
}

// ── FORMATAR DATA ────────────────────────────────────────────────
// CORRIGIDO P7: trata dataSaida como ISO string (LocalDateTime do Java)
function formatarData(dataSaida) {
  if (!dataSaida) return '—';
  try {
    const d = new Date(dataSaida);
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  } catch { return dataSaida; }
}

// ── RENDERIZAR VEÍCULOS ───────────────────────────────────────────
function renderizarVeiculos(lista) {
  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = '<p style="color:#888;padding:20px;">Nenhum veículo encontrado.</p>';
    return;
  }

  lista.forEach(v => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id      = v.id;
    card.dataset.nome    = v.nome;
    card.dataset.prefixo = v.prefixo;

    card.innerHTML = `
      <div class="card_topo">
        <h3>${v.nome} : ${v.prefixo}</h3>
      </div>
      <div class="card_corpo">
        <p><strong>Último uso:</strong> ${v.ultimoUso || '—'}</p>
        <p><strong>Último motorista:</strong> ${v.ultimoMotorista || '—'}</p>
        <p><strong>Último abastecimento:</strong> ${v.abastecimento || '—'}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// ── RENDERIZAR SAÍDAS ─────────────────────────────────────────────
function renderizarSaidas(lista) {
  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = '<p style="color:#888;padding:20px;">Nenhuma saída registrada para este veículo.</p>';
    return;
  }

  lista.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card_topo">
        <h3>${s.motorista}</h3>
      </div>
      <div class="card_corpo">
        <p><strong>Data da saída:</strong> ${formatarData(s.dataSaida)}</p>
        <p><strong>Tipo de serviço:</strong> ${s.tipoServico}</p>
        <p><strong>KM rodados:</strong> ${(s.kmRodados || 0).toLocaleString('pt-BR')} km</p>
        <p class="${s.abasteceu ? 'abastecimento' : 'sem_abastecimento'}">
          ${s.abasteceu ? '⛽ Abastecimento registrado' : 'Sem abastecimento'}
        </p>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── FILTRO DE BUSCA ───────────────────────────────────────────────
function aplicarBusca() {
  const filtrados = textoBusca
    ? veiculos.filter(v =>
        v.nome.toLowerCase().includes(textoBusca) ||
        v.prefixo.toLowerCase().includes(textoBusca) ||
        (v.ultimoMotorista || '').toLowerCase().includes(textoBusca)
      )
    : veiculos;
  renderizarVeiculos(filtrados);
}

// ── CLICK NO CARD DE VEÍCULO ──────────────────────────────────────
container.addEventListener('click', async e => {
  const card = e.target.closest('.card');
  if (!card || !card.dataset.id) return;

  // Mostra spinner se disponível
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.classList.add('active');

  const saidas = await buscarSaidas(card.dataset.id);

  if (loading) loading.classList.remove('active');

  // Oculta busca e mostra cabeçalho do veículo
  areaBusca.style.display = 'none';
  veiculoSelecionadoEl.innerHTML = `<h2>${card.dataset.nome} : ${card.dataset.prefixo}</h2>`;
  espacoNome.style.display = 'flex';
  espacoNome.style.justifyContent = 'space-between';
  espacoNome.style.alignItems     = 'center';

  renderizarSaidas(saidas);
});

// ── BOTÃO VOLTAR ─────────────────────────────────────────────────
btnEsc?.addEventListener('click', () => {
  // Esconde cabeçalho do veículo selecionado
  espacoNome.style.display = 'none';

  // Mostra busca novamente
  areaBusca.style.display = 'flex';

  // Limpa input e filtro
  campoBusca.value = '';
  textoBusca = '';

  // Volta lista de veículos
  renderizarVeiculos(veiculos);
});

// ── CAMPO DE BUSCA ────────────────────────────────────────────────
campoBusca?.addEventListener('input', () => {
  textoBusca = campoBusca.value.toLowerCase().trim();
  aplicarBusca();
});

// ── LOADING OVERLAY ───────────────────────────────────────────────
// Cria o overlay de loading se não existir (global.css o estiliza)
if (!document.getElementById('loadingOverlay')) {
  const ol = document.createElement('div');
  ol.id = 'loadingOverlay';
  ol.className = 'loading-overlay';
  ol.innerHTML = '<div class="spinner"></div><span>Carregando...</span>';
  document.body.appendChild(ol);
}

// ── INIT ──────────────────────────────────────────────────────────
async function iniciar() {
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.classList.add('active');

  veiculos = await buscarVeiculos();

  if (loading) loading.classList.remove('active');

  renderizarVeiculos(veiculos);
}

iniciar();