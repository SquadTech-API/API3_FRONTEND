/**
 * nova_entrada.js
 * Tela: Registrar Retorno
 * Integração completa com Spring Boot
 * Operação: PATCH /api/registro-saidas/{id}/retorno
 *
 * Campos automáticos (vindos da última saída do veículo):
 *   - Data e hora de retorno → agora (preenchido ao carregar)
 *   - Serviço → saida.tipoServico.nome_servico
 *   - Destino → saida.local_destino
 *   - Data/hora da saída → saida.data_hora_saida (formatada)
 *
 * Único campo que o usuário preenche: Odômetro final
 */

// =============================================
// CONFIGURAÇÃO
// =============================================
const API_BASE_URL = 'http://localhost:8080/api';

// Dados da saída ativa (usados na validação)
let _saidaAtual = null;

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initDateTimeRetorno();
  carregarDadosUsuario();
  carregarDadosVeiculo();
  carregarDadosSaida();
  // REMOVIDO: aplicarLayoutDesktop() — grid já está estático no HTML
});

// =============================================
// DATA E HORA DE RETORNO = AGORA (automático)
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
  } catch {
    const local = getLocalJson('veiculoSelecionado');
    if (local) preencherVeiculo(local);
  }
}

function preencherVeiculo(v) {
  const prefix = document.getElementById('Label_prefix_retorno');
  const modelo = document.getElementById('Label_modelo_retorno');
  if (prefix) prefix.textContent = v.prefixo || v.placa || 'Viatura';
  if (modelo) modelo.textContent = v.modelo  || '—';
}

// =============================================
// CARREGAR DADOS DA SAÍDA ATIVA
// Preenche automaticamente: serviço, destino e data/hora da saída
// =============================================
async function carregarDadosSaida() {
  let idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  // Fallback: busca saída ativa do veículo pela API
  if (!idSaida) {
    const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                   || localStorage.getItem('veiculoSelecionadoId');
    if (veiculoId) {
      idSaida = await buscarSaidaAtivaPorVeiculo(veiculoId);
    }
  }

  if (!idSaida) {
    preencherCamposSaida(null);
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/registro-saidas/${idSaida}`, {
      headers: getAuthHeaders(),
    });
    if (!resp.ok) throw new Error('Registro de saída não encontrado');
    const saida = await resp.json();
    _saidaAtual = saida;
    preencherCamposSaida(saida);
  } catch (err) {
    console.warn('[carregarDadosSaida]', err.message);
    preencherCamposSaida(null);
  }
}

async function buscarSaidaAtivaPorVeiculo(veiculoId) {
  try {
    const resp = await fetch(
      `${API_BASE_URL}/registro-saidas/ativo?veiculoId=${veiculoId}`,
      { headers: getAuthHeaders() }
    );
    if (!resp.ok) return 0;
    const data = await resp.json();
    const id = data?.id_saida || data?.id || 0;
    if (id) {
      sessionStorage.setItem('idSaida', id);
      localStorage.setItem('idSaida', id);
    }
    return id;
  } catch { return 0; }
}

/**
 * Preenche os campos readonly com os dados da saída ativa:
 *   - Serviço realizado
 *   - Destino / local
 *   - Data e hora da saída (formatada em pt-BR)
 * e define o valor mínimo do odômetro final.
 */
function preencherCamposSaida(saida) {
  const servicoEl  = document.getElementById('Label_servico_retorno');
  const destinoEl  = document.getElementById('Label_destino_retorno');
  const dataSaidaEl = document.getElementById('Label_datasaida_retorno');
  const kmEl       = document.getElementById('Txf_km_retorno');

  if (!saida) {
    if (servicoEl)   servicoEl.value   = 'Não encontrado';
    if (destinoEl)   destinoEl.value   = 'Não encontrado';
    if (dataSaidaEl) dataSaidaEl.value = '—';
    return;
  }

  // Serviço
  const nomeServico = saida.tipoServico?.nome_servico
                   || saida.tipo_servico?.nome_servico
                   || saida.nome_servico
                   || `Serviço #${saida.id_tipo_servico || '—'}`;
  if (servicoEl) servicoEl.value = nomeServico;

  // Destino
  if (destinoEl) destinoEl.value = saida.local_destino || '—';

  // Data/hora da saída formatada
  if (dataSaidaEl && saida.data_hora_saida) {
    const dt = new Date(saida.data_hora_saida);
    dataSaidaEl.value = dt.toLocaleString('pt-BR', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  }

  // Define km_inicial como mínimo do odômetro de retorno
  if (saida.km_inicial && kmEl) {
    kmEl.min = saida.km_inicial;
    kmEl.placeholder = `Mín: ${saida.km_inicial}`;
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

  // km_final >= km_inicial
  if (_saidaAtual?.km_inicial && !isNaN(km) && km < _saidaAtual.km_inicial) {
    erros.push(
      `Odômetro final (${km}) não pode ser menor que o odômetro de saída (${_saidaAtual.km_inicial}).`
    );
  }

  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );
  if (!idSaida) erros.push('ID de saída não encontrado. Volte e inicie uma saída.');

  // data_retorno >= data_hora_saida
  if (_saidaAtual?.data_hora_saida && dataVal && horaVal) {
    const dtRetorno = new Date(`${dataVal}T${horaVal}:00`);
    const dtSaida   = new Date(_saidaAtual.data_hora_saida);
    if (dtRetorno < dtSaida) {
      erros.push('Data/hora de retorno não pode ser anterior à data/hora de saída.');
    }
  }

  if (erros.length > 0) {
    showToast(erros.join('\n'), 'error');
    return null;
  }

  return {
    data_retorno: `${dataVal}T${horaVal}:00`,
    km_final:     km,
    status:       'concluido',
    id_saida:     idSaida,
  };
}

// =============================================
// SALVAR RETORNO — PATCH /api/registro-saidas/{id}/retorno
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
        method:  'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          data_retorno: payload.data_retorno,
          km_final:     payload.km_final,
          status:       payload.status,
        }),
      }
    );

    const data = await tryParseJson(resp);

    if (resp.ok || resp.status === 200) {
      sessionStorage.removeItem('idSaida');
      localStorage.removeItem('idSaida');

      showToast('✔ Retorno registrado com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    } else {
      showToast(extrairMensagemErro(data, resp.status), 'error');
    }

  } catch (err) {
    console.error('[salvarRetorno]', err);
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
// HELPERS
// =============================================
function getAuthHeaders() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
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
  if (!data) return `Erro ${status}: Resposta inesperada.`;
  if (typeof data === 'string') return data;
  if (data.message) return `Erro: ${data.message}`;
  if (data.error)   return `Erro: ${data.error}`;
  if (Array.isArray(data.errors))
    return data.errors.map(e => e.defaultMessage || e.field).join('; ');
  if (Array.isArray(data.fieldErrors))
    return data.fieldErrors.map(e => `${e.field}: ${e.message}`).join('; ');
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