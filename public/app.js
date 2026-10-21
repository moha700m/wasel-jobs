let ME=null,CFG={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],V=()=>$('#v');
const api=async(u,o={})=>{const fd=o.body instanceof FormData;const r=await fetch(u,{headers:fd?{}:{'Content-Type':'application/json'},...o,body:fd?o.body:o.body&&JSON.stringify(o.body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw j;return j};
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2600)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const AR=LANG==='ar';
const syncG=()=>{if(ME?.profile?.gender&&ME.profile.gender!==GEN){setGender(ME.profile.gender)}};
const tabs=a=>`<div class="tabs">${[['jobs','brief'],['apps','inbox'],['profile','user'],['settings','gear']].map(([k,i])=>`<a href="#/${k}" class="${a==k?'on':''}">${ic(i,20)}<span>${t('t_'+k)}</span></a>`).join('')}</div>`;
async function route(){const h=location.hash.slice(2).split('?')[0]||'jobs';
 if(!ME){try{ME=await api('/api/me')}catch{}} syncG(); $('#lo').style.display=ME?'':'none';
 if(location.hash.includes('mail=ok'))toast('Gmail ✓');if(location.hash.includes('mail=error'))toast(LANG==='ar'?'ما تم ربط Gmail، جرّب مرة ثانية':'Gmail connection failed');
 if(!ME&&!['login','signup'].includes(h))return location.hash='#/signup';
 if(ME&&['login','signup'].includes(h))return location.hash='#/jobs';
 if(ME&&(!ME.cv||!ME.profile.gender)&&h!=='onboard')return location.hash='#/onboard';
 ({login:()=>authV('login'),signup:()=>authV('signup'),onboard,jobs,apps,profile,settings}[h]||jobs)();window.scrollTo(0,0)}
window.onhashchange=route;window.onLang=route;
api('/api/config').then(c=>{CFG=c;route()});
function authV(m){V().innerHTML=`<div class="auth fade"><div style="text-align:center;margin-bottom:22px"><h2 style="margin:0">${t(m==='login'?'login':'welcome')}</h2><p class="muted" style="margin:6px 0 0">${m==='signup'?t('welcome_s'):''}</p></div><div class="card">
 ${m==='signup'?`<label>${t('name')}</label><input id="n" autocomplete="name">`:''}<label>${t('email')}</label><input id="e" type="email" autocomplete="email" inputmode="email"><label>${t('password')}</label><input id="p" type="password" autocomplete="${m==='login'?'current-password':'new-password'}">
 <p class="err" id="er" style="min-height:1em;margin:10px 0"></p><button class="btn p full" id="go">${t(m==='login'?'login':'signup')}</button>
 <p class="muted" style="text-align:center;margin:16px 0 0">${t(m==='login'?'noacc':'haveacc')} <a class="ok" href="#/${m==='login'?'signup':'login'}">${t(m==='login'?'signup':'login')}</a></p></div>
 ${m==='signup'?`<p class="muted" style="font-size:13px;text-align:center">${LANG==='ar'?'بالتسجيل توافق على':'By signing up you agree to the'} <a class="ok" href="/terms">${t('terms')}</a> ${LANG==='ar'?'و':'and'} <a class="ok" href="/privacy">${t('privacy')}</a></p>`:''}</div>`;
 $('#go').onclick=async()=>{$('#go').disabled=true;try{ME=await api('/api/'+m,{method:'POST',body:{email:$('#e').value.trim(),password:$('#p').value,name:$('#n')?.value.trim()}});syncG();location.hash=ME.cv&&ME.profile.gender?'#/jobs':'#/onboard'}catch(e){$('#er').textContent=e.error==='exists'?(LANG==='ar'?'الإيميل مسجل من قبل':'Email already registered'):e.error==='invalid'?(LANG==='ar'?'تأكد من الإيميل، وكلمة المرور ٨ أحرف أو أكثر':'Check email; password needs 8+ chars'):(LANG==='ar'?'الإيميل أو كلمة المرور غلط':'Wrong email or password')}$('#go').disabled=false};}
function cvBox(){return `<label class="drop" id="dz"><input type="file" id="f" accept=".pdf,.docx" hidden><div class="ico">${ic('file',28)}</div><b>${t('drop')}</b><div class="muted" style="font-size:14px">${t('ob1d')}</div><div id="fs" style="margin-top:8px"></div></label>`}
function bindCv(after){const f=$('#f');const up=async file=>{$('#fs').innerHTML=`<span class="muted">…</span>`;const fd=new FormData();fd.append('cv',file);try{const r=await api('/api/cv',{method:'POST',body:fd});ME=r.me;$('#fs').innerHTML=`<span class="att">${ic('check',16)} ${esc(ME.cv.name)}</span>`;setTimeout(()=>after&&after(),500)}catch(e){$('#fs').innerHTML=`<span class="err">${e.error==='type'?(LANG==='ar'?'الملف لازم يكون PDF أو DOCX':'File must be PDF or DOCX'):e.error==='too_large'?(LANG==='ar'?'الملف أكبر من ٥ ميجا':'File is over 5 MB'):(LANG==='ar'?'ما قدرنا نقرأ الملف':'Could not read file')}</span>`}};
 f.onchange=()=>f.files[0]&&up(f.files[0]);const dz=$('#dz');dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');e.dataTransfer.files[0]&&up(e.dataTransfer.files[0])};}
function genderPick(sel){return `<div class="gpick"><button class="m ${sel==='m'?'on':''}" data-g="m"><span class="av">🧑🏻</span>${t('g_m')}</button><button class="f ${sel==='f'?'on':''}" data-g="f"><span class="av">👩🏻</span>${t('g_f')}</button></div>`}
let OB=null;
function onboard(){if(OB===null)OB=!ME.profile.gender?0:!ME.cv?1:2;
 const st=`<div class="row"><span class="stepn">${t('step')} ${OB+1} / 4</span></div><div class="steps">${[0,1,2,3].map(i=>`<span class="${i<=OB?'on':''}"></span>`).join('')}</div>`;
 const box=(h,s,b)=>V().innerHTML=`<div class="auth fade" style="max-width:640px">${st}<h2 style="margin:0">${h}</h2><p class="muted" style="margin:4px 0 18px">${s}</p>${b}</div>`;
 if(OB===0){box(t('g_q'),t('g_s'),genderPick(ME.profile.gender));$$('.gpick button').forEach(b=>b.onclick=async()=>{setGender(b.dataset.g);ME=await api('/api/profile',{method:'PUT',body:{profile:{gender:b.dataset.g}}});OB=ME.cv?2:1;onboard()});return}
 if(OB===1){box(t('ob1'),'',`<div class="card">${cvBox()}</div>`);bindCv(()=>{OB=2;onboard()});return}
 if(OB===2){box(t('ob2'),t('ob2s'),`<div class="card">${profForm()}</div><button class="btn p full" style="margin-top:16px" id="sv">${t('next')}</button>`);setSel();$('#sv').onclick=async()=>{await saveProf(true);OB=3;onboard()};return}
 box(t('ob3'),t('ob3s'),`<div class="card">${mailForm()}</div><a class="btn full" style="margin-top:12px" href="#/jobs">${t('skip')}</a>`);bindMail(()=>location.hash='#/jobs');}
const csv=a=>(a||[]).join(LANG==='ar'?'، ':', '),arr=s=>s.split(/[,،]/).map(x=>x.trim()).filter(Boolean);
function profForm(){const p=ME.profile,q=ME.prefs;return `<div class="grid g2"><div><label>${t('name')}</label><input id="pn" value="${esc(p.name)}" dir="auto"></div><div><label>${t('title')}</label><input id="pt" value="${esc(p.title)}" dir="auto"></div>
 <div><label>${t('years')}</label><input id="py" type="number" inputmode="numeric" min="0" value="${p.years||0}"></div><div><label>${t('city')}</label><input id="pc" value="${esc(p.city)}" dir="auto"></div>
 <div><label>${t('phone')}</label><input id="pp" value="${esc(p.phone)}" dir="ltr" inputmode="tel"></div><div><label>${t('nat')}</label><input id="pna" value="${esc(p.nationality)}" placeholder="${LANG==='ar'?'سعودي / إقامة قابلة للنقل':'Saudi / transferable Iqama'}"></div></div>
 <label>${t('skills')}</label><input id="ps" value="${esc(csv(p.skills))}" dir="auto">
 <div class="grid g2"><div><label>${t('ptitles')}</label><input id="qt" value="${esc(csv(q.titles))}" dir="auto"></div><div><label>${t('pcities')}</label><input id="qc" value="${esc(csv(q.cities))}" placeholder="Riyadh, Jeddah"></div>
 <div><label>${t('salary')}</label><input id="qs" value="${esc(q.salary)}" inputmode="numeric"></div><div><label>${t('elang')}</label><select id="ql"><option value="both">${t('both')}</option><option value="ar">العربية</option><option value="en">English</option></select></div>
 <div><label>${t('mode')}</label><select id="qm"><option value="review">${t('m_review')}</option><option value="auto">${t('m_auto')}</option></select></div><div><label>${t('cap')}</label><input id="qcap" type="number" min="1" max="20" value="${q.dailyCap}"></div></div>
 <label class="row" style="color:var(--tx);margin-top:16px"><input type="checkbox" id="qd" class="pick" ${q.dryRun?'checked':''}> ${t('dry')}</label>`}
async function saveProf(quiet){ME=await api('/api/profile',{method:'PUT',body:{profile:{name:$('#pn').value.trim(),title:$('#pt').value.trim(),years:+$('#py').value,city:$('#pc').value.trim(),phone:$('#pp').value.trim(),nationality:$('#pna').value.trim(),skills:arr($('#ps').value)},
 prefs:{titles:arr($('#qt').value),cities:arr($('#qc').value),salary:$('#qs').value,lang:$('#ql').value,mode:$('#qm').value,dailyCap:+$('#qcap').value,dryRun:$('#qd').checked}}});quiet||toast(t('saved'))}
function setSel(){if($('#ql')){$('#ql').value=ME.prefs.lang;$('#qm').value=ME.prefs.mode}}
function mailForm(){if(ME.mail)return `<div class="row"><div class="ico">${ic('mail')}</div><div><b dir="ltr">${esc(ME.mail.address)}</b><div><span class="st sent">${t('connected')} · ${ME.mail.type==='gmail'?'Gmail':'SMTP'}</span></div></div><span class="sp"></span><button class="btn sm" id="tm">${t('testmail')}</button><button class="btn sm" id="dm">${t('disconnect')}</button></div>`;
 return `${CFG.google?`<a class="btn gbtn full" href="/api/mail/google/start"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${t('gmail')}</a><p class="muted" style="font-size:13px;text-align:center;margin:8px 0 0">${ic('lock',13)} ${t('gmail_s')}</p>`
 :`<button class="btn gbtn full" disabled>${t('gmail')}</button><div class="note">${ic('clock',18)}<span>${t('gmail_na')}</span></div>`}
 <details class="alt" ${CFG.google?'':'open'}><summary>${t('manual')}</summary><p class="muted" style="font-size:13.5px">${t('smtp_help')}</p>
 <div class="grid g2"><div><label>${t('host')}</label><input id="mh" value="smtp.gmail.com" dir="ltr"></div><div><label>${t('port')}</label><input id="mp" value="465" dir="ltr" inputmode="numeric"></div><div><label>${t('user')}</label><input id="mu" type="email" dir="ltr"></div><div><label>${t('apppass')}</label><input id="mw" type="password" autocomplete="new-password" dir="ltr"></div></div>
 <p class="err" id="me"></p><button class="btn p full" id="mv">${t('verify')}</button></details>`}
function bindMail(after){if($('#mv'))$('#mv').onclick=async()=>{$('#mv').disabled=true;$('#me').textContent='';try{ME=await api('/api/mail/smtp',{method:'POST',body:{host:$('#mh').value,port:$('#mp').value,user:$('#mu').value,pass:$('#mw').value}});toast(t('connected')+' ✓');after?after():settings()}catch(e){$('#me').textContent=(LANG==='ar'?'ما قدرنا نتحقق: ':'Verification failed: ')+(e.detail||e.error)}$('#mv')&&($('#mv').disabled=false)};
 if($('#tm'))$('#tm').onclick=async()=>{try{await api('/api/mail/test',{method:'POST'});toast('✓')}catch(e){toast(e.detail||'Error')}};
 if($('#dm'))$('#dm').onclick=async()=>{ME=await api('/api/mail',{method:'DELETE'});settings()};}
const gchip=j=>{const g=j.gender||'open';return g==='women_only'?`<span class="chip f">♀ ${t('g_fonly')}</span>`:g==='men_only'?`<span class="chip m">♂ ${t('g_mo')}</span>`:g==='women_preferred'?`<span class="chip f">${t('g_fp')}</span>`:`<span class="chip">${t('g_open')}</span>`};
let JOBS_CACHE=[], JOB_FILTER='for_me';
const jobCard=j=>`<label class="card hov job" data-g="${esc(j.gender||'open')}" data-type="${esc(j.type||'')}"><div class="score ${j.score<40?'lo':''}" style="--v:${j.score}">${j.score}%</div><div style="flex:1;min-width:0"><h3 style="margin:0;font-size:17px">${esc(LANG==='ar'?j.title_ar:j.title)}</h3><div class="m">${esc(j.company)} · ${ic('pin',13)} ${esc(j.city)}</div>
 <div>${gchip(j)}<span class="chip o">${esc(LANG==='ar'?j.type:j.type_en||j.type)}</span>${j.kind==='open'?`<span class="chip o">${t('open')}</span>`:''}${j.skills.slice(0,2).map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div><div class="m" style="margin-top:6px"><a class="ok" href="${esc(j.source)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${t('source')} ${ic('ext',12)}</a> · ${esc(j.posted)}</div></div>
 <div>${j.applied?`<span class="st sent">${t('applied')}</span>`:`<input type="checkbox" class="pick" value="${j.id}">`}</div></label>`;
function filterJobs(all,f){
  const g=ME.profile.gender;
  if(f==='women') return all.filter(j=>['women_only','women_preferred'].includes(j.gender));
  if(f==='men') return all.filter(j=>j.gender==='men_only');
  if(f==='open') return all.filter(j=>j.gender==='open');
  if(g==='f') return all.filter(j=>['women_only','women_preferred'].includes(j.gender));
  if(g==='m') return all.filter(j=>j.gender==='men_only');
  return all;
}
function groupByType(list){
  const order=['صحة','تعليم','مبيعات','ضيافة','إداري','تقنية','نظافة','أمن','هندسة','صناعة'];
  const map={}; list.forEach(j=>{const k=j.type||'أخرى';(map[k]=map[k]||[]).push(j)});
  const best=k=>Math.max(...map[k].map(j=>j.score));
  const keys=Object.keys(map).sort((x,y)=>best(y)-best(x)||order.indexOf(x)-order.indexOf(y));
  keys.forEach(k=>map[k].sort((x,y)=>y.score-x.score));
  return keys.map(k=>({type:k,type_en:map[k][0].type_en||k,jobs:map[k]}));
}
function renderJobList(){
  const list=filterJobs(JOBS_CACHE,JOB_FILTER);
  const groups=groupByType(list);
  const body=groups.length?groups.map(g=>`<div class="type-block"><div class="type-h"><span>${esc(LANG==='ar'?g.type:g.type_en)}</span><span class="muted">${g.jobs.length}</span></div><div class="grid">${g.jobs.map(jobCard).join('')}</div></div>`).join(''):`<div class="card empty"><p>${LANG==='ar'?'ما فيه وظائف بهالقسم':'No jobs in this section'}</p></div>`;
  $('#joblist').innerHTML=body;
  $('#jcount').textContent=list.length;
  const upd=()=>$('#cnt').textContent=$$('.pick:checked').length;$$('.pick').forEach(c=>c.onchange=upd);upd();
}
async function jobs(){V().innerHTML=tabs('jobs')+'<div class="grid">'+'<div class="skel"></div>'.repeat(4)+'</div>';JOBS_CACHE=await api('/api/jobs');const js=JOBS_CACHE;const good=js.filter(j=>j.score>=40&&!j.applied).length;
 const first=(ME.profile.name||'').split(' ')[0];
 const g=ME.profile.gender;
 // Default filter: for_me. Tabs depend on gender — hide opposite-only section.
 const tabsHtml = g==='f'
   ? `<button class="seg on" data-f="for_me">${t('sec_women')}</button><button class="seg" data-f="open">${t('sec_open')}</button>`
   : g==='m'
   ? `<button class="seg on" data-f="for_me">${t('sec_men')}</button><button class="seg" data-f="open">${t('sec_open')}</button>`
   : `<button class="seg on" data-f="for_me">${t('sec_all')}</button><button class="seg" data-f="women">${t('sec_women')}</button><button class="seg" data-f="men">${t('sec_men')}</button>`;
 JOB_FILTER='for_me';
 V().innerHTML=tabs('jobs')+`<div class="fade"><div class="hello">${t('hi')} ${esc(first)} 👋</div><p>${t('hi_s')}</p>
 <div class="kpis"><div><b>${good}</b><span>${t('k_m')}</span></div><div><b>${ME.sentToday}<small class="muted">/${ME.prefs.dailyCap}</small></b><span>${t('k_s')}</span></div><div><b>${js.filter(j=>j.applied).length}</b><span>${t('k_t')}</span></div></div>
 <div class="segbar">${tabsHtml}</div>
 <div class="row" style="margin:6px 0 14px;position:sticky;top:72px;z-index:5;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(10px);padding:8px 0"><span class="muted"><span id="jcount">${js.length}</span> ${LANG==='ar'?'وظيفة':'jobs'} · ${t('by_type')}</span><span class="sp"></span><button class="btn sm" id="best">${ic('spark',16)} ${t('selall')}</button><button class="btn sm p" id="dr">${t('apply')} (<span id="cnt">0</span>)</button></div>
 <div id="joblist"></div></div>`;
 renderJobList();
 $$('.seg').forEach(b=>b.onclick=()=>{$$('.seg').forEach(x=>x.classList.remove('on'));b.classList.add('on');JOB_FILTER=b.dataset.f;renderJobList()});
 $('#best').onclick=()=>{$$('.pick').forEach(c=>{const j=JOBS_CACHE.find(x=>x.id==c.value);c.checked=j&&j.score>=40});$('#cnt').textContent=$$('.pick:checked').length};
 $('#dr').onclick=async()=>{const ids=$$('.pick:checked').map(c=>+c.value);if(!ids.length)return toast(LANG==='ar'?'اختر وظيفة وحدة على الأقل':'Pick at least one job');await api('/api/apps/draft',{method:'POST',body:{jobIds:ids}});location.hash='#/apps'};}
const paras=b=>b.split(/\n{2,}/).map(p=>p.trim()==='———'?'<hr>':`<p dir="auto">${esc(p)}</p>`).join('');
async function apps(){const as=await api('/api/apps');const dr=as.filter(a=>a.status==='draft'),hist=as.filter(a=>a.status!=='draft');
 V().innerHTML=tabs('apps')+'<div class="fade">'+(!as.length?`<div class="card empty"><div class="ico">${ic('inbox',28)}</div><p>${t('empty')}</p><a class="btn p" href="#/jobs" style="margin-top:14px">${t('t_jobs')}</a></div>`:'')+
 (dr.length?`<div class="row" style="margin-top:6px"><div><h2 style="margin:0">${t('drafts')} (${dr.length})</h2><p class="muted" style="margin:0">${t('drafts_s')}</p></div></div><div class="grid" style="margin-top:14px">${dr.map(a=>`<div class="card"><div class="row"><input type="checkbox" class="pick sel" value="${a.id}" checked><div style="flex:1;min-width:0"><b>${esc(a.job?.company)}</b><div class="muted" style="font-size:13px" dir="ltr">${esc(a.to)}</div></div><button class="btn sm" data-ed="${a.id}">${ic('edit',15)}</button><button class="btn sm" data-del="${a.id}">${ic('trash',15)}</button></div>
 <div id="pv${a.id}"><div style="margin:12px 0 8px;font-weight:600" dir="auto">${esc(a.subject)}</div><div class="preview">${paras(a.body)}</div></div>
 <div id="ed${a.id}" hidden><label>${t('subject')}</label><input data-s="${a.id}" value="${esc(a.subject)}" dir="auto"><label>Body</label><textarea data-b="${a.id}" rows="10" dir="auto">${esc(a.body)}</textarea></div>
 <div class="att">${ic('clip',15)} ${esc(cvFile())}</div></div>`).join('')}</div><button class="btn p full" id="snd" style="margin-top:14px">${ic('send',18)} ${t('sendsel')}</button>`:'')+
 (hist.length?`<h2 style="margin-top:32px">${t('sentlist')}</h2><div class="card" style="padding:4px 18px">${hist.map(a=>`<div class="hist"><div class="ico" style="width:40px;height:40px">${ic(a.status==='failed'?'clock':'send',18)}</div><div style="flex:1;min-width:0"><div class="t" dir="auto">${esc(LANG==='ar'?a.job?.title_ar:a.job?.title)}</div><div class="m">${esc(a.job?.company)} · <span dir="ltr">${esc(a.to)}</span></div><div class="m">${a.sentAt?new Date(a.sentAt).toLocaleString(LANG==='ar'?'ar-SA':'en-GB',{dateStyle:'medium',timeStyle:'short'}):''}</div></div><span class="st ${a.status}">${t('st_'+a.status)}</span></div>`).join('')}</div>`:'')+'</div>';
 $$('[data-del]').forEach(b=>b.onclick=async()=>{await api('/api/apps/'+b.dataset.del,{method:'DELETE'});apps()});
 $$('[data-ed]').forEach(b=>b.onclick=()=>{const id=b.dataset.ed;$('#ed'+id).hidden=!$('#ed'+id).hidden;$('#pv'+id).hidden=!$('#ed'+id).hidden;});
 $$('[data-s],[data-b]').forEach(e=>e.onchange=async()=>{await api('/api/apps/'+(e.dataset.s||e.dataset.b),{method:'PUT',body:e.dataset.s?{subject:e.value}:{body:e.value}});const id=e.dataset.s||e.dataset.b;const pv=$('#pv'+id);if(e.dataset.b)pv.querySelector('.preview').innerHTML=paras(e.value);else pv.firstElementChild.textContent=e.value;toast(t('saved'))});
 if($('#snd'))$('#snd').onclick=async()=>{if(!ME.mail&&!ME.prefs.dryRun&&!CFG.dryRun)return toast(t('nomail'));$('#snd').disabled=true;$('#snd').textContent='…';
  const r=await api('/api/apps/send',{method:'POST',body:{ids:$$('.sel:checked').map(c=>+c.value)}});ME=await api('/api/me');toast(`${r.filter(x=>['sent','dry-run'].includes(x.status)).length} ✓`);apps()};}
const cvFile=()=>`${(ME.profile.name||'CV').trim().replace(/\s+/g,'_')}_CV${(ME.cv?.name.match(/\.\w+$/)||['.pdf'])[0].toLowerCase()}`;
function profile(){V().innerHTML=tabs('profile')+`<div class="fade"><div class="card"><h3 style="margin-top:0">${t('ob1')}</h3><div class="att">${ic('file',15)} ${esc(ME.cv?.name)}</div>${cvBox()}</div><div class="card" style="margin-top:16px">${profForm()}<button class="btn p full" style="margin-top:18px" id="sv">${t('save')}</button></div></div>`;setSel();bindCv(profile);$('#sv').onclick=()=>saveProf();}
function settings(){V().innerHTML=tabs('settings')+`<div class="fade"><div class="card"><h3 style="margin-top:0">${t('ob3')}</h3>${mailForm()}</div>
 <div class="card" style="margin-top:16px"><h3 style="margin-top:0">${t('gender')}</h3>${genderPick(ME.profile.gender)}</div>
 <div class="card" style="margin-top:16px;border-color:rgba(255,122,122,.25)"><h3 style="margin-top:0">${ic('shield',18)} PDPL</h3><p>${LANG==='ar'?'تقدر تحذف حسابك وسيرتك وكل طلباتك نهائياً.':'Permanently delete your account, CV and all applications.'}</p><button class="btn" style="margin-top:12px;color:var(--err)" id="da">${t('delacc')}</button></div></div>`;
 bindMail();$$('.gpick button').forEach(b=>b.onclick=async()=>{setGender(b.dataset.g);ME=await api('/api/profile',{method:'PUT',body:{profile:{gender:b.dataset.g}}});toast(t('saved'));settings()});
 $('#da').onclick=async()=>{if(confirm(t('sure'))){await api('/api/account',{method:'DELETE'});localStorage.removeItem('g');location.href='/'}};}
async function logout(){await api('/api/logout',{method:'POST'});ME=null;setGender('');location.hash='#/login'}
