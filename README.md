# Ísis IA v9.9.0 — pacote de desenvolvimento

## Novidades incluídas
- Identidade Ísis e preservação das chaves locais da Maxi, para manter conversas antigas.
- Assistente de uso geral, apoio emocional opcional.
- Três modos de inteligência: Instantâneo, Pensativo e Aprender, com configurações de resposta distintas. O modo NÃO garante poder de raciocínio diferente com o mesmo modelo.
- Antigos estilos do chat (as "Emoções").
- Temas da v9.8, incluindo Vermelho/Preto, Verde/Preto, Rosa/Roxo, Azul/Roxo, Azul/Verde, Laranja/Amarelo, Preto/Dourado, Arco-Íris.
- Busca no histórico, nome inicial da pessoa, configurações de como a assistente fala, recursos de histórico, modo privado experimental, controles de regeneração.
- Nome automático de conversas por assunto: regra local aproximada; não garante títulos perfeitos ou classificação por IA.
- Botão ☰ Modos no cabeçalho para acesso rápido aos três modos.
- Página de comparação dos planos Go, Plus e Pro Max: Go R$ 9,90, Plus R$ 19,90, Pro Max R$ 39,90 por mês (preços propostos, **não estão à venda**).
- Ícone da Ísis mantido da v9.8.

## API de texto
- Backend configurável via OpenRouter, sem obrigação de usar OpenAI.
- Em Vercel > Settings > Environment Variables: `OPENROUTER_API_KEY`, `ISIS_MODEL_GO` (identificador completo do modelo no OpenRouter, por exemplo o escolhido pelo responsável), opcionalmente `ISIS_SITE_URL`.
- Alguns modelos do OpenRouter têm variantes gratuitas com limites, que podem ser descontinuadas. Não há garantia de gratuidade, disponibilidade ou qualidade: confira na plataforma antes de definir o modelo. **NÃO** publique uma chave de API em HTML ou GitHub.
- Os três modos geram comportamentos diferentes no prompt e no limite de resposta. Todos usam, por enquanto, o modelo configurado em `ISIS_MODEL_GO`.

## Planos e Banco Max
- Os três botões "Mudar para..." são **demonstração sem pagamento**, não ativam recursos ou assinatura. Banco Max fictício **não está integrado**.
- Modelos Plus e Pro Max precisam de autenticação e de verificação de assinatura no backend. Nunca aceite escolha livre do plano enviada pelo navegador.
- Uma futura integração com Banco Max precisará de transação identificada, autenticação, webhook ou confirmação servidor-a-servidor, verificação de duplicidade, validade da assinatura, cancelamento e renovação. Como Banco Max é simulado, não anuncie pagamento com dinheiro real.

## Imagens
- Geração via endpoint `/api/image` está preparada para provedor externo compatível com OpenAI images/generations. Configure `ISIS_IMAGE_API_KEY`, `ISIS_IMAGE_API_URL` (URL HTTPS do endpoint do provedor) e opcional `ISIS_IMAGE_MODEL`.
- Sem credenciais, retorna erro claro; não cria imagens automaticamente nem cobra. Melhor qualidade depende do provedor escolhido.

## Atenção / produção
- Teste numa cópia do repositório antes de substituir o site em produção.
- Fluxos e interface foram verificados sintaticamente, não testados em um navegador com API real neste pacote.
- Não há contas, autorização, cobrança real, cotas seguras ou proteção de API contra abuso. Configure autenticação e rate limiting no servidor antes de abrir ao público.
- O modo privado experimental não é anonimato: serviços terceiros podem processar as mensagens e dados antigos permanecem no navegador.
- O filtro de ofensas é heurístico e pode falhar. Ajuste-o com testes, evitando bloquear pessoas em situação de sofrimento.
