/* =========================================================
   MAXI IA — API CHAT
   VERSÃO 9.6.0

   Caminho:
   /api/chat.js

   Plataforma:
   Vercel Serverless Function

   Variáveis de ambiente aceitas:
   OPENROUTER_API_KEY
   ou
   KEY
========================================================= */

const MAXI_API_VERSION = "9.6.0";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/*
  Modelo principal.

  Você pode trocar pela variável de ambiente
  OPENROUTER_MODEL sem editar este arquivo.
*/
const DEFAULT_MODEL =
  "meta-llama/llama-3.1-8b-instruct:free";

/*
  Modelos alternativos usados quando o principal
  não estiver disponível.

  A disponibilidade de modelos gratuitos pode mudar
  no OpenRouter.
*/
const FALLBACK_MODELS = [
  "google/gemma-3-12b-it:free",
  "qwen/qwen3-8b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free"
];

const MAX_MESSAGES = 50;

const MAX_MESSAGE_LENGTH = 12000;

const MAX_TOTAL_CHARACTERS = 80000;

const MAX_OUTPUT_TOKENS = 1400;

const REQUEST_TIMEOUT_MS = 50000;

const ALLOWED_ROLES = new Set([
  "system",
  "user",
  "assistant"
]);

/* =========================================================
   CONFIGURAÇÕES DE CORS
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
   RESPOSTAS PADRONIZADAS
========================================================= */

function responderJson(
  res,
  status,
  dados
) {
  res.status(status).json({
    version: MAXI_API_VERSION,
    ...dados
  });
}

function responderErro(
  res,
  status,
  mensagem,
  codigo = "UNKNOWN_ERROR",
  detalhes = undefined
) {
  const resposta = {
    error: {
      code: codigo,
      message: mensagem
    }
  };

  if (
    detalhes &&
    process.env.NODE_ENV !== "production"
  ) {
    resposta.error.details =
      detalhes;
  }

  responderJson(
    res,
    status,
    resposta
  );
}

/* =========================================================
   LEITURA DA CHAVE
========================================================= */

function obterChaveOpenRouter() {
  return (
    process.env.OPENROUTER_API_KEY ||
    process.env.KEY ||
    ""
  ).trim();
}

/* =========================================================
   NORMALIZAÇÃO DE TEXTO
========================================================= */

function normalizarTexto(texto) {
  return String(texto || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/* =========================================================
   LIMPEZA DA RESPOSTA DA IA
========================================================= */

function limparRespostaIA(texto) {
  let resposta =
    normalizarTexto(texto);

  /*
    Remove blocos internos completos.
  */
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
    );

  /*
    Remove tags que ficaram abertas ou isoladas.
  */
  resposta = resposta
    .replace(
      /<\/?(?:think|analysis|reasoning|reflection)>/gi,
      ""
    )
    .replace(
      /^\s*(?:assistant|assistente|maxi)\s*:\s*/i,
      ""
    );

  /*
    Alguns modelos colocam raciocínio em blocos Markdown.
  */
  resposta = resposta.replace(
    /```(?:analysis|reasoning|think)[\s\S]*?```/gi,
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
    Mantém apenas as mensagens mais recentes,
    mas preserva as mensagens de sistema iniciais.
  */
  const sistemas =
    mensagensRecebidas.filter(
      (mensagem) =>
        mensagem?.role === "system"
    );

  const conversacao =
    mensagensRecebidas.filter(
      (mensagem) =>
        mensagem?.role !== "system"
    );

  const quantidadeParaConversacao =
    Math.max(
      1,
      MAX_MESSAGES -
        sistemas.length
    );

  const selecionadas = [
    ...sistemas.slice(0, 8),
    ...conversacao.slice(
      -quantidadeParaConversacao
    )
  ].slice(
    -MAX_MESSAGES
  );

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
        mensagem.role || ""
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

    if (
      content.length >
      MAX_MESSAGE_LENGTH
    ) {
      content =
        content.slice(
          0,
          MAX_MESSAGE_LENGTH
        );
    }

    /*
      Impede que a soma das mensagens ultrapasse
      o limite definido.
    */
    if (
      caracteresTotais +
        content.length >
      MAX_TOTAL_CHARACTERS
    ) {
      const restante =
        MAX_TOTAL_CHARACTERS -
        caracteresTotais;

      if (restante < 20) {
        break;
      }

      content =
        content.slice(
          0,
          restante
        );
    }

    mensagens.push({
      role,
      content
    });

    caracteresTotais +=
      content.length;

    if (
      caracteresTotais >=
      MAX_TOTAL_CHARACTERS
    ) {
      break;
    }
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
   EXTRAÇÃO DA RESPOSTA DO OPENROUTER
========================================================= */

function extrairConteudoOpenRouter(
  dados
) {
  if (!dados) {
    return "";
  }

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
    Compatibilidade com APIs que retornam
    conteúdo como uma lista de partes.
  */
  if (
    Array.isArray(conteudo)
  ) {
    const texto = conteudo
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
   ERRO RETORNADO PELO OPENROUTER
========================================================= */

function extrairErroOpenRouter(
  dados,
  status
) {
  const mensagem =
    dados?.error?.message ||
    dados?.error?.metadata?.raw ||
    dados?.message ||
    `Erro ${status} no OpenRouter.`;

  return normalizarTexto(
    mensagem
  );
}

/* =========================================================
   REQUISIÇÃO AO OPENROUTER
========================================================= */

async function chamarOpenRouter({
  apiKey,
  model,
  messages
}) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

  try {
    const resposta =
      await fetch(
        OPENROUTER_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${apiKey}`,

            /*
              Estes cabeçalhos identificam seu projeto
              no OpenRouter.

              Você pode configurar os valores na Vercel.
            */
            "HTTP-Referer":
              process.env.SITE_URL ||
              process.env.VERCEL_URL
                ? (
                    process.env.SITE_URL ||
                    `https://${process.env.VERCEL_URL}`
                  )
                : "https://maxi-ia.vercel.app",

            "X-Title":
              process.env.APP_NAME ||
              "Maxi IA"
          },

          body: JSON.stringify({
            model,
            messages,

            temperature: 0.65,

            top_p: 0.9,

            max_tokens:
              MAX_OUTPUT_TOKENS,

            frequency_penalty: 0.15,

            presence_penalty: 0.05,

            stream: false
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
          JSON.parse(textoBruto);
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

      erro.model =
        model;

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
      erro.model = model;
      erro.data = dados;

      throw erro;
    }

    return {
      reply,
      model:
        dados.model || model,
      usage:
        dados.usage || null,
      id:
        dados.id || null
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   MODELOS DISPONÍVEIS PARA TENTATIVA
========================================================= */

function obterListaDeModelos() {
  const modeloConfigurado =
    String(
      process.env
        .OPENROUTER_MODEL ||
      ""
    ).trim();

  const modelos = [
    modeloConfigurado,
    DEFAULT_MODEL,
    ...FALLBACK_MODELS
  ].filter(Boolean);

  /*
    Remove modelos repetidos.
  */
  return [
    ...new Set(modelos)
  ];
}

/* =========================================================
   TENTATIVA COM MODELOS ALTERNATIVOS
========================================================= */

async function gerarResposta({
  apiKey,
  messages
}) {
  const modelos =
    obterListaDeModelos();

  let ultimoErro = null;

  for (
    const model
    of modelos
  ) {
    try {
      const resultado =
        await chamarOpenRouter({
          apiKey,
          model,
          messages
        });

      return resultado;
    } catch (erro) {
      ultimoErro = erro;

      console.error(
        `[Maxi API ${MAXI_API_VERSION}] Falha no modelo ${model}:`,
        erro?.message || erro
      );

      /*
        Erro 401 normalmente significa chave inválida.
        Não adianta testar outro modelo.
      */
      if (erro?.status === 401) {
        throw erro;
      }

      /*
        Erro 403 pode indicar conta, política
        ou modelo não permitido.
      */
      if (
        erro?.status === 403 &&
        modelos.length === 1
      ) {
        throw erro;
      }

      /*
        Erro 400 pode ser causado por modelo incompatível.
        Nesse caso, tenta o próximo.
      */
      if (
        erro?.status === 400 ||
        erro?.status === 404 ||
        erro?.status === 408 ||
        erro?.status === 429 ||
        erro?.status === 500 ||
        erro?.status === 502 ||
        erro?.status === 503 ||
        erro?.status === 504 ||
        erro?.name === "AbortError"
      ) {
        continue;
      }

      /*
        Para outros erros inesperados,
        ainda tenta o próximo modelo.
      */
    }
  }

  throw (
    ultimoErro ||
    new Error(
      "Nenhum modelo conseguiu gerar uma resposta."
    )
  );
}

/* =========================================================
   TRATAMENTO DOS ERROS PARA O USUÁRIO
========================================================= */

function tratarErroDaApi(
  erro
) {
  if (
    erro?.name === "AbortError"
  ) {
    return {
      status: 504,
      codigo:
        "OPENROUTER_TIMEOUT",
      mensagem:
        "A resposta demorou mais do que o esperado."
    };
  }

  const status =
    Number(erro?.status) ||
    500;

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
        "A chave do OpenRouter está ausente, inválida ou não foi reconhecida."
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
        "O OpenRouter não autorizou o uso desse modelo ou dessa conta."
    };
  }

  if (status === 404) {
    return {
      status: 503,
      codigo:
        "MODEL_NOT_FOUND",
      mensagem:
        "O modelo configurado não está disponível."
    };
  }

  if (status === 408) {
    return {
      status: 504,
      codigo:
        "OPENROUTER_TIMEOUT",
      mensagem:
        "O OpenRouter demorou demais para responder."
    };
  }

  if (status === 429) {
    return {
      status: 429,
      codigo:
        "RATE_LIMIT",
      mensagem:
        "Muitas mensagens foram enviadas em pouco tempo. Tente novamente em alguns instantes."
    };
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return {
      status: 503,
      codigo:
        "OPENROUTER_UNAVAILABLE",
      mensagem:
        "O serviço de inteligência artificial está temporariamente indisponível."
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
    Responde à verificação CORS.
  */
  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .end();
  }

  /*
    A rota aceita somente POST.
  */
  if (req.method !== "POST") {
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

  if (!apiKey) {
    console.error(
      `[Maxi API ${MAXI_API_VERSION}] Chave do OpenRouter não configurada.`
    );

    return responderErro(
      res,
      500,
      "A chave da inteligência artificial não foi configurada no servidor.",
      "MISSING_API_KEY"
    );
  }

  /*
    Em algumas configurações, o body pode chegar como texto.
  */
  let body = req.body;

  if (
    typeof body === "string"
  ) {
    try {
      body = JSON.parse(body);
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

  if (!validacao.validas) {
    return responderErro(
      res,
      400,
      validacao.erro,
      "INVALID_MESSAGES"
    );
  }

  try {
    const resultado =
      await gerarResposta({
        apiKey,
        messages:
          validacao.mensagens
      });

    /*
      O script.js V9.6 procura primeiro pelo campo reply.
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
      `[Maxi API ${MAXI_API_VERSION}] Erro final:`,
      {
        message:
          erro?.message,

        status:
          erro?.status,

        model:
          erro?.model
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
