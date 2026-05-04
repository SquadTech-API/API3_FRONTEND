// ═══════════════════════════════════════════════
//  CONFIGURAÇÃO
// ═══════════════════════════════════════════════
const API_BASE = "http://localhost:8080";

// ═══════════════════════════════════════════════
//  SESSÃO
// ═══════════════════════════════════════════════
const usuario = JSON.parse(sessionStorage.getItem("usuario"));
const veiculo = JSON.parse(sessionStorage.getItem("veiculoSelecionado"));

if (!usuario) window.location.href = "./index.html";
if (!veiculo)  window.location.href = "./veiculos.html";

// ═══════════════════════════════════════════════
//  PREENCHE CARD DO VEÍCULO
// ═══════════════════════════════════════════════
document.getElementById("label-prefix-saida").textContent   = `Viatura ${(veiculo.prefixo || "—").toUpperCase()}`;
document.getElementById("label-motorista-saida").textContent = `Motorista: ${usuario.nomeCompleto || usuario.nome || "—"}`;
document.getElementById("label-modelo-saida").textContent   = veiculo.modelo || "—";

// Campos ocultos
document.getElementById("hidden-id-veiculo").value = veiculo.id || veiculo.idVeiculo || "";
document.getElementById("hidden-matricula").value  = usuario.matricula || "";

// ═══════════════════════════════════════════════
//  DATA E HORA AUTOMÁTICAS
// ═══════════════════════════════════════════════
function atualizarDataHora() {
  const agora = new Date();
  document.getElementById("data-saida").value = agora.toISOString().split("T")[0];
  document.getElementById("hora-saida").value = agora.toTimeString().slice(0, 5);
}
atualizarDataHora();
setInterval(atualizarDataHora, 30000);

// ═══════════════════════════════════════════════
//  CARREGA SERVIÇOS
// ═══════════════════════════════════════════════
async function carregarServicos() {
  const select = document.getElementById("servico-saida");
  try {
    const res = await fetch(`${API_BASE}/tipo-servicos`);
    if (!res.ok) throw new Error();
    const lista = await res.json();
    lista.forEach(s => {
      const opt = document.createElement("option");
      opt.value       = s.idTipoServico;
      opt.textContent = s.nomeServico;
      select.appendChild(opt);
    });
  } catch {
    // Mock enquanto endpoint não existe
    [{ id: 1, nome: "Fiscalização" }, { id: 2, nome: "Transporte" },
     { id: 3, nome: "Vistoria" },     { id: 4, nome: "Diligência" }]
    .forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id; opt.textContent = m.nome;
      select.appendChild(opt);
    });
  }
}
carregarServicos();

// ═══════════════════════════════════════════════
//  SUBMIT — NOVA SAÍDA
//  POST /registro-saidas
//  Body conforme tabela registro_saida do banco
// ═══════════════════════════════════════════════
document.getElementById("formSaida").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = document.getElementById("data-saida").value;
  const hora = document.getElementById("hora-saida").value;

  const payload = {
    localDestino:     document.getElementById("end-saida").value.trim(),
    observacoes:      document.getElementById("cmp-saida").value.trim() || null,
    dataHoraSaida:    `${data}T${hora}:00`,   // DATETIME → LocalDateTime no Spring
    kmInicial:        parseFloat(document.getElementById("km-saida").value),
    status:           "em_andamento",
    idVeiculo:        parseInt(document.getElementById("hidden-id-veiculo").value),
    matriculaUsuario: parseInt(document.getElementById("hidden-matricula").value),
    idTipoServico:    parseInt(document.getElementById("servico-saida").value),
  };

  if (!payload.localDestino)                    { alert("Informe o endereço de destino."); return; }
  if (isNaN(payload.kmInicial))                 { alert("Informe o odômetro."); return; }
  if (!payload.idTipoServico)                   { alert("Selecione o serviço."); return; }

  const btn = e.target.querySelector(".btn-salvar");
  btn.disabled = true; btn.textContent = "Salvando...";

  try {
    const res = await fetch(`${API_BASE}/registro-saidas`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) { alert("Erro: " + await res.text()); return; }

    const saida = await res.json();

    // Salva saída ativa na sessionStorage para usar na tela de retorno
    sessionStorage.setItem("saidaAtiva", JSON.stringify(saida));

    alert("Saída registrada com sucesso!");
    window.location.href = "./veiculos.html";

  } catch (err) {
    console.error(err);
    alert("Não foi possível conectar ao servidor.");
  } finally {
    btn.disabled = false; btn.textContent = "Salvar";
  }
});

// ═══════════════════════════════════════════════
//  HAMBURGUER + DROPDOWNS
// ═══════════════════════════════════════════════
const hamburger = document.getElementById("hamburger");
const nav       = document.getElementById("nav");
const overlay   = document.getElementById("overlay");

function toggleMenu(open) {
  hamburger.classList.toggle("open", open);
  nav.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  document.body.style.overflow = open ? "hidden" : "";
}
hamburger.addEventListener("click", () => toggleMenu(!nav.classList.contains("open")));
overlay.addEventListener("click",   () => toggleMenu(false));

const dropdowns = [
  { btn: "btn-veiculos",   sub: "sub-veiculos"   },
  { btn: "btn-motoristas", sub: "sub-motoristas" },
  { btn: "btn-relatorios", sub: "sub-relatorios" },
];
dropdowns.forEach(({ btn, sub }) => {
  const btnEl = document.getElementById(btn);
  const subEl = document.getElementById(sub);
  const arrow = btnEl.querySelector(".arrow");
  btnEl.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = subEl.classList.contains("open");
    dropdowns.forEach(({ sub: s, btn: b }) => {
      document.getElementById(s).classList.remove("open");
      document.getElementById(b).querySelector(".arrow").classList.remove("rotate");
    });
    if (!isOpen) { subEl.classList.add("open"); arrow.classList.add("rotate"); }
  });
});
document.addEventListener("click", () => {
  dropdowns.forEach(({ btn, sub }) => {
    document.getElementById(sub).classList.remove("open");
    document.getElementById(btn).querySelector(".arrow").classList.remove("rotate");
  });
});