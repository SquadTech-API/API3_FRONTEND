// =============================================
// CONFIGURAÇÃO
// =============================================
const API_BASE_URL = 'http://localhost:8080';

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initDateTimeDefaults();
  carregarDadosUsuario();
  carregarDadosVeiculo();
  carregarServicos();
  verificarSaidaAtivaDoUsuario(); // bloqueia o form se já houver saída em aberto
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
// VERIFICAR SAÍDA ATIVA DO USUÁRIO
// Se já tiver uma saída em andamento:
//   - Exibe aviso no topo do formulário
//   - Desabilita o botão Salvar
//   - Exibe botão para ir direto ao retorno
// =============================================
async function verificarSaidaAtivaDoUsuario() {
  const matricula = getMatriculaUsuario();
  if (!matricula) return;

  try {
    const resp = await fetch(
      `${API_BASE_URL}/registro-saidas/ativo-usuario?matricula=${matricula}`,
      { headers: getAuthHeaders() }
    );

    if (resp.status === 404) return; // sem saída ativa — tudo certo

    if (!resp.ok) return;

    const saida = await resp.json();
    if (!saida || saida.status !== 'em_andamento') return;

    // Saída ativa encontrada — bloqueia o formulário
    bloquearFormularioPorSaidaAtiva(saida);

  } catch {
    // Falha de rede: não bloqueia (deixa o backend rejeitar se necessário)
  }
}

// Bloqueia visualmente o formulário e exibe aviso claro para o usuário
function bloquearFormularioPorSaidaAtiva(saida) {
  // Desabilita o botão Salvar
  const btnSalvar = document.getElementById('Btn_salvar_saida');
  if (btnSalvar) {
    btnSalvar.disabled = true;
    btnSalvar.style.opacity = '0.5';
    btnSalvar.style.cursor  = 'not-allowed';
  }

  // Cria o banner de aviso acima do form-card
  const formCard = document.querySelector('.form-card');
  if (!formCard) return;

  const banner = document.createElement('div');
  banner.id = 'aviso-saida-ativa';
  banner.style.cssText = `
    background: #fff3cd;
    border: 1.5px solid #ffc107;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #7d5a00;
    line-height: 1.5;
  `;

  // Formata a data da saída para exibição
  let dataSaidaFormatada = '—';
  if (saida.dataHoraSaida) {
    dataSaidaFormatada = new Date(saida.dataHoraSaida).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const nomeServico = saida.tipoServico?.nomeServico
                   || saida.tipoServico?.nome_servico
                   || '—';

  banner.innerHTML = `
    <strong>⚠ Você já possui uma saída em andamento</strong><br>
    Serviço: <strong>${nomeServico}</strong><br>
    Saída em: <strong>${dataSaidaFormatada}</strong><br>
    Registre o retorno antes de iniciar uma nova saída.
    <br><br>
    <button
      onclick="irParaRetorno()"
      style="
        background:#ffc107; border:none; border-radius:6px;
        padding:8px 16px; font-weight:600; cursor:pointer;
        color:#7d5a00; font-size:13px;
      "
    >
      → Registrar retorno agora
    </button>
  `;

  formCard.parentNode.insertBefore(banner, formCard);
}

// Redireciona para nova_entrada.html salvando os dados da saída ativa na sessão
function irParaRetorno() {
  window.location.href = './nova_entrada.html';
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

function preencherMotorista(usuario) {
  const el = document.getElementById('Label_motorista_saida');
  if (el) el.textContent = usuario.nomeCompleto || usuario.nome || 'Motorista';
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
    const veiculo = await resp.json();
    sessionStorage.setItem('veiculoSelecionado', JSON.stringify(veiculo));
    preencherVeiculo(veiculo);

    if (veiculo.kmAtual != null) {
      const kmInput = document.getElementById('Txf_km_saida');
      if (kmInput && !kmInput.value) kmInput.value = veiculo.kmAtual;
    }
  } catch {
    const local = getLocalJson('veiculoSelecionado');
    if (local) preencherVeiculo(local);
  }
}

function preencherVeiculo(v) {
  const prefix = document.getElementById('Label_prefix_saida');
  const modelo = document.getElementById('Label_modelo_saida');
  if (prefix) prefix.textContent = `Viatura ${v.prefixo || v.placa || '—'}`;
  if (modelo) modelo.textContent = v.modelo || '—';
}

// =============================================
// CARREGAR SERVIÇOS — GET /tipo-servicos
// =============================================
async function carregarServicos() {
  const select = document.getElementById('Ddl_servico_saida');
  if (!select) return;

  try {
    const resp = await fetch(`${API_BASE_URL}/tipo-servicos`, { headers: getAuthHeaders() });
    if (!resp.ok) throw new Error();
    const data  = await resp.json();
    const lista = Array.isArray(data) ? data : (data.content || []);

    select.innerHTML = '<option value="">SELECIONE</option>';
    lista.forEach(item => {
      const id   = item.idTipoServico;
      const nome = item.nomeServico || '—';
      if (id) {
        const opt = document.createElement('option');
        opt.value       = id;
        opt.textContent = nome;
        select.appendChild(opt);
      }
    });
  } catch (err) {
    console.warn('[carregarServicos]', err.message);
    showToast('Erro ao carregar tipos de serviço.', 'error');
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

  if (!dataVal)             erros.push('Data de saída é obrigatória.');
  if (!horaVal)             erros.push('Hora de saída é obrigatória.');
  if (isNaN(km) || km < 0) erros.push('Odômetro inválido.');
  if (!servico)             erros.push('Selecione o tipo de serviço.');
  if (!endereco)            erros.push('Endereço / local de destino é obrigatório.');

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
    idVeiculo:        veiculoId,
    matriculaUsuario: matricula,
    idTipoServico:    parseInt(servico, 10),
    localDestino:     localDestino,
    observacoes:      complemento || null,
    dataHoraSaida:    `${dataVal}T${horaVal}:00`,
    kmInicial:        km,
  };
}

// =============================================
// SALVAR SAÍDA — POST /registro-saidas
// =============================================
async function salvarSaida() {
  // Checagem extra: se o banner de bloqueio estiver visível, impede o envio
  if (document.getElementById('aviso-saida-ativa')) {
    showToast('Você já possui uma saída em andamento. Registre o retorno primeiro.', 'error');
    return;
  }

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
      const idSaida = data?.idSaida || null;
      if (idSaida) {
        sessionStorage.setItem('idSaida', idSaida);
        localStorage.setItem('idSaida',   idSaida);
      }
      showToast('✔ Saída registrada com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    } else {
      // Trata o erro do backend (incluindo "já possui saída em andamento")
      const msg = extrairMensagemErro(data, resp.status);
      showToast(msg, 'error');

      // Se o backend rejeitou por saída ativa, busca e bloqueia o form também
      if (resp.status === 400 && msg.toLowerCase().includes('andamento')) {
        await verificarSaidaAtivaDoUsuario();
      }
    }
  } catch (err) {
    showToast(
      err.message?.includes('Failed to fetch')
        ? 'Sem conexão com o servidor.'
        : `Erro inesperado: ${err.message}`,
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
  if (!data) return `Erro ${status}: Resposta inesperada.`;
  if (typeof data === 'string') return data;
  if (data.message) return `Erro: ${data.message}`;
  if (data.erro)    return `Erro: ${data.erro}`;
  if (data.error)   return `Erro: ${data.error}`;
  if (Array.isArray(data.errors))
    return data.errors.map(e => e.defaultMessage || e.field).join('; ');
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