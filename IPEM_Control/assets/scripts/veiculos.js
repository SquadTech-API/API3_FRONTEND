// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8080";

// ─── ESTADO ───────────────────────────────────────────────────────────────────
let todosVeiculos = [];
let filtroAtual   = "todas";
let buscaAtual    = "";

// ─── ELEMENTOS ────────────────────────────────────────────────────────────────
const container          = document.getElementById("cards-container");
const loading            = document.getElementById("loading");
const emptyState         = document.getElementById("empty-state");
const searchAdm          = document.getElementById("txf-search-adm");
const searchMobile       = document.getElementById("txf-search-mobile");
const btnSearchAdm       = document.getElementById("btn-search-adm");
const btnSearchMobile    = document.getElementById("btn-search-mobile");
const btnTodas           = document.getElementById("btn-todos-adm");
const btnDisp            = document.getElementById("btn-disp-adm");
const btnUso             = document.getElementById("btn-uso-adm");
const btnTodasMobile     = document.getElementById("btn-todos-mobile");
const btnDispMobile      = document.getElementById("btn-disp-mobile");
const btnUsoMobile       = document.getElementById("btn-uso-mobile");
const btnAbastecerMobile = document.getElementById("btn-abastecer-mobile");
const btnSaidasMobile    = document.getElementById("btn-saidas-mobile");
const btnLogoutMobile    = document.getElementById("btn-logout-mobile");
const btnPerfilAdm       = document.getElementById("btn-perfil-adm");

// ─── VERIFICAÇÃO DE SESSÃO ────────────────────────────────────────────────────
const usuarioLogado = JSON.parse(sessionStorage.getItem("usuario"));
if (!usuarioLogado) window.location.href = "./index.html";

// ─── HEADERS ─────────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function getMatriculaUsuario() {
  const raw = sessionStorage.getItem("matricula") || localStorage.getItem("matricula");
  if (raw) return parseInt(raw, 10);
  return usuarioLogado?.matricula || null;
}

// ─── VERIFICAR SAÍDA ATIVA ────────────────────────────────────────────────────
// Lógica:
//   - Se o flag "permiteNavegar" estiver setado → o usuário veio intencionalmente
//     de nova_entrada (clicou Voltar ou Descartar). Consome o flag e NÃO redireciona.
//   - Se não tiver o flag e o usuário tiver saída ativa → redireciona para nova_entrada.
//   - Se não tiver saída ativa → fluxo normal.
//
// O flag é gravado pela função sairDaTela() em nova_entrada.js e é de uso único.
async function verificarSaidaAtivaDoUsuario() {
  const matricula = getMatriculaUsuario();
  if (!matricula) return;

  
  const permiteNavegar = sessionStorage.getItem("permiteNavegar") === "true";
  sessionStorage.removeItem("permiteNavegar");

  if (permiteNavegar) {
    return;
  }

  try {
    const resp = await fetch(
      `${API_BASE}/registro-saidas/ativo-usuario?matricula=${matricula}`,
      { headers: getAuthHeaders() }
    );

    if (resp.status === 404) return; // sem saída ativa → fluxo normal

    if (!resp.ok) {
      console.warn("[verificarSaidaAtivaDoUsuario] status:", resp.status);
      return;
    }

    const saida = await resp.json();
    if (!saida || saida.status !== "em_andamento") return;

    // Salva dados da saída para nova_entrada.js
    const idVeiculo = saida.veiculo?.idVeiculo ?? null;
    sessionStorage.setItem("idSaida",              saida.idSaida);
    sessionStorage.setItem("veiculoSelecionadoId", idVeiculo);
    sessionStorage.setItem("veiculoSelecionado",   JSON.stringify(saida.veiculo || {}));
    localStorage.setItem("idSaida",                saida.idSaida);
    localStorage.setItem("veiculoSelecionadoId",   idVeiculo);

    window.location.href = "./nova_entrada.html";

  } catch (err) {
    console.warn("[verificarSaidaAtivaDoUsuario] erro de rede:", err.message);
  }
}

// ─── BUSCAR VEÍCULOS ──────────────────────────────────────────────────────────
async function carregarVeiculos() {
  mostrarLoading(true);
  try {
    const response = await fetch(`${API_BASE}/veiculos`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const dados = await response.json();
    todosVeiculos = Array.isArray(dados) ? dados : (dados.content || []);
    renderizarCards();
  } catch (erro) {
    console.error("Erro ao carregar veículos:", erro);
    container.innerHTML = '<p style="padding:1rem;color:#888;">Erro ao carregar veículos. Verifique a conexão.</p>';
  } finally {
    mostrarLoading(false);
  }
}

// ─── RENDERIZAR CARDS ─────────────────────────────────────────────────────────
function renderizarCards() {
  container.querySelectorAll(".veiculo-card").forEach(c => c.remove());
  const filtrados = filtrarVeiculos();

  if (filtrados.length === 0) {
    emptyState.style.display = "flex";
    return;
  }
  emptyState.style.display = "none";
  filtrados.forEach((veiculo, index) => container.appendChild(criarCard(veiculo, index)));
}

// ─── FILTRAR ──────────────────────────────────────────────────────────────────
function filtrarVeiculos() {
  return todosVeiculos.filter(v => {
    const matchFiltro = filtroAtual === "todas" || v.status === filtroAtual;
    const matchBusca  = buscaAtual === ""
      || (v.modelo  || "").toLowerCase().includes(buscaAtual.toLowerCase())
      || (v.prefixo || "").toLowerCase().includes(buscaAtual.toLowerCase());
    return matchFiltro && matchBusca;
  });
}

// ─── CRIAR CARD ───────────────────────────────────────────────────────────────
function criarCard(veiculo, index) {
  const eEmUso = veiculo.status === "em_uso";

  const card = document.createElement("div");
  card.className = `veiculo-card${eEmUso ? " em-uso" : ""}`;
  card.style.animationDelay = `${index * 0.06}s`;

  if (!eEmUso) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Ver detalhes do ${veiculo.modelo} — viatura ${veiculo.prefixo}`);
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
          <div class="card-modelo">${veiculo.modelo || "—"}</div>
          <div class="card-viatura">viatura: ${veiculo.prefixo || "—"}</div>
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

  if (!eEmUso) {
    card.addEventListener("click",   () => selecionarVeiculo(veiculo));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") selecionarVeiculo(veiculo);
    });
  }

  return card;
}

// ─── SELECIONAR VEÍCULO ───────────────────────────────────────────────────────
function selecionarVeiculo(veiculo) {
  sessionStorage.setItem("veiculoSelecionado",   JSON.stringify(veiculo));
  sessionStorage.setItem("veiculoSelecionadoId", veiculo.idVeiculo);
  sessionStorage.removeItem("idSaida");
  localStorage.removeItem("idSaida");
  window.location.href = "./nova_saida.html";
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function mostrarLoading(show) {
  loading.style.display = show ? "flex" : "none";
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────
function setFiltro(filtro) {
  filtroAtual = filtro;
  [btnTodas, btnDisp, btnUso, btnTodasMobile, btnDispMobile, btnUsoMobile]
    .forEach(b => b?.classList.remove("active"));

  if (filtro === "todas")      { btnTodas?.classList.add("active"); btnTodasMobile?.classList.add("active"); }
  if (filtro === "disponivel") { btnDisp?.classList.add("active");  btnDispMobile?.classList.add("active");  }
  if (filtro === "em_uso")     { btnUso?.classList.add("active");   btnUsoMobile?.classList.add("active");   }

  renderizarCards();
}

btnTodas?.addEventListener("click",       () => setFiltro("todas"));
btnDisp?.addEventListener("click",        () => setFiltro("disponivel"));
btnUso?.addEventListener("click",         () => setFiltro("em_uso"));
btnTodasMobile?.addEventListener("click", () => setFiltro("todas"));
btnDispMobile?.addEventListener("click",  () => setFiltro("disponivel"));
btnUsoMobile?.addEventListener("click",   () => setFiltro("em_uso"));

// ─── BUSCA ────────────────────────────────────────────────────────────────────
function executarBusca(valor) {
  buscaAtual = valor.trim();
  renderizarCards();
}

btnSearchAdm?.addEventListener("click",    () => executarBusca(searchAdm.value));
btnSearchMobile?.addEventListener("click", () => executarBusca(searchMobile.value));
searchAdm?.addEventListener("keyup",    e => { if (e.key === "Enter" || !searchAdm.value)    executarBusca(searchAdm.value); });
searchMobile?.addEventListener("keyup", e => { if (e.key === "Enter" || !searchMobile.value) executarBusca(searchMobile.value); });

// ─── BOTTOM NAV MOBILE ────────────────────────────────────────────────────────
btnAbastecerMobile?.addEventListener("click", () => {
  // Grava o flag para não redirecionar ao voltar desta tela
  sessionStorage.setItem("permiteNavegar", "true");
  window.location.href = "./abastecer.html";
});
btnSaidasMobile?.addEventListener("click", () => { window.location.href = "./saidas.html"; });

// ─── LOGOUT / PERFIL ──────────────────────────────────────────────────────────
btnLogoutMobile?.addEventListener("click", () => { sessionStorage.clear(); window.location.href = "./index.html"; });
btnPerfilAdm?.addEventListener("click", e => { e.preventDefault(); sessionStorage.clear(); window.location.href = "./index.html"; });

// ─── DROPDOWN DESKTOP ─────────────────────────────────────────────────────────
document.querySelectorAll(".dropdown").forEach(dropdown => {
  const btn     = dropdown.querySelector(".dropdown-btn");
  const submenu = dropdown.querySelector(".submenu");
  const arrow   = btn.querySelector(".arrow");

  btn.addEventListener("click", e => {
    e.stopPropagation();
    const aberto = submenu.classList.contains("open");
    document.querySelectorAll(".submenu").forEach(s => s.classList.remove("open"));
    document.querySelectorAll(".dropdown-btn .arrow").forEach(a => a.classList.remove("rotate"));
    if (!aberto) { submenu.classList.add("open"); arrow.classList.add("rotate"); }
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".submenu").forEach(s => s.classList.remove("open"));
  document.querySelectorAll(".dropdown-btn .arrow").forEach(a => a.classList.remove("rotate"));
});

// ─── HAMBURGER MOBILE ─────────────────────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");

hamburger?.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  mobileNav.classList.toggle("open");
});

document.querySelectorAll(".mobile-section-title").forEach(title => {
  title.addEventListener("click", () => {
    const sub   = document.getElementById(title.dataset.target);
    const arrow = title.querySelector(".arrow");
    sub?.classList.toggle("open");
    arrow?.classList.toggle("rotate");
  });
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
(async () => {
  await verificarSaidaAtivaDoUsuario();
  carregarVeiculos();
})();