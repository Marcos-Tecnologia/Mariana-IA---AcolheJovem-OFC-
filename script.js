const API_URL = "/api/chat";

const CONVERSATIONS_KEY = "maxi_conversations_v1";
const ACTIVE_CONVERSATION_KEY = "maxi_active_conversation_v1";
const THEME_KEY = "maxi_theme_v1";
const MEMORY_KEY = "maxi_memory_profile_v1";
const STYLE_KEY = "maxi_style_mode_v2";

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

/* =========================================================
   PROMPT PRINCIPAL DA MAXI
========================================================= */

const SYSTEM_PROMPT = {
  role: "system",
  content: `
Você é Maxi, uma inteligência artificial criada pela empresa MA (R).

Seu principal objetivo é oferecer apoio, acolhimento, orientação e ajuda prática de forma humana, curta, calma e carinhosa.

Você também pode ajudar com estudos, pesquisas, programação, organização, escrita, ideias, tarefas do dia a dia e outros assuntos. Porém, quando o usuário demonstrar algum sofrimento emocional, sua prioridade passa a ser compreender e ajudar essa pessoa.

REGRAS PRINCIPAIS:

1. Responda de forma humana, calma, natural, respeitosa e carinhosa.

2. Prefira respostas curtas e fáceis de entender, mas forneça detalhes quando forem realmente necessários.

3. Não responda apenas com frases prontas como:
- "Sinto muito."
- "Isso passa."
- "Vai ficar tudo bem."
- "Fique tranquilo."

Essas expressões podem aparecer ocasionalmente, mas nunca devem substituir uma ajuda verdadeira.

4. Evite repetir as mesmas palavras e expressões em todas as respostas.

5. Tente entender o que a pessoa está sentindo, como:
- tristeza;
- medo;
- ansiedade;
- raiva;
- vergonha;
- culpa;
- frustração;
- solidão;
- insegurança;
- baixa autoestima;
- preocupação;
- desânimo;
- felicidade;
- esperança.

6. Não fique apenas consolando. Sempre tente ajudar a resolver ou melhorar a situação apresentada.

7. Quando possível, ofereça:
- uma ação prática;
- um pequeno plano;
- uma sugestão realista;
- uma forma diferente de lidar com a situação;
- uma maneira de conversar com alguém;
- uma estratégia para resolver o problema.

8. Faça no máximo uma pergunta curta por vez quando precisar entender melhor a situação.

9. Não faça perguntas desnecessárias quando já for possível ajudar.

10. Nunca julgue, humilhe ou diminua os sentimentos do usuário.

11. Nunca diga que o problema da pessoa é pequeno ou que ela está exagerando.

12. Nunca finja ser psicóloga, médica ou qualquer outro profissional.

13. Nunca faça diagnósticos médicos ou psicológicos.

14. Não afirme que uma pessoa tem depressão, ansiedade, transtorno ou qualquer condição de saúde.

15. Em situações sérias, recomende ajuda profissional com cuidado e sem abandonar a pessoa.

16. Quando houver risco de suicídio, automutilação, abuso, violência ou perigo imediato:
- mantenha a calma;
- incentive a pessoa a procurar imediatamente um adulto ou pessoa de confiança;
- incentive a busca por um profissional ou serviço de emergência;
- se a pessoa estiver no Brasil, informe sobre o CVV pelo telefone 188;
- não deixe a resposta limitada apenas ao número do CVV;
- demonstre presença e acolhimento.

17. Nunca faça brincadeiras com sofrimento emocional, morte, suicídio, abuso, violência, aparência, deficiência, doença ou inseguranças pessoais.

18. Mesmo no modo divertido, interrompa as brincadeiras se o usuário demonstrar sofrimento e responda com cuidado.

19. Use emojis quando combinarem com a conversa, mas sem exagerar.

20. Não comece oferecendo criação de imagens ou ferramentas. Cumprimente de maneira simples e espere o usuário dizer o que precisa.

EXEMPLO:

Usuário:
"Estou triste porque tirei nota zero."

Não responda apenas:
"Sinto muito. Isso passa."

Responda de forma parecida com:
"Isso deve ter sido bem frustrante 😕 Mas uma nota não define sua capacidade. Veja onde você errou, converse com o professor e tente montar um plano curto para a recuperação. Qual foi a matéria?"

OUTRO EXEMPLO:

Usuário:
"Estou triste porque me acho feio."

Não responda apenas:
"Sinto muito. Você é bonito."

Responda de forma parecida com:
"Parece que sua autoestima ficou bem abalada 😔 Às vezes a gente se enxerga de forma muito mais dura do que os outros. Aconteceu algo hoje que fez você se sentir assim?"

Seu objetivo é fazer com que a pessoa termine a conversa se sentindo ouvida, respeitada e realmente ajudada.
`.trim()
};

/* =========================================================
   MODOS DA MAXI
========================================================= */

const STYLE_PROMPTS = {
  rapido: {
    label: "⚡ Rápido",
    prompt: `
MODO RÁPIDO ATIVADO.

Responda de forma direta, clara e curta.

Na maioria das respostas:
- use de 2 a 5 linhas;
- evite explicações longas;
- vá direto ao ponto;
- dê a informação ou solução principal primeiro.

Mesmo sendo rápida:
- continue sendo educada e humana;
- não ignore emoções importantes;
- não diminua situações sérias;
- entregue códigos e conteúdos completos quando o usuário pedir algo completo.
`.trim()
  },

  apoio: {
    label: "💙 Ajuda + Apoio",
    prompt: `
MODO AJUDA + APOIO ATIVADO.

Este é o modo principal da Maxi.

Converse de forma calma, humana, carinhosa e acolhedora.

Quando o usuário apresentar um problema:
1. entenda o que aconteceu;
2. perceba o sentimento predominante;
3. demonstre compreensão sem usar frases vazias;
4. ofereça ajuda prática;
5. sugira uma ação possível;
6. faça apenas uma pergunta curta, se necessário.

Não fique repetindo:
- "sinto muito";
- "isso passa";
- "vai dar tudo certo";
- "fique tranquilo".

Não use respostas genéricas.

Ajude o máximo possível a resolver a situação concreta.

Exemplo:
Se o usuário disser que tirou nota zero, ajude a revisar os erros, conversar com o professor, organizar estudos e verificar recuperação.

Se o usuário disser que se acha feio, procure compreender o que provocou esse sentimento, trabalhe a autocrítica com cuidado e sugira ações saudáveis para a autoestima.

Nunca faça diagnósticos.

Quando a situação for séria, recomende ajuda profissional ou de uma pessoa de confiança com respeito.
`.trim()
  },

  divertido: {
    label: "🎉 Divertido",
    prompt: `
MODO DIVERTIDO ATIVADO.

Fale com muita alegria, energia positiva e criatividade.

Você pode:
- fazer brincadeiras leves;
- contar piadas;
- usar trocadilhos;
- criar desafios;
- propor adivinhas;
- inventar histórias engraçadas;
- comemorar conquistas;
- usar emojis um pouco mais;
- falar de maneira animada e descontraída.

As brincadeiras devem ser variadas e naturais.

Não repita sempre a mesma piada ou estrutura.

Não force humor quando não combinar com o assunto.

Nunca faça brincadeiras sobre:
- sofrimento emocional;
- aparência;
- inseguranças;
- morte;
- suicídio;
- violência;
- abuso;
- deficiência;
- doenças;
- religião;
- características pessoais sensíveis.

Se o usuário demonstrar tristeza, medo, sofrimento, perigo ou pedir ajuda séria, interrompa o humor imediatamente e responda com calma, carinho e responsabilidade.
`.trim()
  }
};

let conversations = [];
let activeConversationId = null;
let memoryProfile = null;
let currentStyle = "apoio";

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

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

/* =========================================================
   CONVERSAS E RECUPERAÇÃO
========================================================= */

function carregarConversas() {
  const principal = lerConversasDaChave(CONVERSATIONS_KEY);

  if (principal.length > 0) {
    return principal;
  }

  for (const key of OLD_CONVERSATION_KEYS) {
    const recuperadas = lerConversasDaChave(key);

    if (recuperadas.length > 0) {
      localStorage.setItem(
        CONVERSATIONS_KEY,
        JSON.stringify(recuperadas)
      );

      return recuperadas;
    }
  }

  return [];
}

function lerConversasDaChave(key) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        return [];
      }

      if (parsed[0] && Array.isArray(parsed[0].messages)) {
        return parsed
          .map(normalizarConversa)
          .filter(Boolean);
      }

      if (
        parsed[0] &&
        parsed[0].role &&
        parsed[0].content
      ) {
        return [
          {
            id: gerarId(),
            title: "Conversa recuperada",
            messages: parsed
              .map(normalizarMensagem)
              .filter(Boolean),
            updatedAt: new Date().toISOString()
          }
        ];
      }
    }

    if (
      parsed &&
      Array.isArray(parsed.messages)
    ) {
      return [
        {
          id: gerarId(),
          title: parsed.title || "Conversa recuperada",
          messages: parsed.messages
            .map(normalizarMensagem)
            .filter(Boolean),
          updatedAt:
            parsed.updatedAt ||
            new Date().toISOString()
        }
      ];
    }

    return [];
  } catch (erro) {
    console.warn(
      `Não foi possível ler a chave ${key}:`,
      erro
    );

    return [];
  }
}

function normalizarConversa(conversa) {
  if (!conversa) {
    return null;
  }

  return {
    id: conversa.id || gerarId(),
    title:
      conversa.title ||
      conversa.name ||
      "Conversa recuperada",
    messages: Array.isArray(conversa.messages)
      ? conversa.messages
          .map(normalizarMensagem)
          .filter(Boolean)
      : [],
    updatedAt:
      conversa.updatedAt ||
      conversa.createdAt ||
      new Date().toISOString()
  };
}

function normalizarMensagem(mensagem) {
  if (!mensagem) {
    return null;
  }

  let role = "assistant";

  if (mensagem.role === "user") {
    role = "user";
  }

  return {
    role,
    content:
      mensagem.content ||
      mensagem.text ||
      mensagem.message ||
      "",
    type: mensagem.type || undefined,
    prompt: mensagem.prompt || "",
    url: mensagem.url || "",
    createdAt:
      mensagem.createdAt ||
      new Date().toISOString()
  };
}

function salvarConversas() {
  try {
    localStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations)
    );
  } catch (erro) {
    console.error(
      "Erro ao salvar conversas:",
      erro
    );
  }
}

function carregarConversaAtiva() {
  return localStorage.getItem(
    ACTIVE_CONVERSATION_KEY
  );
}

function salvarConversaAtiva() {
  if (!activeConversationId) {
    return;
  }

  localStorage.setItem(
    ACTIVE_CONVERSATION_KEY,
    activeConversationId
  );
}

/* =========================================================
   MODOS
========================================================= */

function carregarEstilo() {
  const salvo = localStorage.getItem(STYLE_KEY);

  if (salvo && STYLE_PROMPTS[salvo]) {
    return salvo;
  }

  const estiloAntigo =
    localStorage.getItem("maxi_style_mode_v1");

  if (estiloAntigo === "rapido") {
    return "rapido";
  }

  return "apoio";
}

function salvarEstilo(style) {
  if (!STYLE_PROMPTS[style]) {
    return;
  }

  currentStyle = style;

  localStorage.setItem(
    STYLE_KEY,
    style
  );

  atualizarTextoModoAtual();
  atualizarBotoesEstilo();

  const chatContainer =
    document.getElementById("chat-container");

  const chatEstaAberto =
    chatContainer &&
    !chatContainer.classList.contains("hidden");

  if (chatEstaAberto) {
    adicionarMensagem(
      "Maxi",
      `Modo ${STYLE_PROMPTS[style].label} ativado ✨`,
      "maxi",
      new Date().toISOString()
    );
  }
}

function atualizarTextoModoAtual() {
  const elemento =
    document.getElementById("modo-atual");

  if (!elemento) {
    return;
  }

  elemento.textContent =
    STYLE_PROMPTS[currentStyle]?.label ||
    "💙 Ajuda + Apoio";
}

function atualizarBotoesEstilo() {
  document
    .querySelectorAll(".style-btn")
    .forEach((botao) => {
      const style =
        botao.getAttribute(
          "data-style-choice"
        );

      const modoValido =
        style === currentStyle;

      botao.classList.toggle(
        "active-style",
        modoValido
      );

      if (!STYLE_PROMPTS[style]) {
        botao.style.display = "none";
      } else {
        botao.style.display = "";
      }
    });
}

function criarPromptEstilo() {
  return {
    role: "system",
    content:
      STYLE_PROMPTS[currentStyle]?.prompt ||
      STYLE_PROMPTS.apoio.prompt
  };
}

function abrirEstilo() {
  const modal =
    document.getElementById("estilo-modal");

  if (modal) {
    modal.classList.remove("hidden");
  }

  atualizarBotoesEstilo();
}

function fecharEstilo() {
  const modal =
    document.getElementById("estilo-modal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

/* =========================================================
   MEMÓRIA
========================================================= */

function criarMemoriaVazia() {
  return {
    interests: [],
    projects: [],
    preferences: [],
    recentTopics: []
  };
}

function carregarMemoria() {
  try {
    const raw =
      localStorage.getItem(MEMORY_KEY);

    if (!raw) {
      return criarMemoriaVazia();
    }

    const parsed = JSON.parse(raw);

    return {
      interests: Array.isArray(parsed.interests)
        ? parsed.interests
        : [],
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
        : [],
      preferences: Array.isArray(parsed.preferences)
        ? parsed.preferences
        : [],
      recentTopics: Array.isArray(parsed.recentTopics)
        ? parsed.recentTopics
        : []
    };
  } catch (erro) {
    console.warn(
      "Não foi possível carregar a memória:",
      erro
    );

    return criarMemoriaVazia();
  }
}

function salvarMemoria() {
  try {
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(memoryProfile)
    );
  } catch (erro) {
    console.error(
      "Erro ao salvar memória:",
      erro
    );
  }
}

function adicionarUnico(
  lista,
  valor,
  limite = 12
) {
  if (!valor) {
    return;
  }

  const limpo = String(valor).trim();

  if (!limpo) {
    return;
  }

  const existe = lista.some(
    (item) =>
      item.toLowerCase() ===
      limpo.toLowerCase()
  );

  if (!existe) {
    lista.unshift(limpo);
  }

  if (lista.length > limite) {
    lista.length = limite;
  }
}

function atualizarMemoriaComTexto(texto) {
  if (!memoryProfile) {
    memoryProfile = criarMemoriaVazia();
  }

  const textoNormalizado =
    normalizarTexto(texto);

  const interesses = [
    ["maquiagem", "maquiagem"],
    ["marketing", "marketing"],
    ["site", "criação de sites"],
    ["wix", "Wix"],
    ["github", "GitHub"],
    ["vercel", "Vercel"],
    ["estudo", "estudos"],
    ["atividade escolar", "atividades escolares"],
    ["imagem", "criação de imagens"],
    ["desenho", "criação de imagens"],
    ["python", "programação em Python"],
    ["html", "HTML"],
    ["css", "CSS"],
    ["javascript", "JavaScript"],
    ["roblox", "Roblox Studio"],
    ["jogo", "criação de jogos"],
    ["inteligencia artificial", "inteligência artificial"],
    ["ia", "inteligência artificial"],
    ["musica", "música"],
    ["futebol", "futebol"],
    ["filme", "filmes"],
    ["serie", "séries"]
  ];

  interesses.forEach(
    ([palavra, valor]) => {
      if (
        textoNormalizado.includes(
          normalizarTexto(palavra)
        )
      ) {
        adicionarUnico(
          memoryProfile.interests,
          valor
        );
      }
    }
  );

  const preferencias = [
    ["resumido", "prefere respostas resumidas"],
    ["resposta curta", "prefere respostas curtas"],
    ["codigo completo", "prefere código completo"],
    ["sem mudar", "prefere manter a estrutura principal"],
    ["bonito", "gosta de visuais bonitos"],
    ["profissional", "gosta de resultados profissionais"],
    ["rosa", "gosta do tema rosa"],
    ["azul", "gosta do tema azul"]
  ];

  preferencias.forEach(
    ([palavra, valor]) => {
      if (
        textoNormalizado.includes(
          normalizarTexto(palavra)
        )
      ) {
        adicionarUnico(
          memoryProfile.preferences,
          valor
        );
      }
    }
  );

  adicionarUnico(
    memoryProfile.recentTopics,
    String(texto).slice(0, 100),
    10
  );

  salvarMemoria();
}

function criarPromptMemoria() {
  const partes = [];

  if (
    memoryProfile &&
    memoryProfile.interests.length > 0
  ) {
    partes.push(
      "Interesses percebidos: " +
      memoryProfile.interests.join(", ") +
      "."
    );
  }

  if (
    memoryProfile &&
    memoryProfile.projects.length > 0
  ) {
    partes.push(
      "Projetos percebidos: " +
      memoryProfile.projects.join(", ") +
      "."
    );
  }

  if (
    memoryProfile &&
    memoryProfile.preferences.length > 0
  ) {
    partes.push(
      "Preferências percebidas: " +
      memoryProfile.preferences.join(", ") +
      "."
    );
  }

  if (
    memoryProfile &&
    memoryProfile.recentTopics.length > 0
  ) {
    partes.push(
      "Assuntos recentes: " +
      memoryProfile.recentTopics
        .slice(0, 5)
        .join(" | ") +
      "."
    );
  }

  if (partes.length === 0) {
    return {
      role: "system",
      content:
        "Ainda não há memória suficiente sobre o usuário. Responda normalmente."
    };
  }

  return {
    role: "system",
    content:
      "Use esta memória local apenas para personalizar a conversa de forma natural. " +
      "Não diga constantemente que possui memória e não seja invasiva. " +
      partes.join(" ")
  };
}

/* =========================================================
   TEMA
========================================================= */

function aplicarTema(theme) {
  if (!theme) {
    return;
  }

  document.body.setAttribute(
    "data-theme",
    theme
  );

  localStorage.setItem(
    THEME_KEY,
    theme
  );
}

function aplicarTemaSalvo() {
  const theme =
    localStorage.getItem(THEME_KEY) ||
    document.body.getAttribute("data-theme") ||
    "rosa";

  document.body.setAttribute(
    "data-theme",
    theme
  );
}

/* =========================================================
   GERENCIAMENTO DE CONVERSAS
========================================================= */

function gerarId() {
  return (
    "conv_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

function criarNovaConversa() {
  const id = gerarId();

  const conversa = {
    id,
    title: "Nova conversa",
    messages: [],
    updatedAt: new Date().toISOString()
  };

  conversations.unshift(conversa);
  activeConversationId = id;

  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();
  renderChat();
  abrirChat();

  const input =
    document.getElementById("user-input");

  if (input) {
    input.focus();
  }
}

function excluirConversaAtual() {
  const conversa =
    getActiveConversation();

  if (!conversa) {
    alert(
      "Nenhuma conversa selecionada."
    );

    return;
  }

  const confirmar = confirm(
    `Deseja excluir a conversa "${conversa.title}"?`
  );

  if (!confirmar) {
    return;
  }

  conversations =
    conversations.filter(
      (item) =>
        item.id !== activeConversationId
    );

  if (conversations.length === 0) {
    criarNovaConversa();
    return;
  }

  activeConversationId =
    conversations[0].id;

  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();
  renderChat();
}

function garantirConversaInicial() {
  if (conversations.length === 0) {
    const conversaInicial = {
      id: gerarId(),
      title: "Nova conversa",
      messages: [],
      updatedAt:
        new Date().toISOString()
    };

    conversations.push(
      conversaInicial
    );

    activeConversationId =
      conversaInicial.id;

    salvarConversas();
    salvarConversaAtiva();
    renderChat();

    return;
  }

  const conversaExiste =
    conversations.some(
      (conversa) =>
        conversa.id ===
        activeConversationId
    );

  if (
    !activeConversationId ||
    !conversaExiste
  ) {
    activeConversationId =
      conversations[0].id;

    salvarConversaAtiva();
  }

  renderChat();
}

function getActiveConversation() {
  return (
    conversations.find(
      (conversa) =>
        conversa.id ===
        activeConversationId
    ) || null
  );
}

function renderConversationList() {
  const list =
    document.getElementById(
      "conversation-list"
    );

  if (!list) {
    return;
  }

  list.innerHTML = "";

  conversations.forEach(
    (conversa) => {
      const item =
        document.createElement("div");

      item.className =
        "conversation-item" +
        (
          conversa.id ===
          activeConversationId
            ? " active"
            : ""
        );

      const ultimaMensagem =
        conversa.messages[
          conversa.messages.length - 1
        ];

      let preview =
        "Sem mensagens ainda";

      if (ultimaMensagem) {
        if (
          ultimaMensagem.type ===
          "image"
        ) {
          preview = "Imagem gerada";
        } else {
          preview =
            ultimaMensagem.content ||
            "Mensagem";
        }
      }

      item.innerHTML = `
        <div class="conversation-title">
          ${escapeHtml(conversa.title)}
        </div>

        <div class="conversation-preview">
          ${escapeHtml(
            String(preview).slice(0, 60)
          )}
        </div>

        <div class="conversation-time">
          ${formatarHorario(
            conversa.updatedAt
          )}
        </div>
      `;

      item.addEventListener(
        "click",
        () => {
          activeConversationId =
            conversa.id;

          salvarConversaAtiva();
          renderConversationList();
          renderChat();
          abrirChat();
        }
      );

      list.appendChild(item);
    }
  );
}

function renderChat() {
  const box =
    document.getElementById("chat-box");

  if (!box) {
    return;
  }

  box.innerHTML = "";

  const conversa =
    getActiveConversation();

  if (!conversa) {
    return;
  }

  conversa.messages.forEach(
    (mensagem) => {
      if (mensagem.type === "image") {
        adicionarImagemNaTela(
          mensagem.prompt,
          mensagem.url,
          mensagem.createdAt,
          false
        );
      } else {
        adicionarMensagem(
          mensagem.role === "assistant"
            ? "Maxi"
            : "Você",
          mensagem.content,
          mensagem.role === "assistant"
            ? "maxi"
            : "user",
          mensagem.createdAt
        );
      }
    }
  );

  rolarParaBaixo();
}

/* =========================================================
   INTERFACE
========================================================= */

function abrirChat() {
  const inicio =
    document.getElementById(
      "inicio-container"
    );

  const chat =
    document.getElementById(
      "chat-container"
    );

  if (inicio) {
    inicio.classList.add("hidden");
    inicio.style.display = "none";
  }

  if (chat) {
    chat.classList.remove("hidden");
    chat.style.display = "block";
  }

  rolarParaBaixo();

  const input =
    document.getElementById("user-input");

  if (input) {
    input.focus();
  }
}

function abrirConfig() {
  const modal =
    document.getElementById(
      "config-modal"
    );

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function fecharConfig() {
  const modal =
    document.getElementById(
      "config-modal"
    );

  if (modal) {
    modal.classList.add("hidden");
  }
}

function adicionarMensagem(
  remetente,
  texto,
  tipo = "maxi",
  createdAt = null
) {
  const box =
    document.getElementById("chat-box");

  if (!box) {
    return null;
  }

  const data = createdAt
    ? new Date(createdAt)
    : new Date();

  const hora =
    data
      .getHours()
      .toString()
      .padStart(2, "0") +
    ":" +
    data
      .getMinutes()
      .toString()
      .padStart(2, "0");

  const div =
    document.createElement("div");

  div.className =
    `msg ${
      tipo === "user"
        ? "msg-user"
        : "msg-maxi"
    }`;

  const strong =
    document.createElement("strong");

  strong.textContent = remetente;

  const conteudo =
    document.createElement("div");

  conteudo.className =
    "message-content";

  formatarTextoMensagem(
    conteudo,
    texto || ""
  );

  const time =
    document.createElement("div");

  time.className = "msg-time";
  time.textContent = hora;

  div.appendChild(strong);
  div.appendChild(conteudo);
  div.appendChild(time);

  if (tipo !== "user") {
    div.appendChild(criarReacao());
  }

  box.appendChild(div);
  rolarParaBaixo();

  return div;
}

function formatarTextoMensagem(
  elemento,
  texto
) {
  elemento.innerHTML = "";

  const linhas =
    String(texto).split("\n");

  linhas.forEach(
    (linha, indice) => {
      if (indice > 0) {
        elemento.appendChild(
          document.createElement("br")
        );
      }

      const partes =
        linha.split(
          /(\*\*[^*]+\*\*)/g
        );

      partes.forEach((parte) => {
        if (
          parte.startsWith("**") &&
          parte.endsWith("**")
        ) {
          const strong =
            document.createElement(
              "strong"
            );

          strong.textContent =
            parte.slice(2, -2);

          elemento.appendChild(
            strong
          );
        } else {
          elemento.appendChild(
            document.createTextNode(
              parte
            )
          );
        }
      });
    }
  );
}

function criarReacao() {
  const reaction =
    document.createElement("div");

  reaction.className =
    "msg-reactions";

  reaction.innerHTML =
    "<span>🤍</span>";

  reaction.addEventListener(
    "click",
    () => {
      const span =
        reaction.querySelector("span");

      if (!span) {
        return;
      }

      span.textContent =
        span.textContent === "🤍"
          ? "❤️"
          : "🤍";
    }
  );

  return reaction;
}

function mostrarCarregando(
  tipo = "mensagem"
) {
  const box =
    document.getElementById("chat-box");

  if (!box) {
    return null;
  }

  removerCarregando();

  let texto =
    "Maxi está pensando";

  if (tipo === "imagem") {
    texto = "Criando imagem";
  }

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "typing-wrapper";

  wrapper.id = "maxi-loading";

  wrapper.innerHTML = `
    <div class="typing-bubble">
      <span class="typing-label">
        ${texto}
      </span>

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
  const elemento =
    document.getElementById(
      "maxi-loading"
    );

  if (elemento) {
    elemento.remove();
  }
}

async function escreverTextoAnimado(
  remetente,
  texto,
  createdAt
) {
  const div = adicionarMensagem(
    remetente,
    "",
    "maxi",
    createdAt
  );

  if (!div) {
    return;
  }

  const conteudo =
    div.querySelector(
      ".message-content"
    );

  if (!conteudo) {
    return;
  }

  let indice = 0;

  return new Promise(
    (resolve) => {
      const intervalo =
        setInterval(() => {
          const parcial =
            texto.slice(
              0,
              indice + 1
            );

          formatarTextoMensagem(
            conteudo,
            parcial
          );

          indice++;
          rolarParaBaixo();

          if (
            indice >= texto.length
          ) {
            clearInterval(
              intervalo
            );

            formatarTextoMensagem(
              conteudo,
              texto
            );

            resolve();
          }
        }, 14);
    }
  );
}

/* =========================================================
   DETECÇÃO DE IMAGEM
========================================================= */

function detectarPedidoImagem(texto) {
  const normalizado =
    normalizarTexto(texto);

  const comandos = [
    "crie uma imagem",
    "criar uma imagem",
    "gere uma imagem",
    "gerar uma imagem",
    "faca uma imagem",
    "fazer uma imagem",
    "imagem de",
    "desenhe",
    "desenhar",
    "crie um desenho",
    "gere um desenho",
    "criar desenho",
    "fazer desenho",
    "crie uma foto",
    "gere uma foto"
  ];

  return comandos.some(
    (comando) =>
      normalizado.includes(comando)
  );
}

function limparPromptImagem(texto) {
  return String(texto)
    .replace(
      /crie uma imagem de/gi,
      ""
    )
    .replace(
      /crie uma imagem/gi,
      ""
    )
    .replace(
      /criar uma imagem de/gi,
      ""
    )
    .replace(
      /criar uma imagem/gi,
      ""
    )
    .replace(
      /gere uma imagem de/gi,
      ""
    )
    .replace(
      /gere uma imagem/gi,
      ""
    )
    .replace(
      /gerar uma imagem de/gi,
      ""
    )
    .replace(
      /gerar uma imagem/gi,
      ""
    )
    .replace(
      /faça uma imagem de/gi,
      ""
    )
    .replace(
      /faça uma imagem/gi,
      ""
    )
    .replace(
      /faca uma imagem de/gi,
      ""
    )
    .replace(
      /faca uma imagem/gi,
      ""
    )
    .replace(
      /imagem de/gi,
      ""
    )
    .replace(
      /desenhe/gi,
      ""
    )
    .replace(
      /desenhar/gi,
      ""
    )
    .replace(
      /crie um desenho de/gi,
      ""
    )
    .replace(
      /crie um desenho/gi,
      ""
    )
    .replace(
      /gere um desenho de/gi,
      ""
    )
    .replace(
      /gere um desenho/gi,
      ""
    )
    .replace(
      /crie uma foto de/gi,
      ""
    )
    .replace(
      /gere uma foto de/gi,
      ""
    )
    .trim();
}

/* =========================================================
   PROMPT BUILDER DE IMAGENS
========================================================= */

function extrairCores(texto) {
  const normalizado =
    normalizarTexto(texto);

  const cores = [];

  const mapa = [
    ["vermelho", "red"],
    ["azul", "blue"],
    ["verde", "green"],
    ["amarelo", "yellow"],
    ["laranja", "orange"],
    ["roxo", "purple"],
    ["rosa", "pink"],
    ["preto", "black"],
    ["branco", "white"],
    ["dourado", "gold"],
    ["prata", "silver"],
    ["marrom", "brown"],
    ["cinza", "gray"],
    ["bege", "beige"],
    ["turquesa", "turquoise"],
    ["violeta", "violet"]
  ];

  mapa.forEach(
    ([portugues, ingles]) => {
      if (
        normalizado.includes(
          portugues
        )
      ) {
        cores.push(ingles);
      }
    }
  );

  return cores;
}

function detectarEstiloImagem(texto) {
  const normalizado =
    normalizarTexto(texto);

  if (
    normalizado.includes("anime")
  ) {
    return (
      "anime style, clean line art, " +
      "expressive characters, vibrant colors, " +
      "beautiful anime lighting"
    );
  }

  if (
    normalizado.includes("realista") ||
    normalizado.includes("realismo") ||
    normalizado.includes("fotorealista") ||
    normalizado.includes("foto realista")
  ) {
    return (
      "photorealistic, realistic lighting, " +
      "natural colors, realistic textures, " +
      "professional photography"
    );
  }

  if (
    normalizado.includes("3d") ||
    normalizado.includes("render")
  ) {
    return (
      "high quality 3D render, " +
      "professional studio lighting, " +
      "detailed materials, smooth surfaces"
    );
  }

  if (
    normalizado.includes("cartoon") ||
    normalizado.includes(
      "desenho animado"
    )
  ) {
    return (
      "cartoon illustration, friendly shapes, " +
      "clean outlines, colorful polished design"
    );
  }

  if (
    normalizado.includes("pixel art") ||
    normalizado.includes("pixelado")
  ) {
    return (
      "pixel art, crisp pixels, " +
      "retro video game aesthetic, " +
      "detailed pixel composition"
    );
  }

  if (
    normalizado.includes("minimalista")
  ) {
    return (
      "minimalist visual style, clean composition, " +
      "simple shapes, strong negative space"
    );
  }

  if (
    normalizado.includes(
      "cinematografico"
    ) ||
    normalizado.includes("cinematic")
  ) {
    return (
      "cinematic style, dramatic professional lighting, " +
      "movie scene composition, atmospheric depth"
    );
  }

  if (
    normalizado.includes("fofo") ||
    normalizado.includes("cute") ||
    normalizado.includes("kawaii")
  ) {
    return (
      "cute kawaii style, adorable design, " +
      "soft colors, charming visual"
    );
  }

  if (
    normalizado.includes("luxo") ||
    normalizado.includes("premium")
  ) {
    return (
      "luxury premium style, sophisticated details, " +
      "elegant lighting, refined composition"
    );
  }

  if (
    normalizado.includes("terror") ||
    normalizado.includes("sombrio")
  ) {
    return (
      "dark atmospheric style, dramatic shadows, " +
      "mysterious cinematic lighting, " +
      "safe non-graphic scene"
    );
  }

  return (
    "high quality digital art, professional composition, " +
    "polished visual, detailed scene"
  );
}

function detectarCategoriaImagem(
  texto
) {
  const normalizado =
    normalizarTexto(texto);

  if (
    normalizado.includes("cachorro") ||
    normalizado.includes("gato") ||
    normalizado.includes("animal") ||
    normalizado.includes("pet") ||
    normalizado.includes("passaro") ||
    normalizado.includes("cavalo")
  ) {
    return "animal";
  }

  if (
    normalizado.includes("pessoa") ||
    normalizado.includes("menino") ||
    normalizado.includes("menina") ||
    normalizado.includes("homem") ||
    normalizado.includes("mulher") ||
    normalizado.includes("personagem")
  ) {
    return "person";
  }

  if (
    normalizado.includes("paisagem") ||
    normalizado.includes("floresta") ||
    normalizado.includes("praia") ||
    normalizado.includes("montanha") ||
    normalizado.includes("cidade") ||
    normalizado.includes("campo")
  ) {
    return "landscape";
  }

  if (
    normalizado.includes("quarto") ||
    normalizado.includes("sala") ||
    normalizado.includes("casa") ||
    normalizado.includes("cozinha") ||
    normalizado.includes("interior")
  ) {
    return "interior";
  }

  if (
    normalizado.includes("produto") ||
    normalizado.includes("embalagem") ||
    normalizado.includes("mockup")
  ) {
    return "product";
  }

  if (
    normalizado.includes("poster") ||
    normalizado.includes("cartaz")
  ) {
    return "poster";
  }

  if (
    normalizado.includes("thumbnail") ||
    normalizado.includes("youtube")
  ) {
    return "thumbnail";
  }

  if (
    normalizado.includes("comida") ||
    normalizado.includes("hamburguer") ||
    normalizado.includes("pizza") ||
    normalizado.includes("bolo") ||
    normalizado.includes("prato")
  ) {
    return "food";
  }

  return "general";
}

function criarPromptImagemAvancado(
  textoUsuario
) {
  const pedidoOriginal =
    limparPromptImagem(
      textoUsuario
    ) || textoUsuario;

  const estilo =
    detectarEstiloImagem(
      textoUsuario
    );

  const categoria =
    detectarCategoriaImagem(
      textoUsuario
    );

  const cores =
    extrairCores(
      textoUsuario
    );

  const partes = [];

  partes.push(
    "Create a high quality image that strictly follows the user's request"
  );

  partes.push(
    `"${pedidoOriginal}"`
  );

  partes.push(
    "Every object, character, animal, color, quantity, position, setting and style explicitly requested by the user is mandatory"
  );

  partes.push(
    "Do not replace, remove or change anything explicitly requested"
  );

  if (categoria === "animal") {
    partes.push(
      "realistic or stylistically accurate animal anatomy"
    );

    partes.push(
      "expressive eyes and natural pose"
    );

    partes.push(
      "detailed fur, feathers or skin according to the animal"
    );
  }

  if (categoria === "person") {
    partes.push(
      "natural pose and accurate anatomy"
    );

    partes.push(
      "detailed facial expression"
    );

    partes.push(
      "professional character composition"
    );
  }

  if (categoria === "landscape") {
    partes.push(
      "beautiful environmental depth"
    );

    partes.push(
      "wide balanced composition"
    );

    partes.push(
      "detailed sky and atmosphere"
    );
  }

  if (categoria === "interior") {
    partes.push(
      "professional interior design visualization"
    );

    partes.push(
      "balanced layout and realistic spatial proportions"
    );
  }

  if (categoria === "product") {
    partes.push(
      "professional commercial product photography"
    );

    partes.push(
      "clean presentation and studio lighting"
    );
  }

  if (categoria === "poster") {
    partes.push(
      "strong visual hierarchy and poster composition"
    );

    partes.push(
      "clean organized design"
    );
  }

  if (categoria === "thumbnail") {
    partes.push(
      "high contrast YouTube thumbnail composition"
    );

    partes.push(
      "clear focal point and engaging visual"
    );
  }

  if (categoria === "food") {
    partes.push(
      "appetizing professional food photography"
    );

    partes.push(
      "detailed food textures and warm lighting"
    );
  }

  partes.push(estilo);

  if (cores.length > 0) {
    partes.push(
      `use the requested colors: ${cores.join(", ")}`
    );
  } else {
    partes.push(
      "use a harmonious color palette appropriate for the scene"
    );
  }

  partes.push(
    "professional lighting"
  );

  partes.push(
    "balanced composition"
  );

  partes.push(
    "sharp important details"
  );

  partes.push(
    "high resolution appearance"
  );

  partes.push(
    "visually polished result"
  );

  partes.push(
    "no watermark"
  );

  partes.push(
    "no random letters"
  );

  partes.push(
    "no unintended text"
  );

  partes.push(
    "safe for all audiences"
  );

  return partes.join(", ");
}

function criarUrlImagem(
  prompt,
  tentativa = 0
) {
  const seed =
    Math.floor(
      Math.random() * 999999
    ) + tentativa;

  const width =
    tentativa >= 2
      ? 768
      : 1024;

  const height =
    tentativa >= 2
      ? 768
      : 768;

  const promptFinal =
    criarPromptImagemAvancado(
      prompt
    );

  return (
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(
      promptFinal
    ) +
    "?width=" +
    width +
    "&height=" +
    height +
    "&seed=" +
    seed +
    "&nologo=true&model=flux"
  );
}

/* =========================================================
   EXIBIÇÃO DE IMAGENS
========================================================= */

function adicionarImagemNaTela(
  prompt,
  url,
  createdAt = null,
  salvar = true
) {
  const box =
    document.getElementById("chat-box");

  if (!box) {
    return;
  }

  const data = createdAt
    ? new Date(createdAt)
    : new Date();

  const hora =
    data
      .getHours()
      .toString()
      .padStart(2, "0") +
    ":" +
    data
      .getMinutes()
      .toString()
      .padStart(2, "0");

  const card =
    document.createElement("div");

  card.className =
    "media-card";

  const strong =
    document.createElement("strong");

  strong.textContent = "Maxi";

  const texto =
    document.createElement("span");

  texto.textContent =
    `Imagem criada para: ${prompt} 🎨`;

  const frame =
    document.createElement("div");

  frame.className =
    "media-frame";

  const imagem =
    document.createElement("img");

  imagem.alt =
    "Imagem gerada pela Maxi";

  imagem.className =
    "generated-image";

  frame.appendChild(imagem);

  let tentativa = 0;
  const maxTentativas = 4;

  function tentarCarregar() {
    const novaUrl =
      criarUrlImagem(
        prompt,
        tentativa
      );

    imagem.src =
      tentativa === 0 && url
        ? url
        : novaUrl;

    if (tentativa > 0) {
      texto.textContent =
        `Tentando carregar novamente... (${tentativa + 1}/${maxTentativas}) 🔄`;
    }
  }

  imagem.addEventListener(
    "load",
    () => {
      texto.textContent =
        `Imagem criada para: ${prompt} 🎨`;

      rolarParaBaixo();

      if (salvar) {
        const conversa =
          getActiveConversation();

        if (conversa) {
          for (
            let indice =
              conversa.messages.length - 1;
            indice >= 0;
            indice--
          ) {
            const mensagem =
              conversa.messages[indice];

            if (
              mensagem.type === "image" &&
              mensagem.prompt === prompt
            ) {
              mensagem.url =
                imagem.src;

              salvarConversas();
              break;
            }
          }
        }
      }
    }
  );

  imagem.addEventListener(
    "error",
    () => {
      tentativa++;

      if (
        tentativa <
        maxTentativas
      ) {
        setTimeout(
          tentarCarregar,
          900
        );
      } else {
        texto.textContent =
          "Não consegui carregar a imagem agora. O servidor de imagens pode estar instável ⚠️";
      }
    }
  );

  const time =
    document.createElement("div");

  time.className = "msg-time";
  time.textContent = hora;

  card.appendChild(strong);
  card.appendChild(texto);
  card.appendChild(frame);
  card.appendChild(time);
  card.appendChild(criarReacao());

  box.appendChild(card);
  rolarParaBaixo();

  tentarCarregar();
}

async function gerarImagemMaxi(
  textoUsuario
) {
  const conversa =
    getActiveConversation();

  if (!conversa) {
    return;
  }

  if (
    verificarSegurancaVisual(
      textoUsuario
    )
  ) {
    responderBloqueioVisual(
      textoUsuario
    );

    return;
  }

  atualizarMemoriaComTexto(
    textoUsuario
  );

  const promptVisual =
    limparPromptImagem(
      textoUsuario
    ) || textoUsuario;

  const createdAtUser =
    new Date().toISOString();

  if (
    conversa.messages.length === 0
  ) {
    conversa.title =
      gerarTituloConversa(
        `Imagem: ${promptVisual}`
      );
  }

  conversa.messages.push({
    role: "user",
    content: textoUsuario,
    createdAt: createdAtUser
  });

  conversa.updatedAt =
    createdAtUser;

  salvarConversas();
  salvarConversaAtiva();

  adicionarMensagem(
    "Você",
    textoUsuario,
    "user",
    createdAtUser
  );

  const createdAtMaxi =
    new Date().toISOString();

  const respostaTexto =
    "Certo! Vou criar a imagem seguindo o que você pediu 🎨";

  conversa.messages.push({
    role: "assistant",
    content: respostaTexto,
    createdAt: createdAtMaxi
  });

  conversa.updatedAt =
    createdAtMaxi;

  salvarConversas();
  renderConversationList();

  adicionarMensagem(
    "Maxi",
    respostaTexto,
    "maxi",
    createdAtMaxi
  );

  mostrarCarregando("imagem");

  setTimeout(() => {
    removerCarregando();

    const createdAtImage =
      new Date().toISOString();

    const url =
      criarUrlImagem(
        promptVisual,
        0
      );

    conversa.messages.push({
      role: "assistant",
      type: "image",
      content: "Imagem gerada",
      prompt: promptVisual,
      url,
      createdAt: createdAtImage
    });

    conversa.updatedAt =
      createdAtImage;

    limitarMensagensConversa(
      conversa
    );

    salvarConversas();
    renderConversationList();

    adicionarImagemNaTela(
      promptVisual,
      url,
      createdAtImage,
      true
    );
  }, 1000);
}

/* =========================================================
   SEGURANÇA VISUAL
========================================================= */

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function verificarSegurancaVisual(
  texto
) {
  const normalizado =
    normalizarTexto(texto);

  const termosBloqueados = [
    "nudez",
    "nua",
    "nu ",
    "pelada",
    "pelado",
    "sem roupa",
    "lingerie",
    "sexo",
    "sexual explicito",
    "pornografia",
    "porno",
    "gore",
    "mutilacao",
    "decapitacao",
    "cadaver",
    "tortura grafica",
    "suicidio explicito",
    "automutilacao"
  ];

  return termosBloqueados.some(
    (termo) =>
      normalizado.includes(termo)
  );
}

function responderBloqueioVisual(
  textoUsuario
) {
  const conversa =
    getActiveConversation();

  if (!conversa) {
    return;
  }

  const createdAtUser =
    new Date().toISOString();

  conversa.messages.push({
    role: "user",
    content: textoUsuario,
    createdAt: createdAtUser
  });

  adicionarMensagem(
    "Você",
    textoUsuario,
    "user",
    createdAtUser
  );

  const resposta =
    "Não posso criar esse tipo de imagem, mas posso ajudar a transformar a ideia em uma versão segura e adequada 🙂";

  const createdAtMaxi =
    new Date().toISOString();

  conversa.messages.push({
    role: "assistant",
    content: resposta,
    createdAt: createdAtMaxi
  });

  conversa.updatedAt =
    createdAtMaxi;

  salvarConversas();
  renderConversationList();

  adicionarMensagem(
    "Maxi",
    resposta,
    "maxi",
    createdAtMaxi
  );
}

/* =========================================================
   ENVIO DE MENSAGENS
========================================================= */

async function enviarMensagem() {
  const input =
    document.getElementById(
      "user-input"
    );

  if (!input) {
    return;
  }

  const texto =
    input.value.trim();

  if (!texto) {
    return;
  }

  input.value = "";

  if (
    detectarPedidoImagem(texto)
  ) {
    await gerarImagemMaxi(texto);
    return;
  }

  atualizarMemoriaComTexto(texto);

  const conversa =
    getActiveConversation();

  if (!conversa) {
    return;
  }

  const createdAtUser =
    new Date().toISOString();

  if (
    conversa.messages.length === 0
  ) {
    conversa.title =
      gerarTituloConversa(texto);
  }

  conversa.messages.push({
    role: "user",
    content: texto,
    createdAt: createdAtUser
  });

  conversa.updatedAt =
    createdAtUser;

  salvarConversas();
  salvarConversaAtiva();
  renderConversationList();

  adicionarMensagem(
    "Você",
    texto,
    "user",
    createdAtUser
  );

  const mensagensParaEnviar = [
    SYSTEM_PROMPT,
    criarPromptEstilo(),
    criarPromptMemoria(),
    ...conversa.messages
      .filter(
        (mensagem) =>
          mensagem.type !== "image"
      )
      .slice(-30)
      .map(
        (mensagem) => ({
          role: mensagem.role,
          content:
            mensagem.content
        })
      )
  ];

  mostrarCarregando(
    "mensagem"
  );

  try {
    const resposta =
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          messages:
            mensagensParaEnviar
        })
      });

    const textoBruto =
      await resposta.text();

    let dados;

    try {
      dados =
        JSON.parse(textoBruto);
    } catch (erro) {
      removerCarregando();

      console.error(
        "Resposta inválida da API:",
        textoBruto
      );

      adicionarMensagem(
        "Maxi",
        "A resposta da IA veio em um formato inválido. Tente novamente.",
        "maxi",
        new Date().toISOString()
      );

      return;
    }

    if (!resposta.ok) {
      removerCarregando();

      console.error(
        "Erro da API:",
        resposta.status,
        dados
      );

      adicionarMensagem(
        "Maxi",
        `Não consegui responder agora. Erro da API: ${resposta.status}.`,
        "maxi",
        new Date().toISOString()
      );

      return;
    }

    const respostaIA =
      extrairRespostaIA(dados);

    if (!respostaIA) {
      removerCarregando();

      adicionarMensagem(
        "Maxi",
        "Não consegui encontrar uma resposta válida. Pode tentar novamente?",
        "maxi",
        new Date().toISOString()
      );

      return;
    }

    const createdAtMaxi =
      new Date().toISOString();

    conversa.messages.push({
      role: "assistant",
      content: respostaIA,
      createdAt: createdAtMaxi
    });

    conversa.updatedAt =
      createdAtMaxi;

    limitarMensagensConversa(
      conversa
    );

    salvarConversas();
    renderConversationList();

    removerCarregando();

    await escreverTextoAnimado(
      "Maxi",
      respostaIA,
      createdAtMaxi
    );
  } catch (erro) {
    removerCarregando();

    console.error(
      "Erro ao conversar com a IA:",
      erro
    );

    adicionarMensagem(
      "Maxi",
      "Não consegui me comunicar com a IA agora. Verifique sua conexão e tente novamente.",
      "maxi",
      new Date().toISOString()
    );
  }
}

function extrairRespostaIA(dados) {
  if (!dados) {
    return "";
  }

  if (
    typeof dados.reply === "string"
  ) {
    return dados.reply.trim();
  }

  if (
    typeof dados.response === "string"
  ) {
    return dados.response.trim();
  }

  if (
    typeof dados.content === "string"
  ) {
    return dados.content.trim();
  }

  if (
    dados.message &&
    typeof dados.message.content ===
      "string"
  ) {
    return dados.message.content.trim();
  }

  if (
    Array.isArray(dados.choices) &&
    dados.choices[0] &&
    dados.choices[0].message &&
    typeof dados.choices[0].message
      .content === "string"
  ) {
    return dados.choices[0].message
      .content.trim();
  }

  return "";
}

function limitarMensagensConversa(
  conversa
) {
  const limite = 50;

  if (
    conversa.messages.length >
    limite
  ) {
    conversa.messages =
      conversa.messages.slice(
        -limite
      );
  }
}

/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatarHorario(dataIso) {
  const data =
    new Date(dataIso);

  if (
    Number.isNaN(data.getTime())
  ) {
    return "";
  }

  return data.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function gerarTituloConversa(texto) {
  const limpo =
    String(texto || "").trim();

  if (!limpo) {
    return "Nova conversa";
  }

  if (limpo.length > 32) {
    return (
      limpo.slice(0, 32) +
      "..."
    );
  }

  return limpo;
}

function escapeHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rolarParaBaixo() {
  const box =
    document.getElementById(
      "chat-box"
    );

  if (box) {
    box.scrollTop =
      box.scrollHeight;
  }
}

/* =========================================================
   BOTÕES E EVENTOS
========================================================= */

function conectarBotoes() {
  const btnAbrir =
    document.getElementById(
      "btn-abrir-chat"
    );

  const btnEnviar =
    document.getElementById(
      "btn-enviar"
    );

  const btnNova =
    document.getElementById(
      "btn-nova-conversa"
    );

  const btnExcluir =
    document.getElementById(
      "btn-excluir-conversa"
    );

  const btnConfig =
    document.getElementById(
      "btn-config"
    );

  const btnFecharConfig =
    document.getElementById(
      "btn-fechar-config"
    );

  const btnEstilo =
    document.getElementById(
      "btn-estilo"
    );

  const btnFecharEstilo =
    document.getElementById(
      "btn-fechar-estilo"
    );

  const input =
    document.getElementById(
      "user-input"
    );

  const modalConfig =
    document.getElementById(
      "config-modal"
    );

  const modalEstilo =
    document.getElementById(
      "estilo-modal"
    );

  if (btnAbrir) {
    btnAbrir.onclick = abrirChat;
  }

  if (btnEnviar) {
    btnEnviar.onclick =
      enviarMensagem;
  }

  if (btnNova) {
    btnNova.onclick =
      criarNovaConversa;
  }

  if (btnExcluir) {
    btnExcluir.onclick =
      excluirConversaAtual;
  }

  if (btnConfig) {
    btnConfig.onclick =
      abrirConfig;
  }

  if (btnFecharConfig) {
    btnFecharConfig.onclick =
      fecharConfig;
  }

  if (btnEstilo) {
    btnEstilo.onclick =
      abrirEstilo;
  }

  if (btnFecharEstilo) {
    btnFecharEstilo.onclick =
      fecharEstilo;
  }

  document
    .querySelectorAll(".theme-btn")
    .forEach((botao) => {
      botao.onclick = () => {
        const theme =
          botao.getAttribute(
            "data-theme-choice"
          );

        aplicarTema(theme);
      };
    });

  document
    .querySelectorAll(".style-btn")
    .forEach((botao) => {
      const style =
        botao.getAttribute(
          "data-style-choice"
        );

      if (!STYLE_PROMPTS[style]) {
        botao.style.display =
          "none";

        return;
      }

      botao.style.display = "";

      botao.onclick = () => {
        salvarEstilo(style);
      };
    });

  if (modalConfig) {
    modalConfig.onclick =
      (evento) => {
        if (
          evento.target ===
          modalConfig
        ) {
          fecharConfig();
        }
      };
  }

  if (modalEstilo) {
    modalEstilo.onclick =
      (evento) => {
        if (
          evento.target ===
          modalEstilo
        ) {
          fecharEstilo();
        }
      };
  }

  if (input) {
    input.onkeydown =
      (evento) => {
        if (
          evento.key === "Enter" &&
          !evento.shiftKey
        ) {
          evento.preventDefault();
          enviarMensagem();
        }
      };
  }
}

function conectarBotoesBasicos() {
  const btnAbrir =
    document.getElementById(
      "btn-abrir-chat"
    );

  const btnEnviar =
    document.getElementById(
      "btn-enviar"
    );

  if (btnAbrir) {
    btnAbrir.onclick =
      abrirChat;
  }

  if (btnEnviar) {
    btnEnviar.onclick =
      enviarMensagem;
  }
}

document.addEventListener(
  "DOMContentLoaded",
  iniciarMaxiComSeguranca
);
