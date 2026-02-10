const TX_KEY = `gf_erp_tx_${new Date().toISOString().slice(0,7)}`;

const POUPANCA_CATEGORIAS = ["Reserva","Investimento","Aplicação"];
const POUPANCA_BANCOS = ["Itaú","Mercado Pago","Nubank","Clear"];

const RECEITA_CATEGORIAS = ["Salário","Renda Extra","Reembolso","Rendimentos","Serviços"];
const RECEITA_BANCOS = ["Cartão","Itaú","Mercado Pago","Nubank","Clear"];

const DESPESAS_ESSENCIAIS = ["ALIMENTAÇÃO","SAÚDE","MORADIA","TRANSPORTE"];
const DESPESAS_LIVRES = ["LAZER","VIAGENS","MIMOS"];

const BANCOS_DESPESA_DIVIDA = ["Cartão","Itaú","Mercado Pago","Nubank","Clear"];

const $ = (id) => document.getElementById(id);

function setOptions(el, list) {
  if (!el) return;
  el.innerHTML = `<option value="">Selecione</option>`;
  list.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    el.appendChild(o);
  });
}

function loadTx() {
  return JSON.parse(localStorage.getItem(TX_KEY) || "[]");
}

function saveTx(tx) {
  localStorage.setItem(TX_KEY, JSON.stringify(tx));
}

function render(tx) {
  let renda=0, poup=0, ess=0, liv=0, div=0;

  tx.forEach(t => {
    if (t.tipo==="receita") renda+=t.valor;
    if (t.tipo==="poupanca") poup+=t.valor;
    if (t.tipo==="despesa" && t.subtipo==="essencial") ess+=t.valor;
    if (t.tipo==="despesa" && t.subtipo==="livre") liv+=t.valor;
    if (t.tipo==="divida") div+=t.valor;
  });

  $("kpiRenda").textContent = renda.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  $("kpiPoupanca").textContent = poup.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  $("kpiEssenciais").textContent = ess.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  $("kpiLivres").textContent = liv.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  $("kpiDividas").textContent = div.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  $("kpiSaldoDistribuir").textContent =
    (renda-poup-ess-liv-div).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  const tbody = $("txTbody");
  tbody.innerHTML = "";
  tx.forEach((t,i)=>{
    tbody.innerHTML += `
      <tr>
        <td>${t.data}</td>
        <td>${t.valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td>
        <td>${t.tipo} - ${t.categoria || ""}</td>
        <td>${t.banco}</td>
        <td><button onclick="removeTx(${i})">X</button></td>
      </tr>`;
  });
}

function removeTx(i){
  const tx = loadTx();
  tx.splice(i,1);
  saveTx(tx);
  render(tx);
}

window.onload = () => {
  setOptions($("poupancaCategoria"), POUPANCA_CATEGORIAS);
  setOptions($("poupancaBanco"), POUPANCA_BANCOS);
  setOptions($("receitaCategoria"), RECEITA_CATEGORIAS);
  setOptions($("receitaBanco"), RECEITA_BANCOS);
  setOptions($("despesaBanco"), BANCOS_DESPESA_DIVIDA);
  setOptions($("dividaBanco"), BANCOS_DESPESA_DIVIDA);

  const tx = loadTx();
  render(tx);
};
