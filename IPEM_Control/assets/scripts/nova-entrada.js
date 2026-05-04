// ═══════════════════════════════════════════════════════════════
//  nova-entrada.js — Registrar Retorno
//  - Exige saída ativa para funcionar
//  - Sem JWT
//  - Mock completo
// ═══════════════════════════════════════════════════════════════

if (!exigirLogin()) { /* redireciona */ }

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_SAIDA = {
  idSaida: 101,
  status: 'em_andamento',
  localDestino: 'Rua da Consolação, 1800 — São Paulo/SP',
  dataHoraSaida: new Date(Date.now() - 2 * 3600000).toISOString(), // 2h atrás
  kmInicial: 52300,
  tipoServico: { nomeServico: 'Inspeção de Campo' },
  veiculo: {
    idVeiculo: 1, prefixo: 'FJV-01', modelo: 'SPIN',
    placa: 'ABC1D23', kmAtual: 52300
  },
};

let _saidaAtual = null;

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  preencherDataHoraRetorno();
  carregarDadosUsuario();
  carregarDadosVeiculo();
  carregarDadosSaida();
});

function sairDaTela() {
  sessionStorage.setItem('permiteNavegar', 'true');
  window.location.href = 'veiculos.html';
}

function preencherDataHoraRetorno() {
  const dh = dataHoraAtual();
  const campoData = document.getElementById('Label_data_retorno');
  const campoHora = document.getElementById('Label_hora_retorno');
  if (campoData) campoData.value = dh.data;
  if (campoHora) campoHora.value = dh.hora;
}

function carregarDadosUsuario() {
  const u     = getUsuario();
  const campo = document.getElementById('Label_motorista_saida');
  if (campo && u) campo.textContent = u.nomeCompleto || u.nome || 'Motorista';
}

async function carregarDadosVeiculo() {
  const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                  || localStorage.getItem('veiculoSelecionadoId');
  if (!veiculoId) return;

  let veiculo;
  if (MOCK_MODE) {
    veiculo = MOCK_SAIDA.veiculo;
  } else {
    try {
      veiculo = await apiFetch(`/veiculos/${veiculoId}`);
    } catch {
      try { veiculo = JSON.parse(sessionStorage.getItem('veiculoSelecionado')); } catch {}
    }
  }
  if (veiculo) preencherVeiculo(veiculo);
}

function preencherVeiculo(v) {
  const prefixo = document.getElementById('Label_prefix_retorno');
  const modelo  = document.getElementById('Label_modelo_retorno');
  if (prefixo) prefixo.textContent = `Viatura ${v.prefixo || v.placa || '—'}`;
  if (modelo)  modelo.textContent  = v.modelo || '—';
}

async function carregarDadosSaida() {
  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  if (MOCK_MODE) {
    _saidaAtual = MOCK_SAIDA;
    preencherCamposSaida(MOCK_SAIDA);
    return;
  }

  if (idSaida) {
    await buscarSaidaPorId(idSaida);
  } else {
    const matricula = getUsuario()?.matricula;
    if (matricula) await buscarSaidaAtivaPorUsuario(matricula);
    else mostrarSemSaida();
  }
}

async function buscarSaidaPorId(id) {
  try {
    const saida = await apiFetch(`/registro-saidas/${id}`);
    _saidaAtual = saida;
    preencherCamposSaida(saida);
  } catch {
    mostrarSemSaida();
  }
}

async function buscarSaidaAtivaPorUsuario(matricula) {
  try {
    const resp = await fetch(
      `${API_BASE}/registro-saidas/ativo-usuario?matricula=${matricula}`,
      { headers: getAuthHeaders() }
    );
    if (resp.status === 404 || !resp.ok) { mostrarSemSaida(); return; }
    const saida = await resp.json();
    if (saida?.status === 'em_andamento') {
      _saidaAtual = saida;
      sessionStorage.setItem('idSaida', saida.idSaida);
      if (saida.veiculo) {
        sessionStorage.setItem('veiculoSelecionadoId', saida.veiculo.idVeiculo);
        preencherVeiculo(saida.veiculo);
      }
      preencherCamposSaida(saida);
    } else {
      mostrarSemSaida();
    }
  } catch {
    mostrarSemSaida();
  }
}

function mostrarSemSaida() {
  showModal(
    'Sem saída ativa',
    'Você não possui nenhuma saída em andamento. Para registrar um retorno, é necessário ter uma saída ativa.',
    'warning',
    () => window.location.href = 'veiculos.html'
  );
}

function preencherCamposSaida(saida) {
  if (!saida) return;
  const campoServico   = document.getElementById('Label_servico_retorno');
  const campoDestino   = document.getElementById('Label_destino_retorno');
  const campoDataSaida = document.getElementById('Label_datasaida_retorno');
  const campoKm        = document.getElementById('Txf_km_retorno');

  if (campoServico)   campoServico.value   = saida.tipoServico?.nomeServico || '—';
  if (campoDestino)   campoDestino.value   = saida.localDestino || '—';
  if (campoDataSaida && saida.dataHoraSaida)
    campoDataSaida.value = formatarDataHora(saida.dataHoraSaida);
  if (saida.kmInicial != null && campoKm) {
    campoKm.min         = saida.kmInicial;
    campoKm.placeholder = `Mín: ${saida.kmInicial}`;
  }
}

// ── VALIDAÇÃO ─────────────────────────────────────────────────────
function validarFormulario() {
  const erros = [];
  const data    = document.getElementById('Label_data_retorno').value;
  const hora    = document.getElementById('Label_hora_retorno').value;
  const km      = parseFloat(document.getElementById('Txf_km_retorno').value);
  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  if (!data)             erros.push('Data de retorno é obrigatória.');
  if (!hora)             erros.push('Hora de retorno é obrigatória.');
  if (isNaN(km)||km<0)  erros.push('Odômetro final inválido.');
  if (!idSaida)          erros.push('ID da saída não encontrado.');

  if (_saidaAtual?.kmInicial != null && !isNaN(km) && km < _saidaAtual.kmInicial)
    erros.push(`Odômetro final (${km}) não pode ser menor que o de saída (${_saidaAtual.kmInicial}).`);

  if (_saidaAtual?.dataHoraSaida && data && hora) {
    const dtRet   = new Date(`${data}T${hora}:00`);
    const dtSaida = new Date(_saidaAtual.dataHoraSaida);
    if (dtRet < dtSaida) erros.push('Data/hora do retorno não pode ser anterior à saída.');
  }

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e => `• ${e}`).join('<br>'), 'warning');
    return null;
  }

  return { kmFinal: km, dataRetorno: `${data}T${hora}:00`, id_saida: idSaida };
}

// ── SALVAR ────────────────────────────────────────────────────────
async function salvarRetorno() {
  const payload = validarFormulario();
  if (!payload) return;

  const btnSalvar = document.getElementById('Btn_salvar_retorno');
  const overlay   = document.getElementById('loadingOverlay');
  btnSalvar.disabled = true;
  overlay.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 800));
    } else {
      await apiFetch(`/registro-saidas/${payload.id_saida}/retorno`, {
        method: 'PATCH',
        body: JSON.stringify({ kmFinal: payload.kmFinal, dataRetorno: payload.dataRetorno }),
      });
    }

    // Limpa sessão
    ['idSaida','veiculoSelecionadoId','veiculoSelecionado','permiteNavegar']
      .forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });

    showModal('Retorno registrado!',
      'O retorno foi registrado com sucesso.',
      'success',
      () => window.location.href = 'veiculos.html');

  } catch (err) {
    showModal('Erro ao registrar retorno', err.message || 'Não foi possível registrar o retorno.', 'error');
  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}
