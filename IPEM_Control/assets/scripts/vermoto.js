
const btns = document.querySelectorAll(".dropdown-btn");

btns.forEach(btn => {
    btn.addEventListener("click", (e) => {

        e.stopPropagation(); // evita fechar imediatamente

        const submenu = btn.nextElementSibling;
        const arrow = btn.querySelector(".arrow");

        // Fecha os outros
        document.querySelectorAll(".submenu").forEach(menu => {
            if (menu !== submenu) menu.classList.remove("open");
        });

        document.querySelectorAll(".arrow").forEach(a => {
            if (a !== arrow) a.classList.remove("rotate");
        });

        // Alterna atual
        submenu.classList.toggle("open");
        arrow.classList.toggle("rotate");
    });
});



document.addEventListener("click", () => {

    document.querySelectorAll(".submenu").forEach(menu => {
        menu.classList.remove("open");
    });

    document.querySelectorAll(".arrow").forEach(a => {
        a.classList.remove("rotate");
    });

});

const toggle = document.querySelector(".btn_menu");
const nav = document.querySelector(".nav");


toggle.addEventListener("click", () => {
    nav.classList.toggle("active");
});




document.addEventListener("DOMContentLoaded", () => {

  // 1. VARIÁVEL GLOBAL
  let motoristas = [];

  // 2. BUSCAR DADOS DA API
  async function buscarMotoristas() {
    try {
      const resposta = await fetch("http://localhost:3000/motoristas");
      const dados = await resposta.json();
      return dados;
    } catch (erro) {
      console.error("Erro ao buscar motoristas:", erro);
      return [];
    }
  }

  // 3. ESTADO
  let statusSelecionado = "todos";
  let textoBusca = "";

  // 4. ELEMENTOS
  const container = document.getElementById("lista_motoristas");
  const botoes = document.querySelectorAll(".filtro");
  const inputBusca = document.querySelector(".barra_pesquisa input");

  // 5. FORMATAR STATUS (UI)
  function formatarStatus(status) {
    return status === "disponivel" ? "DISPONÍVEL" : "EM SERVIÇO";
  }

  // 6. RENDER
  function renderizarCards(lista) {
    container.innerHTML = "";

    if (lista.length === 0) {
      container.innerHTML = "<p>Nenhum motorista encontrado.</p>";
      return;
    }

    lista.forEach(m => {
      container.innerHTML += `
        <div class="card ${m.status}">

          <div class="card_topo">
            <h3>${m.nome}</h3>
          </div>

          <div class="card_corpo">
            <p><strong>Habilitação:</strong> ${m.habilitacao}</p>
            <p><strong>Saídas na semana:</strong> ${m.saidas}</p>
            <p><strong>Último veículo:</strong> ${m.ultima_viatura || m.ultimo || "-"}</p>

            <span class="status ${m.status}">
              ${formatarStatus(m.status)}
            </span>
          </div>

          <!-- PARTE EXPANSÍVEL -->
          <div class="card_extra">
            ${
              m.status === "servico"
                ? `<p><strong>Viatura atual:</strong> ${m.viatura || "-"}</p>`
                : `<p>Motorista disponível</p>`
            }
          </div>

        </div>
      `;
    });
  }

  // 7. FILTROS
  function aplicarFiltros() {
    let filtrados = motoristas;

    // filtro por status
    if (statusSelecionado !== "todos") {
      filtrados = filtrados.filter(m => m.status === statusSelecionado);
    }

    // busca
    if (textoBusca !== "") {
      filtrados = filtrados.filter(m =>
        m.nome.toLowerCase().includes(textoBusca) ||
        m.habilitacao.toLowerCase().includes(textoBusca) ||
        (m.viatura && m.viatura.toLowerCase().includes(textoBusca)) ||
        (m.ultima_viatura && m.ultima_viatura.toLowerCase().includes(textoBusca)) ||
        (m.ultimo && m.ultimo.toLowerCase().includes(textoBusca))
      );
    }

    renderizarCards(filtrados);
  }

  // 8. INICIAR
  async function iniciar() {
    motoristas = await buscarMotoristas();
    renderizarCards(motoristas);
  }

  iniciar();

  // 9. BOTÕES DE FILTRO
  botoes.forEach(botao => {
    botao.addEventListener("click", () => {

      botoes.forEach(b => b.classList.remove("ativo"));
      botao.classList.add("ativo");

      statusSelecionado = botao.dataset.status;

      aplicarFiltros();
    });
  });

  // 10. BUSCA
  inputBusca.addEventListener("input", () => {
    textoBusca = inputBusca.value.toLowerCase();
    aplicarFiltros();
  });

  // 11. CLICK NOS CARDS
  container.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;

    // só abre se estiver em serviço
    if (!card.classList.contains("servico")) {
      return;
    }

    // fecha os outros
    document.querySelectorAll(".card").forEach(c => {
      if (c !== card) {
        c.classList.remove("ativo");
      }
    });

    // toggle
    card.classList.toggle("ativo");
  });

});









