---
description: Cria um commit local com as alterações pendentes deste repositório
---

Crie um commit git local para as alterações pendentes neste repositório, seguindo o fluxo padrão de commit:

1. Rode em paralelo: `git status`, `git diff` (staged e unstaged) e `git log --oneline -10` para entender o que mudou e o estilo de mensagens usado no repo.
2. Se não houver nada para commitar, avise e pare.
3. Adicione por nome os arquivos relevantes (nunca `git add -A`/`.` sem revisar) e confira se não há nada sensível (.env, credenciais) sendo incluído.
4. Escreva uma mensagem de commit concisa (1-2 frases) focada no "porquê" da mudança, seguindo o estilo dos commits recentes.
5. Crie o commit incluindo a assinatura:

   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>

6. Rode `git status` depois para confirmar que o commit foi criado.

Não faça push — isso é feito apenas com `/push`.
