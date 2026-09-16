const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etewywgqcyxuemqhdxzr.supabase.co';

exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Método não permitido.'});
  try{
    const {cart,shipping,customer}=JSON.parse(event.body||'{}');
    if(!Array.isArray(cart)||!cart.length)return json(400,{error:'Carrinho vazio.'});
    if(!shipping||typeof shipping.price==='undefined')return json(400,{error:'Selecione o frete.'});
    if(!customer?.name||!customer?.email)return json(400,{error:'Dados do cliente incompletos.'});
    if(!customer?.streetNumber)return json(400,{error:'Informe o número do endereço.'});
    const token=process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if(!token)return json(500,{error:'Pagamento ainda não foi configurado no Netlify. Configure MERCADO_PAGO_ACCESS_TOKEN.'});

    const origin=process.env.URL||process.env.DEPLOY_PRIME_URL||'http://localhost:8888';
    const items=cart.map((x,i)=>({
      id:String(x.id||i+1),
      title:`${x.name} — ${x.season} — Tam. ${x.size}${x.personal?' — '+x.personal:''}`,
      quantity:Math.max(1,Number(x.qty||1)),currency_id:'BRL',unit_price:Number(x.unit||0)
    }));
    items.push({id:'shipping',title:`Frete — ${shipping.company||'Entrega'} ${shipping.name||''}`.trim(),quantity:1,currency_id:'BRL',unit_price:Number(shipping.price||0)});

    const externalReference=`fdp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const body={
      items,
      payer:{
        name:String(customer.name).slice(0,100),
        email:String(customer.email).slice(0,120),
        phone:splitPhone(customer.phone),
        address:{
          zip_code:String(customer.cep||''),
          street_name:String(customer.street||''),
          street_number:String(customer.streetNumber||''),
          neighborhood:String(customer.neighborhood||''),
          city:String(customer.city||''),
          state:String(customer.uf||''),
          complement:String(customer.complement||'')
        }
      },
      external_reference:externalReference,
      statement_descriptor:'FONTE DAS PEITA',
      back_urls:{success:`${origin}/pedido-sucesso.html`,failure:`${origin}/pedido-falhou.html`,pending:`${origin}/pedido-pendente.html`},
      auto_return:'approved',
      notification_url:`${origin}/.netlify/functions/mercado-pago-webhook`,
      metadata:{shipping_cep:String(customer.cep||''),shipping_company:String(shipping.company||''),shipping_name:String(shipping.name||''),customer_phone:String(customer.phone||'')}
    };

    const order={
      external_reference:externalReference,
      status:'aguardando_pagamento',
      customer_name:String(customer.name).slice(0,120),
      customer_email:String(customer.email).slice(0,160),
      customer_phone:String(customer.phone||''),
      cep:String(customer.cep||''),
      street:String(customer.street||''),
      street_number:String(customer.streetNumber||''),
      neighborhood:String(customer.neighborhood||''),
      city:String(customer.city||''),
      uf:String(customer.uf||''),
      complement:String(customer.complement||''),
      shipping_company:String(shipping.company||''),
      shipping_name:String(shipping.name||''),
      shipping_price:Number(shipping.price||0),
      items:cart,
      subtotal:cart.reduce((s,x)=>s+Number(x.unit||0)*Math.max(1,Number(x.qty||1)),0),
      total:cart.reduce((s,x)=>s+Number(x.unit||0)*Math.max(1,Number(x.qty||1)),0)+Number(shipping.price||0)
    };
    await supabaseInsert('orders',order);

    const r=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify(body)});
    const data=await r.json();
    if(!r.ok){await supabaseUpdate('orders',{external_reference:externalReference},{status:'erro_pagamento',payment_detail:data?.message||'Erro ao criar o pagamento.'});throw new Error(data?.message||'Erro ao criar o pagamento.');}
    await supabaseUpdate('orders',{external_reference:externalReference},{mercado_pago_preference_id:data.id});
    return json(200,{init_point:data.init_point,id:data.id,external_reference:externalReference});
  }catch(e){return json(500,{error:e.message||'Erro inesperado ao iniciar pagamento.'});}
};

function splitPhone(v){const d=String(v||'').replace(/\D/g,'');return d.length>=10?{area_code:d.slice(0,2),number:d.slice(2)}:undefined}
async function supabaseRequest(path,options={}){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)throw new Error('Banco de pedidos ainda não foi configurado no Netlify. Configure SUPABASE_SERVICE_ROLE_KEY.');
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...(options.headers||{})}});
  const text=await r.text(); if(!r.ok)throw new Error(text||'Erro ao salvar pedido.'); return text?JSON.parse(text):null;
}
async function supabaseInsert(table,row){return supabaseRequest(table,{method:'POST',body:JSON.stringify(row)})}
async function supabaseUpdate(table,filters,row){const q=Object.entries(filters).map(([k,v])=>`${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`).join('&');return supabaseRequest(`${table}?${q}`,{method:'PATCH',body:JSON.stringify(row)})}
function json(status,body){return{statusCode:status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)}}
