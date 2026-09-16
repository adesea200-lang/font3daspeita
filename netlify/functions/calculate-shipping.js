exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Método não permitido.'});
  try{
    const {cep,cart}=JSON.parse(event.body||'{}');
    const postal=String(cep||'').replace(/\D/g,'');
    if(postal.length!==8)return json(400,{error:'CEP inválido.'});
    if(!Array.isArray(cart)||!cart.length)return json(400,{error:'Carrinho vazio.'});
    const qty=cart.reduce((s,x)=>s+Math.max(1,Number(x.qty||1)),0);
    if(qty>=3)return json(200,{freeShipping:true,options:[{company:'Fonte das Peita',name:'Frete grátis',price:0,delivery_time:null}]});
    const token=process.env.MELHOR_ENVIO_TOKEN;
    const origin=String(process.env.ORIGIN_CEP||'').replace(/\D/g,'');
    if(!token||!origin)return json(500,{error:'Frete ainda não foi configurado no Netlify. Configure MELHOR_ENVIO_TOKEN e ORIGIN_CEP.'});
    const products=cart.map((x,i)=>({
      id:String(x.id||i+1),width:25,height:4,length:35,weight:0.35,
      insurance_value:Math.max(0.01,Number(x.unit||0)),quantity:Math.max(1,Number(x.qty||1))
    }));
    const api=process.env.MELHOR_ENVIO_SANDBOX==='true'?'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate':'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';
    const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':`Bearer ${token}`,'User-Agent':'Fonte das Peita (contato via WhatsApp)'},body:JSON.stringify({from:{postal_code:origin},to:{postal_code:postal},products})});
    const raw=await r.json();
    if(!r.ok)throw new Error(raw?.message||raw?.error||'Erro ao consultar o frete.');
    const options=(Array.isArray(raw)?raw:[]).filter(x=>!x.error&&x.price).map(x=>({company:x.company?.name||'Transportadora',name:x.name||'',price:Number(x.price),delivery_time:x.delivery_time||null}));
    return json(200,{freeShipping:false,options});
  }catch(e){return json(500,{error:e.message||'Erro inesperado ao calcular o frete.'});}
};
function json(status,body){return{statusCode:status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)}};
