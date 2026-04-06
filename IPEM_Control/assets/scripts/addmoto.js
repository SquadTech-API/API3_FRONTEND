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

  // ─── HELPERS DE MENSAGEM ────────────────────────────────────────────────────
  function mostrarMensagem(texto, tipo) {
    var el = document.getElementById("msg_formulario");
    if (!el) return;
    el.textContent   = texto;
    el.style.display = "block";
    el.style.backgroundColor = tipo === "sucesso" ? "#d4edda" : "#f8d7da";
    el.style.color           = tipo === "sucesso" ? "#155724" : "#721c24";
    el.style.border          = tipo === "sucesso" ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
    if (tipo === "sucesso") {
      setTimeout(function () { el.style.display = "none"; }, 4000);
    }
  }

  function esconderMensagem() {
    var el = document.getElementById("msg_formulario");
    if (el) el.style.display = "none";
  }

  // ─── FORMULÁRIO ─────────────────────────────────────────────────────────────
  var form = document.getElementById("form_motorista");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    esconderMensagem();

    // Coleta todos os campos 
    var nome              = document.getElementById("txf_nome_add_motorista").value.trim();
    var dataNascimento    = document.getElementById("txf_data_add_motorista").value.trim();
    var cpf               = document.getElementById("txf_cpf_add_motorista").value.trim().replace(/\D/g, "");
    var email             = document.getElementById("txf_email_add_motorista").value.trim();
    var cargo             = document.getElementById("txf_cargo_add_motorista").value.trim();
    var tipoUsuario       = document.getElementById("ddl_tipo_usuario_add_motorista").value;
    var numeroHabilitacao = document.getElementById("txf_registro_add_motorista").value.trim();
    var tipoHabilitacao   = document.getElementById("ddl_carteira_add_motorista").value;
    var senha             = document.getElementById("pwd_senha_add_motorista").value;
    var confirmacaoSenha  = document.getElementById("pwd_conf_senha_add_motorista").value;

    // ── Validações no frontend ────────────────────────────────────────────────
    if (!nome || !dataNascimento || !cpf || !email || !senha || !confirmacaoSenha) {
      mostrarMensagem("Preencha todos os campos obrigatórios: nome, data de nascimento, CPF, e-mail e senha.", "erro");
      return;
    }

    if (cpf.length !== 11) {
      mostrarMensagem("CPF inválido. Informe somente os 11 números.", "erro");
      return;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mostrarMensagem("E-mail inválido.", "erro");
      return;
    }

    if (senha.length < 6) {
      mostrarMensagem("A senha deve ter pelo menos 6 caracteres.", "erro");
      return;
    }

    if (senha !== confirmacaoSenha) {
      mostrarMensagem("As senhas não coincidem.", "erro");
      return;
    }

  
    var dados = {
      matricula:         null,
      nome:              nome,
      dataNascimento:    dataNascimento,          // "YYYY-MM-DD" — Jackson deserializa LocalDate
      cpf:               cpf,                     // somente dígitos
      email:             email,
      cargo:             cargo  || null,
      tipoUsuario:       tipoUsuario,              // "tecnico" | "adm"
      numeroHabilitacao: numeroHabilitacao || null,
      tipoHabilitacao:   tipoHabilitacao   || null, // enum: B, AB, C, AC, D, AD, E, AE
      senha:             senha,
      colaboradorAtivo:  true
    };

    var btnSalvar = document.getElementById("btn_salvar_add_motorista");
    btnSalvar.disabled    = true;
    btnSalvar.textContent = "Salvando...";

    try {
      var resposta = await fetch(API_BASE + "/usuarios", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(dados)
      });

      if (resposta.ok) {
        mostrarMensagem("✔ Motorista cadastrado com sucesso!", "sucesso");
        form.reset();
      } else {
        var corpo = await resposta.json().catch(function () { return null; });
        var mensagemErro = "Erro ao cadastrar motorista.";

        if (corpo) {
          if (typeof corpo === "string")        mensagemErro = corpo;
          else if (corpo.message)               mensagemErro = corpo.message;
          else if (corpo.erro)                  mensagemErro = corpo.erro;
          else if (corpo.error)                 mensagemErro = corpo.error;
          else if (Array.isArray(corpo.errors)) mensagemErro = corpo.errors.map(function (e) { return e.defaultMessage || e.field; }).join("; ");
        }

        // Mensagens amigáveis para erros comuns de duplicidade
        if (resposta.status === 409 || mensagemErro.toLowerCase().includes("cpf")) {
          mensagemErro = "CPF já cadastrado.";
        } else if (mensagemErro.toLowerCase().includes("email")) {
          mensagemErro = "E-mail já cadastrado.";
        } else if (mensagemErro.toLowerCase().includes("habilitacao") || mensagemErro.toLowerCase().includes("habilitação")) {
          mensagemErro = "Número de habilitação já cadastrado.";
        }

        mostrarMensagem(mensagemErro, "erro");
      }
    } catch (err) {
      console.error("Erro ao conectar com o servidor:", err);
      mostrarMensagem(
        err.message && err.message.includes("Failed to fetch")
          ? "Sem conexão com o servidor."
          : "Erro inesperado: " + err.message,
        "erro"
      );
    } finally {
      btnSalvar.disabled    = false;
      btnSalvar.textContent = "Salvar";
    }
  });

}); // fim DOMContentLoaded