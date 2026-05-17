const API_URL = "/api/chat";

const CONVERSATIONS_KEY = "maxi_conversations_v1";
const ACTIVE_CONVERSATION_KEY = "maxi_active_conversation_v1";
const THEME_KEY = "maxi_theme_v1";
const MEMORY_KEY = "maxi_memory_profile_v1";
const STYLE_KEY = "maxi_style_mode_v1";

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
    label: "Rápido",
    prompt: "Modo Rápido: responda curto, direto e objetivo. Use no máximo 4 linhas."
  },
  avancado: {
    label: "Avançado",
    prompt: "Modo Avançado: entregue uma resposta melhor, mais completa e organizada."
  },
  pesquisa: {
    label: "Pesquisa",
    prompt: "Modo Pesquisa: organize como pesquisa. Não invente fontes. Avise quando algo precisar ser confirmado na internet."
  },
  estudo: {
    label: "Estudo",
    prompt: "Modo Estudo: ensine passo a passo, como tutor, com exemplos simples."
  },
  professor: {
    label: "Professor",
    prompt: "Modo Professor: crie atividades, dinâmicas, planos de aula, jogos educativos e avaliações."
  },
  atividade: {
    label: "Atividade",
    prompt: "Modo Atividade: ajude em atividades escolares explicando o raciocínio, sem só dar resposta pronta."
  }
};

let conversations = carregarConversas();
let activeConversationId = carregarConversaAtiva();
let memoryProfile = carregarMemoria();
let currentStyle = carregarEstilo();

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
  if (el) el.textContent = STYLE_PROMPTS[currentStyle]?.label || "Rápido";
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

  const projetos = [
    ["maxi", "IA Maxi"],
    ["aurora", "antigo projeto Aurora"],
    ["minha loja", "loja do usuário"],
    ["loja makeup", "loja de maquiagem"],
    ["meu site", "site do usuário"],
    ["meu app", "app do usuário"],
    ["meu jogo", "jogo do usuário"],
    ["minha ia", "IA do usuário"],
    ["meu restaurante", "restaurante do usuário"]
  ];

  projetos.forEach(([chave, valor]) => {
    if (t.includes(normalizarTexto(chave))) adicionarUnico(memoryProfile.projects, valor);
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

  if (!partes.length) {
    return {
      role: "system",
      content: "Ainda não há memória suficiente sobre o usuário. Responda normalmente."
    };
  }

  return {
    role: "system",
    content:
      "Memória local da Maxi sobre o usuário. Use apenas para personalizar respostas e recomendações curtas, sem ser invasiva. " +
      partes.join(" ") +
      " Se fizer sentido, no final da resposta dê uma recomendação curta baseada nesses interesses."
  };
}

/* ===== BASE ===== */

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

function rolarParaBaixo() {
  const box = document.getElementById("chat-box");
  if (!box) return;
  box.scrollTop = box.scrollHeight;
}

/* ===== SEGURANÇA VISUAL ===== */

function normalizarTexto(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function verificarSegurancaVisual(texto) {
  const t = normalizarTexto(texto);

  const bloqueados = [
    "nudez",
    "nua",
    "nu ",
    "pelada",
    "pelado",
    "sem roupa",
    "calcinha",
    "sutia",
    "lingerie",
    "roupa intima",
    "bikini sensual",
    "biquini sensual",
    "sexy",
    "sensual",
    "erotico",
    "erotica",
    "porn",
    "porno",
    "pornografia",
    "adulto",
    "18+",
    "onlyfans",
    "strip",
    "stripper",
    "orgia",
    "sexo",
    "sexual",
    "peitos",
    "seios",
    "bunda",
    "genital",
    "genitais",
    "vagina",
    "penis",
    "estupr",
    "abuso sexual",
    "menor pelada",
    "crianca nua",
    "adolescente nua",
    "menina nua",
    "menino nu",
    "matando",
    "matar",
    "morreu",
    "morrendo",
    "morto",
    "morta",
    "assassinato",
    "assassinar",
    "assassino",
    "executando",
    "execucao",
    "esfaqueando",
    "facada",
    "tiroteio",
    "sangue extremo",
    "muito sangue",
    "gore",
    "mutilacao",
    "decapitacao",
    "cadaver",
    "tortura",
    "suicidio",
    "autoagressao",
    "massacre"
  ];

  return bloqueados.some(palavra => t.includes(palavra));
}

function responderBloqueioVisual(textoUsuario) {
  const conv = getActiveConversation();
  if (!conv) return;

  const createdAtUser = new Date().toISOString();

  if (conv.messages.length === 0) {
    conv.title = gerarTituloConversa(textoUsuario);
  }

  atualizarMemoriaComTexto(textoUsuario);

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

  const resposta =
    "Não posso criar imagem ou cena com conteúdo adulto, íntimo, violento ou impróprio 😅 Posso fazer uma versão segura, bonita e apropriada.";

  const createdAtMaxi = new Date().toISOString();

  conv.messages.push({
    role: "assistant",
    content: resposta,
    createdAt: createdAtMaxi
  });

  conv.updatedAt = createdAtMaxi;

  salvarConversas();
  renderConversationList();
  adicionarMensagem("Maxi", resposta, "maxi", createdAtMaxi);
}

/* ===== CONVERSAS ===== */

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
      adicionarMidiaNaTela(msg.prompt, msg.url, msg.createdAt, msg.animated, false, msg.logo);
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
  span.textContent = texto;

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

  const data = new Date(createdAt);

  const hora =
    data.getHours().toString().padStart(2, "0") +
    ":" +
    data.getMinutes().toString().padStart(2, "0");

  const div = document.createElement("div");
  div.className = "msg msg-maxi";

  const strong = document.createElement("strong");
  strong.textContent = remetente;

  const span = document.createElement("span");

  const time = document.createElement("div");
  time.className = "msg-time";
  time.textContent = hora;

  div.appendChild(strong);
  div.appendChild(span);
  div.appendChild(time);
  div.appendChild(criarReacao());

  box.appendChild(div);

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

function abrirChat() {
  const inicio = document.getElementById("inicio-container");
  const chat = document.getElementById("chat-container");

  if (inicio) inicio.classList.add("hidden");
  if (chat) chat.classList.remove("hidden");
}

/* ===== IMAGEM / LOGO / CENA ===== */

function detectarTipoVisual(texto) {
  const t = normalizarTexto(texto);

  const logo =
    t.includes("logo") ||
    t.includes("logotipo") ||
    t.includes("marca") ||
    t.includes("banner com texto") ||
    t.includes("cartaz com texto") ||
    t.includes("coloque a frase") ||
    t.includes("adicione a frase");

  if (logo) return "logo";

  const cena =
    t.includes("cena animada") ||
    t.includes("mini video") ||
    t.includes("video fake") ||
    t.includes("visual animado") ||
    t.includes("imagem animada");

  if (cena) return "cena";

  const imagem =
    t.includes("crie uma imagem") ||
    t.includes("criar uma imagem") ||
    t.includes("gere uma imagem") ||
    t.includes("gerar uma imagem") ||
    t.includes("faca uma imagem") ||
    t.includes("fazer uma imagem") ||
    t.includes("imagem de") ||
    t.includes("desenhe") ||
    t.includes("desenhar");

  if (imagem) return "imagem";

  const edicao =
    t.includes("adicione") ||
    t.includes("coloque") ||
    t.includes("mude") ||
    t.includes("troque") ||
    t.includes("deixe") ||
    t.includes("remove") ||
    t.includes("remova") ||
    t.includes("melhore");

  if (edicao && obterUltimaImagem()) return "imagem";

  return null;
}

function obterUltimaImagem() {
  const conv = getActiveConversation();
  if (!conv) return null;

  for (let i = conv.messages.length - 1; i >= 0; i--) {
    if (conv.messages[i].type === "image") return conv.messages[i];
  }

  return null;
}

function limparPromptVisual(texto) {
  return texto
    .replace(/crie uma cena animada de/gi, "")
    .replace(/crie uma cena animada/gi, "")
    .replace(/criar uma cena animada de/gi, "")
    .replace(/criar uma cena animada/gi, "")
    .replace(/gerar cena animada de/gi, "")
    .replace(/gerar cena animada/gi, "")
    .replace(/gere uma cena animada de/gi, "")
    .replace(/gere uma cena animada/gi, "")
    .replace(/mini vídeo de/gi, "")
    .replace(/mini video de/gi, "")
    .replace(/visual animado de/gi, "")
    .replace(/imagem animada de/gi, "")
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
    .replace(/crie uma logo de/gi, "")
    .replace(/crie uma logo/gi, "")
    .replace(/criar uma logo de/gi, "")
    .replace(/criar uma logo/gi, "")
    .replace(/logo de/gi, "")
    .trim();
}

function extrairNomeLogo(texto) {
  const original = texto.trim();

  const aspas = original.match(/["“”']([^"“”']+)["“”']/);
  if (aspas && aspas[1]) return aspas[1].trim();

  const chamada = original.match(/chamada\s+([a-zA-ZÀ-ÿ0-9\s]+)/i);
  if (chamada && chamada[1]) return chamada[1].trim().slice(0, 28);

  const nome = original.match(/nome\s+([a-zA-ZÀ-ÿ0-9\s]+)/i);
  if (nome && nome[1]) return nome[1].trim().slice(0, 28);

  if (normalizarTexto(original).includes("restaurante")) return "Sabor Real";
  if (normalizarTexto(original).includes("makeup") || normalizarTexto(original).includes("maquiagem")) return "Makeup Store";

  return "Minha Marca";
}

function detectarIconeLogo(texto) {
  const t = normalizarTexto(texto);

  if (t.includes("restaurante") || t.includes("prato") || t.includes("garfo") || t.includes("comida")) return "🍽️";
  if (t.includes("maquiagem") || t.includes("makeup") || t.includes("beleza")) return "💄";
  if (t.includes("jogo") || t.includes("game")) return "🎮";
  if (t.includes("tecnologia") || t.includes("ia") || t.includes("tech")) return "⚡";
  if (t.includes("pet") || t.includes("cachorro") || t.includes("gato")) return "🐾";
  if (t.includes("loja")) return "🛍️";

  return "✨";
}

function criarLogoSvgUrl(textoUsuario) {
  const nome = extrairNomeLogo(textoUsuario);
  const icone = detectarIconeLogo(textoUsuario);
  const t = normalizarTexto(textoUsuario);

  let cor1 = "#f28bb8";
  let cor2 = "#d97db4";
  let fundo = "#fff5fa";
  let texto = "#4e3d46";

  if (t.includes("restaurante") || t.includes("comida") || t.includes("garfo")) {
    cor1 = "#ff9f43";
    cor2 = "#d35400";
    fundo = "#fff7ec";
    texto = "#3d2a1a";
  }

  if (t.includes("azul")) {
    cor1 = "#7bb4f2";
    cor2 = "#4e83c7";
    fundo = "#eef7ff";
    texto = "#23384f";
  }

  if (t.includes("preto") || t.includes("luxo")) {
    cor1 = "#2b2b2b";
    cor2 = "#000000";
    fundo = "#f5f0e8";
    texto = "#1f1f1f";
  }

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${cor1}"/>
        <stop offset="100%" stop-color="${cor2}"/>
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#000" flood-opacity="0.18"/>
      </filter>
    </defs>

    <rect width="1024" height="768" rx="70" fill="${fundo}"/>
    <circle cx="512" cy="285" r="155" fill="url(#g)" filter="url(#shadow)"/>
    <text x="512" y="325" text-anchor="middle" font-size="120" font-family="Arial, sans-serif">${icone}</text>

    <text x="512" y="520" text-anchor="middle"
      font-size="72" font-weight="800"
      font-family="Inter, Segoe UI, Arial, sans-serif"
      fill="${texto}">${escapeSvg(nome)}</text>

    <text x="512" y="585" text-anchor="middle"
      font-size="30" font-weight="500"
      font-family="Inter, Segoe UI, Arial, sans-serif"
      fill="${texto}" opacity="0.72">criado com Maxi</text>
  </svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function escapeSvg(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function detectarEstiloImagem(texto) {
  const t = normalizarTexto(texto);

  if (t.includes("anime")) return "anime style, clean line art, vibrant colors, expressive lighting";
  if (t.includes("realista") || t.includes("realismo") || t.includes("fotorealista")) return "photorealistic, realistic lighting, detailed textures";
  if (t.includes("3d") || t.includes("render")) return "3D render, soft studio lighting, detailed 3D style";
  if (t.includes("cartoon") || t.includes("desenho animado")) return "cartoon style, friendly shapes, colorful, clean illustration";
  if (t.includes("pixel art") || t.includes("pixel")) return "pixel art style, retro game aesthetic";
  if (t.includes("fofo") || t.includes("cute") || t.includes("kawaii")) return "cute kawaii style, soft colors, adorable design";
  if (t.includes("logo")) return "modern logo design, clean vector style, minimal, centered composition";

  return "beautiful digital art, polished composition, soft lighting, high quality";
}

function melhorarPromptImagem(promptOriginal, animated = false) {
  const estilo = detectarEstiloImagem(promptOriginal);

  const base = [
    promptOriginal,
    estilo,
    "high quality",
    "sharp details",
    "balanced composition",
    "beautiful lighting",
    "harmonious colors",
    "visually appealing",
    "safe for all audiences",
    "no text",
    "no watermark"
  ];

  if (animated) {
    base.push(
      "cinematic animated scene",
      "soft camera movement feeling",
      "dynamic atmosphere",
      "gentle motion impression"
    );
  }

  return base.join(", ");
}

function criarUrlImagem(prompt, animated = false, tentativa = 0) {
  const promptFinal = melhorarPromptImagem(prompt, animated);
  const seed = Math.floor(Math.random() * 999999) + tentativa;
  const width = tentativa >= 2 ? 768 : 1024;
  const height = tentativa >= 2 ? 512 : 768;

  return (
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(promptFinal) +
    "?width=" +
    width +
    "&height=" +
    height +
    "&seed=" +
    seed +
    "&nologo=true&model=flux"
  );
}

function adicionarMidiaNaTela(prompt, url, createdAt = null, animated = false, salvar = true, logo = false) {
  const box = document.getElementById("chat-box");
  if (!box) return;

  const agora = createdAt ? new Date(createdAt) : new Date();

  const hora =
    agora.getHours().toString().padStart(2, "0") +
    ":" +
    agora.getMinutes().toString().padStart(2, "0");

  const card = document.createElement("div");
  card.className = "media-card";

  const strong = document.createElement("strong");
  strong.textContent = "Maxi";

  const texto = document.createElement("span");
  texto.textContent = logo
    ? `Logo criada para: ${prompt} ✨`
    : animated
      ? `Cena animada criada para: ${prompt} 🎬`
      : `Imagem criada para: ${prompt} 🎨`;

  const frame = document.createElement("div");
  frame.className = "media-frame";

  const img = document.createElement("img");
  img.alt = logo ? "Logo gerada pela Maxi" : animated ? "Cena animada gerada pela Maxi" : "Imagem gerada pela Maxi";
  img.className = animated ? "animated-scene-img" : "generated-image";

  if (logo) {
    img.src = url;
    img.onload = () => rolarParaBaixo();
  } else {
    let tentativa = 0;
    const maxTentativas = 4;

    function tentarCarregar() {
      const novaUrl = criarUrlImagem(prompt, animated, tentativa);
      img.src = novaUrl;

      texto.textContent =
        tentativa === 0
          ? animated
            ? `Cena animada criada para: ${prompt} 🎬`
            : `Imagem criada para: ${prompt} 🎨`
          : `Tentando carregar novamente... (${tentativa + 1}/${maxTentativas}) 🔄`;
    }

    img.onload = () => {
      texto.textContent = animated
        ? `Cena animada criada para: ${prompt} 🎬`
        : `Imagem criada para: ${prompt} 🎨`;

      rolarParaBaixo();

      if (salvar) {
        const conv = getActiveConversation();
        if (conv) {
          for (let i = conv.messages.length - 1; i >= 0; i--) {
            if (conv.messages[i].type === "image" && conv.messages[i].prompt === prompt) {
              conv.messages[i].url = img.src;
              salvarConversas();
              break;
            }
          }
        }
      }
    };

    img.onerror = () => {
      tentativa++;

      if (tentativa < maxTentativas) {
        setTimeout(tentarCarregar, 800);
      } else {
        texto.textContent =
          "Não consegui carregar a imagem agora. O servidor de imagem pode estar instável ⚠️ Tente novamente em alguns instantes.";
      }
    };

    tentarCarregar();
  }

  frame.appendChild(img);

  const time = document.createElement("div");
  time.className = "msg-time";
  time.textContent = hora;

  card.appendChild(strong);
  card.appendChild(texto);
  card.appendChild(frame);
  card.appendChild(time);
  card.appendChild(criarReacao());

  box.appendChild(card);
  rolarParaBaixo();
}

async function gerarVisualMaxi(textoUsuario, tipo) {
  const conv = getActiveConversation();
  if (!conv) return;

  if (verificarSegurancaVisual(textoUsuario)) {
    responderBloqueioVisual(textoUsuario);
    return;
  }

  atualizarMemoriaComTexto(textoUsuario);

  let promptVisual = limparPromptVisual(textoUsuario) || textoUsuario;
  const ultimaImagem = obterUltimaImagem();

  if (ultimaImagem && tipo !== "logo") {
    const t = normalizarTexto(textoUsuario);
    const ehEdicao =
      t.includes("adicione") ||
      t.includes("coloque") ||
      t.includes("mude") ||
      t.includes("troque") ||
      t.includes("deixe") ||
      t.includes("melhore") ||
      t.includes("remova") ||
      t.includes("remove");

    if (ehEdicao) {
      promptVisual = `${ultimaImagem.prompt}, edição solicitada: ${textoUsuario}`;
    }
  }

  const animated = tipo === "cena";
  const logo = tipo === "logo";
  const createdAtUser = new Date().toISOString();

  if (conv.messages.length === 0) {
    conv.title = gerarTituloConversa((logo ? "Logo: " : animated ? "Cena: " : "Imagem: ") + promptVisual);
  }

  conv.messages.push({
    role: "user",
    content: textoUsuario,
    createdAt: createdAtUser
  });

  conv.updatedAt = createdAtUser;

  salvarConversas();
  salvarConversaAtiva();

  adicionarMensagem("Você", textoUsuario, "user", createdAtUser);

  const createdAtMaxi = new Date().toISOString();

  const respostaTexto = logo
    ? "Claro! Vou criar uma logo com texto mais correto para você ✨"
    : animated
      ? "Certo! Vou criar uma cena animada visual para você 🎬"
      : "Claro! Vou criar essa imagem para você 🎨";

  conv.messages.push({
    role: "assistant",
    content: respostaTexto,
    createdAt: createdAtMaxi
  });

  adicionarMensagem("Maxi", respostaTexto, "maxi", createdAtMaxi);
  renderConversationList();

  mostrarCarregando(logo ? "logo" : animated ? "cena" : "imagem");

  setTimeout(() => {
    removerCarregando();

    const createdAtImage = new Date().toISOString();
    const url = logo ? criarLogoSvgUrl(textoUsuario) : criarUrlImagem(promptVisual, animated, 0);

    conv.messages.push({
      role: "assistant",
      type: "image",
      content: logo ? "Logo gerada" : animated ? "Cena animada gerada" : "Imagem gerada",
      prompt: logo ? extrairNomeLogo(textoUsuario) : promptVisual,
      url,
      animated,
      logo,
      createdAt: createdAtImage
    });

    conv.updatedAt = createdAtImage;

    if (conv.messages.length > 40) {
      conv.messages = conv.messages.slice(-40);
    }

    salvarConversas();
    renderConversationList();

    adicionarMidiaNaTela(logo ? extrairNomeLogo(textoUsuario) : promptVisual, url, createdAtImage, animated, true, logo);
  }, 1200);
}

/* ===== ENVIO NORMAL ===== */

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

  atualizarMemoriaComTexto(texto);

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
    criarPromptEstilo(),
    criarPromptMemoria(),
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
  } catch (erro) {
    removerCarregando();
    console.error("Erro ao se comunicar com a IA:", erro);
    adicionarMensagem("Maxi", "Ocorreu um erro ao se comunicar com a IA.");
  }
}

/* ===== DOM ===== */

window.addEventListener("DOMContentLoaded", () => {
  aplicarTemaSalvo();
  garantirConversaInicial();
  renderConversationList();
  atualizarTextoModoAtual();
  atualizarBotoesEstilo();

  const btnAbrir = document.getElementById("btn-abrir-chat");
  const btnEnviar = document.getElementById("btn-enviar");
  const btnNova = document.getElementById("btn-nova-conversa");
  const btnExcluir = document.getElementById("btn-excluir-conversa");
  const btnConfig = document.getElementById("btn-config");
  const btnFecharConfig = document.getElementById("btn-fechar-config");
  const btnEstilo = document.getElementById("btn-estilo");
  const btnFecharEstilo = document.getElementById("btn-fechar-estilo");
  const input = document.getElementById("user-input");
  const themeButtons = document.querySelectorAll(".theme-btn");
  const styleButtons = document.querySelectorAll(".style-btn");
  const modal = document.getElementById("config-modal");
  const estiloModal = document.getElementById("estilo-modal");
  const chatBox = document.getElementById("chat-box");

  if (btnAbrir) btnAbrir.addEventListener("click", abrirChat);
  if (btnEnviar) btnEnviar.addEventListener("click", enviarMensagem);
  if (btnNova) btnNova.addEventListener("click", criarNovaConversa);
  if (btnExcluir) btnExcluir.addEventListener("click", excluirConversaAtual);
  if (btnConfig) btnConfig.addEventListener("click", abrirConfig);
  if (btnFecharConfig) btnFecharConfig.addEventListener("click", fecharConfig);
  if (btnEstilo) btnEstilo.addEventListener("click", abrirEstilo);
  if (btnFecharEstilo) btnFecharEstilo.addEventListener("click", fecharEstilo);

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) fecharConfig();
    });
  }

  if (estiloModal) {
    estiloModal.addEventListener("click", e => {
      if (e.target === estiloModal) fecharEstilo();
    });
  }

  themeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme-choice");
      aplicarTema(theme);
    });
  });

  styleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const style = btn.getAttribute("data-style-choice");
      salvarEstilo(style);
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

  if (chatBox) {
    chatBox.addEventListener("wheel", e => {
      e.stopPropagation();
    });
  }
});
