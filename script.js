// -----------------------------
// Intro → Chat
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
      chatContainer.classList.add("fade-in"); // animação no chat
    }, 1000); // espera o fade-out acabar (1s)
  });
}

// -----------------------------
// Chat principal
// -----------------------------
const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const clearBtn = document.getElementById("clear-btn");

const SYSTEM_PROMPT = `
Você é a Aurora, uma amiga brasileira que fala simples e no jeitinho.
Responda curto, informal, com carinho e até emojis.
Pode usar frases como "fica tranquilo", "relaxa", "tamo junto".
Evite textos longos. Seja calorosa, do jeitinho brasileiro. ❤️
`;

// -----------------------------
// UI
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
// Fala ASMR calma
// -----------------------------
function falarTexto(texto) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";

  // Voz mais calma e devagar
  utterance.rate = 0.8;
  utterance.pitch = 0.9;
  utterance.volume = 1.0;

  // Tenta achar voz feminina em PT-BR
  const vozes = window.speechSynthesis.getVoices();
  const vozPt = vozes.find(v => v.lang.startsWith("pt") && v.name.toLowerCase().includes("female"));
  if (vozPt) utterance.voice = vozPt;

  window.speechSynthesis.speak(utterance);
}

// -----------------------------
// Chamada ao backend
// -----------------------------
async function queryApi(userMessage) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT.trim() },
          { role: "user", content: userMessage }
        ]
      })
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

  addMessage(userText, "user");
  input.value = "";
  const loading = addMessage("...", "bot");

  const botResponse = await queryApi(userText);
  await digitarRespostaTexto(botResponse, loading, 20);
});

// -----------------------------
// Botão limpar conversa
// -----------------------------
clearBtn.addEventListener("click", () => {
  chatWindow.innerHTML = "";
  addMessage("Conversa limpinha ✨ Pode falar comigo de novo 😄", "bot");
});
