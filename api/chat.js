export default async function handler(req, res) {
  console.log("📩 Nova requisição recebida em /api/chat");

  if (req.method !== "POST") {
    console.log("❌ Método não permitido:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  console.log("📝 Mensagem do usuário:", message);

  // Testar se a variável está vindo do Vercel
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("🚨 OPENROUTER_API_KEY não encontrada!");
    return res.status(500).json({ error: "Chave da API não configurada no Vercel" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é uma IA acolhedora e empática." },
          { role: "user", content: message }
        ],
      }),
    });

    console.log("📡 Resposta da OpenRouter:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro da OpenRouter:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log("✅ Resposta da OpenRouter recebida com sucesso");
    return res.status(200).json(data);

  } catch (err) {
    console.error("💥 Erro inesperado:", err);
    return res.status(500).json({ error: err.message });
  }
}
