// ═══════════════════════════════════════════════════════════════
//  script.js — Tela de Login
//  - Sem JWT por ora (MOCK_MODE controla)
//  - Modal bonito para erros
//  - Redireciona para veiculos.html após login
// ═══════════════════════════════════════════════════════════════

// ── MOCK DE USUÁRIOS (remova quando backend estiver pronto) ─────
const MOCK_USUARIOS = [
  {
    matricula: 1,
    nome: "Administrador IPEM",
    nomeCompleto: "Administrador IPEM",
    cargo: "Diretor de TI",
    email: "admin@ipem.sp.gov.br",
    senha: "Admin@2025",
    tipoUsuario: "adm",
    tipoHabilitacao: null,
    colaboradorAtivo: true,
  },
  {
    matricula: 2,
    nome: "Carlos Eduardo Silva",
    nomeCompleto: "Carlos Eduardo Silva",
    cargo: "Técnico de Metrologia I",
    email: "carlos.silva@ipem.sp.gov.br",
    senha: "Tecnico@2025",
    tipoUsuario: "tecnico",
    tipoHabilitacao: "B",
    colaboradorAtivo: true,
  },
  {
    matricula: 3,
    nome: "Fernanda Lima Souza",
    nomeCompleto: "Fernanda Lima Souza",
    cargo: "Técnica de Metrologia II",
    email: "fernanda.lima@ipem.sp.gov.br",
    senha: "Tecnico@2025",
    tipoUsuario: "tecnico",
    tipoHabilitacao: "B",
    colaboradorAtivo: true,
  },
  {
    matricula: 4,
    nome: "Roberto Alves Costa",
    nomeCompleto: "Roberto Alves Costa",
    cargo: "Fiscal de Medidas",
    email: "roberto.costa@ipem.sp.gov.br",
    senha: "Tecnico@2025",
    tipoUsuario: "tecnico",
    tipoHabilitacao: "AB",
    colaboradorAtivo: false, // inativo para teste
  },
];

// ── ELEMENTOS ───────────────────────────────────────────────────
const btnEntrar = document.getElementById("btnEntrar");
const toggleBtn = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const eyeIcon = document.getElementById("eye-icon");
const forgotBtn = document.getElementById("forgotBtn");

// ── TOGGLE SENHA ────────────────────────────────────────────────
const SVG_FECHADO = `
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
  <line x1="1" y1="1" x2="23" y2="23"/>
`;
const SVG_ABERTO = `
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
`;

toggleBtn.addEventListener("click", () => {
  const mostrando = passwordInput.type === "text";
  passwordInput.type = mostrando ? "password" : "text";
  eyeIcon.innerHTML = mostrando ? SVG_FECHADO : SVG_ABERTO;
  toggleBtn.setAttribute(
    "aria-label",
    mostrando ? "Mostrar senha" : "Ocultar senha",
  );
});

// ── LOGIN ───────────────────────────────────────────────────────
btnEntrar.addEventListener("click", () => executarLogin());

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") executarLogin();
});

async function executarLogin() {
  const email = document.getElementById("username").value.trim();
  const senha = passwordInput.value;

  if (!email || !senha) {
    showModal(
      "Campos obrigatórios",
      "Por favor, preencha o e-mail e a senha para continuar.",
      "warning",
    );
    return;
  }

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando...";

  try {
    let usuario;

    if (MOCK_MODE) {
      // ── MOCK ──────────────────────────────────────────────────
      await new Promise((r) => setTimeout(r, 600)); // simula latência
      usuario = MOCK_USUARIOS.find((u) => u.email === email);

      if (!usuario) {
        showModal(
          "Acesso negado",
          "E-mail não encontrado no sistema. Verifique os dados e tente novamente.",
          "error",
        );
        return;
      }

      if (!usuario.colaboradorAtivo) {
        showModal(
          "Conta inativa",
          "Sua conta está desativada. Entre em contato com o administrador do sistema para reativá-la.",
          "error",
        );
        return;
      }

      if (usuario.senha !== senha) {
        showModal(
          "Senha incorreta",
          'A senha informada não confere. Tente novamente ou clique em "Esqueceu a senha?".',
          "error",
        );
        return;
      }
      // ── FIM MOCK ──────────────────────────────────────────────
    } else {
      // ── REAL ─────────────────────────────────────────────────
      const resp = await fetch(`${API_BASE}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (resp.status === 401 || resp.status === 403) {
        const data = await resp.json().catch(() => null);
        const motivo =
          data?.message || data?.erro || "E-mail ou senha incorretos.";
        showModal("Acesso negado", motivo, "error");
        return;
      }

      if (!resp.ok) {
        showModal(
          "Erro no servidor",
          `Não foi possível conectar ao servidor (erro ${resp.status}). Tente novamente em instantes.`,
          "error",
        );
        return;
      }

      usuario = await resp.json();

      if (!usuario.colaboradorAtivo && usuario.colaboradorAtivo !== undefined) {
        showModal(
          "Conta inativa",
          "Sua conta está desativada. Contate o administrador.",
          "error",
        );
        return;
      }
      // ── FIM REAL ─────────────────────────────────────────────
    }

    // Salva sessão
    const dadosSessao = {
      matricula: usuario.matricula,
      nome: usuario.nome || usuario.nomeCompleto,
      nomeCompleto: usuario.nomeCompleto || usuario.nome,
      cargo: usuario.cargo,
      email: usuario.email,
      tipoUsuario: usuario.tipoUsuario,
      tipoHabilitacao: usuario.tipoHabilitacao || null,
    };

    sessionStorage.setItem("usuario", JSON.stringify(dadosSessao));
    if (usuario.tipoHabilitacao) {
      sessionStorage.setItem("tipoHabilitacao", usuario.tipoHabilitacao);
    }

    // Redireciona para veiculos (único destino após login)
    window.location.href = "./veiculos.html";
  } catch (err) {
    showModal(
      "Sem conexão",
      "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.",
      "error",
    );
  } finally {
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar";
  }
}

// ── ESQUECI A SENHA ─────────────────────────────────────────────
forgotBtn.addEventListener("click", () => {
  showModal(
    "Redefinição de senha",
    "Entre em contato com o administrador do sistema para redefinir sua senha de acesso.",
    "info",
  );
});
