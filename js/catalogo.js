const WHATSAPP = "5551986489731";
const NOME_LOJA = "Use Isis";
const MAX_ITENS = 10;

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
let filtroAtivo = "Todos";
let filtroPrecoDe = 0;
let mostrarFavoritos = false;
let bannerAtual = 0;
let bannerTimer = null;
let listaAtual = [];
let lightboxIndex = -1;

async function init() {
  try {
    const res = await fetch("produtos.json");
    produtos = await res.json();
    lerFiltrosDaURL();
    renderFiltros();
    renderGrid();
    atualizarBarra();
    initBanner();
    initDarkMode();
  } catch (e) {
    document.getElementById("grid").innerHTML =
      '<p style="padding:20px;color:#888">Erro ao carregar produtos.</p>';
  }
}

function lerFiltrosDaURL() {
  const params = new URLSearchParams(location.search);
  if (params.has("cat")) filtroAtivo = params.get("cat");
  if (params.has("preco")) filtroPrecoDe = Number(params.get("preco")) || 0;
  if (params.get("fav") === "1") mostrarFavoritos = true;
}

function syncURL() {
  const params = new URLSearchParams();
  if (filtroAtivo !== "Todos") params.set("cat", filtroAtivo);
  if (filtroPrecoDe > 0) params.set("preco", String(filtroPrecoDe));
  if (mostrarFavoritos) params.set("fav", "1");
  const query = params.toString();
  history.replaceState(null, "", query ? `${location.pathname}?${query}` : location.pathname);
}

function attachSwipe(el, { onLeft, onRight, threshold = 40 } = {}) {
  let startX = 0, startY = 0, tracking = false;
  el.addEventListener("touchstart", e => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  }, { passive: true });
  el.addEventListener("touchend", e => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) onLeft && onLeft();
    else onRight && onRight();
  }, { passive: true });
}

function initBanner() {
  const slides = [
    {
      eyebrow: "sono & bem-estar",
      frase: "Um bom pijama é o começo de uma noite perfeita.",
      imagem: "https://i.imgur.com/ALAGCH4.jpeg"
    },
    {
      eyebrow: "lingerie & confiança",
      frase: "Me visto bem por dentro antes mesmo de sair de casa.",
      imagem: "https://i.imgur.com/WyMAXZY.jpeg"
    },
    {
      eyebrow: "perfumaria & presença",
      frase: "Um perfume bom chega antes de você e fica depois que vai embora.",
      imagem: "https://i.imgur.com/ALAGCH4.jpeg"
    }
  ];

  const track = document.getElementById("bannerTrack");
  const dots = document.getElementById("bannerDots");
  const total = slides.length;

  track.innerHTML = slides.map(s => `
    <div style="position:relative;min-width:100%;height:480px;overflow:hidden;flex-shrink:0;">
      <img src="${s.imagem}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:top center;" />
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,5,5,0.0) 40%,rgba(10,5,5,0.85));"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 24px 44px;text-align:center;">
        <p style="font-size:10px;letter-spacing:3px;color:#D4A96A;text-transform:uppercase;margin:0 0 8px;font-family:'Inter',sans-serif;">${s.eyebrow}</p>
        <p style="font-family:'Playfair Display',serif;font-size:clamp(14px,3.5vw,18px);color:#F5E6E0;margin:0;line-height:1.5;font-style:italic;">"${s.frase}"</p>
      </div>
    </div>`).join("");

  dots.innerHTML = slides.map((_, i) =>
    `<button class="banner-dot${i === 0 ? " ativo" : ""}" onclick="irParaSlide(${i})"></button>`
  ).join("");

  document.getElementById("bannerPrev").addEventListener("click", () => {
    irParaSlide((bannerAtual - 1 + total) % total);
  });
  document.getElementById("bannerNext").addEventListener("click", () => {
    irParaSlide((bannerAtual + 1) % total);
  });

  attachSwipe(track, {
    onLeft: () => irParaSlide((bannerAtual + 1) % total),
    onRight: () => irParaSlide((bannerAtual - 1 + total) % total),
  });

  bannerTimer = setInterval(() => {
    irParaSlide((bannerAtual + 1) % total);
  }, 4500);
}

function irParaSlide(idx) {
  const total = document.querySelectorAll("#bannerTrack > div").length;
  bannerAtual = idx;
  document.getElementById("bannerTrack").style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll(".banner-dot").forEach((d, i) => {
    d.classList.toggle("ativo", i === idx);
  });
  clearInterval(bannerTimer);
  bannerTimer = setInterval(() => {
    irParaSlide((bannerAtual + 1) % total);
  }, 4500);
}

function aplicarCoresHeader(isDark) {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  header.style.background = isDark ? "#1a1a1a" : "#F5E6E0";
  header.querySelectorAll(".header-texto").forEach(el => {
    el.style.color = isDark ? "#C49A6C" : "#8B5E3C";
  });
}

function initDarkMode() {
  const salvo = localStorage.getItem("darkMode");
  const dark = salvo !== null
    ? salvo === "1"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.body.classList.add("dark");
  aplicarCoresHeader(dark);

  document.getElementById("darkToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    aplicarCoresHeader(isDark);
    localStorage.setItem("darkMode", isDark ? "1" : "0");
    const icon = document.querySelector("#darkToggle i");
    icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  });
}

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
      syncURL();
    });
  });

  const filtroPrecoEl = document.getElementById("filtroPreco");
  filtroPrecoEl.value = String(filtroPrecoDe);
  filtroPrecoEl.addEventListener("change", e => {
    filtroPrecoDe = Number(e.target.value);
    renderGrid();
    syncURL();
  });

  document.getElementById("filtroFav").classList.toggle("ativo", mostrarFavoritos);
  document.getElementById("filtroFav").addEventListener("click", () => {
    mostrarFavoritos = !mostrarFavoritos;
    document.getElementById("filtroFav").classList.toggle("ativo", mostrarFavoritos);
    renderGrid();
    syncURL();
  });
}

const supportsViewTransition = "startViewTransition" in document;

function renderGrid() {
  let lista = filtroAtivo === "Todos"
    ? produtos
    : produtos.filter(p => p.categoria === filtroAtivo);

  if (filtroPrecoDe > 0) lista = lista.filter(p => p.preco <= filtroPrecoDe);
  if (mostrarFavoritos) lista = lista.filter(p => favoritos.includes(p.id));

  if (supportsViewTransition) document.startViewTransition(() => desenharGrid(lista));
  else desenharGrid(lista);
}

function desenharGrid(lista) {
  listaAtual = lista;
  const grid = document.getElementById("grid");

  if (lista.length === 0) {
    grid.innerHTML = '<p class="grid-vazio">Nenhum produto encontrado com esse filtro.</p>';
    return;
  }

  grid.innerHTML = lista.map(p => {
    const sel = carrinho.includes(p.id);
    const esg = !p.disponivel;
    const fav = favoritos.includes(p.id);
    return `
      <div class="card${esg ? " esgotado" : ""}${sel ? " selecionado" : ""}" data-id="${p.id}">
        <button class="card-fav${fav ? " favoritado" : ""}" data-id="${p.id}" title="Favoritar" aria-label="Favoritar ${p.nome}">
          <i class="${fav ? "fas" : "far"} fa-heart"></i>
        </button>
        <img class="card-img" src="${p.imagem}" alt="${p.nome}" loading="lazy" data-lightbox="${p.id}" />
        ${esg ? '<span class="badge-esgotado">Esgotado</span>' : ""}
        ${sel ? '<span class="badge-sel">✓</span>' : ""}
        <div class="card-corpo">
          <p class="card-cat">${p.categoria}</p>
          <h2 class="card-nome">${p.nome}</h2>
          <p class="card-desc">${p.descricao}</p>
          <div class="card-rodape">
            <span class="card-preco">${formatBRL(p.preco)}</span>
            <div style="display:flex;gap:6px;align-items:center;">
              ${esg
                ? ""
                : sel
                  ? `<button class="card-btn rem" data-id="${p.id}" title="Remover">−</button>`
                  : `<button class="card-btn" data-id="${p.id}" title="Adicionar">+</button>`
              }
              ${!esg ? `<button class="card-whats" data-id="${p.id}" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>` : ""}
            </div>
          </div>
        </div>
      </div>`;
  }).join("");

  grid.querySelectorAll(".card-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      toggleCarrinho(id);
      const b = document.querySelector(`.card-btn[data-id="${id}"]:not(.rem)`);
      if (b) { b.classList.add("animando"); setTimeout(() => b.classList.remove("animando"), 300); }
    });
  });

  grid.querySelectorAll(".card-whats").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const p = produtos.find(x => x.id === Number(btn.dataset.id));
      if (!p) return;
      const msg = `Olá! Tenho interesse no produto: *${p.nome}* — ${formatBRL(p.preco)} 😊`;
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  });

  grid.querySelectorAll(".card-fav").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      const idx = favoritos.indexOf(id);
      if (idx === -1) favoritos.push(id);
      else favoritos.splice(idx, 1);
      localStorage.setItem("favoritos", JSON.stringify(favoritos));
      renderGrid();
    });
  });

  grid.querySelectorAll(".card-img[data-lightbox]").forEach(img => {
    img.addEventListener("click", () => abrirLightbox(Number(img.dataset.lightbox)));
  });
}

function toggleCarrinho(id) {
  const idx = carrinho.indexOf(id);
  const adicionando = idx === -1;
  if (adicionando) carrinho.push(id);
  else carrinho.splice(idx, 1);
  renderGrid();
  atualizarBarra();
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  const p = produtos.find(x => x.id === id);
  if (p) mostrarToast(adicionando ? `${p.nome} adicionado ✓` : `${p.nome} removido`);
}

let toastTimer = null;
function mostrarToast(msg) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visivel"), 2000);
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

  const pct = Math.min((itens.length / MAX_ITENS) * 100, 100);
  document.getElementById("progressoFill").style.width = pct + "%";
  document.getElementById("progressoTexto").textContent =
    itens.length === 0 ? "Nenhum item selecionado" : `${itens.length} ${itens.length === 1 ? "item" : "itens"} no carrinho`;
}

function abrirLightbox(id) {
  const idx = listaAtual.findIndex(p => p.id === id);
  if (idx === -1) return;
  lightboxIndex = idx;
  mostrarProdutoNoLightbox();
  document.getElementById("lightbox").classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function mostrarProdutoNoLightbox() {
  const p = listaAtual[lightboxIndex];
  if (!p) return;
  document.getElementById("lightboxImg").src = p.imagem;
  document.getElementById("lightboxImg").alt = p.nome;
  document.getElementById("lightboxNome").textContent = p.nome;
  document.getElementById("lightboxPreco").textContent = formatBRL(p.preco);
  document.getElementById("lightboxWhats").onclick = () => {
    const msg = `Olá! Tenho interesse no produto: *${p.nome}* — ${formatBRL(p.preco)} 😊`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };
}

function navegarLightbox(delta) {
  if (listaAtual.length === 0) return;
  lightboxIndex = (lightboxIndex + delta + listaAtual.length) % listaAtual.length;
  mostrarProdutoNoLightbox();
}

function fecharLightbox() {
  document.getElementById("lightbox").classList.remove("aberto");
  document.body.style.overflow = "";
}

document.getElementById("lightboxFechar").addEventListener("click", fecharLightbox);
document.getElementById("lightbox").addEventListener("click", e => {
  if (e.target === e.currentTarget) fecharLightbox();
});
attachSwipe(document.getElementById("lightbox"), {
  onLeft: () => navegarLightbox(1),
  onRight: () => navegarLightbox(-1),
});

document.getElementById("btnPedido").addEventListener("click", abrirModal);
document.getElementById("modalFechar").addEventListener("click", fecharModal);
document.getElementById("modalOverlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) fecharModal();
});

function abrirModal() {
  const itens = carrinho.map(id => produtos.find(p => p.id === id)).filter(Boolean);
  const soma = itens.reduce((s, p) => s + p.preco, 0);
  document.getElementById("modalItens").innerHTML = itens.map(p => `
    <div class="modal-item">
      <img class="modal-item-img" src="${p.imagem}" alt="${p.nome}" />
      <div class="modal-item-info"><span>${p.nome}</span></div>
      <span>${formatBRL(p.preco)}</span>
    </div>`).join("");
  document.getElementById("modalTotalValor").textContent = formatBRL(soma);
  document.getElementById("modalTexto").value = gerarTexto(itens, soma);
  document.getElementById("modalOverlay").classList.add("aberto");

  document.getElementById("btnLimpar").onclick = () => {
    carrinho = [];
    localStorage.removeItem("carrinho");
    renderGrid();
    atualizarBarra();
    fecharModal();
  };
}

function fecharModal() {
  document.getElementById("modalOverlay").classList.remove("aberto");
}

function gerarTexto(itens, soma) {
  const nome = document.getElementById("nomeCliente")?.value?.trim();
  const saudacao = nome ? `Olá, me chamo *${nome}*!\n\n` : "";
  const linhas = itens.map((p, i) => `${i + 1}. ${p.nome} — ${formatBRL(p.preco)}`).join("\n");
  return `🛍️ *Pedido — ${NOME_LOJA}*\n\n${saudacao}${linhas}\n\n💰 *Total: ${formatBRL(soma)}*\n\nGostaria de fazer este pedido. 😊`;
}

document.getElementById("btnCopiar").addEventListener("click", () => {
  const txt = document.getElementById("modalTexto");
  txt.select();
  navigator.clipboard.writeText(txt.value).then(() => {
    const btn = document.getElementById("btnCopiar");
    btn.textContent = "Copiado! ✓";
    setTimeout(() => btn.textContent = "Copiar resumo", 2000);
  });
});

document.getElementById("btnWhats").addEventListener("click", () => {
  const texto = document.getElementById("modalTexto").value;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank");
});

function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

init();
