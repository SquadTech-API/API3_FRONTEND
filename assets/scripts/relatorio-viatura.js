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


const input = document.getElementById("buscaVeiculo");
const lista = document.querySelector(".sugestoes");
const tituloViatura = document.getElementById("nomeViatura");


input.addEventListener("input", () => {
  const valor = input.value.toLowerCase();
  lista.innerHTML = "";

  if (valor === "") {
    lista.style.display = "none";
    return;
  }

  const filtrados = veiculos.filter(v =>
    v.toLowerCase().includes(valor)
  );

  filtrados.forEach(v => {
    const li = document.createElement("li");
    li.textContent = v;

    li.addEventListener("click", () => {
      input.value = v;
      tituloViatura.textContent = v; 
      lista.style.display = "none";
    });

    lista.appendChild(li);
  });

  lista.style.display = filtrados.length ? "block" : "none";
});



const cards = document.querySelectorAll(".car-veic .card");

cards.forEach(card => {
  card.addEventListener("click", (e) => {
    e.stopPropagation(); // impede fechar ao clicar nele

    // fecha todos
    cards.forEach(c => c.classList.remove("ativo"));

    // abre só o clicado
    card.classList.add("ativo");
  });
});

// clicar fora fecha tudo
document.addEventListener("click", () => {
  cards.forEach(c => c.classList.remove("ativo"));
});

document.addEventListener("DOMContentLoaded", () => {


  // DADOS (SIMULAÇÃO BACKEND)

const dados = {

  resumoPorPeriodo: {
    semana: { gasto: 2450, litros: 980, km: 4200, saidas: 48 },
    mes:    { gasto: 9820, litros: 4100, km: 18200, saidas: 170 },
    ano:    { gasto: 58200, litros: 24500, km: 98000, saidas: 920 }
  },

  graficoPorPeriodo: {
    semana: [
      { nome: "VTR-01", valor: 8 },
      { nome: "VTR-02", valor: 15 },
      { nome: "VTR-03", valor: 5 },
      { nome: "VTR-04", valor: 10 },
      { nome: "VTR-05", valor: 10 }
    ],
    mes: [
      { nome: "VTR-01", valor: 28 },
      { nome: "VTR-02", valor: 50 },
      { nome: "VTR-03", valor: 22 },
      { nome: "VTR-04", valor: 35 },
      { nome: "VTR-05", valor: 35 }
    ],
    ano: [
      { nome: "VTR-01", valor: 150 },
      { nome: "VTR-02", valor: 260 },
      { nome: "VTR-03", valor: 120 },
      { nome: "VTR-04", valor: 190 },
      { nome: "VTR-05", valor: 200 }
    ]
  },

  viaturas: [
    {
      nome: "VTR-01",
      periodos: {
        semana: { litros: 180, km: 700, saidas: 8, gasto: 450 },
        mes:    { litros: 700, km: 2800, saidas: 28, gasto: 1800 },
        ano:    { litros: 4200, km: 15000, saidas: 150, gasto: 9200 }
      }
    },
    {
      nome: "VTR-02",
      periodos: {
        semana: { litros: 300, km: 1200, saidas: 15, gasto: 800 },
        mes:    { litros: 1200, km: 5200, saidas: 50, gasto: 3000 },
        ano:    { litros: 7000, km: 26000, saidas: 260, gasto: 18000 }
      }
    },
    {
      nome: "VTR-03",
      periodos: {
        semana: { litros: 120, km: 400, saidas: 5, gasto: 300 },
        mes:    { litros: 500, km: 1800, saidas: 22, gasto: 1200 },
        ano:    { litros: 3000, km: 11000, saidas: 120, gasto: 8000 }
      }
    },
    {
      nome: "VTR-04",
      periodos: {
        semana: { litros: 200, km: 900, saidas: 10, gasto: 500 },
        mes:    { litros: 900, km: 4000, saidas: 35, gasto: 2200 },
        ano:    { litros: 5200, km: 20000, saidas: 190, gasto: 12000 }
      }
    },
    {
      nome: "VTR-05",
      periodos: {
        semana: { litros: 180, km: 1000, saidas: 10, gasto: 400 },
        mes:    { litros: 800, km: 3400, saidas: 35, gasto: 1620 },
        ano:    { litros: 5100, km: 18000, saidas: 200, gasto: 11000 }
      }
    }
  ],

  viaturaSelecionada: null
};


  // ESTADO DOS FILTROS

  let filtroGrafico = "semana";   
  let filtroCard = "mes";         
  let filtroViatura = "semana";   


  // ELEMENTOS

  const barras = document.querySelectorAll(".bar");
  const nomeViatura = document.getElementById("nomeViatura");
  const inputBusca = document.getElementById("buscaVeiculo");
  const listaSugestoes = document.querySelector(".sugestoes");

  // =========================
  // PEGAR MAIS USADA
  // =========================
  function pegarMaisUsada() {
    const graficoAtual = dados.graficoPorPeriodo[filtroGrafico];

    return graficoAtual.reduce((maior, atual) =>
      atual.valor > maior.valor ? atual : maior
    );
  }


  // ATUALIZAR DASHBOARD

  function atualizarDashboard() {

    // -------- GRÁFICO --------
    const graficoAtual = dados.graficoPorPeriodo[filtroGrafico];
    const maxValor = Math.max(...graficoAtual.map(v => v.valor));

    barras.forEach((bar, i) => {
      const item = graficoAtual[i];

      if (item) {
        const altura = (item.valor / maxValor) * 100;

        bar.style.height = altura + "%";
        bar.setAttribute("data-label", item.nome);
        bar.setAttribute("data-value", item.valor);

        bar.onclick = () => {
          dados.viaturaSelecionada =
            dados.viaturas.find(v => v.nome === item.nome);

          inputBusca.value = item.nome;

          atualizarDashboard();
        };
      } else {
        bar.style.height = "0%";
      }
    });

    // -------- RESUMO --------
    const resumo = dados.resumoPorPeriodo[filtroCard];

    document.getElementById("gastoTotal").textContent =
      resumo.gasto.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

    document.getElementById("litrosTotal").textContent =
      `${resumo.litros} L`;

    document.getElementById("kmTotal").textContent =
      `KM: ${resumo.km}`;

    document.getElementById("saidasTotal").textContent =
      resumo.saidas;

    // -------- VIATURA --------
    const v = dados.viaturaSelecionada;
    const periodo = v.periodos[filtroViatura];

    nomeViatura.textContent = v.nome;

    document.getElementById("litrosViatura").textContent =
      `${periodo.litros} L`;

    document.getElementById("kmViatura").textContent =
      periodo.km;

    document.getElementById("gastoViatura").textContent =
      `Gasto: ${periodo.gasto.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })}`;

    document.getElementById("saidasViatura").textContent =
      `Saídas: ${periodo.saidas}`;
  }

  // FILTROS

  document.getElementById("filtroGrafico").addEventListener("change", (e) => {
    filtroGrafico = e.target.value;

    const graficoAtual = dados.graficoPorPeriodo[filtroGrafico];

    if (graficoAtual.length) {
      const maisUsada = graficoAtual.reduce((maior, atual) =>
        atual.valor > maior.valor ? atual : maior
      );

      dados.viaturaSelecionada =
        dados.viaturas.find(v => v.nome === maisUsada.nome);

      inputBusca.value = dados.viaturaSelecionada.nome;
    }

    atualizarDashboard();
  });

  document.getElementById("filtroCard").addEventListener("change", (e) => {
    filtroCard = e.target.value;
    atualizarDashboard();
  });

  document.getElementById("filtropesquisa").addEventListener("change", (e) => {
    filtroViatura = e.target.value;
    atualizarDashboard();
  });


  // BUSCA

  function atualizarSugestoes(valor) {
    listaSugestoes.innerHTML = "";

    if (!valor) {
      listaSugestoes.style.display = "none";
      return;
    }

    const filtradas = dados.viaturas.filter(v =>
      v.nome.toLowerCase().includes(valor.toLowerCase())
    );

    filtradas.forEach(v => {
      const li = document.createElement("li");
      li.textContent = v.nome;

      li.onclick = () => {
        inputBusca.value = v.nome;
        listaSugestoes.style.display = "none";

        dados.viaturaSelecionada = v;

        atualizarDashboard();
      };

      listaSugestoes.appendChild(li);
    });

    listaSugestoes.style.display = filtradas.length ? "block" : "none";
  }

  inputBusca.addEventListener("input", (e) => {
    atualizarSugestoes(e.target.value);
  });

  document.addEventListener("click", () => {
    listaSugestoes.style.display = "none";
  });

  inputBusca.addEventListener("click", (e) => {
    e.stopPropagation();
  });


  // INIT 

  function inicializar() {

    document.getElementById("filtroGrafico").value = filtroGrafico;
    document.getElementById("filtroCard").value = filtroCard;
    document.getElementById("filtropesquisa").value = filtroViatura;


    const maisUsada = pegarMaisUsada();

    dados.viaturaSelecionada =
      dados.viaturas.find(v => v.nome === maisUsada.nome);

    inputBusca.value = dados.viaturaSelecionada.nome;

    atualizarDashboard();
  }

  inicializar();

});