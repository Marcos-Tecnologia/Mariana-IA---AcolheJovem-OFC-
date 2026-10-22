GABARITA V1.9.1 — LICENCIAMENTO

O scanner e a correção da V1.8.4 foram preservados.

NOVO
- Ativação por e-mail + chave de licença.
- Uma instalação do navegador por licença.
- Validação via Vercel Function + Neon/Postgres.
- Tolerância offline de 7 dias após a última validação online.
- Painel em /admin para gerar, bloquear, reativar, revogar e liberar dispositivo.
- A chave completa só é exibida quando é criada; no banco fica apenas o hash.

CONFIGURAÇÃO
1. Crie um banco Neon.
2. Abra o SQL Editor do Neon e execute schema.sql.
3. No projeto da Vercel configure as variáveis:
   DATABASE_URL
   ADMIN_USER
   ADMIN_PASSWORD
   ADMIN_SECRET
4. Faça deploy de todos os arquivos do ZIP.
5. Abra https://SEU-DOMINIO/admin/ e entre com ADMIN_USER e ADMIN_PASSWORD.
6. Gere uma licença informando o e-mail do professor.
7. Copie a chave exibida e entregue ao professor junto com o e-mail usado.

REGRAS
- A licença não expira por padrão (pagamento único).
- BLOCKED: bloqueio reversível.
- REVOKED: licença revogada; pode ser reativada no painel se desejado.
- Liberar dispositivo remove o vínculo atual e permite nova ativação.
- O professor pode usar o app offline por até 7 dias após uma validação online bem-sucedida.

SEGURANÇA
- DATABASE_URL e credenciais de Admin ficam somente nas variáveis de ambiente da Vercel.
- O navegador nunca recebe a senha do banco.
- As chaves são armazenadas no banco como SHA-256; o painel mostra a chave completa somente na criação.
