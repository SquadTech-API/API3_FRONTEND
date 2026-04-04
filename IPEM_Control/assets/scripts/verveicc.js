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
  let veiculos = [];

  // 2. BUSCAR DA API
  async function buscarVeiculos() {
    try {
      const resposta = await fetch("http://localhost:3000/veiculos");
      const dados = await resposta.json();
      return dados;
    } catch (erro) {
      console.error("Erro ao buscar veículos:", erro);
      return [];
    }
  }

  // 3. ESTADO
  let statusSelecionado = "todos";
  let textoBusca = "";

  // 4. ELEMENTOS
  const container = document.getElementById("lista_veiculos");
  const botoes = document.querySelectorAll(".filtro");
  const inputBusca = document.querySelector(".barra_pesquisa input");

  // 5. FORMATAR STATUS
  function formatarStatus(status) {
    return status === "disponivel" ? "DISPONÍVEL" : "EM USO";
  }

  // 6. RENDER
  function renderizarCards(lista) {
    container.innerHTML = "";

    if (lista.length === 0) {
      container.innerHTML = "<p>Nenhum veículo encontrado.</p>";
      return;
    }

    lista.forEach(v => {
      container.innerHTML += `
        <div class="card ${v.status}">

          <div class="card_topo">
            <h3>${v.nome} : ${v.prefixo}</h3>
          </div>

          <div class="card_corpo">
            <p><strong>Último uso:</strong> ${v.ultimoUso || "-"}</p>
            <p><strong>Último abastecimento:</strong> ${v.abastecimento || "-"}</p>
            <p><strong>KM:</strong> ${v.km || "-"}</p>

            <span class="status ${v.status}">
              ${formatarStatus(v.status)}
            </span>
          </div>

          <!-- EXPANSÍVEL -->
          <div class="card_extra">
            ${
              v.status === "em_uso"
                ? `<p><strong>Motorista:</strong> ${v.motorista || "-"}</p>`
                : `<p>Veículo disponível</p>`
            }
          </div>

        </div>
      `;
    });
  }

  // 7. FILTROS
  function aplicarFiltros() {
    let filtrados = veiculos;

    // status
    if (statusSelecionado !== "todos") {
      filtrados = filtrados.filter(v => v.status === statusSelecionado);
    }

    // busca
    if (textoBusca !== "") {
      filtrados = filtrados.filter(v =>
        v.nome.toLowerCase().includes(textoBusca) ||
        v.prefixo.toLowerCase().includes(textoBusca) ||
        (v.motorista && v.motorista.toLowerCase().includes(textoBusca))
      );
    }

    renderizarCards(filtrados);
  }

  // 8. INICIAR
  async function iniciar() {
    veiculos = await buscarVeiculos();
    renderizarCards(veiculos);
  }

  iniciar();

  // 9. BOTÕES
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

    // só abre se estiver em uso
    if (!card.classList.contains("em_uso")) {
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