/* ================================
   ERP FINANCEIRO — DASHBOARD JS
   ================================ */

const TX_KEY = `gf_erp_tx_${new Date().toISOString().slice(0,7)}`;

// ===== LISTAS =====
const POUPANCA_CATEGORIAS = ["Reserva","Investimento","Aplicação"];
const RECEITA_CATEGORIAS = ["Salário","Renda Extra","Reembolso","Rendimentos","Serviços"];

const DIVIDA_CATEGORIAS = [
  "Financiamento Estudantil",
  "Parcelas",
  "Financiamento Imobiliário",
  "Financiamento de Veículo",
  "Empréstimo Pessoal",
  "Empréstimo",
  "Cheque Especial",
  "Acordos e Renegociações",
  "Outras Dívidas"
];

const DESPESAS_ESSENCIAIS = ["Alimentação","Moradia","Saúde","Transporte","Educação"];
const DESPESAS_LIVRES = ["Lazer","Viagens","Compras","Extras"];

const BANCOS = ["Cartão","Itaú","Mercado Pago","Nubank","Clear"];

const $ = (id) => document.getElementById(id);

// ===== HELPERS =====
function setOptions(el, list){
  if(!el) return;
  el.innerHTML = `<option value="">Selecione</option>`;
  list.forEach(v=>{
    const o=document.createElement("option");
    o.value=v; o.textContent=v;
    el.appendChild(o);
  });
}

function brl(v){
  return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function loadTx(){
  return JSON.parse(localStorage.getItem(TX_KEY) || "[]");
}

function saveTx(tx){
  localStorage.setItem(TX_KEY, JSON.stringify(tx));
}

// ===== CÁLCULOS =====
function resumo(tx){
  let r=0,p=0,e=0,l=0,d=0;
  tx.forEach(t=>{
    if(t.tipo==="receita") r+=t.valor;
    if(t.tipo==="poupanca") p+=t.valor;
    if(t.tipo==="despesa" && t.subtipo==="essencial") e+=t.valor;
    if(t.tipo==="despesa" && t.subtipo==="livre") l+=t.valor;
    if(t.tipo==="divida") d+=t.valor;
  });
  return {r,p,e,l,d,saldo:r-p-e-l-d};
}

// ===== RENDER =====
function render(tx){
  const s = resumo(tx);

  $("kpiRenda").textContent = brl(s.r);
  $("kpiPoupanca").textContent = brl(s.p);
  $("kpiEssenciais").textContent = brl(s.e);
  $("kpiLivres").textContent = brl(s.l);
  $("kpiDividas").textContent = brl(s.d);
  $("kpiSaldoDistribuir").textContent = brl(s.saldo);

  const tbody = $("txTbody");
  tbody.innerHTML = "";

  tx.forEach((t,i)=>{
    tbody.innerHTML += `
      <tr>
        <td>${t.data}</td>
        <td>${brl(t.valor)}</td>
        <td>${t.tipo} — ${t.categoria}</td>
        <td>${t.banco}</td>
        <td><button onclick="del(${i})">X</button></td>
      </tr>`;
  });
}

function del(i){
  const tx = loadTx();
  tx.splice(i,1);
  saveTx(tx);
  render(tx);
}

// ===== INIT =====
window.onload = () => {
  setOptions($("poupancaCategoria"), POUPANCA_CATEGORIAS);
  setOptions($("receitaCategoria"), RECEITA_CATEGORIAS);
  setOptions($("dividaCategoria"), DIVIDA_CATEGORIAS);

  setOptions($("poupancaBanco"), BANCOS);
  setOptions($("receitaBanco"), BANCOS);
  setOptions($("despesaBanco"), BANCOS);
  setOptions($("dividaBanco"), BANCOS);

  $("despesaSubtipo").onchange = () => {
    setOptions(
      $("despesaCategoria"),
      $("despesaSubtipo").value==="essencial"
        ? DESPESAS_ESSENCIAIS
        : DESPESAS_LIVRES
    );
  };

  const tx = loadTx();
  render(tx);

  $("formPoupanca").onsubmit = e=>{
    e.preventDefault();
    tx.push({tipo:"poupanca",data:e.target.data.value,valor:+e.target.valor.value,categoria:e.target.categoria.value,banco:e.target.banco.value});
    saveTx(tx); e.target.reset(); setOptions($("poupancaCategoria"),POUPANCA_CATEGORIAS); render(tx);
  };

  $("formReceita").onsubmit = e=>{
    e.preventDefault();
    tx.push({tipo:"receita",data:e.target.data.value,valor:+e.target.valor.value,categoria:e.target.categoria.value,banco:e.target.banco.value});
    saveTx(tx); e.target.reset(); setOptions($("receitaCategoria"),RECEITA_CATEGORIAS); render(tx);
  };

  $("formDespesa").onsubmit = e=>{
    e.preventDefault();
    tx.push({tipo:"despesa",subtipo:e.target.subtipo.value,data:e.target.data.value,valor:+e.target.valor.value,categoria:e.target.categoria.value,banco:e.target.banco.value});
    saveTx(tx); e.target.reset(); render(tx);
  };

  $("formDivida").onsubmit = e=>{
    e.preventDefault();
    tx.push({tipo:"divida",data:e.target.data.value,valor:+e.target.valor.value,categoria:e.target.categoria.value,banco:e.target.banco.value});
    saveTx(tx); e.target.reset(); setOptions($("dividaCategoria"),DIVIDA_CATEGORIAS); render(tx);
  };
};
