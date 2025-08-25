export default async function handler(req, res) {
  // Verifica se a chave está presente no ambiente
  const raw = process.env.OPENROUTER_API_KEY || "";
  const key = raw.trim();
  const ok = !!key && key.startsWith("sk-or-");

  if (!ok) {
    return res.status(500).json({ ok, msg: "OPENROUTER_API_KEY ausente ou inválida no servidor." });
  }

  try {
    // Chamada simples para listar modelos (teste de autenticação)
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://vercel.app",
        "X-Title": "Mariana IA (teste)"
      }
    });

    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}

    return res.status(r.status).json({
      status: r.status,
      ok: r.ok,
      body: data || text
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
