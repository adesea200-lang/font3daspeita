const SHIPPING_KEY='fdp_checkout_shipping';
let selectedShipping=null;
let addressData=null;

function onlyDigits(v){return String(v||'').replace(/\D/g,'')}
function cartSubtotal(){return getCart().reduce((s,x)=>s+Number(x.unit||0)*Number(x.qty||1),0)}
function cartQty(){return getCart().reduce((s,x)=>s+Number(x.qty||1),0)}
function checkoutMoney(v){return money(Number(v||0))}

function renderCheckout(){
  const cart=getCart();
  const box=document.getElementById('checkoutItems');
  if(!cart.length){
    box.innerHTML='<div class="empty">Seu carrinho está vazio.<br><a href="index.html#catalogo">Voltar para as camisas</a></div>';
    document.getElementById('payButton').disabled=true;
    return;
  }
  box.innerHTML=cart.map(x=>`<div class="checkout-item"><div>${x.image?`<img src="${x.image}" alt="${x.name}">`:'👕'}</div><span><strong>${x.qty}x ${x.name}</strong><small>${x.season} • Tam. ${x.size}<br>${x.personal}</small></span><b>${checkoutMoney(x.unit*x.qty)}</b></div>`).join('');
  document.getElementById('checkoutSubtotal').textContent=checkoutMoney(cartSubtotal());
  updateCheckoutTotal();
}
function updateCheckoutTotal(){
  const ship=selectedShipping?Number(selectedShipping.price||0):0;
  document.getElementById('checkoutShipping').textContent=selectedShipping?checkoutMoney(ship):'—';
  document.getElementById('checkoutTotal').textContent=checkoutMoney(cartSubtotal()+ship);
}
function setStatus(msg,kind=''){const el=document.getElementById('shippingStatus');el.textContent=msg;el.className='checkout-status '+kind}

function selectShipping(i){
  const saved=JSON.parse(sessionStorage.getItem(SHIPPING_KEY)||'[]');
  selectedShipping=saved[i]||null;
  document.querySelectorAll('.shipping-option').forEach((el,n)=>el.classList.toggle('selected',n===i));
  updateCheckoutTotal();
  const btn=document.getElementById('payButton');btn.disabled=!selectedShipping;btn.textContent=selectedShipping?'Ir para pagamento seguro':'Escolha o frete para continuar';
}

async function lookupCep(){
  const cep=onlyDigits(document.getElementById('shippingCep').value);
  const fields=document.getElementById('addressFields');
  if(cep.length!==8){if(fields)fields.style.display='none';addressData=null;return;}
  setStatus('Buscando endereço pelo CEP...','loading');
  try{
    const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`);const d=await r.json();
    if(d.erro)throw new Error('CEP não encontrado.');
    addressData=d;
    document.getElementById('shippingStreetLabel').textContent=d.logradouro||'Rua não informada';
    document.getElementById('shippingLocationLabel').textContent=[d.bairro,d.localidade,d.uf].filter(Boolean).join(' • ');
    if(fields)fields.style.display='grid';
    setStatus('Endereço encontrado. Confira a rua e informe o número.','success');
  }catch(e){addressData=null;if(fields)fields.style.display='none';setStatus(e.message||'Não foi possível consultar o CEP.','error');}
}

async function calculateShipping(){
  const cart=getCart(); if(!cart.length)return;
  const cep=onlyDigits(document.getElementById('shippingCep').value);
  if(cep.length!==8){setStatus('Digite um CEP válido com 8 números.','error');return;}
  selectedShipping=null; updateCheckoutTotal();
  const btn=document.getElementById('calcShipping');btn.disabled=true;btn.textContent='Calculando...';
  setStatus('Consultando as opções de entrega...','loading');
  document.getElementById('shippingOptions').innerHTML='';
  try{
    const res=await fetch('/.netlify/functions/calculate-shipping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cep,cart})});
    const data=await res.json(); if(!res.ok)throw new Error(data.error||'Não foi possível calcular o frete.');
    const options=data.options||[]; sessionStorage.setItem(SHIPPING_KEY,JSON.stringify(options));
    if(!options.length){setStatus('Não encontramos opções de entrega para este CEP.','error');return;}
    setStatus(data.freeShipping?'🎉 Seu pedido ganhou frete grátis!':'Escolha uma opção de entrega abaixo.','success');
    document.getElementById('shippingOptions').innerHTML=options.map((o,i)=>`<button class="shipping-option" onclick="selectShipping(${i})"><span><strong>${o.company||'Entrega'}</strong><small>${o.name||''}${o.delivery_time?` • 2 dias para postagem + até ${o.delivery_time} dias de transporte`: ' • 2 dias para postagem'}</small></span><b>${checkoutMoney(o.price)}</b></button>`).join('');
    selectShipping(0);
  }catch(e){setStatus(e.message||'Erro ao calcular o frete.','error');}
  finally{btn.disabled=false;btn.textContent='Calcular frete';}
}

async function startPayment(){
  const cart=getCart(); if(!cart.length)return;
  if(!selectedShipping){alert('Escolha uma opção de frete primeiro.');return;}
  const name=document.getElementById('customerName').value.trim();
  const email=document.getElementById('customerEmail').value.trim();
  const phone=onlyDigits(document.getElementById('customerPhone').value);
  const cep=onlyDigits(document.getElementById('shippingCep').value);
  const streetNumber=document.getElementById('shippingNumber')?.value.trim()||'';
  const complement=document.getElementById('shippingComplement')?.value.trim()||'';
  if(!name||!email||!phone||cep.length!==8){alert('Preencha nome, e-mail, telefone e CEP para continuar.');return;}
  if(!addressData?.logradouro){alert('Consulte um CEP válido antes de continuar.');return;}
  if(!streetNumber){alert('Informe o número do endereço.');document.getElementById('shippingNumber')?.focus();return;}
  const btn=document.getElementById('payButton');btn.disabled=true;btn.textContent='Preparando pagamento...';
  try{
    const res=await fetch('/.netlify/functions/create-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cart,shipping:selectedShipping,customer:{name,email,phone,cep,street:addressData.logradouro,streetNumber,neighborhood:addressData.bairro||'',city:addressData.localidade||'',uf:addressData.uf||'',complement}})});
    const data=await res.json(); if(!res.ok)throw new Error(data.error||'Não foi possível iniciar o pagamento.');
    localStorage.setItem('fdp_last_order',JSON.stringify({cart,shipping:selectedShipping,customer:{name,email,phone,cep,street:addressData.logradouro,streetNumber,neighborhood:addressData.bairro||'',city:addressData.localidade||'',uf:addressData.uf||'',complement},createdAt:new Date().toISOString(),externalReference:data.external_reference}));
    window.location.href=data.init_point;
  }catch(e){alert(e.message||'Erro ao iniciar o pagamento.');btn.disabled=false;btn.textContent='Ir para pagamento seguro';}
}

function initCheckout(){
  renderCheckout();
  const support=document.getElementById('supportLink'); if(support)support.href=`https://wa.me/${WA}?text=${encodeURIComponent('Fala irmão! Preciso de ajuda com um pedido na Fonte das Peita.')}`;
  document.getElementById('calcShipping').addEventListener('click',calculateShipping);
  document.getElementById('payButton').addEventListener('click',startPayment);
  const cep=document.getElementById('shippingCep'); cep.addEventListener('input',()=>{let d=onlyDigits(cep.value).slice(0,8);cep.value=d.length>5?d.slice(0,5)+'-'+d.slice(5):d;if(d.length===8)lookupCep();else{addressData=null;document.getElementById('addressFields').style.display='none'}});
}
document.addEventListener('DOMContentLoaded',initCheckout);
