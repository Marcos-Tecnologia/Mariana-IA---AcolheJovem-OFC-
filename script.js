// =======================
// AURORA v1.5 (MEMÓRIA)
// =======================

// ---- CONFIG ----
const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nousresearch/nous-capybara-7b"; // mantém o mesmo modelo que você vinha usando

// ---- STORAGE KEYS ----
const CREDITS_KEY = "aurora_credits";
const HISTORY_KEY = "aurora_history_v1_5";

// ---- SYSTEM PROMPT (só orienta o jeito, não muda visual nem modelo) ----
const SYSTEM_PROMPT = {
  role: "system",
  content:
    "Você é Aurora, uma IA de apoio emocional. Seja calma, acolhedora e respeitosa. " +
    "Não dê diagnósticos. Incentive buscar ajuda profissional quando necessário. " +
    "Se o usuário mencionar autoagressão/suicídio, responda com cuidado e sugira ajuda imediata (Brasil: CVV 188)."
};

// =======================
// BOOT / DEBUG
// =======================
console.log("✅ Aurora: script.js carregou");

// =======================
// CRÉDITOS (200)
// =======================
let creditos = carregarCreditos();

function carregarCreditos() {
  const raw = localStorage.getItem(CREDITS_KEY);
  if (raw === null) {
    localStorage.setItem(CREDITS_KEY, "200");
    return 200;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 200;
}

function salvarCreditos() {
  localStorage.setItem(CREDITS_KEY, String(creditos));
}

function atualizarCreditosUI() {
  const el = document.getElementById("creditos");
  if (el) el.innerText = `Créditos restantes: ${creditos}`;
}

// =======================
// MEMÓRIA DE CONVERSA
// =======================
let historico = carregarHistorico();

function carregarHistorico() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [SYSTEM_PROMPT];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [SYSTEM_PROMPT];

    // garantir system prompt no começo
    if (parsed.length === 0) return [SYSTEM_PROMPT];
    if (parsed[0].role !== "system") return [SYSTEM_PROMPT, ...parsed];
    return parsed;
  } catch (e) {
    console.warn("⚠️ Aurora: falha ao carregar histórico:", e);
    return [SYSTEM_PROMPT];
  }
}

function salvarHistorico() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
  } catch (e) {
    console.warn("⚠️ Aurora: falha ao salvar histórico:", e);
  }
}

// limita para não ficar infinito: system + últimas 20 mensagens
function limitarHistorico(maxMensagens = 21) {
  if (historico.length <= maxMensagens) return;
  const system = historico[0];
  const tail = historico.slice(-(maxMensagens - 1));
  historico = [system, ...tail];
  salvarHistorico();
}

// =======================
// UI (mensagens)
// =======================
function adicionarMensagem(remetente, texto) {
  const box = document.getElementById("chat-box");
  if (!box) {
    console.error("❌ Aurora: #chat-box não encontrado no HTML");
    return;
  }
  const div = document.createElement("div");
  div.innerHTML = `<strong>${remetente}:</strong> ${escapeHtml(texto)}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// evita quebrar HTML se vier caracteres especiais
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =======================
// VOZ (calma)
// =======================
function falar(texto) {
  try {
    if (!("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // não acumular fala

    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;

    // escolher alguma voz pt-BR se existir
    const voces = synth.getVoices();
    const vozPtBR = voces.find(v => v.lang === "pt-BR")
      || voces.find(v => v.lang && v.lang.startsWith("pt"));

    if (vozPtBR) u.voice = vozPtBR;

    synth.speak(u);
  } catch (e) {
    console.warn("⚠️ Aurora: erro na fala:", e);
  }
}

// =======================
// FUNÇÃO PRINCIPAL
// =======================
async function enviarMensagem() {
  console.log("✅ Aurora: clique detectado em enviarMensagem()");

  const input = document.getElementById("user-input");
  if (!input) {
    console.error("❌ Aurora: #user-input não encontrado no HTML");
    return;
  }

  const texto = input.value.trim();
  if (!texto) return;

  if (creditos <= 0) {
    alert("Você não tem mais créditos. Por favor, volte amanhã.");
    return;
  }

  // UI + créditos
  adicionarMensagem("Você", texto);
  input.value = "";
  creditos--;
  salvarCreditos();
  atualizarCreditosUI();

  // memória
  historico.push({ role: "user", content: texto });
  limitarHistorico(21);
  salvarHistorico();

  console.log("[Aurora] Enviando API:", { model: MODEL, historico: historico.length });

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Aurora"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: historico
      })
    });

    const raw = await resp.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error("❌ Aurora: resposta não-JSON:", raw);
      adicionarMensagem("Aurora", "A resposta da IA veio inválida (não-JSON). Veja o console (F12).");
      return;
    }

    if (!resp.ok) {
      console.error("❌ Aurora: erro HTTP", resp.status, data);
      adicionarMensagem("Aurora", `Erro da API (${resp.status}). Veja o console (F12).`);
      return;
    }

    const respostaIA = data?.choices?.[0]?.message?.content;
    if (!respostaIA) {
      console.error("❌ Aurora: sem content:", data);
      adicionarMensagem("Aurora", "A IA não retornou texto. Veja o console (F12).");
      return;
    }

    adicionarMensagem("Aurora", respostaIA);
    falar(respostaIA);

    // memória
    historico.push({ role: "assistant", content: respostaIA });
    limitarHistorico(21);
    salvarHistorico();

  } catch (e) {
    console.error("❌ Aurora: falha fetch/rede:", e);
    adicionarMensagem("Aurora", "Ocorreu um erro ao se comunicar com a IA. Veja o console (F12).");
  }
}

// =======================
// LIGAR BOTÃO SEM ONCLICK
// =======================
window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Aurora: DOM pronto");

  // Atualiza créditos na tela ao carregar
  atualizarCreditosUI();

  const btn = document.getElementById("btn-enviar");
  const input = document.getElementById("user-input");

  if (!btn) console.error("❌ Aurora: botão #btn-enviar não encontrado no HTML");
  if (!input) console.error("❌ Aurora: campo #user-input não encontrado no HTML");

  if (btn) btn.addEventListener("click", enviarMensagem);

  // Enter para enviar
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
});

// =======================
// (OPCIONAL) Limpar memória
// =======================
function limparMemoriaAurora() {
  localStorage.removeItem(HISTORY_KEY);
  historico = [SYSTEM_PROMPT];
  salvarHistorico();
  console.log("🧹 Aurora: memória limpa");
}

// expor globalmente (caso use onclick no HTML)
window.enviarMensagem = enviarMensagem;
window.limparMemoriaAurora = limparMemoriaAurora;
