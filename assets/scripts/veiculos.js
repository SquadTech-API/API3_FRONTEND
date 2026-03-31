// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8080";

// ─── ESTADO ───────────────────────────────────────────────────────────────────
let todosVeiculos = [];
let filtroAtual = "todas";
let buscaAtual = "";

// ─── ELEMENTOS ────────────────────────────────────────────────────────────────
const container = document.getElementById("cards-container");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("empty-state");

// Busca (desktop + mobile)
const searchAdm = document.getElementById("txf-search-adm");
const searchMobile = document.getElementById("txf-search-mobile");
const btnSearchAdm = document.getElementById("btn-search-adm");
const btnSearchMobile = document.getElementById("btn-search-mobile");

// Filtros desktop
const btnTodas = document.getElementById("btn-todos-adm");
const btnDisp = document.getElementById("btn-disp-adm");
const btnUso = document.getElementById("btn-uso-adm");

// Filtros mobile
const btnTodasMobile = document.getElementById("btn-todos-mobile");
const btnDispMobile = document.getElementById("btn-disp-mobile");
const btnUsoMobile = document.getElementById("btn-uso-mobile");

// Bottom nav mobile
const btnVeiculosMobile = document.getElementById("btn-veiculos-mobile");
const btnAbastecerMobile = document.getElementById("btn-abastecer-mobile");
const btnSaidasMobile = document.getElementById("btn-saidas-mobile");

// Logout / perfil
const btnLogoutMobile = document.getElementById("btn-logout-mobile");
const btnPerfilAdm = document.getElementById("btn-perfil-adm");

// ─── VERIFICAÇÃO DE SESSÃO ────────────────────────────────────────────────────
const usuario = JSON.parse(sessionStorage.getItem("usuario"));
if (!usuario) window.location.href = "./index.html";

// ─── BUSCAR VEÍCULOS DA API ───────────────────────────────────────────────────
async function carregarVeiculos() {
  mostrarLoading(true);
  try {
    const response = await fetch(`${API_BASE}/veiculos`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Erro ao buscar veículos");

    todosVeiculos = await response.json();
    renderizarCards();
  } catch (erro) {
    console.error("Erro ao carregar veículos:", erro);
    // Dados mockados para desenvolvimento enquanto a API não tem o endpoint
    todosVeiculos = mockVeiculos();
    renderizarCards();
  } finally {
    mostrarLoading(false);
  }
}

// ─── MOCK (remova quando a API estiver pronta) ────────────────────────────────
function mockVeiculos() {
  return [
    {
      id: 1,
      modelo: "SPIN",
      prefixo: "fjv-23",
      ultimoUso: "10/03/26",
      ultimoAbastecimento: "09/03/26",
      km: "57.280",
      status: "disponivel",
    },
    {
      id: 2,
      modelo: "GOL",
      prefixo: "ipe-24",
      ultimoUso: "09/03/26",
      ultimoAbastecimento: "02/03/26",
      km: "20.123",
      status: "disponivel",
    },
    {
      id: 3,
      modelo: "ONIX",
      prefixo: "iop-20",
      ultimoUso: "09/03/26",
      ultimoAbastecimento: "09/03/26",
      km: "12.300",
      status: "disponivel",
    },
    {
      id: 4,
      modelo: "S-10",
      prefixo: "tie-19",
      ultimoUso: "12/03/26",
      ultimoAbastecimento: "02/03/26",
      km: "98.180",
      status: "em_uso",
    },
    {
      id: 5,
      modelo: "GOL",
      prefixo: "fjk-25",
      ultimoUso: "01/03/26",
      ultimoAbastecimento: "27/02/26",
      km: "102.100",
      status: "disponivel",
    },
    {
      id: 6,
      modelo: "SPIN",
      prefixo: "liq-03",
      ultimoUso: "28/02/26",
      ultimoAbastecimento: "27/02/26",
      km: "72.098",
      status: "disponivel",
    },
  ];
}

// ─── RENDERIZAR CARDS ─────────────────────────────────────────────────────────
function renderizarCards() {
  // Remove somente os cards anteriores, mantendo loading e empty-state
  container.querySelectorAll(".veiculo-card").forEach((c) => c.remove());

  const filtrados = filtrarVeiculos();

  if (filtrados.length === 0) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";

  filtrados.forEach((veiculo, index) => {
    container.appendChild(criarCard(veiculo, index));
  });
}

// ─── FILTRAR ──────────────────────────────────────────────────────────────────
function filtrarVeiculos() {
  return todosVeiculos.filter((v) => {
    const matchFiltro = filtroAtual === "todas" || v.status === filtroAtual;

    const matchBusca =
      buscaAtual === "" ||
      v.modelo.toLowerCase().includes(buscaAtual.toLowerCase()) ||
      v.prefixo.toLowerCase().includes(buscaAtual.toLowerCase());

    return matchFiltro && matchBusca;
  });
}

// ─── CRIAR CARD ───────────────────────────────────────────────────────────────
function criarCard(veiculo, index) {
  const eEmUso = veiculo.status === "em_uso";

  const card = document.createElement("div");
  card.className = `veiculo-card${eEmUso ? " em-uso" : ""}`;
  card.style.animationDelay = `${index * 0.06}s`;

  // Cards em uso não são clicáveis nem focáveis via teclado
  if (!eEmUso) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute(
      "aria-label",
      `Ver detalhes do ${veiculo.modelo} — viatura ${veiculo.prefixo}`,
    );
  }

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
          <div class="card-modelo">${veiculo.modelo}</div>
          <div class="card-viatura">viatura: ${veiculo.prefixo}</div>
        </div>
      </div>
    </div>

    <div class="card-body">
      <div class="card-info-row">
        <span class="card-info-label">Último uso em:</span>
        <span class="card-info-value">${veiculo.ultimoUso || "—"}</span>
      </div>
      <div class="card-info-row">
        <span class="card-info-label">Último abastecimento:</span>
        <span class="card-info-value">${veiculo.ultimoAbastecimento || "—"}</span>
      </div>
      <div class="card-info-row">
        <span class="card-info-label">KM:</span>
        <span class="card-info-value">${veiculo.km || "—"}</span>
      </div>
    </div>

    <div class="card-footer">
      <div class="card-status ${eEmUso ? "em_uso" : "disponivel"}">
        <span class="status-dot ${eEmUso ? "em_uso" : "disponivel"}"></span>
        ${eEmUso ? "Em uso" : "Disponível"}
      </div>
      ${!eEmUso ? `<div class="card-arrow">▶</div>` : ""}
    </div>
  `;

  // Somente veículos disponíveis recebem listener de clique / teclado
  if (!eEmUso) {
    card.addEventListener("click", () => selecionarVeiculo(veiculo));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") selecionarVeiculo(veiculo);
    });
  }

  return card;
}

// ─── SELECIONAR VEÍCULO ───────────────────────────────────────────────────────
function selecionarVeiculo(veiculo) {
  // Persiste os dados do veículo para a próxima tela
  sessionStorage.setItem("veiculoSelecionado", JSON.stringify(veiculo));
  window.location.href = `./nova_saida.html`;
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function mostrarLoading(show) {
  loading.style.display = show ? "flex" : "none";
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────
function setFiltro(filtro) {
  filtroAtual = filtro;

  // Reseta todos os botões de filtro (desktop + mobile)
  [
    btnTodas,
    btnDisp,
    btnUso,
    btnTodasMobile,
    btnDispMobile,
    btnUsoMobile,
  ].forEach((b) => b?.classList.remove("active"));

  // Ativa o botão correto nos dois contextos
  if (filtro === "todas") {
    btnTodas?.classList.add("active");
    btnTodasMobile?.classList.add("active");
  }
  if (filtro === "disponivel") {
    btnDisp?.classList.add("active");
    btnDispMobile?.classList.add("active");
  }
  if (filtro === "em_uso") {
    btnUso?.classList.add("active");
    btnUsoMobile?.classList.add("active");
  }

  renderizarCards();
}

btnTodas?.addEventListener("click", () => setFiltro("todas"));
btnDisp?.addEventListener("click", () => setFiltro("disponivel"));
btnUso?.addEventListener("click", () => setFiltro("em_uso"));

btnTodasMobile?.addEventListener("click", () => setFiltro("todas"));
btnDispMobile?.addEventListener("click", () => setFiltro("disponivel"));
btnUsoMobile?.addEventListener("click", () => setFiltro("em_uso"));

// ─── BUSCA ────────────────────────────────────────────────────────────────────
function executarBusca(valor) {
  buscaAtual = valor.trim();
  renderizarCards();
}

btnSearchAdm?.addEventListener("click", () => executarBusca(searchAdm.value));
btnSearchMobile?.addEventListener("click", () =>
  executarBusca(searchMobile.value),
);

searchAdm?.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || searchAdm.value === "")
    executarBusca(searchAdm.value);
});

searchMobile?.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || searchMobile.value === "")
    executarBusca(searchMobile.value);
});

// ─── BOTTOM NAV MOBILE ────────────────────────────────────────────────────────
btnAbastecerMobile?.addEventListener("click", () => {
  window.location.href = "./abastecer.html";
});

btnSaidasMobile?.addEventListener("click", () => {
  window.location.href = "./saidas.html";
});

// ─── LOGOUT / PERFIL ──────────────────────────────────────────────────────────
btnLogoutMobile?.addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "./index.html";
});

btnPerfilAdm?.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.clear();
  window.location.href = "./index.html";
});

// ─── DROPDOWN MENU (desktop) ──────────────────────────────────────────────────
document.querySelectorAll(".dropdown").forEach((dropdown) => {
  const btn = dropdown.querySelector(".dropdown-btn");
  const submenu = dropdown.querySelector(".submenu");
  const arrow = btn.querySelector(".arrow");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const estaAberto = submenu.classList.contains("open");

    // Fecha todos antes de abrir o atual
    document
      .querySelectorAll(".submenu")
      .forEach((s) => s.classList.remove("open"));
    document
      .querySelectorAll(".dropdown-btn .arrow")
      .forEach((a) => a.classList.remove("rotate"));

    if (!estaAberto) {
      submenu.classList.add("open");
      arrow.classList.add("rotate");
    }
  });
});

// Fecha dropdowns ao clicar fora
document.addEventListener("click", () => {
  document
    .querySelectorAll(".submenu")
    .forEach((s) => s.classList.remove("open"));
  document
    .querySelectorAll(".dropdown-btn .arrow")
    .forEach((a) => a.classList.remove("rotate"));
});

// ─── HAMBURGER / MOBILE NAV ───────────────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");

hamburger?.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  mobileNav.classList.toggle("open");
});

// Sub-menus dentro do mobile nav
document.querySelectorAll(".mobile-section-title").forEach((title) => {
  title.addEventListener("click", () => {
    const targetId = title.dataset.target;
    const sub = document.getElementById(targetId);
    const arrow = title.querySelector(".arrow");

    sub.classList.toggle("open");
    arrow.classList.toggle("rotate");
  });
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
carregarVeiculos();
