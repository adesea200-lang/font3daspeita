const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etewywgqcyxuemqhdxzr.supabase.co';
exports.handler=async(event)=>{
  try{
    if(event.httpMethod!=='POST')return json(405,{error:'Método não permitido.'});
    const {password}=JSON.parse(event.body||'{}');
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw new Error('Configure SUPABASE_SERVICE_ROLE_KEY no Netlify.');
    const settings=await supa(`settings?id=eq.1&select=password`,key);
    if(!settings?.[0]||settings[0].password!==password)return json(401,{error:'Senha incorreta.'});
    const orders=await supa('orders?select=*&order=created_at.desc&limit=100',key);
    return json(200,{orders});
  }catch(e){return json(500,{error:e.message||'Erro ao carregar pedidos.'});}
};
async function supa(path,key){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});const t=await r.text();if(!r.ok)throw new Error(t);return t?JSON.parse(t):[]}
function json(status,body){return{statusCode:status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)}}
