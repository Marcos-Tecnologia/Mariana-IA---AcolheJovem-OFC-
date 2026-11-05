const {readCookie,writeCookie,bankRequest}=require('../lib/isis-bank');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Cookie');
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
 if(!process.env.BANK_MAX_API_URL||!process.env.ISIS_BANK_SHARED_SECRET||!process.env.ISIS_SESSION_SECRET)return res.status(503).json({error:'A integração com o Banco Max ainda não foi configurada.'});
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const action=body.action;
  if(action==='logout'){writeCookie(res,'',true);return res.status(200).json({ok:true});}
  if(action==='login'){
   const username=String(body.username||'').slice(0,60),password=String(body.password||'').slice(0,200);
   if(!username||!password)return res.status(400).json({error:'Informe usuário e senha do Banco Max.'});
   const result=await bankRequest('login',{username,password});
   const profile=await bankRequest('isis_profile',{},result.token);
   writeCookie(res,result.token);return res.status(200).json({ok:true,...profile,user:profile.user});
  }
  const token=readCookie(req);if(!token)return res.status(401).json({error:'Entre com sua conta do Banco Max.'});
  if(action==='status'){const result=await bankRequest('isis_profile',{},token);return res.status(200).json({ok:true,...result});}
  if(action==='purchase'){
   const plan=String(body.plan||'');const accountId=String(body.accountId||'');const orderId=String(body.orderId||'');
   if(!['go','plus','pro_max'].includes(plan)||!accountId||!orderId)return res.status(400).json({error:'Dados da assinatura inválidos.'});
   const result=await bankRequest('isis_purchase',{plan,accountId,orderId},token);
   return res.status(200).json({ok:true,...result});
  }
  return res.status(400).json({error:'Ação inválida.'});
 }catch(e){return res.status(/sess[aã]o|usu[aá]rio ou senha/i.test(e.message)?401:400).json({error:e.message||'Falha na integração.'});}
};
