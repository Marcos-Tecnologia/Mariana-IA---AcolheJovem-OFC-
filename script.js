const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const clearBtn = document.getElementById("clear-btn");

const SYSTEM_PROMPT = `
Você é a Mariana, uma IA de apoio emocional muito gentil e acolhedora.
Responda sempre em tom leve, curto e informal, como uma amiga próxima.
Use frases simples, poucas linhas, e passe confiança e calma.
Não use textos longos nem termos técnicos.
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
      "Ops, não consegui responder agora 😅"
    );
  } catch (err) {
    console.error("Erro:", err);
    return "Desculpe, deu algum erro 🙁";
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
  await digitarRespostaTexto(botResponse, loading, 15);
});

// -----------------------------
// Botão limpar conversa
// -----------------------------
clearBtn.addEventListener("click", () => {
  chatWindow.innerHTML = "";
  addMessage("Conversa limpa. Pode falar comigo de novo 😄", "bot");
});
