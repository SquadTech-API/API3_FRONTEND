// ═══════════════════════════════════════════════════════════════
//  relatorio-tecnicos.js
//  Tela de Relatório de Técnicos — IPEM Control
//
//  MODO MOCK vs MODO BACKEND
//  ─────────────────────────
//  A constante USE_MOCK controla o modo de operação:
//    true  → usa dados locais (MOCK_DATA) para demonstração
//    false → faz chamadas reais para a API do Spring Boot
//
//  Quando USE_MOCK = false, a tela lê os dados do backend via
//  os endpoints documentados abaixo.
//
//  ENDPOINTS ESPERADOS (Spring Boot):
//    GET  /relatorios/tecnicos/geral?periodo={periodo}
//    GET  /relatorios/tecnicos/{matricula}?periodo={periodo}
//    GET  /relatorios/tecnicos/{matricula}/download?formato={pdf|csv|excel|docx}&periodo={periodo}
// ═══════════════════════════════════════════════════════════════

const USE_MOCK = true; // ← Altere para false ao conectar com o backend

const API_BASE = "http://localhost:8080";

// ─────────────────────────────────────────────────────────────
//  DADOS MOCK — simulam as respostas do backend
//  Estrutura espelhada exatamente ao contrato de API definido
//  Para conectar o backend, substitua as chamadas em fetchGeral()
//  e fetchTecnico() por fetch() reais.
// ─────────────────────────────────────────────────────────────
const MOCK_DATA = {
  periodos: {
    hoje: {
      totalSaidas: 22,
      tecnicosAtivos: 4,
      kmTotal: 505,
      kmMedioPorSaida: 23,
      custoTotal: 2020,
      custoPorSaida: 91,
      saidasPorTecnico: [4, 9, 2, 7],
      kmPorTecnico: [80, 210, 45, 170],
      gastoPorTecnico: [320, 840, 180, 680],
      abastPorTecnico: [2, 4, 1, 3],
      kmPorSemana: [80, 130, 145, 150],
    },
    7: {
      totalSaidas: 39,
      tecnicosAtivos: 4,
      kmTotal: 3080,
      kmMedioPorSaida: 79,
      custoTotal: 7460,
      custoPorSaida: 191,
      saidasPorTecnico: [8, 15, 4, 12],
      kmPorTecnico: [620, 1200, 310, 950],
      gastoPorTecnico: [1240, 3200, 620, 2400],
      abastPorTecnico: [4, 8, 2, 6],
      kmPorSemana: [540, 720, 880, 940],
    },
    30: {
      totalSaidas: 76,
      tecnicosAtivos: 4,
      kmTotal: 11300,
      kmMedioPorSaida: 149,
      custoTotal: 22600,
      custoPorSaida: 297,
      saidasPorTecnico: [18, 28, 8, 22],
      kmPorTecnico: [2100, 4800, 1200, 3200],
      gastoPorTecnico: [4200, 9600, 2400, 6400],
      abastPorTecnico: [9, 14, 4, 11],
      kmPorSemana: [2100, 2800, 3200, 3200],
    },
    ano: {
      totalSaidas: 181,
      tecnicosAtivos: 4,
      kmTotal: 38530,
      kmMedioPorSaida: 213,
      custoTotal: 77060,
      custoPorSaida: 425,
      saidasPorTecnico: [42, 67, 19, 53],
      kmPorTecnico: [8430, 15200, 3100, 11800],
      gastoPorTecnico: [16860, 30400, 6200, 23600],
      abastPorTecnico: [22, 36, 10, 28],
      kmPorSemana: [6200, 8800, 11200, 12330],
    },
  },

  tecnicos: [
    {
      // ── Identificação ──────────────────────────────────────
      matricula: "T001",
      nome: "Carlos Mendes",
      cargo: "Técnico de campo",
      tipo: "tecnico",
      cnh: "B",
      numHabilitacao: "SP-45231",
      cpf: "123.456.789-01",
      email: "carlos@ipem.sp.gov.br",
      telefone: "(11) 98765-1111",
      dataNascimento: "1988-06-20",

      // ── Status ─────────────────────────────────────────────
      ativo: true,
      dataCadastro: "2021-03-15",
      ultimaAtualizacao: "2025-01-10",
      saidaEmAberto: false,
      idSaidaAberta: null,

      // ── Uso do sistema por período ──────────────────────────
      saidasPorPeriodo: { hoje: 4, 7: 8, 30: 18, ano: 42 },
      kmPorPeriodo: { hoje: 80, 7: 620, 30: 2100, ano: 8430 },
      gastoPorPeriodo: { hoje: 320, 7: 1240, 30: 4200, ano: 16860 },
      abastPorPeriodo: { hoje: 2, 7: 4, 30: 9, ano: 22 },

      // ── Comportamento ──────────────────────────────────────
      tempoMedioSaidaHoras: 2.4,
      maiorSaidaKm: 320,
      maiorSaidaDuracaoHoras: 6,
      frequenciaSaidasPorSemana: 1.8,
      ultimaSaidaData: "2025-01-10",
      ultimaSaidaVeiculo: "FJV-2345",
      ultimaSaidaDestino: "Guarulhos",

      // ── Documentos ─────────────────────────────────────────
      documentos: { recebidos: 8, lidos: 6, baixados: 4 },

      // ── Manutenção ─────────────────────────────────────────
      trocasOleo: 3,
      ultimaTrocaOleo: "2024-11-10",
      veiculosUtilizados: ["FJV-2345", "KMN-4521"],

      // ── Destinos ───────────────────────────────────────────
      destinos: [
        { local: "Guarulhos", quantidade: 12 },
        { local: "Santo André", quantidade: 9 },
        { local: "Mogi das Cruzes", quantidade: 8 },
        { local: "Osasco", quantidade: 7 },
        { local: "São Bernardo", quantidade: 6 },
      ],

      // ── Serviços ────────────────────────────────────────────
      servicos: { manutencao: 18, vistoria: 14, instalacao: 10 },
    },
    {
      matricula: "T002",
      nome: "Ana Paula Souza",
      cargo: "Técnica sênior",
      tipo: "tecnico",
      cnh: "C",
      numHabilitacao: "SP-12098",
      cpf: "234.567.890-12",
      email: "ana.souza@ipem.sp.gov.br",
      telefone: "(11) 98765-2222",
      dataNascimento: "1985-03-12",
      ativo: true,
      dataCadastro: "2019-07-22",
      ultimaAtualizacao: "2025-01-11",
      saidaEmAberto: true,
      idSaidaAberta: 9847,
      saidasPorPeriodo: { hoje: 9, 7: 15, 30: 28, ano: 67 },
      kmPorPeriodo: { hoje: 210, 7: 1200, 30: 4800, ano: 15200 },
      gastoPorPeriodo: { hoje: 840, 7: 3200, 30: 9600, ano: 30400 },
      abastPorPeriodo: { hoje: 4, 7: 8, 30: 14, ano: 36 },
      tempoMedioSaidaHoras: 3.1,
      maiorSaidaKm: 480,
      maiorSaidaDuracaoHoras: 8,
      frequenciaSaidasPorSemana: 2.9,
      ultimaSaidaData: "2025-01-11",
      ultimaSaidaVeiculo: "PLQ-0011",
      ultimaSaidaDestino: "Campinas",
      documentos: { recebidos: 12, lidos: 11, baixados: 9 },
      trocasOleo: 6,
      ultimaTrocaOleo: "2024-12-01",
      veiculosUtilizados: ["PLQ-0011", "KMN-4521"],
      destinos: [
        { local: "Campinas", quantidade: 20 },
        { local: "Sorocaba", quantidade: 16 },
        { local: "Ribeirão Preto", quantidade: 15 },
        { local: "São Paulo", quantidade: 10 },
        { local: "Santos", quantidade: 6 },
      ],
      servicos: { manutencao: 30, vistoria: 22, instalacao: 15 },
    },
    {
      matricula: "T003",
      nome: "Roberto Lima",
      cargo: "Técnico jr.",
      tipo: "tecnico",
      cnh: "B",
      numHabilitacao: "SP-77712",
      cpf: "345.678.901-23",
      email: "roberto@ipem.sp.gov.br",
      telefone: "(11) 98765-3333",
      dataNascimento: "1997-09-05",
      ativo: false,
      dataCadastro: "2023-02-10",
      ultimaAtualizacao: "2024-08-01",
      saidaEmAberto: false,
      idSaidaAberta: null,
      saidasPorPeriodo: { hoje: 2, 7: 4, 30: 8, ano: 19 },
      kmPorPeriodo: { hoje: 45, 7: 310, 30: 1200, ano: 3100 },
      gastoPorPeriodo: { hoje: 180, 7: 620, 30: 2400, ano: 6200 },
      abastPorPeriodo: { hoje: 1, 7: 2, 30: 4, ano: 10 },
      tempoMedioSaidaHoras: 1.8,
      maiorSaidaKm: 190,
      maiorSaidaDuracaoHoras: 4,
      frequenciaSaidasPorSemana: 0.8,
      ultimaSaidaData: "2024-07-20",
      ultimaSaidaVeiculo: "FJV-2345",
      ultimaSaidaDestino: "ABC Paulista",
      documentos: { recebidos: 5, lidos: 2, baixados: 1 },
      trocasOleo: 1,
      ultimaTrocaOleo: "2024-06-20",
      veiculosUtilizados: ["FJV-2345"],
      destinos: [
        { local: "ABC Paulista", quantidade: 8 },
        { local: "Guarulhos", quantidade: 6 },
        { local: "Barueri", quantidade: 5 },
      ],
      servicos: { manutencao: 10, vistoria: 5, instalacao: 4 },
    },
    {
      matricula: "T004",
      nome: "Fernanda Costa",
      cargo: "Técnica plena",
      tipo: "tecnico",
      cnh: "AB",
      numHabilitacao: "SP-30981",
      cpf: "456.789.012-34",
      email: "fernanda@ipem.sp.gov.br",
      telefone: "(11) 98765-4444",
      dataNascimento: "1991-12-28",
      ativo: true,
      dataCadastro: "2020-11-05",
      ultimaAtualizacao: "2025-01-11",
      saidaEmAberto: false,
      idSaidaAberta: null,
      saidasPorPeriodo: { hoje: 7, 7: 12, 30: 22, ano: 53 },
      kmPorPeriodo: { hoje: 170, 7: 950, 30: 3200, ano: 11800 },
      gastoPorPeriodo: { hoje: 680, 7: 2400, 30: 6400, ano: 23600 },
      abastPorPeriodo: { hoje: 3, 7: 6, 30: 11, ano: 28 },
      tempoMedioSaidaHoras: 2.8,
      maiorSaidaKm: 410,
      maiorSaidaDuracaoHoras: 7,
      frequenciaSaidasPorSemana: 2.2,
      ultimaSaidaData: "2025-01-11",
      ultimaSaidaVeiculo: "KMN-4521",
      ultimaSaidaDestino: "Jundiaí",
      documentos: { recebidos: 10, lidos: 8, baixados: 7 },
      trocasOleo: 5,
      ultimaTrocaOleo: "2024-12-15",
      veiculosUtilizados: ["KMN-4521", "XRT-8890"],
      destinos: [
        { local: "Jundiaí", quantidade: 15 },
        { local: "Piracicaba", quantidade: 12 },
        { local: "Americana", quantidade: 11 },
        { local: "Campinas", quantidade: 9 },
        { local: "Limeira", quantidade: 6 },
      ],
      servicos: { manutencao: 25, vistoria: 18, instalacao: 10 },
    },
  ],
};

// ─────────────────────────────────────────────────────────────
//  INSTÂNCIAS DOS GRÁFICOS
// ─────────────────────────────────────────────────────────────
let barChart = null;
let pieChart = null;
let lineChart = null;
let profChart = null;

// ─────────────────────────────────────────────────────────────
//  HELPERS DE FORMATAÇÃO
// ─────────────────────────────────────────────────────────────
function fmt(n) {
  return Math.round(n).toLocaleString("pt-BR");
}

function fmtBRL(n) {
  return Math.round(n).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtDt(s) {
  if (!s) return "—";
  try {
    return new Date(s + "T00:00:00").toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function getAuthHeaders() {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ─────────────────────────────────────────────────────────────
//  PROTEÇÃO DE ROTA — somente ADM
// ─────────────────────────────────────────────────────────────
/*(function protegerRota() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
  if (!usuario) { window.location.href = "./index.html"; return; }
  if (usuario.tipoUsuario !== "adm") {
    alert("Acesso restrito ao Administrador.");
    window.location.href = "./tela_veiculos.html";
  }
})();
*/

// ─────────────────────────────────────────────────────────────
//  BUSCA DE DADOS — GERAL
//  Quando USE_MOCK = false, substitui por fetch() real
// ─────────────────────────────────────────────────────────────
async function fetchGeral(periodo) {
  if (USE_MOCK) {
    return {
      resumo: MOCK_DATA.periodos[periodo],
      tecnicos: MOCK_DATA.tecnicos,
    };
  }

  // ── INTEGRAÇÃO BACKEND ────────────────────────────────────
  // Endpoint: GET /relatorios/tecnicos/geral?periodo={periodo}
  // Resposta esperada: { resumo: {...}, tecnicos: [...] }
  const resp = await fetch(
    `${API_BASE}/relatorios/tecnicos/geral?periodo=${periodo}`,
    { headers: getAuthHeaders() },
  );
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar dados gerais.`);
  return await resp.json();
}

// ─────────────────────────────────────────────────────────────
//  BUSCA DE DADOS — TÉCNICO INDIVIDUAL
// ─────────────────────────────────────────────────────────────
async function fetchTecnico(matricula, periodo) {
  if (USE_MOCK) {
    const t = MOCK_DATA.tecnicos.find((x) => x.matricula === matricula);
    if (!t) throw new Error("Técnico não encontrado.");
    return t;
  }

  // ── INTEGRAÇÃO BACKEND ────────────────────────────────────
  // Endpoint: GET /relatorios/tecnicos/{matricula}?periodo={periodo}
  // Resposta esperada: objeto com todas as seções do relatório
  const resp = await fetch(
    `${API_BASE}/relatorios/tecnicos/${matricula}?periodo=${periodo}`,
    { headers: getAuthHeaders() },
  );
  if (!resp.ok)
    throw new Error(`Erro ${resp.status} ao buscar dados do técnico.`);
  return await resp.json();
}

// ─────────────────────────────────────────────────────────────
//  ATUALIZAR PAINEL GERAL
// ─────────────────────────────────────────────────────────────
async function updateAll() {
  const periodo = document.getElementById("periodGlobal").value;

  try {
    const dados = await fetchGeral(periodo);
    const resumo = dados.resumo;
    const tecnicos = dados.tecnicos;
    const nomes = tecnicos.map((t) => t.nome.split(" ")[0]);

    // Cards de métricas
    const metricas = [
      {
        l: "Total de saídas",
        v: fmt(resumo.totalSaidas),
        s:
          fmt(Math.round(resumo.totalSaidas / tecnicos.length)) +
          " por técnico",
      },
      {
        l: "Técnicos ativos",
        v: resumo.tecnicosAtivos,
        s: "de " + tecnicos.length + " cadastrados",
      },
      {
        l: "KM total rodado",
        v: fmt(resumo.kmTotal) + " km",
        s: "acumulado no período",
      },
      {
        l: "KM médio por saída",
        v: fmt(resumo.kmMedioPorSaida) + " km",
        s: "km por ocorrência",
      },
      {
        l: "Custo combustível",
        v: fmtBRL(resumo.custoTotal),
        s: "total gasto no período",
      },
      {
        l: "Custo por saída",
        v: fmtBRL(resumo.custoPorSaida),
        s: "média por saída",
      },
    ];

    document.getElementById("metricsGrid").innerHTML = metricas
      .map(
        (m) =>
          `<div class="mc"><div class="mc-lbl">${m.l}</div><div class="mc-val">${m.v}</div><div class="mc-sub">${m.s}</div></div>`,
      )
      .join("");

    // Gráfico de barras — saídas por técnico
    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById("cBar"), {
      type: "bar",
      data: {
        labels: nomes,
        datasets: [
          {
            label: "Saídas",
            data: resumo.saidasPorTecnico,
            backgroundColor: "#0E2365",
          },
          {
            label: "KM/100",
            data: resumo.kmPorTecnico.map((k) => Math.round(k / 100)),
            backgroundColor: "#3B6D11",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 11 }, color: "#333" } },
          y: {
            ticks: { font: { size: 11 }, color: "#333" },
            beginAtZero: true,
          },
        },
      },
    });

    // Gráfico de rosca — distribuição de serviços
    const svcColors = ["#0E2365", "#223A8E", "#378ADD"];
    const svcData = [40, 35, 25];
    const svcLabels = ["Manutenção", "Vistoria", "Instalação"];
    document.getElementById("legPie").innerHTML = svcLabels
      .map(
        (l, i) =>
          `<span><span class="leg-sq" style="background:${svcColors[i]}"></span>${l} ${svcData[i]}%</span>`,
      )
      .join("");

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById("cPie"), {
      type: "doughnut",
      data: {
        labels: svcLabels,
        datasets: [
          {
            data: svcData,
            backgroundColor: svcColors,
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: "58%",
      },
    });

    // Gráfico de linha — KM por semana
    if (lineChart) lineChart.destroy();
    const media = Math.round(resumo.kmPorSemana.reduce((a, b) => a + b, 0) / 4);
    lineChart = new Chart(document.getElementById("cLine"), {
      type: "line",
      data: {
        labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
        datasets: [
          {
            label: "KM médio",
            data: resumo.kmPorSemana,
            borderColor: "#0E2365",
            backgroundColor: "rgba(14,35,101,0.07)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            borderWidth: 2,
            pointBackgroundColor: "#0E2365",
          },
          {
            label: "Média",
            data: [media, media, media, media],
            borderColor: "#3B6D11",
            borderDash: [5, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 11 }, color: "#333" } },
          y: {
            ticks: { font: { size: 11 }, color: "#333" },
            beginAtZero: true,
          },
        },
      },
    });

    // Ranking
    const sorted = [...tecnicos].sort(
      (a, b) => b.saidasPorPeriodo[periodo] - a.saidasPorPeriodo[periodo],
    );
    const maxS = sorted[0].saidasPorPeriodo[periodo];

    document.getElementById("rankingList").innerHTML = sorted
      .map(
        (t, i) => `
        <div class="ranking-row">
          <div class="rank-num">#${i + 1}</div>
          <div class="rank-name">${t.nome}</div>
          <div class="rank-bar-wrap">
            <div class="rank-bar-fill" style="width:${Math.round((t.saidasPorPeriodo[periodo] / maxS) * 100)}%"></div>
          </div>
          <div class="rank-val">${t.saidasPorPeriodo[periodo]} saídas</div>
          <div class="rank-km">${fmt(t.kmPorPeriodo[periodo])} km</div>
        </div>`,
      )
      .join("");
  } catch (err) {
    console.error("Erro ao carregar dados gerais:", err);
    document.getElementById("metricsGrid").innerHTML =
      '<p style="color:#791F1F;padding:10px">Erro ao carregar dados. Verifique a conexão com o servidor.</p>';
  }
}

// ─────────────────────────────────────────────────────────────
//  AUTOCOMPLETE / SUGESTÕES
// ─────────────────────────────────────────────────────────────
function filterSugg() {
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  const box = document.getElementById("suggList");
  if (!q) {
    box.innerHTML = "";
    return;
  }

  const lista = USE_MOCK ? MOCK_DATA.tecnicos : [];
  const found = lista.filter(
    (t) =>
      t.nome.toLowerCase().includes(q) || t.matricula.toLowerCase().includes(q),
  );

  box.innerHTML = found
    .map(
      (t) =>
        `<button class="sugg-btn" onclick="loadProfile('${t.matricula}')">${t.nome} — ${t.matricula}</button>`,
    )
    .join("");
}

// ─────────────────────────────────────────────────────────────
//  BUSCA PELO BOTÃO
// ─────────────────────────────────────────────────────────────
async function doSearch() {
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  const lista = USE_MOCK ? MOCK_DATA.tecnicos : [];
  const tecnico = lista.find(
    (t) => t.nome.toLowerCase().includes(q) || t.matricula.toLowerCase() === q,
  );

  if (tecnico) {
    await loadProfile(tecnico.matricula);
  } else {
    document.getElementById("profileArea").innerHTML =
      '<div class="no-result">Nenhum técnico encontrado com esse nome ou matrícula.</div>';
  }
}

// ─────────────────────────────────────────────────────────────
//  CARREGAR PERFIL INDIVIDUAL
// ─────────────────────────────────────────────────────────────
async function loadProfile(matricula) {
  const periodo = document.getElementById("periodIndiv").value;
  document.getElementById("searchInput").value = matricula;
  document.getElementById("suggList").innerHTML = "";
  document.getElementById("profileArea").innerHTML =
    '<div class="alert-info">Carregando relatório...</div>';

  try {
    const t = await fetchTecnico(matricula, periodo);

    // Preenche o campo de busca com o nome após carregar
    document.getElementById("searchInput").value = t.nome;

    const ini = t.nome
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("");
    const saidas = t.saidasPorPeriodo[periodo];
    const km = t.kmPorPeriodo[periodo];
    const gasto = t.gastoPorPeriodo[periodo];
    const abast = t.abastPorPeriodo[periodo];
    const custoMedio = saidas > 0 ? Math.round(gasto / saidas) : 0;
    const efic = gasto > 0 ? (km / gasto).toFixed(2) : "0.00";
    const maxD = t.destinos[0]?.quantidade || 1;
    const svcTotal =
      t.servicos.manutencao + t.servicos.vistoria + t.servicos.instalacao;

    // ── Alertas de comportamento ─────────────────────────
    const alertas = [];
    if (t.saidaEmAberto)
      alertas.push({
        c: "al-red",
        dot: "#E24B4A",
        txt:
          "Saída em aberto registrada — verificar retorno pendente (ID " +
          (t.idSaidaAberta || "?") +
          ")",
      });
    if (!t.ativo)
      alertas.push({
        c: "al-red",
        dot: "#E24B4A",
        txt: "Usuário BLOQUEADO — acesso ao sistema suspenso pelo administrador",
      });
    if (t.documentos.lidos < t.documentos.recebidos * 0.5)
      alertas.push({
        c: "al-warn",
        dot: "#BA7517",
        txt:
          "Baixo índice de leitura de documentos: " +
          t.documentos.lidos +
          " de " +
          t.documentos.recebidos +
          " lidos",
      });
    if (saidas < 2 && periodo !== "hoje")
      alertas.push({
        c: "al-warn",
        dot: "#BA7517",
        txt: "Baixo uso do sistema no período selecionado — possível inatividade operacional",
      });
    if (saidas > 0 && km / saidas > 300)
      alertas.push({
        c: "al-warn",
        dot: "#BA7517",
        txt:
          "Média de KM por saída elevada (" +
          fmt(km / saidas) +
          " km) — verificar trajetos realizados",
      });
    if (t.ativo && saidas > 0 && alertas.length === 0)
      alertas.push({
        c: "al-green",
        dot: "#639922",
        txt: "Nenhuma ocorrência de alerta registrada neste período",
      });

    // ── Monta HTML do perfil ─────────────────────────────
    document.getElementById("profileArea").innerHTML = `
      <div class="profile-wrap">

        <!-- Cabeçalho azul -->
        <div class="profile-header-bar">
          <div class="avatar">${ini}</div>
          <div>
            <div class="ph-name">${t.nome}</div>
            <div class="ph-meta">${t.cargo} · Matrícula ${t.matricula}</div>
            <span class="ph-badge ${t.ativo ? "ativo" : "bloq"}">${t.ativo ? "Ativo" : "Bloqueado"}</span>
          </div>
        </div>

        <div class="profile-body">

          <!-- 1. Identificação -->
          <div class="profile-section">
            <div class="ps-title">1. Identificação</div>
            <div class="info-grid">
              <div class="info-col">
                <div class="info-pair"><span class="ip-lbl">Nome completo</span><span class="ip-val">${t.nome}</span></div>
                <div class="info-pair"><span class="ip-lbl">Matrícula</span><span class="ip-val">${t.matricula}</span></div>
                <div class="info-pair"><span class="ip-lbl">CPF</span><span class="ip-val">${t.cpf}</span></div>
                <div class="info-pair"><span class="ip-lbl">E-mail</span><span class="ip-val" style="font-size:12px">${t.email}</span></div>
                <div class="info-pair"><span class="ip-lbl">Telefone</span><span class="ip-val">${t.telefone}</span></div>
              </div>
              <div class="info-col">
                <div class="info-pair"><span class="ip-lbl">Cargo</span><span class="ip-val">${t.cargo}</span></div>
                <div class="info-pair"><span class="ip-lbl">Tipo de acesso</span><span class="ip-val">${t.tipo}</span></div>
                <div class="info-pair"><span class="ip-lbl">Categoria CNH</span><span class="ip-val">${t.cnh}</span></div>
                <div class="info-pair"><span class="ip-lbl">N. habilitação</span><span class="ip-val">${t.numHabilitacao}</span></div>
                <div class="info-pair"><span class="ip-lbl">Data de nascimento</span><span class="ip-val">${fmtDt(t.dataNascimento)}</span></div>
              </div>
            </div>
          </div>

          <!-- 2. Status operacional -->
          <div class="profile-section">
            <div class="ps-title">2. Status operacional</div>
            <div class="info-grid">
              <div class="info-col">
                <div class="info-pair"><span class="ip-lbl">Status</span><span class="ip-val" style="color:${t.ativo ? "#27500A" : "#791F1F"}">${t.ativo ? "Ativo" : "Bloqueado"}</span></div>
                <div class="info-pair"><span class="ip-lbl">Data de cadastro</span><span class="ip-val">${fmtDt(t.dataCadastro)}</span></div>
                <div class="info-pair"><span class="ip-lbl">Última atualização</span><span class="ip-val">${fmtDt(t.ultimaAtualizacao)}</span></div>
                <div class="info-pair"><span class="ip-lbl">Saída em aberto</span><span class="ip-val" style="color:${t.saidaEmAberto ? "#791F1F" : "#27500A"}">${t.saidaEmAberto ? "Sim — ID " + t.idSaidaAberta : "Não"}</span></div>
              </div>
            </div>
          </div>

          <!-- 3. Uso do sistema -->
          <div class="profile-section">
            <div class="ps-title">3. Uso do sistema — período selecionado</div>
            <div class="stats-grid">
              <div class="sc"><div class="sc-val">${saidas}</div><div class="sc-lbl">Saídas</div></div>
              <div class="sc"><div class="sc-val">${fmt(km)} km</div><div class="sc-lbl">KM total</div></div>
              <div class="sc"><div class="sc-val">${saidas > 0 ? fmt(Math.round(km / saidas)) : 0} km</div><div class="sc-lbl">Média/saída</div></div>
              <div class="sc"><div class="sc-val">${t.saidaEmAberto ? "1" : "0"}</div><div class="sc-lbl">Em andamento</div></div>
              <div class="sc"><div class="sc-val" style="font-size:14px">${fmtDt(t.ultimaSaidaData)}</div><div class="sc-lbl">Última saída</div></div>
              <div class="sc"><div class="sc-val" style="font-size:14px">${t.ultimaSaidaVeiculo}</div><div class="sc-lbl">Veículo usado</div></div>
              <div class="sc" style="grid-column:span 2"><div class="sc-val" style="font-size:14px">${t.ultimaSaidaDestino}</div><div class="sc-lbl">Último destino</div></div>
            </div>
          </div>

          <!-- 4. Comportamento operacional -->
          <div class="profile-section">
            <div class="ps-title">4. Comportamento operacional</div>
            <div class="stats-grid">
              <div class="sc"><div class="sc-val">${t.tempoMedioSaidaHoras}h</div><div class="sc-lbl">Tempo médio/saída</div></div>
              <div class="sc"><div class="sc-val">${fmt(t.maiorSaidaKm)} km</div><div class="sc-lbl">Maior saída (km)</div></div>
              <div class="sc"><div class="sc-val">${t.maiorSaidaDuracaoHoras}h</div><div class="sc-lbl">Maior saída (dur.)</div></div>
              <div class="sc"><div class="sc-val">${t.frequenciaSaidasPorSemana.toFixed(1)}x</div><div class="sc-lbl">Saídas/semana</div></div>
            </div>
          </div>

          <!-- 5. Responsabilidade financeira -->
          <div class="profile-section">
            <div class="ps-title">5. Responsabilidade financeira</div>
            <div class="stats-grid">
              <div class="sc"><div class="sc-val">${abast}</div><div class="sc-lbl">Abastecimentos</div></div>
              <div class="sc"><div class="sc-val">${fmtBRL(gasto)}</div><div class="sc-lbl">Gasto total</div></div>
              <div class="sc"><div class="sc-val">${fmtBRL(custoMedio)}</div><div class="sc-lbl">Custo médio/saída</div></div>
              <div class="sc"><div class="sc-val" style="font-size:13px">${fmtDt(t.ultimaAtualizacao)}</div><div class="sc-lbl">Último abastec.</div></div>
            </div>
          </div>

          <!-- 6. Manutenção -->
          <div class="profile-section">
            <div class="ps-title">6. Manutenção</div>
            <div class="stats-grid">
              <div class="sc"><div class="sc-val">${t.trocasOleo}</div><div class="sc-lbl">Trocas de óleo</div></div>
              <div class="sc"><div class="sc-val" style="font-size:13px">${fmtDt(t.ultimaTrocaOleo)}</div><div class="sc-lbl">Última troca</div></div>
              <div class="sc"><div class="sc-val">${t.veiculosUtilizados.length}</div><div class="sc-lbl">Veículos usados</div></div>
              <div class="sc"><div class="sc-val" style="font-size:12px">${t.veiculosUtilizados.join(", ")}</div><div class="sc-lbl">Viaturas</div></div>
            </div>
          </div>

          <!-- 7. Documentos -->
          <div class="profile-section">
            <div class="ps-title">7. Documentos e compliance</div>
            <div class="stats-grid">
              <div class="sc"><div class="sc-val">${t.documentos.recebidos}</div><div class="sc-lbl">Recebidos</div></div>
              <div class="sc"><div class="sc-val">${t.documentos.lidos}</div><div class="sc-lbl">Lidos</div></div>
              <div class="sc"><div class="sc-val">${t.documentos.baixados}</div><div class="sc-lbl">Baixados</div></div>
              <div class="sc"><div class="sc-val">${Math.round((t.documentos.lidos / t.documentos.recebidos) * 100)}%</div><div class="sc-lbl">Taxa de leitura</div></div>
            </div>
          </div>

          <!-- 8. Alertas -->
          <div class="profile-section">
            <div class="ps-title">8. Alertas de comportamento</div>
            <div>${alertas.map((a) => `<div class="alert-row ${a.c}"><div class="al-dot" style="background:${a.dot}"></div><span>${a.txt}</span></div>`).join("")}</div>
          </div>

          <!-- 9. KPIs -->
          <div class="profile-section">
            <div class="ps-title">9. KPIs</div>
            <div class="kpi-grid">
              <div class="kpi"><div class="kpi-val">${fmt(km)} km</div><div class="kpi-lbl">KM no período</div></div>
              <div class="kpi"><div class="kpi-val">${fmtBRL(gasto)}</div><div class="kpi-lbl">Custo gerado</div></div>
              <div class="kpi"><div class="kpi-val">${efic} km/R$</div><div class="kpi-lbl">Eficiência</div></div>
              <div class="kpi"><div class="kpi-val">${Math.round(saidas / 4)} saídas</div><div class="kpi-lbl">Média mensal</div></div>
            </div>
          </div>

          <!-- Destinos + Serviços -->
          <div class="profile-section">
            <div class="ps-title">Destinos frequentes e serviços</div>
            <div class="two-col">
              <div class="detail-card">
                <div class="dc-title">Destinos mais frequentes</div>
                ${t.destinos
                  .map(
                    (d) => `
                  <div class="dest-row">
                    <span class="dest-name">${d.local}</span>
                    <div class="dest-bar-wrap"><div class="dest-bar-fill" style="width:${Math.round((d.quantidade / maxD) * 100)}%"></div></div>
                    <span class="dest-count">${d.quantidade}x</span>
                  </div>`,
                  )
                  .join("")}
              </div>
              <div class="detail-card">
                <div class="dc-title">Serviços realizados</div>
                ${[
                  ["Manutenção", t.servicos.manutencao],
                  ["Vistoria", t.servicos.vistoria],
                  ["Instalação", t.servicos.instalacao],
                ]
                  .map(
                    ([nm, val]) => `
                  <div class="dest-row">
                    <span class="dest-name">${nm}</span>
                    <div class="dest-bar-wrap"><div class="dest-bar-fill" style="width:${Math.round((val / svcTotal) * 100)}%"></div></div>
                    <span class="dest-count">${val} (${Math.round((val / svcTotal) * 100)}%)</span>
                  </div>`,
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Gráfico de evolução -->
          <div class="profile-section">
            <div class="detail-card">
              <div class="dc-title">Evolução de saídas — últimas 6 semanas</div>
              <div class="chart-wrap" style="height:150px;margin-top:8px">
                <canvas id="cProf" role="img" aria-label="Linha de evolução de saídas do técnico ${t.nome}">
                  Evolução de saídas do técnico ${t.nome} nas últimas 6 semanas.
                </canvas>
              </div>
            </div>
          </div>

        </div>

        <!-- Barra de download -->
        <div class="dl-bar">
          <span class="dl-lbl">Baixar relatório:</span>
          <button class="dl-btn" onclick="downloadRelatorio('pdf','${t.matricula}')">PDF</button>
          <button class="dl-btn" onclick="downloadRelatorio('csv','${t.matricula}')">CSV</button>
          <button class="dl-btn" onclick="downloadRelatorio('excel','${t.matricula}')">Excel (.xlsx)</button>
          <button class="dl-btn" onclick="downloadRelatorio('docx','${t.matricula}')">Word (.docx)</button>
        </div>

      </div>
    `;

    // Gráfico de evolução (aguarda o DOM estar pronto)
    setTimeout(() => {
      const ctx = document.getElementById("cProf");
      if (!ctx) return;
      if (profChart) profChart.destroy();

      const base = Math.max(1, Math.round(saidas / 6));
      const dados = [base, base + 1, base, base + 2, base + 1, base + 2];

      profChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"],
          datasets: [
            {
              label: "Saídas",
              data: dados,
              borderColor: "#0E2365",
              backgroundColor: "rgba(14,35,101,0.07)",
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              borderWidth: 2,
              pointBackgroundColor: "#0E2365",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 }, color: "#333" } },
            y: {
              ticks: { font: { size: 11 }, color: "#333" },
              beginAtZero: true,
            },
          },
        },
      });
    }, 80);
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
    document.getElementById("profileArea").innerHTML =
      '<div class="no-result">Erro ao carregar dados do técnico. Verifique a conexão.</div>';
  }
}

// ─────────────────────────────────────────────────────────────
//  DOWNLOAD DO RELATÓRIO
//  No modo mock: exibe alerta informativo
//  No modo backend: abre URL de download do Spring Boot
// ─────────────────────────────────────────────────────────────
function downloadRelatorio(formato, matricula) {
  const periodo = document.getElementById("periodIndiv").value;

  if (USE_MOCK) {
    alert(
      "Download solicitado!\n\n" +
        "Técnico: " +
        matricula +
        "\n" +
        "Formato: " +
        formato.toUpperCase() +
        "\n" +
        "Período: " +
        periodo +
        "\n\n" +
        "No sistema real chamaria:\n" +
        "GET /relatorios/tecnicos/" +
        matricula +
        "/download?formato=" +
        formato +
        "&periodo=" +
        periodo,
    );
    return;
  }

  // ── INTEGRAÇÃO BACKEND ────────────────────────────────────
  // Endpoint: GET /relatorios/tecnicos/{matricula}/download
  // Query params: formato={pdf|csv|excel|docx} e periodo={...}
  // O backend retorna o arquivo com o Content-Disposition correto
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const url = `${API_BASE}/relatorios/tecnicos/${matricula}/download?formato=${formato}&periodo=${periodo}`;

  // Cria link temporário para forçar download
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `relatorio_${matricula}_${periodo}.${formato}`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─────────────────────────────────────────────────────────────
//  MENU DROPDOWN E HAMBURGER
// ─────────────────────────────────────────────────────────────
document.querySelectorAll(".dropdown-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const submenu = btn.nextElementSibling;
    const arrow = btn.querySelector(".arrow");

    document
      .querySelectorAll(".submenu")
      .forEach((m) => m.classList.remove("open"));
    document
      .querySelectorAll(".arrow")
      .forEach((a) => a.classList.remove("rotate"));

    submenu.classList.toggle("open");
    arrow.classList.toggle("rotate");
  });
});

document.addEventListener("click", () => {
  document
    .querySelectorAll(".submenu")
    .forEach((m) => m.classList.remove("open"));
  document
    .querySelectorAll(".arrow")
    .forEach((a) => a.classList.remove("rotate"));
});

document.getElementById("btnMenu")?.addEventListener("click", () => {
  document.getElementById("navPrincipal").classList.toggle("active");
});

// ─────────────────────────────────────────────────────────────
//  EVENTOS PRINCIPAIS
// ─────────────────────────────────────────────────────────────
document.getElementById("periodGlobal").addEventListener("change", updateAll);
document.getElementById("searchInput").addEventListener("input", filterSugg);
document.getElementById("btnBuscar").addEventListener("click", doSearch);
document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

// ─────────────────────────────────────────────────────────────
//  INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
updateAll();
