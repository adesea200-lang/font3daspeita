let sb=null;
function canonicalCat(cat){const m={'Brasileiras':'Brasileiros','Europeias':'Europeus','Retrô':'Retrôs','Seleção':'Seleções','Seleções':'Seleções','Brasileiros':'Brasileiros','Europeus':'Europeus','Retrôs':'Retrôs'};return m[cat]||'Brasileiros';}
function supabaseReady(){
  if(!sb){
    if(!window.supabase) throw new Error('Biblioteca Supabase não carregou.');
    sb=window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
  }
  return sb;
}
async function cloudProducts(){ const {data,error}=await supabaseReady().from('products').select('*').order('id'); if(error) throw error; return data||[]; }
async function cloudBanners(){ const {data,error}=await supabaseReady().from('banners').select('*').order('id'); if(error) throw error; return data||[]; }
async function cloudSettings(){ const {data,error}=await supabaseReady().from('settings').select('*').eq('id',1).maybeSingle(); if(error) throw error; return data||null; }
function normalizeProduct(p){return {id:p.id,name:p.name,cat:canonicalCat(p.cat),season:p.season,price:Number(p.price),image:p.image||''};}
function normalizeBanner(b){return {id:b.id,title:b.title||'',subtitle:b.subtitle||'',image:b.image||''};}
function normalizeSettings(s){return {whatsapp:s?.whatsapp||'5512991580761',instagram:s?.instagram||'@fontedaspeita_ofc',password:s?.password||'050423'};}
async function uploadCloudImage(file,folder){
  if(!file) throw new Error('Nenhum arquivo selecionado.');
  if(file.size>6*1024*1024) throw new Error('A imagem precisa ter até 6 MB.');
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const safe=folder.replace(/[^a-z0-9_-]/gi,'_');
  const path=`${safe}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const {error}=await supabaseReady().storage.from(window.SUPABASE_BUCKET).upload(path,file,{cacheControl:'31536000',contentType:file.type||'image/jpeg',upsert:false});
  if(error) throw error;
  return supabaseReady().storage.from(window.SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
}
async function saveProductCloud(p){const row={id:Number(p.id),name:p.name,cat:canonicalCat(p.cat),season:p.season,price:Number(p.price),image:p.image||''};const {error}=await supabaseReady().from('products').upsert(row,{onConflict:'id'});if(error)throw error;}
async function deleteProductCloud(id){const {error}=await supabaseReady().from('products').delete().eq('id',id);if(error)throw error;}
async function saveBannerCloud(b){const row={id:Number(b.id),title:b.title,subtitle:b.subtitle,image:b.image||''};const {error}=await supabaseReady().from('banners').upsert(row,{onConflict:'id'});if(error)throw error;}
async function saveSettingsCloud(s){const row={id:1,whatsapp:s.whatsapp,instagram:s.instagram,password:s.password};const {error}=await supabaseReady().from('settings').upsert(row,{onConflict:'id'});if(error)throw error;}
