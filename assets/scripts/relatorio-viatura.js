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



// DADOS

const dados = {

  resumoPorPeriodo: {
    hoje:   { gasto: 450, litros: 180, km: 900, saidas: 12 },
    semana: { gasto: 2450, litros: 980, km: 4200, saidas: 48 },
    mes:    { gasto: 9820, litros: 4100, km: 18200, saidas: 170 },
    ano:    { gasto: 58200, litros: 24500, km: 98000, saidas: 920 }
  },

  graficoSaidas: {
    hoje: [
      { id: 1, prefix: "VTR-01", valor: 2 },
      { id: 2, prefix: "VTR-02", valor: 4 },
      { id: 3, prefix: "VTR-03", valor: 1 },
      { id: 4, prefix: "VTR-04", valor: 3 },
      { id: 5, prefix: "VTR-05", valor: 2 }
    ],
    semana: [
      { id: 1, prefix: "VTR-01", valor: 8 },
      { id: 2, prefix: "VTR-02", valor: 20 },
      { id: 3, prefix: "VTR-03", valor: 5 },
      { id: 4, prefix: "VTR-04", valor: 10 },
      { id: 5, prefix: "VTR-05", valor: 10 }
    ],
    mes: [
      { id: 1, prefix: "VTR-01", valor: 28 },
      { id: 2, prefix: "VTR-02", valor: 50 },
      { id: 3, prefix: "VTR-03", valor: 22 },
      { id: 4, prefix: "VTR-04", valor: 35 },
      { id: 5, prefix: "VTR-05", valor: 35 }
    ],
    ano: [
      { id: 1, prefix: "VTR-01", valor: 150 },
      { id: 2, prefix: "VTR-02", valor: 260 },
      { id: 3, prefix: "VTR-03", valor: 120 },
      { id: 4, prefix: "VTR-04", valor: 190 },
      { id: 5, prefix: "VTR-05", valor: 200 }
    ]
  },

  graficoKm: {
    hoje: [
      { id: 1, prefix: "VTR-01", valor: 120 },
      { id: 2, prefix: "VTR-02", valor: 200 },
      { id: 3, prefix: "VTR-03", valor: 80 },
      { id: 4, prefix: "VTR-04", valor: 150 },
      { id: 5, prefix: "VTR-05", valor: 100 }
    ],
    semana: [
      { id: 1, prefix: "VTR-01", valor: 700 },
      { id: 2, prefix: "VTR-02", valor: 1200 },
      { id: 3, prefix: "VTR-03", valor: 400 },
      { id: 4, prefix: "VTR-04", valor: 900 },
      { id: 5, prefix: "VTR-05", valor: 1000 }
    ],
    mes: [
      { id: 1, prefix: "VTR-01", valor: 2800 },
      { id: 2, prefix: "VTR-02", valor: 5200 },
      { id: 3, prefix: "VTR-03", valor: 1800 },
      { id: 4, prefix: "VTR-04", valor: 4000 },
      { id: 5, prefix: "VTR-05", valor: 3400 }
    ],
    ano: [
      { id: 1, prefix: "VTR-01", valor: 15000 },
      { id: 2, prefix: "VTR-02", valor: 26000 },
      { id: 3, prefix: "VTR-03", valor: 11000 },
      { id: 4, prefix: "VTR-04", valor: 20000 },
      { id: 5, prefix: "VTR-05", valor: 18000 }
    ]
  }
};


// VIATURAS

const veiculos = [
  {
    id: 1,
    modelo: "Celta 1.4",
    prefixo: "ABC-1234",

    dados: {
      hoje: { gasto: 120, litros: 40, km: 180, saidas: 2, consumo: 4.5 },
      semana: { gasto: 900, litros: 320, km: 1400, saidas: 10, consumo: 4.3 },
      mes: { gasto: 3200, litros: 1200, km: 5200, saidas: 38, consumo: 4.2 },
      ano: { gasto: 28000, litros: 11000, km: 48000, saidas: 300, consumo: 4.1 }
    },

    manutencao: {
      kmAtual: 89000,
      proximaTroca: 100000
    }
  },

  {
    id: 2,
    modelo: "Ranger 2.0",
    prefixo: "DEF-7781",

    dados: {
      hoje: { gasto: 200, litros: 65, km: 240, saidas: 3, consumo: 3.8 },
      semana: { gasto: 1500, litros: 500, km: 2200, saidas: 121, consumo: 4.4 },
      mes: { gasto: 5200, litros: 1800, km: 7800, saidas: 60, consumo: 4.3 },
      ano: { gasto: 41000, litros: 15000, km: 65000, saidas: 420, consumo: 4.2 }
    },

    manutencao: {
      kmAtual: 72000,
      proximaTroca: 90000
    } 
  },

  {
    id: 3,
    modelo: "Hilux Flex",
    prefixo: "GHI-5520",

    dados: {
      hoje: { gasto: 90, litros: 30, km: 150, saidas: 1, consumo: 5.0 },
      semana: { gasto: 1100, litros: 380, km: 1600, saidas: 8, consumo: 4.2 },
      mes: { gasto: 4300, litros: 1500, km: 6200, saidas: 45, consumo: 4.1 },
      ano: { gasto: 30000, litros: 12000, km: 52000, saidas: 310, consumo: 4.3 }
    },

    manutencao: {
      kmAtual: 95000,
      proximaTroca: 110000
    }
  },

  {
    id: 4,
    modelo: "S10 Maxx",
    prefixo: "JKL-8890",

    dados: {
      hoje: { gasto: 150, litros: 50, km: 200, saidas: 2, consumo: 4.0 },
      semana: { gasto: 1300, litros: 450, km: 2000, saidas: 12, consumo: 4.4 },
      mes: { gasto: 4800, litros: 1700, km: 7200, saidas: 55, consumo: 4.2 },
      ano: { gasto: 37000, litros: 14000, km: 61000, saidas: 380, consumo: 4.1 }
    },

    manutencao: {
      kmAtual: 86000,
      proximaTroca: 100000
    }
  },

  {
    id: 5,
    modelo: "Toro 1.4",
    prefixo: "MNO-4412",

    dados: {
      hoje: { gasto: 180, litros: 60, km: 220, saidas: 3, consumo: 3.9 },
      semana: { gasto: 1600, litros: 550, km: 2500, saidas: 16, consumo: 4.5 },
      mes: { gasto: 6000, litros: 2100, km: 9000, saidas: 70, consumo: 4.3 },
      ano: { gasto: 45000, litros: 17000, km: 75000, saidas: 500, consumo: 4.2 }
    },

    manutencao: {
      kmAtual: 98000,
      proximaTroca: 120000
    }
  }
];


// FILTROS INDEPENDENTES

let filtroCard = "semana";
let filtroSaidas = "semana";
let filtroKm = "semana";


// VIATURA

let veiculoSelecionado = null;
let filtroVeiculo = "semana";


// ELEMENTOS

const barrasSaidas = document.querySelectorAll("#chart-saidas .bar");
const barrasKm = document.querySelectorAll("#chart-km .bar");


// CARDS GERAIS

function atualizarCards() {

  const resumo = dados.resumoPorPeriodo[filtroCard];

  document.getElementById("gastoTotal").textContent =
    resumo.gasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("litrosTotal").textContent =
    `${resumo.litros} L`;

  document.getElementById("kmTotal").textContent =
    `KM: ${resumo.km}`;

  document.getElementById("saidasTotal").textContent =
    resumo.saidas;
}


// GRÁFICO

function renderGrafico(barras, dadosGrafico) {

  const max = Math.max(...dadosGrafico.map(v => v.valor));

  barras.forEach((bar, i) => {

    const item = dadosGrafico[i];
    if (!item) return;

    const altura = (item.valor / max) * 100;

    bar.style.height = altura + "%";
    bar.setAttribute("data-label", item.prefix);
    bar.setAttribute("data-value", item.valor);
  });
}


// UPDATE GERAL

function atualizar() {

  atualizarCards();

  renderGrafico(barrasSaidas, dados.graficoSaidas[filtroSaidas]);
  renderGrafico(barrasKm, dados.graficoKm[filtroKm]);
}


// FILTROS GERAIS

document.getElementById("filtroCard").addEventListener("change", (e) => {
  filtroCard = e.target.value;
  atualizar();
});

document.querySelector("#chart-saidas .filtro-grafico")
  .addEventListener("change", (e) => {
    filtroSaidas = e.target.value;
    atualizar();
  });

document.querySelector("#chart-km .filtro-grafico")
  .addEventListener("change", (e) => {
    filtroKm = e.target.value;
    atualizar();
  });


// EXPANSÃO DOS CARDS

const cards = document.querySelectorAll(".card");

cards.forEach(card => {
  card.addEventListener("click", () => {

    const estaAberto = card.classList.contains("ativo");

    // fecha todos
    cards.forEach(c => c.classList.remove("ativo"));

    // se não estava aberto, abre
    if (!estaAberto) {
      card.classList.add("ativo");
    }
  });
});


// VIATURA PADRÃO (MAIS SAÍDAS)

function pegarVeiculoPadrao() {

  const semana = dados.graficoSaidas.semana;

  const maisUsada = semana.reduce((maior, atual) =>
    atual.valor > maior.valor ? atual : maior
  );

  return veiculos.find(v => v.id === maisUsada.id);
}


// RENDER VIATURA

function renderVeiculo(v) {

  const d = v.dados[filtroVeiculo];
  const m = v.manutencao;

  document.getElementById("modeloViatura").textContent = v.prefixo;

  document.getElementById("gastoViatura").textContent =
    d.gasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("litrosViatura").textContent = `${d.litros} L`;

  document.getElementById("kmViatura").textContent = `KM: ${d.km}`;

  document.getElementById("totalSaidas").textContent = `Total de saídas: ${d.saidas}`;

  document.getElementById("consumoViatura").textContent =
    `Consumo: ${d.consumo} km/L`;

  document.getElementById("precoMedioViatura").textContent =
    `Preço médio (Litro): R$ ${(d.gasto / d.litros).toFixed(2)}`;

  document.getElementById("trocaViatura").textContent = m.proximaTroca;

  document.getElementById("proximaTroca").textContent =
    `Faltam ${m.proximaTroca - m.kmAtual} KM para próxima troca`;
}


// AUTOCOMPLETE

const input = document.getElementById("buscaVeiculo");
const sugestoes = document.querySelector(".sugestoes");

input.addEventListener("input", () => {

  const val = input.value.toLowerCase().trim();
  sugestoes.innerHTML = "";

  if (!val) {
    sugestoes.style.display = "none";
    return;
  }

  const filtrados = veiculos.filter(v =>
    v.modelo.toLowerCase().includes(val) ||
    v.prefixo.toLowerCase().includes(val)
  );

  if (filtrados.length === 0) {
    sugestoes.style.display = "none";
    return;
  }

  sugestoes.style.display = "block";

  filtrados.forEach(v => {

    const li = document.createElement("li");
    li.textContent = `${v.modelo} - Prefixo: ${v.prefixo}`;

    li.addEventListener("click", () => {
      veiculoSelecionado = v;
      renderVeiculo(v);
      input.value = v.modelo;
      sugestoes.style.display = "none";
    });

    sugestoes.appendChild(li);
  });
});


// FILTRO VIATURA

document.getElementById("filtropesquisa").addEventListener("change", (e) => {
  filtroVeiculo = e.target.value;
  if (veiculoSelecionado) renderVeiculo(veiculoSelecionado);
});


// INIT

veiculoSelecionado = pegarVeiculoPadrao();
renderVeiculo(veiculoSelecionado);

document.getElementById("filtroCard").value = filtroCard;
document.querySelector("#chart-saidas .filtro-grafico").value = filtroSaidas;
document.querySelector("#chart-km .filtro-grafico").value = filtroKm;
document.getElementById("filtropesquisa").value = filtroVeiculo;

atualizar();