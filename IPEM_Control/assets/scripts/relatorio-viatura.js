// ═══════════════════════════════════════════════════════════════
//  relatorio-viatura.js — Relatório de Viaturas
//  CORRIGIDO:
//  P1 — currentVeiculoId para os botões de download
//  P2 — endpoint /relatorios/viatura correto com parâmetros certos
//  P3 — exigirAdm() + MOCK_MODE
//  P4 — menu já corrigido no HTML
//  P5 — carregarVeiculosReais() via GET /veiculos
//  P7 — filtroCard inicial sincronizado com o select
// ═══════════════════════════════════════════════════════════════

// CORRIGIDO P3: proteção de rota — só ADM acessa
if (typeof exigirAdm === 'function') exigirAdm();

// ── MOCK MODE ────────────────────────────────────────────────────
// false = busca dados reais do backend
const MOCK_MODE_RELAT = typeof MOCK_MODE !== 'undefined' ? MOCK_MODE : true;

// CORRIGIDO P1: variável global para armazenar o ID do veículo selecionado
// Os botões de download HTML chamam downloadRelatorio('pdf') sem parâmetro
// e a função busca o ID aqui
let currentVeiculoId = null;

// ── MOCK DE DADOS ────────────────────────────────────────────────
const dadosMock = {
  resumoPorPeriodo: {
    hoje:   { gasto: 450,   litros: 180,   km: 900,   saidas: 12  },
    semana: { gasto: 2450,  litros: 980,   km: 4200,  saidas: 48  },
    mes:    { gasto: 9820,  litros: 4100,  km: 18200, saidas: 170 },
    ano:    { gasto: 58200, litros: 24500, km: 98000, saidas: 920 },
  },

  graficoSaidas: {
    hoje:   [{ id:1, prefix:'FJV-01', valor:2 },{ id:2, prefix:'FJV-02', valor:4 },{ id:3, prefix:'FJV-03', valor:1 },{ id:4, prefix:'FJV-04', valor:3 },{ id:5, prefix:'FJV-05', valor:2 }],
    semana: [{ id:1, prefix:'FJV-01', valor:8 },{ id:2, prefix:'FJV-02', valor:20},{ id:3, prefix:'FJV-03', valor:5 },{ id:4, prefix:'FJV-04', valor:10},{ id:5, prefix:'FJV-05', valor:10}],
    mes:    [{ id:1, prefix:'FJV-01', valor:28},{ id:2, prefix:'FJV-02', valor:50},{ id:3, prefix:'FJV-03', valor:22},{ id:4, prefix:'FJV-04', valor:35},{ id:5, prefix:'FJV-05', valor:35}],
    ano:    [{ id:1, prefix:'FJV-01', valor:150},{ id:2, prefix:'FJV-02', valor:260},{ id:3, prefix:'FJV-03', valor:120},{ id:4, prefix:'FJV-04', valor:190},{ id:5, prefix:'FJV-05', valor:200}],
  },

  graficoKm: {
    hoje:   [{ id:1, prefix:'FJV-01', valor:120 },{ id:2, prefix:'FJV-02', valor:200 },{ id:3, prefix:'FJV-03', valor:80  },{ id:4, prefix:'FJV-04', valor:150 },{ id:5, prefix:'FJV-05', valor:100 }],
    semana: [{ id:1, prefix:'FJV-01', valor:700 },{ id:2, prefix:'FJV-02', valor:1200},{ id:3, prefix:'FJV-03', valor:400 },{ id:4, prefix:'FJV-04', valor:900 },{ id:5, prefix:'FJV-05', valor:1000}],
    mes:    [{ id:1, prefix:'FJV-01', valor:2800},{ id:2, prefix:'FJV-02', valor:5200},{ id:3, prefix:'FJV-03', valor:1800},{ id:4, prefix:'FJV-04', valor:4000},{ id:5, prefix:'FJV-05', valor:3400}],
    ano:    [{ id:1, prefix:'FJV-01', valor:15000},{ id:2, prefix:'FJV-02', valor:26000},{ id:3, prefix:'FJV-03', valor:11000},{ id:4, prefix:'FJV-04', valor:20000},{ id:5, prefix:'FJV-05', valor:18000}],
  },
};

const veiculosMock = [
  { id:1, modelo:'SPIN',   prefixo:'FJV-01', dados:{ hoje:{gasto:120,litros:40,km:180,saidas:2,consumo:4.5}, semana:{gasto:900,litros:320,km:1400,saidas:10,consumo:4.3}, mes:{gasto:3200,litros:1200,km:5200,saidas:38,consumo:4.2}, ano:{gasto:28000,litros:11000,km:48000,saidas:300,consumo:4.1}}, manutencao:{kmAtual:52495,proximaTroca:57495} },
  { id:2, modelo:'HB20',   prefixo:'FJV-02', dados:{ hoje:{gasto:200,litros:65,km:240,saidas:3,consumo:3.8}, semana:{gasto:1500,litros:500,km:2200,saidas:12,consumo:4.4}, mes:{gasto:5200,litros:1800,km:7800,saidas:60,consumo:4.3}, ano:{gasto:41000,litros:15000,km:65000,saidas:420,consumo:4.2}}, manutencao:{kmAtual:28310,proximaTroca:33310} },
  { id:3, modelo:'HILUX',  prefixo:'FJV-03', dados:{ hoje:{gasto:90,litros:30,km:150,saidas:1,consumo:5.0}, semana:{gasto:1100,litros:380,km:1600,saidas:8,consumo:4.2}, mes:{gasto:4300,litros:1500,km:6200,saidas:45,consumo:4.1}, ano:{gasto:30000,litros:12000,km:52000,saidas:310,consumo:4.3}}, manutencao:{kmAtual:89850,proximaTroca:99850} },
  { id:4, modelo:'MASTER', prefixo:'FJV-04', dados:{ hoje:{gasto:150,litros:50,km:200,saidas:2,consumo:4.0}, semana:{gasto:1300,litros:450,km:2000,saidas:12,consumo:4.4}, mes:{gasto:4800,litros:1700,km:7200,saidas:55,consumo:4.2}, ano:{gasto:37000,litros:14000,km:61000,saidas:380,consumo:4.1}}, manutencao:{kmAtual:145200,proximaTroca:155200} },
  { id:5, modelo:'ONIX',   prefixo:'FJV-05', dados:{ hoje:{gasto:180,litros:60,km:220,saidas:3,consumo:3.9}, semana:{gasto:1600,litros:550,km:2500,saidas:16,consumo:4.5}, mes:{gasto:6000,litros:2100,km:9000,saidas:70,consumo:4.3}, ano:{gasto:45000,litros:17000,km:75000,saidas:500,consumo:4.2}}, manutencao:{kmAtual:15560,proximaTroca:20560} },
];

// ── ESTADO ────────────────────────────────────────────────────────
let todosVeiculosApi  = [];  // lista vinda da API (ou mock)
let veiculoSelecionado = null;

// CORRIGIDO P7: filtroCard inicia como "semana" — sincronizado com o select
let filtroCard   = 'semana';
let filtroSaidas = 'semana';
let filtroKm     = 'semana';
let filtroVeiculo = 'semana';

// ── ELEMENTOS ────────────────────────────────────────────────────
const barrasSaidas = document.querySelectorAll('#chart-saidas .bar');
const barrasKm     = document.querySelectorAll('#chart-km .bar');

// ── MENU (inicialização pelo global.js) ──────────────────────────
if (typeof initMenu === 'function') initMenu();
if (typeof ajustarMenuPorPerfil === 'function') ajustarMenuPorPerfil();

// ── CARREGAR VEÍCULOS REAIS (CORRIGIDO P5) ────────────────────────
async function carregarVeiculosReais() {
  if (MOCK_MODE_RELAT) {
    todosVeiculosApi = veiculosMock;
    return;
  }
  try {
    const dados = await apiFetch('/veiculos?todos=true');
    todosVeiculosApi = (Array.isArray(dados) ? dados : dados.content || []).map(v => ({
      id:      v.idVeiculo,
      modelo:  v.modelo,
      prefixo: v.prefixo,
      dados:   null, // será carregado ao selecionar
      manutencao: { kmAtual: v.kmAtual, proximaTroca: null },
    }));
  } catch (err) {
    if (typeof showToast === 'function') showToast('Erro ao carregar veículos.', 'error');
    todosVeiculosApi = veiculosMock; // fallback
  }
}

// ── CARREGAR DADOS DO RELATÓRIO DE UM VEÍCULO (CORRIGIDO P5) ─────
async function carregarDadosViatura(idVeiculo, periodo) {
  if (MOCK_MODE_RELAT) {
    const v = veiculosMock.find(x => x.id === idVeiculo);
    return v ? { ...v.dados[periodo], ...v.manutencao } : null;
  }
  try {
    const dto = await apiFetch(`/relatorios/veiculos/${idVeiculo}`);
    return {
      gasto:        0,              // RelatorioVeiculoDTO não tem gasto — calculado localmente
      litros:       0,
      km:           dto.kmRodado || 0,
      saidas:       dto.totalSaidas || 0,
      consumo:      dto.consumoMedio || 0,
      kmAtual:      dto.kmRodado || 0,
      proximaTroca: null,
      _dto:         dto,
    };
  } catch {
    return null;
  }
}

// ── CARDS GERAIS ─────────────────────────────────────────────────
function atualizarCards() {
  const resumo = dadosMock.resumoPorPeriodo[filtroCard];
  document.getElementById('gastoTotal').textContent =
    resumo.gasto.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  document.getElementById('litrosTotal').textContent = `${resumo.litros} L`;
  document.getElementById('kmTotal').textContent     = `KM: ${resumo.km}`;
  document.getElementById('saidasTotal').textContent = resumo.saidas;
}

// ── GRÁFICOS ─────────────────────────────────────────────────────
function renderGrafico(barras, dadosGrafico) {
  const max = Math.max(...dadosGrafico.map(v => v.valor));
  barras.forEach((bar, i) => {
    const item = dadosGrafico[i];
    if (!item) { bar.style.height = '0%'; return; }
    bar.style.height = ((item.valor / max) * 100) + '%';
    bar.setAttribute('data-label', item.prefix);
    bar.setAttribute('data-value', item.valor);
    bar.onclick = () => {
      const veiculo = todosVeiculosApi.find(v => v.id === item.id || v.prefixo === item.prefix);
      if (veiculo) selecionarVeiculo(veiculo);
    };
  });
}

// ── RENDER VIATURA ────────────────────────────────────────────────
function renderVeiculo(v, dadosApi) {
  // CORRIGIDO P1: atualiza a variável global currentVeiculoId
  currentVeiculoId = v.id;

  const dados  = dadosApi || (v.dados ? v.dados[filtroVeiculo] : null);
  const manuten = { kmAtual: v.manutencao?.kmAtual || 0, proximaTroca: v.manutencao?.proximaTroca };

  document.getElementById('modeloViatura').textContent = `${v.prefixo} — ${v.modelo}`;

  if (dados) {
    document.getElementById('gastoViatura').textContent =
      (dados.gasto || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
    document.getElementById('litrosViatura').textContent = `${dados.litros || 0} L`;
    document.getElementById('kmViatura').textContent     = `KM: ${dados.km || 0}`;
    document.getElementById('totalSaidas').textContent   = `Total de saídas: ${dados.saidas || 0}`;
    document.getElementById('consumoViatura').textContent =
      `Consumo: ${(dados.consumo || 0).toFixed(1)} km/L`;

    const precMedio = dados.litros > 0 ? (dados.gasto / dados.litros).toFixed(2) : '0.00';
    document.getElementById('precoMedioViatura').textContent = `Preço médio (Litro): R$ ${precMedio}`;
  }

  if (manuten.proximaTroca) {
    document.getElementById('trocaViatura').textContent  = manuten.proximaTroca.toLocaleString('pt-BR');
    document.getElementById('proximaTroca').textContent  =
      `Faltam ${Math.max(0, manuten.proximaTroca - manuten.kmAtual).toLocaleString('pt-BR')} KM para troca`;
  }
}

// ── SELECIONAR VIATURA ────────────────────────────────────────────
async function selecionarVeiculo(v) {
  veiculoSelecionado = v;
  const dadosApi = await carregarDadosViatura(v.id, filtroVeiculo);
  renderVeiculo(v, dadosApi);
  document.getElementById('buscaVeiculo').value = `${v.modelo} — ${v.prefixo}`;
  sugestoes.style.display = 'none';
}

// ── AUTOCOMPLETE ──────────────────────────────────────────────────
const input    = document.getElementById('buscaVeiculo');
const sugestoes = document.querySelector('.sugestoes');

input.addEventListener('input', () => {
  const val = input.value.toLowerCase().trim();
  sugestoes.innerHTML = '';
  if (!val) { sugestoes.style.display = 'none'; return; }

  const filtrados = todosVeiculosApi.filter(v =>
    v.modelo.toLowerCase().includes(val) || v.prefixo.toLowerCase().includes(val)
  );
  if (!filtrados.length) { sugestoes.style.display = 'none'; return; }

  sugestoes.style.display = 'block';
  filtrados.forEach(v => {
    const li = document.createElement('li');
    li.textContent = `${v.modelo} — Prefixo: ${v.prefixo}`;
    li.addEventListener('click', () => selecionarVeiculo(v));
    sugestoes.appendChild(li);
  });
});

document.addEventListener('click', e => {
  if (!input.contains(e.target)) sugestoes.style.display = 'none';
});

// ── UPDATE GERAL ──────────────────────────────────────────────────
function atualizar() {
  atualizarCards();
  renderGrafico(barrasSaidas, dadosMock.graficoSaidas[filtroSaidas]);
  renderGrafico(barrasKm,     dadosMock.graficoKm[filtroKm]);
  if (veiculoSelecionado) renderVeiculo(veiculoSelecionado, null);
}

// ── FILTROS ───────────────────────────────────────────────────────
document.getElementById('filtroCard').addEventListener('change', e => {
  filtroCard = e.target.value; atualizar();
});
document.querySelector('#chart-saidas .filtro-grafico').addEventListener('change', e => {
  filtroSaidas = e.target.value; atualizar();
});
document.querySelector('#chart-km .filtro-grafico').addEventListener('change', e => {
  filtroKm = e.target.value; atualizar();
});
document.getElementById('filtropesquisa').addEventListener('change', async e => {
  filtroVeiculo = e.target.value;
  if (veiculoSelecionado) {
    const dadosApi = await carregarDadosViatura(veiculoSelecionado.id, filtroVeiculo);
    renderVeiculo(veiculoSelecionado, dadosApi);
  }
});

// ── EXPANSÃO DOS CARDS ────────────────────────────────────────────
document.querySelectorAll('.car-veic .card').forEach(card => {
  card.addEventListener('click', e => {
    e.stopPropagation();
    const aberto = card.classList.contains('ativo');
    document.querySelectorAll('.car-veic .card').forEach(c => c.classList.remove('ativo'));
    if (!aberto) card.classList.add('ativo');
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.car-veic .card').forEach(c => c.classList.remove('ativo'));
});

// ── DOWNLOAD RELATÓRIO (CORRIGIDO P1 + P2) ────────────────────────
// CORRIGIDO P1: não recebe mais idVeiculo como parâmetro — usa currentVeiculoId
// CORRIGIDO P2: endpoint /relatorios/viatura com parâmetros corretos
function downloadRelatorio(formato) {
  if (!currentVeiculoId) {
    if (typeof showModal === 'function')
      showModal('Nenhuma viatura selecionada',
        'Selecione uma viatura para gerar o relatório.', 'warning');
    return;
  }

  const periodoSelect = document.getElementById('filtropesquisa').value;

  // Mapeamento para os valores que o RegistroSaidaService aceita
  const mapaPeriodo = {
    hoje:   'hoje',
    semana: '7d',
    mes:    '30d',
    ano:    '1y',
  };
  const periodo = mapaPeriodo[periodoSelect] || '30d';

  // CORRIGIDO P2: endpoint correto — GET /relatorios/viatura?idVeiculo=&formato=&periodo=
  const params = new URLSearchParams({
    idVeiculo: currentVeiculoId,
    formato,
    periodo,
  });

  const url = `http://localhost:8080/relatorios/viatura?${params.toString()}`;
  window.open(url, '_blank');
}

// ── INIT ──────────────────────────────────────────────────────────
async function init() {
  await carregarVeiculosReais();

  // Seleciona o veículo com mais saídas na semana como padrão
  const maisSaidas = dadosMock.graficoSaidas.semana.reduce((a, b) => a.valor > b.valor ? a : b);
  const padrao = todosVeiculosApi.find(v => v.id === maisSaidas.id) || todosVeiculosApi[0];
  if (padrao) await selecionarVeiculo(padrao);

  atualizar();
}

init();