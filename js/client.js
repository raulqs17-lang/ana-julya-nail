const sb=supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY);
const $=i=>document.getElementById(i),R=v=>"R$ "+Number(v).toFixed(2).replace(".",",");
let S={},services=[],sel={s:null,t:null};
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
async function init(){
  const [a,b]=await Promise.all([sb.from("settings").select("*").eq("id",1).single(),
    sb.from("services").select("*").eq("active",true).order("sort").order("name")]);
  S=a.data||{hours:[],closed_days:[],blocked:[],sinal:30};services=b.data||[];
    $("dt").min=today();drawSv();drawSl();drawRs();
  const g=await sb.from("gallery").select("url").order("created_at",{ascending:false});
  setupLinks(g.data||[]);
}
function drawSv(){
  $("svs").innerHTML=services.map(s=>`<div class="sv ${sel.s===s.id?"on":""}" data-s="${s.id}"><b>${s.name}</b><small>${s.description||""}</small><div class="pr">${R(s.price)}</div></div>`).join("");
  $("svs").querySelectorAll(".sv").forEach(e=>e.onclick=()=>{sel.s=e.dataset.s;drawSv();drawRs()});
}
async function drawSl(){
  const d=$("dt").value,box=$("sls"),msg=t=>box.innerHTML=`<small style="color:#9a8589">${t}</small>`;
  if(!d)return msg("Escolha uma data");
  if(S.closed_days.includes(new Date(d+"T12:00").getDay())||S.blocked.includes(d))return msg("Sem horários disponíveis neste dia");
  const {data}=await sb.rpc("taken_slots",{d});const taken=data||[];
  box.innerHTML=S.hours.map(h=>`<button class="sl ${sel.t===h?"on":""}" data-t="${h}" ${taken.includes(h)?"disabled":""}>${h}</button>`).join("");
  box.querySelectorAll(".sl").forEach(e=>e.onclick=()=>{sel.t=e.dataset.t;drawSl();drawRs()});
}
function drawRs(){
  const s=services.find(x=>x.id===sel.s),f=S.sinal/100;
  $("rs").innerHTML=s?`<div class="sum"><span>${s.name}</span><span>${R(s.price)}</span></div><div class="sum"><span>Sinal (${S.sinal}%) via Pix</span><b style="color:#b8707e">${R(s.price*f)}</b></div><div class="sum"><span>Restante no dia</span><span>${R(s.price*(1-f))}</span></div>`:'<small style="color:#9a8589">Selecione um serviço para ver os valores</small>';
  $("go").disabled=!(s&&$("dt").value&&sel.t&&$("nm").value.trim()&&$("wp").value.trim());
}
$("dt").onchange=()=>{sel.t=null;drawSl();drawRs()};
$("nm").oninput=$("wp").oninput=drawRs;
$("go").onclick=async()=>{
  const s=services.find(x=>x.id===sel.s),d=$("dt").value,nome=$("nm").value.trim();
  $("go").disabled=true;
  const {error}=await sb.from("bookings").insert({date:d,time:sel.t,client_name:nome,phone:$("wp").value.trim(),service_id:s.id});
  if(error){alert(error.code==="23505"?"Este horário acabou de ser reservado. Escolha outro.":"Erro ao agendar. Tente novamente.");drawSl();return}
  const dep=s.price*S.sinal/100;
  $("pix").hidden=false;
  $("pix").innerHTML=`<b style="font-weight:400">Quase lá, ${nome.split(" ")[0]}! 💗</b><p>Faça o Pix de <b style="color:#b8707e">${R(dep)}</b> para garantir seu horário em ${d.split("-").reverse().join("/")} às ${sel.t}.</p><div class="sum"><span>Chave Pix</span><b>${S.pix_key}</b></div><div class="sum"><span>Favorecida</span><span>${S.pix_name}</span></div><button class="btn2" id="cp">Copiar chave</button><p><small>Depois de pagar, envie o comprovante pelo WhatsApp. Seu horário é confirmado quando o sinal for recebido.</small></p>`;
  $("cp").onclick=()=>navigator.clipboard.writeText(S.pix_key).then(()=>$("cp").textContent="Copiado ✓");
  sel={s:null,t:null};$("nm").value=$("wp").value="";drawSv();drawSl();drawRs();$("pix").scrollIntoView({behavior:"smooth"});
};
function setupLinks(gal){
  const n=(S.whatsapp||"").replace(/\D/g,"");
  if(n){$("bw").href="https://wa.me/"+(n.length<=11?"55"+n:n)+"?text="+encodeURIComponent("Olá! Gostaria de falar sobre um agendamento.");$("bw").hidden=false}
  const m=S.maps_url||(S.address?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(S.address):"");
  if(m){$("bm").href=m;$("bm").hidden=false}
  $("bg").hidden=!gal.length;
  $("bg").onclick=()=>{
    $("gg").innerHTML=gal.map(x=>`<img src="${x.url}" loading="lazy">`).join("");$("gv").hidden=false;
    $("gg").querySelectorAll("img").forEach(i=>i.onclick=()=>{const b=document.createElement("div");b.className="big";b.innerHTML=`<img src="${i.src}">`;b.onclick=()=>b.remove();document.body.appendChild(b)});
  };
  $("gx").onclick=()=>$("gv").hidden=true;
}
init();
