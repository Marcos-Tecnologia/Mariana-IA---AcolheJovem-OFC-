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

    // Função auxiliar para chamar OpenRouter
    async function callModel(modelId) {
      const payload = {
        model: modelId,
        messages,
        temperature: 0.7,
        max_tokens: 400,
      };

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

    // 1ª tentativa → Nous Hermes
    let result = await callModel("nousresearch/nous-hermes-2-mixtral");
    console.log("📡 Nous Hermes status:", result.status);

    // Fallback → Mistral 7B se der erro
    if ([401, 403, 404].includes(result.status)) {
      console.warn("⚠️ Nous Hermes falhou:", result.data || result.text);
      console.log("🔁 Tentando fallback Mistral 7B...");
      result = await callModel("mistralai/mistral-7b-instruct");
      console.log("📡 Mistral 7B status:", result.status);
    }

    if (result.status < 200 || result.status >= 300) {
      return res.status(result.status).json({
        error: result.data?.error || result.text || `HTTP ${result.status}`
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
