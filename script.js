const API_KEY = prompt("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");
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nousresearch/nous-capybara-7b";

async function enviarMensagem() {
  const input = document.getElementById("user-input");
  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem("Você", texto);
  input.value = "";

  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "user", content: texto }
        ]
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro da API:", resposta.status, dados);
      adicionarMensagem("Aurora", `Erro da API (${resposta.status}).`);
      return;
    }

    const respostaIA = dados?.choices?.[0]?.message?.content || "Sem resposta.";
    adicionarMensagem("Aurora", respostaIA);

  } catch (erro) {
    console.error("Erro:", erro);
    adicionarMensagem("Aurora", "Erro ao se comunicar com a IA.");
  }
}

function adicionarMensagem(remetente, texto) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.innerHTML = `<strong>${remetente}:</strong> ${texto}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
