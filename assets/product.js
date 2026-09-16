let product,selectedSize='',selectedPers='Sem personalização',persExtra=0,qty=1;
function choosePers(el,extra){
  document.querySelectorAll('.pers').forEach(x=>x.classList.remove('active'));el.classList.add('active');
  selectedPers=el.dataset.pers;persExtra=extra;
  const fields=document.getElementById('personalFields');
  if(fields)fields.style.display=selectedPers==='Com nome e número'?'grid':'none';
  if(selectedPers!=='Com nome e número'){const n=document.getElementById('personalName'),num=document.getElementById('personalNumber');if(n)n.value='';if(num)num.value='';}
}
function changeQty(d){qty=Math.max(1,qty+d);document.getElementById('qty').textContent=qty}
async function loadProduct(){
  await loadCloud();const id=Number(new URLSearchParams(location.search).get('id'));product=getProducts().find(p=>p.id===id)||getProducts()[0];if(!product)return;
  document.getElementById('name').textContent=product.name;document.getElementById('cat').textContent=product.cat;document.getElementById('season').textContent=product.season;document.getElementById('price').textContent=money(product.price);
  const box=document.getElementById('photoBox');box.innerHTML=product.image?`<img src="${product.image}" alt="${product.name}">`:'<div class="photo-placeholder">ADICIONE A FOTO<br>PELO PAINEL</div>';
  const sizes=document.getElementById('sizes');sizes.innerHTML='';['P','M','G','GG'].forEach(s=>{let b=document.createElement('button');b.textContent=s;b.onclick=()=>{document.querySelectorAll('#sizes button').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedSize=s};sizes.appendChild(b)});selectedSize='M';sizes.children[1].classList.add('active');
  let opts=document.getElementById('modelOptions');opts.innerHTML='<button class="active">'+product.season.split(' • ')[1]+'</button>';
}
function addProduct(){
  if(!selectedSize)return alert('Escolha um tamanho.');
  let personal=selectedPers;
  if(selectedPers==='Com nome e número'){
    const name=(document.getElementById('personalName')?.value||'').trim().toUpperCase();
    const number=(document.getElementById('personalNumber')?.value||'').trim();
    if(!name||!number)return alert('Digite o nome e o número da personalização.');
    if(!/^\d{1,2}$/.test(number))return alert('O número deve ter 1 ou 2 dígitos.');
    personal=`Personalização: ${name} • Nº ${number}`;
  }
  let unit=product.price+persExtra,c=getCart();
  c.push({id:product.id,name:product.name,season:product.season,size:selectedSize,personal,unit,qty,image:product.image});saveCart(c);openCart();
}
document.addEventListener('DOMContentLoaded',loadProduct);
