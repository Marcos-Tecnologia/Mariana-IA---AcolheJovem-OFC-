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
    "Você pode ajudar com estudos, pesquisas, explicações, criatividade, organização, dúvidas e conselhos práticos. " +
    "Quando fizer sentido, pode oferecer um versículo bíblico curto de forma suave e respeitosa. " +
    "Use a memória do usuário de forma natural. Não diga que está usando memória toda hora. " +
    "Se perceber um gosto, projeto ou objetivo antigo do usuário, pode fazer uma recomendação curta no final. " +
    "Nunca dê diagnósticos médicos. Em situações graves, recomende ajuda profissional."
};

const STYLE_PROMPTS = {
  rapido: {
    label: "Rápido",
    prompt:
      "Modo Rápido: responda de forma curta, direta e objetiva. Use no máximo 4 linhas. Priorize velocidade, clareza e utilidade."
  },
  avancado: {
    label: "Avançado",
    prompt:
      "Modo Avançado: pense com mais cuidado e entregue uma resposta melhor, mais completa e organizada. Pode passar de 4 linhas se for necessário, mas sem enrolar."
  },
  pesquisa: {
    label: "Pesquisa",
    prompt:
      "Modo Pesquisa: responda como se estivesse organizando uma pesquisa. Explique com cuidado, cite pontos importantes e avise quando algo precisar ser confirmado na internet. Se não houver ferramenta real de busca conectada, seja transparente e não invente fontes."
  },
  estudo: {
    label: "Estudo",
    prompt:
      "Modo Estudo: ensine como um tutor. Explique passo a passo, use exemplos simples, faça analogias e ajude o usuário a aprender, não apenas copiar."
  },
  professor: {
    label: "Professor",
    prompt:
      "Modo Professor: ajude professores a criar atividades, dinâmicas, planos de aula, jogos educativos, projetos e avaliações de acordo com assunto, série e objetivo."
  },
  atividade: {
    label: "Atividade",
    prompt:
      "Modo Atividade: ajude em atividades escolares explicando o raciocínio. Não entregue apenas a resposta final quando for tarefa de aprendizado; ensine o caminho."
  }
};

let conversations = carregarConversas();
let activeConversationId = carregarConversaAtiva();
let memoryProfile = carregarMemoria();
let currentStyle = carregarEstilo();

/* ===== ESTILO DA MAXI ===== */

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

  const resposta = `Modo ${STYLE_PROMPTS[style].label} ativado ✨`;

  const chatAberto = document.getElementById("chat-container");
  const estaAberto = chatAberto && !chatAberto.classList.contains("hidden");

  if (estaAberto) {
    adicionarMensagem("Maxi", resposta, "maxi", new Date().toISOString());
  }
}

function atualizarTextoModoAtual() {
  const el = document.getElementById("modo-atual");
  if (el) el.textContent = STYLE_PROMPTS[currentStyle]?.label || "Rápido";
}

function atualizarBotoesEstilo() {
  const buttons = document.querySelectorAll(".style-btn");

  buttons.forEach(btn => {
    const style = btn.getAttribute("data-style-choice");

    if (style === currentStyle) {
      btn.classList.add("active-style");
    } else {
      btn.classList.remove("active-style");
    }
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

/* ===== MEMÓRIA INTELIGENTE ===== */

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
    ["anúncio", "anúncios"],
    ["marketing", "marketing"],
    ["logo", "logo / identidade visual"],
    ["site", "criação de site"],
    ["wix", "Wix"],
    ["github", "GitHub"],
    ["vercel", "Vercel"],
    ["estudo", "estudos"],
    ["prova", "estudos"],
    ["trabalho escolar", "trabalhos escolares"],
    ["atividade escolar", "atividades escolares"],
    ["imagem", "criação de imagens"],
    ["cena animada", "cenas animadas"],
    ["video", "vídeos / cenas animadas"],
    ["vídeo", "vídeos / cenas animadas"],
    ["python", "programação em Python"],
    ["html", "HTML/CSS/JS"],
    ["css", "HTML/CSS/JS"],
    ["javascript", "JavaScript"],
    ["roblox", "Roblox Studio"],
    ["jogo", "criação de jogos"],
    ["ia", "inteligência artificial"],
    ["professor", "ferramentas para professores"],
    ["aula", "criação de aulas"]
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
    ["minha ia", "IA do usuário"]
  ];

  projetos.forEach(([chave, valor]) => {
    if (t.includes(normalizarTexto(chave))) adicionarUnico(memoryProfile.projects, valor);
  });

  const preferencias = [
    ["resumido", "prefere respostas resumidas"],
    ["curto", "prefere respostas curtas"],
    ["completo", "prefere código completo"],
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

/* ===== FILTRO DE SEGURANÇA ===== */

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
        previewMessage = last.animated ? "Cena animada gerada" : "Imagem gerada";
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
      adicionarMidiaNaTela(msg.prompt, msg.url, msg.createdAt, msg.animated);
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
  if (tipo === "imagem") texto = "Gerando imagem melhorada";
  if (tipo === "cena") texto = "Criando cena animada melhorada";

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

/* ===== IMAGEM / CENA ===== */

function detectarTipoVisual(texto) {
  const t = normalizarTexto(texto);

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
    .trim();
}

function detectarEstiloImagem(texto) {
  const t = normalizarTexto(texto);

  if (t.includes("anime")) {
    return "anime style, clean line art, vibrant colors, expressive lighting";
  }

  if (t.includes("realista") || t.includes("realismo") || t.includes("fotorealista") || t.includes("foto realista")) {
    return "photorealistic, realistic lighting, natural colors, detailed textures";
  }

  if (t.includes("3d") || t.includes("render")) {
    return "3D render, soft studio lighting, smooth surfaces, detailed 3D style";
  }

  if (t.includes("cartoon") || t.includes("desenho animado")) {
    return "cartoon style, friendly shapes, colorful, clean illustration";
  }

  if (t.includes("pixel art") || t.includes("pixel")) {
    return "pixel art style, crisp pixels, retro game aesthetic, detailed pixel scene";
  }

  if (t.includes("cinematic") || t.includes("cinematografico") || t.includes("cinematográfico")) {
    return "cinematic style, dramatic lighting, beautiful composition, high detail";
  }

  if (t.includes("fofo") || t.includes("cute") || t.includes("kawaii")) {
    return "cute kawaii style, soft colors, adorable design, friendly atmosphere";
  }

  if (t.includes("logo")) {
    return "modern logo design, clean vector style, minimal, centered composition";
  }

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
    "clean background when appropriate",
    "visually appealing",
    "no text",
    "no watermark",
    "safe for all audiences"
  ];

  if (animated) {
    base.push(
      "cinematic animated scene",
      "soft camera movement feeling",
      "dynamic atmosphere",
      "gentle motion impression",
      "mini video frame look"
    );
  }

  return base.join(", ");
}

function criarUrlImagem(prompt, animated = false) {
  const promptFinal = melhorarPromptImagem(prompt, animated);
  const seed = Math.floor(Math.random() * 999999);

  return (
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(promptFinal) +
    "?width=1024&height=768&seed=" +
    seed +
    "&nologo=true"
  );
}

function adicionarMidiaNaTela(prompt, url, createdAt = null, animated = false) {
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
  texto.textContent = animated
    ? `Cena animada melhorada criada para: ${prompt} 🎬`
    : `Imagem melhorada criada para: ${prompt} 🎨`;

  const frame = document.createElement("div");
  frame.className = "media-frame";

  const img = document.createElement("img");
  img.src = url;
  img.alt = animated ? "Cena animada gerada pela Maxi" : "Imagem gerada pela Maxi";
  img.className = animated ? "animated-scene-img" : "generated-image";

  img.onload = () => {
    rolarParaBaixo();
  };

  img.onerror = () => {
    texto.textContent = "Não consegui carregar a imagem agora. Tente novamente em alguns instantes ⚠️";
  };

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

  adicionarMensagem("Você", textoUsuario, "user", createdAtUser);

  const createdAtMaxi = new Date().toISOString();
  const respostaTexto = animated
    ? "Certo! Vou criar uma cena animada visual melhorada para você 🎬"
    : "Claro! Vou criar uma imagem melhorada para você 🎨";

  conv.messages.push({
    role: "assistant",
    content: respostaTexto,
    createdAt: createdAtMaxi
  });

  adicionarMensagem("Maxi", respostaTexto, "maxi", createdAtMaxi);
  renderConversationList();

  mostrarCarregando(animated ? "cena" : "imagem");

  setTimeout(() => {
    const url = criarUrlImagem(promptVisual, animated);
    const createdAtImage = new Date().toISOString();

    conv.messages.push({
      role: "assistant",
      type: "image",
      content: animated ? "Cena animada melhorada gerada" : "Imagem melhorada gerada",
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

    removerCarregando();
    adicionarMidiaNaTela(promptVisual, url, createdAtImage, animated);
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
    modal.addEventListener("click", (e) => {
      if (e.target === modal) fecharConfig();
    });
  }

  if (estiloModal) {
    estiloModal.addEventListener("click", (e) => {
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
    chatBox.addEventListener("wheel", (e) => {
      e.stopPropagation();
    });
  }
});
