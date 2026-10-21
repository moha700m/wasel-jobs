let ME=null,CFG={};const $=s=>document.querySelector(s),V=()=>$('#v');
const api=async(u,o={})=>{const r=await fetch(u,{headers:o.body instanceof FormData?{}:{'Content-Type':'application/json'},...o,body:o.body instanceof FormData?o.body:o.body&&JSON.stringify(o.body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw j;return j};
const toast=m=>{const e=$('#toast');e.textContent=m;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',3000)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tabs=a=>`<div class="tabs">${['jobs','apps','profile','settings'].map(k=>`<a href="#/${k}" class="${a==k?'on':''}">${t('t_'+k)}</a>`).join('')}</div>`;
async function route(){const h=location.hash.slice(2).split('?')[0]||'jobs';
 if(!ME){try{ME=await api('/api/me')}catch{}} $('#lo').style.display=ME?'':'none';
 if(!ME&&!['login','signup'].includes(h))return location.hash='#/signup';
 if(ME&&['login','signup'].includes(h))return location.hash='#/jobs';
 if(ME&&!ME.cv&&h!=='onboard')return location.hash='#/onboard';
 ({login:()=>authV('login'),signup:()=>authV('signup'),onboard,jobs,apps,profile,settings}[h]||jobs)();}
window.onhashchange=route;window.onLang=route;
api('/api/config').then(c=>{CFG=c;route()});
function authV(m){V().innerHTML=`<div class="auth card"><h2>${t(m==='login'?'login':'signup')}</h2>
 ${m==='signup'?`<label>${t('name')}</label><input id="n">`:''}<label>${t('email')}</label><input id="e" type="email"><label>${t('password')}</label><input id="p" type="password">
 <p class="err" id="er"></p><button class="btn p" style="width:100%" id="go">${t(m==='login'?'login':'signup')}</button>
 <p class="muted">${t(m==='login'?'noacc':'haveacc')} <a class="ok" href="#/${m==='login'?'signup':'login'}">${t(m==='login'?'signup':'login')}</a></p>
 ${m==='signup'?`<p class="muted" style="font-size:13px">${LANG==='ar'?'بالتسجيل توافق على':'By signing up you agree to'} <a class="ok" href="/terms">${t('terms')}</a> & <a class="ok" href="/privacy">${t('privacy')}</a></p>`:''}</div>`;
 $('#go').onclick=async()=>{try{ME=await api('/api/'+m,{method:'POST',body:{email:$('#e').value,password:$('#p').value,name:$('#n')?.value}});location.hash=ME.cv?'#/jobs':'#/onboard'}catch(e){$('#er').textContent=e.error==='exists'?(LANG==='ar'?'الإيميل مسجل':'Email already registered'):e.error==='invalid'?(LANG==='ar'?'تحقق من الإيميل وكلمة المرور':'Check email & password'):(LANG==='ar'?'بيانات غير صحيحة':'Wrong credentials')}};}
function cvBox(){return `<label class="drop" id="dz"><input type="file" id="f" accept=".pdf,.docx" hidden><div style="font-size:34px">📄</div><b>${t('drop')}</b><div class="muted">${t('ob1d')}</div><div id="fs" class="ok"></div></label>`}
function bindCv(after){const f=$('#f');const up=async file=>{$('#fs').textContent='…';const fd=new FormData();fd.append('cv',file);try{const r=await api('/api/cv',{method:'POST',body:fd});ME=r.me;$('#fs').textContent='✓ '+file.name;after&&after()}catch(e){$('#fs').innerHTML=`<span class="err">${e.error==='type'?'PDF / DOCX':'Error'}</span>`}};
 f.onchange=()=>f.files[0]&&up(f.files[0]);const dz=$('#dz');dz.ondragover=e=>e.preventDefault();dz.ondrop=e=>{e.preventDefault();e.dataTransfer.files[0]&&up(e.dataTransfer.files[0])};}
let OB=1;
function onboard(){const st=`<div class="steps">${[1,2,3].map(i=>`<span class="${i<=OB?'on':''}"></span>`).join('')}</div>`;
 if(OB===1){V().innerHTML=`<div class="auth card" style="max-width:620px">${st}<h2>${t('ob1')}</h2>${cvBox()}</div>`;bindCv(()=>{OB=2;onboard()});return}
 if(OB===2){V().innerHTML=`<div class="auth card" style="max-width:620px">${st}<h2>${t('ob2')}</h2>${profForm()}<div class="row" style="margin-top:16px"><button class="btn p" id="sv">${t('next')}</button></div></div>`;setSel();$('#sv').onclick=async()=>{await saveProf();OB=3;onboard()};return}
 V().innerHTML=`<div class="auth card" style="max-width:620px">${st}<h2>${t('ob3')}</h2>${mailForm()}<div class="row" style="margin-top:16px"><a class="btn" href="#/jobs">${t('skip')}</a></div></div>`;bindMail(()=>location.hash='#/jobs');}
const csv=a=>(a||[]).join(', '),arr=s=>s.split(/[,،]/).map(x=>x.trim()).filter(Boolean);
function profForm(){const p=ME.profile,q=ME.prefs;return `<div class="grid g2"><div><label>${t('name')}</label><input id="pn" value="${esc(p.name)}"></div><div><label>${t('title')}</label><input id="pt" value="${esc(p.title)}"></div>
 <div><label>${t('years')}</label><input id="py" type="number" min="0" value="${p.years||0}"></div><div><label>${t('city')}</label><input id="pc" value="${esc(p.city)}"></div>
 <div><label>${t('phone')}</label><input id="pp" value="${esc(p.phone)}"></div><div><label>${t('nat')}</label><input id="pna" value="${esc(p.nationality)}" placeholder="${LANG==='ar'?'سعودي / إقامة قابلة للنقل':'Saudi / transferable Iqama'}"></div></div>
 <label>${t('skills')}</label><input id="ps" value="${esc(csv(p.skills))}">
 <div class="grid g2"><div><label>${t('ptitles')}</label><input id="qt" value="${esc(csv(q.titles))}"></div><div><label>${t('pcities')}</label><input id="qc" value="${esc(csv(q.cities))}" placeholder="Riyadh, Jeddah"></div>
 <div><label>${t('salary')}</label><input id="qs" value="${esc(q.salary)}"></div><div><label>${t('elang')}</label><select id="ql"><option value="both">${t('both')}</option><option value="ar">العربية</option><option value="en">English</option></select></div>
 <div><label>${t('mode')}</label><select id="qm"><option value="review">${t('m_review')}</option><option value="auto">${t('m_auto')}</option></select></div><div><label>${t('cap')}</label><input id="qcap" type="number" min="1" max="20" value="${q.dailyCap}"></div></div>
 <label class="row" style="color:var(--tx)"><input type="checkbox" id="qd" style="width:auto" ${q.dryRun?'checked':''}> ${t('dry')}</label>`}
async function saveProf(){ME=await api('/api/profile',{method:'PUT',body:{profile:{name:$('#pn').value,title:$('#pt').value,years:+$('#py').value,city:$('#pc').value,phone:$('#pp').value,nationality:$('#pna').value,skills:arr($('#ps').value)},
 prefs:{titles:arr($('#qt').value),cities:arr($('#qc').value),salary:$('#qs').value,lang:$('#ql').value,mode:$('#qm').value,dailyCap:+$('#qcap').value,dryRun:$('#qd').checked}}});toast(t('saved'))}
function setSel(){if($('#ql')){$('#ql').value=ME.prefs.lang;$('#qm').value=ME.prefs.mode}}
function mailForm(){if(ME.mail)return `<div class="card row"><span class="st sent">${t('connected')}</span><b>${esc(ME.mail.address)}</b><span class="muted">${ME.mail.type.toUpperCase()}</span><span class="sp"></span><button class="btn sm" id="tm">${t('testmail')}</button><button class="btn sm" id="dm">${t('disconnect')}</button></div>`;
 return `${CFG.google?`<a class="btn g" href="/api/mail/google/start" style="width:100%">G &nbsp;${t('gmail')}</a>`:`<p class="muted">${t('gmail_na')}</p>`}
 <h3 style="margin-top:22px">${t('smtp')}</h3><p class="muted" style="font-size:14px">${t('smtp_help')}</p>
 <div class="grid g2"><div><label>${t('host')}</label><input id="mh" value="smtp.gmail.com"></div><div><label>${t('port')}</label><input id="mp" value="465"></div><div><label>${t('user')}</label><input id="mu" type="email"></div><div><label>${t('apppass')}</label><input id="mw" type="password" autocomplete="new-password"></div></div>
 <p class="err" id="me"></p><button class="btn p" id="mv">${t('verify')}</button>`}
function bindMail(after){if($('#mv'))$('#mv').onclick=async()=>{$('#mv').disabled=true;$('#me').textContent='';try{ME=await api('/api/mail/smtp',{method:'POST',body:{host:$('#mh').value,port:$('#mp').value,user:$('#mu').value,pass:$('#mw').value}});toast(t('connected'));after?after():settings()}catch(e){$('#me').textContent=(LANG==='ar'?'ما قدرنا نتحقق: ':'Verification failed: ')+(e.detail||e.error)}$('#mv')&&($('#mv').disabled=false)};
 if($('#tm'))$('#tm').onclick=async()=>{try{await api('/api/mail/test',{method:'POST'});toast('✓')}catch(e){toast(e.detail||'Error')}};
 if($('#dm'))$('#dm').onclick=async()=>{ME=await api('/api/mail',{method:'DELETE'});settings()};}
async function jobs(){V().innerHTML=tabs('jobs')+'<p class="muted">…</p>';const js=await api('/api/jobs');
 V().innerHTML=tabs('jobs')+`<div class="row" style="margin-bottom:14px"><span class="muted">${js.length} · ${ME.sentToday}/${ME.prefs.dailyCap} ${t('sent_n')} ${t('today')}</span><span class="sp"></span><button class="btn sm" id="best">${t('selall')}</button><button class="btn sm p" id="dr">${t('apply')} (<span id="cnt">0</span>)</button></div>
 <div class="grid">${js.map(j=>`<div class="card job"><div class="row" style="align-items:flex-start;flex:1;flex-wrap:nowrap"><div class="score ${j.score<40?'lo':''}">${j.score}%</div><div><h3 style="margin:0">${esc(LANG==='ar'?j.title_ar:j.title)}</h3><div class="m">${esc(j.company)} · ${esc(j.city)} · ${esc(j.email)} ${j.kind==='open'?`<span class="chip">${t('open')}</span>`:''}</div>
 <div>${j.skills.slice(0,5).map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div><a class="m ok" href="${esc(j.source)}" target="_blank" rel="noopener">${t('source')} ↗</a> <span class="m">· ${esc(j.posted)}</span></div></div>
 <div>${j.applied?`<span class="st sent">${t('applied')}</span>`:`<label class="row"><input type="checkbox" class="pick" value="${j.id}" style="width:22px;height:22px"></label>`}</div></div>`).join('')}</div>`;
 const upd=()=>$('#cnt').textContent=document.querySelectorAll('.pick:checked').length;document.querySelectorAll('.pick').forEach(c=>c.onchange=upd);
 $('#best').onclick=()=>{document.querySelectorAll('.pick').forEach((c,i)=>c.checked=js.find(j=>j.id==c.value).score>=40);upd()};
 $('#dr').onclick=async()=>{const ids=[...document.querySelectorAll('.pick:checked')].map(c=>+c.value);if(!ids.length)return;await api('/api/apps/draft',{method:'POST',body:{jobIds:ids}});location.hash='#/apps'};}
async function apps(){const as=await api('/api/apps');const dr=as.filter(a=>a.status==='draft'),hist=as.filter(a=>a.status!=='draft');
 V().innerHTML=tabs('apps')+(!as.length?`<div class="card"><p>${t('empty')}</p></div>`:'')+
 (dr.length?`<div class="row"><h2>${t('drafts')} (${dr.length})</h2><span class="sp"></span><button class="btn p" id="snd">${t('sendsel')}</button></div><div class="grid">${dr.map(a=>`<div class="card"><div class="row"><input type="checkbox" class="sel" value="${a.id}" checked style="width:20px;height:20px"><b>${esc(a.job?.company)}</b><span class="muted">→ ${esc(a.to)}</span><span class="sp"></span><button class="btn sm" data-del="${a.id}">${t('del')}</button></div>
 <label>${t('subject')}</label><input data-s="${a.id}" value="${esc(a.subject)}"><label>📎 CV · ${esc(ME.cv?.name)}</label><textarea data-b="${a.id}" rows="8">${esc(a.body)}</textarea></div>`).join('')}</div>`:'')+
 (hist.length?`<h2 style="margin-top:30px">${t('sentlist')}</h2><div class="card tbl-wrap"><table><tr><th>${t('job')}</th><th>${t('to')}</th><th>${t('date')}</th><th>${t('status')}</th></tr>${hist.map(a=>`<tr><td>${esc(a.job?.title)}<div class="muted">${esc(a.job?.company)}</div></td><td>${esc(a.to)}</td><td>${a.sentAt?new Date(a.sentAt).toLocaleString(LANG==='ar'?'ar-SA':'en-GB',{dateStyle:'medium',timeStyle:'short'}):'-'}</td><td><span class="st ${a.status}">${t('st_'+a.status)}</span></td></tr>`).join('')}</table></div>`:'');
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{await api('/api/apps/'+b.dataset.del,{method:'DELETE'});apps()});
 document.querySelectorAll('[data-s],[data-b]').forEach(e=>e.onchange=()=>api('/api/apps/'+(e.dataset.s||e.dataset.b),{method:'PUT',body:e.dataset.s?{subject:e.value}:{body:e.value}}));
 if($('#snd'))$('#snd').onclick=async()=>{if(!ME.mail&&!ME.prefs.dryRun&&!CFG.dryRun)return toast(t('nomail'));$('#snd').disabled=true;$('#snd').textContent='…';
  const r=await api('/api/apps/send',{method:'POST',body:{ids:[...document.querySelectorAll('.sel:checked')].map(c=>+c.value)}});ME=await api('/api/me');toast(`${r.filter(x=>['sent','dry-run'].includes(x.status)).length} ✓`);apps()};}
function profile(){V().innerHTML=tabs('profile')+`<div class="card"><h3>${t('ob1')}</h3><p class="muted">${esc(ME.cv?.name)}</p>${cvBox()}</div><div class="card" style="margin-top:18px">${profForm()}<button class="btn p" style="margin-top:16px" id="sv">${t('save')}</button></div>`;setSel();bindCv(profile);$('#sv').onclick=saveProf;}
function settings(){V().innerHTML=tabs('settings')+`<div class="card"><h3>${t('ob3')}</h3>${mailForm()}</div><div class="card" style="margin-top:18px;border-color:#5a2a2a"><h3>PDPL</h3><p>${LANG==='ar'?'تقدر تحذف حسابك وسيرتك وكل طلباتك نهائياً.':'Permanently delete your account, CV and all applications.'}</p><button class="btn" style="margin-top:12px;color:var(--err)" id="da">${t('delacc')}</button></div>`;
 bindMail();$('#da').onclick=async()=>{if(confirm(t('sure'))){await api('/api/account',{method:'DELETE'});location.href='/'}};}
async function logout(){await api('/api/logout',{method:'POST'});ME=null;location.hash='#/login'}
