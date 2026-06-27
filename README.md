# 🛍️ Catálogo Digital

Catálogo simples para venda de produtos femininos via WhatsApp.

---

## 📁 Estrutura de arquivos

```
catalogo/
├── index.html        ← página do catálogo (não editar)
├── produtos.json     ← 👈 EDITE AQUI para gerenciar produtos
├── css/style.css     ← estilos (não editar)
└── js/catalogo.js    ← lógica (só editar o número de WhatsApp)
```

---

## ✏️ Como editar os produtos

Abra o arquivo **`produtos.json`** com qualquer editor de texto (Bloco de Notas, VS Code, etc).

Cada produto tem este formato:

```json
{
  "id": 1,
  "nome": "Nome do Produto",
  "categoria": "Vestidos",
  "preco": 89.90,
  "descricao": "Descrição curta do produto",
  "disponivel": true,
  "imagem": "https://link-da-foto.jpg"
}
```

### Ações comuns

| O que fazer | Como fazer |
|---|---|
| **Adicionar produto** | Copie um bloco `{ ... }` e cole no final (antes do `]`), separado por vírgula |
| **Remover produto** | Delete o bloco `{ ... }` inteiro do produto |
| **Marcar esgotado** | Mude `"disponivel": true` para `"disponivel": false` |
| **Repor produto** | Mude `"disponivel": false` para `"disponivel": true` |
| **Alterar preço** | Edite o valor em `"preco"` (use ponto, não vírgula: `89.90`) |
| **Trocar foto** | Substitua o link em `"imagem"` pela URL da nova foto |

### Dicas para fotos
- Use Google Fotos, Imgur, ou qualquer serviço de hospedagem de imagens
- Copie o link direto da imagem (termina em `.jpg`, `.png`, `.webp`)
- Fotos com proporção **4:5** (retrato) ficam mais bonitas

---

## 📱 Como configurar seu número de WhatsApp

Abra **`js/catalogo.js`** e edite a primeira linha:

```js
const WHATSAPP = "5551999999999"; // 55 + DDD + número
```

Exemplo: número `(51) 99999-1234` → `"5551999991234"`

---

## 🌐 Como publicar no GitHub Pages (grátis)

1. Crie uma conta em [github.com](https://github.com)
2. Crie um novo repositório (pode ser privado ou público)
3. Suba todos os arquivos desta pasta
4. Vá em **Settings → Pages → Source → main branch → / (root)**
5. Aguarde alguns minutos — seu catálogo estará em:
   `https://seu-usuario.github.io/nome-do-repositorio`

---

## 🔗 Compartilhando no WhatsApp

Basta enviar o link do catálogo para as clientes!  
Elas poderão selecionar os produtos e o pedido será gerado automaticamente para você.
