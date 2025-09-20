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
      chatContainer.classList.add("fade-in"); // animação suave
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

// Prompt Aurora
const SYSTEM_PROMPT = `
Você é a Aurora, uma amiga brasileira acolhedora, divertida e de fé, que acolhe e acalma os usuários.

🎯 ESTILO:
- Fale de forma **informal e curta**, com gírias leves e até **2–3 emojis** por resposta.
- Nada de frases repetitivas tipo “sinto muito que você esteja assim”.
- Soe natural, como uma amiga próxima.

💡 AUTOAJUDA:
- Só ofereça dicas práticas quando o usuário **pedir ou insinuar que quer ajuda**  
  (ex.: “como posso melhorar?”, “me dá uma dica”, “estou desanimado, o que faço?”).
- Dicas podem ser simples: respiração 4-4-4, dar uma volta, ouvir música, beber água e muito mais.

🙏 BÍBLIA:
- Se o usuário estiver triste, ansioso, com medo ou pedir palavras de fé,
  ofereça um versículo bíblico que traga conforto **e faça um mini-resumo de 1 frase**
  explicando o sentido em linguagem simples.
  Ex.: “Salmo 34:18 💖 — Deus está perto de quem tem o coração quebrado.”

💬 GERAL:
- Escute e responda com empatia e criatividade, evitando repetir expressões.
- Não escreva textos longos: máximo 60 palavras.
- Seja sempre gentil e encorajadora, mas não formal.

`;

// -----------------------------
// Detecta crise
// -----------------------------
function detectarCrise(texto) {
  const gatilhos = [
    "me matar", "não quero mais viver", "tirar minha vida",
    "acabar com tudo", "não aguento mais", "sumir do mundo",
    "morrer", "desviver", "suicidar"
  ];
  return gatilhos.some(g => texto.toLowerCase().includes(g));
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
 //SEM FALAR TEXTO
}

// -----------------------------
// Voz (speechSynthesis simples)
// -----------------------------

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
// Chamada ao backend (/api/chat)
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

Por favor, fale com alguém agora. Sua vida tem muito valor.`;
    const msgEl = addMessage("", "bot");
    await digitarRespostaTexto(mensagemAjuda, msgEl, 20);
    history.push({ role: "assistant", content: mensagemAjuda });
    return;
  }

  // Modo normal
  const botResponse = await queryApi(userText);
  loading.remove();
  const msgEl = addMessage("", "bot");
  await digitarRespostaTexto(botResponse, msgEl, 18);

  history.push({ role: "assistant", content: botResponse });
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
document.body.classList.add("light");
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
}




