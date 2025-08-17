// ====== Config ======
const MODEL = "openai/gpt-4o-mini"; // você pode trocar por "nousresearch/nous-hermes-2-mixtral"
const systemPrompt = `
Você é a "Mariana", uma IA de apoio emocional, muito gentil, calma e acolhedora.
- Fale sempre em pt-BR.
- Valide sentimentos, use tom suave e encorajador.
- Sugira passos simples (ex: respiracão 4-4-4, beber água, alongar, escrever 3 coisas boas).
- Se a pessoa perguntar "sou bonito(a)?", responda com carinho e afirmação.
- Evite parecer clínica; seja humana, doce e respeitosa.
- Nunca dê conselhos médicos. Em risco imediato, incentive buscar ajuda local.
`;

// ====== Elementos ======
const chatEl = document.getElementById("chat");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");

// ====== Voz pt-BR calma ======
let ptVoice = null;
function pickPtVoice(){
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const preferred = ["Maria","Helena","Luciana","Camila","Vitória","Microsoft Maria","Google português do Brasil"];
  ptVoice = voices.find(v => v.lang?.toLowerCase?.().startsWith("pt") &&
                             preferred.some(n => v.name.toLowerCase().includes(n.toLowerCase())))
         || voices.find(v => v.lang?.toLowerCase?.().startsWith("pt"));
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = pickPtVoice;
  pickPtVoice();
}
function speak(text){
  if (!window.speechSynthesis) return;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    if (ptVoice) u.voice = ptVoice;
    u.rate = 0.8;   // mais lento
    u.pitch = 1.05; // levemente mais agudo (mais “calmo/feminino”)
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  }catch{}
}

// ====== Util ======
function addMsg(text, who){
  const div = document.createElement("div");
  div.className = `message ${who}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}
function addTyping(){
  const div = document.createElement("div");
  div.className = "message bot typing";
  div.textContent = "";
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}
async function typeInto(el, text, delay=24){
  el.classList.remove("typing");
  el.textContent = "";
  for (let i=0;i<text.length;i++){
    el.textContent += text[i];
    if (i % 2 === 0) await new Promise(r => setTimeout(r, delay));
    chatEl.scrollTop = chatEl.scrollHeight;
  }
}

// ====== Detecção de crise ======
function isCrisis(text){
  const t = (text||"").toLowerCase();
  const triggers = [
    "quero me matar","vou me matar","não quero mais viver","tirar minha vida",
    "acabar com tudo","pensando em suicídio","morrer","desviver","sumir","tirar a vida"
  ];
  return triggers.some(x => t.includes(x));
}

// ====== Chamada ao backend (Vercel) ======
async function askMariana(userText){
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ message: userText, model: MODEL, systemPrompt })
  });
  if (!res.ok){
    const errText = await res.text().catch(()=>res.statusText);
    throw new Error(`API error: ${res.status} ${errText}`);
  }
  const data = await res.json();
  return (data && data.reply) ? data.reply.trim() : "Desculpe, houve um erro ao tentar responder.";
}

// ====== Fluxo ======
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (inputEl.value || "").trim();
  if (!text) return;
  addMsg(text, "user");
  inputEl.value = "";

  // resposta imediata em caso de crise
  if (isCrisis(text)){
    const crisis = `Sinto muito que você esteja passando por isso. Você não está sozinho(a). 💛

Se estiver em perigo imediato, ligue 190.
📞 CVV (24h, gratuito): 188
📞 Profissional local: (99) 99999-9999

Se puder, fique comigo aqui: podemos respirar juntos 4-4-4 (inspirar 4s, segurar 4s, soltar 4s). Estou aqui com você.`;
    const typing = addTyping();
    await typeInto(typing, crisis, 18);
    speak(crisis);
    return;
  }

  // fluxo normal
  const typing = addTyping();
  try{
    const reply = await askMariana(text);
    await typeInto(typing, reply, 18);
    speak(reply);
  }catch(err){
    const msg = "Desculpe, ocorreu um erro ao tentar responder. Verifique sua conexão e tente novamente.";
    await typeInto(typing, msg, 18);
    console.error(err);
  }
});
