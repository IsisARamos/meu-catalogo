export function validarProduto(body) {
  if (!body || typeof body !== "object") return "Corpo da requisição inválido.";
  if (!body.nome || !body.nome.trim()) return "Nome é obrigatório.";
  if (!body.categoria || !body.categoria.trim()) return "Categoria é obrigatória.";
  if (body.preco === undefined || isNaN(Number(body.preco)) || Number(body.preco) < 0) return "Preço inválido.";
  if (!body.imagem || !body.imagem.trim()) return "Imagem é obrigatória.";
  return null;
}

export function normalizarProduto(body, id) {
  return {
    id,
    nome: body.nome.trim(),
    categoria: body.categoria.trim(),
    preco: Number(body.preco),
    descricao: (body.descricao || "").trim(),
    disponivel: !!body.disponivel,
    imagem: body.imagem.trim(),
  };
}
