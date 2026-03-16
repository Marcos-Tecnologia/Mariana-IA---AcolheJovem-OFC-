const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nousresearch/nous-capybara-7b";
const HISTORY_KEY = "aurora_history_prompt_key";

// pede a chave ao abrir a página
let API_KEY = sessionStorage.getItem("aurora_api_key");
if (!API_KEY) {
  API_KEY = prompt("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");
  if (API_KEY) {
    sessionStorage.setItem("aurora_api_key", API_KEY.trim());
  }
}

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

  if (vozPt) utter.voice = vozPt;

  synth.speak(utter);
}

function abrirChat() {
  console.log("Botão Conversar com Aurora clicado");

  const inicio = document.getElementById("inicio-container");
  const chat = document.getElementById("chat-container");

  if (!chat) {
    console.error("chat-container não encontrado");
    return;
  }

  if (inicio) inicio.classList.add("hidden");
  chat.classList.remove("hidden");
}

async function enviarMensagem() {
  const input = document.getElementById("user-input");
  if (!input) {
    console.error("user-input não encontrado");
    return;
  }

  const texto = input.value.trim();
  if (!texto) return;

  if (!API_KEY) {
    adicionarMensagem("Aurora", "Nenhuma chave da OpenRouter foi informada.");
    return;
  }

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
        "Authorization": "Bearer " + API_KEY,
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
    let dados;

    try {
      dados = JSON.parse(raw);
    } catch (e) {
      console.error("Resposta não JSON:", raw);
      adicionarMensagem("Aurora", "A resposta da IA veio inválida.");
      return;
    }

    if (!resposta.ok) {
      console.error("Erro HTTP:", resposta.status, dados);
      adicionarMensagem("Aurora", `Erro da API (${resposta.status}).`);
      return;
    }

    const respostaIA = dados?.choices?.[0]?.message?.content;
    if (!respostaIA) {
      console.error("Resposta sem conteúdo:", dados);
      adicionarMensagem("Aurora", "A IA não retornou texto.");
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
