import { updateProdutos } from "../../_lib/github.js";
import { jsonResponse, errorResponse } from "../../_lib/http.js";
import { validarProduto, normalizarProduto } from "../../_lib/validate.js";

export async function onRequestPut(context) {
  const id = Number(context.params.id);
  if (!Number.isInteger(id)) return errorResponse("Id inválido.", 400);

  try {
    const body = await context.request.json();
    const erro = validarProduto(body);
    if (erro) return errorResponse(erro, 400);

    let encontrado = false;
    const retorno = await updateProdutos(
      context.env,
      (produtos) => {
        const novaLista = produtos.map((p) => {
          if (p.id !== id) return p;
          encontrado = true;
          return normalizarProduto(body, id);
        });
        return { produtos: novaLista, retorno: novaLista.find((p) => p.id === id) };
      },
      `Admin: edita produto #${id}`
    );

    if (!encontrado) return errorResponse("Produto não encontrado.", 404);
    return jsonResponse(retorno);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}

export async function onRequestDelete(context) {
  const id = Number(context.params.id);
  if (!Number.isInteger(id)) return errorResponse("Id inválido.", 400);

  try {
    let encontrado = false;
    await updateProdutos(
      context.env,
      (produtos) => {
        encontrado = produtos.some((p) => p.id === id);
        return { produtos: produtos.filter((p) => p.id !== id), retorno: null };
      },
      `Admin: remove produto #${id}`
    );

    if (!encontrado) return errorResponse("Produto não encontrado.", 404);
    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
