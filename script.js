const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const clearBtn = document.getElementById("clear-btn");

const SYSTEM_PROMPT = `
Você é a Aurora, uma IA acolhedora, que fala como uma amiga brasileira próxima.
Use um tom leve, simples e descontraído, do jeitinho brasileiro.
Responda de forma curta, sem formalidades, como em uma conversa de WhatsApp.
Pode usar emojis, gírias leves e expressões acolhedoras (tipo: "fica tranquilo", "relaxa", "tamo junto").
Não faça textos longos, apenas frases curtas e diretas.
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
      "Eita, deu ruim aqui 😅 tenta de novo!"
    );
  } catch (err) {
    console.error("Erro:", err);
    return "Vish, rolou um erro 😕";
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
  addMessage("Conversa limpinha ✨ Pode mandar outra!", "bot");
});
