// =============================================
// CONFIGURAÇÃO — edite o número do WhatsApp
// =============================================
const WHATSAPP = "5551986489731"; // formato: 55 + DDD + número (sem espaços)
const NOME_LOJA = "Minha Loja";

// =============================================
// ESTADO
// =============================================
let produtos = [];
let carrinho = []; // Array de IDs selecionados
let filtroAtivo = "Todos";

// =============================================
// INICIALIZAÇÃO
// =============================================
async function init() {
  try {
    const res = await fetch("produtos.json");
    produtos = await res.json();
    renderFiltros();
    renderGrid();
  } catch (e) {
    document.getElementById("grid").innerHTML =
      '<p style="padding:20px;color:#888">Erro ao carregar produtos.</p>';
  }
}

// =============================================
// FILTROS
// =============================================
function renderFiltros() {
  const cats = ["Todos", ...new Set(produtos.map(p => p.categoria))];
  const nav = document.getElementById("filtros");
  nav.innerHTML = cats
    .map(c => `<button class="filtro-btn${c === filtroAtivo ? " ativo" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
  nav.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filtroAtivo = btn.dataset.cat;
      nav.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      renderGrid();
    });
  });
}

// =============================================
// GRID DE PRODUTOS
// =============================================
function renderGrid() {
  const lista = filtroAtivo === "Todos"
    ? produtos
    : produtos.filter(p => p.categoria === filtroAtivo);

  const grid = document.getElementById("grid");
  grid.innerHTML = lista.map(p => {
    const sel = carrinho.includes(p.id);
    const esg = !p.disponivel;
    return `
      <div class="card${esg ? " esgotado" : ""}${sel ? " selecionado" : ""}" data-id="${p.id}">
        <img class="card-img" src="${p.imagem}" alt="${p.nome}" loading="lazy" />
        ${esg ? '<span class="badge-esgotado">Esgotado</span>' : ""}
        ${sel ? '<span class="badge-sel">✓</span>' : ""}
        <div class="card-corpo">
          <p class="card-cat">${p.categoria}</p>
          <h2 class="card-nome">${p.nome}</h2>
          <p class="card-desc">${p.descricao}</p>
          <div class="card-rodape">
            <span class="card-preco">${formatBRL(p.preco)}</span>
            ${esg
              ? ""
              : sel
                ? `<button class="card-btn rem" data-id="${p.id}" title="Remover">−</button>`
                : `<button class="card-btn" data-id="${p.id}" title="Adicionar">+</button>`
            }
          </div>
        </div>
      </div>`;
  }).join("");

  grid.querySelectorAll(".card-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      toggleCarrinho(id);
    });
  });
}

// =============================================
// CARRINHO
// =============================================
function toggleCarrinho(id) {
  const idx = carrinho.indexOf(id);
  if (idx === -1) carrinho.push(id);
  else carrinho.splice(idx, 1);
  renderGrid();
  atualizarBarra();
}

function atualizarBarra() {
  const bar = document.getElementById("carrinhoBar");
  const count = document.getElementById("carrinhoCount");
  const total = document.getElementById("carrinhoTotal");
  const itens = carrinho.map(id => produtos.find(p => p.id === id)).filter(Boolean);
  const soma = itens.reduce((s, p) => s + p.preco, 0);

  count.textContent = `${itens.length} ${itens.length === 1 ? "item" : "itens"} selecionado${itens.length === 1 ? "" : "s"}`;
  total.textContent = formatBRL(soma);

  if (itens.length > 0) bar.classList.add("visivel");
  else bar.classList.remove("visivel");
}

// =============================================
// MODAL PEDIDO
// =============================================
document.getElementById("btnPedido").addEventListener("click", abrirModal);
document.getElementById("modalFechar").addEventListener("click", fecharModal);
document.getElementById("modalOverlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) fecharModal();
});

function abrirModal() {
  const itens = carrinho.map(id => produtos.find(p => p.id === id)).filter(Boolean);
  const soma = itens.reduce((s, p) => s + p.preco, 0);

  document.getElementById("modalItens").innerHTML = itens
    .map(p => `<div class="modal-item"><span>${p.nome}</span><span>${formatBRL(p.preco)}</span></div>`)
    .join("");

  document.getElementById("modalTotalValor").textContent = formatBRL(soma);

  const texto = gerarTexto(itens, soma);
  document.getElementById("modalTexto").value = texto;

  document.getElementById("modalOverlay").classList.add("aberto");
}

function fecharModal() {
  document.getElementById("modalOverlay").classList.remove("aberto");
}

function gerarTexto(itens, soma) {
  const linhas = itens.map((p, i) => `${i + 1}. ${p.nome} — ${formatBRL(p.preco)}`).join("\n");
  return `🛍️ *Pedido — ${NOME_LOJA}*\n\n${linhas}\n\n💰 *Total: ${formatBRL(soma)}*\n\nOlá! Gostaria de fazer este pedido. 😊`;
}

// COPIAR
document.getElementById("btnCopiar").addEventListener("click", () => {
  const txt = document.getElementById("modalTexto");
  txt.select();
  navigator.clipboard.writeText(txt.value).then(() => {
    const btn = document.getElementById("btnCopiar");
    btn.textContent = "Copiado! ✓";
    setTimeout(() => btn.textContent = "Copiar resumo", 2000);
  });
});

// WHATSAPP
document.getElementById("btnWhats").addEventListener("click", () => {
  const texto = document.getElementById("modalTexto").value;
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
});

// =============================================
// UTILITÁRIOS
// =============================================
function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// =============================================
// START
// =============================================
init();
