/* Ísis v9.8.0 — endpoint Vercel, chave privada em OPENAI_API_KEY */
module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido.'});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return res.status(503).json({error:'Configure OPENAI_API_KEY no servidor.'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const messages=Array.isArray(body.messages)?body.messages:[];
    if(!messages.length || JSON.stringify(messages).length>110000)return res.status(400).json({error:'Mensagens inválidas ou muito longas.'});
    const mode=['instantaneo','pensativo','aprender'].includes(body.mode)?body.mode:'instantaneo';
    const model=mode==='instantaneo'?(process.env.ISIS_MODEL_INSTANT||'gpt-4.1-mini'):(process.env.ISIS_MODEL_THINK||'gpt-5-mini');
    const payload={model,messages:messages.filter(m=>['system','user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,18000)})),max_completion_tokens:mode==='instantaneo'?850:1800};
    if(model.startsWith('gpt-5'))payload.reasoning_effort=mode==='pensativo'?'medium':'low';
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),55000);
    let response;
    try{response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});}finally{clearTimeout(timeout);}
    const result=await response.json();
    if(!response.ok)return res.status(response.status).json({error:result.error?.message||'Falha no provedor de IA.'});
    return res.status(200).json({reply:result.choices?.[0]?.message?.content||''});
  }catch(e){return res.status(502).json({error:e.name==='AbortError'?'A IA demorou demais.':'Falha ao acessar a IA.'});}
};
