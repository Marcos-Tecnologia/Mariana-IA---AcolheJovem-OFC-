const API_URL = "/api/chat";
const CONVERSATIONS_KEY = "aurora_conversations_v1";
const ACTIVE_CONVERSATION_KEY = "aurora_active_conversation_v1";
const THEME_KEY = "aurora_theme_v1";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Aurora, uma IA gentil, acolhedora e inteligente, criada pela empresa MA (R). " +

    "Seu objetivo é ajudar as pessoas no dia a dia, responder dúvidas, dar dicas úteis e também oferecer apoio emocional quando necessário. " +

    "REGRAS IMPORTANTES:\n" +
    "- Sempre responda de forma curta, no máximo 4 linhas.\n" +
    "- Sempre use pelo menos 1 emoji em TODAS as mensagens.\n" +
    "- Fale de forma humana, natural e acolhedora (como uma amiga calma).\n" +
    "- Evite repetir frases como 'sinto muito que você esteja assim' toda hora.\n" +
    "- Varie suas respostas.\n" +

    "COMPORTAMENTO:\n" +
    "- Ajude, dê dicas práticas e responda dúvidas normalmente.\n" +
    "- Se a pessoa estiver triste, console com carinho.\n" +
    "- De vez em quando (não sempre), inclua um versículo bíblico curto que combine com a situação.\n" +

    "SEGURANÇA:\n" +
    "- Nunca dê diagnósticos médicos.\n" +
    "- Se houver menção de autoagressão ou suicídio, responda com muito cuidado e incentive buscar ajuda (ex: CVV 188 no Brasil).\n" +

    "IDENTIDADE:\n" +
    "- Seu nome é Aurora.\n" +
    "- Você foi criada pela empresa MA (R).\n" +
    "- Só diga isso quando fizer sentido (não repita em toda resposta)."
};


let conversations = carregarConversas();
let activeConversationId = carregarConversaAtiva();

aplicarTemaSalvo();
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

function aplicarTema(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function aplicarTemaSalvo() {
  const theme = localStorage.getItem(THEME_KEY) || "rosa";
  document.body.setAttribute("data-theme", theme);
}

function abrirConfig() {
  const modal = document.getElementById("config-modal");
  if (modal) modal.classList.remove("hidden");
}

function fecharConfig() {
  const modal = document.getElementById("config-modal");
  if (modal) modal.classList.add("hidden");
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

function excluirConversaAtual() {
  const conv = getActiveConversation();

  if (!conv) {
    alert("Nenhuma conversa selecionada.");
    return;
  }

  const confirmar = confirm(`Deseja excluir a conversa "${conv.title}"?`);
  if (!confirmar) return;

  conversations = conversations.filter(c => c.id !== activeConversationId);

  if (conversations.length === 0) {
    const id = gerarId();
    const nova = {
      id,
      title: "Nova conversa",
      messages: [],
      updatedAt: new Date().toISOString()
    };
    conversations.unshift(nova);
    activeConversationId = id;
  } else {
    activeConversationId = conversations[0].id;
  }

  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();
  renderChat();
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

function escolherVozFemininaCalma() {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const voz =
    voices.find(v =>
      v.lang === "pt-BR" &&
      (
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("feminina") ||
        v.name.toLowerCase().includes("maria") ||
        v.name.toLowerCase().includes("helena") ||
        v.name.toLowerCase().includes("luciana")
      )
    ) ||
    voices.find(v => v.lang === "pt-BR") ||
    voices.find(v => v.lang && v.lang.startsWith("pt")) ||
    null;

  return voz;
}

function falar(texto) {
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = "pt-BR";
  utter.rate = 0.82;
  utter.pitch = 1.05;
  utter.volume = 1;

  const voz = escolherVozFemininaCalma();
  if (voz) utter.voice = voz;

  synth.speak(utter);
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {};
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
  const btnExcluir = document.getElementById("btn-excluir-conversa");
  const btnConfig = document.getElementById("btn-config");
  const btnFecharConfig = document.getElementById("btn-fechar-config");
  const input = document.getElementById("user-input");
  const themeButtons = document.querySelectorAll(".theme-btn");

  if (btnAbrir) btnAbrir.addEventListener("click", abrirChat);
  if (btnEnviar) btnEnviar.addEventListener("click", enviarMensagem);
  if (btnNova) btnNova.addEventListener("click", criarNovaConversa);
  if (btnExcluir) btnExcluir.addEventListener("click", excluirConversaAtual);
  if (btnConfig) btnConfig.addEventListener("click", abrirConfig);
  if (btnFecharConfig) btnFecharConfig.addEventListener("click", fecharConfig);

  themeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme-choice");
      aplicarTema(theme);
    });
  });

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
});
