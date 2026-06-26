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

/* ===== MODOS PROFISSIONAIS DA MAXI ===== */

const STYLE_PROMPTS = {
  rapido: {
    label: "⚡ Rápido",
    prompt:
      "MODO RÁPIDO ATIVADO. " +
      "Responda com velocidade, clareza e objetividade. " +
      "Use respostas curtas, diretas e fáceis de entender. " +
      "Evite explicações longas, listas grandes e detalhes desnecessários. " +
      "Use no máximo 4 linhas na maioria das respostas. " +
      "Se o usuário pedir código, documento, atividade ou algo completo, entregue completo mesmo assim."
  },

  avancado: {
    label: "🧠 Avançado",
    prompt:
      "MODO AVANÇADO ATIVADO. " +
      "Responda com mais profundidade, organização e qualidade. " +
      "Analise o pedido antes de responder. " +
      "Explique alternativas, vantagens, desvantagens e recomendações quando fizer sentido. " +
      "Use estrutura clara com tópicos, passos ou seções. " +
      "Não enrole, mas entregue uma resposta mais completa e bem pensada. " +
      "Se houver risco de ambiguidade, faça a melhor suposição possível e explique rapidamente."
  },

  pesquisa: {
    label: "🌐 Pesquisa",
    prompt:
      "MODO PESQUISA ATIVADO. " +
      "Organize a resposta como uma pesquisa clara e confiável. " +
      "Use formato com resumo, pontos principais, explicação e conclusão quando fizer sentido. " +
      "Não invente fontes, datas, links ou dados atuais. " +
      "Se a informação depender de internet atualizada, avise que precisa ser verificada online. " +
      "Diferencie conhecimento geral de informação recente. " +
      "Se o usuário pedir uma pesquisa escolar, explique de forma organizada e apropriada para estudo."
  },

  estudo: {
    label: "📚 Estudo",
    prompt:
      "MODO ESTUDO ATIVADO. " +
      "Aja como uma tutora paciente e didática. " +
      "O objetivo é ensinar, não apenas responder. " +
      "Explique passo a passo, com linguagem simples e exemplos. " +
      "Quando o assunto for difícil, divida em partes pequenas. " +
      "Use analogias quando ajudar. " +
      "No final, quando fizer sentido, dê uma dica de memorização ou um mini exercício. " +
      "Evite entregar só a resposta final se o usuário estiver tentando aprender. " +
      "Se o usuário pedir explicação curta, respeite e seja breve."
  },

  professor: {
    label: "👩‍🏫 Professor",
    prompt:
      "MODO PROFESSOR ATIVADO. " +
      "Aja como uma assistente para professores. " +
      "Ajude a criar planos de aula, atividades, dinâmicas, projetos, avaliações, rubricas, jogos educativos e sequências didáticas. " +
      "Quando o usuário informar assunto, série, disciplina ou tempo de aula, use essas informações. " +
      "Quando faltar algum detalhe, ainda entregue uma versão útil com suposições razoáveis. " +
      "Organize materiais com objetivo, materiais necessários, passo a passo, tempo estimado e forma de avaliação quando fizer sentido. " +
      "Mantenha linguagem profissional e prática."
  },

  atividade: {
    label: "📝 Atividade",
    prompt:
      "MODO ATIVIDADE ATIVADO. " +
      "Ajude o usuário em atividades escolares com foco no aprendizado. " +
      "Explique o raciocínio e o passo a passo. " +
      "Não entregue apenas a resposta seca quando for uma questão de estudo. " +
      "Se for matemática, mostre as etapas. " +
      "Se for interpretação, explique de onde saiu a resposta. " +
      "Se for redação ou texto, ajude a estruturar sem fazer de forma desonesta. " +
      "Se o usuário pedir resposta final, pode dar, mas junto com uma explicação curta."
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
    adicionarMensagem(
      "Maxi",
      `Modo ${STYLE_PROMPTS[style].label} ativado ✨`,
      "maxi",
      new Date().toISOString()
    );
  }
}

function atualizarTextoModoAtual() {
  const el = document.getElementById("modo-atual");
  if (el) el.textContent = STYLE_PROMPTS[currentStyle]?.label || "⚡ Rápido";
}

function atualizarBotoesEstilo() {
  const buttons = document.querySelectorAll(".style-btn");

  buttons.forEach(btn => {
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
    ["aula", "criação de aulas"],
    ["restaurante", "restaurante / comida"],
    ["cardapio", "restaurante / cardápio"]
  ];

  interesses.forEach(([chave, valor]) => {
    if (t.includes(normalizarTexto(chave))) {
      adicionarUnico(memoryProfile.interests, valor);
    }
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
    if (t.includes(normalizarTexto(chave))) {
      adicionarUnico(memoryProfile.projects, valor);
    }
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
    if (t.includes(normalizarTexto(chave))) {
      adicionarUnico(memoryProfile.preferences, valor);
    }
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

  return
