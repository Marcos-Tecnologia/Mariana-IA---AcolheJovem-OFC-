const API_URL = "/api/chat";
const HISTORY_KEY = "aurora_history_v1";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Aurora, uma IA gentil, humana e acolhedora. " +

    "Você ajuda as pessoas tanto emocionalmente quanto no dia a dia. " +
    "Responda dúvidas, dê dicas úteis e também ofereça apoio emocional quando necessário. " +

    "Suas respostas devem ser CURTAS, claras e naturais, como uma amiga conversando. " +
    "Evite textos longos. Prefira respostas diretas com no máximo 2 ou 3 frases. " +

    "Se a pessoa estiver triste, seja empática e reconfortante. " +
    "Se for uma dúvida, responda de forma simples e útil. " +

    "Evite repetir sempre as mesmas frases. Varie suas respostas. " +

    "Às vezes, quando fizer sentido, ofereça uma passagem bíblica de forma suave e respeitosa. " +
    "Nunca force religião. Use apenas quando apropriado. " +

    "Faça pequenas perguntas para continuar a conversa quando necessário. " +

    "Nunca dê diagnósticos médicos. " +

    "Se houver menção de suicídio ou autoagressão, responda com cuidado e sugira ajuda profissional como o CVV (188 no Brasil)."
};

let historico = carregarHistorico();

function carregarHistorico() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Erro ao carregar histórico:", e);
    return [];
  }
}

function salvarHistorico() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
}

function limitarHistorico() {
  if (historico.length > 20) {
    historico = historico.slice(-20);
    salvarHistorico();
  }
}

function escapeHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function adicionarMensagem(remetente, texto, tipo = "aurora") {
  const box = document.getElementById("chat-box");
  if (!box) return null;

  const div = document.createElement("div");
  div.className = `msg ${tipo === "user" ? "msg-user" : "msg-aurora"}`;
  div.innerHTML = `<strong>${remetente}</strong><span>${escapeHtml(texto)}</span>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function mostrarDigitando() {
  const box = document.getElementById("chat-box");
  if (!box) return null;

  removerDigitando();

  const wrapper = document.createElement("div");
  wrapper.className = "typing-wrapper";
  wrapper.id = "aurora-typing";

  wrapper.innerHTML = `
    <div class="typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
  return wrapper;
}

function removerDigitando() {
  const el = document.getElementById("aurora-typing");
  if (el) el.remove();
}

async function escreverTextoAnimado(remetente, texto) {
  const box = document.getElementById("chat-box");
  if (!box) return;

  const div = document.createElement("div");
  div.className = "msg msg-aurora";
  div.innerHTML = `<strong>${remetente}</strong><span></span>`;
  box.appendChild(div);

  const span = div.querySelector("span");
  let i = 0;

  return new Promise((resolve) => {
    const intervalo = setInterval(() => {
      span.innerHTML = escapeHtml(texto.slice(0, i + 1));
      i++;
      box.scrollTop = box.scrollHeight;

      if (i >= texto.length) {
        clearInterval(intervalo);
        resolve();
      }
    }, 18);
  });
}

function falar(texto) {
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = "pt-BR";
  utter.rate = 0.88;
  utter.pitch = 1;
  utter.volume = 1;

  const voices = synth.getVoices();
  const vozPt =
    voices.find(v => v.lang === "pt-BR") ||
    voices.find(v => v.lang && v.lang.startsWith("pt"));

  if (vozPt) {
    utter.voice = vozPt;
  }

  synth.speak(utter);
}

function abrirChat() {
  const inicio = document.getElementById("inicio-container");
  const chat = document.getElementById("chat-container");

  if (inicio) inicio.classList.add("hidden");
  if (chat) chat.classList.remove("hidden");
}

async function enviarMensagem() {
  const input = document.getElementById("user-input");
  if (!input) return;

  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem("Você", texto, "user");
  input.value = "";

  const mensagensParaEnviar = [
    SYSTEM_PROMPT,
    ...historico,
    { role: "user", content: texto }
  ];

  mostrarDigitando();

  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: mensagensParaEnviar
      })
    });

    const raw = await resposta.text();
    console.log("RAW /api/chat:", raw);

    let dados;
    try {
      dados = JSON.parse(raw);
    } catch (e) {
      removerDigitando();
      adicionarMensagem("Aurora", "A resposta da IA veio inválida.");
      console.error("Resposta do backend não é JSON:", raw);
      return;
    }

    if (!resposta.ok) {
      removerDigitando();

      if (resposta.status === 402) {
        adicionarMensagem("Aurora", "Esse modelo está sem créditos no momento.");
      } else if (resposta.status === 429) {
        adicionarMensagem("Aurora", "A Aurora está recebendo muitas mensagens agora. Tente novamente em instantes.");
      } else {
        adicionarMensagem("Aurora", `Erro da API (${resposta.status}).`);
      }

      console.error("Erro HTTP:", resposta.status, dados);
      return;
    }

    const respostaIA = dados.reply;
    if (!respostaIA) {
      removerDigitando();
      adicionarMensagem("Aurora", "A IA não retornou texto.");
      console.error("Sem reply:", dados);
      return;
    }

    historico.push({ role: "user", content: texto });
    historico.push({ role: "assistant", content: respostaIA });
    limitarHistorico();
    salvarHistorico();

    removerDigitando();
    await escreverTextoAnimado("Aurora", respostaIA);
    falar(respostaIA);

  } catch (erro) {
    removerDigitando();
    console.error("Erro ao se comunicar com a IA:", erro);
    adicionarMensagem("Aurora", "Ocorreu um erro ao se comunicar com a IA.");
  }
}

function limparMemoriaAurora() {
  historico = [];
  localStorage.removeItem(HISTORY_KEY);

  const box = document.getElementById("chat-box");
  if (box) box.innerHTML = "";
}

window.addEventListener("DOMContentLoaded", () => {
  const btnAbrir = document.getElementById("btn-abrir-chat");
  const btnEnviar = document.getElementById("btn-enviar");
  const input = document.getElementById("user-input");

  if (btnAbrir) btnAbrir.addEventListener("click", abrirChat);
  if (btnEnviar) btnEnviar.addEventListener("click", enviarMensagem);

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
});
