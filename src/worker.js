import { getJSONFile, updateProdutos, putBase64File } from "./lib/github.js";
import { jsonResponse, errorResponse } from "./lib/http.js";
import { validarProduto, normalizarProduto } from "./lib/validate.js";

const ALLOWED_ORIGIN = "https://isisaramos.github.io";
const MAX_UPLOAD_BYTES = 900 * 1024; // margem abaixo do limite prático de ~1MB da Contents API

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

      if (pathname === "/api/upload" && request.method === "POST") {
        return comCors(await enviarImagem(request, env));
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

async function enviarImagem(request, env) {
  const body = await request.json();
  const { filename, contentBase64, contentType } = body || {};
  if (!filename || !contentBase64) return errorResponse("Arquivo ausente.", 400);
  if (!/^image\//.test(contentType || "")) return errorResponse("Tipo de arquivo inválido.", 400);

  const tamanhoBytes = Math.ceil((contentBase64.length * 3) / 4);
  if (tamanhoBytes > MAX_UPLOAD_BYTES) return errorResponse("Foto muito grande, tente novamente.", 413);

  const ext = extensaoPorTipo(contentType);
  const base = slugify(filename.replace(/\.[^.]+$/, ""));
  const path = `uploads/${base}-${Date.now().toString(36)}.${ext}`;

  let res = await putBase64File(env, path, contentBase64, `Admin: envia imagem ${path}`);

  if (!res.ok && (res.status === 409 || res.status === 422)) {
    const pathAlternativo = `uploads/${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    res = await putBase64File(env, pathAlternativo, contentBase64, `Admin: envia imagem ${pathAlternativo}`);
    if (res.ok) return jsonResponse({ path: pathAlternativo }, 201);
  }

  if (!res.ok) {
    const errBody = await res.text();
    return errorResponse(`Falha ao enviar imagem (status ${res.status}): ${errBody}`, 500);
  }

  return jsonResponse({ path }, 201);
}

function extensaoPorTipo(contentType) {
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/png") return "png";
  return "jpg";
}

const DIACRITICOS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g"
);

function slugify(str) {
  return (
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(DIACRITICOS, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "foto"
  );
}
