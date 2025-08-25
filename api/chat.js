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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.app",
        "X-Title": "Mariana IA"
      },
      body: JSON.stringify({
        // 👇 Aqui você troca o modelo
        model: "deepseek/deepseek-chat-v3.1",
        messages,
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}

    if (!response.ok) {
      return res.status(response.status).json({ error: data || text });
    }

    const reply = data?.choices?.[0]?.message?.content || "Desculpe, não consegui responder agora.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
