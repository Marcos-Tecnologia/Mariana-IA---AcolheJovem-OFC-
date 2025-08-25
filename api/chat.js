export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages)
      ? body.messages
      : [{ role: "user", content: body.message || "Olá" }];

    const key = (process.env.OPENROUTER_API_KEY || "").trim();
    if (!key.startsWith("sk-or-")) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY missing or invalid" });
    }

    const referer =
      (req.headers["x-forwarded-host"] && `https://${req.headers["x-forwarded-host"]}`) ||
      (req.headers.host && `https://${req.headers.host}`) ||
      "https://vercel.app";

    async function callModel(modelId) {
      const payload = { model: modelId, messages, temperature: 0.7, max_tokens: 400 };

      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": "Mariana IA (AcolheJovem)"
        },
        body: JSON.stringify(payload),
      });

      const text = await r.text();
      let data = null;
      try { data = JSON.parse(text); } catch {}
      return { status: r.status, data, text };
    }

    // Fallback de modelos confiáveis
    const models = [
      "openai/gpt-4o-mini",
      "nousresearch/nous-hermes-2-mixtral",
      "mistralai/mixtral-8x7b-instruct"
    ];

    let result;
    for (const model of models) {
      result = await callModel(model);
      console.log(`📡 Tentativa com ${model} →`, result.status);
      if (result.status >= 200 && result.status < 300) break;
    }

    if (!result || result.status < 200 || result.status >= 300) {
      return res.status(result?.status || 500).json({
        error: result?.data?.error || result?.text || "Todos os modelos falharam"
      });
    }

    const reply =
      result.data?.choices?.[0]?.message?.content ||
      "Desculpe, não consegui responder agora.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("💥 Erro inesperado:", err);
    return res.status(500).json({ error: err.message });
  }
}
