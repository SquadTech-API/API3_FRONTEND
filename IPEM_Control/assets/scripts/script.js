// ─── ELEMENTOS ───────────────────────────────────────────────────────────────
const form = document.getElementById("loginForm");
const toggleBtn = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const eyeIcon = document.getElementById("eye-icon");
const forgotBtn = document.getElementById("forgotBtn");

// ─── URL BASE DA API ──────────────────────────────────────────────────────────
const API_URL = "http://localhost:8080/usuarios/login";

// ─── MAPA DE REDIRECIONAMENTO POR TIPO ───────────────────────────────────────
const ROTAS_POR_TIPO = {
  adm: "./ver_veiculos.html",
  tecnico: "./tela_veiculos.html",
  default: "./erro.html",
};

// ─── TOGGLE SENHA ─────────────────────────────────────────────────────────────
const SVG_EYE_CLOSED = `
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
  <line x1="1" y1="1" x2="23" y2="23" />
`;

const SVG_EYE_OPEN = `
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
  <circle cx="12" cy="12" r="3" />
`;

toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  if (isPassword) {
    passwordInput.type = "text";
    eyeIcon.innerHTML = SVG_EYE_OPEN;
    toggleBtn.setAttribute("aria-label", "Ocultar senha");
  } else {
    passwordInput.type = "password";
    eyeIcon.innerHTML = SVG_EYE_CLOSED;
    toggleBtn.setAttribute("aria-label", "Mostrar senha");
  }
});

// ─── SUBMIT ───────────────────────────────────────────────────────────────────
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("username").value.trim();
  const senha = passwordInput.value;

  if (!email || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  const btnEntrar = form.querySelector(".btn-entrar");
  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      alert("Email ou senha incorretos.");
      return;
    }

    const usuario = await response.json();

    // Salva sessão
    sessionStorage.setItem("usuario", JSON.stringify(usuario));

    const tipoUsuario = (usuario.tipoUsuario || "").toLowerCase().trim();

    const destino = ROTAS_POR_TIPO[tipoUsuario] || ROTAS_POR_TIPO.default;

    console.log("Tipo usuário:", tipoUsuario);
    console.log("Destino:", destino);

    // 🚀 REDIRECIONAMENTO
    window.location.href = destino;
  } catch (erro) {
    console.error("Erro ao conectar com o servidor:", erro);
    alert("Não foi possível conectar ao servidor. Tente novamente.");
  } finally {
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar";
  }
});

// ─── ESQUECI SENHA ────────────────────────────────────────────────────────────
forgotBtn.addEventListener("click", () => {
  window.location.href = "/pages/recuperar-senha.html";
});
