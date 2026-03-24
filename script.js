const API_URL = "/api/chat";
const CONVERSATIONS_KEY = "aurora_conversations_v1";
const ACTIVE_CONVERSATION_KEY = "aurora_active_conversation_v1";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Aurora, uma IA gentil, humana, acolhedora e útil no dia a dia. " +
    "Responda de forma curta, clara, humana e reconfortante. " +
    "Evite repetir sempre as mesmas frases. Varie as respostas. " +
    "Você pode consolar, responder dúvidas e dar dicas práticas. " +
    "Às vezes, quando fizer sentido, ofereça uma passagem bíblica de forma suave e respeitosa. " +
    "Nunca dê diagnósticos médicos. " +
    "Se houver menção de suicídio, autoagressão ou perigo imediato, recomende ajuda urgente e cite CVV 188 no Brasil."
};

let conversations = carregarConversas();
let activeConversationId = carregarConversaAtiva();

garantirConversaInicial();
renderConversationList();

function carregarConversas() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Erro ao carregar conversas:", e);
    return [];
  }
}

function salvarConversas() {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

function carregarConversaAtiva() {
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

function salvarConversaAtiva() {
  if (activeConversationId) {
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversationId);
  }
}

function gerarId() {
  return "conv_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function criarNovaConversa() {
  const id = gerarId();
  const nova = {
    id,
    title: "Nova conversa",
    messages: [],
    updatedAt: new Date().toISOString()
  };

  conversations.unshift(nova);
  activeConversationId = id;
  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();
  renderChat();
  abrirChat();
}

function garantirConversaInicial() {
  if (conversations.length === 0) {
    criarNovaConversa();
    return;
  }

  const existe = conversations.some(c => c.id === activeConversationId);
  if (!activeConversationId || !existe) {
    activeConversationId = conversations[0].id;
    salvarConversaAtiva();
  }

  renderChat();
}

function getActiveConversation() {
  return conversations.find(c => c.id === activeConversationId) || null;
}

function formatarHorario(dataIso) {
  const d = new Date(dataIso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function gerarTituloConversa(texto) {
  const limpo = texto.trim();
  if (!limpo) return "Nova conversa";
  return limpo.length > 28 ? limpo.slice(0, 28) + "..." : limpo;
}

function renderConversationList() {
  const list = document.getElementById("conversation-list");
  if (!list) return;

  list.innerHTML = "";

  conversations.forEach(conv => {
    const item = document.createElement("div");
    item.className = "conversation-item" + (conv.id === activeConversationId ? " active" : "");

    const previewMessage =
      conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content
        : "Sem mensagens ainda";

    item.innerHTML = `
      <div class="conversation-title">${escapeHtml(conv.title)}</div>
      <div class="conversation-preview">${escapeHtml(previewMessage.slice(0, 60))}</div>
      <div class="conversation-time">${formatarHorario(conv.updatedAt)}</div>
    `;

    item.addEventListener("click", () => {
      activeConversationId = conv.id;
      salvarConversaAtiva();
      renderConversationList();
      renderChat();
      abrirChat();
    });

    list.appendChild(item);
  });
}

function renderChat() {
  const box = document.getElementById("chat-box");
  if (!box) return;

  box.innerHTML = "";

  const conv = getActiveConversation();
  if (!conv) return;

  conv.messages.forEach(msg => {
    adicionarMensagem(
      msg.role === "assistant" ? "Aurora" : "Você",
      msg.content,
      msg.role === "assistant" ? "aurora" : "user",
      msg.createdAt
    );
  });
}

function escapeHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function adicionarMensagem(remetente, texto, tipo = "aurora", createdAt = null) {
  const box = document.getElementById("chat-box");
  if (!box) return null;

  const agora = createdAt ? new Date(createdAt) : new Date();
  const hora =
    agora.getHours().toString().padStart(2, "0") +
    ":" +
    agora.getMinutes().toString().padStart(2, "0");

  const div = document.createElement("div");
  div.className = `msg ${tipo === "user" ? "msg-user" : "msg-aurora"}`;

  div.innerHTML = `
    <strong>${remetente}</strong>
    <span>${escapeHtml(texto)}</span>
    <div class="msg-time">${hora}</div>
  `;

  if (tipo !== "user") {
    const reaction = document.createElement("div");
    reaction.className = "msg-reactions";
    reaction.innerHTML = `<span>🤍</span>`;
    reaction.onclick = () => {
      const span = reaction.querySelector("span");
      span.textContent = span.textContent === "🤍" ? "❤️" : "🤍";
    };
    div.appendChild(reaction);
  }

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

async function escreverTextoAnimado(remetente, texto, createdAt) {
  const box = document.getElementById("chat-box");
  if (!box) return;

  const data = new Date(createdAt);
  const hora =
    data.getHours().toString().padStart(2, "0") +
    ":" +
    data.getMinutes().toString().padStart(2, "0");

  const div = document.createElement("div");
  div.className = "msg msg-aurora";
  div.innerHTML = `
    <strong>${remetente}</strong>
    <span></span>
    <div class="msg-time">${hora}</div>
  `;
  box.appendChild(div);

  const reaction = document.createElement("div");
  reaction.className = "msg-reactions";
  reaction.innerHTML = `<span>🤍</span>`;
  reaction.onclick = () => {
    const span = reaction.querySelector("span");
    span.textContent = span.textContent === "🤍" ? "❤️" : "🤍";
  };
  div.appendChild(reaction);

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

  const conv = getActiveConversation();
  if (!conv) return;

  const createdAtUser = new Date().toISOString();

  if (conv.messages.length === 0) {
    conv.title = gerarTituloConversa(texto);
  }

  conv.messages.push({
    role: "user",
    content: texto,
    createdAt: createdAtUser
  });

  conv.updatedAt = createdAtUser;
  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();

  adicionarMensagem("Você", texto, "user", createdAtUser);
  input.value = "";

  const mensagensParaEnviar = [
    SYSTEM_PROMPT,
    ...conv.messages.map(m => ({
      role: m.role,
      content: m.content
    }))
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
        adicionarMensagem("Aurora", "A Aurora está recebendo muitas mensagens agora. Tente de novo em instantes.");
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

    const createdAtAurora = new Date().toISOString();

    conv.messages.push({
      role: "assistant",
      content: respostaIA,
      createdAt: createdAtAurora
    });

    if (conv.messages.length > 30) {
      conv.messages = conv.messages.slice(-30);
    }

    conv.updatedAt = createdAtAurora;
    salvarConversas();
    renderConversationList();

    removerDigitando();
    await escreverTextoAnimado("Aurora", respostaIA, createdAtAurora);
    falar(respostaIA);

  } catch (erro) {
    removerDigitando();
    console.error("Erro ao se comunicar com a IA:", erro);
    adicionarMensagem("Aurora", "Ocorreu um erro ao se comunicar com a IA.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const btnAbrir = document.getElementById("btn-abrir-chat");
  const btnEnviar = document.getElementById("btn-enviar");
  const btnNova = document.getElementById("btn-nova-conversa");
  const input = document.getElementById("user-input");

  if (btnAbrir) btnAbrir.addEventListener("click", abrirChat);
  if (btnEnviar) btnEnviar.addEventListener("click", enviarMensagem);
  if (btnNova) btnNova.addEventListener("click", criarNovaConversa);

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
});
