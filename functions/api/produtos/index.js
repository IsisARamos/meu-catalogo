import { getJSONFile, updateProdutos } from "../../_lib/github.js";
import { jsonResponse, errorResponse } from "../../_lib/http.js";
import { validarProduto, normalizarProduto } from "../../_lib/validate.js";

export async function onRequestGet(context) {
  try {
    const { json } = await getJSONFile(context.env, "produtos.json");
    return jsonResponse(json);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const erro = validarProduto(body);
    if (erro) return errorResponse(erro, 400);

    const retorno = await updateProdutos(
      context.env,
      (produtos) => {
        const novoId = produtos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        const novoProduto = normalizarProduto(body, novoId);
        return { produtos: [...produtos, novoProduto], retorno: novoProduto };
      },
      `Admin: adiciona produto "${body.nome}"`
    );

    return jsonResponse(retorno, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
