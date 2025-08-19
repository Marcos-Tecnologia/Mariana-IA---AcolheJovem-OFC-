export default async function handler(req, res) {
  console.log("📩 /api/chat chamado. Método:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    const hasArray = Array.isArray(body.messages);
    const hasString = typeof body.message === "string" && body.message.trim().length > 0;

    // Monta o array messages aceitando os dois formatos
    let messages;
    if (hasArray) {
      messages = body.messages;
    } else if (hasString) {
      messages = [
        { role: "system", content: "Você é Mariana, uma IA empática, calma e acolhedora. Responda em pt-BR." },
        { role: "user", content: body.message.trim() }
      ];
    } else {
      console.error("🚫 Corpo inválido recebido em /api/chat:", body);
      return res.status(400).json({ error: "Bad Request: envie 'message' (string) ou 'messages' (array)." });
    }

    // Chave
    let key = process.env.OPENROUTER_API_KEY;
    if (typeof key === "string") key = key.trim();
    if (!key || !key.startsWith("sk-or-")) {
      console.error("🚨 OPENROUTER_API_KEY ausente/ inválida.");
      return res.status(500).json({ error: "OPENROUTER_API_KEY not set on server." });
    }

    const referer =
      (req.headers["x-forwarded-host"] && `https://${req.headers["x-forwarded-host"]}`) ||
      (req.headers.host && `https://${req.headers.host}`) ||
      "https://vercel.app";

    const payload = {
      model: "openai/gpt-4o-mini", // use sempre o ID namespaced no OpenRouter
      messages,
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
    // tenta parsear como json, senão devolve texto cru
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    console.log("📡 OpenRouter status:", r.status);

    if (!r.ok) {
      console.error("❌ Erro OpenRouter:", text);
      return res.status(r.status).json({ error: text });
    }

    const reply = data?.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });
  } catch (e) {
    console.error("💥 Erro inesperado:", e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
} 
