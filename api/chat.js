export default async function handler(req, res) {
  // Permitir só POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido. Use POST."
    });
  }

  try {
    // Ler body
    const { messages } = req.body || {};

    // Validar mensagens
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Campo 'messages' inválido ou ausente."
      });
    }

    // Ler chave da Vercel
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "A variável OPENROUTER_API_KEY não está configurada na Vercel."
      });
    }

    // Chamar OpenRouter
    const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages
      })
    });

    // Ler resposta bruta
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

    // Se OpenRouter devolveu erro
    if (!resposta.ok) {
      return res.status(resposta.status).json({
        error: "Erro retornado pela OpenRouter.",
        details: data
      });
    }

    // Extrair resposta
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "A resposta da OpenRouter veio sem texto.",
        details: data
      });
    }

    // Resposta final para o frontend
    return res.status(200).json({
      reply
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno no backend.",
      details: String(error)
    });
  }
}
