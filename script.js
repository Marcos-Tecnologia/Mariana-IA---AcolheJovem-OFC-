const API_URL = "/api/chat";
const CONVERSATIONS_KEY = "maxi_conversations_v1";
const ACTIVE_CONVERSATION_KEY = "maxi_active_conversation_v1";
const THEME_KEY = "maxi_theme_v1";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Maxi, uma IA inteligente criada pela empresa MA (R). " +
    "Seu objetivo é ajudar em pesquisas, estudos, dúvidas, tarefas do dia a dia, dicas práticas e criação de ideias. " +
    "Responda de forma clara, útil e natural, com no máximo 4 linhas na maioria das respostas. " +
    "Use pelo menos 1 emoji em todas as mensagens. " +
    "Seja moderna, simples de entender e evite repetir frases. " +
    "Você pode ajudar com estudos, pesquisas, explicações, criatividade, organização, dúvidas e conselhos práticos. " +
    "Quando fizer sentido, pode oferecer um versículo bíblico curto de forma suave e respeitosa. " +
    "Não seja excessivamente emocional, mas seja educada, amigável e prestativa. " +
    "Nunca dê diagnósticos médicos. Em situações graves, recomende ajuda profissional."
};

let conversations = carregarConversas();
let activeConversationId = carregarConversaAtiva();

function carregarConversas() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
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
    conversations.unshift({
      id,
      title: "Nova conversa",
      messages: [],
      updatedAt: new Date().toISOString()
    });
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
  return limpo.length > 30 ? limpo.slice(0, 30) + "..." : limpo;
}

function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
        ? (conv.messages[conv.messages.length - 1].type === "image"
            ? "Imagem / cena gerada"
            : conv.messages[conv.messages.length - 1].content)
        : "Sem mensagens ainda";

    item.innerHTML = `
      <div class="conversation-title">${escapeHtml(conv.title)}</div>
      <div class="conversation-preview">${escapeHtml(String(previewMessage).slice(0, 60))}</div>
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
    if (msg.type === "image") {
      adicionarImagemNaTela(msg.prompt, msg.url, msg.createdAt, msg.animated);
    } else {
      adicionarMensagem(
        msg.role === "assistant" ? "Maxi" : "Você",
        msg.content,
        msg.role === "assistant" ? "maxi" : "user",
        msg.createdAt
      );
    }
  });
}

function adicionarMensagem(remetente, texto, tipo = "maxi", createdAt = null) {
  const box = document.getElementById("chat-box");
  if (!box) return null;

  const agora = createdAt ? new Date(createdAt) : new Date();
  const hora =
    agora.getHours().toString().padStart(2, "0") +
    ":" +
    agora.getMinutes().toString().padStart(2, "0");

  const div = document.createElement("div");
  div.className = `msg ${tipo === "user" ? "msg-user" : "msg-maxi"}`;

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

function mostrarCarregando(tipo = "mensagem") {
  const box = document.getElementById("chat-box");
  if (!box) return null;

  removerCarregando();

  let texto = "Maxi está pensando";

  if (tipo === "imagem") texto = "Gerando imagem";
  if (tipo === "cena") texto = "Criando cena animada";

  const wrapper = document.createElement("div");
  wrapper.className = "typing-wrapper";
  wrapper.id = "maxi-loading";

  wrapper.innerHTML = `
    <div class="typing-bubble">
      <span class="typing-label">${texto}</span>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
  return wrapper;
}

function removerCarregando() {
  const el = document.getElementById("maxi-loading");
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
  div.className = "msg msg-maxi";
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

  return new Promise(resolve => {
    const intervalo = setInterval(() => {
      span.innerHTML = escapeHtml(texto.slice(0, i + 1));
      i++;
      box.scrollTop = box.scrollHeight;

      if (i >= texto.length) {
        clearInterval(intervalo);
        resolve();
      }
    }, 16);
  });
}

function escolherVozFemininaCalma() {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  return (
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
    null
  );
}

function falar(texto) {
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = "pt-BR";
  utter.rate = 0.84;
  utter.pitch = 1.02;
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

function detectarTipoVisual(texto) {
  const t = texto.toLowerCase();

  const cena =
    t.includes("cena animada") ||
    t.includes("mini vídeo") ||
    t.includes("mini video") ||
    t.includes("vídeo fake") ||
    t.includes("video fake");

  if (cena) return "cena";

  const imagem =
    t.includes("crie uma imagem") ||
    t.includes("criar uma imagem") ||
    t.includes("gere uma imagem") ||
    t.includes("gerar uma imagem") ||
    t.includes("faça uma imagem") ||
    t.includes("fazer uma imagem") ||
    t.includes("imagem de") ||
    t.includes("desenhe") ||
    t.includes("desenhar");

  if (imagem) return "imagem";

  return null;
}

function limparPromptVisual(texto) {
  return texto
    .replace(/crie uma cena animada de/gi, "")
    .replace(/crie uma cena animada/gi, "")
    .replace(/gerar cena animada de/gi, "")
    .replace(/gerar cena animada/gi, "")
    .replace(/gere uma cena animada de/gi, "")
    .replace(/gere uma cena animada/gi, "")
    .replace(/mini vídeo de/gi, "")
    .replace(/mini video de/gi, "")
    .replace(/crie uma imagem de/gi, "")
    .replace(/crie uma imagem/gi, "")
    .replace(/criar uma imagem de/gi, "")
    .replace(/criar uma imagem/gi, "")
    .replace(/gere uma imagem de/gi, "")
    .replace(/gere uma imagem/gi, "")
    .replace(/gerar uma imagem de/gi, "")
    .replace(/gerar uma imagem/gi, "")
    .replace(/faça uma imagem de/gi, "")
    .replace(/faça uma imagem/gi, "")
    .replace(/fazer uma imagem de/gi, "")
    .replace(/fazer uma imagem/gi, "")
    .replace(/imagem de/gi, "")
    .replace(/desenhe/gi, "")
    .replace(/desenhar/gi, "")
    .trim();
}

function criarUrlImagem(prompt, animated = false) {
  const extra = animated
    ? ", cena cinematográfica, movimento suave, visual bonito, alta qualidade"
    : ", estilo bonito, alta qualidade, cores harmoniosas, visual agradável";

  const promptFinal = prompt + extra;

  return "https://image.pollinations.ai/prompt/" + encodeURIComponent(promptFinal);
}

function adicionarImagemNaTela(prompt, url, createdAt = null, animated = false) {
  const box = document.getElementById("chat-box");
  if (!box) return;

  const agora = createdAt ? new Date(createdAt) : new Date();
  const hora =
    agora.getHours().toString().padStart(2, "0") +
    ":" +
    agora.getMinutes().toString().padStart(2, "0");

  const div = document.createElement("div");
  div.className = "msg msg-maxi";

  div.innerHTML = `
    <strong>Maxi</strong>
    <span>${animated ? "Cena animada criada para" : "Imagem criada para"}: ${escapeHtml(prompt)} 🎨</span>
    <img src="${url}" alt="Visual gerado pela Maxi" class="${animated ? "animated-scene-img" : "generated-image"}">
    <div class="msg-time">${hora}</div>
  `;

  const reaction = document.createElement("div");
  reaction.className = "msg-reactions";
  reaction.innerHTML = `<span>🤍</span>`;

  reaction.onclick = () => {
    const span = reaction.querySelector("span");
    span.textContent = span.textContent === "🤍" ? "❤️" : "🤍";
  };

  div.appendChild(reaction);

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function gerarVisualMaxi(textoUsuario, tipo) {
  const conv = getActiveConversation();
  if (!conv) return;

  const promptVisual = limparPromptVisual(textoUsuario) || textoUsuario;
  const animated = tipo === "cena";
  const createdAtUser = new Date().toISOString();

  if (conv.messages.length === 0) {
    conv.title = gerarTituloConversa((animated ? "Cena: " : "Imagem: ") + promptVisual);
  }

  conv.messages.push({
    role: "user",
    content: textoUsuario,
    createdAt: createdAtUser
  });

  conv.updatedAt = createdAtUser;

  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();

  adicionarMensagem("Você", textoUsuario, "user", createdAtUser);

  const createdAtMaxi = new Date().toISOString();
  const respostaTexto = animated
    ? "Beleza! Vou criar uma cena animada para você 🎬"
    : "Claro! Vou criar essa imagem para você 🎨";

  conv.messages.push({
    role: "assistant",
    content: respostaTexto,
    createdAt: createdAtMaxi
  });

  adicionarMensagem("Maxi", respostaTexto, "maxi", createdAtMaxi);

  mostrarCarregando(animated ? "cena" : "imagem");

  setTimeout(() => {
    removerCarregando();

    const url = criarUrlImagem(promptVisual, animated);
    const createdAtImage = new Date().toISOString();

    conv.messages.push({
      role: "assistant",
      type: "image",
      prompt: promptVisual,
      url,
      animated,
      createdAt: createdAtImage
    });

    conv.updatedAt = createdAtImage;

    if (conv.messages.length > 40) {
      conv.messages = conv.messages.slice(-40);
    }

    salvarConversas();
    renderConversationList();

    adicionarImagemNaTela(promptVisual, url, createdAtImage, animated);
    falar(animated ? "Prontinho, criei sua cena animada." : "Prontinho, criei sua imagem.");
  }, 1200);
}

async function enviarMensagem() {
  const input = document.getElementById("user-input");
  if (!input) return;

  const texto = input.value.trim();
  if (!texto) return;

  input.value = "";

  const tipoVisual = detectarTipoVisual(texto);

  if (tipoVisual) {
    await gerarVisualMaxi(texto, tipoVisual);
    return;
  }

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

  const mensagensParaEnviar = [
    SYSTEM_PROMPT,
    ...conv.messages
      .filter(m => !m.type)
      .map(m => ({
        role: m.role,
        content: m.content
      }))
  ];

  mostrarCarregando("mensagem");

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
    } catch {
      removerCarregando();
      adicionarMensagem("Maxi", "A resposta da IA veio inválida.");
      console.error("Resposta do backend não é JSON:", raw);
      return;
    }

    if (!resposta.ok) {
      removerCarregando();

      if (resposta.status === 402) {
        adicionarMensagem("Maxi", "Esse modelo está sem créditos no momento.");
      } else if (resposta.status === 429) {
        adicionarMensagem("Maxi", "Estou recebendo muitas mensagens agora. Tente de novo em instantes.");
      } else {
        adicionarMensagem("Maxi", `Erro da API (${resposta.status}).`);
      }

      console.error("Erro HTTP:", resposta.status, dados);
      return;
    }

    const respostaIA = dados.reply;

    if (!respostaIA) {
      removerCarregando();
      adicionarMensagem("Maxi", "A IA não retornou texto.");
      console.error("Sem reply:", dados);
      return;
    }

    const createdAtMaxi = new Date().toISOString();

    conv.messages.push({
      role: "assistant",
      content: respostaIA,
      createdAt: createdAtMaxi
    });

    if (conv.messages.length > 40) {
      conv.messages = conv.messages.slice(-40);
    }

    conv.updatedAt = createdAtMaxi;
    salvarConversas();
    renderConversationList();

    removerCarregando();
    await escreverTextoAnimado("Maxi", respostaIA, createdAtMaxi);
    falar(respostaIA);

  } catch (erro) {
    removerCarregando();
    console.error("Erro ao se comunicar com a IA:", erro);
    adicionarMensagem("Maxi", "Ocorreu um erro ao se comunicar com a IA.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  aplicarTemaSalvo();
  garantirConversaInicial();
  renderConversationList();

  const btnAbrir = document.getElementById("btn-abrir-chat");
  const btnEnviar = document.getElementById("btn-enviar");
  const btnNova = document.getElementById("btn-nova-conversa");
  const btnExcluir = document.getElementById("btn-excluir-conversa");
  const btnConfig = document.getElementById("btn-config");
  const btnFecharConfig = document.getElementById("btn-fechar-config");
  const input = document.getElementById("user-input");
  const themeButtons = document.querySelectorAll(".theme-btn");
  const modal = document.getElementById("config-modal");

  if (btnAbrir) btnAbrir.addEventListener("click", abrirChat);
  if (btnEnviar) btnEnviar.addEventListener("click", enviarMensagem);
  if (btnNova) btnNova.addEventListener("click", criarNovaConversa);
  if (btnExcluir) btnExcluir.addEventListener("click", excluirConversaAtual);
  if (btnConfig) btnConfig.addEventListener("click", abrirConfig);
  if (btnFecharConfig) btnFecharConfig.addEventListener("click", fecharConfig);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) fecharConfig();
    });
  }

  themeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme-choice");
      aplicarTema(theme);
    });
  });

  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
});
