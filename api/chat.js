export default async function handler(req, res) {
  console.log("📩 /api/chat chamado. Método:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    const hasArray = Array.isArray(body.messages);
    const hasString = typeof body.message === "string" && body.message.trim().length > 0;

    // Monta messages aceitando dois formatos
    let messages;
    if (hasArray) {
      messages = body.messages;
    } else if (hasString) {
      messages = [
        { role: "system", content: "Você é Mariana, uma IA empática, calma e acolhedora. Responda em pt-BR." },
        { role: "user", content: body.message.trim() }
      ];
    } else {
      return res.status(400).json({ error: "Bad Request: envie 'message' (string) ou 'messages' (array)." });
    }

    // Lê a key do Vercel
    let key = (process.env.OPENROUTER_API_KEY || "").trim();
    if (!key || !key.startsWith("sk-or-")) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY not set on server." });
    }

    const referer =
      (req.headers["x-forwarded-host"] && `https://${req.headers["x-forwarded-host"]}`) ||
      (req.headers.host && `https://${req.headers.host}`) ||
      "https://vercel.app";

    // Função auxiliar para chamar a OpenRouter
    async function callOpenRouter(modelId) {
      const payload = {
        model: modelId,                    // 👈 tenta com este modelo
        messages,                          // 👈 seu array de mensagens
        temperature: 0.7,
        max_tokens: 400
      };

      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": "Mariana IA (AcolheJovem)"
        },
        body: JSON.stringify(payload)
      });

      const text = await r.text();
      let data = null;
      try { data = JSON.parse(text); } catch {}

      return { status: r.status, data, text };
    }

    // 1ª tentativa: openai/gpt-4o-mini (namespaced correto)
    let attempt = await callOpenRouter("openai/gpt-4o-mini");
    console.log("📡 Tentativa 1 (gpt-4o-mini) status:", attempt.status);

    // Se 401/403/404, tenta modelo alternativo
    if ([401, 403, 404].includes(attempt.status)) {
      console.warn("⚠️ Tentativa 1 falhou. Erro:", attempt.data?.error || attempt.text);
      console.log("🔁 Tentando modelo alternativo: nousresearch/nous-hermes-2-mixtral");
      attempt = await callOpenRouter("nousresearch/nous-hermes-2-mixtral");
      console.log("📡 Tentativa 2 (nous-hermes-2-mixtral) status:", attempt.status);
    }

    if (attempt.status < 200 || attempt.status >= 300) {
      // devolve erro detalhado para aparecer no Network → Response
      return res.status(attempt.status).json({
        error: attempt.data?.error || attempt.text || `HTTP ${attempt.status}`
      });
    }

    const reply =
      attempt.data?.choices?.[0]?.message?.content ||
      "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });

  } catch (e) {
    console.error("💥 Erro inesperado:", e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
