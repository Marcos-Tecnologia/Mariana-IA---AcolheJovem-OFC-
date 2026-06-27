const API_URL = "/api/chat";

const CONVERSATIONS_KEY = "maxi_conversations_v1";
const ACTIVE_CONVERSATION_KEY = "maxi_active_conversation_v1";
const THEME_KEY = "maxi_theme_v1";
const MEMORY_KEY = "maxi_memory_profile_v1";
const STYLE_KEY = "maxi_style_mode_v1";

const OLD_CONVERSATION_KEYS = [
  "maxi_conversations_v1",
  "maxi_history",
  "maxi_messages",
  "aurora_history_v1_5",
  "aurora_history",
  "aurora_conversations_v1",
  "conversations",
  "history"
];

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Maxi, uma IA inteligente criada pela empresa MA (R). " +
    "Seu objetivo é ajudar em pesquisas, estudos, dúvidas, tarefas do dia a dia, dicas práticas e criação de ideias. " +
    "Responda de forma clara, útil e natural. Use pelo menos 1 emoji em todas as mensagens. " +
    "Seja moderna, simples de entender e evite repetir frases. " +
    "Use a memória do usuário de forma natural. Não diga que está usando memória toda hora. " +
    "Se perceber um gosto, projeto ou objetivo antigo do usuário, pode fazer uma recomendação curta no final. " +
    "Nunca dê diagnósticos médicos. Em situações graves, recomende ajuda profissional."
};

const STYLE_PROMPTS = {
  rapido: {
    label: "⚡ Rápido",
    prompt:
      "MODO RÁPIDO ATIVADO. Responda com velocidade, clareza e objetividade. " +
      "Use respostas curtas, diretas e fáceis de entender. Use no máximo 4 linhas na maioria das respostas. " +
      "Se o usuário pedir código, documento, atividade ou algo completo, entregue completo mesmo assim."
  },
  avancado: {
    label: "🧠 Avançado",
    prompt:
      "MODO AVANÇADO ATIVADO. Responda com mais profundidade, organização e qualidade. " +
      "Explique alternativas, vantagens, desvantagens e recomendações quando fizer sentido."
  },
  pesquisa: {
    label: "🌐 Pesquisa",
    prompt:
      "MODO PESQUISA ATIVADO. Organize a resposta como pesquisa clara e confiável. " +
      "Não invente fontes, datas, links ou dados atuais. Avise quando algo precisar ser confirmado online."
  },
  estudo: {
    label: "📚 Estudo",
    prompt:
      "MODO ESTUDO ATIVADO. Aja como tutora paciente e didática. Explique passo a passo, com exemplos simples. " +
      "Ensine, não apenas responda. Quando fizer sentido, dê dica de memorização ou mini exercício."
  },
  professor: {
    label: "👩‍🏫 Professor",
    prompt:
      "MODO PROFESSOR ATIVADO. Ajude professores a criar planos de aula, atividades, dinâmicas, projetos, avaliações, jogos educativos e rubricas. " +
      "Organize com objetivo, materiais, passo a passo, tempo estimado e avaliação quando fizer sentido."
  },
  atividade: {
    label: "📝 Atividade",
    prompt:
      "MODO ATIVIDADE ATIVADO. Ajude em atividades escolares explicando o raciocínio. " +
      "Não entregue apenas a resposta seca; mostre o caminho."
  }
};

let conversations = [];
let activeConversationId = null;
let memoryProfile = null;
let currentStyle = "rapido";

/* ===== INICIALIZAÇÃO SEGURA ===== */

function iniciarMaxiComSeguranca() {
  try {
    conversations = carregarConversas();
    activeConversationId = carregarConversaAtiva();
    memoryProfile = carregarMemoria();
    currentStyle = carregarEstilo();

    aplicarTemaSalvo();
    garantirConversaInicial();
    renderConversationList();
    atualizarTextoModoAtual();
    atualizarBotoesEstilo();
    conectarBotoes();

    console.log("Maxi iniciada com sucesso.");
  } catch (erro) {
    console.error("Erro ao iniciar Maxi:", erro);
    conectarBotoesBasicos();
  }
}

/* ===== RECUPERAÇÃO DE CONVERSAS ===== */

function carregarConversas() {
  const principal = lerConversasDaChave(CONVERSATIONS_KEY);

  if (principal.length > 0) {
    return principal;
  }

  for (const key of OLD_CONVERSATION_KEYS) {
    const recuperadas = lerConversasDaChave(key);

    if (recuperadas.length > 0) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(recuperadas));
      return recuperadas;
    }
  }

  return [];
}

function lerConversasDaChave(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return [];

      if (parsed[0] && parsed[0].messages) {
        return parsed.map(normalizarConversa).filter(Boolean);
      }

      if (parsed[0] && parsed[0].role && parsed[0].content) {
        return [
          {
            id: gerarId(),
            title: "Conversa recuperada",
            messages: parsed.map(normalizarMensagem).filter(Boolean),
            updatedAt: new Date().toISOString()
          }
        ];
      }
    }

    if (parsed && Array.isArray(parsed.messages)) {
      return [
        {
          id: gerarId(),
          title: parsed.title || "Conversa recuperada",
          messages: parsed.messages.map(normalizarMensagem).filter(Boolean),
          updatedAt: parsed.updatedAt || new Date().toISOString()
        }
      ];
    }

    return [];
  } catch {
    return [];
  }
}

function normalizarConversa(conv) {
  if (!conv) return null;

  return {
    id: conv.id || gerarId(),
    title: conv.title || conv.name || "Conversa recuperada",
    messages: Array.isArray(conv.messages)
      ? conv.messages.map(normalizarMensagem).filter(Boolean)
      : [],
    updatedAt: conv.updatedAt || conv.createdAt || new Date().toISOString()
  };
}

function normalizarMensagem(msg) {
  if (!msg) return null;

  return {
    role: msg.role === "assistant" ? "assistant" : msg.role === "user" ? "user" : "assistant",
    content: msg.content || msg.text || msg.message || "",
    type: msg.type || undefined,
    prompt: msg.prompt || "",
    url: msg.url || "",
    animated: !!msg.animated,
    logo: !!msg.logo,
    logoName: msg.logoName || "",
    originalText: msg.originalText || "",
    createdAt: msg.createdAt || new Date().toISOString()
  };
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

/* ===== ESTILO ===== */

function carregarEstilo() {
  const saved = localStorage.getItem(STYLE_KEY);
  if (saved && STYLE_PROMPTS[saved]) return saved;
  return "rapido";
}

function salvarEstilo(style) {
  if (!STYLE_PROMPTS[style]) return;

  currentStyle = style;
  localStorage.setItem(STYLE_KEY, style);
  atualizarTextoModoAtual();
  atualizarBotoesEstilo();

  const chatAberto = document.getElementById("chat-container");
  const estaAberto = chatAberto && !chatAberto.classList.contains("hidden");

  if (estaAberto) {
    adicionarMensagem("Maxi", `Modo ${STYLE_PROMPTS[style].label} ativado ✨`, "maxi", new Date().toISOString());
  }
}

function atualizarTextoModoAtual() {
  const el = document.getElementById("modo-atual");
  if (el) el.textContent = STYLE_PROMPTS[currentStyle]?.label || "⚡ Rápido";
}

function atualizarBotoesEstilo() {
  document.querySelectorAll(".style-btn").forEach(btn => {
    const style = btn.getAttribute("data-style-choice");
    btn.classList.toggle("active-style", style === currentStyle);
  });
}

function criarPromptEstilo() {
  return {
    role: "system",
    content: STYLE_PROMPTS[currentStyle]?.prompt || STYLE_PROMPTS.rapido.prompt
  };
}

function abrirEstilo() {
  const modal = document.getElementById("estilo-modal");
  if (modal) modal.classList.remove("hidden");
  atualizarBotoesEstilo();
}

function fecharEstilo() {
  const modal = document.getElementById("estilo-modal");
  if (modal) modal.classList.add("hidden");
}

/* ===== MEMÓRIA ===== */

function carregarMemoria() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);

    if (!raw) {
      return {
        interests: [],
        projects: [],
        preferences: [],
        recentTopics: []
      };
    }

    const parsed = JSON.parse(raw);

    return {
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
      recentTopics: Array.isArray(parsed.recentTopics) ? parsed.recentTopics : []
    };
  } catch {
    return {
      interests: [],
      projects: [],
      preferences: [],
      recentTopics: []
    };
  }
}

function salvarMemoria() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memoryProfile));
}

function adicionarUnico(lista, valor, limite = 12) {
  if (!valor) return;
  const limpo = valor.trim();
  if (!limpo) return;

  const existe = lista.some(item => item.toLowerCase() === limpo.toLowerCase());
  if (!existe) lista.unshift(limpo);
  if (lista.length > limite) lista.length = limite;
}

function atualizarMemoriaComTexto(texto) {
  const t = normalizarTexto(texto);

  const interesses = [
    ["maquiagem", "maquiagem"],
    ["makeup", "maquiagem"],
    ["loja", "loja / negócio"],
    ["anuncio", "anúncios"],
    ["marketing", "marketing"],
    ["logo", "logo / identidade visual"],
    ["site", "criação de site"],
    ["wix", "Wix"],
    ["github", "GitHub"],
    ["vercel", "Vercel"],
    ["estudo", "estudos"],
    ["atividade escolar", "atividades escolares"],
    ["imagem", "criação de imagens"],
    ["cena animada", "cenas animadas"],
    ["video", "vídeos / cenas animadas"],
    ["python", "programação em Python"],
    ["html", "HTML/CSS/JS"],
    ["css", "HTML/CSS/JS"],
    ["javascript", "JavaScript"],
    ["roblox", "Roblox Studio"],
    ["jogo", "criação de jogos"],
    ["ia", "inteligência artificial"],
    ["professor", "ferramentas para professores"],
    ["aula", "criação de aulas"],
    ["restaurante", "restaurante / comida"],
    ["cardapio", "restaurante / cardápio"]
  ];

  interesses.forEach(([chave, valor]) => {
    if (t.includes(normalizarTexto(chave))) adicionarUnico(memoryProfile.interests, valor);
  });

  const preferencias = [
    ["resumido", "prefere respostas resumidas"],
    ["curto", "prefere respostas curtas"],
    ["codigo completo", "prefere código completo"],
    ["código completo", "prefere código completo"],
    ["sem mudar", "prefere manter o visual/função principal"],
    ["bonito", "gosta de visual bonito"],
    ["profissional", "gosta de estilo profissional"],
    ["rosa", "gosta de tema rosa"],
    ["azul", "gosta de tema azul"]
  ];

  preferencias.forEach(([chave, valor]) => {
    if (t.includes(normalizarTexto(chave))) adicionarUnico(memoryProfile.preferences, valor);
  });

  adicionarUnico(memoryProfile.recentTopics, texto.slice(0, 80), 10);
  salvarMemoria();
}

function criarPromptMemoria() {
  const partes = [];

  if (memoryProfile.interests.length) {
    partes.push("Interesses percebidos do usuário: " + memoryProfile.interests.join(", ") + ".");
  }

  if (memoryProfile.projects.length) {
    partes.push("Projetos percebidos do usuário: " + memoryProfile.projects.join(", ") + ".");
  }

  if (memoryProfile.preferences.length) {
    partes.push("Preferências percebidas: " + memoryProfile.preferences.join(", ") + ".");
  }

  if (memoryProfile.recentTopics.length) {
    partes.push("Assuntos recentes: " + memoryProfile.recentTopics.slice(0, 5).join(" | ") + ".");
  }

  return {
    role: "system",
    content:
      partes.length === 0
        ? "Ainda não há memória suficiente sobre o usuário. Responda normalmente."
        : "Memória local da Maxi sobre o usuário. Use apenas para personalizar respostas e recomendações curtas, sem ser invasiva. " +
          partes.join(" ")
  };
}

/* ===== TEMA ===== */

function aplicarTema(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function aplicarTemaSalvo() {
  const theme = localStorage.getItem(THEME_KEY) || document.body.getAttribute("data-theme") || "rosa";
  document.body.setAttribute("data-theme", theme);
}

/* ===== CONVERSAS ===== */

function gerarId() {
  return "conv_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function criarNovaConversa() {
  const id = gerarId();

  conversations.unshift({
    id,
    title: "Nova conversa",
    messages: [],
    updatedAt: new Date().toISOString()
  });

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
    criarNovaConversa();
    return;
  }

  activeConversationId = conversations[0].id;

  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();
  renderChat();
}

function garantirConversaInicial() {
  if (conversations.length === 0) {
    conversations.push({
      id: gerarId(),
      title: "Nova conversa",
      messages: [],
      updatedAt: new Date().toISOString()
    });

    activeConversationId = conversations[0].id;
    salvarConversas();
    salvarConversaAtiva();
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

function renderConversationList() {
  const list = document.getElementById("conversation-list");
  if (!list) return;

  list.innerHTML = "";

  conversations.forEach(conv => {
    const item = document.createElement("div");
    item.className = "conversation-item" + (conv.id === activeConversationId ? " active" : "");

    const last = conv.messages[conv.messages.length - 1];

    let previewMessage = "Sem mensagens ainda";

    if (last) {
      if (last.type === "image") {
        previewMessage = last.logo ? "Logo criada/editada" : last.animated ? "Cena animada gerada" : "Imagem gerada";
      } else {
        previewMessage = last.content || "Mensagem";
      }
    }

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
      adicionarMidiaNaTela(
        msg.prompt,
        msg.url,
        msg.createdAt,
        msg.animated,
        false,
        msg.logo,
        msg.originalText || msg.prompt
      );
    } else {
      adicionarMensagem(
        msg.role === "assistant" ? "Maxi" : "Você",
        msg.content,
        msg.role === "assistant" ? "maxi" : "user",
        msg.createdAt
      );
    }
  });

  rolarParaBaixo();
}

/* ===== UI ===== */

function abrirChat() {
  const inicio = document.getElementById("inicio-container");
  const chat = document.getElementById("chat-container");

  if (inicio) inicio.classList.add("hidden");
  if (chat) chat.classList.remove("hidden");

  rolarParaBaixo();
}

function abrirConfig() {
  const modal = document.getElementById("config-modal");
  if (modal) modal.classList.remove("hidden");
}

function fecharConfig() {
  const modal = document.getElementById("config-modal");
  if (modal) modal.classList.add("hidden");
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

  const strong = document.createElement("strong");
  strong.textContent = remetente;

  const span = document.createElement("span");
  span.textContent = texto || "";

  const time = document.createElement("div");
  time.className = "msg-time";
  time.textContent = hora;

  div.appendChild(strong);
  div.appendChild(span);
  div.appendChild(time);

  if (tipo !== "user") {
    div.appendChild(criarReacao());
  }

  box.appendChild(div);
  rolarParaBaixo();

  return div;
}

function criarReacao() {
  const reaction = document.createElement("div");
  reaction.className = "msg-reactions";
  reaction.innerHTML = `<span>🤍</span>`;

  reaction.onclick = () => {
    const span = reaction.querySelector("span");
    span.textContent = span.textContent === "🤍" ? "❤️" : "🤍";
  };

  return reaction;
}

function mostrarCarregando(tipo = "mensagem") {
  const box = document.getElementById("chat-box");
  if (!box) return null;

  removerCarregando();

  let texto = "Maxi está pensando";
  if (tipo === "imagem") texto = "Gerando imagem";
  if (tipo === "cena") texto = "Criando cena animada";
  if (tipo === "logo") texto = "Criando logo profissional";

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
  rolarParaBaixo();

  return wrapper;
}

function removerCarregando() {
  const el = document.getElementById("maxi-loading");
  if (el) el.remove();
}

async function escreverTextoAnimado(remetente, texto, createdAt) {
  const box = document.getElementById("chat-box");
  if (!box) return;

  const div = adicionarMensagem(remetente, "", "maxi", createdAt);
  if (!div) return;

  const span = div.querySelector("span");
  let i = 0;

  return new Promise(resolve => {
    const intervalo = setInterval(() => {
      span.textContent = texto.slice(0, i + 1);
      i++;
      rolarParaBaixo();

      if (i >= texto.length) {
        clearInterval(intervalo);
        resolve();
      }
    }, 16);
  });
}

/* ===== IMAGEM ===== */

function detectarTipoVisual(texto) {
  const t = normalizarTexto(texto);

  if (
    t.includes("logo") ||
    t.includes("logotipo") ||
    t.includes("marca") ||
    t.includes("banner com texto") ||
    t.includes("cartaz com texto")
  ) {
    return "logo";
  }

  if (
    t.includes("cena animada") ||
    t.includes("mini video") ||
    t.includes("video fake") ||
    t.includes("visual animado") ||
    t.includes("imagem animada")
  ) {
    return "cena";
  }

  if (
    t.includes("crie uma imagem") ||
    t.includes("criar uma imagem") ||
    t.includes("gere uma imagem") ||
    t.includes("gerar uma imagem") ||
    t.includes("faca uma imagem") ||
    t.includes("fazer uma imagem") ||
    t.includes("imagem de") ||
    t.includes("desenhe") ||
    t.includes("desenhar")
  ) {
    return "imagem";
  }

  return null;
}

function limparPromptVisual(texto) {
  return texto
    .replace(/crie uma imagem de/gi, "")
    .replace(/crie uma imagem/gi, "")
    .replace(/criar uma imagem de/gi, "")
    .replace(/criar uma imagem/gi, "")
    .replace(/gere uma imagem de/gi, "")
    .replace(/gere uma imagem/gi, "")
    .replace(/gerar uma imagem de/gi, "")
    .replace(/gerar uma im
