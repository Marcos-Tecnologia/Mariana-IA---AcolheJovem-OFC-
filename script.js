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

// Prompt Aurora V5.2
const SYSTEM_PROMPT = `
Você é a Aurora, uma amiga brasileira acolhedora e calma.
Estilo: leve, simples e carinhoso, com 0–1 emoji. Sem formalidade.

Regras:
- Acolha sempre primeiro: ouça e valide os sentimentos do usuário.
- Só ofereça 1–2 micro-passos práticos **se o usuário pedir explicitamente uma dica ou ajuda** (ex.: "como posso me alegrar?", "me dá uma dica", "o que faço para melhorar?").
- Quando sugerir micro-passos, seja específico e curto (respiração 4-4-4, beber água, alongar pescoço, abrir janela, grounding 5-4-3-2-1).
- Se detectar uma crise grave (frases como "me matar", "acabar com tudo", "não aguento mais"), ative o protocolo de segurança: acolha, diga que a pessoa não está sozinha e ofereça contatos de ajuda (CVV 188 e psicóloga local).
- Evite frases repetitivas ou genéricas como: "tamo junto", "fica bem", "vai ficar tudo bem".
- Responda de forma curta (até 60 palavras), variando aberturas ("entendi", "sei como é", "poxa", "peguei a visão").
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
// Voz (speechSynthesis simples)
// -----------------------------
function falarTexto(texto) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 0.85;   // devagar
  utterance.pitch = 0.95;  // tom suave
  utterance.volume = 1.0;

  const prefer = ["Maria", "Helena", "Luciana", "Camila", "Vitória", "Fernanda", "Isabela"];
  const voices = window.speechSynthesis.getVoices();
  let chosen = voices.find(v => v.lang.toLowerCase().startsWith("pt") && prefer.some(n => v.name.toLowerCase().includes(n.toLowerCase())));
  if (!chosen) chosen = voices.find(v => v.lang.toLowerCase().startsWith("pt"));
  if (chosen) utterance.voice = chosen;

  window.speechSynthesis.speak(utterance);
}

// -----------------------------
// Animação: Aurora digitando
// -----------------------------
function mostrarDigitando() {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("message", "bot", "typing");
  typingDiv.innerHTML = `<span></span><span></span><span></span>`;
  chatWindow.appendChild(typingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return typingDiv;
}

// -----------------------------
// Chamada ao backend (Vercel /api/chat)
// -----------------------------
async function queryApi(userMessage) {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6),
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

  const loading = mostrarDigitando();

  // 🚨 Modo crise
  if (detectarCrise(userText)) {
    loading.remove();
    const mensagemAjuda = `💛 Eu sinto muito que você esteja passando por isso.
Você **não está sozinho(a)**.

📞 CVV: 188 (24h, gratuito, confidencial)  
📞 Psicóloga local: (99) 99999-9999  

Por favor, fale com alguém agora. Sua vida tem muito valor.`;
    const msgEl = addMessage("", "bot");
    await digitarRespostaTexto(mensagemAjuda, msgEl, 20);
    history.push({ role: "assistant", content: mensagemAjuda });
    lastBotMessages.push(mensagemAjuda);
    return;
  }

  // Modo normal
  const botResponse = await queryApi(userText);
  loading.remove();
  const msgEl = addMessage("", "bot");
  await digitarRespostaTexto(botResponse, msgEl, 18);

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

// -----------------------------
// Dark/Light Mode
// -----------------------------
document.body.classList.add("light"); // Tema inicial
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
}

