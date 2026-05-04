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

  // ─── FORMULÁRIO VEÍCULO ─────────────────────────────────────────────────────
  var form = document.getElementById("form_veic");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    var marca                = document.getElementById("txf_marca_add_veic").value.trim();
    var modelo               = document.getElementById("txf_modelo_add_veic").value.trim();
    var ano                  = document.getElementById("txf_ano_add_veic").value.trim();
    var tipoCombustivel      = document.getElementById("ddl_combustivel_add_veic").value;
    var habilitacaoCategoria = document.getElementById("ddl_habilitacao_add_veic").value;
    var placa                = document.getElementById("txf_placa_add_veic").value.trim();
    var kmAtual              = document.getElementById("txf_km_add_veic").value.trim();
    var prefixo              = document.getElementById("txf_prefixo_add_veic").value.trim();
    var nucleoDar            = document.getElementById("txf_nucleo_add_veic").value.trim();
    var numeroFl             = document.getElementById("txf_nfi_add_veic").value.trim();

    if (!marca || !modelo || !ano || !placa || !kmAtual || !prefixo || !nucleoDar) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }
    if (!tipoCombustivel) {
      alert("Selecione o tipo de combustível!");
      return;
    }
    if (!habilitacaoCategoria) {
      alert("Selecione a categoria de habilitação necessária!");
      return;
    }

    var mapaCombustivel = {
      "G":  "gasolina",
      "E":  "etanol",
      "F":  "flex",
      "EL": "eletrico",
      "H":  "hibrido"
    };

    var dados = {
      marca:               marca,
      modelo:              modelo,
      ano:                 parseInt(ano, 10),
      tipoCombustivel:     mapaCombustivel[tipoCombustivel] || tipoCombustivel,
      habilitacaoCategoria: habilitacaoCategoria,
      placa:               placa.toUpperCase(),
      kmAtual:             parseFloat(kmAtual),
      prefixo:             prefixo,
      nucleoDar:           nucleoDar,
      numeroFl:            numeroFl || null,
      disponivel:          true
    };

    var btnSalvar = document.getElementById("btn_salvar_add_veic");
    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    try {
      var resposta = await fetch(API_BASE + "/veiculos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(dados)
      });

      if (resposta.ok || resposta.status === 201) {
        alert("Veículo cadastrado com sucesso!");
        form.reset();
      } else {
        var erro = await resposta.json().catch(function () { return null; });
        alert((erro && (erro.erro || erro.message)) || "Erro ao cadastrar veículo.");
      }
    } catch (err) {
      console.error("Erro ao conectar com o servidor:", err);
      alert("Não foi possível conectar ao servidor.");
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = "Salvar";
    }
  });

}); // fim DOMContentLoaded