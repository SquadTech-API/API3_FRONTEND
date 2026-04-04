
const API_BASE_URL = 'http://localhost:8080/api'; // Ajuste conforme seu back-end

// =============================================
// ESTADO GLOBAL DA PÁGINA
// =============================================
let nfFotoBase64   = null;  // Foto da nota fiscal em base64 (opcional)
let nfFotoMimeType = null;  // MIME type da foto

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initDateTimeDefaults();
  carregarDadosUsuario();
  carregarDadosVeiculo();
  aplicarLayoutDesktop();
});

/**
 * Preenche data e hora atuais como padrão
 */
function initDateTimeDefaults() {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const hh   = String(now.getHours()).padStart(2, '0');
  const min  = String(now.getMinutes()).padStart(2, '0');

  document.getElementById('Label_data_abastecer').value = `${yyyy}-${mm}-${dd}`;
  document.getElementById('Label_hora_abastecer').value = `${hh}:${min}`;
}

// =============================================
// CARREGAR DADOS DO USUÁRIO LOGADO
// =============================================
/**
 * Busca o usuário logado no back-end (sessão/token JWT)
 * e preenche o campo de motorista.
 */
async function carregarDadosUsuario() {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/auth/me`, { headers });

    if (!response.ok) throw new Error('Usuário não autenticado.');

    const usuario = await response.json();

    // Exibe nome do motorista logado
    const el = document.getElementById('Label_motorista_abastecer');
    if (el) el.textContent = usuario.nome || usuario.name || 'Motorista';

  } catch (err) {
    console.error('[carregarDadosUsuario]', err);
    // Tenta fallback no localStorage (caso SPA que persiste dados locais)
    const usuarioLocal = getUsuarioLocal();
    if (usuarioLocal) {
      const el = document.getElementById('Label_motorista_abastecer');
      if (el) el.textContent = usuarioLocal.nome || 'Motorista';
    }
  }
}

/**
 * Tenta recuperar o usuário logado do localStorage/sessionStorage
 */
function getUsuarioLocal() {
  try {
    const raw = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// =============================================
// CARREGAR DADOS DO VEÍCULO SELECIONADO
// =============================================
/**
 * Busca o veículo que foi previamente selecionado pelo usuário.
 * Espera-se que o id do veículo esteja em sessionStorage/localStorage
 * sob a chave 'veiculoSelecionadoId'.
 */
async function carregarDadosVeiculo() {
  const veiculoId = getVeiculoSelecionadoId();

  if (!veiculoId) {
    console.warn('[carregarDadosVeiculo] Nenhum veículo selecionado.');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/veiculos/${veiculoId}`, { headers });

    if (!response.ok) throw new Error('Erro ao buscar veículo.');

    const veiculo = await response.json();
    preencherDadosVeiculo(veiculo);

  } catch (err) {
    console.error('[carregarDadosVeiculo]', err);
    // Fallback: tenta carregar do localStorage
    const veiculoLocal = getVeiculoLocal();
    if (veiculoLocal) preencherDadosVeiculo(veiculoLocal);
  }
}

/**
 * Preenche os campos visuais do veículo
 * @param {Object} veiculo
 */
function preencherDadosVeiculo(veiculo) {
  const prefix = document.getElementById('Label_prefix_abastecer');
  const modelo = document.getElementById('Label_modelo_abastecer');

  if (prefix) prefix.textContent = veiculo.prefixo || veiculo.placa || 'Viatura';
  if (modelo) modelo.textContent = veiculo.modelo  || '';
}

function getVeiculoSelecionadoId() {
  return sessionStorage.getItem('veiculoSelecionadoId')
      || localStorage.getItem('veiculoSelecionadoId')
      || null;
}

function getVeiculoLocal() {
  try {
    const raw = sessionStorage.getItem('veiculoSelecionado') || localStorage.getItem('veiculoSelecionado');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// =============================================
// HEADERS DE AUTENTICAÇÃO
// =============================================
/**
 * Monta os headers incluindo JWT Bearer token, se disponível
 */
function getAuthHeaders() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// =============================================
// UPLOAD DA NOTA FISCAL (FOTO)
// =============================================
function triggerNfUpload() {
  document.getElementById('nf_file_input').click();
}

function handleNfFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    showToast('Arquivo muito grande. Máximo 5 MB.', 'error');
    return;
  }

  nfFotoMimeType = file.type;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Armazena apenas a parte base64 (sem o prefixo data:...;base64,)
    nfFotoBase64 = e.target.result.split(',')[1];
    const label = document.getElementById('nf_filename_label');
    if (label) label.textContent = file.name;
    showToast('Foto da NF anexada com sucesso!', 'success');
  };
  reader.onerror = () => showToast('Erro ao ler o arquivo.', 'error');
  reader.readAsDataURL(file);
}

// =============================================
// VALIDAÇÃO DO FORMULÁRIO
// =============================================
/**
 * Valida os campos obrigatórios.
 * @returns {Object|null} payload válido ou null se inválido
 */
function validarFormulario() {
  const erros = [];

  const dataVal     = document.getElementById('Label_data_abastecer').value;
  const horaVal     = document.getElementById('Label_hora_abastecer').value;
  const combustivel = document.getElementById('sel_combustivel').value;
  const litros      = parseFloat(document.getElementById('Txf_litros_abastecer').value);
  const preco       = parseFloat(document.getElementById('Txf_preco_abastecer').value);
  const km          = parseFloat(document.getElementById('Txf_km_abastecer').value);
  const completo    = document.getElementById('Btn_completo_abastecer').checked;
  const nnf         = document.getElementById('Txf_nnf_abastecer').value.trim();
  const postoNome   = document.getElementById('txf_posto_nome').value.trim();
  const postoCidade = document.getElementById('txf_posto_cidade').value.trim();

  if (!dataVal)          erros.push('Data é obrigatória.');
  if (!horaVal)          erros.push('Hora é obrigatória.');
  if (!combustivel)      erros.push('Selecione o tipo de combustível.');
  if (isNaN(litros) || litros <= 0) erros.push('Quantidade de litros inválida (deve ser > 0).');
  if (isNaN(preco)  || preco  <= 0) erros.push('Preço total inválido (deve ser > 0).');
  if (isNaN(km)     || km     <  0) erros.push('Odômetro inválido.');

  if (erros.length > 0) {
    showToast(erros.join('\n'), 'error');
    return null;
  }

  // Monta data_hora no formato ISO 8601 para o Spring Boot
  const dataHora = `${dataVal}T${horaVal}:00`;

  // ID da saída: deve estar em sessão, vindo da tela anterior
  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  if (!idSaida || idSaida === 0) {
    showToast('ID de saída não encontrado. Volte e selecione uma saída.', 'error');
    return null;
  }

  return {
    nota_fiscal:           nnf         || null,
    foto:                  nfFotoBase64 ? `data:${nfFotoMimeType};base64,${nfFotoBase64}` : null,
    abast_tipo_combustivel: combustivel,
    data_hora:             dataHora,
    km_abastecimento:      km,
    quantidade_litros:     litros,
    valor_total:           preco,
    posto_nome:            postoNome   || null,
    posto_cidade:          postoCidade || null,
    id_saida:              idSaida,
    abastecimento_completo: completo,  // campo extra p/ lógica de negócio
  };
}

// =============================================
// SALVAR ABASTECIMENTO — POST no Spring Boot
// =============================================
/**
 * Envia o payload para o endpoint REST do Spring Boot.
 * POST /api/abastecimentos
 */
async function salvarAbastecimento() {
  const payload = validarFormulario();
  if (!payload) return;

  const btnSalvar = document.getElementById('Btn_salvar_abastecer');
  const overlay   = document.getElementById('loadingOverlay');

  try {
    // Bloqueia UI
    btnSalvar.disabled = true;
    overlay.classList.add('active');

    const response = await fetch(`${API_BASE_URL}/abastecimentos`, {
      method:  'POST',
      headers: getAuthHeaders(),
      body:    JSON.stringify(payload),
    });

    const data = await tryParseJson(response);

    if (response.ok || response.status === 201) {
      showToast('✔ Abastecimento salvo com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1800);
    } else {
      // Trata erros da API Spring Boot
      const mensagem = extrairMensagemErro(data, response.status);
      showToast(mensagem, 'error');
    }

  } catch (err) {
    console.error('[salvarAbastecimento]', err);
    const msg = err.message?.includes('Failed to fetch')
      ? 'Sem conexão com o servidor. Verifique a rede.'
      : `Erro inesperado: ${err.message}`;
    showToast(msg, 'error');

  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}

// =============================================
// HELPERS
// =============================================

/**
 * Tenta parsear JSON da response, sem lançar exceção
 */
async function tryParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Extrai mensagem de erro da resposta do Spring Boot
 * Suporta os formatos: { message }, { error }, { errors: [] }
 */
function extrairMensagemErro(data, status) {
  if (!data) return `Erro ${status}: Resposta inesperada do servidor.`;

  if (typeof data === 'string') return data;

  if (data.message) return `Erro: ${data.message}`;
  if (data.error)   return `Erro: ${data.error}`;

  // Spring Validation errors (MethodArgumentNotValidException)
  if (data.errors && Array.isArray(data.errors)) {
    return data.errors.map(e => e.defaultMessage || e.field).join('; ');
  }

  // Spring fieldErrors
  if (data.fieldErrors && Array.isArray(data.fieldErrors)) {
    return data.fieldErrors.map(e => `${e.field}: ${e.message}`).join('; ');
  }

  return `Erro ${status}: Falha ao salvar abastecimento.`;
}

// =============================================
// TOAST NOTIFICATION
// =============================================
let toastTimer = null;

/**
 * Exibe um toast com mensagem de sucesso ou erro
 * @param {string} msg
 * @param {'success'|'error'} tipo
 */
function showToast(msg, tipo = 'success') {
  // Remove toast anterior se existir
  const antigo = document.getElementById('globalToast');
  if (antigo) antigo.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.id        = 'globalToast';
  toast.className = `toast ${tipo}`;
  toast.textContent = msg;

  document.body.appendChild(toast);

  // Força reflow para disparar transição CSS
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  const duracao = tipo === 'error' ? 4500 : 3000;
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duracao);
}

// =============================================
// LAYOUT DESKTOP — reestrutura o form-card
// =============================================
/**
 * Em telas ≥ 768px, envolve as field-rows em um grid de 2 colunas.
 * As linhas especiais (datetime, toggle, nf) ficam com largura total.
 */
function aplicarLayoutDesktop() {
  if (window.innerWidth < 768) return;

  const formCard = document.querySelector('.form-card');
  if (!formCard || formCard.querySelector('.form-grid')) return;

  const rows     = Array.from(formCard.querySelectorAll('.field-row:not(.datetime-row):not(.toggle-row)'));
  const dividers = Array.from(formCard.querySelectorAll('.divider'));

  const grid = document.createElement('div');
  grid.className = 'form-grid';

  // Inserir o grid antes do primeiro field-row simples
  const firstSimpleRow = rows[0];
  if (!firstSimpleRow) return;
  formCard.insertBefore(grid, firstSimpleRow);

  // Move os rows simples para dentro do grid (exceto datetime, toggle, nf)
  rows.forEach(row => grid.appendChild(row));

  // Move os dividers intermediários para o grid também
  dividers.forEach(d => {
    // Apenas os que estão dentro do grid range
    if (grid.contains(d.nextSibling) || grid.contains(d.previousSibling)) {
      grid.appendChild(d);
    }
  });
}

window.addEventListener('resize', () => {
  aplicarLayoutDesktop();
});