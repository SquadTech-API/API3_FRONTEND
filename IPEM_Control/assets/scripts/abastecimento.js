// ═══════════════════════════════════════════════════════════════
//  abastecimento.js — Novo Abastecimento
//  - Exige saída ativa
//  - Mock completo
//  - Modal de erro padronizado
// ═══════════════════════════════════════════════════════════════

if (!exigirLogin()) { /* redireciona */ }

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_SAIDA_ABAST = {
  idSaida: 101,
  status: 'em_andamento',
  veiculo: { idVeiculo:1, prefixo:'FJV-01', modelo:'SPIN', kmAtual:52300, tipoCombustivel:'flex' },
};

let _urlNf = null;

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  preencherDataHoraAtual();
  carregarDadosVeiculo();
  carregarMotorista();
  verificarSaidaAtiva();
});

function preencherDataHoraAtual() {
  const dh = dataHoraAtual();
  const campoData = document.getElementById('Label_data_abastecer');
  const campoHora = document.getElementById('Label_hora_abastecer');
  if (campoData) campoData.value = dh.data;
  if (campoHora) campoHora.value = dh.hora;
}

function carregarMotorista() {
  const u     = getUsuario();
  const campo = document.getElementById('Label_motorista_abastecer');
  if (campo && u) campo.textContent = u.nomeCompleto || u.nome || 'Motorista';
}

async function carregarDadosVeiculo() {
  const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                  || localStorage.getItem('veiculoSelecionadoId');
  if (!veiculoId) return;

  let veiculo;
  if (MOCK_MODE) {
    veiculo = MOCK_SAIDA_ABAST.veiculo;
  } else {
    try {
      veiculo = await apiFetch(`/veiculos/${veiculoId}`);
    } catch {
      try { veiculo = JSON.parse(sessionStorage.getItem('veiculoSelecionado')); } catch {}
    }
  }

  if (!veiculo) return;

  const campoPrefix = document.getElementById('Label_prefix_abastecer');
  const campoModelo = document.getElementById('Label_modelo_abastecer');
  const campoKm     = document.getElementById('Txf_km_abastecer');
  const campoComb   = document.getElementById('sel_combustivel');

  if (campoPrefix) campoPrefix.textContent = `Viatura ${veiculo.prefixo || veiculo.placa || '—'}`;
  if (campoModelo) campoModelo.textContent  = veiculo.modelo || '—';
  if (campoKm && veiculo.kmAtual)         campoKm.value   = veiculo.kmAtual;
  if (campoComb && veiculo.tipoCombustivel) campoComb.value = veiculo.tipoCombustivel;
}

// ── VERIFICAR SAÍDA ATIVA ────────────────────────────────────────
async function verificarSaidaAtiva() {
  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  if (MOCK_MODE) {
    // No mock, simula que há saída ativa
    if (!idSaida) {
      sessionStorage.setItem('idSaida', MOCK_SAIDA_ABAST.idSaida);
    }
    return;
  }

  if (!idSaida) {
    showModal(
      'Saída necessária',
      'Para registrar um abastecimento é necessário ter uma saída ativa em andamento.',
      'warning',
      () => window.location.href = 'veiculos.html'
    );
    return;
  }

  // Verifica se a saída está realmente em andamento
  try {
    const saida = await apiFetch(`/registro-saidas/${idSaida}`);
    if (saida.status !== 'em_andamento') {
      showModal('Saída já encerrada',
        'A saída associada já foi encerrada. Inicie uma nova saída para registrar abastecimento.',
        'warning', () => window.location.href = 'veiculos.html');
    }
  } catch {}
}

// ── UPLOAD NF ────────────────────────────────────────────────────
function triggerNfUpload() {
  document.getElementById('nf_file_input')?.click();
}

async function handleNfFile(evento) {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;

  const label = document.getElementById('nf_filename_label');
  if (label) label.textContent = arquivo.name;

  if (MOCK_MODE) {
    _urlNf = `mock/uploads/${arquivo.name}`;
    return;
  }

  try {
    const formData = new FormData();
    formData.append('foto', arquivo);
    const resp = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: {},
      body: formData,
    });
    if (resp.ok) _urlNf = await resp.text();
  } catch {
    showToast('Upload da NF falhou.', 'warning');
  }
}

// ── VALIDAÇÃO ─────────────────────────────────────────────────────
function validarFormulario() {
  const erros = [];
  const data   = document.getElementById('Label_data_abastecer').value;
  const hora   = document.getElementById('Label_hora_abastecer').value;
  const comb   = document.getElementById('sel_combustivel').value;
  const litros = parseFloat(document.getElementById('Txf_litros_abastecer').value);
  const preco  = parseFloat(document.getElementById('Txf_preco_abastecer').value);
  const km     = parseFloat(document.getElementById('Txf_km_abastecer').value);
  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  if (!idSaida)               erros.push('Nenhuma saída ativa encontrada.');
  if (!data||!hora)           erros.push('Data e hora são obrigatórias.');
  if (!comb)                  erros.push('Selecione o tipo de combustível.');
  if (isNaN(litros)||litros<=0) erros.push('Quantidade de litros inválida.');
  if (isNaN(preco)||preco<=0)   erros.push('Valor total inválido.');
  if (isNaN(km)||km<0)          erros.push('Odômetro inválido.');

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e => `• ${e}`).join('<br>'), 'warning');
    return null;
  }

  return {
    idSaida,
    dataHora:         `${data}T${hora}:00`,
    tipoCombustivel:  comb,
    quantidadeLitros: litros,
    valorTotal:       preco,
    kmAbastecimento:  km,
    postoNome:        document.getElementById('txf_posto_nome').value.trim() || null,
    postoCidade:      document.getElementById('txf_posto_cidade').value.trim() || null,
    notaFiscal:       document.getElementById('Txf_nnf_abastecer').value.trim() || null,
    foto:             _urlNf || null,
  };
}

// ── SALVAR ────────────────────────────────────────────────────────
async function salvarAbastecimento() {
  const payload = validarFormulario();
  if (!payload) return;

  const btnSalvar = document.getElementById('Btn_salvar_abastecer');
  const overlay   = document.getElementById('loadingOverlay');
  btnSalvar.disabled = true;
  overlay.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 800));
    } else {
      await apiFetch('/abastecimento', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    showModal('Abastecimento registrado!',
      'O abastecimento foi registrado com sucesso.',
      'success',
      () => { sessionStorage.setItem('permiteNavegar','true'); window.location.href = 'veiculos.html'; });

  } catch (err) {
    showModal('Erro ao registrar', err.message || 'Não foi possível registrar o abastecimento.', 'error');
  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}
