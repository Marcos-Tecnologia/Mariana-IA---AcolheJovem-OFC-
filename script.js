const API_URL = "/api/chat";
const HISTORY_KEY = "aurora_history_v1";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Aurora, uma IA de apoio emocional. Seja calma, acolhedora, respeitosa e empática. " +
    "Não dê diagnósticos médicos. Responda com cuidado. " +
    "Se houver menção de suicídio, autoagressão ou perigo imediato, recomende ajuda urgente e cite CVV 188 no Brasil."
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

function adicionarMensagem(remetente, texto) {
  const box = document.getElementById("chat-box");
  if (!box) {
    console.error("chat-box não encontrado");
    return;
  }

  const div = document.createElement("div");
  div.style.marginBottom = "10px";
  div.innerHTML = `<strong>${remetente}:</strong> ${escapeHtml(texto)}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  if (!input) {
    console.error("user-input não encontrado");
    return;
  }

  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem("Você", texto);
  input.value = "";

  const mensagensParaEnviar = [
    SYSTEM_PROMPT,
    ...historico,
    { role: "user", content: texto }
  ];

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
      adicionarMensagem("Aurora", "A resposta da IA veio inválida.");
      console.error("Resposta do backend não é JSON:", raw);
      return;
    }

    if (!resposta.ok) {
      adicionarMensagem("Aurora", `Erro da API (${resposta.status}).`);
      console.error("Erro HTTP:", resposta.status, dados);
      return;
    }

    const respostaIA = dados.reply;
    if (!respostaIA) {
      adicionarMensagem("Aurora", "A IA não retornou texto.");
      console.error("Sem reply:", dados);
      return;
    }

    adicionarMensagem("Aurora", respostaIA);
    falar(respostaIA);

    historico.push({ role: "user", content: texto });
    historico.push({ role: "assistant", content: respostaIA });
    limitarHistorico();
    salvarHistorico();

  } catch (erro) {
    console.error("Erro ao se comunicar com a IA:", erro);
    adicionarMensagem("Aurora", "Ocorreu um erro ao se comunicar com a IA.");
  }
}

function limparMemoriaAurora() {
  historico = [];
  localStorage.removeItem(HISTORY_KEY);

  const box = document.getElementById("chat-box");
  if (box) box.innerHTML = "";

  console.log("Memória da Aurora limpa");
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado");

  const btnAbrir = document.getElementById("btn-abrir-chat");
  const btnEnviar = document.getElementById("btn-enviar");
  const input = document.getElementById("user-input");

  if (!btnAbrir) {
    console.error("Botão btn-abrir-chat não encontrado");
  } else {
    btnAbrir.addEventListener("click", abrirChat);
  }

  if (!btnEnviar) {
    console.error("Botão btn-enviar não encontrado");
  } else {
    btnEnviar.addEventListener("click", enviarMensagem);
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
});
