import { getJSONFile, updateProdutos } from "./lib/github.js";
import { jsonResponse, errorResponse } from "./lib/http.js";
import { validarProduto, normalizarProduto } from "./lib/validate.js";

const ALLOWED_ORIGIN = "https://isisaramos.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function comCors(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (pathname === "/api/produtos") {
        if (request.method === "GET") return comCors(await listarProdutos(env));
        if (request.method === "POST") return comCors(await criarProduto(request, env));
      }

      const matchId = pathname.match(/^\/api\/produtos\/(\d+)$/);
      if (matchId) {
        const id = Number(matchId[1]);
        if (request.method === "PUT") return comCors(await editarProduto(request, env, id));
        if (request.method === "DELETE") return comCors(await excluirProduto(env, id));
      }

    } catch (e) {
      return comCors(errorResponse(e.message, 500));
    }

    return comCors(errorResponse("Rota não encontrada.", 404));
  },
};

async function listarProdutos(env) {
  const { json } = await getJSONFile(env, "produtos.json");
  return jsonResponse(json);
}

async function criarProduto(request, env) {
  const body = await request.json();
  const erro = validarProduto(body);
  if (erro) return errorResponse(erro, 400);

  const retorno = await updateProdutos(
    env,
    (produtos) => {
      const novoId = produtos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      const novoProduto = normalizarProduto(body, novoId);
      return { produtos: [...produtos, novoProduto], retorno: novoProduto };
    },
    `Admin: adiciona produto "${body.nome}"`
  );

  return jsonResponse(retorno, 201);
}

async function editarProduto(request, env, id) {
  const body = await request.json();
  const erro = validarProduto(body);
  if (erro) return errorResponse(erro, 400);

  let encontrado = false;
  const retorno = await updateProdutos(
    env,
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
}

async function excluirProduto(env, id) {
  let encontrado = false;
  await updateProdutos(
    env,
    (produtos) => {
      encontrado = produtos.some((p) => p.id === id);
      return { produtos: produtos.filter((p) => p.id !== id), retorno: null };
    },
    `Admin: remove produto #${id}`
  );

  if (!encontrado) return errorResponse("Produto não encontrado.", 404);
  return jsonResponse({ ok: true });
}

