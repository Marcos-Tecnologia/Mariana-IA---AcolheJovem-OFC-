const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");

// Prompt do sistema que deixa a IA calma e acolhedora
const SYSTEM_PROMPT = `
Você é a Mariana, uma IA de apoio emocional, muito gentil e acolhedora.
Sempre responda com empatia, validação e calma.
Sugira passos simples como: respirar fundo, se hidratar, alongar, escrever coisas boas.
Não dê conselhos médicos. Responda em tom positivo e reconfortante.
`;

// -----------------------------
// UI: mensagens e digitação
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
// Função que chama o backend
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
    // aceita tanto { reply } quanto { choices[0].message.content }
    return (
      data.reply ??
      data?.choices?.[0]?.message?.content ??
      "Desculpe, não consegui responder agora."
    );
  } catch (err) {
    console.error("Erro:", err);
    return "Desculpe, houve um erro ao tentar responder.";
  }
}

// -----------------------------
// Formulário de envio
// -----------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  input.value = "";
  const loading = addMessage("...", "bot");

  // Chama a API
  const botResponse = await queryApi(userText);
  await digitarRespostaTexto(botResponse, loading, 20);
});
