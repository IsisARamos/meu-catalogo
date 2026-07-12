---
description: Sincroniza este repositório com o remoto no GitHub (commit se necessário + push)
---

Sincronize este repositório local com o remoto (`origin`) no GitHub:

1. Rode `git status` e `git branch -vv` para ver a branch atual, se ela rastreia um remoto, e se há alterações pendentes.
2. Se houver alterações não commitadas, siga o mesmo fluxo do comando `/commit` para criar um commit antes de continuar (peça confirmação se não estiver claro o que deve entrar no commit).
3. Rode `git fetch origin` e verifique se a branch local está atrás/à frente do remoto (`git status` já mostra isso após o fetch).
   - Se estiver atrás, avise o usuário e pergunte se deve fazer `git pull`/rebase antes de enviar, em vez de sobrescrever nada.
4. Rode `git push` (ou `git push -u origin <branch>` se a branch ainda não tiver upstream configurado).
5. Confirme o resultado com `git status` e mostre o link do repositório atualizado se fizer sentido.

Nunca use `--force` a menos que o usuário peça explicitamente.
