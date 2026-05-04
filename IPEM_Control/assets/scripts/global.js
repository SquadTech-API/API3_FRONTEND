/* ═══════════════════════════════════════════════════════════════
   global.js — IPEM Control
   Funções compartilhadas por TODAS as telas
   ═══════════════════════════════════════════════════════════════ */

// ── MOCK MODE ──────────────────────────────────────────────────
// false = busca dados reais do backend (localhost:8080)
// true  = usa dados hardcoded para desenvolvimento sem backend
const MOCK_MODE = false;

const API_BASE = "http://localhost:8080";

// ══════════════════════════════════════════════════════════════
//  AUTH HELPERS (sem JWT por ora)
// ══════════════════════════════════════════════════════════════
function getUsuario() {
  try {
    return JSON.parse(sessionStorage.getItem("usuario"));
  } catch {
    return null;
  }
}

function getAuthHeaders() {
  return { "Content-Type": "application/json" };
}

function isAdm() {
  const u = getUsuario();
  return u?.tipoUsuario === "adm";
}

function getMatricula() {
  return getUsuario()?.matricula || null;
}

function getHabilitacao() {
  const u = getUsuario();
  return (
    u?.tipoHabilitacao ||
    sessionStorage.getItem("tipoHabilitacao") ||
    ""
  ).toUpperCase();
}

function logout() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "./index.html";
}

function exigirLogin() {
  if (!getUsuario()) {
    window.location.href = "./index.html";
    return false;
  }
  return true;
}

function exigirAdm() {
  if (!exigirLogin()) return false;
  if (!isAdm()) {
    showModal("Acesso negado", "Esta área é restrita ao Administrador.", "error");
    setTimeout(() => (window.location.href = "./veiculos.html"), 2000);
    return false;
  }
  return true;
}

// ══════════════════════════════════════════════════════════════
//  MENU
// ══════════════════════════════════════════════════════════════
function initMenu() {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    const btn = dropdown.querySelector(".dropdown-btn");
    const submenu = dropdown.querySelector(".submenu");
    if (!btn || !submenu) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const aberto = dropdown.classList.contains("open");
      document.querySelectorAll(".dropdown.open").forEach((d) => d.classList.remove("open"));
      if (!aberto) dropdown.classList.add("open");
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown.open").forEach((d) => d.classList.remove("open"));
  });

  const btnMenu = document.querySelector(".btn_menu");
  const nav = document.querySelector(".nav");
  if (btnMenu && nav) {
    btnMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !btnMenu.contains(e.target)) {
        nav.classList.remove("open");
      }
    });
  }

  const btnPerfil = document.getElementById("btn-perfil");
  if (btnPerfil) {
    btnPerfil.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "./perfil.html";
    });
  }

  const nomeEl = document.getElementById("header-usuario-nome");
  if (nomeEl) {
    const u = getUsuario();
    nomeEl.textContent = u?.nomeCompleto || u?.nome || "";
  }
}

function ajustarMenuPorPerfil() {
  const adm = isAdm();
  document.querySelectorAll('[data-role="adm"]').forEach((el) => {
    el.style.display = adm ? "" : "none";
  });
  document.querySelectorAll('[data-role="tecnico"]').forEach((el) => {
    el.style.display = adm ? "none" : "";
  });
}

// ══════════════════════════════════════════════════════════════
//  MODAL
// ══════════════════════════════════════════════════════════════
let _modalCallback = null;

function showModal(titulo, mensagem, tipo = "error", callback = null) {
  const tipos = {
    error:   { icon: "✕", cls: "error" },
    warning: { icon: "⚠", cls: "warning" },
    success: { icon: "✓", cls: "success" },
    info:    { icon: "i", cls: "info" },
  };
  const t = tipos[tipo] || tipos.error;
  _modalCallback = callback;

  const antigo = document.getElementById("_ipem_modal");
  if (antigo) antigo.remove();

  const overlay = document.createElement("div");
  overlay.id = "_ipem_modal";
  overlay.className = "ipem-modal-overlay active";
  overlay.innerHTML = `
    <div class="ipem-modal" role="dialog" aria-modal="true">
      <div class="ipem-modal-icon ${t.cls}">${t.icon}</div>
      <div class="ipem-modal-title">${titulo}</div>
      <div class="ipem-modal-msg">${mensagem}</div>
      <button class="ipem-modal-btn ${t.cls}" id="_modal_ok_btn">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("_modal_ok_btn").addEventListener("click", () => {
    overlay.remove();
    if (_modalCallback) { _modalCallback(); _modalCallback = null; }
  });

  if (tipo === "success" || tipo === "info") {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (_modalCallback) { _modalCallback(); _modalCallback = null; }
      }
    });
  }
}

function fecharModal() {
  const m = document.getElementById("_ipem_modal");
  if (m) m.remove();
}

// ══════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════
let _toastTimer = null;

function showToast(msg, tipo = "success") {
  const antigo = document.getElementById("_ipem_toast");
  if (antigo) antigo.remove();
  if (_toastTimer) clearTimeout(_toastTimer);

  const toast = document.createElement("div");
  toast.id = "_ipem_toast";
  toast.className = `ipem-toast ${tipo}`;
  const icones = { success: "✓", error: "✕", warning: "⚠" };
  toast.innerHTML = `<span>${icones[tipo] || "•"}</span><span>${msg}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("show")));

  const dur = tipo === "error" ? 5000 : tipo === "warning" ? 4000 : 3000;
  _toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, dur);
}

// ══════════════════════════════════════════════════════════════
//  FETCH HELPER — com diagnóstico de erros detalhado
// ══════════════════════════════════════════════════════════════
async function apiFetch(url, options = {}) {
  const config = {
    headers: getAuthHeaders(),
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
  };

  let resp;
  try {
    resp = await fetch(`${API_BASE}${url}`, config);
  } catch (networkErr) {
    // Erro de rede — backend não está rodando ou CORS bloqueou
    const msg = networkErr.message?.includes("Failed to fetch")
      ? `Não foi possível conectar ao servidor em ${API_BASE}. Verifique se o Spring Boot está rodando.`
      : networkErr.message;
    throw new Error(msg);
  }

  if (!resp.ok) {
    let msg = `Erro ${resp.status}`;
    try {
      const data = await resp.json();
      msg = data?.message || data?.erro || data?.error || msg;
    } catch {}

    // Diagnóstico adicional por código de status
    if (resp.status === 401) msg = "Não autorizado. Faça login novamente.";
    if (resp.status === 403) msg = "Acesso negado pelo servidor.";
    if (resp.status === 404) msg = `Recurso não encontrado: ${url}`;
    if (resp.status >= 500) msg = `Erro interno no servidor (${resp.status}). Verifique o console do Spring Boot.`;

    throw new Error(msg);
  }

  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return resp.json();
  }
  return resp;
}

// ══════════════════════════════════════════════════════════════
//  HIERARQUIA DE HABILITAÇÃO
// ══════════════════════════════════════════════════════════════
const HIERARQUIA_HAB = { A:1, B:2, AB:3, C:4, AC:5, D:6, AD:7, E:8, AE:9 };

function podeConduzir(habVeiculo, habUsuario) {
  // ADM sempre pode — vê todos os veículos
  if (isAdm()) return true;

  // Veículo sem categoria definida — qualquer um pode usar
  if (!habVeiculo) return true;

  // CORRIGIDO: técnico sem habilitação cadastrada NÃO vê nenhum veículo
  // (antes retornava true quando habUsuario era vazio, mostrando tudo)
  if (!habUsuario) return false;

  const nV = HIERARQUIA_HAB[habVeiculo.toUpperCase()] ?? 0;
  const nU = HIERARQUIA_HAB[habUsuario.toUpperCase()] ?? 0;
  return nU >= nV;
}

// ══════════════════════════════════════════════════════════════
//  FORMATAÇÃO
// ══════════════════════════════════════════════════════════════
function formatarMoeda(valor) {
  if (valor == null) return "R$ —";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarKm(valor) {
  if (valor == null) return "—";
  return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " km";
}

function formatarData(dateStr) {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("pt-BR"); }
  catch { return dateStr; }
}

function formatarDataHora(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateStr; }
}

function dataHoraAtual() {
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    data: `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`,
    hora: `${pad(agora.getHours())}:${pad(agora.getMinutes())}`,
  };
}