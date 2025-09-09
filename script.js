// -----------------------------
// Intro → Chat (fade-in/out)
// -----------------------------
const intro = document.getElementById("intro");
const chatContainer = document.getElementById("chat-container");
const startBtn = document.getElementById("start-btn");

if (startBtn) {
  startBtn.addEventListener("click", () => {
    intro.classList.add("fade-out");
    setTimeout(() => {
      intro.style.display = "none";
      chatContainer.style.display = "flex";
      chatContainer.classList.add("fade-in");
    }, 1000);
  });
}

// -----------------------------
// Chat principal
// -----------------------------
const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const clearBtn = document.getElementById("clear-btn");

// Histórico curto
const history = [];
const lastBotMessages = [];

// Frases comuns para evitar repetição
const BAN_PHRASES = [
  "tamo junto",
  "fica bem",
  "vai ficar tudo bem",
  "estou aqui pra você",
  "pode contar comigo"
];

// Prompt normal da Aurora
const SYSTEM_PROMPT = `
Você é a Aurora, uma amiga brasileira acolhedora.
- Responda curto, simples e com carinho.
- Pode usar 0–1 emoji.
- Sempre sugira 1 ou 2 micro-passos práticos (respiração 4-4-4, beber água, alongar, abrir a janela, grounding 5-4-3-2-1).
- Evite frases genéricas: ${BAN_PHRASES.join(", ")}.
- Varie aberturas, nunca repita sempre a mesma coisa.
`;

// -----------------------------
// Detecta crise
// -----------------------------
function detectarCrise(texto) {
  const gatilhos = [
    "me matar",
    "não quero mais viver",
    "tirar minha vida",
    "acabar com tudo",
    "não aguento mais",
    "sumir do mundo",
    "morrer",
    "desviver"
  ];
  const lower = texto.toLowerCase();
  return gatilhos.some(g => lower.includes(g));
}

// -----------------------------
// UI helpers
// -----------------------------
function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msgDiv;
}

async function digitarRespostaTexto(texto, el, delay = 25) {
  el.textContent = "";
  for (let i = 0; i < texto.length; i++) {
    el.textContent += texto[i];
    if (i % 2 === 0) await new Promise((r) => setTimeout(r, delay));
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  falarTexto(texto);
}

// -----------------------------
// Voz (browser speechSynthesis)
// -----------------------------
function falarTexto(texto) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 0.8;   // devagar
  utterance.pitch = 0.9;  // tom mais suave
  utterance.volume = 1.0;

  // tenta priorizar vozes femininas pt-BR
  const prefer = ["Maria", "Helena", "Luciana", "Camila", "Vitória", "Fernanda", "Isabela"];
  const voices = window.speechSynthesis.getVoices();
  let chosen = voices.find(v => v.lang.toLowerCase().startsWith("pt") && prefer.some(n => v.name.toLowerCase().includes(n.toLowerCase())));
  if (!chosen) chosen = voices.find(v => v.lang.toLowerCase().startsWith("pt"));
  if (chosen) utterance.voice = chosen;

  window.speechSynthesis.speak(utterance);
}

// -----------------------------
// Chamada ao backend
// -----------------------------
async function queryApi(userMessage) {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6), // últimas 3 trocas
      { role: "user", content: userMessage }
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`API error: ${response.status}${errText ? " - " + errText : ""}`);
    }

    const data = await response.json();
    return (
      data.reply ??
      data?.choices?.[0]?.message?.content ??
      "Ih, buguei 😅 tenta de novo!"
    );
  } catch (err) {
    console.error("Erro:", err);
    return "Opa, deu ruim aqui 😕";
  }
}

// -----------------------------
// Fluxo do formulário
// -----------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;

  history.push({ role: "user", content: userText });
  addMessage(userText, "user");
  input.value = "";
  const loading = addMessage("...", "bot");

  // 🚨 Modo crise
  if (detectarCrise(userText)) {
    const mensagemAjuda = `💛 Eu sinto muito que você esteja passando por isso.
Você não está sozinho(a).

📞 CVV: 188 (24h, gratuito, confidencial)  

Por favor, fale com alguém agora. Sua vida tem muito valor.`;
    await digitarRespostaTexto(mensagemAjuda, loading, 20);
    history.push({ role: "assistant", content: mensagemAjuda });
    lastBotMessages.push(mensagemAjuda);
    return;
  }

  // Modo normal
  const botResponse = await queryApi(userText);
  await digitarRespostaTexto(botResponse, loading, 18);

  history.push({ role: "assistant", content: botResponse });
  lastBotMessages.push(botResponse);
  if (lastBotMessages.length > 10) lastBotMessages.shift();
});

// -----------------------------
// Botão limpar conversa
// -----------------------------
clearBtn.addEventListener("click", () => {
  chatWindow.innerHTML = "";
  history.length = 0;
  lastBotMessages.length = 0;
  addMessage("Conversa limpinha ✨ Bora recomeçar do zero!", "bot");
});
