// =============================================
// CONFIGURAÇÃO
// =============================================
const API_BASE_URL = 'http://localhost:8080';

let _saidaAtual = null;

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initDateTimeRetorno();
  carregarDadosUsuario();
  carregarDadosVeiculo();
  carregarDadosSaida();
});

// =============================================
// SAIR DA TELA — 
// =============================================

function sairDaTela() {
  sessionStorage.setItem('permiteNavegar', 'true');
  window.location.href = 'tela_veiculos.html';
}

// =============================================
// DATA E HORA DE RETORNO = AGORA
// =============================================
function initDateTimeRetorno() {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const hh   = String(now.getHours()).padStart(2, '0');
  const min  = String(now.getMinutes()).padStart(2, '0');

  const dataEl = document.getElementById('Label_data_retorno');
  const horaEl = document.getElementById('Label_hora_retorno');
  if (dataEl) dataEl.value = `${yyyy}-${mm}-${dd}`;
  if (horaEl) horaEl.value = `${hh}:${min}`;
}

// =============================================
// USUÁRIO LOGADO
// =============================================
async function carregarDadosUsuario() {
  const local = getLocalJson('usuario');
  if (local) { preencherMotorista(local); return; }
  try {
    const resp = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
    if (!resp.ok) throw new Error();
    preencherMotorista(await resp.json());
  } catch {
    preencherMotorista({ nomeCompleto: 'Motorista' });
  }
}

function preencherMotorista(u) {
  const el = document.getElementById('Label_motorista_saida');
  if (el) el.textContent = u.nomeCompleto || u.nome || 'Motorista';
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
    if (!resp.ok) throw new Error();
    preencherVeiculo(await resp.json());
  } catch {
    const local = getLocalJson('veiculoSelecionado');
    if (local) preencherVeiculo(local);
  }
}

function preencherVeiculo(v) {
  const prefix = document.getElementById('Label_prefix_retorno');
  const modelo = document.getElementById('Label_modelo_retorno');
  if (prefix) prefix.textContent = `Viatura ${v.prefixo || v.placa || '—'}`;
  if (modelo) modelo.textContent = v.modelo || '—';
}

// =============================================
// CARREGAR DADOS DA SAÍDA ATIVA
// =============================================
async function carregarDadosSaida() {
  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  if (!idSaida) {
    const matricula = getMatriculaUsuario();
    if (matricula) await buscarSaidaAtivaPorUsuario(matricula);
    else preencherCamposSaida(null);
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/registro-saidas/${idSaida}`, { headers: getAuthHeaders() });
    if (!resp.ok) throw new Error();
    const saida = await resp.json();
    _saidaAtual = saida;
    preencherCamposSaida(saida);
  } catch {
    preencherCamposSaida(null);
  }
}

async function buscarSaidaAtivaPorUsuario(matricula) {
  try {
    const resp = await fetch(
      `${API_BASE_URL}/registro-saidas/ativo-usuario?matricula=${matricula}`,
      { headers: getAuthHeaders() }
    );
    if (!resp.ok) { preencherCamposSaida(null); return; }
    const saida = await resp.json();
    if (saida?.status === 'em_andamento') {
      _saidaAtual = saida;
      sessionStorage.setItem('idSaida', saida.idSaida);
      localStorage.setItem('idSaida',   saida.idSaida);
      preencherCamposSaida(saida);
    } else {
      preencherCamposSaida(null);
    }
  } catch {
    preencherCamposSaida(null);
  }
}

function preencherCamposSaida(saida) {
  const servicoEl   = document.getElementById('Label_servico_retorno');
  const destinoEl   = document.getElementById('Label_destino_retorno');
  const dataSaidaEl = document.getElementById('Label_datasaida_retorno');
  const kmEl        = document.getElementById('Txf_km_retorno');

  if (!saida) {
    if (servicoEl)   servicoEl.value   = 'Não encontrado';
    if (destinoEl)   destinoEl.value   = 'Não encontrado';
    if (dataSaidaEl) dataSaidaEl.value = '—';
    return;
  }

  if (servicoEl)
    servicoEl.value = saida.tipoServico?.nomeServico || saida.tipoServico?.nome_servico || '—';

  if (destinoEl)
    destinoEl.value = saida.localDestino || '—';

  if (dataSaidaEl && saida.dataHoraSaida) {
    dataSaidaEl.value = new Date(saida.dataHoraSaida).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (saida.kmInicial != null && kmEl) {
    kmEl.min         = saida.kmInicial;
    kmEl.placeholder = `Mín: ${saida.kmInicial}`;
  }
}

// =============================================
// VALIDAÇÃO
// =============================================
function validarFormulario() {
  const erros = [];
  const dataVal = document.getElementById('Label_data_retorno').value;
  const horaVal = document.getElementById('Label_hora_retorno').value;
  const km      = parseFloat(document.getElementById('Txf_km_retorno').value);

  if (!dataVal)             erros.push('Data de retorno é obrigatória.');
  if (!horaVal)             erros.push('Hora de retorno é obrigatória.');
  if (isNaN(km) || km < 0) erros.push('Odômetro final inválido.');

  if (_saidaAtual?.kmInicial != null && !isNaN(km) && km < _saidaAtual.kmInicial)
    erros.push(`Odômetro final (${km}) não pode ser menor que o de saída (${_saidaAtual.kmInicial}).`);

  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );
  if (!idSaida) erros.push('ID de saída não encontrado.');

  if (_saidaAtual?.dataHoraSaida && dataVal && horaVal) {
    if (new Date(`${dataVal}T${horaVal}:00`) < new Date(_saidaAtual.dataHoraSaida))
      erros.push('Data/hora de retorno não pode ser anterior à saída.');
  }

  if (erros.length > 0) { showToast(erros.join('\n'), 'error'); return null; }

  return { kmFinal: km, dataRetorno: `${dataVal}T${horaVal}:00`, id_saida: idSaida };
}

// =============================================
// SALVAR RETORNO
// =============================================
async function salvarRetorno() {
  const payload = validarFormulario();
  if (!payload) return;

  const btnSalvar = document.getElementById('Btn_salvar_retorno');
  const overlay   = document.getElementById('loadingOverlay');

  try {
    btnSalvar.disabled = true;
    overlay.classList.add('active');

    const resp = await fetch(
      `${API_BASE_URL}/registro-saidas/${payload.id_saida}/retorno`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ kmFinal: payload.kmFinal, dataRetorno: payload.dataRetorno }),
      }
    );

    const data = await tryParseJson(resp);

    if (resp.ok || resp.status === 200) {
      // Limpa tudo relacionado à saída
      sessionStorage.removeItem('idSaida');
      sessionStorage.removeItem('veiculoSelecionadoId');
      sessionStorage.removeItem('veiculoSelecionado');
      sessionStorage.removeItem('permiteNavegar');
      localStorage.removeItem('idSaida');
      localStorage.removeItem('veiculoSelecionadoId');

      showToast('✔ Retorno registrado com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'tela_veiculos.html'; }, 1800);
    } else {
      showToast(extrairMensagemErro(data, resp.status), 'error');
    }
  } catch (err) {
    showToast(
      err.message?.includes('Failed to fetch') ? 'Sem conexão com o servidor.' : `Erro: ${err.message}`,
      'error'
    );
  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}

// =============================================
// HELPERS
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
  return getLocalJson('usuario')?.matricula || null;
}

function getLocalJson(key) {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function tryParseJson(resp) {
  try { return await resp.json(); } catch { return null; }
}

function extrairMensagemErro(data, status) {
  if (!data) return `Erro ${status}.`;
  if (typeof data === 'string') return data;
  if (data.message) return `Erro: ${data.message}`;
  if (data.erro)    return `Erro: ${data.erro}`;
  if (data.error)   return `Erro: ${data.error}`;
  if (Array.isArray(data.errors)) return data.errors.map(e => e.defaultMessage || e.field).join('; ');
  return `Erro ${status}: Falha ao registrar retorno.`;
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