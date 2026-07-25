export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido. Use POST."
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Campo 'messages' inválido ou ausente."
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      return res.status(500).json({
        error: "A variável OPENROUTER_API_KEY não está configurada na Vercel."
      });
    }

    if (!model) {
      return res.status(500).json({
        error: "A variável OPENROUTER_MODEL não está configurada na Vercel."
      });
    }

    const resposta = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",

          // Opcional, mas recomendado pela OpenRouter
          "HTTP-Referer": process.env.SITE_URL || "https://maxi.vercel.app",
          "X-Title": "Maxi IA"
        },

        body: JSON.stringify({
          model,

          messages,

          // ↓↓↓ Configurações para deixar a IA mais estável

          temperature: 0.35,

          top_p: 0.85,

          frequency_penalty: 0.15,

          presence_penalty: 0,

          max_tokens: 900
        })
      }
    );

    const raw = await resposta.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        error: "A OpenRouter não retornou JSON.",
        raw
      });
    }

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        error: "Erro retornado pela OpenRouter.",
        details: data
      });
    }

    let reply = data?.choices?.[0]?.message?.content;

    if (Array.isArray(reply)) {
      reply = reply
        .map((item) => item.text || "")
        .join("");
    }

    if (!reply || typeof reply !== "string") {
      return res.status(500).json({
        error: "A resposta da OpenRouter veio sem texto.",
        details: data
      });
    }

    // Remove possíveis blocos internos de alguns modelos

    reply = reply
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
      .replace(/^assistant:\s*/i, "")
      .trim();

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno no backend.",
      details: String(error)
    });
  }
}
