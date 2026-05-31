/* ── Toggle senha ── */
  const SVG_VISIBLE  = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  const SVG_HIDDEN   = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';

  const passInput = document.getElementById('input-password');
  const eyeIcon   = document.getElementById('eye-icon');
  const toggleBtn = document.getElementById('btn-toggle-password');

  toggleBtn.addEventListener('click', () => {
    const visible = passInput.type === 'text';
    passInput.type = visible ? 'password' : 'text';
    eyeIcon.innerHTML = visible ? SVG_VISIBLE : SVG_HIDDEN;
    toggleBtn.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha');
  });

  /* ── Modal helper ── */
  function showModal(title, msg, type = 'error') {
    const types = { error: '✕', warning: '⚠', info: 'i' };
    document.getElementById('modal-icon').className = `modal-icon ${type}`;
    document.getElementById('modal-icon').textContent = types[type] ?? '✕';
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-msg').textContent   = msg;
    document.getElementById('modal-overlay').classList.add('active');
  }

  document.getElementById('modal-btn').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('active');
  });

  /* ── Login ── */
  const btnLogin = document.getElementById('btn-login');

  async function executeLogin() {
    const email    = document.getElementById('input-email').value.trim();
    const password = document.getElementById('input-password').value;

    if (!email || !password) {
      showModal('Campos obrigatórios', 'Preencha o e-mail e a senha para continuar.', 'warning');
      return;
    }

    btnLogin.disabled     = true;
    btnLogin.textContent  = 'Entrando...';

    try {
      const response = await fetch(`${CONFIG.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => null);
        showModal('Acesso negado', data?.message ?? 'E-mail ou senha incorretos.', 'error');
        return;
      }

      if (!response.ok) {
        showModal('Erro no servidor', `Não foi possível conectar (erro ${response.status}). Tente novamente.`, 'error');
        return;
      }

      const user = await response.json();

      if (user.activeEmployee === false) {
        showModal('Conta inativa', 'Sua conta está desativada. Entre em contato com o administrador.', 'error');
        return;
      }

      /* Salva sessão em en-US */
      const session = {
        registration:  user.registration,
        name:          user.name ?? user.fullName,
        fullName:      user.fullName ?? user.name,
        role:          user.role,
        userType:      user.userType,
        email:         user.email,
        licenseType:   user.licenseType ?? null,
        token:         user.token ?? null,
      };

      sessionStorage.setItem('user', JSON.stringify(session));
      if (session.token) {
        sessionStorage.setItem('token', session.token);
      }

      window.location.href = session.userType === "admin" ? "./dashboard.html" : "./vehicles.html";

    } catch (err) {
      const msg = err.message?.includes('Failed to fetch')
        ? 'Não foi possível conectar ao servidor. Verifique sua conexão.'
        : `Erro inesperado: ${err.message}`;
      showModal('Sem conexão', msg, 'error');
    } finally {
      btnLogin.disabled    = false;
      btnLogin.textContent = 'Entrar';
    }
  }

  btnLogin.addEventListener('click', executeLogin);

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') executeLogin();
  });

  /* ── Esqueceu senha ── */
  document.getElementById('btn-forgot').addEventListener('click', () => {
    showModal(
      'Redefinição de senha',
      'Entre em contato com o administrador do sistema para redefinir sua senha de acesso.',
      'info'
    );
  });

  /* ── Redireciona se já está logado ── */
  try {
    const stored = sessionStorage.getItem('user');
    if (stored && JSON.parse(stored)) {
      window.location.href = session.userType === "admin" ? "./dashboard.html" : "./vehicles.html";
    }
  } catch { /* silent */ }
