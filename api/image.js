/* Ísis v9.8.0 — geração de imagem real com a OpenAI */
module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
  const key=process.env.OPENAI_API_KEY;if(!key)return res.status(503).json({error:'OPENAI_API_KEY ausente'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const prompt=String(body.prompt||'').trim();if(prompt.length<3||prompt.length>1800)return res.status(400).json({error:'Pedido de imagem inválido.'});
    const quality=['medium','high'].includes(body.quality)?body.quality:'medium';
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),115000);
    let response;
    try{response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.ISIS_IMAGE_MODEL||'gpt-image-1-mini',prompt,size:'1024x1024',quality,output_format:'webp',n:1}),signal:controller.signal});}finally{clearTimeout(timer);}
    const data=await response.json();if(!response.ok)return res.status(response.status).json({error:data.error?.message||'Não foi possível gerar imagem'});
    const b64=data.data?.[0]?.b64_json;if(!b64)return res.status(502).json({error:'Imagem vazia'});
    return res.status(200).json({url:'data:image/webp;base64,'+b64});
  }catch(e){return res.status(502).json({error:'Erro ao gerar imagem: '+(e.name==='AbortError'?'tempo excedido':'serviço indisponível')});}
};
