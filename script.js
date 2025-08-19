const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");

// Configuração inicial
const systemPrompt = `
Você é a Marina, uma inteligência artificial de apoio emocional.
Sempre responda com empatia, carinho e calma.
Se o usuário falar em suicídio ou querer se matar, diga que ele não está sozinho(a),
passe o contato do CVV (188) e de uma psicóloga local.
`;

// ==========================
// Voz
// ==========================
let vozFemininaPtBr = null;

function selecionarVozPtBr() {
  const vozes = window.speechSynthesis.getVoices();
  const preferidas = ["Maria", "Helena", "Luciana", "Camila", "Vitória"];
  vozFemininaPtBr = vozes.find(
    (voz) =>
      voz.lang.toLowerCase().startsWith("pt") &&
      preferidas.some((nome) => voz.name.toLowerCase().includes(nome.toLowerCase()))
  );
  if (!vozFemininaPtBr) {
    vozFemininaPtBr = vozes.find((voz) => voz.lang.toLowerCase().startsWith("pt"));
  }
}

window.speechSynthesis.onvoiceschanged = selecionarVozPtBr;

function falarTexto(texto) {
  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  if (vozFemininaPtBr) utterance.voice = vozFemininaPtBr;
  utterance.rate = 0.85;
  utterance.pitch = 1.05;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ==========================
// Funções de chat
// ==========================
function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function digitarRespostaTexto(texto, elemento) {
  elemento.textContent = "";
  for (let i = 0; i < texto.length; i++) {
    elemento.textContent += texto.charAt(i);
    await new Promise((r) => setTimeout(r, 25));
  }
}

function detectarCriseGrave(texto) {
  const gatilhos = [
    "quero me matar",
    "não quero mais viver",
    "vou tirar minha vida",
    "não aguento mais",
    "pensando em suicídio",
    "morrer",
    "acabar com tudo",
    "desviver",
    "sumir",
    "tirar a vida"
  ];
  const textoMinusculo = texto.toLowerCase();
  return gatilhos.some((frase) => textoMinusculo.includes(frase));
}

// ==========================
// Conectar com API (backend Vercel)
// ==========================
async function queryApi(userMessage) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (err) {
    console.error("Erro:", err);
    return "Desculpe, ocorreu um erro ao tentar responder.";
  }
}

// ==========================
// Evento de envio do formulário
// ==========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;
  addMessage(userText, "user");
  input.value = "";

  addMessage("...", "bot");
  const loadingMsg = chatWindow.querySelector(".message.bot:last-child");

  // Caso de crise
  if (detectarCriseGrave(userText)) {
    const mensagemAjuda = `Sinto muito que você esteja se sentindo assim 💛  
Você não está sozinho(a).  
📞 Psicóloga local: (99) 99999-9999  
📞 CVV - 188 (24h, gratuito)  

Estou com você. Respire fundo, estou aqui para ouvir.`;
    await digitarRespostaTexto(mensagemAjuda, loadingMsg);
    falarTexto(mensagemAjuda);
    return;
  }

  // Chamar API normalmente
  const botResponse = await queryApi(userText);
  await digitarRespostaTexto(botResponse, loadingMsg);
  falarTexto(botResponse);
});
