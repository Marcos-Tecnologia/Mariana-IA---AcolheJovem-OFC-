export default async function handler(req, res) {
  // CORS básico (seguro mesmo em iframe do Google Sites)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, systemPrompt } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing 'message'." });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server missing OPENROUTER_API_KEY." });

    const host = req.headers.host || "localhost";
    const referer = `https://${host}`;

    // prompt de segurança + empatia
    const safeSystem = `
Você é "Mariana", IA acolhedora em pt-BR. Use um tom calmo, gentil e validante.
Evite parecer clínica; dê passos simples e práticos (respiração 4-4-4, hidratar, pequenas metas).
Nunca ofereça aconselhamento médico. Se detectar ideação suicida/risco:
- diga que a pessoa não está sozinha,
- recomende procurar ajuda imediata,
- ofereça recursos: CVV 188 (24h) e emergência 190 no Brasil,
- encoraje a conversar com alguém de confiança,
- mantenha-se presente e acolhedora, sem julgamentos.
Se a pessoa perguntar se é bonita: responda com carinho e afirmação verdadeira e acolhedora.
`;

    const body = {
      model: model || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: safeSystem + "\n\n" + (systemPrompt || "") },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Essas duas são recomendadas pelo OpenRouter (quando possível):
        "HTTP-Referer": referer,
        "X-Title": "Mariana IA (AcolheJovem)",
      },
      body: JSON.stringify(body),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      const msg = (data && (data.error?.message || data.message)) || `HTTP ${r.status}`;
      return res.status(r.status).json({ error: msg });
    }

    const reply = data?.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta agora.";
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
