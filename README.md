# Ísis IA v9.8.0 — Protótipo funcional

## O que há
- IA de uso geral, com apoio emocional opcional.
- Instantâneo, Pensativo e Aprender (backend escolhe modelos/configurações distintas).
- Emoções Objetiva, Acolhedora e Divertida.
- Onboarding por nome, estilo personalizado com filtro simples, pesquisa de conversas.
- Oito temas novos sem substituir a base CSS.
- Geração de imagem via OpenAI (API real, requer créditos de API), ícone.
- Botões para alternativa de resposta, reaproveitar texto, controles locais de memória/privacidade.
- Planos Go / Plus / Pro Max como **prévia visual**, sem autenticação, cobrança, privilégio ou limites implementados. Não há venda real.

## Instalação
1. Coloque a pasta no repositório Vercel (root directory correspondente).
2. Defina `OPENAI_API_KEY` nas variáveis de ambiente **da Vercel**, nunca no JavaScript/HTML.
3. Opcional: `ISIS_MODEL_INSTANT=gpt-4.1-mini`, `ISIS_MODEL_THINK=gpt-5-mini`, `ISIS_IMAGE_MODEL=gpt-image-1-mini`.
4. Faça deploy. Recursos OpenAI dependem de uma conta API com créditos e acesso aos modelos.

## Limitações importantes
- O modo privado evita novos salvamentos feitos no fluxo principal; **não é anonimato**: o provedor de API ainda processa mensagens, e outros dados podem continuar em armazenamento local. Não use isso para prometer sigilo absoluto.
- Botão "Reaproveitar mensagem" coloca a mensagem no editor; não reescreve histórico.
- Resumo da conversa é um extrato local, não síntese semântica garantida.
- Bloqueio de agressões é heurístico e local, não mecanismo de segurança robusto.
- Personalização do tom não desliga os filtros de segurança.
- Ícones e imagens são protegidos pelo mecanismo da API. Não incluir chave secreta em repositório.
- A API é pública enquanto não houver autenticação e limite por usuário; **não publique um serviço aberto com sua chave antes de configurar autenticação, limites/rate limiting e controles de custo na Vercel**.
- Para privacidade, configure também retenção e política de dados de produção.
- Os recursos antigos seguem preservados sempre que possível. Teste antes de substituir o site em produção.
