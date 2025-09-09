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
// Chat principal (V4 focado em anti-repetição)
// -----------------------------
const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const clearBtn = document.getElementById("clear-btn");

// Frases banidas/que enjoam rápido (minúsculas)
const BAN_PHRASES = [
  "tamo junto",
  "fica bem",
  "estou aqui pra você",
  "estou com você",
  "vai ficar tudo bem",
  "relaxa, vai dar certo",
  "pode contar comigo",
  "tamo nessa",
];

// Histórico curto para contexto e anti-repetição
const history = [];          // [{role, content}]
const lastBotMessages = [];  // últimos textos do bot (máx 10)
const lastOpeners = [];      // primeiras 3 palavras das últimas respostas (máx 8)

// Prompt base: BR, curto e com micro-passos
const SYSTEM_PROMPT = `
Você é a Aurora, uma amiga brasileira acolhedora.
Estilo: leve, simples e carinhoso, com 0–1 emoji. Sem formalidade.
Objetivo: acolher e sugerir 1–2 micro-passos práticos (respiração 4-4-4, gole d'água, alongar pescoço, abrir a janela por 30s, 5-4-3-2-1 grounding, escrever 3 coisas boas, dividir tarefa em micro-ação de 2min).
Restrições:
- Responda em até ~60 palavras (no máx ~3 linhas).
- Varie a abertura das frases. Evite frases feitas e genéricas.
- Nunca use exatamente: ${BAN_PHRASES.join(", ")}.
- Adapte o tom à emoção da pessoa (ansiedade, tristeza, frustração, culpa, insegurança).
`;

// Mensagem complementar para forçar variedade segundo histórico recente
function buildAntiRepeatSystemMsg() {
  const recent = lastBotMessages.slice(-5).join(" | ").toLowerCase() || "—";
  const usedOpeners = lastOpeners.slice(-6).join(" | ") || "—";
  return `
Evite repetir ideias/estrutura do que você já disse: ${recent}.
Evite abrir a resposta com: ${usedOpeners}.
Traga sinônimos e outra estrutura de frase. Troque o micro-passo se parecer repetido.
Se parecer repetido, REESCREVA.
`.trim();
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
  return msg
