module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
 const key=process.env.ISIS_IMAGE_API_KEY,url=process.env.ISIS_IMAGE_API_URL,model=process.env.ISIS_IMAGE_MODEL;
 if(!key||!url||!model)return res.status(503).json({error:'Configure um provedor de imagens compatível (ISIS_IMAGE_API_KEY, ISIS_IMAGE_API_URL, ISIS_IMAGE_MODEL).'});
 try{
  const parsed=new URL(url);if(parsed.protocol!=='https:')return res.status(400).json({error:'O endpoint de imagens precisa usar HTTPS.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};const prompt=String(body.prompt||'').trim();if(prompt.length<3||prompt.length>1500)return res.status(400).json({error:'Descreva a imagem em até 1500 caracteres.'});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);let r;
  try{r=await fetch(parsed.href,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,n:1,size:'1024x1024'}),signal:controller.signal});}finally{clearTimeout(timer);}
  const data=await r.json();if(!r.ok)return res.status(r.status).json({error:data.error?.message||'O provedor não conseguiu gerar a imagem.'});
  const item=data.data?.[0]||{};
  const out=typeof item.url==='string'?item.url:typeof item.b64_json==='string'?'data:image/png;base64,'+item.b64_json:null;
  if(!out)return res.status(502).json({error:'O provedor não retornou uma imagem válida.'});
  return res.status(200).json({url:out});
 }catch(e){return res.status(502).json({error:e.name==='AbortError'?'O tempo de geração de imagens excedeu o limite.':'Serviço de imagem indisponível.'});}
};
