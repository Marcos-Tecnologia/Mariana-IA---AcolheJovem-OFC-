# Ísis IA v10.0.0 — atualização de frontend e integração Banco Max

## Instalação
1. Faça **backup** do repositório Ísis atual e da implantação atual do Banco Max antes de mudar qualquer arquivo.
2. Instale a pasta `Isis_IA_v10` no repositório da Ísis, mantendo a estrutura `api/`, `lib/`, `assets/` e os arquivos na raiz.
3. A pasta `Banco_Max_v1.4.2_integracao_Isis` é uma atualização do **código** do Banco Max. Implante-a no repositório do Banco Max **com o mesmo DATABASE_URL do Banco Max atual**, para conservar contas, saldos e histórico. Não crie um novo banco e não execute comandos que apaguem os dados.
4. Na Vercel do Banco Max, mantenha `DATABASE_URL` e configure `ISIS_BANK_SHARED_SECRET` (uma string aleatória com 32 caracteres ou mais) e `ISIS_MERCHANT_KEY` (a chave fictícia da empresa Ísis criada pelo administrador no Banco Max).
5. Na Vercel da Ísis, configure `BANK_MAX_API_URL` como URL HTTPS do endpoint do Banco Max, incluindo `/api` ou `/api/index` conforme sua implantação, `ISIS_BANK_SHARED_SECRET` com o **mesmo valor** do Banco Max, e `ISIS_SESSION_SECRET` com outro segredo aleatório com 32 caracteres ou mais.
6. Configure `OPENROUTER_API_KEY` e `ISIS_MODEL_FREE` para o modelo de IA disponível; opcionalmente `ISIS_MODEL_GO`, `ISIS_MODEL_PLUS` e `ISIS_MODEL_PRO_MAX` com identificadores válidos do OpenRouter. A cobrança de provedor de IA é distinta do saldo fictício do Banco Max.
7. Geração de imagens: configure `ISIS_IMAGE_API_KEY`, `ISIS_IMAGE_API_URL` (endpoint HTTPS compatível com geração de imagens) e `ISIS_IMAGE_MODEL`. Sem isso, o recurso exibirá erro informativo; não prometer imagem gerada.
8. Faça **deploy de teste** nas duas aplicações antes de atualizar as oficiais. Faça login de teste no Banco Max e depois na Ísis; teste saldo insuficiente, chave inexistente, pagamento repetido, renovação e vencimento.

## Fluxos implementados
- Interface Ísis reorganizada: apenas o botão ☰ original; Instantâneo, Pensativo e Aprender no seletor discreto do cabeçalho; personalização única nas configurações.
- Perfil e sessões da Ísis usam conta Banco Max via backend: a senha é enviada por HTTPS ao backend da Ísis e ao Banco Max, mas não é gravada no `localStorage` pela Ísis. A sessão é armazenada em cookie HttpOnly protegido com AES-GCM, com segredo de servidor.
- O Banco Max processa o débito em **saldo fictício**, produz transação e comprovante, e atualiza o plano por 30 dias. O débito exige confirmação explícita do titular e uma chave de empresa cadastrada no Banco Max.
- O backend da Ísis consulta o plano no servidor do Banco Max para escolher o modelo permitido; nunca aceita o plano passado pelo navegador como evidência de assinatura.
- Temas antigos e os oito novos temas; memória local preservada via chaves anteriores.
- Marca d’água original do Banco Max: **IEAS** (mantida). O texto “IEAS” na Ísis é identificação discreta na área de conexão, não a marca d’água principal do Banco Max.

## Limitações — não considere integração de produção validada ainda
- Testados automaticamente: sintaxe JavaScript; IDs HTML únicos; posição dos modos; botões principais; presença dos temas e endpoints.
- **Não foi possível executar testes de ponta a ponta no navegador e na Vercel nem efetuar pagamentos em um Banco Max real** a partir deste ambiente. É necessária implantação de teste.
- Os limites exatos de mensagens e imagem por plano ainda não são medidos e impostos no backend; não anuncie cotas ou serviços ilimitados. Modelos separados dependem de variáveis e disponibilidade.
- Imagens dependem de API externa; qualidade e compatibilidade variam conforme o provedor.
- O acesso livre ao endpoint de chat precisa de rate limiting e medidas antiabuso antes de publicação em massa.
- A mesma conta é usada mediante login nas duas aplicações; não há login único automático entre domínios sem intervenção.
- Os planos são **simulados**, não envolvem dinheiro real. Os valores R$ 9,90, R$ 19,90, R$ 39,90 representam unidades de saldo fictício.

## Segurança
- Não publique arquivos `.env` reais, segredos ou tokens no GitHub.
- Use senhas próprias para contas de teste e repositórios privados quando possível.
- Banco Max: mantenha backups do Postgres e faça teste de migração primeiro.
- Não copie tokens para frontend nem confie na seleção de plano enviada pelo navegador.
