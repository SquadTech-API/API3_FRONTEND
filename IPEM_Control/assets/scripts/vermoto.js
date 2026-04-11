document.addEventListener("DOMContentLoaded", function () {

  // ─── VERIFICAÇÃO DE SESSÃO ──────────────────────────────────────────────────
  var usuarioLogado = JSON.parse(sessionStorage.getItem("usuario"));
  if (!usuarioLogado) { window.location.href = "./index.html"; return; }

  var API_BASE = "http://localhost:8080";

  // ─── MENU DROPDOWN ──────────────────────────────────────────────────────────
  document.querySelectorAll(".dropdown-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var submenu = btn.nextElementSibling;
      var arrow   = btn.querySelector(".arrow");

      document.querySelectorAll(".submenu").forEach(function (m) {
        if (m !== submenu) m.classList.remove("open");
      });
      document.querySelectorAll(".arrow").forEach(function (a) {
        if (a !== arrow) a.classList.remove("rotate");
      });

      submenu.classList.toggle("open");
      arrow.classList.toggle("rotate");
    });
  });

  document.addEventListener("click", function () {
    document.querySelectorAll(".submenu").forEach(function (m) { m.classList.remove("open"); });
    document.querySelectorAll(".arrow").forEach(function (a)   { a.classList.remove("rotate"); });
  });

  // ─── MENU MOBILE ────────────────────────────────────────────────────────────
  var toggleBtn = document.querySelector(".btn_menu");
  var navEl     = document.querySelector(".nav");
  if (toggleBtn && navEl) {
    toggleBtn.addEventListener("click", function () {
      navEl.classList.toggle("active");
    });
  }

  // ─── ESTADO ─────────────────────────────────────────────────────────────────
  var motoristas        = [];
  var statusSelecionado = "todos";
  var textoBusca        = "";

  // ─── ELEMENTOS ──────────────────────────────────────────────────────────────
  var container  = document.getElementById("lista_motoristas");
  var botoes     = document.querySelectorAll(".filtro");
  var inputBusca = document.querySelector(".barra_pesquisa input");

  // ─── HEADERS ────────────────────────────────────────────────────────────────
  function getAuthHeaders() {
    var token = sessionStorage.getItem("token") || localStorage.getItem("token");
    var h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = "Bearer " + token;
    return h;
  }

  // ─── BUSCAR MOTORISTAS DA API ────────────────────────────────────────────────
  // Usuarios retorna List<Usuario>

  async function buscarMotoristas() {
    try {
      var resposta = await fetch(API_BASE + "/usuarios", { headers: getAuthHeaders() });
      if (!resposta.ok) throw new Error("Erro " + resposta.status);
      var dados = await resposta.json();
      var lista  = Array.isArray(dados) ? dados : (dados.content || []);

      // Filtra apenas técnicos ativos
      return lista.filter(function (u) {
        return u.tipoUsuario === "tecnico" && u.colaboradorAtivo !== false;
      });
    } catch (erro) {
      console.error("Erro ao buscar motoristas:", erro);
      return [];
    }
  }

  // ─── VERIFICAR SE MOTORISTA ESTÁ EM SERVIÇO ──────────────────────────────────
  async function verificarEmServico(matricula) {
    try {
      var resp = await fetch(
        API_BASE + "/registro-saidas/ativo-usuario?matricula=" + matricula,
        { headers: getAuthHeaders() }
      );
      if (resp.status === 404) return null; // sem saída ativa
      if (!resp.ok) return null;
      return await resp.json(); // retorna a saída ativa
    } catch {
      return null;
    }
  }

  // ─── FORMATAR HABILITAÇÃO ────────────────────────────────────────────────────
  function formatarHabilitacao(tipo) {
    return tipo || "—";
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  function renderizarCards(lista) {
    container.innerHTML = "";

    if (lista.length === 0) {
      container.innerHTML = "<p>Nenhum motorista encontrado.</p>";
      return;
    }

    lista.forEach(function (m) {
      var emServico = m._saidaAtiva != null;
      var statusLabel = emServico ? "EM SERVIÇO" : "DISPONÍVEL";
      var statusClass = emServico ? "servico" : "disponivel";

      var viaturaAtual = "";
      if (emServico && m._saidaAtiva) {
        var v = m._saidaAtiva.veiculo;
        viaturaAtual = v ? (v.prefixo || v.modelo || "—") : "—";
      }

      container.innerHTML += `
        <div class="card ${statusClass}" data-matricula="${m.matricula}">
          <div class="card_topo">
            <h3>${m.nome || "—"}</h3>
          </div>
          <div class="card_corpo">
            <p><strong>Habilitação:</strong> ${formatarHabilitacao(m.tipoHabilitacao)}</p>
            <p><strong>Cargo:</strong> ${m.cargo || "—"}</p>
            <span class="status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="card_extra">
            ${emServico
              ? `<p><strong>Viatura atual:</strong> ${viaturaAtual}</p>`
              : `<p>Motorista disponível</p>`
            }
          </div>
        </div>
      `;
    });

    // Click nos cards — expande se estiver em serviço
    container.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("click", function () {
        if (!card.classList.contains("servico")) return;

        container.querySelectorAll(".card").forEach(function (c) {
          if (c !== card) c.classList.remove("ativo");
        });
        card.classList.toggle("ativo");
      });
    });
  }

  // ─── FILTROS ────────────────────────────────────────────────────────────────
  function aplicarFiltros() {
    var filtrados = motoristas.filter(function (m) {
      var emServico = m._saidaAtiva != null;

      if (statusSelecionado === "servico"   && !emServico) return false;
      if (statusSelecionado === "disponivel" && emServico)  return false;

      if (textoBusca !== "") {
        var nome = (m.nome || "").toLowerCase();
        var hab  = (m.tipoHabilitacao || "").toLowerCase();
        if (!nome.includes(textoBusca) && !hab.includes(textoBusca)) return false;
      }

      return true;
    });

    renderizarCards(filtrados);
  }

  // ─── INICIAR ────────────────────────────────────────────────────────────────
  async function iniciar() {
    container.innerHTML = "<p>Carregando motoristas...</p>";

    motoristas = await buscarMotoristas();

    // Para cada motorista, verifica se está em serviço (em paralelo)
    await Promise.all(motoristas.map(async function (m) {
      m._saidaAtiva = await verificarEmServico(m.matricula);
    }));

    renderizarCards(motoristas);
  }

  iniciar();

  // ─── BOTÕES DE FILTRO ───────────────────────────────────────────────────────
  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
      botoes.forEach(function (b) { b.classList.remove("ativo"); });
      botao.classList.add("ativo");
      statusSelecionado = botao.dataset.status;
      aplicarFiltros();
    });
  });

  // ─── BUSCA ──────────────────────────────────────────────────────────────────
  if (inputBusca) {
    inputBusca.addEventListener("input", function () {
      textoBusca = inputBusca.value.toLowerCase();
      aplicarFiltros();
    });
  }

}); // fim DOMContentLoaded