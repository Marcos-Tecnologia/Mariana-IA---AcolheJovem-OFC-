// ====== CONFIG ======
const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nousresearch/nous-capybara-7b";

// ====== CRÉDITOS (mantém seu sistema atual) ======
let creditos = localStorage.getItem("creditos");
if (creditos === null) {
  creditos = 200;
  localStorage.setItem("creditos", String(creditos));
} else {
  creditos = parseInt(creditos, 10);
}
atualizarCreditos();

// ====== MEMÓRIA DE CONVERSA (NOVO) ======
// Guarda a conversa para mandar junto na API.
// Persistimos no localStorage para não perder se der F5.
const HISTORY_KEY = "aurora_history_v1_5";

// System prompt só para definir o "jeito" da Aurora. (não muda modelo, só orienta)
const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Aurora, uma IA de apoio emocional. Seja calma, acolhedora e respeitosa. " +
    "Não dê diagnósticos médicos. Incentive buscar ajuda profissional quando necessário. " +
    "Se o usuário mencionar autoagressão ou suicídio, responda com cuidado e sugira buscar ajuda imediata (ex: CVV 188 no Brasil)."
};

let historico = carregarHistorico();

// Sempre garantir que o system prompt esteja no início
function carregarHistorico() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [SYSTEM_PROMPT];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [SYSTEM_PROMPT];

    // garantir system prompt no começo
    const hasSystem = parsed.length && parsed[0].role === "system";
    return hasSystem ? parsed : [SYSTEM_PROMPT, ...parsed];
  } catch (e) {
    console.warn("Falha ao carregar histórico:", e);
    return [SYSTEM_PROMPT];
  }
}

function salvarHistorico() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
  } catch (e) {
    console.warn("Falha ao salvar histórico:", e);
  }
}

// Limitar o histórico para não crescer infinito (NOVO)
// Mantém system + últimas 14 mensagens (7 trocas user/assistant)
function limitarHistorico(maxMensagens = 15) {
  if (historico.length <= maxMensagens) return;
  const system = historico[0];
  const tail = historico.slice(- (maxMensagens - 1));
  historico = [system, ...tail];
  salvarHistorico();
}

// ====== UI ======
function atualizarCreditos() {
  const el = document.getElementById("creditos");
  if (el) el.innerText = `Créditos restantes: ${creditos}`;
}

function adicionarMensagem(remetente, mensagem) {
  const box = document.getElementById("chat-box");
  if (!box) return;
  const div = document.createElement("div");
  div.innerHTML = `<strong>${remetente}:</strong> ${mensagem}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ====== VOZ (mantém como estava) ======
function falar(texto) {
  try {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    // Se houver fila, limpa para não "embolar"
    synth.cancel();

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.pitch = 1;
    fala.rate = 0.9;   // mais calmo
    fala.volume = 1;

    const voces = synth.getVoices();
    const vozPt = voces.find(v => v.lang === "pt-BR") || voces.find(v => v.lang.startsWith("pt"));
    if (vozPt) fala.voice = vozPt;

    synth.speak(fala);
  } catch (e) {
    console.warn("Falha ao falar:", e);
  }
}

// Alguns navegadores carregam vozes após um tempo
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {};
}

// ====== CHAMADA PRINCIPAL ======
async function enviarMensagem() {
  const input = document.getElementById("user-input");
  const texto = (input?.value || "").trim();
  if (!texto) return;

  if (creditos <= 0) {
    alert("Você não tem mais créditos. Por favor, volte amanhã.");
    return;
  }

  // UI
  adicionarMensagem("Você", texto);
  if (input) input.value = "";

  // créditos (mantém seu fluxo)
  creditos--;
  localStorage.setItem("creditos", String(creditos));
  atualizarCreditos();

  // memória (NOVO)
  historico.push({ role: "user", content: texto });
  limitarHistorico(15);
  salvarHistorico();

  // DEBUG (NOVO)
  console.log("[Aurora] Enviando para API:", {
    model: MODEL,
    historico_len: historico.length
  });

  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        // headers recomendados pela OpenRouter (opcional, mas ajuda)
        "HTTP-Referer": window.location.origin,
        "X-Title": "Aurora"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: historico
      })
    });

    // Se a API responder erro (NOVO: mostra detalhes)
    const rawText = await resposta.text();
    let dados;
    try {
      dados = JSON.parse(rawText);
    } catch {
      // não era JSON
      console.error("[Aurora] Resposta não-JSON:", rawText);
      adicionarMensagem("Aurora", "Desculpe, a resposta da IA veio inválida (não-JSON).");
      return;
    }

    if (!resposta.ok) {
      console.error("[Aurora] Erro HTTP:", resposta.status, dados);
      adicionarMensagem("Aurora", `Erro da API (${resposta.status}). Veja o console (F12) para detalhes.`);
      return;
    }

    const conteudo = dados?.choices?.[0]?.message?.content;
    if (!conteudo) {
      console.error("[Aurora] Sem content em choices:", dados);
      adicionarMensagem("Aurora", "A IA não retornou texto. Veja o console (F12).");
      return;
    }

    // UI
    adicionarMensagem("Aurora", conteudo);
    falar(conteudo);

    // memória (NOVO)
    historico.push({ role: "assistant", content: conteudo });
    limitarHistorico(15);
    salvarHistorico();

  } catch (erro) {
    console.error("[Aurora] Falha de rede/fetch:", erro);
    adicionarMensagem("Aurora", "Ocorreu um erro ao se comunicar com a IA. Veja o console (F12).");
  }
}

// (Opcional) atalho Enter para enviar, sem mexer no layout
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    const active = document.activeElement;
    if (active && active.id === "user-input") {
      e.preventDefault();
      enviarMensagem();
    }
  }
});

// (Opcional) função para limpar memória, se você quiser depois (não muda nada sozinho)
function limparMemoriaAurora() {
  localStorage.removeItem(HISTORY_KEY);
  historico = [SYSTEM_PROMPT];
  salvarHistorico();
  console.log("[Aurora] Memória limpa.");
}
