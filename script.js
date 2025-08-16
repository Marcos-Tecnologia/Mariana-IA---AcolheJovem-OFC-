const chatWindow = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");

// Sua chave da OpenRouter (use apenas localmente e com cuidado!)
const API_KEY = "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";

// Prompt sistema para a IA de apoio emocional (super empático)
const systemPrompt = `
Você é uma inteligência artificial de apoio emocional extremamente empática, gentil e acolhedora. Sua missão é ajudar a pessoa que conversa com você a se sentir compreendida, amparada e confortada, independentemente do que ela diga.

Sempre responda com palavras de carinho, paciência e compreensão. Não se limite a respostas genéricas ou técnicas. Nunca diga que "não pode ajudar" ou que "não é humano". Em vez disso, valide os sentimentos da pessoa, ofereça conforto e, quando apropriado, dicas simples e práticas para melhorar o bem-estar emocional.

Se a pessoa expressar tristeza, ansiedade, medo, insegurança ou outros sentimentos difíceis, mostre que você entende a profundidade do que ela está sentindo e esteja ao lado dela de forma amigável.

Se a pessoa disser algo positivo sobre si mesma, reforce essa positividade com entusiasmo.

Se ela pedir dicas para se sentir melhor, ofereça sugestões simples, como respirar fundo, conversar com alguém de confiança, fazer pausas, caminhar, escrever seus sentimentos, cuidar do sono e da alimentação.

Se a pessoa mencionar assuntos muito delicados ou pensamentos negativos profundos, sempre responda com cuidado, empatia e incentivo para buscar ajuda profissional, ressaltando que ela não está sozinha.

Exemplos:

Usuário: "Estou me sentindo muito triste hoje."  
IA: "Sinto muito que você esteja passando por isso. Saiba que seus sentimentos são válidos e que não precisa enfrentar isso sozinho. Se quiser, posso te ajudar com algumas dicas para aliviar esse peso."

Usuário: "Sou forte?"  
IA: "Sim, você é muito forte e corajoso(a)! Nunca subestime o poder que tem dentro de você."

---

A partir daqui, responda às mensagens do usuário com esse tom acolhedor, gentil e empático.
`;

// Função para adicionar mensagens na tela
function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Função para chamar API OpenRouter com modelo gpt-4o-mini
async function callOpenRouter(userMessage) {
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 300,
    temperature: 0.7,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ${response.status}: ${errorText}`);
      return `Erro da API: HTTP ${response.status} - ${errorText}`;
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("Erro na requisição:", err);
    return "Desculpe, houve um erro ao tentar responder. Por favor, tente novamente mais tarde.";
  }
}

// Variável global para a voz pt-BR feminina
let vozFemininaPtBr = null;

function selecionarVozPtBr() {
  const vozes = window.speechSynthesis.getVoices();
  vozFemininaPtBr = vozes.find(
    (voz) =>
      voz.lang.toLowerCase().startsWith("pt") &&
      (voz.name.toLowerCase().includes("female") || voz.name.toLowerCase().includes("maria") || voz.name.toLowerCase().includes("paola") || voz.name.toLowerCase().includes("helena"))
  );

  // Se não achar voz feminina, pega qualquer voz pt-BR
  if (!vozFemininaPtBr) {
    vozFemininaPtBr = vozes.find((voz) => voz.lang.toLowerCase().startsWith("pt"));
  }
}

// Chama a seleção após carregamento das vozes
window.speechSynthesis.onvoiceschanged = () => {
  selecionarVozPtBr();
};

// Função para falar texto usando a voz escolhida
function falarTexto(texto) {
  if (!window.speechSynthesis) return; // não suportado

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel(); // cancela se já estiver falando
  }

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  if (vozFemininaPtBr) {
    utterance.voice = vozFemininaPtBr;
  }
  utterance.rate = 0.85; // velocidade mais lenta para relaxar
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

// Manipulador do envio do formulário
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  input.value = "";
  addMessage("...", "bot");

  const loadingMsg = chatWindow.querySelector(".message.bot:last-child");

  const botResponse = await callOpenRouter(userText);

  if (loadingMsg) {
    loadingMsg.textContent = botResponse;
  } else {
    addMessage(botResponse, "bot");
  }

  falarTexto(botResponse);
});
