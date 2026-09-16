const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etewywgqcyxuemqhdxzr.supabase.co';
exports.handler=async(event)=>{
  try{
    if(event.httpMethod!=='POST'&&event.httpMethod!=='GET')return json(405,{error:'Método não permitido.'});
    const qs=event.queryStringParameters||{};
    let payload={};try{payload=JSON.parse(event.body||'{}')}catch{}
    const paymentId=qs['data.id']||payload?.data?.id;
    const type=qs.type||payload?.type;
    if(!paymentId||type!=='payment')return json(200,{received:true});
    const token=process.env.MERCADO_PAGO_ACCESS_TOKEN;if(!token)return json(500,{error:'Token do Mercado Pago não configurado.'});
    const r=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${token}`}});
    const payment=await r.json();if(!r.ok)throw new Error(payment?.message||'Não foi possível consultar o pagamento.');
    const ref=payment.external_reference;if(!ref)return json(200,{received:true});
    const statusMap={approved:'aprovado',pending:'pendente',in_process:'em_analise',rejected:'rejeitado',cancelled:'cancelado',refunded:'reembolsado',charged_back:'estornado'};
    await supabaseUpdate('orders',{external_reference:ref},{status:statusMap[payment.status]||String(payment.status||'desconhecido'),mercado_pago_payment_id:String(payment.id),payment_method:String(payment.payment_type_id||payment.payment_method_id||''),payment_status_detail:String(payment.status_detail||'')});
    return json(200,{received:true});
  }catch(e){return json(500,{error:e.message||'Erro no webhook.'});}
};
async function supabaseUpdate(table,filters,row){const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');const q=Object.entries(filters).map(([k,v])=>`${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`).join('&');const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`,{method:'PATCH',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)});if(!r.ok)throw new Error(await r.text());}
function json(status,body){return{statusCode:status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)}}
