// ═══════════════════════════════════════════════════════════════
//  relatorio-abastecimento.js
//  Tela: Relatório de Abastecimento e Troca de Óleo — IPEM Control
//
//  MODO MOCK vs BACKEND
//  ────────────────────
//  USE_MOCK = true  → dados locais (MOCK_DATA), sem chamadas ao servidor
//  USE_MOCK = false → chamadas reais para a API Spring Boot
//
//  Para ativar o backend: altere USE_MOCK para false e garanta
//  que os endpoints listados abaixo estejam implementados.
// ═══════════════════════════════════════════════════════════════

const USE_MOCK = true;
const API_BASE = "http://localhost:8080";

// ─────────────────────────────────────────────────────────────
//  DADOS MOCK — espelham exatamente o contrato de API
// ─────────────────────────────────────────────────────────────
const MOCK_DATA = {

  // Resumo por período — retornado por GET /relatorios/abastecimento/geral?periodo=
  periodos: {
    hoje: {
      gastoTotal: 1840, litrosTotal: 520, qtdAbastecimentos: 4,
      qtdTrocasOleo: 1, veicsManutencaoAtrasada: 2,
      consumoMedioKml: 9.5, custoMedioPkm: 0.66,
      semanas: [1840, 0, 0, 0], litrosSem: [520, 0, 0, 0],
      abastecimentos: [
        { dataHora: "2025-01-11T09:00", veiculo: "FJV-2345", responsavel: "Carlos M.", combustivel: "Flex", litros: 48, valorTotal: 288, kmAbastecimento: 45320, postoNome: "Auto Posto Central", postoCidade: "SP", notaFiscal: "NF-001" },
        { dataHora: "2025-01-11T10:30", veiculo: "KMN-4521", responsavel: "Ana P.",    combustivel: "Diesel", litros: 80, valorTotal: 640, kmAbastecimento: 82100, postoNome: "Posto BR",           postoCidade: "Campinas", notaFiscal: "NF-002" },
        { dataHora: "2025-01-11T11:00", veiculo: "PLQ-0011", responsavel: "Fernanda C.", combustivel: "Gasolina", litros: 52, valorTotal: 416, kmAbastecimento: 31200, postoNome: "Shell",         postoCidade: "Jundiaí",  notaFiscal: "NF-003" },
        { dataHora: "2025-01-11T14:00", veiculo: "XRT-8890", responsavel: "Roberto L.",  combustivel: "Flex",    litros: 60, valorTotal: 496, kmAbastecimento: 18700, postoNome: "Ipiranga",     postoCidade: "Guarulhos", notaFiscal: "—" },
      ],
    },
    "7": {
      gastoTotal: 7460, litrosTotal: 2100, qtdAbastecimentos: 18,
      qtdTrocasOleo: 3, veicsManutencaoAtrasada: 2,
      consumoMedioKml: 9.2, custoMedioPkm: 0.71,
      semanas: [1840, 2100, 1800, 1720], litrosSem: [520, 610, 530, 440],
      abastecimentos: [
        { dataHora: "2025-01-11T09:00", veiculo: "FJV-2345", responsavel: "Carlos M.",   combustivel: "Flex",    litros: 48, valorTotal: 288, kmAbastecimento: 45320, postoNome: "Auto Posto Central", postoCidade: "SP",       notaFiscal: "NF-001" },
        { dataHora: "2025-01-10T10:30", veiculo: "KMN-4521", responsavel: "Ana P.",      combustivel: "Diesel",  litros: 80, valorTotal: 640, kmAbastecimento: 82100, postoNome: "Posto BR",           postoCidade: "Campinas", notaFiscal: "NF-002" },
        { dataHora: "2025-01-09T11:00", veiculo: "PLQ-0011", responsavel: "Fernanda C.", combustivel: "Gasolina",litros: 52, valorTotal: 416, kmAbastecimento: 31200, postoNome: "Shell",              postoCidade: "Jundiaí",  notaFiscal: "NF-003" },
        { dataHora: "2025-01-08T14:00", veiculo: "XRT-8890", responsavel: "Roberto L.",  combustivel: "Flex",    litros: 60, valorTotal: 496, kmAbastecimento: 18700, postoNome: "Ipiranga",          postoCidade: "Guarulhos",notaFiscal: "—"     },
        { dataHora: "2025-01-07T08:00", veiculo: "FJV-2345", responsavel: "Carlos M.",   combustivel: "Flex",    litros: 50, valorTotal: 300, kmAbastecimento: 44900, postoNome: "Auto Posto Central", postoCidade: "SP",       notaFiscal: "NF-005" },
        { dataHora: "2025-01-06T09:30", veiculo: "KMN-4521", responsavel: "Ana P.",      combustivel: "Diesel",  litros: 85, valorTotal: 680, kmAbastecimento: 81200, postoNome: "Posto BR",           postoCidade: "Campinas", notaFiscal: "NF-006" },
      ],
    },
    "30": {
      gastoTotal: 22600, litrosTotal: 6400, qtdAbastecimentos: 52,
      qtdTrocasOleo: 8, veicsManutencaoAtrasada: 2,
      consumoMedioKml: 9.1, custoMedioPkm: 0.73,
      semanas: [5200, 5800, 6100, 5500], litrosSem: [1480, 1650, 1720, 1550],
      abastecimentos: [],
    },
    ano: {
      gastoTotal: 77060, litrosTotal: 21800, qtdAbastecimentos: 196,
      qtdTrocasOleo: 24, veicsManutencaoAtrasada: 2,
      consumoMedioKml: 9.0, custoMedioPkm: 0.75,
      semanas: [18200, 19400, 20100, 19360], litrosSem: [5100, 5500, 5700, 5500],
      abastecimentos: [],
    },
  },

  // Dados por veículo — retornados junto ao geral
  veiculos: [
    { placa: "FJV-2345", kmAtual: 45320, kmProxTroca: 48000, intervalo: 5000, ultimaTroca: "2024-10-15", kmTroca: 43000, consumoKml: 9.2,  custoPkm: 0.68, gastoTotal: 12400, litros: 1800 },
    { placa: "KMN-4521", kmAtual: 82100, kmProxTroca: 80000, intervalo: 5000, ultimaTroca: "2024-08-20", kmTroca: 75000, consumoKml: 7.1,  custoPkm: 0.92, gastoTotal: 28600, litros: 4020 },
    { placa: "PLQ-0011", kmAtual: 31200, kmProxTroca: 33000, intervalo: 5000, ultimaTroca: "2024-12-01", kmTroca: 28000, consumoKml: 10.4, custoPkm: 0.54, gastoTotal: 8800,  litros: 1260 },
    { placa: "XRT-8890", kmAtual: 18700, kmProxTroca: 20000, intervalo: 5000, ultimaTroca: "2024-11-10", kmTroca: 15000, consumoKml: 11.2, custoPkm: 0.49, gastoTotal: 6800,  litros: 960  },
  ],

  // Histórico de trocas de óleo
  trocasOleo: [
    { data: "2024-12-01", veiculo: "PLQ-0011", kmTroca: 28000, intervalo: 5000, kmProxTroca: 33000, obs: "Troca regular" },
    { data: "2024-11-10", veiculo: "XRT-8890", kmTroca: 15000, intervalo: 5000, kmProxTroca: 20000, obs: "Troca regular" },
    { data: "2024-10-15", veiculo: "FJV-2345", kmTroca: 43000, intervalo: 5000, kmProxTroca: 48000, obs: "Óleo 5W30" },
    { data: "2024-08-20", veiculo: "KMN-4521", kmTroca: 75000, intervalo: 5000, kmProxTroca: 80000, obs: "Troca + filtro" },
  ],

  // Usuários — ranking de abastecimentos
  usuarios: [
    { nome: "Ana Paula Souza",   abasts: 36, gastoTotal: 28600 },
    { nome: "Carlos Mendes",     abasts: 22, gastoTotal: 12400 },
    { nome: "Fernanda Costa",    abasts: 18, gastoTotal: 8800  },
    { nome: "Roberto Lima",      abasts: 10, gastoTotal: 6800  },
  ],

  // Postos mais utilizados
  postos: [
    { nome: "Posto BR, Campinas",        qtd: 18 },
    { nome: "Auto Posto Central, SP",    qtd: 14 },
    { nome: "Shell, Jundiaí",            qtd: 10 },
    { nome: "Ipiranga, Guarulhos",       qtd: 8  },
  ],

  // Distribuição de combustível
  combustiveis: [
    { tipo: "Flex",     pct: 45 },
    { tipo: "Diesel",   pct: 30 },
    { tipo: "Gasolina", pct: 25 },
  ],
};

// ─────────────────────────────────────────────────────────────
//  INSTÂNCIAS DE GRÁFICOS
// ─────────────────────────────────────────────────────────────
const CHARTS = {};

function destroyChart(id) {
  if (CHARTS[id]) { CHARTS[id].destroy(); delete CHARTS[id]; }
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function fmt(n) { return Math.round(n).toLocaleString("pt-BR"); }
function fmtBRL(n) { return Math.round(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDt(s) { try { return new Date(s.split("T")[0] + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return s; } }
function fmtDtHr(s) { try { return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return s; } }

function statusManutencao(v) {
  const diff = v.kmProxTroca - v.kmAtual;
  if (diff < 0)    return "danger";
  if (diff < 500)  return "warn";
  return "ok";
}

function statusLabel(v) {
  const diff = v.kmProxTroca - v.kmAtual;
  if (diff < 0) return "Atrasada (" + fmt(Math.abs(diff)) + " km)";
  if (diff < 500) return "Atenção — faltam " + fmt(diff) + " km";
  return "OK — faltam " + fmt(diff) + " km";
}

function getAuthHeaders() {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ─────────────────────────────────────────────────────────────
//  PROTEÇÃO DE ROTA
// ─────────────────────────────────────────────────────────────
/* (function protegerRota() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
  if (!usuario) { window.location.href = "./index.html"; return; }
  if (usuario.tipoUsuario !== "adm") {
    alert("Acesso restrito ao Administrador.");
    window.location.href = "./tela_veiculos.html";
  }
})();

*/

// ─────────────────────────────────────────────────────────────
//  BUSCA DE DADOS GERAL
//  Endpoint: GET /relatorios/abastecimento/geral?periodo={p}
// ─────────────────────────────────────────────────────────────
async function fetchGeral(periodo) {
  if (USE_MOCK) {
    return {
      resumo:       MOCK_DATA.periodos[periodo],
      veiculos:     MOCK_DATA.veiculos,
      trocasOleo:   MOCK_DATA.trocasOleo,
      usuarios:     MOCK_DATA.usuarios,
      postos:       MOCK_DATA.postos,
      combustiveis: MOCK_DATA.combustiveis,
    };
  }
  const resp = await fetch(`${API_BASE}/relatorios/abastecimento/geral?periodo=${periodo}`, { headers: getAuthHeaders() });
  if (!resp.ok) throw new Error(`Erro ${resp.status}`);
  return resp.json();
}

// ─────────────────────────────────────────────────────────────
//  BUSCA DETALHADA
//  Endpoint: GET /relatorios/abastecimento/busca?...params
// ─────────────────────────────────────────────────────────────
async function fetchBusca(params) {
  if (USE_MOCK) {
    const p = MOCK_DATA.periodos["7"];
    return {
      abastecimentos: p.abastecimentos,
      trocasOleo:     MOCK_DATA.trocasOleo,
      veiculos:       MOCK_DATA.veiculos,
    };
  }
  const qs = new URLSearchParams(params).toString();
  const resp = await fetch(`${API_BASE}/relatorios/abastecimento/busca?${qs}`, { headers: getAuthHeaders() });
  if (!resp.ok) throw new Error(`Erro ${resp.status}`);
  return resp.json();
}

// ─────────────────────────────────────────────────────────────
//  ATUALIZAR PAINEL COMPLETO
// ─────────────────────────────────────────────────────────────
async function updateAll() {
  const periodo = document.getElementById("periodGlobal").value;
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.add("active");

  try {
    const dados = await fetchGeral(periodo);
    const resumo = dados.resumo;
    const veiculos = dados.veiculos;
    const trocas   = dados.trocasOleo;
    const usuarios = dados.usuarios;
    const postos   = dados.postos;
    const combs    = dados.combustiveis;

    renderMetricas(resumo, veiculos);
    renderAbastecimento(resumo, veiculos, combs);
    renderConsumo(veiculos, usuarios, postos);
    renderTrocaOleo(veiculos, trocas);
    renderAlertas(veiculos, resumo);
    renderCruzamento(veiculos);
    popularVeiculoSelect(veiculos);

  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    document.getElementById("metricsGrid").innerHTML =
      '<p style="color:#791F1F;padding:10px">Erro ao carregar dados. Verifique a conexão com o servidor.</p>';
  } finally {
    overlay.classList.remove("active");
  }
}

// ─────────────────────────────────────────────────────────────
//  SEÇÃO: MÉTRICAS
// ─────────────────────────────────────────────────────────────
function renderMetricas(resumo, veiculos) {
  const mecs = [
    { l: "Gasto total",          v: fmtBRL(resumo.gastoTotal),                     s: "combustível",     c: "" },
    { l: "Litros abastecidos",   v: fmt(resumo.litrosTotal) + " L",               s: "no período",      c: "" },
    { l: "Abastecimentos",       v: fmt(resumo.qtdAbastecimentos),                 s: "registros",       c: "" },
    { l: "Consumo médio frota",  v: resumo.consumoMedioKml.toFixed(1) + " km/L",  s: "média da frota",  c: "" },
    { l: "Custo médio / km",     v: "R$ " + resumo.custoMedioPkm.toFixed(2),      s: "frota",           c: "" },
    { l: "Trocas de óleo",       v: fmt(resumo.qtdTrocasOleo),                     s: "realizadas",      c: "" },
    { l: "Manutenção atrasada",  v: resumo.veicsManutencaoAtrasada,                s: "veículo(s)",      c: "danger" },
  ];
  document.getElementById("metricsGrid").innerHTML = mecs
    .map(m => `<div class="mc ${m.c}"><div class="mc-lbl">${m.l}</div><div class="mc-val">${m.v}</div><div class="mc-sub">${m.s}</div></div>`)
    .join("");
}

// ─────────────────────────────────────────────────────────────
//  SEÇÃO: ABA ABASTECIMENTO
// ─────────────────────────────────────────────────────────────
function renderAbastecimento(resumo, veiculos, combs) {
  // Gráfico barras — gasto e litros por semana
  destroyChart("cAbast");
  CHARTS["cAbast"] = new Chart(document.getElementById("cAbast"), {
    type: "bar",
    data: {
      labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
      datasets: [
        { label: "Gasto R$/100", data: resumo.semanas.map(v => Math.round(v / 100)), backgroundColor: "#0E2365" },
        { label: "Litros",       data: resumo.litrosSem,                              backgroundColor: "#3B6D11" },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 11 }, color: "#333" } },
        y: { ticks: { font: { size: 11 }, color: "#333" }, beginAtZero: true },
      },
    },
  });

  // Gráfico rosca — tipos de combustível
  const cores = ["#0E2365", "#223A8E", "#378ADD"];
  document.getElementById("legComb").innerHTML = combs
    .map((c, i) => `<span><span class="leg-sq" style="background:${cores[i]}"></span>${c.tipo} ${c.pct}%</span>`)
    .join("");
  destroyChart("cComb");
  CHARTS["cComb"] = new Chart(document.getElementById("cComb"), {
    type: "doughnut",
    data: {
      labels: combs.map(c => c.tipo),
      datasets: [{ data: combs.map(c => c.pct), backgroundColor: cores, borderWidth: 2, borderColor: "#fff" }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: "55%" },
  });

  // Ranking veículos mais caros
  const maxG = Math.max(...veiculos.map(v => v.gastoTotal));
  document.getElementById("rankVeic").innerHTML = [...veiculos]
    .sort((a, b) => b.gastoTotal - a.gastoTotal)
    .map((v, i) => `
      <div class="rank-row">
        <div class="rn">#${i + 1}</div>
        <div class="rank-name" style="min-width:80px">${v.placa}</div>
        <div class="rb"><div class="rf" style="width:${Math.round((v.gastoTotal / maxG) * 100)}%"></div></div>
        <div class="rv">${fmtBRL(v.gastoTotal)}</div>
      </div>`)
    .join("");

  // Tabela de registros
  const rows = resumo.abastecimentos.length > 0 ? resumo.abastecimentos : MOCK_DATA.periodos["7"].abastecimentos;
  document.getElementById("tblAbast").innerHTML = rows
    .map(r => `
      <tr>
        <td>${fmtDtHr(r.dataHora)}</td>
        <td style="font-weight:700;color:#0E2365">${r.veiculo}</td>
        <td>${r.responsavel}</td>
        <td>${r.combustivel}</td>
        <td>${r.litros} L</td>
        <td>${fmtBRL(r.valorTotal)}</td>
        <td>${fmt(r.kmAbastecimento)} km</td>
        <td>${r.postoNome}, ${r.postoCidade}</td>
        <td>${r.notaFiscal || "—"}</td>
      </tr>`)
    .join("");
}

// ─────────────────────────────────────────────────────────────
//  SEÇÃO: ABA CONSUMO E EFICIÊNCIA
// ─────────────────────────────────────────────────────────────
function renderConsumo(veiculos, usuarios, postos) {
  const kml  = veiculos.map(v => v.consumoKml);
  const cpkm = veiculos.map(v => v.custoPkm);
  const nomes = veiculos.map(v => v.placa);

  // KPIs de eficiência
  document.getElementById("kpiConsGrid").innerHTML = [
    { l: "Melhor consumo",    v: Math.max(...kml).toFixed(1) + " km/L",  s: veiculos[kml.indexOf(Math.max(...kml))].placa },
    { l: "Pior consumo",      v: Math.min(...kml).toFixed(1) + " km/L",  s: veiculos[kml.indexOf(Math.min(...kml))].placa },
    { l: "Menor custo/km",   v: "R$ " + Math.min(...cpkm).toFixed(2),   s: veiculos[cpkm.indexOf(Math.min(...cpkm))].placa },
    { l: "Maior custo/km",   v: "R$ " + Math.max(...cpkm).toFixed(2),   s: veiculos[cpkm.indexOf(Math.max(...cpkm))].placa },
  ].map(m => `<div class="kpi"><div class="kpi-val">${m.v}</div><div class="kpi-lbl">${m.l} — ${m.s}</div></div>`).join("");

  // Barras horizontais km/L
  destroyChart("cKml");
  CHARTS["cKml"] = new Chart(document.getElementById("cKml"), {
    type: "bar",
    data: { labels: nomes, datasets: [{ label: "km/L", data: kml, backgroundColor: "#0E2365", borderRadius: 3 }] },
    options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 11 }, color: "#333" }, beginAtZero: true }, y: { ticks: { font: { size: 11 }, color: "#333" } } } },
  });

  // Barras horizontais R$/km
  destroyChart("cCpkm");
  CHARTS["cCpkm"] = new Chart(document.getElementById("cCpkm"), {
    type: "bar",
    data: { labels: nomes, datasets: [{ label: "R$/km", data: cpkm, backgroundColor: "#223A8E", borderRadius: 3 }] },
    options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 11 }, color: "#333" }, beginAtZero: true }, y: { ticks: { font: { size: 11 }, color: "#333" } } } },
  });

  // Ranking usuários
  const maxU = usuarios[0]?.abasts || 1;
  document.getElementById("rankUser").innerHTML = usuarios
    .map((u, i) => `
      <div class="rank-row">
        <div class="rn">#${i + 1}</div>
        <div class="rank-name" style="min-width:130px">${u.nome.split(" ").slice(0, 2).join(" ")}</div>
        <div class="rb"><div class="rf" style="width:${Math.round((u.abasts / maxU) * 100)}%"></div></div>
        <div class="rv">${u.abasts} abast.</div>
      </div>`)
    .join("");

  // Ranking postos
  const maxP = postos[0]?.qtd || 1;
  document.getElementById("rankPostos").innerHTML = postos
    .map((p, i) => `
      <div class="rank-row">
        <div class="rn">#${i + 1}</div>
        <div style="flex:1;font-size:12px;color:#333">${p.nome}</div>
        <div class="rb"><div class="rf" style="width:${Math.round((p.qtd / maxP) * 100)}%"></div></div>
        <div class="rv">${p.qtd}x</div>
      </div>`)
    .join("");
}

// ─────────────────────────────────────────────────────────────
//  SEÇÃO: ABA TROCA DE ÓLEO
// ─────────────────────────────────────────────────────────────
function renderTrocaOleo(veiculos, trocas) {
  // Cards de status por veículo
  document.getElementById("statusOleo").innerHTML = veiculos.map(v => {
    const s = statusManutencao(v);
    return `
      <div class="sv ${s}">
        <div class="sv-name">${v.placa}</div>
        <div class="sv-info">KM atual: ${fmt(v.kmAtual)} | Próxima troca: ${fmt(v.kmProxTroca)} km</div>
        <div class="sv-info">Última troca: ${fmtDt(v.ultimaTroca)} em ${fmt(v.kmTroca)} km</div>
        <div class="sv-badge"><span class="badge ${s}">${statusLabel(v)}</span></div>
      </div>`;
  }).join("");

  // Tabela de histórico
  document.getElementById("tblOleo").innerHTML = trocas.map(t => {
    const vObj = veiculos.find(v => v.placa === t.veiculo);
    const diff = t.kmProxTroca - (vObj ? vObj.kmAtual : t.kmProxTroca);
    const s = diff < 0 ? "danger" : diff < 500 ? "warn" : "ok";
    return `
      <tr>
        <td>${fmtDt(t.data)}</td>
        <td style="font-weight:700;color:#0E2365">${t.veiculo}</td>
        <td>${fmt(t.kmTroca)} km</td>
        <td>${fmt(t.intervalo)} km</td>
        <td>${fmt(t.kmProxTroca)} km</td>
        <td>${vObj ? fmt(vObj.kmAtual) + " km" : "—"}</td>
        <td><span class="badge ${s}">${diff < 0 ? "Atrasada" : "OK"}</span></td>
        <td>${t.obs || "—"}</td>
      </tr>`;
  }).join("");
}

// ─────────────────────────────────────────────────────────────
//  SEÇÃO: ABA ALERTAS
// ─────────────────────────────────────────────────────────────
function renderAlertas(veiculos, resumo) {
  const alertas = [];

  veiculos.forEach(v => {
    const s    = statusManutencao(v);
    const diff = v.kmProxTroca - v.kmAtual;

    if (s === "danger") {
      alertas.push({ c: "al-red",  dot: "#E24B4A", txt: `${v.placa} — troca de óleo ATRASADA (${fmt(Math.abs(diff))} km além do limite configurado)` });
    } else if (s === "warn") {
      alertas.push({ c: "al-warn", dot: "#BA7517", txt: `${v.placa} — troca de óleo em breve (faltam apenas ${fmt(diff)} km)` });
    }

    if (v.consumoKml < 8) {
      alertas.push({ c: "al-warn", dot: "#BA7517", txt: `${v.placa} — consumo abaixo do esperado: ${v.consumoKml.toFixed(1)} km/L (verificar manutenção e pneus)` });
    }

    if (v.custoPkm > 0.85) {
      alertas.push({ c: "al-warn", dot: "#BA7517", txt: `${v.placa} — custo por km elevado: R$ ${v.custoPkm.toFixed(2)}/km (acima da média da frota)` });
    }
  });

  if (alertas.length === 0) {
    alertas.push({ c: "al-ok", dot: "#639922", txt: "Nenhum alerta ativo no período — frota operando dentro dos parâmetros esperados." });
  }

  document.getElementById("alertasList").innerHTML = alertas
    .map(a => `<div class="alert-row ${a.c}"><div class="al-dot" style="background:${a.dot}"></div><span>${a.txt}</span></div>`)
    .join("");
}

// ─────────────────────────────────────────────────────────────
//  SEÇÃO: ABA CRUZAMENTO
// ─────────────────────────────────────────────────────────────
function renderCruzamento(veiculos) {
  const maxKml  = 12;
  const maxCpkm = 1;

  const html = `<div class="cross-card">${veiculos.map(v => {
    const s    = statusManutencao(v);
    const wKml  = Math.min(100, Math.round((v.consumoKml / maxKml) * 100));
    const wCpkm = Math.min(100, Math.round((v.custoPkm  / maxCpkm) * 100));

    const insight = s === "danger" && v.consumoKml < 8
      ? "Alto consumo + manutenção atrasada"
      : s === "ok" && v.consumoKml >= 10
        ? "Econômico + manutenção em dia"
        : s === "danger"
          ? "Manutenção atrasada"
          : v.consumoKml < 8
            ? "Consumo elevado"
            : "Operação normal";

    const ic = s === "danger" && v.consumoKml < 8 ? "danger"
             : s === "ok"    && v.consumoKml >= 10 ? "ok"
             : "warn";

    return `
      <div class="cross-row">
        <div class="cr-name">${v.placa}</div>
        <div class="cr-bars">
          <div class="cr-bar-row">
            <span style="min-width:70px;font-size:11px;color:#666">Consumo</span>
            <div class="cr-bar-wrap"><div class="cr-bar-fill" style="width:${wKml}%;background:#0E2365;height:5px;border-radius:3px"></div></div>
            <span style="min-width:55px;text-align:right;font-size:11px;color:#333">${v.consumoKml.toFixed(1)} km/L</span>
          </div>
          <div class="cr-bar-row" style="margin-top:3px">
            <span style="min-width:70px;font-size:11px;color:#666">Custo/km</span>
            <div class="cr-bar-wrap"><div class="cr-bar-fill" style="width:${wCpkm}%;background:#BA7517;height:5px;border-radius:3px"></div></div>
            <span style="min-width:55px;text-align:right;font-size:11px;color:#333">R$ ${v.custoPkm.toFixed(2)}</span>
          </div>
        </div>
        <div style="min-width:180px;text-align:right"><span class="badge ${ic}">${insight}</span></div>
      </div>`;
  }).join("")}</div>`;

  document.getElementById("crossList").innerHTML = html;
}

// ─────────────────────────────────────────────────────────────
//  BUSCA DETALHADA
// ─────────────────────────────────────────────────────────────
function popularVeiculoSelect(veiculos) {
  const sel = document.getElementById("bVeic");
  sel.innerHTML = '<option value="">Todos os veículos</option>';
  veiculos.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.placa;
    opt.textContent = v.placa;
    sel.appendChild(opt);
  });
}

function updateBuscaUI() {
  const tipo = document.getElementById("tipoBusca").value;
  document.getElementById("fg-data").style.display  = tipo === "data"      ? "flex" : "none";
  document.getElementById("fg-de").style.display    = tipo === "intervalo" ? "flex" : "none";
  document.getElementById("fg-ate").style.display   = tipo === "intervalo" ? "flex" : "none";
  document.getElementById("fg-veic").style.display  = tipo === "veiculo"   ? "flex" : "none";
}

function setQuickPeriod(p) {
  const hoje = new Date();
  const ate  = hoje.toISOString().split("T")[0];

  if (p === "hoje") {
    document.getElementById("tipoBusca").value = "data";
    updateBuscaUI();
    document.getElementById("bData").value = ate;
  } else {
    document.getElementById("tipoBusca").value = "intervalo";
    updateBuscaUI();
    const de = new Date(hoje);
    if      (p === "7")   de.setDate(de.getDate() - 7);
    else if (p === "30")  de.setDate(de.getDate() - 30);
    else if (p === "ano") de.setFullYear(de.getFullYear() - 1);
    document.getElementById("bDe").value  = de.toISOString().split("T")[0];
    document.getElementById("bAte").value = ate;
  }

  executarBusca();
}

async function executarBusca() {
  const tipo    = document.getElementById("tipoBusca").value;
  const tipoReg = document.getElementById("bTipo").value;

  const params = { tipo, tipoReg };
  if (tipo === "data")      params.data = document.getElementById("bData").value;
  if (tipo === "intervalo") { params.de = document.getElementById("bDe").value; params.ate = document.getElementById("bAte").value; }
  if (tipo === "veiculo")   params.veiculo = document.getElementById("bVeic").value;

  try {
    const dados = await fetchBusca(params);
    renderResultadoBusca(dados, params);
  } catch (err) {
    document.getElementById("buscaResult").innerHTML = '<p style="color:#791F1F;padding:10px">Erro ao buscar dados.</p>';
  }
}

function renderResultadoBusca(dados, params) {
  const tipoReg = params.tipoReg;
  let html = "";

  // Se busca por veículo, mostra KPIs do veículo + tabela
  if (params.tipo === "veiculo" && params.veiculo) {
    const vObj = dados.veiculos.find(v => v.placa === params.veiculo) || dados.veiculos[0];
    const abVeic = dados.abastecimentos.filter(a => !params.veiculo || a.veiculo === params.veiculo);

    html += `<div class="chart-card" style="margin-bottom:12px">
      <div class="chart-title">Relatório do veículo ${params.veiculo || "todos"}</div>
      <div class="kpi-grid" style="margin:10px 0">
        <div class="kpi"><div class="kpi-val">${fmtBRL(vObj.gastoTotal)}</div><div class="kpi-lbl">Gasto total</div></div>
        <div class="kpi"><div class="kpi-val">${vObj.litros} L</div><div class="kpi-lbl">Litros totais</div></div>
        <div class="kpi"><div class="kpi-val">${vObj.consumoKml.toFixed(1)} km/L</div><div class="kpi-lbl">Consumo médio</div></div>
        <div class="kpi"><div class="kpi-val">R$ ${vObj.custoPkm.toFixed(2)}</div><div class="kpi-lbl">Custo por km</div></div>
      </div>`;

    if (tipoReg !== "oleo") {
      html += `<div style="margin-top:10px;font-size:12px;font-weight:700;color:#223A8E;margin-bottom:6px">Abastecimentos</div>
        <div class="table-wrap"><table class="rt"><thead><tr><th>Data/hora</th><th>Responsável</th><th>Combustível</th><th>Litros</th><th>Valor</th><th>KM</th><th>Posto</th></tr></thead>
        <tbody>${abVeic.map(r => `<tr><td>${fmtDtHr(r.dataHora)}</td><td>${r.responsavel}</td><td>${r.combustivel}</td><td>${r.litros} L</td><td>${fmtBRL(r.valorTotal)}</td><td>${fmt(r.kmAbastecimento)} km</td><td>${r.postoNome}, ${r.postoCidade}</td></tr>`).join("")}</tbody></table></div>`;
    }

    html += `</div>`;
  } else {
    // Busca por data ou intervalo
    html += `<div class="chart-card" style="margin-bottom:12px"><div class="chart-title">Resultados da busca</div>`;

    if (tipoReg !== "oleo") {
      html += `<div style="margin-top:10px;font-size:12px;font-weight:700;color:#223A8E;margin-bottom:6px">Abastecimentos</div>
        <div class="table-wrap"><table class="rt"><thead><tr><th>Data/hora</th><th>Veículo</th><th>Responsável</th><th>Combustível</th><th>Litros</th><th>Valor</th><th>KM</th></tr></thead>
        <tbody>${dados.abastecimentos.map(r => `<tr><td>${fmtDtHr(r.dataHora)}</td><td style="font-weight:700;color:#0E2365">${r.veiculo}</td><td>${r.responsavel}</td><td>${r.combustivel}</td><td>${r.litros} L</td><td>${fmtBRL(r.valorTotal)}</td><td>${fmt(r.kmAbastecimento)} km</td></tr>`).join("")}</tbody></table></div>`;
    }

    if (tipoReg !== "abast") {
      html += `<div style="margin-top:14px;font-size:12px;font-weight:700;color:#223A8E;margin-bottom:6px">Trocas de óleo</div>
        <div class="table-wrap"><table class="rt"><thead><tr><th>Data</th><th>Veículo</th><th>KM da troca</th><th>Próxima troca</th><th>Situação</th><th>Obs.</th></tr></thead>
        <tbody>${dados.trocasOleo.map(t => { const vObj = dados.veiculos.find(v => v.placa === t.veiculo); const diff = t.kmProxTroca - (vObj ? vObj.kmAtual : t.kmProxTroca); const s = diff < 0 ? "danger" : diff < 500 ? "warn" : "ok"; return `<tr><td>${fmtDt(t.data)}</td><td style="font-weight:700;color:#0E2365">${t.veiculo}</td><td>${fmt(t.kmTroca)}</td><td>${fmt(t.kmProxTroca)}</td><td><span class="badge ${s}">${diff < 0 ? "Atrasada" : "OK"}</span></td><td>${t.obs || "—"}</td></tr>`; }).join("")}</tbody></table></div>`;
    }

    html += `</div>`;
  }

  html += `<div class="dl-bar"><span class="dl-lbl">Exportar resultado:</span>
    <button class="dl-btn" data-fmt="pdf">PDF</button>
    <button class="dl-btn" data-fmt="csv">CSV</button>
    <button class="dl-btn" data-fmt="excel">Excel (.xlsx)</button>
    <button class="dl-btn" data-fmt="docx">Word (.docx)</button>
  </div>`;

  document.getElementById("buscaResult").innerHTML = html;

  // Re-associa eventos nos botões de download gerados dinamicamente
  document.querySelectorAll("#buscaResult .dl-btn").forEach(btn => {
    btn.addEventListener("click", () => downloadRelatorio(btn.dataset.fmt, params));
  });
}

// ─────────────────────────────────────────────────────────────
//  DOWNLOAD
//  Endpoint: GET /relatorios/abastecimento/download?...params
// ─────────────────────────────────────────────────────────────
function downloadRelatorio(formato, params = {}) {
  const periodo = document.getElementById("periodGlobal").value;

  if (USE_MOCK) {
    alert(
      "Download solicitado!\n\n" +
      "Formato: " + formato.toUpperCase() + "\n" +
      "Período: " + periodo + "\n\n" +
      "No sistema real chamaria:\n" +
      "GET /relatorios/abastecimento/download?formato=" + formato + "&periodo=" + periodo
    );
    return;
  }

  const qs = new URLSearchParams({ formato, periodo, ...params }).toString();
  const link = document.createElement("a");
  link.href = `${API_BASE}/relatorios/abastecimento/download?${qs}`;
  link.setAttribute("download", `relatorio_abastecimento_${periodo}.${formato}`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─────────────────────────────────────────────────────────────
//  MENU DROPDOWN E HAMBURGER
// ─────────────────────────────────────────────────────────────
document.querySelectorAll(".dropdown-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const sub   = btn.nextElementSibling;
    const arrow = btn.querySelector(".arrow");
    document.querySelectorAll(".submenu").forEach(m => m.classList.remove("open"));
    document.querySelectorAll(".arrow").forEach(a => a.classList.remove("rotate"));
    sub.classList.toggle("open");
    arrow.classList.toggle("rotate");
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".submenu").forEach(m => m.classList.remove("open"));
  document.querySelectorAll(".arrow").forEach(a => a.classList.remove("rotate"));
});

document.getElementById("btnMenu")?.addEventListener("click", () => {
  document.getElementById("navPrincipal").classList.toggle("active");
});

// ─────────────────────────────────────────────────────────────
//  EVENTOS
// ─────────────────────────────────────────────────────────────
// Filtro de período
document.getElementById("periodGlobal").addEventListener("change", updateAll);

// Abas
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".pane").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("pane-" + tab.dataset.tab).classList.add("active");
  });
});

// Busca detalhada
document.getElementById("tipoBusca").addEventListener("change", updateBuscaUI);
document.getElementById("btnBuscar").addEventListener("click", executarBusca);
document.getElementById("searchInput")?.addEventListener("keydown", e => { if (e.key === "Enter") executarBusca(); });

// Quick buttons de período na busca
document.querySelectorAll(".qbtn").forEach(btn => {
  btn.addEventListener("click", () => setQuickPeriod(btn.dataset.qb));
});

// Botões de download
document.querySelectorAll(".dl-btn").forEach(btn => {
  btn.addEventListener("click", () => downloadRelatorio(btn.dataset.fmt));
});

// ─────────────────────────────────────────────────────────────
//  INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
updateBuscaUI();
updateAll();
