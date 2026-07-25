/* =========================================================
   MAXI IA — API CHAT
   VERSÃO 9.6.1

   Caminho: /api/chat.js
   Plataforma: Vercel Serverless Function

   Variáveis obrigatórias:
   - OPENROUTER_API_KEY
   - OPENROUTER_MODEL
========================================================= */

const MAXI_API_VERSION = "9.6.1";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/* =========================================================
   LIMITES
========================================================= */

const MAX_MESSAGES = 50;

const MAX_SYSTEM_MESSAGES = 8;

const MAX_MESSAGE_LENGTH = 12000;

const MAX_TOTAL_CHARACTERS = 80000;

const MAX_OUTPUT_TOKENS = 1400;

/*
  Cada tentativa pode durar até 45 segundos.
*/
const REQUEST_TIMEOUT_MS = 45000;

/*
  Tentativa inicial + 2 novas tentativas.
*/
const MAX_OPENROUTER_ATTEMPTS = 3;

const DEFAULT_RETRY_DELAY_MS = 1200;

const MAX_RETRY_DELAY_MS = 5000;

const ALLOWED_ROLES = new Set([
  "system",
  "user",
  "assistant"
]);

/*
  Erros temporários que podem ser resolvidos
  tentando novamente.
*/
const RETRYABLE_STATUS = new Set([
  408,
  409,
  429,
  500,
  502,
  503,
  504
]);

/* =========================================================
   CORS
========================================================= */

function aplicarCors(res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader(
    "Access-Control-Max-Age",
    "86400"
  );
}

/* =========================================================
   RESPOSTAS JSON
========================================================= */

function responderJson(
  res,
  status,
  dados
) {
  return res.status(status).json({
    version: MAXI_API_VERSION,
    ...dados
  });
}

function responderErro(
  res,
  status,
  mensagem,
  codigo = "UNKNOWN_ERROR",
  detalhes
) {
  const payload = {
    error: {
      code: codigo,
      message: mensagem
    }
  };

  /*
    Detalhes internos não são mostrados
    no ambiente de produção.
  */
  if (
    detalhes &&
    process.env.NODE_ENV !== "production"
  ) {
    payload.error.details = detalhes;
  }

  return responderJson(
    res,
    status,
    payload
  );
}

/* =========================================================
   NORMALIZAÇÃO DE TEXTO
========================================================= */

function normalizarTexto(texto) {
  return String(texto ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/* =========================================================
   LIMPEZA DA RESPOSTA
========================================================= */

function limparRespostaIA(texto) {
  let resposta =
    normalizarTexto(texto);

  resposta = resposta
    .replace(
      /<think>[\s\S]*?<\/think>/gi,
      ""
    )
    .replace(
      /<analysis>[\s\S]*?<\/analysis>/gi,
      ""
    )
    .replace(
      /<reasoning>[\s\S]*?<\/reasoning>/gi,
      ""
    )
    .replace(
      /<reflection>[\s\S]*?<\/reflection>/gi,
      ""
    )
    .replace(
      /```(?:analysis|reasoning|think)[\s\S]*?```/gi,
      ""
    )
    .replace(
      /<\/?(?:think|analysis|reasoning|reflection)>/gi,
      ""
    )
    .replace(
      /^\s*(?:assistant|assistente|maxi)\s*:\s*/i,
      ""
    );

  return normalizarTexto(resposta);
}

/* =========================================================
   VALIDAÇÃO DAS MENSAGENS
========================================================= */

function validarMensagens(
  mensagensRecebidas
) {
  if (
    !Array.isArray(
      mensagensRecebidas
    )
  ) {
    return {
      validas: false,
      erro:
        "O campo messages precisa ser uma lista."
    };
  }

  if (
    mensagensRecebidas.length === 0
  ) {
    return {
      validas: false,
      erro:
        "Nenhuma mensagem foi enviada."
    };
  }

  /*
    Mantém as primeiras mensagens de sistema,
    pois normalmente contêm as regras da Maxi.
  */
  const sistemas =
    mensagensRecebidas
      .filter(
        (mensagem) =>
          mensagem?.role === "system"
      )
      .slice(
        0,
        MAX_SYSTEM_MESSAGES
      );

  /*
    Mantém a parte mais recente da conversa.
  */
  const conversa =
    mensagensRecebidas.filter(
      (mensagem) =>
        mensagem?.role !== "system"
    );

  const limiteConversa =
    Math.max(
      1,
      MAX_MESSAGES -
        sistemas.length
    );

  const selecionadas = [
    ...sistemas,
    ...conversa.slice(
      -limiteConversa
    )
  ];

  const mensagens = [];

  let caracteresTotais = 0;

  for (
    const mensagem
    of selecionadas
  ) {
    if (
      !mensagem ||
      typeof mensagem !== "object"
    ) {
      continue;
    }

    const role =
      String(
        mensagem.role ?? ""
      ).trim();

    if (
      !ALLOWED_ROLES.has(role)
    ) {
      continue;
    }

    let content =
      normalizarTexto(
        mensagem.content
      );

    if (!content) {
      continue;
    }

    content =
      content.slice(
        0,
        MAX_MESSAGE_LENGTH
      );

    const espacoRestante =
      MAX_TOTAL_CHARACTERS -
      caracteresTotais;

    if (
      espacoRestante <= 0
    ) {
      break;
    }

    if (
      content.length >
      espacoRestante
    ) {
      content =
        content.slice(
          0,
          espacoRestante
        );
    }

    if (!content) {
      break;
    }

    mensagens.push({
      role,
      content
    });

    caracteresTotais +=
      content.length;
  }

  if (
    mensagens.length === 0
  ) {
    return {
      validas: false,
      erro:
        "Nenhuma mensagem válida foi encontrada."
    };
  }

  const possuiMensagemUsuario =
    mensagens.some(
      (mensagem) =>
        mensagem.role === "user"
    );

  if (!possuiMensagemUsuario) {
    return {
      validas: false,
      erro:
        "É necessária pelo menos uma mensagem do usuário."
    };
  }

  return {
    validas: true,
    mensagens
  };
}

/* =========================================================
   EXTRAÇÃO DA RESPOSTA
========================================================= */

function extrairConteudoOpenRouter(
  dados
) {
  const conteudo =
    dados?.choices?.[0]
      ?.message?.content;

  if (
    typeof conteudo === "string"
  ) {
    return limparRespostaIA(
      conteudo
    );
  }

  /*
    Alguns modelos podem retornar
    o conteúdo dividido em partes.
  */
  if (
    Array.isArray(conteudo)
  ) {
    const texto =
      conteudo
        .map((parte) => {
          if (
            typeof parte === "string"
          ) {
            return parte;
          }

          return (
            parte?.text ||
            parte?.content ||
            ""
          );
        })
        .filter(Boolean)
        .join("\n");

    return limparRespostaIA(
      texto
    );
  }

  /*
    Compatibilidade com outros formatos.
  */
  const textoAlternativo =
    dados?.choices?.[0]?.text;

  if (
    typeof textoAlternativo ===
    "string"
  ) {
    return limparRespostaIA(
      textoAlternativo
    );
  }

  return "";
}

/* =========================================================
   EXTRAÇÃO DE ERROS
========================================================= */

function extrairErroOpenRouter(
  dados,
  status
) {
  return normalizarTexto(
    dados?.error?.message ||
      dados?.error
        ?.metadata?.raw ||
      dados?.message ||
      `Erro ${status} no OpenRouter.`
  );
}

/* =========================================================
   VARIÁVEIS DE AMBIENTE
========================================================= */

function obterChaveOpenRouter() {
  return String(
    process.env
      .OPENROUTER_API_KEY ||
      ""
  ).trim();
}

function obterModeloPrincipal() {
  return String(
    process.env
      .OPENROUTER_MODEL ||
      ""
  ).trim();
}

/* =========================================================
   ROTEAMENTO E FALLBACK
========================================================= */

function obterModelosDeRoteamento() {
  const principal =
    obterModeloPrincipal();

  /*
    O primeiro modelo é exatamente o modelo
    configurado em OPENROUTER_MODEL.

    Se ele estiver temporariamente indisponível,
    o OpenRouter poderá usar seu roteador gratuito.
  */
  const modelos = [
    principal,
    "openrouter/free"
  ].filter(Boolean);

  /*
    Remove modelos repetidos.
  */
  return [
    ...new Set(modelos)
  ];
}

/* =========================================================
   CABEÇALHOS
========================================================= */

function criarCabecalhos(apiKey) {
  const headers = {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${apiKey}`,

    "X-Title":
      process.env.APP_NAME ||
      "Maxi IA"
  };

  /*
    SITE_URL é opcional.

    Quando não existe, tenta usar
    automaticamente a URL da Vercel.
  */
  const siteUrl =
    String(
      process.env.SITE_URL ||
        (
          process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : ""
        )
    ).trim();

  if (siteUrl) {
    headers["HTTP-Referer"] =
      siteUrl;
  }

  return headers;
}

/* =========================================================
   ESPERA ENTRE TENTATIVAS
========================================================= */

function esperar(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

/*
  Calcula quanto tempo esperar antes
  de tentar novamente.

  Primeiro usa Retry-After, caso o
  OpenRouter tenha enviado esse cabeçalho.

  Caso contrário, usa espera progressiva:
  aproximadamente 1,2s, 2,4s e 4,8s.
*/
function calcularEsperaRetryAfter(
  retryAfter,
  tentativa
) {
  if (retryAfter) {
    /*
      Retry-After em segundos.
    */
    const segundos =
      Number(retryAfter);

    if (
      Number.isFinite(segundos) &&
      segundos >= 0
    ) {
      return Math.min(
        segundos * 1000,
        MAX_RETRY_DELAY_MS
      );
    }

    /*
      Retry-After em formato de data.
    */
    const data =
      Date.parse(retryAfter);

    if (
      Number.isFinite(data)
    ) {
      return Math.min(
        Math.max(
          0,
          data - Date.now()
        ),
        MAX_RETRY_DELAY_MS
      );
    }
  }

  /*
    Espera exponencial com uma pequena
    variação aleatória para evitar novas
    requisições exatamente no mesmo instante.
  */
  const exponencial =
    DEFAULT_RETRY_DELAY_MS *
    2 ** tentativa;

  const variacaoAleatoria =
    Math.floor(
      Math.random() * 350
    );

  return Math.min(
    exponencial +
      variacaoAleatoria,
    MAX_RETRY_DELAY_MS
  );
}

/* =========================================================
   REQUISIÇÃO INDIVIDUAL
========================================================= */

async function fazerRequisicaoOpenRouter({
  apiKey,
  messages
}) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      REQUEST_TIMEOUT_MS
    );

  try {
    const models =
      obterModelosDeRoteamento();

    const resposta =
      await fetch(
        OPENROUTER_URL,
        {
          method: "POST",

          headers:
            criarCabecalhos(
              apiKey
            ),

          body: JSON.stringify({
            /*
              Usamos models, no plural.

              O OpenRouter tenta o primeiro
              e utiliza o próximo como fallback.
            */
            models,

            messages,

            temperature: 0.65,

            top_p: 0.9,

            max_tokens:
              MAX_OUTPUT_TOKENS,

            frequency_penalty:
              0.15,

            presence_penalty:
              0.05,

            stream: false,

            /*
              Permite troca automática de provedor
              quando um deles estiver indisponível.
            */
            provider: {
              allow_fallbacks: true,

              /*
                Não exige que todos os provedores
                suportem exatamente cada parâmetro.

                Isso reduz erros quando um modelo
                gratuito usa um provedor diferente.
              */
              require_parameters:
                false,

              /*
                Prioriza provedores com maior
                capacidade de processamento.
              */
              sort: "throughput"
            }
          }),

          signal:
            controller.signal
        }
      );

    const textoBruto =
      await resposta.text();

    let dados = {};

    if (textoBruto) {
      try {
        dados =
          JSON.parse(
            textoBruto
          );
      } catch {
        dados = {
          raw: textoBruto
        };
      }
    }

    if (!resposta.ok) {
      const erro =
        new Error(
          extrairErroOpenRouter(
            dados,
            resposta.status
          )
        );

      erro.status =
        resposta.status;

      erro.retryAfter =
        resposta.headers.get(
          "retry-after"
        );

      erro.data =
        dados;

      throw erro;
    }

    const reply =
      extrairConteudoOpenRouter(
        dados
      );

    if (!reply) {
      const erro =
        new Error(
          "O modelo devolveu uma resposta vazia."
        );

      erro.status = 502;

      erro.data = dados;

      throw erro;
    }

    return {
      reply,

      model:
        dados?.model ||
        obterModeloPrincipal(),

      usage:
        dados?.usage ||
        null,

      id:
        dados?.id ||
        null
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   RETENTATIVAS AUTOMÁTICAS
========================================================= */

async function gerarRespostaComRetentativas({
  apiKey,
  messages
}) {
  let ultimoErro = null;

  for (
    let tentativa = 0;
    tentativa <
      MAX_OPENROUTER_ATTEMPTS;
    tentativa += 1
  ) {
    try {
      return await
        fazerRequisicaoOpenRouter({
          apiKey,
          messages
        });
    } catch (erro) {
      ultimoErro = erro;

      console.error(
        `[Maxi API ${MAXI_API_VERSION}] tentativa ${tentativa + 1}:`,
        {
          status:
            erro?.status,

          message:
            erro?.message
        }
      );

      /*
        AbortError representa timeout.
      */
      if (
        erro?.name ===
        "AbortError"
      ) {
        erro.status = 504;
      }

      const podeTentarNovamente =
        RETRYABLE_STATUS.has(
          Number(
            erro?.status
          )
        ) ||
        erro?.name ===
          "AbortError";

      const ultimaTentativa =
        tentativa >=
        MAX_OPENROUTER_ATTEMPTS -
          1;

      /*
        Erros permanentes, como chave inválida,
        não devem ser repetidos.
      */
      if (
        !podeTentarNovamente ||
        ultimaTentativa
      ) {
        throw erro;
      }

      const espera =
        calcularEsperaRetryAfter(
          erro?.retryAfter,
          tentativa
        );

      await esperar(espera);
    }
  }

  throw (
    ultimoErro ||
    new Error(
      "Não foi possível gerar uma resposta."
    )
  );
}

/* =========================================================
   TRATAMENTO FINAL DE ERROS
========================================================= */

function tratarErroDaApi(
  erro
) {
  const status =
    Number(
      erro?.status
    ) || 500;

  if (
    erro?.name ===
      "AbortError" ||
    status === 408 ||
    status === 504
  ) {
    return {
      status: 504,

      codigo:
        "OPENROUTER_TIMEOUT",

      mensagem:
        "A resposta demorou mais do que o esperado. Tente novamente."
    };
  }

  if (status === 400) {
    return {
      status: 400,

      codigo:
        "INVALID_OPENROUTER_REQUEST",

      mensagem:
        "O OpenRouter recusou a solicitação. Verifique o modelo configurado."
    };
  }

  if (status === 401) {
    return {
      status: 500,

      codigo:
        "INVALID_API_KEY",

      mensagem:
        "A chave do OpenRouter está inválida ou não foi reconhecida."
    };
  }

  if (status === 402) {
    return {
      status: 503,

      codigo:
        "INSUFFICIENT_CREDITS",

      mensagem:
        "A conta do OpenRouter está sem créditos disponíveis."
    };
  }

  if (status === 403) {
    return {
      status: 503,

      codigo:
        "OPENROUTER_FORBIDDEN",

      mensagem:
        "O OpenRouter não autorizou o uso do modelo configurado."
    };
  }

  if (status === 404) {
    return {
      status: 503,

      codigo:
        "MODEL_NOT_FOUND",

      mensagem:
        "O modelo configurado não está disponível no OpenRouter."
    };
  }

  if (status === 429) {
    return {
      status: 429,

      codigo:
        "RATE_LIMIT",

      mensagem:
        "O limite temporário de mensagens foi atingido. Tente novamente em alguns instantes."
    };
  }

  if (
    status === 500 ||
    status === 502 ||
    status === 503
  ) {
    return {
      status: 503,

      codigo:
        "OPENROUTER_UNAVAILABLE",

      mensagem:
        "A inteligência artificial está temporariamente ocupada. Tente enviar novamente."
    };
  }

  return {
    status: 500,

    codigo:
      "INTERNAL_SERVER_ERROR",

    mensagem:
      "Não foi possível gerar a resposta agora."
  };
}

/* =========================================================
   FUNÇÃO PRINCIPAL DA VERCEL
========================================================= */

export default async function handler(
  req,
  res
) {
  aplicarCors(res);

  /*
    Verificação CORS.
  */
  if (
    req.method === "OPTIONS"
  ) {
    return res
      .status(204)
      .end();
  }

  /*
    A rota aceita somente POST.
  */
  if (
    req.method !== "POST"
  ) {
    res.setHeader(
      "Allow",
      "POST, OPTIONS"
    );

    return responderErro(
      res,
      405,
      "Método não permitido. Use POST.",
      "METHOD_NOT_ALLOWED"
    );
  }

  const apiKey =
    obterChaveOpenRouter();

  const modelo =
    obterModeloPrincipal();

  if (!apiKey) {
    return responderErro(
      res,
      500,
      "A variável OPENROUTER_API_KEY não está configurada.",
      "MISSING_API_KEY"
    );
  }

  if (!modelo) {
    return responderErro(
      res,
      500,
      "A variável OPENROUTER_MODEL não está configurada.",
      "MISSING_MODEL"
    );
  }

  /*
    Em algumas configurações da Vercel,
    o body pode chegar como texto.
  */
  let body = req.body;

  if (
    typeof body === "string"
  ) {
    try {
      body =
        JSON.parse(body);
    } catch {
      return responderErro(
        res,
        400,
        "O corpo da requisição não contém um JSON válido.",
        "INVALID_JSON"
      );
    }
  }

  if (
    !body ||
    typeof body !== "object"
  ) {
    return responderErro(
      res,
      400,
      "O corpo da requisição está vazio.",
      "EMPTY_BODY"
    );
  }

  const validacao =
    validarMensagens(
      body.messages
    );

  if (
    !validacao.validas
  ) {
    return responderErro(
      res,
      400,
      validacao.erro,
      "INVALID_MESSAGES"
    );
  }

  try {
    const resultado =
      await
        gerarRespostaComRetentativas({
          apiKey,

          messages:
            validacao.mensagens
        });

    /*
      O script.js recebe a resposta
      pelo campo reply.
    */
    return responderJson(
      res,
      200,
      {
        reply:
          resultado.reply,

        model:
          resultado.model,

        usage:
          resultado.usage,

        requestId:
          resultado.id
      }
    );
  } catch (erro) {
    console.error(
      `[Maxi API ${MAXI_API_VERSION}] erro final:`,
      {
        status:
          erro?.status,

        message:
          erro?.message
      }
    );

    const tratado =
      tratarErroDaApi(
        erro
      );

    return responderErro(
      res,
      tratado.status,
      tratado.mensagem,
      tratado.codigo,
      erro?.message
    );
  }
}
