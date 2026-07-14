import { putBase64File } from "../_lib/github.js";
import { jsonResponse, errorResponse } from "../_lib/http.js";

const MAX_BYTES = 900 * 1024; // margem abaixo do limite prático de ~1MB da Contents API

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { filename, contentBase64, contentType } = body || {};
    if (!filename || !contentBase64) return errorResponse("Arquivo ausente.", 400);
    if (!/^image\//.test(contentType || "")) return errorResponse("Tipo de arquivo inválido.", 400);

    const tamanhoBytes = Math.ceil((contentBase64.length * 3) / 4);
    if (tamanhoBytes > MAX_BYTES) return errorResponse("Foto muito grande, tente novamente.", 413);

    const ext = extensaoPorTipo(contentType);
    const base = slugify(filename.replace(/\.[^.]+$/, ""));
    const path = `uploads/${base}-${Date.now().toString(36)}.${ext}`;

    let res = await putBase64File(context.env, path, contentBase64, `Admin: envia imagem ${path}`);

    if (!res.ok && (res.status === 409 || res.status === 422)) {
      const pathAlternativo = `uploads/${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      res = await putBase64File(context.env, pathAlternativo, contentBase64, `Admin: envia imagem ${pathAlternativo}`);
      if (res.ok) return jsonResponse({ path: pathAlternativo }, 201);
    }

    if (!res.ok) {
      const errBody = await res.text();
      return errorResponse(`Falha ao enviar imagem (status ${res.status}): ${errBody}`, 500);
    }

    return jsonResponse({ path }, 201);
  } catch (e) {
    return errorResponse(e.message, 500);
  }
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
