// ═══════════════════════════════════════════════════════════════
//  cadastrar-veiculo.js
//  - Só ADM
//  - Mock completo
//  - Modal padronizado
// ═══════════════════════════════════════════════════════════════

if (!exigirAdm()) { /* redireciona */ }

initMenu();
ajustarMenuPorPerfil();

document.getElementById('btnMenu')?.addEventListener('click', () => {
  document.getElementById('navPrincipal')?.classList.toggle('open');
});

// ── MOCK SERVIÇOS ────────────────────────────────────────────────
const MOCK_TIPOS_SERVICO = [
  { idTipoServico:1, nomeServico:'Troca de Óleo' },
  { idTipoServico:2, nomeServico:'Inspeção de Campo' },
  { idTipoServico:3, nomeServico:'Entrega de Documentos' },
  { idTipoServico:4, nomeServico:'Manutenção Veicular' },
  { idTipoServico:5, nomeServico:'Apoio Operacional' },
  { idTipoServico:6, nomeServico:'Capacitação Externa' },
  { idTipoServico:7, nomeServico:'Coleta de Amostra' },
  { idTipoServico:8, nomeServico:'Fiscalização' },
];

// ── CARREGAR TIPOS DE SERVIÇO ────────────────────────────────────
async function carregarTiposServico() {
  const container = document.getElementById('chk_servicos_container');
  if (!container) return;

  try {
    let lista;
    if (MOCK_MODE) {
      lista = MOCK_TIPOS_SERVICO;
    } else {
      lista = await apiFetch('/tipo-servicos/ativos');
    }

    container.innerHTML = '';
    const arr = Array.isArray(lista) ? lista : lista.content || [];
    arr.forEach(ts => {
      const label = document.createElement('label');
      label.className = 'servico-check-item';
      label.innerHTML = `<input type="checkbox" value="${ts.idTipoServico}"> ${ts.nomeServico}`;
      container.appendChild(label);
    });
  } catch {
    const container = document.getElementById('chk_servicos_container');
    if (container) container.innerHTML = '<span style="color:#ef4444;font-size:13px;">Erro ao carregar serviços.</span>';
  }
}

carregarTiposServico();

// ── FORMULÁRIO ────────────────────────────────────────────────────
const form = document.getElementById('form_veic');
form?.addEventListener('submit', async e => {
  e.preventDefault();

  const marca      = document.getElementById('txf_marca').value.trim();
  const modelo     = document.getElementById('txf_modelo').value.trim();
  const ano        = document.getElementById('txf_ano').value.trim();
  const combustivel = document.getElementById('ddl_combustivel').value;
  const habilitacao = document.getElementById('ddl_habilitacao').value;
  const placa      = document.getElementById('txf_placa').value.trim();
  const km         = document.getElementById('txf_km').value.trim();
  const prefixo    = document.getElementById('txf_prefixo').value.trim();
  const nucleoDar  = document.getElementById('txf_nucleo').value.trim();
  const numeroFl   = document.getElementById('txf_nfi').value.trim();
  const intervalo  = document.getElementById('txf_intervalo_oleo').value.trim();

  const erros = [];
  if (!marca||!modelo||!ano||!placa||!km||!prefixo||!nucleoDar)
    erros.push('Preencha todos os campos obrigatórios: prefixo, placa, núcleo, marca, modelo, ano e KM.');
  if (!combustivel) erros.push('Selecione o tipo de combustível.');
  if (!habilitacao) erros.push('Selecione a categoria de habilitação.');

  if (erros.length > 0) {
    showModal('Dados inválidos', erros.map(e=>`• ${e}`).join('<br>'), 'warning');
    return;
  }

  const payload = {
    marca, modelo, prefixo, nucleoDar,
    placa: placa.toUpperCase().replace(/\s/g,''),
    numeroFl: numeroFl || null,
    ano: parseInt(ano, 10),
    tipoCombustivel: combustivel,
    habilitacaoCategoria: habilitacao,
    kmAtual: parseFloat(km),
    intervaloTrocaOleoKm: intervalo ? parseFloat(intervalo) : 5000,
    disponivel: true,
    ativo: true,
  };

  const btnSalvar = form.querySelector('.btn-cad-salvar');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    let idVeiculo;

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 700));
      idVeiculo = Math.floor(Math.random()*900)+10;
    } else {
      const veiculo = await apiFetch('/veiculos', { method:'POST', body:JSON.stringify(payload) });
      idVeiculo = veiculo.idVeiculo;

      // Sincroniza serviços selecionados
      const selecionados = Array.from(
        document.querySelectorAll('#chk_servicos_container input[type=checkbox]:checked')
      ).map(c => parseInt(c.value,10));

      if (selecionados.length > 0) {
        await apiFetch(`/veiculo-servico/sincronizar/${idVeiculo}`, {
          method: 'POST',
          body: JSON.stringify(selecionados),
        });
      }
    }

    showModal('Veículo cadastrado!',
      `O veículo ${prefixo} — ${modelo} foi cadastrado com sucesso.`, 'success',
      () => {
        form.reset();
        document.querySelectorAll('#chk_servicos_container input[type=checkbox]')
          .forEach(c => c.checked = false);
      });

  } catch (err) {
    let msg = err.message || 'Erro ao cadastrar veículo.';
    if (msg.toLowerCase().includes('placa')) msg = 'Placa já cadastrada no sistema.';
    showModal('Erro ao cadastrar', msg, 'error');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar';
  }
});
