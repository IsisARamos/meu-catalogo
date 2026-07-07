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

async function init() {
  try {
    const res = await fetch("produtos.json");
    produtos = await res.json();
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

// ===================== BANNER INFORMATIVO =====================
function initBanner() {
  const slides = [
    {
      eyebrow: "sono & bem-estar",
      titulo: "Um bom pijama transforma sua noite.",
      texto: "Tecidos macios e confortáveis regulam a temperatura do corpo, ajudam a relaxar e melhoram a qualidade do sono. Você merece dormir bem.",
      bg: "linear-gradient(135deg,#2a1a1a,#3d2020)"
    },
    {
      eyebrow: "perfumaria & autoestima",
      titulo: "Um bom perfume é presença antes mesmo das palavras.",
      texto: "Fragrâncias impactam o humor, a confiança e como somos lembradas. Usar um perfume que você ama é um ato de cuidado consigo mesma.",
      bg: "linear-gradient(135deg,#1a1a2a,#20203d)"
    },
    {
      eyebrow: "lingerie & confiança",
      titulo: "Vestir uma boa lingerie é se sentir poderosa por dentro.",
      texto: "Não é só para os outros — é para você. Uma lingerie bonita eleva a autoestima, desperta sensualidade e celebra seu corpo do jeito que ele merece.",
      bg: "linear-gradient(135deg,#2a1a22,#3d2030)"
    }
  ];

  const track = document.getElementById("bannerTrack");
  const dots = document.getElementById("bannerDots");

  track.innerHTML = slides.map(s => `
    <div class="banner-slide" style="background:${s.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 40px;text-align:center;">
      <p style="font-size:10px;letter-spacing:4px;color:#D4A96A;text-transform:uppercase;margin:0 0 10px;font-family:'Inter',sans-serif;">${s.eyebrow}</p>
      <p style="font-family:'Playfair Display',serif;font-size:18px;color:#F5E6E0;margin:0 0 10px;line-height:1.4;">${s.titulo}</p>
      <p style="font-size:13px;color:#aaa;margin:0;line-height:1.6;font-family:'Inter',sans-serif;">${s.texto}</p>
    </div>`).join("");

  dots.innerHTML = slides.map((_, i) =>
    `<button class="banner-dot${i === 0 ? " ativo" : ""}" onclick="irParaSlide(${i})"></button>`
  ).join("");

  document.getElementById("bannerPrev").addEventListener("click", () => {
    irParaSlide((bannerAtual - 1 + slides.length) % slides.length);
  });
  document.getElementById("bannerNext").addEventListener("click", () => {
    irParaSlide((bannerAtual + 1) % slides.length);
  });

  bannerTimer = setInterval(() => {
    irParaSlide((bannerAtual + 1) % slides.length);
  }, 4000);
}

function irParaSlide(idx) {
  bannerAtual = idx;
  document.getElementById("bannerTrack").style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll(".banner-dot").forEach((d, i) => {
    d.classList.toggle("ativo", i === idx);
  });
  clearInterval(bannerTimer);
  bannerTimer = setInterval(() => {
    irParaSlide((bannerAtual + 1) % 3);
  }, 4000);
}

// ===================== DARK MODE =====================
function initDarkMode() {
  const header = document.getElementById("siteHeader");
  const dark = localStorage.getItem("darkMode") === "1";
  if (dark) {
    document.body.classList.add("dark");
    if (header) header.style.background = "#1a1a1a";
  }
  document.getElementById("darkToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    if (header) header.style.background = isDark ? "#1a1a1a" : "#F5E6E0";
    localStorage.setItem("darkMode", isDark ? "1" : "0");
    const icon = document.querySelector("#darkToggle i");
    icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  });
}
// ===================== FILTROS =====================
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

  document.getElementById("filtroPreco").addEventListener("change", e => {
    filtroPrecoDe = Number(e.target.value);
    renderGrid();
  });

  document.getElementById("filtroFav").addEventListener("click", () => {
    mostrarFavoritos = !mostrarFavoritos;
    document.getElementById("filtroFav").classList.toggle("ativo", mostrarFavoritos);
    renderGrid();
  });
}

// ===================== GRID =====================
function renderGrid() {
  let lista = filtroAtivo === "Todos"
    ? produtos
    : produtos.filter(p => p.categoria === filtroAtivo);

  if (filtroPrecoDe > 0) lista = lista.filter(p => p.preco <= filtroPrecoDe);
  if (mostrarFavoritos) lista = lista.filter(p => favoritos.includes(p.id));

  const grid = document.getElementById("grid");
  grid.innerHTML = lista.map(p => {
    const sel = carrinho.includes(p.id);
    const esg = !p.disponivel;
    const fav = favoritos.includes(p.id);
    return `
      <div class="card${esg ? " esgotado" : ""}${sel ? " selecionado" : ""}" data-id="${p.id}">
        <button class="card-fav${fav ? " favoritado" : ""}" data-id="${p.id}" title="Favoritar">
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

// ===================== CARRINHO =====================
function toggleCarrinho(id) {
  const idx = carrinho.indexOf(id);
  if (idx === -1) carrinho.push(id);
  else carrinho.splice(idx, 1);
  renderGrid();
  atualizarBarra();
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
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

// ===================== LIGHTBOX =====================
function abrirLightbox(id) {
  const p = produtos.find(x => x.id === id);
  if (!p) return;
  document.getElementById("lightboxImg").src = p.imagem;
  document.getElementById("lightboxImg").alt = p.nome;
  document.getElementById("lightboxNome").textContent = p.nome;
  document.getElementById("lightboxPreco").textContent = formatBRL(p.preco);
  document.getElementById("lightboxWhats").onclick = () => {
    const msg = `Olá! Tenho interesse no produto: *${p.nome}* — ${formatBRL(p.preco)} 😊`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  document.getElementById("lightbox").classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function fecharLightbox() {
  document.getElementById("lightbox").classList.remove("aberto");
  document.body.style.overflow = "";
}

document.getElementById("lightboxFechar").addEventListener("click", fecharLightbox);
document.getElementById("lightbox").addEventListener("click", e => {
  if (e.target === e.currentTarget) fecharLightbox();
});

// ===================== MODAL =====================
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
