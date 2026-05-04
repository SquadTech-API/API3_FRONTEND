// ═══════════════════════════════════════════════════════════════
//  nova-saida.js
//  - Sem JWT
//  - Mock completo
//  - Serviços filtrados por veículo (veiculo_servico)
//  - Verificação de saída ativa
//  - Após salvar → redireciona para veiculos.html
// ═══════════════════════════════════════════════════════════════

if (!exigirLogin()) { /* redireciona */ }

// ── MOCK DE SERVIÇOS POR VEÍCULO ────────────────────────────────
const MOCK_SERVICOS_GLOBAIS = [
  { idTipoServico:1, nomeServico:'Troca de Óleo',         habilitado:true, ehTrocaOleo:true  },
  { idTipoServico:2, nomeServico:'Inspeção de Campo',     habilitado:true, ehTrocaOleo:false },
  { idTipoServico:3, nomeServico:'Entrega de Documentos', habilitado:true, ehTrocaOleo:false },
  { idTipoServico:4, nomeServico:'Manutenção Veicular',   habilitado:true, ehTrocaOleo:false },
  { idTipoServico:5, nomeServico:'Apoio Operacional',     habilitado:true, ehTrocaOleo:false },
  { idTipoServico:6, nomeServico:'Capacitação Externa',   habilitado:true, ehTrocaOleo:false },
  { idTipoServico:7, nomeServico:'Coleta de Amostra',     habilitado:true, ehTrocaOleo:false },
  { idTipoServico:8, nomeServico:'Fiscalização',          habilitado:true, ehTrocaOleo:false },
];

// IDs de serviços habilitados por veículo
const MOCK_SERVICOS_VEICULO = {
  1: [1,2,3,5,8], 2: [2,3,6,7], 3: [1,2,5,7,8],
  4: [5,6],       5: [1,2,3,4,8], 6: [2,3,6],
  7: [1,5,7,8],   8: [5,6],       9: [1,2,3,4,5,8],
};

// ── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  verificarSessao();
  preencherDataHora();
  carregarDadosUsuario();
  carregarDadosVeiculo();
  verificarSaidaAtiva();
});

function verificarSessao() {
  if (!getUsuario()) window.location.href = './index.html';
}

// ── DATA E HORA ─────────────────────────────────────────────────
function preencherDataHora() {
  const dh = dataHoraAtual();
  const campoData = document.getElementById('Label_data_saida');
  const campoHora = document.getElementById('Label_hora_saida');
  if (campoData) campoData.value = dh.data;
  if (campoHora) campoHora.value = dh.hora;
}

// ── DADOS DO USUÁRIO ─────────────────────────────────────────────
function carregarDadosUsuario() {
  const u     = getUsuario();
  const campo = document.getElementById('Label_motorista_saida');
  if (campo && u) campo.textContent = u.nomeCompleto || u.nome || 'Motorista';
}

// ── DADOS DO VEÍCULO ─────────────────────────────────────────────
async function carregarDadosVeiculo() {
  const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                  || localStorage.getItem('veiculoSelecionadoId');
  if (!veiculoId) {
    showModal('Veículo não selecionado',
      'Nenhum veículo selecionado. Volte e selecione uma viatura.', 'error',
      () => window.location.href = 'veiculos.html');
    return;
  }

  let veiculo;

  if (MOCK_MODE) {
    const { MOCK_VEICULOS } = await importMockVeiculos();
    veiculo = MOCK_VEICULOS?.find(v => String(v.idVeiculo) === String(veiculoId));
    if (!veiculo) {
      // Tenta recuperar do sessionStorage
      try { veiculo = JSON.parse(sessionStorage.getItem('veiculoSelecionado')); } catch {}
    }
  } else {
    try {
      veiculo = await apiFetch(`/veiculos/${veiculoId}`);
      sessionStorage.setItem('veiculoSelecionado', JSON.stringify(veiculo));
    } catch {
      try { veiculo = JSON.parse(sessionStorage.getItem('veiculoSelecionado')); } catch {}
    }
  }

  if (!veiculo) return;

  preencherVeiculo(veiculo);
  await carregarServicos(veiculoId);
}

function preencherVeiculo(v) {
  const prefixo = document.getElementById('Label_prefix_saida');
  const modelo  = document.getElementById('Label_modelo_saida');
  const campoKm = document.getElementById('Txf_km_saida');
  if (prefixo) prefixo.textContent = `Viatura ${v.prefixo || v.placa || '—'}`;
  if (modelo)  modelo.textContent  = v.modelo || '—';
  if (campoKm && v.kmAtual != null && !campoKm.value) campoKm.value = v.kmAtual;
}

// Importa mock de veículos do escopo do veiculos.js via sessionStorage
async function importMockVeiculos() {
  try {
    const raw = sessionStorage.getItem('veiculoSelecionado');
    if (raw) return { MOCK_VEICULOS: [JSON.parse(raw)] };
  } catch {}
  return {};
}

// ── SERVIÇOS FILTRADOS POR VEÍCULO ──────────────────────────────
async function carregarServicos(veiculoId) {
  const select = document.getElementById('Ddl_servico_saida');
  if (!select) return;

  try {
    let lista;

    if (MOCK_MODE) {
      const idsPermitidos = MOCK_SERVICOS_VEICULO[Number(veiculoId)] || [];
      lista = MOCK_SERVICOS_GLOBAIS.filter(s =>
        s.habilitado && idsPermitidos.includes(s.idTipoServico)
      );
    } else {
      // Endpoint que retorna serviços habilitados para o veículo específico
      lista = await apiFetch(`/tipo-servicos/veiculo/${veiculoId}/ativos`);
    }

    select.innerHTML = '<option value="">SELECIONE</option>';
    lista.forEach(item => {
      const opt = document.createElement('option');
      opt.value       = item.idTipoServico;
      opt.textContent = item.nomeServico || '—';
      select.appendChild(opt);
    });

  } catch (err) {
    showToast('Erro ao carregar tipos de serviço.', 'error');
  }
}

// ── VERIFICAR SAÍDA ATIVA ────────────────────────────────────────
async function verificarSaidaAtiva() {
  const matricula = getMatricula();
  if (!matricula) return;

  try {
    let saida;
    if (MOCK_MODE) {
      saida = null; // sem saída ativa no mock por padrão
    } else {
      const resp = await fetch(
        `${API_BASE}/registro-saidas/ativo-usuario?matricula=${matricula}`,
        { headers: getAuthHeaders() }
      );
      if (resp.status === 404 || !resp.ok) return;
      saida = await resp.json();
    }

    if (!saida || saida.status !== 'em_andamento') return;

    // Bloqueia o formulário
    const btnSalvar = document.getElementById('Btn_salvar_saida');
    if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.style.opacity = '0.5'; }

    const formCard = document.querySelector('.form-card');
    if (!formCard) return;

    const dataFmt = saida.dataHoraSaida
      ? formatarDataHora(saida.dataHoraSaida) : '—';
    const nomeServico = saida.tipoServico?.nomeServico || '—';

    const aviso = document.createElement('div');
    aviso.id = 'aviso-saida-ativa';
    aviso.style.cssText = `
      background:#fff3cd; border:1.5px solid #ffc107; border-radius:12px;
      padding:14px 16px; margin:0 16px; font-size:13px; color:#7d5a00; line-height:1.6;
    `;
    aviso.innerHTML = `
      <strong>⚠ Você já possui uma saída em andamento</strong><br>
      Serviço: <strong>${nomeServico}</strong><br>
      Iniciada em: <strong>${dataFmt}</strong><br>
      Registre o retorno antes de iniciar uma nova saída.<br><br>
      <button onclick="window.location.href='nova-entrada.html'"
        style="background:#ffc107;border:none;border-radius:8px;padding:8px 16px;
               font-weight:600;cursor:pointer;color:#7d5a00;font-size:13px;">
        → Registrar retorno agora
      </button>
    `;
    formCard.parentNode.insertBefore(aviso, formCard);

  } catch { /* silencioso */ }
}

// ── VALIDAÇÃO ────────────────────────────────────────────────────
function validarFormulario() {
  const erros = [];
  const data      = document.getElementById('Label_data_saida').value;
  const hora      = document.getElementById('Label_hora_saida').value;
  const km        = parseFloat(document.getElementById('Txf_km_saida').value);
  const servico   = document.getElementById('Ddl_servico_saida').value;
  const endereco  = document.getElementById('Txf_end_saida').value.trim();
  const veiculoId = parseInt(
    sessionStorage.getItem('veiculoSelecionadoId') ||
    localStorage.getItem('veiculoSelecionadoId') || '0', 10
  );
  const matricula = getMatricula();

  if (!data)              erros.push('Data de saída é obrigatória.');
  if (!hora)              erros.push('Hora de saída é obrigatória.');
  if (isNaN(km)||km<0)   erros.push('Odômetro inválido.');
  if (!servico)           erros.push('Selecione o tipo de serviço.');
  if (!endereco)          erros.push('Local de destino é obrigatório.');
  if (!veiculoId)         erros.push('Nenhum veículo selecionado.');
  if (!matricula)         erros.push('Usuário não autenticado.');

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e => `• ${e}`).join('<br>'), 'warning');
    return null;
  }

  const complemento  = document.getElementById('Txf_cmp_saida').value.trim();
  const localDestino = complemento ? `${endereco} — ${complemento}` : endereco;

  return {
    idVeiculo:        veiculoId,
    matriculaUsuario: matricula,
    idTipoServico:    parseInt(servico, 10),
    localDestino,
    observacoes:      complemento || null,
    dataHoraSaida:    `${data}T${hora}:00`,
    kmInicial:        km,
  };
}

// ── SALVAR ───────────────────────────────────────────────────────
async function salvarSaida() {
  if (document.getElementById('aviso-saida-ativa')) {
    showModal('Saída em andamento',
      'Você já possui uma saída em andamento. Registre o retorno antes de criar uma nova.',
      'warning');
    return;
  }

  const payload = validarFormulario();
  if (!payload) return;

  const btnSalvar = document.getElementById('Btn_salvar_saida');
  const overlay   = document.getElementById('loadingOverlay');
  btnSalvar.disabled = true;
  overlay.classList.add('active');

  try {
    let data;
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 800));
      data = { idSaida: Math.floor(Math.random()*900)+100, status:'em_andamento', ...payload };
    } else {
      data = await apiFetch('/registro-saidas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    if (data?.idSaida) {
      sessionStorage.setItem('idSaida', data.idSaida);
      localStorage.setItem('idSaida', data.idSaida);
    }

    showModal('Saída registrada!',
      'A saída foi registrada com sucesso. Você será redirecionado para a tela de veículos.',
      'success', () => {
        sessionStorage.setItem('permiteNavegar', 'true');
        window.location.href = 'veiculos.html';
      });

  } catch (err) {
    showModal('Erro ao registrar saída', err.message || 'Não foi possível registrar a saída.', 'error');
  } finally {
    btnSalvar.disabled = false;
    overlay.classList.remove('active');
  }
}
