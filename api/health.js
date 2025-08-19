export default function handler(req, res) {
  // NÃO expõe a chave! Só mostra se existe e o tamanho.
  const raw = process.env.OPENROUTER_API_KEY || "";
  const key = raw.trim();
  res.status(200).json({
    ok: !!key && key.startsWith("sk-or-"),
    len: key.length,
    startsWith: key.slice(0, 6) || null
  });
}
