// =====================
// ELEMENTOS DA INTERFACE
// =====================
const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");

// Prompt do sistema (vai como primeira mensagem)
const SYSTEM_PROMPT = `
Você é a Mariana, uma IA de apoio emocional, muito gentil e acolhedora.
Sempre responda com empatia, validação e calma. Sugira passos simples (respiração 4-4-4,
hidratar, alongar, escrever 3 coisas boas). Evite parecer clínica. Não dê conselhos médicos.
Se detectar risco (ideação suicida), acolha e recomende ajuda: CVV 188 (24h) e procurar alguém de confiança.
`;

// =====================
// VOZ CALMA PT-BR
// =====================
let vozFemininaPtBr = null;

function selecionarVozPtBr() {
  const vozes = window.speechSynthesis?.getVoices?.() || [];
  const preferidas = ["Maria", "Helena", "Luciana", "Camila", "Vitória", "Google português do Brasil", "Microsoft Maria"];
  vozFemininaPtBr =
    vozes.find(
      (v) =>
        v.lang?.toLowerCase?.().startsWith("pt") &&
        preferidas.some((n) => v.name?.toLowerCase?.().includes(n.toLowerCase()))
    ) || vozes.find((v) => v.lang?.toLowerCase?.().startsWith("pt"));
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = selecionarVozPtBr;
  selecionarVozPtBr();
}
function falarTexto(texto) {
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    if (vozFemininaPtBr) u.voice = vozFemininaPtBr;
    u.rate = 0.85;
    u.pitch = 1.05;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  } catch {}
}

// =====================
// UI: mensagens e digitação
// =====================
function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msgDiv;
}

async function digitarRespostaTexto(texto, el, delay = 24) {
  el.textContent = "";
  for (let i = 0; i < texto.length; i++) {
    el.textContent += texto[i];
    if (i % 2 === 0) await new Promise((r) => setTimeout(r, delay));
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

// =====================
// DETECÇÃO DE CRISE
// =====================
function detectarCriseGrave(texto) {
  const gatilhos = [
    "quero me matar",
    "vou me matar",
    "não quero mais viver",
    "tirar minha vida",
    "acabar com tudo",
    "pensando em suicídio",
    "morrer",
    "desviver",
    "sumir",
    "tirar a vida"
  ];
  const t = (texto || "").toLowerCase();
  return gatilhos.some((g) => t.includes(g));
}

// =====================
// CHAMADA AO BACKEND (/api/chat)
// =====================
async function queryApi(userMessage) {
  try {
    // Monta o array 'messages' no padrão OpenRouter
    const messages = [
      { role: "system", content: SYSTEM_PROMPT.trim() },
      { role: "user", content: userMessage }
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // IMPORTANTE: enviamos { messages } (plural), pois seu backend atual aceita esse formato
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`API error: ${response.status}${errText ? " - " + errText : ""}`);
    }

    // Aceita dois formatos:
    // 1) { reply: "..." }  (quando o backend já retorna pronto)
    // 2) { choices: [{ message: { content: "..." } }]}  (pass-through da OpenRouter)
    const data = await response.json();
    let texto =
      data?.reply ??
      data?.choices?.[0]?.message?.content ??
      "Desculpe, não consegui gerar uma resposta agora.";
    return texto.trim();
  } catch (err) {
    console.error("Erro:", err);
    // Propaga mensagem amigável ao usuário
    return "Desculpe, houve um erro ao tentar responder.";
  }
}

// =====================
// FLUXO DO FORMULÁRIO
// =====================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  input.value = "";
  const loading = addMessage("...", "bot");

  // Resposta imediata se detectar crise
  if (detectarCriseGrave(userText)) {
    const mensagemAjuda = `Sinto muito que você esteja se sentindo assim 💛
Você não está sozinho(a).
📞 CVV - 188 (24h, gratuito)
📞 Profissional local: (99) 99999-9999

Se puder, fique comigo aqui: vamos respirar 4-4-4 (inspirar 4s, segurar 4s, soltar 4s). Estou aqui com você.`;
    await digitarRespostaTexto(mensagemAjuda, loading, 18);
    falarTexto(mensagemAjuda);
    return;
  }

  // Chamada normal à API
  const botResponse = await queryApi(userText);
  await digitarRespostaTexto(botResponse, loading, 18);
  falarTexto(botResponse);
});
