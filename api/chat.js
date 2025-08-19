export default async function handler(req, res) {
  console.log("📩 /api/chat chamado. Método:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string in body." });
    }

    // Lê e valida a chave do OpenRouter
    let key = process.env.OPENROUTER_API_KEY;
    if (typeof key === "string") key = key.trim();
    if (!key || !key.startsWith("sk-or-")) {
      console.error("🚨 OPENROUTER_API_KEY ausente ou inválida.");
      return res.status(500).json({ error: "OPENROUTER_API_KEY not set on server." });
    }
    console.log("🔑 OPENROUTER_API_KEY carregada (comprimento):", key.length);

    const referer =
      (req.headers["x-forwarded-host"] && `https://${req.headers["x-forwarded-host"]}`) ||
      (req.headers.host && `https://${req.headers.host}`) ||
      "https://vercel.app";

    const body = {
      // IMPORTANTE: no OpenRouter use o ID namespaced do modelo
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é Mariana, uma IA empática, calma e acolhedora. Responda em pt-BR." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 400
    };

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        // recomendados pelo OpenRouter
        "HTTP-Referer": referer,
        "X-Title": "Mariana IA (AcolheJovem)"
      },
      body: JSON.stringify(body)
    });

    console.log("📡 OpenRouter status:", r.status);
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      console.error("❌ Erro OpenRouter:", data);
      // Propaga o status real para facilitar debug no front
      return res.status(r.status).json({ error: data?.error || data || `HTTP ${r.status}` });
    }

    const reply = data?.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });
  } catch (e) {
    console.error("💥 Erro inesperado no handler:", e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
