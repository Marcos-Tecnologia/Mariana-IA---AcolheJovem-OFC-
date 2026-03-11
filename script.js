const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nousresearch/nous-capybara-7b";

const HISTORY_KEY = "aurora_history_restore";

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
  if (!box) return;

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
  utter.rate = 0.9;
  utter.pitch = 1;
  utter.volume = 1;

  const voices = synth.getVoices();
  const vozPt =
    voices.find(v => v.lang === "pt-BR") ||
    voices.find(v => v.lang && v.lang.startsWith("pt"));

  if (vozPt) utter.voice = vozPt;

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
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Aurora"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: mensagensParaEnviar
      })
    });

    const raw = await resposta.text();
    console.log("Resposta bruta da API:", raw);

    let dados;
    try {
      dados = JSON.parse(raw);
    } catch (e) {
      adicionarMensagem("Aurora", "A resposta da IA veio inválida.");
      console.error("Resposta não JSON:", raw);
      return;
    }

    if (!resposta.ok) {
      adicionarMensagem("Aurora", `Erro da API (${resposta.status}).`);
      console.error("Erro HTTP:", resposta.status, dados);
      return;
    }

    const respostaIA = dados?.choices?.[0]?.message?.content;
    if (!respostaIA) {
      adicionarMensagem("Aurora", "A IA não retornou texto.");
      console.error("Resposta sem conteúdo:", dados);
      return;
    }

    adicionarMensagem("Aurora", respostaIA);
    falar(respostaIA);

    historico.push({ role: "user", content: texto });
    historico.push({ role: "assistant", content: respostaIA });
    limitarHistorico();
    salvarHistorico();

  } catch (erro) {
    adicionarMensagem("Aurora", "Ocorreu um erro ao se comunicar com a IA.");
    console.error("Erro de comunicação:", erro);
  }
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
