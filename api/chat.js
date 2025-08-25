export default async function handler(req, res) {
  try {
    const key = (process.env.OPENROUTER_API_KEY || "").trim();
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
