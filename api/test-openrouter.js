export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY não encontrada" });
    }

    const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nousresearch/nous-capybara-7b",
        messages: [
          { role: "user", content: "Oi" }
        ]
      })
    });

    const data = await resposta.json();
    return res.status(resposta.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}
