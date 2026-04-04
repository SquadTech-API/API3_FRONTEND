// =============================================
// CONFIGURAÇÃO
// =============================================
const API_BASE_URL = 'http://localhost:8080/api';

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initDateTimeDefaults();
  carregarDadosUsuario();
  carregarDadosVeiculo();
  carregarServicos();
});

// =============================================
// DATA E HORA AUTOMÁTICAS
// =============================================
function initDateTimeDefaults() {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const hh   = String(now.getHours()).padStart(2, '0');
  const min  = String(now.getMinutes()).padStart(2, '0');

  const dataInput = document.getElementById('Label_data_saida');
  const horaInput = document.getElementById('Label_hora_saida');
  if (dataInput) dataInput.value = `${yyyy}-${mm}-${dd}`;
  if (horaInput) horaInput.value = `${hh}:${min}`;
}

// =============================================
// USUÁRIO LOGADO
// =============================================
async function carregarDadosUsuario() {
  try {
    const resp = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
    if (!resp.ok) throw new Error('Não autenticado');
    const usuario = await resp.json();
    preencherMotorista(usuario);
  } catch {
    const local = getLocalJson('usuario');
    if (local) preencherMotorista(local);
  }
}

function preencherMotorista(usuario) {
  const el = document.getElementById('Label_motorista_saida');
  if (el) el.textContent = usuario.nome || usuario.name || 'Motorista';
}

// =============================================
// VEÍCULO SELECIONADO
// =============================================
async function carregarDadosVeiculo() {
  const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                 || localStorage.getItem('veiculoSelecionadoId');

  if (!veiculoId) {
    const local = getLocalJson('veiculoSelecionado');
    if (local) preencherVeiculo(local);
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/veiculos/${veiculoId}`, { headers: getAuthHeaders() });
    if (!resp.ok) throw new Error('Erro ao carregar veículo');
    const veiculo = await resp.json();
    preencherVeiculo(veiculo);

    // Salva km atual como sugestão para o odômetro
    if (veiculo.km_atual) {
      const kmInput = document.getElementById('Txf_km_saida');
      if (kmInput && !kmInput.value) kmInput.value = veiculo.km_atual;
    }
  } catch {
    const local = getLocalJson('veiculoSelecionado');
    if (local) preencherVeiculo(local);
  }
}

function preencherVeiculo(v) {
  const prefix = document.getElementById('Label_prefix_saida');
  const modelo = document.getElementById('Label_modelo_saida');
  if (prefix) prefix.textContent = v.prefixo || v.placa || 'Viatura';
  if (modelo) modelo.textContent = v.modelo  || '—';
}
// =============================================
// CARREGAR SERVIÇOS (tipo_servico)
// =============================================
async function carregarServicos() {
  const select = document.getElementById('Ddl_servico_saida');
  if (!select) return;

  const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                 || localStorage.getItem('veiculoSelecionadoId');

  const endpoint = veiculoId
    ? `${API_BASE_URL}/veiculos/${veiculoId}/servicos`
    : `${API_BASE_URL}/tipo-servicos`;

  try {
    const resp = await fetch(endpoint, { headers: getAuthHeaders() });
    if (!resp.ok) throw new Error('Erro ao carregar serviços');
    const data = await resp.json();

    const lista = Array.isArray(data) ? data : (data.content || []);

    select.innerHTML = '<option value="">SELECIONE</option>';

    lista.forEach(item => {
      const id   = item.id_tipo_servico || item.tipoServico?.id_tipo_servico || item.id;
      const nome = item.nome_servico    || item.tipoServico?.nome_servico    || item.nome || '—';
      if (id) {
        const opt = document.createElement('option');
        opt.value       = id;
        opt.textContent = nome;
        select.appendChild(opt);
      }
    });

  } catch (err) {
    console.warn('[carregarServicos]', err.message);
  }
}

// =============================================
// VALIDAÇÃO
// =============================================
function validarFormulario() {
  const erros = [];

  const dataVal  = document.getElementById('Label_data_saida').value;
  const horaVal  = document.getElementById('Label_hora_saida').value;
  const km       = parseFloat(document.getElementById('Txf_km_saida').value);
  const servico  = document.getElementById('Ddl_servico_saida').value;
  const endereco = document.getElementById('Txf_end_saida').value.trim();

  if (!dataVal)              erros.push('Data de saída é obrigatória.');
  if (!horaVal)              erros.push('Hora de saída é obrigatória.');
  if (isNaN(km) || km < 0)  erros.push('Odômetro inválido.');
  if (!servico)              erros.push('Selecione o tipo de serviço.');
  if (!endereco)             erros.push('Endereço / local de destino é obrigatório.');

  const veiculoId = parseInt(
    sessionStorage.getItem('veiculoSelecionadoId') ||
    localStorage.getItem('veiculoSelecionadoId') || '0', 10
  );
  if (!veiculoId) erros.push('Nenhum veículo selecionado. Volte e selecione um veículo.');

  const matricula = getMatriculaUsuario();
  if (!matricula) erros.push('Usuário não autenticado. Faça login novamente.');

  if (erros.length > 0) {
    showToast(erros.join('\n'), 'error');
    return null;
  }

  const complemento  = document.getElementById('Txf_cmp_saida').value.trim();
  const localDestino = complemento ? `${endereco} — ${complemento}` : endereco;

  return {
    local_destino:     localDestino,
    id_tipo_servico:   parseInt(servico, 10),
    status:            'em_andamento',
    observacoes:       complemento || null,
    data_hora_saida:   `${dataVal}T${horaVal}:00`,
    km_inicial:        km,
    id_veiculo:        veiculoId,
    matricula_usuario: matricula,
  };
}

// =============================================
// SALVAR SAÍDA —
// =============================================
async function salvarSaida() {
  const payload = validarFormulario();
  if (!payload) return;

  const btnSalvar = document.getElementById('Btn_salvar_saida');
  const overlay   = document.getElementById('loadingOverlay');

  try {
    btnSalvar.disabled = true;
    overlay.classList.add('active');

    const resp = await fetch(`${API_BASE_URL}/registro-saidas`, {
      method:  'POST',
      headers: getAuthHeaders(),
      body:    JSON.stringify(payload),
    });

    const data = await tryParseJson(resp);

    if (resp.ok || resp.status === 201) {
      const idSaida = data?.id_saida || data?.id || null;
      if (idSaida) {
        sessionStorage.setItem('idSaida', idSaida);
        localStorage.setItem('idSaida', idSaida);
      }

      showToast('✔ Saída registrada com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    } else {
      showToast(extrairMensagemErro(data, resp.status), 'error');
    }

  } catch (err) {
    console.error('[salvarSaida]', err);
    const msg = err.message?.includes('Failed to fetch')
      ? 'Sem conexão com o servidor.'
      : `Erro inesperado: ${err.message}`;
    showToast(msg, 'error');
  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}
// =============================================
// HELPERS AUTH / LOCAL STORAGE
// =============================================
function getAuthHeaders() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function getMatriculaUsuario() {
  const raw = sessionStorage.getItem('matricula') || localStorage.getItem('matricula');
  if (raw) return parseInt(raw, 10);
  const usuario = getLocalJson('usuario');
  return usuario?.matricula || null;
}

function getLocalJson(key) {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// =============================================
// PARSE JSON SEGURO
// =============================================
async function tryParseJson(resp) {
  try { return await resp.json(); } catch { return null; }
}

// =============================================
// EXTRAÇÃO DE ERRO DO SPRING BOOT
// =============================================
function extrairMensagemErro(data, status) {
  if (!data) return `Erro ${status}: Resposta inesperada.`;
  if (typeof data === 'string') return data;
  if (data.message) return `Erro: ${data.message}`;
  if (data.error)   return `Erro: ${data.error}`;
  if (Array.isArray(data.errors))
    return data.errors.map(e => e.defaultMessage || e.field).join('; ');
  if (Array.isArray(data.fieldErrors))
    return data.fieldErrors.map(e => `${e.field}: ${e.message}`).join('; ');
  return `Erro ${status}: Falha ao registrar saída.`;
}

// =============================================
// TOAST
// =============================================
let _toastTimer = null;

function showToast(msg, tipo = 'success') {
  const antigo = document.getElementById('_toast');
  if (antigo) antigo.remove();
  if (_toastTimer) clearTimeout(_toastTimer);

  const t = document.createElement('div');
  t.id = '_toast';
  t.className = `toast ${tipo}`;
  t.textContent = msg;
  document.body.appendChild(t);

  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));

  _toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, tipo === 'error' ? 4500 : 3000);
}