// Toggle submenus ao clicar
document.querySelectorAll(".dropdown-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = btn.closest(".dropdown");
    const isOpen = dropdown.classList.contains("open");

    // Fecha todos os dropdowns abertos
    document
      .querySelectorAll(".dropdown.open")
      .forEach((d) => d.classList.remove("open"));

    // Abre o clicado se estava fechado
    if (!isOpen) {
      dropdown.classList.add("open");
    }
  });
});

// Fecha ao clicar fora
document.addEventListener("click", () => {
  document
    .querySelectorAll(".dropdown.open")
    .forEach((d) => d.classList.remove("open"));
});

// Menu mobile
const btnMenu = document.querySelector(".btn_menu");
const nav = document.querySelector(".nav");
if (btnMenu) {
  btnMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    nav.classList.toggle("open");
  });
}




document.addEventListener("DOMContentLoaded", () => {

  // VEÍCULOS
  let veiculos = [];

  function buscarVeiculos() {
    return [
      {
        id: 1,
        nome: "Cruze",
        prefixo: "VT1-01",
        ultimoUso: "25/04/2026",
        ultimoMotorista: "João Silva",
        abastecimento: "24/04/2026"
      },
      {
        id: 2,
        nome: "Onix",
        prefixo: "VT1-02",
        ultimoUso: "20/04/2026",
        ultimoMotorista: "Marcos Lima",
        abastecimento: "19/04/2026"
      },
      {
        id: 3,
        nome: "HB20",
        prefixo: "VT1-03",
        ultimoUso: "",
        ultimoMotorista: "",
        abastecimento: ""
      },
      {
        id: 4,
        nome: "HB20",
        prefixo: "VT1-04",
        ultimoUso: "",
        ultimoMotorista: "",
        abastecimento: ""
      },
      {
        id: 5,
        nome: "Saveiro",
        prefixo: "VT1-04",
        ultimoUso: "",
        ultimoMotorista: "",
        abastecimento: ""
      },
      {
        id: 5,
        nome: "Captiva",
        prefixo: "VT1-04",
        ultimoUso: "",
        ultimoMotorista: "",
        abastecimento: ""
      }

    ];
  }

  // SAÍDAS / HISTÓRICO
  function buscarSaidas() {
    return [
      {
        id: 101,
        idVeiculo: 1,
        motorista: "João Silva",
        dataSaida: "25/04/2026",
        tipoServico: "Fiscalização",
        km: 120,
        abasteceu: true
      },
      {
        id: 102,
        idVeiculo: 1,
        motorista: "Carlos Souza",
        dataSaida: "20/04/2026",
        tipoServico: "Vistoria",
        km: 80,
        abasteceu: false
      },
      {
        id: 103,
        idVeiculo: 2,
        motorista: "Marcos Lima",
        dataSaida: "18/04/2026",
        tipoServico: "Manutenção",
        km: 60,
        abasteceu: true
      }
    ];
  }

  let saidas = buscarSaidas();
  let textoBusca = "";

  const container = document.getElementById("lista_veiculos");
  const areaBusca = document.querySelector(".busca_filtros");
  const campoBusca = document.querySelector(".barra_pesquisa input");
  const veiculoSelecionado = document.getElementById("veiculo_selecionado");
  const espacoNome =document.getElementById("espaco_nome");

  function renderizarVeiculos(lista) {
    container.innerHTML = "";

    lista.forEach(v => {
      container.innerHTML += `
        <div class="card" data-id="${v.id}" data-nome="${v.nome}" data-prefixo="${v.prefixo}">
          <div class="card_topo">
            <h3>${v.nome} : ${v.prefixo}</h3>
          </div>

          <div class="card_corpo">
            <p><strong>Último uso:</strong> ${v.ultimoUso}</p>
            <p><strong>Último motorista:</strong> ${v.ultimoMotorista}</p>
            <p><strong>Último abastecimento:</strong> ${v.abastecimento}</p>
          </div>
        </div>
      `;
    });
  }

  function renderizarSaidas(idVeiculo) {
    const listaSaidas = saidas.filter(s => s.idVeiculo == idVeiculo);

    container.innerHTML = "";

    if (listaSaidas.length === 0) {
      container.innerHTML = "<p>Nenhuma saída encontrada.</p>";
      return;
    }

    listaSaidas.forEach(s => {
      container.innerHTML += `
        <div class="card">
          <div class="card_topo">
            <h3>${s.motorista}</h3>
          </div>

          <div class="card_corpo">
            <p><strong>Data da saída:</strong> ${s.dataSaida}</p>
            <p><strong>Tipo de serviço:</strong> ${s.tipoServico}</p>
            <p><strong>KM rodados:</strong> ${s.km} km</p>

            <p class="${s.abasteceu ? 'abastecimento' : 'sem_abastecimento'}">
              ${s.abasteceu ? 'Abastecimento' : 'Sem abastecimento'}
            </p>
          </div>
        </div>
      `;
    });
  }

  function aplicarBusca() {
    let filtrados = veiculos;

    if (textoBusca !== "") {
      filtrados = filtrados.filter(v =>
        v.nome.toLowerCase().includes(textoBusca) ||
        v.prefixo.toLowerCase().includes(textoBusca) ||
        v.ultimoMotorista.toLowerCase().includes(textoBusca)
      );
    }

    renderizarVeiculos(filtrados);
  }

  function iniciar() {
    veiculos = buscarVeiculos();
    renderizarVeiculos(veiculos);
  }

  iniciar();

  campoBusca.addEventListener("input", () => {
    textoBusca = campoBusca.value.toLowerCase();
    aplicarBusca();
  });

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;

    const idVeiculo = card.dataset.id;
    if (!idVeiculo) return;

    // ESCONDE BARRA DE PESQUISA
    areaBusca.style.display = "none";

    // MOSTRA VEÍCULO SELECIONADO
    veiculoSelecionado.innerHTML = `
      <h2>${card.dataset.nome} : ${card.dataset.prefixo}</h2>
    `;
    espacoNome.style.display = "flex";
    espacoNome.style.justifyContent = "space-between";
    espacoNome.style.alignItems = "center";

    renderizarSaidas(idVeiculo);
  });
  
  document.querySelector(".buton-esc").addEventListener("click", () => {

  // 1. Esconde o nome do veículo selecionado
  espacoNome.style.display = "none";

  // 2. Mostra a busca de novo
  areaBusca.style.display = "flex";

    // LIMPA INPUT
  const input = document.querySelector(".barra_pesquisa input");
  input.value = "";

  // RESET FILTRO (importante)
  textoBusca = "";

  // 3. Volta lista de veículos
  renderizarVeiculos(veiculos); // ou sua função original

});

});