# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## O que é isto

Um catálogo de produtos estático, de página única ("Use Isis" — moda feminina), para vendas via WhatsApp. Sem etapa de build, sem dependências, sem gerenciador de pacotes — HTML/CSS/JS puro servido como arquivos estáticos (ex.: via GitHub Pages).

Essa regra vale para o site que os clientes veem (`index.html`, `css/style.css`, `js/catalogo.js`, `produtos.json`). Há uma exceção isolada e documentada para o painel administrativo — ver seção "Painel administrativo" abaixo.

## Executando / pré-visualizando

Não há ferramentas de build ou servidor de desenvolvimento neste repositório. Abra `index.html` diretamente no navegador, ou sirva a pasta com qualquer servidor de arquivos estáticos (ex.: `python -m http.server`), já que `catalogo.js` busca `produtos.json` via `fetch()`, o que exige HTTP em vez de `file://` em alguns navegadores.

Não há testes, linters ou comandos de build configurados.

## Arquitetura

- `index.html` — apenas o esqueleto/marcação da página. A maioria das seções (grid, modal, lightbox, barra do carrinho) são containers vazios preenchidos em tempo de execução pelo JS.
- `js/catalogo.js` — toda a lógica da aplicação, arquivo único, sem módulos/framework, APIs DOM puras (vanilla). No `init()`, busca `produtos.json` e renderiza tudo no lado do cliente.
- `produtos.json` — a fonte de dados dos produtos, buscada em tempo de execução. É o arquivo que pessoas não-desenvolvedoras devem editar para gerenciar o estoque (ver README.md para o contrato de edição: campos são `id`, `nome`, `categoria`, `preco`, `descricao`, `disponivel`, `imagem`).
- `css/style.css` — tematização via custom properties do CSS em `:root`, com um bloco de override `body.dark` para o modo escuro (alternado pelo JS, persistido em `localStorage`).

### Modelo de estado

Todo o estado vive em variáveis `let` no nível do módulo em `catalogo.js` e é persistido em `localStorage`:
- `carrinho` — array de IDs de produtos, chave `carrinho`
- `favoritos` — array de IDs de produtos, chave `favoritos`
- modo escuro — flag booleana, chave `darkMode`

Não há biblioteca de gerenciamento de estado — toda mutação (`toggleCarrinho`, alternar favorito, etc.) altera diretamente esses arrays, grava no `localStorage` e então chama `renderGrid()` / `atualizarBarra()` para re-renderizar as seções afetadas do DOM. A renderização é feita via substituição completa do `innerHTML` dos elementos container (grid, filtros, itens do modal), não por diffing incremental do DOM.

### Fluxos principais

- **Filtragem**: categoria (`filtroAtivo`), preço máximo (`filtroPrecoDe`) e apenas-favoritos (`mostrarFavoritos`) são combinados em `renderGrid()`.
- **Fluxo de pedido**: carrinho → `abrirModal()` monta um resumo do pedido (`gerarTexto`) → o usuário copia o texto ou clica para ir direto ao `wa.me/<WHATSAPP>?text=...` e enviar o pedido via WhatsApp. Não há backend; o WhatsApp é o mecanismo de checkout.
- **Carrossel do banner**: os dados dos slides estão fixos (hardcoded) dentro de `initBanner()` em `catalogo.js` (não estão em `produtos.json`).

## Painel administrativo (exceção documentada)

Existe um painel para cadastrar/editar/excluir produtos por formulário (em vez de editar `produtos.json` manualmente), incluindo upload de foto. Ele é uma peça **separada e adicional**, não faz parte do que o cliente carrega no navegador, e não muda a regra acima: o site continua 100% estático.

- `admin-<slug-aleatório>.html`, `js/admin.js`, `css/admin.css` — UI do painel. Não compartilha código com `catalogo.js` (nenhum módulo comum além de duplicar `formatBRL()`, propositalmente — ver README/histórico do plano). A URL real do arquivo `admin-*.html` é secreta e não deve ser citada em nenhum arquivo versionado (é a única proteção de acesso — não há login).
- `functions/` — código-fonte de Cloudflare Pages Functions, publicado como um **projeto Cloudflare Pages separado** (não faz parte do deploy do GitHub Pages, que ignora essa pasta). É a única parte do projeto com "servidor": guarda um GitHub token em variável de ambiente secreta (`GH_TOKEN`, nunca exposto ao navegador) e usa a API de Contents do GitHub para ler/gravar `produtos.json` e arquivos em `uploads/` via commits reais em `main`. Rotas: `GET/POST /api/produtos`, `PUT/DELETE /api/produtos/:id`, `POST /api/upload`. CORS restrito à origem do GitHub Pages.
- Cada gravação pelo painel é um commit de verdade em `main`, que dispara o workflow de deploy do GitHub Pages normalmente (~30-90s de propagação até o site público refletir a mudança).
- Sem tela de login/senha/PIN por decisão explícita — a única proteção é a URL obscura da página admin (risco residual aceito e documentado).

## Convenções de edição (do README.md)

- `produtos.json` é o ponto de edição pretendido para gerenciar produtos manualmente (adicionar/remover/marcar esgotado via `disponivel`, alterar preço/foto), ou via o painel administrativo (ver seção acima) — as duas formas escrevem no mesmo arquivo.
- O número do WhatsApp é configurado no topo de `js/catalogo.js` como `const WHATSAPP = "..."` (formato: código do país + DDD + número, sem símbolos).
- `index.html`, `css/style.css`, `admin-*.html`, `js/admin.js`, `css/admin.css` e `functions/` são indicados como não destinados a edição rotineira pela dona do catálogo, mas estão liberados para trabalho de novas funcionalidades.
- Preços no JSON usam `.` como separador decimal (ex.: `89.90`); a formatação de moeda para exibição é feita por `formatBRL()` via `toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`.
- Textos da interface, dados de produtos e comentários estão em português (pt-BR); mantenha novas strings voltadas ao usuário consistentes com isso.
