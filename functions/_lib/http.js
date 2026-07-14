export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(mensagem, status = 400) {
  return jsonResponse({ erro: mensagem }, status);
}
