/* =====================================================
   ERP DASHBOARD OFFLINE — FIX LISTAS (CATEGORIA/BANCO)
   Blindado contra IDs ausentes
   ===================================================== */

const TX_KEY = `gf_erp_tx_${new Date().toISOString().slice(0,7)}`;

const POUPANCA_CATEGORIAS = ["Reserva","Investimento","Aplicação"];
const POUPANCA_BANCOS = ["Itaú","Mercado Pago","Nubank","Clear"];

const RECEITA_CATEGORIAS = ["Salário","Renda Extra","Reembolso","Rendimentos","Serviços"];
const RECEITA_BANCOS = ["Cartão","Itaú","Mercado Pago","Nubank","Clear"];

const DESPESAS_ESSENCIAIS = [
  "ALIMENTAÇÃO ESSENCIAL",
  "ASSINATURAS ESSENCIAIS",
  "BEM-ESTAR ESSENCIAL",
  "COMUNICAÇÃO",
  "CUIDADO PESSOAL",
  "EDUCAÇÃO",
  "IMPOSTOS E TRIBUTOS",
  "SAÚDE",
  "TRANSPORTE",
  "MORADIA E SERVIÇOS ESSENCIAIS"
];

const DESPESAS_LIVRES = [
  "LAZER E ENTRETENIMENTO",
  "ALIMENTAÇÃO FORA",
  "VESTUÁRIO",
  "VIAGENS E PASSEIOS",
  "MIMOS E EXTRAS"
];

// Lista única de bancos (COMPARTILHADA) — usada em DESPESAS e DÍVIDAS
const BANCOS_DESPESA_DIVIDA = ["Cartão","Itaú","Mercado Pago","Nubank","Clear"];


const DIVIDA_CATEGORIAS = ["Cartão de Crédito","Empréstimo","Financiamento","Parcelamento","Outros"];
const $ = (id) => document.getElementById(id);

function setOptions(selectEl, list) {
  if (!selectEl) {
    console.warn("[ERP] Select não encontrado:", selectEl);
    return;
  }
  selectEl.innerHTML = `<option value="">Selecione</option>`;
  list.forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    selectEl.appendChild(o);
  });
}

function brl(v){
  return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function loadTx(){
  try { return JSON.parse(localStorage.getItem(TX_KEY) || "[]"); }
  catch { return []; }
}

function saveTx(list){
  localStorage.setItem(TX_KEY, JSON.stringify(list));
}

function formatCategoria(t){
  if(t.tipo==="divida") return `Dívida — ${t.categoria || "-"}`;
  if(t.tipo==="despesa") {
    const st = t.subtipo === "essencial" ? "Essencial" : (t.subtipo === "livre" ? "Livre" : "-");
    return `Despesa (${st}) — ${t.categoria || "-"}`;
  }
  if(t.tipo==="poupanca") return `Poupança — ${t.categoria || "-"}`;
  if(t.tipo==="receita") return `Receita — ${t.categoria || "-"}`;
  return t.categoria || "-";
}

function calcularResumo(list){
  let renda=0, poup=0, ess=0, liv=0, dividas=0;
  for(const t of list){
    const v = Number(t.valor)||0;
    if(t.tipo==="receita") renda += v;
    if(t.tipo==="poupanca") poup += v;
    if(t.tipo==="despesa" && t.subtipo==="essencial") ess += v;
    if(t.tipo==="despesa" && t.subtipo==="livre") liv += v;
    if(t.tipo==="divida") dividas += v;
  }
  return { renda, poup, ess, liv, dividas, saldo: renda - poup - ess - liv - dividas };
}

function render(tx){
  const r = calcularResumo(tx);

  const kR = $("kpiRenda");
  const kP = $("kpiPoupanca");
  const kE = $("kpiEssenciais");
  const kL = $("kpiLivres");
  const kD = $("kpiDividas");
  const kS = $("kpiSaldoDistribuir");

  if(kR) kR.textContent = brl(r.renda);
  if(kP) kP.textContent = brl(r.poup);
  if(kE) kE.textContent = brl(r.ess);
  if(kL) kL.textContent = brl(r.liv);
  if(kD) kD.textContent = brl(r.dividas);
  if(kS) kS.textContent = brl(r.saldo);

  const tbody = $("txTbody");
  if(!tbody) return;

  tbody.innerHTML = "";
  if(tx.length===0){
    tbody.innerHTML = `<tr><td colspan="5">Nenhum lançamento.</td></tr>`;
    return;
  }

  tx.forEach((t, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.data || "-"}</td>
      <td>${brl(t.valor)}</td>
      <td>${formatCategoria(t)}</td>
      <td>${t.banco || "-"}</td>
      <td><button class="btn-mini" data-del="${idx}">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.onclick = (e) => {
    const btn = e.target.closest("[data-del]");
    if(!btn) return;
    const i = Number(btn.getAttribute("data-del"));
    if(!Number.isFinite(i)) return;
    if(!confirm("Confirmar exclusão deste lançamento?")) return;
    tx.splice(i,1);
    saveTx(tx);
    render(tx);
  };
}

window.addEventListener("DOMContentLoaded", () => {
  // 1) popula selects
  setOptions($("poupancaCategoria"), POUPANCA_CATEGORIAS);
  setOptions($("poupancaBanco"), POUPANCA_BANCOS);

  setOptions($("receitaCategoria"), RECEITA_CATEGORIAS);
  setOptions($("receitaBanco"), RECEITA_BANCOS);

  setOptions($("despesaBanco"), BANCOS_DESPESA_DIVIDA);

  // Dívidas (usa a MESMA lista de bancos das Despesas)
  setOptions($("dividaBanco"), BANCOS_DESPESA_DIVIDA);
  setOptions($("dividaCategoria"), DIVIDA_CATEGORIAS);

  const despSub = $("despesaSubtipo");
  const despCat = $("despesaCategoria");

  if (despCat) despCat.innerHTML = `<option value="">Selecione</option>`;

  if (despSub) {
    despSub.addEventListener("change", () => {
      if(!despCat) return;
      if(despSub.value==="essencial") setOptions(despCat, DESPESAS_ESSENCIAIS);
      else if(despSub.value==="livre") setOptions(despCat, DESPESAS_LIVRES);
      else despCat.innerHTML = `<option value="">Selecione</option>`;
    });
  }

  // 2) carrega lançamentos
  const tx = loadTx();

  // 3) handlers de formulário (se existirem)
  const fP = $("formPoupanca");
  const fR = $("formReceita");
  const fD = $("formDespesa");
  const fV = $("formDivida");

  if (fP) fP.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = fP.querySelector("[name='data']")?.value;
    const valor = fP.querySelector("[name='valor']")?.value;
    const categoria = fP.querySelector("[name='categoria']")?.value;
    const banco = fP.querySelector("[name='banco']")?.value;
    if(!data || !valor || !categoria || !banco) return alert("Preencha todos os campos.");
    tx.push({ tipo:"poupanca", data, valor:Number(valor), categoria, banco });
    saveTx(tx);
    fP.reset();
    setOptions($("poupancaCategoria"), POUPANCA_CATEGORIAS);
    setOptions($("poupancaBanco"), POUPANCA_BANCOS);
    render(tx);
  });

  if (fR) fR.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = fR.querySelector("[name='data']")?.value;
    const valor = fR.querySelector("[name='valor']")?.value;
    const categoria = fR.querySelector("[name='categoria']")?.value;
    const banco = fR.querySelector("[name='banco']")?.value;
    if(!data || !valor || !categoria || !banco) return alert("Preencha todos os campos.");
    tx.push({ tipo:"receita", data, valor:Number(valor), categoria, banco });
    saveTx(tx);
    fR.reset();
    setOptions($("receitaCategoria"), RECEITA_CATEGORIAS);
    setOptions($("receitaBanco"), RECEITA_BANCOS);
    render(tx);
  });

  if (fD) fD.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = fD.querySelector("[name='data']")?.value;
    const valor = fD.querySelector("[name='valor']")?.value;
    const subtipo = fD.querySelector("[name='subtipo']")?.value || $("despesaSubtipo")?.value;
    const categoria = fD.querySelector("[name='categoria']")?.value || $("despesaCategoria")?.value;
    const banco = fD.querySelector("[name='banco']")?.value || $("despesaBanco")?.value;
    if(!data || !valor || !subtipo || !categoria || !banco) return alert("Preencha todos os campos.");
    tx.push({ tipo:"despesa", subtipo, data, valor:Number(valor), categoria, banco });
    saveTx(tx);
    fD.reset();
    if (despCat) despCat.innerHTML = `<option value="">Selecione</option>`;
    setOptions($("despesaBanco"), BANCOS_DESPESA_DIVIDA);

  // Dívidas (usa a MESMA lista de bancos das Despesas)
  setOptions($("dividaBanco"), BANCOS_DESPESA_DIVIDA);
  setOptions($("dividaCategoria"), DIVIDA_CATEGORIAS);
    render(tx);
  });

  
  if (fV) fV.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = fV.querySelector("[name='data']")?.value;
    const valor = fV.querySelector("[name='valor']")?.value;
    const categoria = fV.querySelector("[name='categoria']")?.value || $("dividaCategoria")?.value;
    const banco = fV.querySelector("[name='banco']")?.value || $("dividaBanco")?.value;
    if(!data || !valor || !categoria || !banco) return alert("Preencha todos os campos.");
    tx.push({ tipo:"divida", data, valor:Number(valor), categoria, banco });
    saveTx(tx);
    fV.reset();
    setOptions($("dividaCategoria"), DIVIDA_CATEGORIAS);
    setOptions($("dividaBanco"), BANCOS_DESPESA_DIVIDA);
    render(tx);
  });

// 4) render inicial
  render(tx);
});
