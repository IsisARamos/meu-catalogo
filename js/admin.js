// Preencher com a URL do projeto Cloudflare Pages (Functions) depois que ela existir.
// Ex.: "https://use-isis-admin.pages.dev"
const API_BASE = "";

let produtos = [];
let editandoId = null;
let excluindoId = null;
let toastTimer = null;

async function init() {
  wireEventos();
  await carregarProdutos();
}

function wireEventos() {
  document.getElementById("btnNovo").addEventListener("click", () => abrirForm(null));
  document.getElementById("fecharForm").addEventListener("click", fecharForm);
  document.getElementById("cancelarForm").addEventListener("click", fecharForm);
  document.getElementById("modalForm").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) fecharForm();
  });

  document.getElementById("fecharConfirm").addEventListener("click", fecharConfirm);
  document.getElementById("cancelarConfirm").addEventListener("click", fecharConfirm);
  document.getElementById("modalConfirm").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) fecharConfirm();
  });

  document.getElementById("form").addEventListener("submit", onSalvar);
  document.getElementById("confirmarExcluir").addEventListener("click", onExcluir);
}

async function chamarAPI(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const msg = (data && data.erro) || `Erro inesperado (status ${res.status}).`;
    throw new Error(msg);
  }
  return data;
}

async function carregarProdutos() {
  try {
    produtos = await chamarAPI("/api/produtos");
    renderTabela();
    renderDatalistCategorias();
    limparErroGeral();
  } catch (e) {
    mostrarErroGeral("Não foi possível carregar os produtos. Verifique sua internet e tente novamente.");
  }
}

function renderTabela() {
  const corpo = document.getElementById("corpoTabela");
  document.getElementById("contagem").textContent = `Produtos (${produtos.length})`;

  if (produtos.length === 0) {
    corpo.innerHTML = `<tr><td colspan="6"><p class="admin-empty">Nenhum produto cadastrado ainda.</p></td></tr>`;
    return;
  }

  corpo.innerHTML = produtos
    .map(
      (p) => `
    <tr data-id="${p.id}">
      <td><img class="admin-thumb" src="${escapeAttr(p.imagem)}" alt="${escapeAttr(p.nome)}" loading="lazy" /></td>
      <td>${escapeHtml(p.nome)}</td>
      <td>${escapeHtml(p.categoria)}</td>
      <td>${formatBRL(p.preco)}</td>
      <td>${p.disponivel ? '<span class="pill pill-ok">Disponível</span>' : '<span class="pill pill-off">Esgotado</span>'}</td>
      <td>
        <button class="btn-icon" data-acao="editar" data-id="${p.id}" title="Editar" aria-label="Editar">✏️</button>
        <button class="btn-icon" data-acao="excluir" data-id="${p.id}" title="Excluir" aria-label="Excluir">🗑️</button>
      </td>
    </tr>`
    )
    .join("");

  corpo.querySelectorAll('[data-acao="editar"]').forEach((btn) =>
    btn.addEventListener("click", () => abrirForm(Number(btn.dataset.id)))
  );
  corpo.querySelectorAll('[data-acao="excluir"]').forEach((btn) =>
    btn.addEventListener("click", () => abrirConfirm(Number(btn.dataset.id)))
  );
}

function renderDatalistCategorias() {
  const categorias = [...new Set(produtos.map((p) => p.categoria))];
  document.getElementById("listaCategorias").innerHTML = categorias
    .map((c) => `<option value="${escapeAttr(c)}"></option>`)
    .join("");
}

function abrirForm(id) {
  editandoId = id;
  document.getElementById("form").reset();
  document.getElementById("erroForm").innerHTML = "";

  if (id !== null) {
    const p = produtos.find((x) => x.id === id);
    document.getElementById("tituloForm").textContent = "Editar produto";
    document.getElementById("campoNome").value = p.nome;
    document.getElementById("campoCategoria").value = p.categoria;
    document.getElementById("campoPreco").value = p.preco;
    document.getElementById("campoDescricao").value = p.descricao || "";
    document.getElementById("campoDisponivel").checked = !!p.disponivel;
    document.getElementById("campoImagemUrl").value = p.imagem || "";
  } else {
    document.getElementById("tituloForm").textContent = "Novo produto";
    document.getElementById("campoDisponivel").checked = true;
  }

  document.getElementById("modalForm").classList.add("aberto");
}

function fecharForm() {
  document.getElementById("modalForm").classList.remove("aberto");
}

async function onSalvar(e) {
  e.preventDefault();
  const btn = document.getElementById("salvarForm");
  document.getElementById("erroForm").innerHTML = "";

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Salvando...';

  try {
    const payload = {
      nome: document.getElementById("campoNome").value,
      categoria: document.getElementById("campoCategoria").value,
      preco: document.getElementById("campoPreco").value,
      descricao: document.getElementById("campoDescricao").value,
      disponivel: document.getElementById("campoDisponivel").checked,
      imagem: document.getElementById("campoImagemUrl").value.trim(),
    };

    if (editandoId !== null) {
      await chamarAPI(`/api/produtos/${editandoId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await chamarAPI("/api/produtos", { method: "POST", body: JSON.stringify(payload) });
    }

    fecharForm();
    mostrarToast("Salvo! O site vai atualizar em cerca de 1 minuto.");
    await carregarProdutos();
  } catch (err) {
    mostrarErroForm(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar";
  }
}

function abrirConfirm(id) {
  excluindoId = id;
  const p = produtos.find((x) => x.id === id);
  document.getElementById("textoConfirm").textContent = `Excluir "${p ? p.nome : ""}"? Essa ação não pode ser desfeita.`;
  document.getElementById("modalConfirm").classList.add("aberto");
}

function fecharConfirm() {
  document.getElementById("modalConfirm").classList.remove("aberto");
  excluindoId = null;
}

async function onExcluir() {
  if (excluindoId === null) return;
  const btn = document.getElementById("confirmarExcluir");
  btn.disabled = true;
  try {
    await chamarAPI(`/api/produtos/${excluindoId}`, { method: "DELETE" });
    fecharConfirm();
    mostrarToast("Produto excluído.");
    await carregarProdutos();
  } catch (err) {
    mostrarToast(err.message, "erro");
  } finally {
    btn.disabled = false;
  }
}

function mostrarToast(msg, tipo = "ok") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.toggle("erro", tipo === "erro");
  toast.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visivel"), 3000);
}

function mostrarErroGeral(msg) {
  document.getElementById("erroGeral").innerHTML = `<div class="erro-inline">${escapeHtml(msg)}</div>`;
}
function limparErroGeral() {
  document.getElementById("erroGeral").innerHTML = "";
}
function mostrarErroForm(msg) {
  document.getElementById("erroForm").innerHTML = `<div class="erro-inline">${escapeHtml(msg)}</div>`;
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function escapeAttr(str) {
  return escapeHtml(str);
}

function formatBRL(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

init();
