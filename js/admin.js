const sb=supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY);
const $=i=>document.getElementById(i),R=v=>"R$ "+Number(v).toFixed(2).replace(".",",");
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const fd=d=>d.split("-").reverse().join("/");
let S={},sv=[],bk=[];
sb.auth.getSession().then(({data})=>{if(data.session)start()});
$("lg").onclick=async()=>{const{error}=await sb.auth.signInWithPassword({email:$("em").value.trim(),password:$("pw").value});error?alert("E-mail ou senha inválidos"):start()};
$("out").onclick=async()=>{await sb.auth.signOut();location.reload()};
async function start(){$("login").hidden=true;$("app").hidden=false;await load();drawCfg();}
async function load(){
  const[a,b,c]=await Promise.all([sb.from("settings").select("*").eq("id",1).single(),
    sb.from("services").select("*").order("sort").order("name"),
    sb.from("bookings").select("*").order("date").order("time")]);
  S=a.data;sv=b.data||[];bk=c.data||[];fill();draw();
}
function fill(){const v=$("f3").value;$("f3").innerHTML='<option value="">Todos os serviços</option>'+sv.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");$("f3").value=v}
["f1","f2","f3","f4"].forEach(i=>$(i).onchange=draw);
const filtered=()=>{const a=$("f1").value,b=$("f2").value,s=$("f3").value,t=$("f4").value;
  return bk.filter(x=>(!a||x.date>=a)&&(!b||x.date<=b)&&(!s||x.service_id===s)&&(!t||x.status===t))};
function draw(){
  const l=filtered(),sum=a=>a.reduce((t,x)=>t+Number(x.price),0),dep=a=>a.reduce((t,x)=>t+Number(x.deposit),0);
  const rec=l.filter(x=>x.status==="Realizado"),pago=l.filter(x=>["Agendado","Realizado"].includes(x.status)),ag=l.filter(x=>x.status==="Agendado");
  $("ks").innerHTML=[["Ganhos realizados",R(sum(rec))],["Sinais recebidos",R(dep(pago))],["A receber (agendados)",R(sum(ag))],["Atendimentos feitos",rec.length],["Agendamentos ativos",l.filter(x=>["Aguardando sinal","Agendado"].includes(x.status)).length]].map(k=>`<div class="k"><span>${k[0]}</span><div>${k[1]}</div></div>`).join("");
  const act=x=>{const b=(s,t)=>`<button class="btn2" data-i="${x.id}" data-s="${s}">${t}</button> `;
    return x.status==="Aguardando sinal"?b("Agendado","Sinal pago")+b("Cancelado","Cancelar"):x.status==="Agendado"?b("Realizado","Realizado")+b("Cancelado","Cancelar"):""};
  $("tb").innerHTML=l.length?l.map(x=>`<tr><td>${fd(x.date)}</td><td>${x.time}</td><td>${esc(x.client_name)}<br><small><a href="https://wa.me/55${x.phone.replace(/\D/g,"")}" target="_blank" style="color:inherit">${esc(x.phone)}</a></small></td><td>${esc(x.service_name)}</td><td>${R(x.price)}</td><td>${R(x.deposit)}</td><td><span class="st">${x.status}</span></td><td>${act(x)}</td></tr>`).join(""):'<tr><td colspan="8" style="color:#9a8589">Nenhum agendamento neste filtro</td></tr>';
  $("tb").querySelectorAll("button").forEach(b=>b.onclick=async()=>{await sb.from("bookings").update({status:b.dataset.s}).eq("id",b.dataset.i);await load()});
}
$("csv").onclick=()=>{
  const h=["Data","Hora","Cliente","WhatsApp","Serviço","Valor","Sinal","Status"];
  const csv="\uFEFF"+[h,...filtered().map(x=>[x.date,x.time,x.client_name,x.phone,x.service_name,x.price,x.deposit,x.status])].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(";")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="agendamentos.csv";a.click();
};
function drawCfg(){
  const dn=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],bl=[...S.blocked].sort();
  $("cfg").innerHTML=`<small>Chave Pix</small><input id="c1" value="${esc(S.pix_key)}"><small>Nome da favorecida</small><input id="c2" value="${esc(S.pix_name)}"><small>Sinal (% do valor)</small><input id="c3" type="number" min="0" max="100" value="${S.sinal}">
  <h2>Serviços e preços</h2>${sv.map((s,i)=>`<div class="fl" style="margin-bottom:6px"><input data-k="name" data-i="${i}" value="${esc(s.name)}" placeholder="Nome"><input data-k="description" data-i="${i}" value="${esc(s.description)}" placeholder="Descrição"><input data-k="price" data-i="${i}" type="number" min="0" value="${s.price}"><label><input type="checkbox" style="width:auto" data-k="active" data-i="${i}" ${s.active?"checked":""}> ativo</label></div>`).join("")}<button class="btn2" id="addS">+ Novo serviço</button>
  <h2>Horários disponíveis</h2><small>Separe por vírgula. Ex.: 09:00, 10:30, 14:00</small><input id="c5" value="${esc(S.hours.join(", "))}">
  <h2>Dias em que atende</h2><div>${dn.map((d,i)=>`<label style="margin-right:12px"><input type="checkbox" style="width:auto" data-wd="${i}" ${S.closed_days.includes(i)?"":"checked"}> ${d}</label>`).join("")}</div>
  <h2>Datas bloqueadas</h2><div style="display:flex;gap:8px"><input type="date" id="c6"><button class="btn2" id="addB" style="margin-bottom:10px">Bloquear</button></div>
  <div>${bl.map(d=>`<span class="st" style="margin-right:6px">${fd(d)} <a href="#" data-ub="${d}" style="color:inherit">✕</a></span>`).join("")||"<small>Nenhuma</small>"}</div>
  <button class="btn" id="svC" style="margin-top:16px">Salvar configurações</button>`;
  $("cfg").querySelectorAll("[data-k]").forEach(e=>e.oninput=e.onchange=()=>{const s=sv[+e.dataset.i],k=e.dataset.k;s[k]=k==="active"?e.checked:k==="price"?(parseFloat(e.value)||0):e.value});
  $("addS").onclick=()=>{sv.push({name:"Novo serviço",description:"",price:0,active:true,sort:sv.length});drawCfg()};
  $("addB").onclick=()=>{const v=$("c6").value;if(v&&!S.blocked.includes(v)){S.blocked.push(v);drawCfg()}};
  $("cfg").querySelectorAll("[data-ub]").forEach(e=>e.onclick=ev=>{ev.preventDefault();S.blocked=S.blocked.filter(x=>x!==e.dataset.ub);drawCfg()});
  $("svC").onclick=async()=>{
    const closed=[];$("cfg").querySelectorAll("[data-wd]").forEach(e=>{if(!e.checked)closed.push(+e.dataset.wd)});
    const r=await sb.from("settings").update({pix_key:$("c1").value.trim(),pix_name:$("c2").value.trim(),sinal:parseFloat($("c3").value)||0,
      hours:$("c5").value.split(",").map(x=>x.trim()).filter(Boolean),closed_days:closed,blocked:S.blocked}).eq("id",1);
    let err=r.error;
    for(const s of sv){const row={name:s.name,description:s.description,price:s.price,active:s.active,sort:s.sort||0};
      const q=s.id?sb.from("services").update(row).eq("id",s.id):sb.from("services").insert(row);const x=await q;if(x.error)err=x.error}
    if(err)alert("Erro ao salvar: "+err.message);else{alert("Configurações salvas!");await load();drawCfg()}
  };
}
