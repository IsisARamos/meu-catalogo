const API = "https://api.github.com";

function ghHeaders(env) {
  return {
    "Authorization": `Bearer ${env.GH_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "use-isis-admin",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function decodeBase64(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function getJSONFile(env, path) {
  const url = `${API}/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path}?ref=${env.GH_BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(env) });
  if (!res.ok) throw new Error(`Falha ao ler ${path} (status ${res.status})`);
  const data = await res.json();
  return { json: JSON.parse(decodeBase64(data.content)), sha: data.sha };
}

export async function putFile(env, path, contentStr, sha, message) {
  const url = `${API}/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path}`;
  const body = { message, content: encodeBase64(contentStr), branch: env.GH_BRANCH };
  if (sha) body.sha = sha;
  return fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function putBase64File(env, path, base64Content, message) {
  const url = `${API}/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path}`;
  return fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: base64Content, branch: env.GH_BRANCH }),
  });
}

/**
 * Ciclo leitura-modificação-escrita de produtos.json com retry em caso de
 * conflito de sha (duas edições quase simultâneas).
 * mutateFn(produtos) deve retornar { produtos: novaLista, retorno: qualquerCoisa }.
 */
export async function updateProdutos(env, mutateFn, commitMessage) {
  const MAX_TENTATIVAS = 3;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const { json: produtos, sha } = await getJSONFile(env, "produtos.json");
    const { produtos: novaLista, retorno } = mutateFn(produtos);
    const novoConteudo = JSON.stringify(novaLista, null, 2) + "\n";
    const res = await putFile(env, "produtos.json", novoConteudo, sha, commitMessage);
    if (res.ok) return retorno;
    if (res.status === 409 && tentativa < MAX_TENTATIVAS) continue;
    const errBody = await res.text();
    throw new Error(`Falha ao salvar produtos.json (status ${res.status}): ${errBody}`);
  }
}
