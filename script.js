// ====== CONFIG ======
const API_KEY = "COLE_SUA_CHAVE_AQUI";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nousresearch/nous-capybara-7b";

// ====== CRÉDITOS ======
let creditos = localStorage.getItem("creditos");
if (creditos === null) {
  creditos = 200;
  localStorage.setItem("creditos", String(creditos));
} else {
  creditos = parseInt(creditos, 10);
}
atualizarCreditos();

// ====== MEMÓRIA ======
const HISTORY_KEY = "aurora_history_v1_5";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Aurora, uma IA de apoio emocional. Seja calma, acolhedora e respeitosa. " +
    "Não dê diagnósticos médicos. Incentive buscar ajuda profissional quando necessário. " +
    "Se o usuário mencionar autoagressão ou suicídio, responda com cuidado e sugira buscar ajuda imediata (CVV 188 no Brasil)."
};

let historico = carregarHistorico();

function carregarHistorico() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [SYSTEM_PROMPT];
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [SYSTEM_PROMPT];

    if (parsed.length === 0 || parsed[0].role !== "system") {
      return [SYSTEM_PROMPT, ...parsed];
    }

    return parsed;
  } catch (e) {
    console.warn("Falha ao carregar histórico:", e);
    return [SYSTEM_PROMPT];
  }
}

function salvarHistorico() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
}

function limitarHistorico(maxMensagens = 15) {
  if (historico.length <= maxMensagens) return;

  const system = historico[0];
  const tail = historico.slice(-(maxMensagens - 1));

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

// ====== VOZ ======
function falar(texto) {
  try {
    if (!("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.pitch = 1;
    fala.rate = 0.9;
    fala.volume = 1;

    const voces = synth.getVoices();
    const vozPt =
      voces.find(v => v.lang === "pt-BR") ||
      voces.find(v => v.lang.startsWith("pt"));

    if (vozPt) fala.voice = vozPt;

    synth.speak(fala);
  } catch (e) {
    console.warn("Falha ao falar:", e);
  }
}

// ====== FUNÇÃO PRINCIPAL ======
async function enviarMensagem() {

  const input = document.getElementById("user-input");
  const texto = (input?.value || "").trim();

  if (!texto) return;

  if (creditos <= 0) {
    alert("Você não tem mais créditos. Volte amanhã.");
    return;
  }

  adicionarMensagem("Você", texto);
  input.value = "";

  creditos--;
  localStorage.setItem("creditos", String(creditos));
  atualizarCreditos();

  historico.push({
    role: "user",
    content: texto
  });

  limitarHistorico();
  salvarHistorico();

  try {

    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: historico
      })
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro da API:", data);
      adicionarMensagem("Aurora", "Erro da API. Veja o console.");
      return;
    }

    const conteudo = data?.choices?.[0]?.message?.content;

    if (!conteudo) {
      adicionarMensagem("Aurora", "A IA não retornou texto.");
      return;
    }

    adicionarMensagem("Aurora", conteudo);
    falar(conteudo);

    historico.push({
      role: "assistant",
      content: conteudo
    });

    limitarHistorico();
    salvarHistorico();

  } catch (erro) {
    console.error("Erro de comunicação:", erro);
    adicionarMensagem("Aurora", "Erro ao se comunicar com a IA.");
  }
}

// ====== ENTER ENVIA ======
document.addEventListener("keydown", (e) => {

  if (e.key === "Enter" && !e.shiftKey) {

    const active = document.activeElement;

    if (active && active.id === "user-input") {
      e.preventDefault();
      enviarMensagem();
    }

  }

});

// ====== LIMPAR MEMÓRIA ======
function limparMemoriaAurora() {

  localStorage.removeItem(HISTORY_KEY);

  historico = [SYSTEM_PROMPT];

  salvarHistorico();

  console.log("Memória limpa");

}
