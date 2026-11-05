const crypto=require('node:crypto');
const COOKIE='isis_bank_session_v10';
function key(){const s=process.env.ISIS_SESSION_SECRET||'';if(s.length<32)throw new Error('Configure ISIS_SESSION_SECRET (mínimo 32 caracteres).');return crypto.createHash('sha256').update(s).digest();}
function seal(token){const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);const encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');}
function unseal(value){try{const b=Buffer.from(value,'base64url');const decipher=crypto.createDecipheriv('aes-256-gcm',key(),b.subarray(0,12));decipher.setAuthTag(b.subarray(12,28));return Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString('utf8');}catch{return null;}}
function readCookie(req){const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));return raw?unseal(decodeURIComponent(raw.slice(COOKIE.length+1))):null;}
function writeCookie(res,token,clear=false){const https=process.env.NODE_ENV==='production'||process.env.VERCEL==='1';res.setHeader('Set-Cookie',`${COOKIE}=${clear?'':encodeURIComponent(seal(token))}; Path=/; HttpOnly; SameSite=Lax; ${https?'Secure; ':''}Max-Age=${clear?0:60*60*24*50}`);}
function bankUrl(){const u=new URL(process.env.BANK_MAX_API_URL||'');if(u.protocol!=='https:' && !(u.hostname==='localhost' && u.protocol==='http:'))throw new Error('BANK_MAX_API_URL deve ser HTTPS.');if(u.username||u.password||u.search||u.hash)throw new Error('URL do Banco Max inválida.');return u.href;}
async function bankRequest(action,fields={},token=''){
 const headers={'Content-Type':'application/json'};
 if(token) headers.Authorization='Bearer '+token;
 if(action.startsWith('isis_'))headers['x-isis-secret']=process.env.ISIS_BANK_SHARED_SECRET||'';
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
 try{const r=await fetch(bankUrl(),{method:'POST',headers,body:JSON.stringify({action,...fields}),signal:controller.signal});const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||'Banco Max indisponível.');return data;}
 finally{clearTimeout(timer);}
}
module.exports={readCookie,writeCookie,bankRequest};
