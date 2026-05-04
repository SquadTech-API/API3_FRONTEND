// ═══════════════════════════════════════════════════════════════
//  troca-de-oleo.js — Registrar Troca de Óleo
//  - Exige saída ativa
//  - Mock completo
//  - MOCK_MODE = false para conectar ao banco
// ═══════════════════════════════════════════════════════════════

if (!exigirLogin()) { /* redireciona */ }

// ── MOCK ─────────────────────────────────────────────────────────
const MOCK_VEICULO_TROCA = {
  idVeiculo: 1, prefixo: 'FJV-01', modelo: 'SPIN',
  placa: 'ABC1D23', kmAtual: 52300,
  intervaloTrocaOleoKm: 5000,
};
const MOCK_SAIDAS_VEICULO = [
  { idSaida:101, descricao:'Saída #101 — Inspeção de Campo — 30/04/2025' },
  { idSaida:95,  descricao:'Saída #95 — Fiscalização — 15/04/2025' },
];

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDateDefault();
  carregarVeiculo();
  carregarSaidas();
  initPreviewProximaTroca();
  verificarSaidaAtiva();
});

function initDateDefault() {
  const hoje  = new Date();
  const yyyy  = hoje.getFullYear();
  const mm    = String(hoje.getMonth()+1).padStart(2,'0');
  const dd    = String(hoje.getDate()).padStart(2,'0');
  const input = document.getElementById('input_data_troca');
  if (input) input.value = `${yyyy}-${mm}-${dd}`;
}

// ── VERIFICAR SAÍDA ATIVA ─────────────────────────────────────────
async function verificarSaidaAtiva() {
  const idSaida = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  if (MOCK_MODE) {
    if (!idSaida) sessionStorage.setItem('idSaida', MOCK_SAIDAS_VEICULO[0].idSaida);
    return;
  }

  if (!idSaida) {
    showModal(
      'Saída necessária',
      'Para registrar uma troca de óleo é necessário ter uma saída ativa em andamento.',
      'warning',
      () => window.location.href = 'veiculos.html'
    );
    return;
  }

  try {
    const saida = await apiFetch(`/registro-saidas/${idSaida}`);
    if (saida.status !== 'em_andamento') {
      showModal('Saída já encerrada',
        'A saída associada já foi encerrada. Inicie uma nova saída para registrar troca de óleo.',
        'warning', () => window.location.href = 'veiculos.html');
    }
    // Verifica se o tipo de serviço permite troca de óleo
    if (saida.tipoServico && !saida.tipoServico.ehTrocaOleo) {
      showModal(
        'Serviço incompatível',
        `O tipo de serviço "${saida.tipoServico.nomeServico}" não permite registrar troca de óleo. Selecione uma saída do tipo "Troca de Óleo".`,
        'warning'
      );
    }
  } catch { /* silencioso */ }
}

// ── CARREGAR VEÍCULO ──────────────────────────────────────────────
async function carregarVeiculo() {
  let veiculo;

  if (MOCK_MODE) {
    veiculo = MOCK_VEICULO_TROCA;
  } else {
    const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                    || localStorage.getItem('veiculoSelecionadoId');
    if (!veiculoId) return;
    try {
      veiculo = await apiFetch(`/veiculos/${veiculoId}`);
      sessionStorage.setItem('veiculoSelecionado', JSON.stringify(veiculo));
    } catch {
      try { veiculo = JSON.parse(sessionStorage.getItem('veiculoSelecionado')); } catch {}
    }
  }

  if (!veiculo) return;

  const prefixo = document.getElementById('label_prefixo_veiculo');
  const modelo  = document.getElementById('label_modelo_veiculo');
  const km      = document.getElementById('label_km_atual');
  const inputKm = document.getElementById('input_km_troca');
  const inputInt = document.getElementById('input_intervalo_km');

  if (prefixo) prefixo.textContent = `Viatura ${veiculo.prefixo || '—'}`;
  if (modelo)  modelo.textContent  = veiculo.modelo || '—';
  if (km)      km.textContent      = veiculo.kmAtual != null
    ? `${Number(veiculo.kmAtual).toLocaleString('pt-BR')} km` : '—';

  if (inputKm && !inputKm.value && veiculo.kmAtual) {
    inputKm.value = veiculo.kmAtual;
    calcularProximaTroca();
  }
  if (inputInt && veiculo.intervaloTrocaOleoKm) {
    inputInt.value = veiculo.intervaloTrocaOleoKm;
    calcularProximaTroca();
  }
}

// ── CARREGAR SAÍDAS DO VEÍCULO ────────────────────────────────────
async function carregarSaidas() {
  const select = document.getElementById('select_saida_vinculada');
  if (!select) return;

  let saidas = [];

  if (MOCK_MODE) {
    saidas = MOCK_SAIDAS_VEICULO;
  } else {
    const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                    || localStorage.getItem('veiculoSelecionadoId');
    if (!veiculoId) return;
    try {
      // Endpoint: saídas concluídas do veículo com tipo ehTrocaOleo=true
      const dados = await apiFetch(`/registro-saidas/veiculo/${veiculoId}/troca-oleo`);
      const lista = Array.isArray(dados) ? dados : dados.content || [];
      saidas = lista.map(s => ({
        idSaida: s.idSaida,
        descricao: `Saída #${s.idSaida} — ${s.tipoServico?.nomeServico || '—'} — ${
          s.dataHoraSaida ? new Date(s.dataHoraSaida).toLocaleDateString('pt-BR') : '—'}`,
      }));
    } catch { saidas = []; }
  }

  // Pré-seleciona a saída ativa da sessão
  const idSaidaAtiva = parseInt(
    sessionStorage.getItem('idSaida') || localStorage.getItem('idSaida') || '0', 10
  );

  select.innerHTML = '<option value="">Nenhuma</option>';
  saidas.forEach(s => {
    const opt = document.createElement('option');
    opt.value       = s.idSaida;
    opt.textContent = s.descricao;
    if (s.idSaida === idSaidaAtiva) opt.selected = true;
    select.appendChild(opt);
  });
}

// ── PREVIEW PRÓXIMA TROCA ─────────────────────────────────────────
function initPreviewProximaTroca() {
  document.getElementById('input_km_troca')?.addEventListener('input', calcularProximaTroca);
  document.getElementById('input_intervalo_km')?.addEventListener('input', calcularProximaTroca);
}

function calcularProximaTroca() {
  const km        = parseFloat(document.getElementById('input_km_troca').value);
  const intervalo = parseFloat(document.getElementById('input_intervalo_km').value);
  const preview   = document.getElementById('proxima_troca_preview');
  const texto     = document.getElementById('texto_proxima_troca');

  if (!preview||!texto) return;

  if (isNaN(km)||isNaN(intervalo)||intervalo<=0) {
    preview.className = 'proxima-troca-preview';
    texto.textContent = 'Informe o KM da troca e o intervalo';
    return;
  }

  const proxima = km + intervalo;
  texto.textContent = `Próxima troca: ${proxima.toLocaleString('pt-BR')} km`;

  // Alerta se KM já ultrapassado
  let kmAtualVeic;
  try { kmAtualVeic = MOCK_MODE
    ? MOCK_VEICULO_TROCA.kmAtual
    : JSON.parse(sessionStorage.getItem('veiculoSelecionado'))?.kmAtual;
  } catch {}

  if (kmAtualVeic && proxima <= kmAtualVeic) {
    preview.className = 'proxima-troca-preview alerta';
    texto.textContent += ' ⚠ KM já ultrapassado!';
  } else {
    preview.className = 'proxima-troca-preview';
  }
}

// ── VALIDAÇÃO ─────────────────────────────────────────────────────
function validarFormulario() {
  const erros   = [];
  const data    = document.getElementById('input_data_troca').value;
  const km      = parseFloat(document.getElementById('input_km_troca').value);
  const intervalo = parseFloat(document.getElementById('input_intervalo_km').value);
  const idSaida = parseInt(
    document.getElementById('select_saida_vinculada').value || '0', 10
  ) || parseInt(sessionStorage.getItem('idSaida')||'0', 10);

  const veiculoId = MOCK_MODE
    ? MOCK_VEICULO_TROCA.idVeiculo
    : parseInt(sessionStorage.getItem('veiculoSelecionadoId')||'0', 10);

  if (!data)                       erros.push('Data da troca é obrigatória.');
  if (isNaN(km)||km<0)            erros.push('KM da troca é inválido.');
  if (isNaN(intervalo)||intervalo<=0) erros.push('Intervalo de KM é inválido.');
  if (!veiculoId)                  erros.push('Nenhum veículo selecionado.');
  if (!idSaida)                    erros.push('Selecione uma saída vinculada.');

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e=>`• ${e}`).join('<br>'), 'warning');
    return null;
  }

  const obs = document.getElementById('input_observacoes').value.trim();
  return {
    idVeiculo:      veiculoId,
    idSaida,
    kmTroca:        km,
    intervaloKm:    intervalo,
    kmProximaTroca: km + intervalo,
    dataTroca:      data,
    observacoes:    obs || null,
  };
}

// ── SALVAR ────────────────────────────────────────────────────────
async function salvarTrocaOleo() {
  const payload = validarFormulario();
  if (!payload) return;

  const btn     = document.getElementById('btn_salvar_troca');
  const overlay = document.getElementById('loadingOverlay');
  btn.disabled = true;
  overlay.classList.add('active');

  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 800));
      console.log('[MOCK] Troca de óleo payload:', payload);
    } else {
      await apiFetch('/troca-oleo', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    showModal('Troca registrada!',
      'A troca de óleo foi registrada com sucesso.',
      'success',
      () => { sessionStorage.setItem('permiteNavegar','true'); window.location.href = 'editar-troca-de-oleo.html'; });

  } catch (err) {
    showModal('Erro ao registrar', err.message || 'Não foi possível registrar a troca de óleo.', 'error');
  } finally {
    btn.disabled = false;
    overlay.classList.remove('active');
  }
}
