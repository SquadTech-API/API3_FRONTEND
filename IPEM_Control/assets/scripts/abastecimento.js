// =============================================
// CONFIGURAÇÃO
// =============================================
const API_BASE_URL = 'http://localhost:8080';

// =============================================
// ESTADO GLOBAL
// =============================================
let nfArquivo      = null; // File object para enviar como multipart
let _saidaAtiva    = null; // RegistroSaida da saída em andamento do usuário

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  initDateTimeDefaults();
  carregarDadosUsuario();

  // Verifica saída ativa ANTES de liberar o formulário
  await verificarSaidaAtiva();
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

  const dataEl = document.getElementById('Label_data_abastecer');
  const horaEl = document.getElementById('Label_hora_abastecer');
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
  const el = document.getElementById('Label_motorista_abastecer');
  if (el) el.textContent = usuario.nomeCompleto || usuario.nome || 'Motorista';
}

// =============================================
// VERIFICAR SAÍDA ATIVA DO USUÁRIO
// =============================================
async function verificarSaidaAtiva() {
  const matricula = getMatriculaUsuario();

  // ── Estratégia 1: por matrícula ──────────────────────────────────────────
  if (matricula) {
    try {
      const resp = await fetch(
        `${API_BASE_URL}/registro-saidas/ativo-usuario?matricula=${matricula}`,
        { headers: getAuthHeaders() }
      );
      if (resp.ok) {
        const saida = await resp.json();
        if (saida && saida.status === 'em_andamento') {
          _saidaAtiva = saida;
          // Persiste para consistência com outras telas
          sessionStorage.setItem('idSaida',              saida.idSaida);
          sessionStorage.setItem('veiculoSelecionadoId', saida.veiculo?.idVeiculo);
          sessionStorage.setItem('veiculoSelecionado',   JSON.stringify(saida.veiculo || {}));
          localStorage.setItem('idSaida',                saida.idSaida);
          localStorage.setItem('veiculoSelecionadoId',   saida.veiculo?.idVeiculo);
          preencherComSaida(saida);
          liberarFormulario();
          return;
        }
      }
    } catch (err) {
      console.warn('[verificarSaidaAtiva] Estratégia 1 falhou:', err.message);
    }
  }

  // ── Estratégia 2: por veiculoId na sessão ────────────────────────────────
  const veiculoId = sessionStorage.getItem('veiculoSelecionadoId')
                 || localStorage.getItem('veiculoSelecionadoId');

  if (veiculoId) {
    try {
      const resp = await fetch(
        `${API_BASE_URL}/registro-saidas/ativo?veiculoId=${veiculoId}`,
        { headers: getAuthHeaders() }
      );
      if (resp.ok) {
        const saida = await resp.json();
        if (saida && saida.status === 'em_andamento') {
          _saidaAtiva = saida;
          sessionStorage.setItem('idSaida', saida.idSaida);
          localStorage.setItem('idSaida',   saida.idSaida);
          preencherComSaida(saida);
          liberarFormulario();
          return;
        }
      }
    } catch (err) {
      console.warn('[verificarSaidaAtiva] Estratégia 2 falhou:', err.message);
    }
  }

  // ── Sem saída ativa: bloqueia o formulário ───────────────────────────────
  bloquearFormulario();
}

// =============================================
// PRÉ-PREENCHER CAMPOS COM DADOS DA SAÍDA
// =============================================
function preencherComSaida(saida) {
  // Veículo
  if (saida.veiculo) {
    const prefix = document.getElementById('Label_prefix_abastecer');
    const modelo = document.getElementById('Label_modelo_abastecer');
    if (prefix) prefix.textContent = saida.veiculo.prefixo || saida.veiculo.placa || 'Viatura';
    if (modelo) modelo.textContent = saida.veiculo.modelo  || '—';

    // Pré-preenche odômetro com o km atual do veículo como sugestão mínima
    const kmEl = document.getElementById('Txf_km_abastecer');
    if (kmEl && saida.veiculo.kmAtual != null) {
      kmEl.min         = saida.veiculo.kmAtual;
      kmEl.placeholder = `Mín: ${saida.veiculo.kmAtual}`;
    }

    // Pré-preenche tipo de combustível se o veículo tiver definido
    if (saida.veiculo.tipoCombustivel) {
      const sel = document.getElementById('sel_combustivel');
      if (sel) {
        // Tenta selecionar a opção cujo value bate com o tipo do veículo
        const opcao = [...sel.options].find(
          o => o.value.toLowerCase() === saida.veiculo.tipoCombustivel.toLowerCase()
        );
        if (opcao) sel.value = opcao.value;
      }
    }
  }

  // Serviço em andamento 
  const servicoEl = document.getElementById('Label_servico_abastecer');
  if (servicoEl) {
    servicoEl.value = saida.tipoServico?.nomeServico || '—';
  }
}

// =============================================
// LIBERAR / BLOQUEAR FORMULÁRIO
// =============================================
function liberarFormulario() {
  const aviso = document.getElementById('aviso-sem-saida');
  if (aviso) aviso.style.display = 'none';

  const btnSalvar = document.getElementById('Btn_salvar_abastecer');
  if (btnSalvar) btnSalvar.disabled = false;

  // Habilita todos os inputs e selects do formulário
  document.querySelectorAll(
    '#form-abastecer input:not([readonly]), #form-abastecer select, #form-abastecer textarea'
  ).forEach(el => { el.disabled = false; });
}

function bloquearFormulario() {
  // Mostra aviso
  const aviso = document.getElementById('aviso-sem-saida');
  if (aviso) {
    aviso.style.display = 'block';
    aviso.textContent   = 'Você não possui uma saída em andamento. Registre uma saída antes de abastecer.';
  } else {
    // Fallback se o elemento não existir no HTML
    showToast('Sem saída ativa. Registre uma saída antes de abastecer.', 'error');
  }

  // Desabilita botão salvar
  const btnSalvar = document.getElementById('Btn_salvar_abastecer');
  if (btnSalvar) btnSalvar.disabled = true;

  // Desabilita todos os inputs editáveis
  document.querySelectorAll(
    '#form-abastecer input:not([readonly]), #form-abastecer select, #form-abastecer textarea'
  ).forEach(el => { el.disabled = true; });
}

// =============================================
// UPLOAD NOTA FISCAL
// =============================================
function triggerNfUpload() {
  document.getElementById('nf_file_input').click();
}

function handleNfFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Arquivo muito grande. Máximo 5 MB.', 'error');
    return;
  }

  nfArquivo = file;
  const label = document.getElementById('nf_filename_label');
  if (label) label.textContent = file.name;
  showToast('Foto da NF selecionada!', 'success');
}

// =============================================
// ENVIAR FOTO — POST /uploads (multipart/form-data)
// =============================================
async function enviarFotoNF() {
  if (!nfArquivo) return null;

  try {
    const formData = new FormData();
    formData.append('foto', nfArquivo);

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // NÃO define Content-Type — o browser define automaticamente com boundary

    const resp = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!resp.ok) {
      console.warn('[enviarFotoNF] Falha no upload:', resp.status);
      showToast('Aviso: falha ao enviar foto da NF. Abastecimento será salvo sem foto.', 'error');
      return null;
    }

    // UploadController retorna o caminho como texto puro: "/uploads/NF/timestamp_nome.jpg"
    return await resp.text();

  } catch (err) {
    console.warn('[enviarFotoNF]', err.message);
    showToast('Aviso: erro ao enviar foto da NF. Abastecimento será salvo sem foto.', 'error');
    return null;
  }
}

// =============================================
// VALIDAÇÃO
// =============================================
function validarFormulario() {
  if (!_saidaAtiva) {
    showToast('Sem saída ativa. Registre uma saída antes de abastecer.', 'error');
    return null;
  }

  const erros = [];

  const dataVal     = document.getElementById('Label_data_abastecer').value;
  const horaVal     = document.getElementById('Label_hora_abastecer').value;
  const combustivel = document.getElementById('sel_combustivel').value;
  const litros      = parseFloat(document.getElementById('Txf_litros_abastecer').value);
  const preco       = parseFloat(document.getElementById('Txf_preco_abastecer').value);
  const km          = parseFloat(document.getElementById('Txf_km_abastecer').value);
  const postoNome   = document.getElementById('txf_posto_nome')?.value.trim()   || '';
  const postoCidade = document.getElementById('txf_posto_cidade')?.value.trim() || '';
  const nnf         = document.getElementById('Txf_nnf_abastecer')?.value.trim() || '';

  if (!dataVal)                     erros.push('Data é obrigatória.');
  if (!horaVal)                     erros.push('Hora é obrigatória.');
  if (!combustivel)                 erros.push('Selecione o tipo de combustível.');
  if (isNaN(litros) || litros <= 0) erros.push('Quantidade de litros inválida (deve ser > 0).');
  if (isNaN(preco)  || preco  <= 0) erros.push('Preço total inválido (deve ser > 0).');
  if (isNaN(km)     || km     <  0) erros.push('Odômetro inválido.');

  // Odômetro não pode ser menor que o km da saída
  if (_saidaAtiva.kmInicial && !isNaN(km) && km < _saidaAtiva.kmInicial) {
    erros.push(`Odômetro (${km}) não pode ser menor que o KM de saída (${_saidaAtiva.kmInicial}).`);
  }

  if (erros.length > 0) {
    showToast(erros.join('\n'), 'error');
    return null;
  }

  return {
    dataVal, horaVal, combustivel, litros, preco, km, postoNome, postoCidade, nnf,
    idSaida: _saidaAtiva.idSaida,
  };
}

// =============================================
// SALVAR ABASTECIMENTO
// 1. Valida formulário
// 2. Envia foto (se houver) → recebe caminho
// 3. POST /abastecimento com payload completo
// 4. Redireciona para tela_veiculos.html
// =============================================
async function salvarAbastecimento() {
  const campos = validarFormulario();
  if (!campos) return;

  const btnSalvar = document.getElementById('Btn_salvar_abastecer');
  const overlay   = document.getElementById('loadingOverlay');

  try {
    btnSalvar.disabled = true;
    if (overlay) overlay.classList.add('active');

    // Passo 1: upload da foto (pode retornar null)
    const fotoCaminho = await enviarFotoNF();

    // Passo 2: monta payload — bate com AbastecimentoDTO.java
    const payload = {
      idSaida:          campos.idSaida,
      dataHora:         `${campos.dataVal}T${campos.horaVal}:00`,
      tipoCombustivel:  campos.combustivel,
      quantidadeLitros: campos.litros,
      valorTotal:       campos.preco,
      kmAbastecimento:  campos.km,
      postoNome:        campos.postoNome   || null,
      postoCidade:      campos.postoCidade || null,
      notaFiscal:       campos.nnf         || null,
      foto:             fotoCaminho        || null,
    };

    // Passo 3: POST /abastecimento
    const resp = await fetch(`${API_BASE_URL}/abastecimento`, {
      method:  'POST',
      headers: getAuthHeaders(),
      body:    JSON.stringify(payload),
    });

    const data = await tryParseJson(resp);

    if (resp.ok || resp.status === 201) {
      showToast('✔ Abastecimento salvo com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'tela_veiculos.html'; }, 1800);
    } else {
      showToast(extrairMensagemErro(data, resp.status), 'error');
    }

  } catch (err) {
    console.error('[salvarAbastecimento]', err);
    showToast(
      err.message?.includes('Failed to fetch')
        ? 'Sem conexão com o servidor.'
        : `Erro inesperado: ${err.message}`,
      'error'
    );
  } finally {
    btnSalvar.disabled = false;
    if (overlay) overlay.classList.remove('active');
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
  const usuario = getLocalJson('usuario');
  return usuario?.matricula || null;
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
  if (!data) return `Erro ${status}: Resposta inesperada do servidor.`;
  if (typeof data === 'string') return data;
  if (data.message) return `Erro: ${data.message}`;
  if (data.erro)    return `Erro: ${data.erro}`;
  if (data.error)   return `Erro: ${data.error}`;
  if (Array.isArray(data.errors))
    return data.errors.map(e => e.defaultMessage || e.field).join('; ');
  return `Erro ${status}: Falha ao salvar abastecimento.`;
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