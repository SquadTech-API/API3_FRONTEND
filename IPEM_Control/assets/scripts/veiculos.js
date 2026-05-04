// ═══════════════════════════════════════════════════════════════
//  veiculos.js — Tela de Seleção de Viatura
//  - Mock completo
//  - Filtro por habilitação do usuário
//  - Verificação de saída ativa
//  - Redirecionamento para nova-saida após seleção
//  - Modal de erro padronizado
// ═══════════════════════════════════════════════════════════════

// ── MOCK DE VEÍCULOS ────────────────────────────────────────────
const MOCK_VEICULOS = [
  {
    idVeiculo: 1,
    modelo: "SPIN",
    prefixo: "FJV-01",
    marca: "CHEVROLET",
    ano: 2021,
    tipoCombustivel: "flex",
    habilitacaoCategoria: "B",
    kmAtual: 52495,
    ultimoUso: "08/04/25",
    ultimoMotorista: "Carlos Eduardo Silva",
    ultimoAbastecimento: "10/01/25",
    km: "52.495",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 2,
    modelo: "HB20",
    prefixo: "FJV-02",
    marca: "HYUNDAI",
    ano: 2022,
    tipoCombustivel: "flex",
    habilitacaoCategoria: "B",
    kmAtual: 28310,
    ultimoUso: "10/02/25",
    ultimoMotorista: "Fernanda Lima Souza",
    ultimoAbastecimento: "03/02/25",
    km: "28.310",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 3,
    modelo: "HILUX",
    prefixo: "FJV-03",
    marca: "TOYOTA",
    ano: 2020,
    tipoCombustivel: "diesel",
    habilitacaoCategoria: "B",
    kmAtual: 89850,
    ultimoUso: "05/03/25",
    ultimoMotorista: "Roberto Alves Costa",
    ultimoAbastecimento: "18/02/25",
    km: "89.850",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 4,
    modelo: "MASTER",
    prefixo: "FJV-04",
    marca: "RENAULT",
    ano: 2019,
    tipoCombustivel: "diesel",
    habilitacaoCategoria: "D",
    kmAtual: 145200,
    ultimoUso: "—",
    ultimoMotorista: "—",
    ultimoAbastecimento: "—",
    km: "145.200",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 5,
    modelo: "ONIX",
    prefixo: "FJV-05",
    marca: "CHEVROLET",
    ano: 2023,
    tipoCombustivel: "flex",
    habilitacaoCategoria: "B",
    kmAtual: 15560,
    ultimoUso: "14/04/25",
    ultimoMotorista: "Mariana Oliveira",
    ultimoAbastecimento: "20/03/25",
    km: "15.560",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 6,
    modelo: "KWID",
    prefixo: "FJV-06",
    marca: "RENAULT",
    ano: 2022,
    tipoCombustivel: "flex",
    habilitacaoCategoria: "B",
    kmAtual: 33600,
    ultimoUso: "—",
    ultimoMotorista: "—",
    ultimoAbastecimento: "—",
    km: "33.600",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 7,
    modelo: "RANGER",
    prefixo: "FJV-07",
    marca: "FORD",
    ano: 2021,
    tipoCombustivel: "diesel",
    habilitacaoCategoria: "B",
    kmAtual: 66050,
    ultimoUso: "02/04/25",
    ultimoMotorista: "Thiago Nascimento",
    ultimoAbastecimento: "02/04/25",
    km: "66.050",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 8,
    modelo: "CARRO FORTE",
    prefixo: "FJV-08",
    marca: "VW",
    ano: 2018,
    tipoCombustivel: "diesel",
    habilitacaoCategoria: "D",
    kmAtual: 201000,
    ultimoUso: "—",
    ultimoMotorista: "—",
    ultimoAbastecimento: "—",
    km: "201.000",
    status: "disponivel",
    ativo: true,
  },
  {
    idVeiculo: 9,
    modelo: "TRACKER",
    prefixo: "FJV-09",
    marca: "CHEVROLET",
    ano: 2023,
    tipoCombustivel: "flex",
    habilitacaoCategoria: "B",
    kmAtual: 9800,
    ultimoUso: "30/04/25",
    ultimoMotorista: "Mariana Oliveira",
    ultimoAbastecimento: "30/04/25",
    km: "9.800",
    status: "em_uso",
    ativo: true,
  },
  {
    idVeiculo: 10,
    modelo: "PALIO",
    prefixo: "FJV-10",
    marca: "FIAT",
    ano: 2015,
    tipoCombustivel: "gasolina",
    habilitacaoCategoria: "B",
    kmAtual: 312000,
    ultimoUso: "—",
    ultimoMotorista: "—",
    ultimoAbastecimento: "—",
    km: "312.000",
    status: "disponivel",
    ativo: false,
  },
];

// ── MOCK DE SAÍDA ATIVA ─────────────────────────────────────────
// Simula que o usuário 2 (Carlos) tem saída em aberto no veículo 9
const MOCK_SAIDA_ATIVA = null; // null = sem saída ativa
// Para testar redirecionamento automático, use:
// const MOCK_SAIDA_ATIVA = { idSaida:15, status:'em_andamento', veiculo:MOCK_VEICULOS[8] };

// ── PROTEÇÃO DE ROTA ────────────────────────────────────────────
if (!exigirLogin()) {
  /* redireciona */
}

const usuario = getUsuario();
const adm = isAdm();
const habUser = getHabilitacao();

// ── ESTADO ─────────────────────────────────────────────────────
let todosVeiculos = [];
let filtroAtual = "todas";
let buscaAtual = "";

// ── ELEMENTOS ──────────────────────────────────────────────────
const container = document.getElementById("cards-container");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("empty-state");
const searchAdm = document.getElementById("txf-search-adm");
const searchMobile = document.getElementById("txf-search-mobile");
const btnSearchAdm = document.getElementById("btn-search-adm");
const btnSearchMob = document.getElementById("btn-search-mobile");
const btnTodas = document.getElementById("btn-todos-adm");
const btnDisp = document.getElementById("btn-disp-adm");
const btnUso = document.getElementById("btn-uso-adm");
const btnTodasMob = document.getElementById("btn-todos-mobile");
const btnDispMob = document.getElementById("btn-disp-mobile");
const btnUsoMob = document.getElementById("btn-uso-mobile");
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");
const btnLogoutMob = document.getElementById("btn-logout-mobile");

// ── MENU ────────────────────────────────────────────────────────
initMenu();
ajustarMenuPorPerfil();

// Exibe seções ADM no mobile
if (adm) {
  document.getElementById("mob-sec-cadastrar")?.removeAttribute("style");
  document.getElementById("mob-sec-gerenciamento")?.removeAttribute("style");
} else {
  // Esconde relatórios ADM no mobile
  ["mob-rel-viatura", "mob-rel-tecnicos", "mob-rel-abast"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

// Hamburger
hamburger?.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  mobileNav?.classList.toggle("open");
});
document.querySelectorAll(".mobile-section-title").forEach((t) => {
  t.addEventListener("click", () => {
    const sub = document.getElementById(t.dataset.target);
    sub?.classList.toggle("open");
    t.querySelector(".arrow")?.classList.toggle("rotate");
  });
});

// Logout
btnLogoutMob?.addEventListener("click", logout);

// ── VERIFICAR SAÍDA ATIVA ───────────────────────────────────────
async function verificarSaidaAtiva() {
  const permiteNavegar = sessionStorage.getItem("permiteNavegar") === "true";
  sessionStorage.removeItem("permiteNavegar");
  if (permiteNavegar) return;

  const matricula = getMatricula();
  if (!matricula) return;

  try {
    let saida;

    if (MOCK_MODE) {
      saida = MOCK_SAIDA_ATIVA;
    } else {
      const resp = await fetch(
        `${API_BASE}/registro-saidas/ativo-usuario?matricula=${matricula}`,
        { headers: getAuthHeaders() },
      );
      if (resp.status === 404 || !resp.ok) return;
      saida = await resp.json();
    }

    if (!saida || saida.status !== "em_andamento") return;

    // Salva dados e redireciona
    sessionStorage.setItem("idSaida", saida.idSaida);
    sessionStorage.setItem("veiculoSelecionadoId", saida.veiculo?.idVeiculo);
    sessionStorage.setItem(
      "veiculoSelecionado",
      JSON.stringify(saida.veiculo || {}),
    );
    localStorage.setItem("idSaida", saida.idSaida);
    localStorage.setItem("veiculoSelecionadoId", saida.veiculo?.idVeiculo);

    window.location.href = "./nova-entrada.html";
  } catch {
    /* silencioso */
  }
}

// ── CARREGAR VEÍCULOS ───────────────────────────────────────────
async function carregarVeiculos() {
  mostrarLoading(true);
  try {
    let lista;

    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      lista = adm
        ? MOCK_VEICULOS
        : MOCK_VEICULOS.filter((v) => v.ativo !== false);
    } else {
      const url = adm
        ? `${API_BASE}/veiculos?todos=true`
        : `${API_BASE}/veiculos`;
      const resp = await fetch(url, { headers: getAuthHeaders() });
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const dados = await resp.json();
      lista = Array.isArray(dados) ? dados : dados.content || [];
    }

    todosVeiculos = lista;
    renderizarCards();
  } catch (err) {
    container.innerHTML = `<p style="grid-column:1/-1;padding:2rem;color:#888;text-align:center;">
      Erro ao carregar veículos.<br><small>${err.message}</small></p>`;
  } finally {
    mostrarLoading(false);
  }
}

// ── RENDERIZAR ──────────────────────────────────────────────────
function renderizarCards() {
  container.querySelectorAll(".veiculo-card").forEach((c) => c.remove());
  const filtrados = filtrarVeiculos();

  if (filtrados.length === 0) {
    emptyState.style.display = "flex";
    return;
  }
  emptyState.style.display = "none";
  filtrados.forEach((v, i) => container.appendChild(criarCard(v, i)));
}

function filtrarVeiculos() {
  return todosVeiculos.filter((v) => {
    // Técnico não vê inativos
    if (!adm && v.ativo === false) return false;

    // CORRIGIDO: técnico só vê veículos compatíveis com sua habilitação.
    // Isso vale inclusive para veículos em uso — um técnico CNH B não deve
    // ver nem clicar em um veículo CNH D mesmo que esteja em uso por outro.
    if (!adm) {
      if (!podeConduzir(v.habilitacaoCategoria, habUser)) return false;
    }

    const matchFiltro = filtroAtual === "todas" || v.status === filtroAtual;
    const matchBusca =
      buscaAtual === "" ||
      (v.modelo || "").toLowerCase().includes(buscaAtual.toLowerCase()) ||
      (v.prefixo || "").toLowerCase().includes(buscaAtual.toLowerCase());

    return matchFiltro && matchBusca;
  });
}

function criarCard(veiculo, index) {
  const eEmUso = veiculo.status === "em_uso";
  const eInativo = veiculo.ativo === false;
  const podeDirigir = podeConduzir(veiculo.habilitacaoCategoria, habUser);
  const bloqueado = eEmUso || eInativo || (!adm && !podeDirigir);

  const card = document.createElement("div");
  card.className = `veiculo-card${bloqueado ? " em-uso" : ""}`;
  card.style.animationDelay = `${index * 0.05}s`;
  if (!bloqueado) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
  }

  const habBadge = veiculo.habilitacaoCategoria
    ? `<span class="hab-badge">CNH ${veiculo.habilitacaoCategoria}</span>`
    : "";

  const inativoBadge = eInativo
    ? `<span class="inativo-badge">INATIVO</span>`
    : "";

  const statusCls = eEmUso ? "em_uso" : eInativo ? "inativo" : "disponivel";
  const statusTxt = eEmUso ? "Em uso" : eInativo ? "Inativo" : "Disponível";

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
          <div class="card-viatura">Viatura: ${veiculo.prefixo || "—"}</div>
          <div class="card-modelo">${veiculo.modelo || "—"}${inativoBadge}</div>
          
        </div>
      </div>
      ${habBadge}
    </div>
    <div class="card-body">
      <div class="card-info-row">
        <span class="card-info-label">Último uso:</span>
        <span class="card-info-value">${veiculo.ultimoUso || "—"}</span>
      </div>
      <div class="card-info-row">
        <span class="card-info-label">Último abastecimento:</span>
        <span class="card-info-value">${veiculo.ultimoAbastecimento || "—"}</span>
      </div>
      <div class="card-info-row">
        <span class="card-info-label">KM atual:</span>
        <span class="card-info-value">${veiculo.km || "—"}</span>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-status ${statusCls}">
        <span class="status-dot ${statusCls}"></span>
        ${statusTxt}
      </div>
      ${!bloqueado ? '<span class="card-arrow">›</span>' : ""}
    </div>
  `;

  if (!bloqueado) {
    card.addEventListener("click", () => selecionarVeiculo(veiculo));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") selecionarVeiculo(veiculo);
    });
  }

  return card;
}

function selecionarVeiculo(veiculo) {
  sessionStorage.setItem("veiculoSelecionadoId", veiculo.idVeiculo);
  sessionStorage.setItem("veiculoSelecionado", JSON.stringify(veiculo));
  localStorage.setItem("veiculoSelecionadoId", veiculo.idVeiculo);
  localStorage.setItem("veiculoSelecionado", JSON.stringify(veiculo));
  window.location.href = "./nova-saida.html";
}

// ── LOADING ─────────────────────────────────────────────────────
function mostrarLoading(show) {
  if (loading) loading.style.display = show ? "flex" : "none";
}

// ── FILTROS ─────────────────────────────────────────────────────
function setFiltro(filtro) {
  filtroAtual = filtro;
  [btnTodas, btnDisp, btnUso, btnTodasMob, btnDispMob, btnUsoMob].forEach((b) =>
    b?.classList.remove("active"),
  );
  if (filtro === "todas") {
    btnTodas?.classList.add("active");
    btnTodasMob?.classList.add("active");
  }
  if (filtro === "disponivel") {
    btnDisp?.classList.add("active");
    btnDispMob?.classList.add("active");
  }
  if (filtro === "em_uso") {
    btnUso?.classList.add("active");
    btnUsoMob?.classList.add("active");
  }
  renderizarCards();
}

btnTodas?.addEventListener("click", () => setFiltro("todas"));
btnDisp?.addEventListener("click", () => setFiltro("disponivel"));
btnUso?.addEventListener("click", () => setFiltro("em_uso"));
btnTodasMob?.addEventListener("click", () => setFiltro("todas"));
btnDispMob?.addEventListener("click", () => setFiltro("disponivel"));
btnUsoMob?.addEventListener("click", () => setFiltro("em_uso"));

// ── BUSCA ───────────────────────────────────────────────────────
const executarBusca = (v) => {
  buscaAtual = v.trim();
  renderizarCards();
};
btnSearchAdm?.addEventListener("click", () => executarBusca(searchAdm.value));
btnSearchMob?.addEventListener("click", () =>
  executarBusca(searchMobile.value),
);
searchAdm?.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || !searchAdm.value) executarBusca(searchAdm.value);
});
searchMobile?.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || !searchMobile.value)
    executarBusca(searchMobile.value);
});

// ── INÍCIO ──────────────────────────────────────────────────────
(async () => {
  await verificarSaidaAtiva();
  carregarVeiculos();
})();
