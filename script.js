// -----------------------------
// Intro → Chat (mantido)
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
// Chat principal (mantido + V4)
// -----------------------------
const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const clearBtn = document.getElementById("clear-btn");

// Frases que queremos evitar repetir
const BAN_PHRASES = [
  "tamo junto",
  "fica bem",
  "tamo junto, vou",
  "relaxa, vai dar certo",
  "estou aqui pra você",
  "conte comigo",
  "estou com você",
  "vai ficar tudo bem"
];

// guarda histórico curto pra dar contexto (evitar repetição e personalizar dicas)
const history = []; // {role, content}
const lastBotMessages = []; // só textos do bot

// Prompt base: curto, informal, BR, com micro-passos
const SYSTEM_PROMPT = `
Você é a Aurora, uma amiga brasileira acolhedora.
Estilo: leve, simples, carinhosa, sem formalidades. Pode usar emojis com moderação.
Objetivo: oferecer acolhimento + 1 ou 2 micro-passos práticos específicos ao que a pessoa disse (ex.: respiração 4-4-4, beber água, alongar pescoço, tomar ar, escrever 3 coisas boas, dividir tarefa em micro-passo de 2 minutos).
Regras de estilo:
- Respostas curtas (até ~3 linhas / ~60 palavras).
- Varie o começo das frases; evite frases feitas.
- Nada médico/diagnóstico. Sem “vai ficar tudo bem” genérico.
- Adapte o tom à emoção da pessoa (ansiedade, tristeza, frustração, culpa, insegurança).
`;

// Mensagem-guia para evitar repetição e criar variedade
function buildAntiRepeatSystemMsg() {
  // pegue até 5 últimas mensagens do bot
  const recent = lastBotMessages.slice(-5);
  const recentJoined = recent.join(" | ").toLowerCase();
  const banJoined = BAN_PHRASES.join(" | ");

  return `
Evite repetir frases/expressões usadas recentemente ou muito batidas.
Frases para evitar agora: ${banJoined}.
Resumo do que você já falou antes: ${recentJoined || "—"}.
Se perceber que está repetindo ideia, reformule com sinônimos e outra estrutura.
Varie aberturas (ex.: "entendo", "sacou", "peguei a visão", "pode respirar comigo?", "vamos por partes?").
Traga 1–2 micro-passos específicos (ex.: "experimenta 4 respirações 4–4–4", "toma um gole de água agora", "abre a janela por 30s", "escreve 1 frase que você diria a um amigo").
Finalize, se útil, com uma pergunta leve que puxe continuidade (1 linha).
`.trim();
}

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
// Fala ASMR calma (mantido)
// -----------------------------
function falarTexto(texto) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 0.8;   // devagar
  utterance.pitch = 0.9;  // levemente grave
  utterance.volume = 1.0;

  // tenta priorizar vozes femininas pt-BR (nomes comuns)
  const prefer = ["Maria", "Helena", "Luciana", "Camila", "Vitória", "Fernanda", "Isabela"];
  const voices = window.speechSynthesis.getVoices();
  let chosen = voices.find(v => v.lang.toLowerCase().startsWith("pt") && prefer.some(n => v.name.toLowerCase().includes(n.toLowerCase())));
  if (!chosen) chosen = voices.find(v => v.lang.toLowerCase().startsWith("pt"));
  if (chosen) utterance.voice = chosen;

  window.speechSynthesis.speak(utterance);
}

// -----------------------------
// Chamada ao backend (agora com contexto curto)
// -----------------------------
async function queryApi(userMessage) {
  try {
    // constrói o pacote de mensagens com contexto curto (últimas 3 trocas)
    const contextTail = history.slice(-6); // até 3 pares user/bot
    const messages = [
      { role: "system", content: SYSTEM_PROMPT.trim() },
      { role: "system", content: buildAntiRepeatSystemMsg() },
      ...contextTail,
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

  // adiciona no histórico e UI
  history.push({ role: "user", content: userText });
  addMessage(userText, "user");
  input.value = "";
  const loading = addMessage("...", "bot");

  const botResponse = await queryApi(userText);

  // mostra com digitação
  await digitarRespostaTexto(botResponse, loading, 18);

  // salva em histórico e na lista de últimas mensagens do bot (para anti-repetição)
  history.push({ role: "assistant", content: botResponse });
  lastBotMessages.push(botResponse);
  if (lastBotMessages.length > 10) lastBotMessages.shift(); // limita memória de repetição
});

// -----------------------------
// Botão limpar conversa (mantido)
// -----------------------------
clearBtn.addEventListener("click", () => {
  chatWindow.innerHTML = "";
  history.length = 0;
  lastBotMessages.length = 0;
  addMessage("Conversa limpinha ✨ Bora falar denovo!", "bot");
});
