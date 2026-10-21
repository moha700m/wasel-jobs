let ME=null,CFG={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],V=()=>$('#v');
const api=async(u,o={})=>{const fd=o.body instanceof FormData;const r=await fetch(u,{headers:fd?{}:{'Content-Type':'application/json'},...o,body:fd?o.body:o.body&&JSON.stringify(o.body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw j;return j};
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2600)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const AR=LANG==='ar';
const syncG=()=>{if(ME?.profile?.gender&&ME.profile.gender!==GEN){setGender(ME.profile.gender)}};
const tabs=a=>dryBadge()+`<div class="tabs">${[['jobs','brief'],['apps','inbox'],['profile','user'],['settings','gear']].map(([k,i])=>`<a href="#/${k}" class="${a==k?'on':''}">${ic(i,20)}<span>${t('t_'+k)}</span></a>`).join('')}</div>`;
async function route(){const h=location.hash.slice(2).split('?')[0]||'jobs';
 if(!ME){try{ME=await api('/api/me')}catch{}} syncG(); $('#lo').style.display=ME?'':'none';
 if(location.hash.includes('mail=ok'))toast('Gmail ✓');if(location.hash.includes('mail=error'))toast(LANG==='ar'?'ما تم ربط Gmail، جرّب مرة ثانية':'Gmail connection failed');
 if(!ME&&!['login','signup'].includes(h))return location.hash='#/signup';
 if(ME&&['login','signup'].includes(h))return location.hash='#/jobs';
 if(ME&&(!ME.cv||!ME.profile.gender)&&h!=='onboard')return location.hash='#/onboard';
 ({login:()=>authV('login'),signup:()=>authV('signup'),onboard,jobs,apps,batch,profile,settings}[h]||jobs)();window.scrollTo(0,0)}
window.onhashchange=route;window.onLang=route;
api('/api/config').then(c=>{CFG=c;route()});
let SG=null;
function authV(m){if(m==='signup'&&!SG&&!GEN){V().innerHTML=`<div class="auth ob fade"><div class="row"><span class="stepn">${t('step')} 1 / 4</span></div><div class="steps"><span class="on"></span><span></span><span></span><span></span></div><h2 style="margin:0">${t('g_q')}</h2><p class="muted" style="margin:4px 0 18px">${t('g_s')}</p>${genderPick('')}<p class="muted" style="text-align:center;margin:22px 0 0">${t('haveacc')} <a class="ok" href="#/login">${t('login')}</a></p></div>`;$$('.gpick button').forEach(b=>b.onclick=()=>{SG=b.dataset.g;setGender(SG);authV('signup')});return}
 if(m==='signup'&&!SG)SG=GEN;
 V().innerHTML=`<div class="auth ob fade">${m==='signup'?`<div class="row"><span class="stepn">${t('step')} 1 / 4</span><span class="sp"></span><button class="btn sm" id="chg">${SG==='f'?'👩🏻':'🧑🏻'} ${t(SG==='f'?'g_f':'g_m')} · ${LANG==='ar'?'تغيير':'change'}</button></div><div class="steps"><span class="on"></span><span></span><span></span><span></span></div>`:''}<div style="text-align:center;margin-bottom:22px"><h2 style="margin:0">${t(m==='login'?'login':'welcome')}</h2><p class="muted" style="margin:6px 0 0">${m==='signup'?t('welcome_s'):''}</p></div><div class="card">
 ${m==='signup'?`<label>${t('name')}</label><input id="n" autocomplete="name">`:''}<label>${t('email')}</label><input id="e" type="email" autocomplete="email" inputmode="email"><label>${t('password')}</label><input id="p" type="password" autocomplete="${m==='login'?'current-password':'new-password'}">
 <p class="err" id="er" style="min-height:1em;margin:10px 0"></p><button class="btn p full" id="go">${t(m==='login'?'login':'signup')}</button>
 <p class="muted" style="text-align:center;margin:16px 0 0">${t(m==='login'?'noacc':'haveacc')} <a class="ok" href="#/${m==='login'?'signup':'login'}">${t(m==='login'?'signup':'login')}</a></p></div>
 ${m==='signup'?`<p class="muted" style="font-size:13px;text-align:center">${LANG==='ar'?'بالتسجيل توافق على':'By signing up you agree to the'} <a class="ok" href="/terms">${t('terms')}</a> ${LANG==='ar'?'و':'and'} <a class="ok" href="/privacy">${t('privacy')}</a></p>`:''}</div>`;
 if($('#chg'))$('#chg').onclick=()=>{SG=null;setGender('');authV('signup')};
 $('#go').onclick=async()=>{$('#go').disabled=true;try{ME=await api('/api/'+m,{method:'POST',body:{email:$('#e').value.trim(),password:$('#p').value,name:$('#n')?.value.trim(),gender:m==='signup'?SG:undefined}});syncG();location.hash=ME.cv&&ME.profile.gender?'#/jobs':'#/onboard'}catch(e){$('#er').textContent=e.error==='exists'?(LANG==='ar'?'الإيميل مسجل من قبل':'Email already registered'):e.error==='invalid'?(LANG==='ar'?'تأكد من الإيميل، وكلمة المرور ٨ أحرف أو أكثر':'Check email; password needs 8+ chars'):(LANG==='ar'?'الإيميل أو كلمة المرور غلط':'Wrong email or password')}$('#go').disabled=false};}
function cvBox(){return `<label class="drop" id="dz"><input type="file" id="f" accept=".pdf,.docx" hidden><div class="ico">${ic('file',28)}</div><b>${t('drop')}</b><div class="muted" style="font-size:14px">${t('ob1d')}</div><div id="fs" style="margin-top:8px"></div></label>`}
function bindCv(after){const f=$('#f');const up=async file=>{$('#fs').innerHTML=`<span class="muted">…</span>`;const fd=new FormData();fd.append('cv',file);try{const r=await api('/api/cv',{method:'POST',body:fd});ME=r.me;$('#fs').innerHTML=`<span class="att">${ic('check',16)} ${esc(ME.cv.name)}</span>`;setTimeout(()=>after&&after(),500)}catch(e){$('#fs').innerHTML=`<span class="err">${e.error==='type'?(LANG==='ar'?'الملف لازم يكون PDF أو DOCX':'File must be PDF or DOCX'):e.error==='too_large'?(LANG==='ar'?'الملف أكبر من ٥ ميجا':'File is over 5 MB'):(LANG==='ar'?'ما قدرنا نقرأ الملف':'Could not read file')}</span>`}};
 f.onchange=()=>f.files[0]&&up(f.files[0]);const dz=$('#dz');dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');e.dataTransfer.files[0]&&up(e.dataTransfer.files[0])};}
function genderPick(sel){return `<div class="gpick"><button class="m ${sel==='m'?'on':''}" data-g="m"><span class="av">🧑🏻</span>${t('g_m')}</button><button class="f ${sel==='f'?'on':''}" data-g="f"><span class="av">👩🏻</span>${t('g_f')}</button></div>`}
let OB=null;
function onboard(){if(OB===null)OB=!ME.profile.gender?0:!ME.cv?1:2;
 const st=`<div class="row"><span class="stepn">${t('step')} ${OB+1} ${LANG==='ar'?'من':'of'} 4</span></div><div class="steps">${[0,1,2,3].map(i=>`<span class="${i<=OB?'on':''}"></span>`).join('')}</div>`;
 const box=(h,s,b)=>V().innerHTML=`<div class="auth ob wide fade">${st}<h2 style="margin:0">${h}</h2><p class="muted" style="margin:4px 0 18px">${s}</p>${b}</div>`;
 if(OB===0){box(t('g_q'),t('g_s'),genderPick(ME.profile.gender));$$('.gpick button').forEach(b=>b.onclick=async()=>{setGender(b.dataset.g);ME=await api('/api/profile',{method:'PUT',body:{profile:{gender:b.dataset.g}}});OB=ME.cv?2:1;onboard()});return}
 if(OB===1){box(t('ob1'),'',`<div class="card">${cvBox()}</div>`);bindCv(()=>{OB=2;onboard()});return}
 if(OB===2){box(t('ob2'),t('ob2s'),`<div class="card">${profForm()}</div><button class="btn p full" style="margin-top:16px" id="sv">${t('next')}</button>`);setSel();$('#sv').onclick=async()=>{await saveProf(true);OB=3;onboard()};return}
 box(t('ob3'),t('ob3s'),`<div class="card">${mailForm()}</div><a class="btn full" style="margin-top:12px" href="#/jobs">${t('skip')}</a>`);bindMail(()=>location.hash='#/jobs');}
const csv=a=>(a||[]).join((a||[]).some(x=>/[\u0600-\u06FF]/.test(x))?'، ':', '),arr=s=>s.split(/[,،]/).map(x=>x.trim()).filter(Boolean);
const skChips=a=>a.map(x=>`<span class="chip" dir="auto">${esc(x)}</span>`).join('');
const dryBadge=()=>ME?.prefs?.dryRun?`<span class="badge-dry">🧪 ${LANG==='ar'?'وضع التجربة شغال':'Test mode ON'}</span>`:'';
function dryBox(){const q=ME.prefs,lock=!ME.mail;return `<div class="drybox ${q.dryRun?'on':''}"><label class="tgl"><input type="checkbox" id="qd" ${q.dryRun?'checked':''} ${lock?'disabled':''} onchange="this.closest('.drybox').classList.toggle('on',this.checked)"><span class="sw"></span><b>${t('dry')}</b></label><p>${lock?(LANG==='ar'?'شغال تلقائياً لين تربط إيميلك. الطلبات تنحفظ كتجربة وما تنرسل للشركات.':'On until you connect your email. Applications are simulated, nothing is sent.'):(LANG==='ar'?'إذا طفيته، الطلبات تنرسل فعلياً من إيميلك للشركات.':'Turn off to really send from your email.')}</p></div>`}
function profForm(){const p=ME.profile,q=ME.prefs;return dryBox()+`<div class="grid g2"><div><label>${t('name')}</label><input id="pn" value="${esc(p.name)}" dir="auto"></div><div><label>${t('title')}</label><input id="pt" value="${esc(p.title)}" dir="auto"></div>
 <div><label>${t('years')}</label><input id="py" type="number" inputmode="numeric" min="0" value="${p.years||0}"></div><div><label>${t('city')}</label><input id="pc" value="${esc(p.city)}" dir="auto"></div>
 <div><label>${t('phone')}</label><input id="pp" value="${esc(p.phone)}" dir="ltr" inputmode="tel"></div><div><label>${t('nat')}</label><input id="pna" value="${esc(p.nationality)}" placeholder="${LANG==='ar'?'سعودي / إقامة قابلة للنقل':'Saudi / transferable Iqama'}"></div></div>
 <label>${t('skills')}</label><input id="ps" value="${esc(csv(p.skills))}" dir="auto" oninput="this.nextElementSibling.innerHTML=skChips(arr(this.value))"><div class="skc">${skChips(p.skills||[])}</div>
 <div class="grid g2"><div><label>${t('ptitles')}</label><input id="qt" value="${esc(csv(q.titles))}" dir="auto"></div><div><label>${t('pcities')}</label><input id="qc" value="${esc(csv(q.cities))}" placeholder="Riyadh, Jeddah"></div>
 <div><label>${t('salary')}</label><input id="qs" value="${esc(q.salary)}" inputmode="numeric"></div><div><label>${t('elang')}</label><select id="ql"><option value="both">${t('both')}</option><option value="ar">العربية</option><option value="en">English</option></select></div>
 <div><label>${t('mode')}</label><select id="qm"><option value="review">${t('m_review')}</option><option value="auto">${t('m_auto')}</option></select></div><div><label>${t('cap')}</label><input id="qcap" type="number" min="1" max="50" value="${q.dailyCap}"></div></div>`}
async function saveProf(quiet){ME=await api('/api/profile',{method:'PUT',body:{profile:{name:$('#pn').value.trim(),title:$('#pt').value.trim(),years:+$('#py').value,city:$('#pc').value.trim(),phone:$('#pp').value.trim(),nationality:$('#pna').value.trim(),skills:arr($('#ps').value)},
 prefs:{titles:arr($('#qt').value),cities:arr($('#qc').value),salary:$('#qs').value,lang:$('#ql').value,mode:$('#qm').value,dailyCap:+$('#qcap').value,dryRun:ME.mail?$('#qd').checked:true}}});quiet||toast(t('saved'))}
function setSel(){if($('#ql')){$('#ql').value=ME.prefs.lang;$('#qm').value=ME.prefs.mode}}
function mailForm(){if(ME.mail)return `<div class="row"><div class="ico">${ic('mail')}</div><div><b dir="ltr">${esc(ME.mail.address)}</b><div><span class="st sent">${t('connected')} · ${ME.mail.type==='gmail'?'Gmail':ME.mail.type==='outlook'?'Outlook':'Gmail (كلمة مرور التطبيق)'}</span></div></div><span class="sp"></span><button class="btn sm" id="tm">${t('testmail')}</button><button class="btn sm" id="dm">${t('disconnect')}</button></div>`;
 const A=LANG==='ar';
 return `<div class="apcard"><div class="aphd"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg><div><b>${A?'ربط Gmail بكلمة مرور التطبيق':'Connect Gmail with an App Password'}</b><div class="muted" style="font-size:13px">${A?'الطلبات تنرسل من إيميلك أنت مباشرة للشركات':'Applications are sent from your own Gmail'}</div></div><span class="badge">${A?'موصى به':'Recommended'}</span></div>
 <div class="wz">
 <div class="wzs" id="wz1"><div class="wzn">1</div><div class="wzb"><b>${A?'فعّل التحقق بخطوتين':'Turn on 2-Step Verification'}</b><div class="wzh">${A?'إذا مفعّل عندك تجاوز ✌️':'Already on? Skip it'}</div>
  <a class="btn big full" href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noopener" onclick="wzDone(1)">${A?'فعّل التحقق بخطوتين ↗':'Turn on 2-Step ↗'}</a></div></div>
 <div class="wzs" id="wz2"><div class="wzn">2</div><div class="wzb"><b>${A?'اطلع الكود':'Get your code'}</b><div class="wzh">${A?'سمّه <b>واصل</b> واضغط إنشاء، وانسخ الكود (١٦ حرف)':'Name it <b>Wasel</b>, tap Create, copy the 16-letter code'}</div>
  <a class="btn big full" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" onclick="wzDone(2)">${A?'اطلع الكود ↗':'Get the code ↗'}</a></div></div>
 <div class="wzs" id="wz3"><div class="wzn">3</div><div class="wzb"><b>${A?'الصق إيميلك والكود':'Paste your email and code'}</b>
  <input id="mu" class="bigin" type="email" dir="ltr" placeholder="name@gmail.com" autocomplete="email" inputmode="email">
  <input id="mw" class="bigin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" dir="ltr" placeholder="xxxx xxxx xxxx xxxx">
  <div class="wzh">${ic('lock',13)} ${A?'نحفظه مشفّر وللإرسال بس. تقدر تلغيه من قوقل متى ما بغيت.':'Stored encrypted, used only for sending.'}</div>
  <div id="me" class="apmsg"></div><button class="btn p big full" id="mv">${A?'اربط إيميلي':'Connect'}</button></div></div>
 </div></div>
 <div class="altrow">${CFG.google?`<a class="btn gbtn full sec" href="/api/mail/google/start"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${A?'ربط Gmail بضغطة':'One-click Gmail'} <span class="soon">${A?'قريباً · للمختبرين فقط':'Soon · testers only'}</span></a>`:''}
 ${CFG.microsoft?`<a class="btn full sec" style="margin-top:10px" href="/api/mail/microsoft/start">${t('outlook')}</a>`:''}</div>`}
window.wzDone=n=>{const e=$('#wz'+n);e&&e.classList.add('done')};
function bindMail(after){if($('#mv')){const A=LANG==='ar',M=$('#me'),W=$('#mw'),U=$('#mu');
 const show=(ok,txt,step)=>{M.className='apmsg big '+(ok?'ok':'bad');M.innerHTML=(ok?'✅ ':'⚠️ ')+txt;document.querySelectorAll('.wzs').forEach(x=>x.classList.remove('hl'));if(step){const s=$('#wz'+step);s.classList.add('hl');s.scrollIntoView({behavior:'smooth',block:'center'})}};
 const clean=()=>{const v=W.value.replace(/[\s\u200e\u200f-]+/g,'');if(v!==W.value)W.value=v;return v};
 let busy=0;const go=async()=>{if(busy)return;const pw=clean(),em=U.value.trim().toLowerCase();M.className='apmsg';M.textContent='';
 if(!/^\S+@\S+\.\S+$/.test(em))return show(0,A?'اكتب إيميل Gmail صحيح':'Enter a valid Gmail address');
 if(!/^[a-z]{16}$/i.test(pw))return show(0,A?'الكود لازم يكون ١٦ حرف إنجليزي، مو كلمة مرور حسابك. ارجع للخطوة ٢':'The code must be 16 letters. See step 2',2);
 busy=1;$('#mv').disabled=true;$('#mv').textContent=A?'لحظة نتحقق…':'Verifying…';
 try{ME=await api('/api/mail/smtp',{method:'POST',body:{host:'smtp.gmail.com',port:465,user:em,pass:pw}});show(1,A?'<b>تم الربط!</b> طلباتك بتطلع من إيميلك، وأرسلنا لك إيميل تأكيد':'<b>Connected!</b> Check your inbox for a confirmation');toast(t('connected')+' ✓');setTimeout(()=>after?after():settings(),1800)}
 catch(e){const m={smtp_blocked:[A?'فيه مشكلة عندنا مو عندك، جرّب بعد شوي':'Server issue, try again later'],
  badpass:[A?'الكود أو الإيميل غلط. اطلع كود جديد من الخطوة ٢ والصقه':'Wrong email or code. Get a new one in step 2',2],
  need_2fa:[A?'لازم تفعّل التحقق بخطوتين أول، روح للخطوة ١':'Turn on 2-Step Verification first (step 1)',1],
  badformat:[A?'الكود لازم ١٦ حرف إنجليزي. الخطوة ٢':'Code must be 16 letters (step 2)',2],missing:[A?'عبّ الإيميل والكود':'Fill both fields']};
  const r=m[e.error]||[(A?'ما قدرنا نتحقق، جرّب مرة ثانية':'Could not verify, try again')];show(0,r[0],r[1])}
 busy=0;$('#mv').disabled=false;$('#mv').textContent=A?'اربط إيميلي':'Connect'};
 $('#mv').onclick=go;
 W.addEventListener('input',()=>{const v=clean();if(/^[a-z]{16}$/i.test(v)&&/^\S+@\S+\.\S+$/.test(U.value.trim()))go()});
 U.addEventListener('change',()=>{if(/^[a-z]{16}$/i.test(clean()))go()});}
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
  const body=groups.length?groups.map(g=>`<div class="type-block"><div class="type-h"><span>${esc(LANG==='ar'?g.type:g.type_en)}</span><span class="muted">${g.jobs.length}</span><span class="sp"></span><button type="button" class="btn sm catall" data-cat="${esc(g.type)}">${LANG==='ar'?'حدد الكل':'Select all'}</button></div><div class="grid">${g.jobs.map(jobCard).join('')}</div></div>`).join(''):`<div class="card empty"><p>${LANG==='ar'?'ما فيه وظائف بهالقسم':'No jobs in this section'}</p></div>`;
  $('#joblist').innerHTML=body;
  $('#jcount').textContent=list.length;
  $$('.catall').forEach(b=>b.onclick=e=>{e.preventDefault();const cs=$$('.type-block').find(x=>x.contains(b)).querySelectorAll('.pick');const all=[...cs].every(c=>c.checked);cs.forEach(c=>c.checked=!all);updBar()});$$('.pick').forEach(c=>c.onchange=updBar);updBar();
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
 <div class="row" style="margin:6px 0 14px;position:sticky;top:72px;z-index:5;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(10px);padding:8px 0"><span class="muted"><span id="jcount">${js.length}</span> ${LANG==='ar'?'وظيفة':'jobs'} · ${t('by_type')}</span><span class="sp"></span><button class="btn sm" id="best">${ic('spark',16)} ${t('selall')}</button></div>
 <div id="joblist"></div></div><div class="bulkbar" id="bb" hidden><button class="btn sm" id="bclr">${AR?'إلغاء التحديد':'Clear'}</button><button class="btn big" id="bgo">${AR?'قدّم على':'Apply to'} (<span id="cnt">0</span>) ${AR?'وظيفة':'jobs'}</button></div>`;
 renderJobList();$('#bclr').onclick=()=>{$$('.pick').forEach(c=>c.checked=false);updBar()};$('#bgo').onclick=bulkSheet;
 $$('.seg').forEach(b=>b.onclick=()=>{$$('.seg').forEach(x=>x.classList.remove('on'));b.classList.add('on');JOB_FILTER=b.dataset.f;renderJobList()});
 $('#best').onclick=()=>{let n=0;$$('.pick').forEach(c=>{const j=JOBS_CACHE.find(x=>x.id==c.value);c.checked=!!(j&&j.score>=40&&n<25)&&!!++n});updBar()};
}
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

const BMAX=25;
function updBar(){const n=$$('.pick:checked').length;if(!$('#bb'))return;$('#bb').hidden=!n;$('#cnt').textContent=n;$('#bb').classList.toggle('over',n>BMAX)}
const stTxt=s=>({queued:AR?'بالانتظار':'Queued',sending:AR?'يرسل الحين…':'Sending…',sent:AR?'انرسل ✓':'Sent ✓','dry-run':AR?'تجربة ✓':'Simulated ✓',failed:AR?'فشل ✗':'Failed ✗','skipped-duplicate':AR?'مقدّم عليها':'Already applied','cap-reached':AR?'وصلت الحد اليومي':'Daily limit',cancelled:AR?'ملغي':'Cancelled'}[s]||s);
function bulkSheet(){const ids=$$('.pick:checked').map(c=>+c.value);if(!ids.length)return;
 if(ids.length>BMAX)return toast(AR?`الحد ${BMAX} وظيفة بالدفعة الوحدة، شيل ${ids.length-BMAX}`:`Max ${BMAX} per batch`);
 const js=ids.map(i=>JOBS_CACHE.find(j=>j.id===i)).filter(Boolean),dry=ME.prefs.dryRun||CFG.dryRun;
 const left=Math.max(0,50-ME.sentToday);
 const d=document.createElement('div');d.className='sheetbg';d.innerHTML=`<div class="sheet" role="dialog"><div class="grab"></div><h2>${AR?`بتقدّم على ${js.length} وظيفة`:`Apply to ${js.length} jobs`}</h2>
 ${dry?`<div class="sheetnote dry">🧪 ${AR?'وضع التجربة شغال: ما راح ينرسل شي للشركات، بس نجرب.':'Test mode: nothing is really sent.'}</div>`:`<div class="sheetnote">${AR?`بتنرسل من <b dir="ltr">${esc(ME.mail?.address||'')}</b> وحدة وحدة، بين كل وحدة ٢٠-٤٠ ثانية عشان ما ينحسب إيميلك سبام. تقدر تقفل الصفحة وبيكمّل.`:'Sent one by one from your email, 20-40s apart. You can close the page.'}</div>`}
 <p class="sheetsub">${AR?`باقي لك اليوم ${left} من ٥٠`:`${left} of 50 left today`}</p>
 <ol class="sheetlist">${js.map(j=>`<li><b dir="auto">${esc(AR?j.title_ar:j.title)}</b><span>${esc(j.company)} · ${esc(j.city)}</span></li>`).join('')}</ol>
 <button class="btn big full" id="sgo">${AR?'أكّد وابدأ التقديم':'Confirm & start'}</button><button class="btn full" id="sno" style="margin-top:8px">${AR?'رجوع':'Back'}</button></div>`;
 document.body.appendChild(d);d.onclick=e=>{if(e.target===d)d.remove()};$('#sno').onclick=()=>d.remove();
 $('#sgo').onclick=async()=>{$('#sgo').disabled=true;$('#sgo').textContent='…';try{await api('/api/batch',{method:'POST',body:{jobIds:ids}});d.remove();location.hash='#/batch'}catch(e){$('#sgo').disabled=false;$('#sgo').textContent=AR?'أكّد وابدأ التقديم':'Confirm & start';
  toast({nomail:AR?'اربط إيميلك أول من الإعدادات':'Connect your email first',running:AR?'عندك دفعة شغالة، استنها تخلص':'A batch is already running',cap:AR?'وصلت حد اليوم (٥٠)، كمّل بكرة':'Daily limit reached',nothing:AR?'كلها مقدّم عليها من قبل':'All already applied',batchmax:AR?'الحد ٢٥ بالدفعة':'Max 25',nocv:AR?'ارفع سيرتك أول':'Upload your CV'}[e.error]||'Error')}}}
let BT=null;
async function batch(){clearTimeout(BT);const b=await api('/api/batch/current');
 if(!b){V().innerHTML=tabs('apps')+`<div class="card empty"><p>${AR?'ما عندك دفعة تقديم':'No batch yet'}</p><a class="btn p" href="#/jobs">${t('t_jobs')}</a></div>`;return}
 const n=b.items.length,ok=b.items.filter(i=>['sent','dry-run'].includes(i.status)).length,bad=b.items.filter(i=>['failed','cap-reached'].includes(i.status)).length,doneN=b.items.filter(i=>!['queued','sending'].includes(i.status)).length,run=b.state==='running';
 V().innerHTML=tabs('apps')+`<div class="fade bprog"><h2>${run?(AR?'جاري التقديم…':'Applying…'):(AR?'خلصت الدفعة ✓':'Batch done ✓')}</h2>
 ${b.dry?`<div class="sheetnote dry">🧪 ${AR?'وضع التجربة: ما انرسل شي فعلياً':'Test mode: simulated only'}</div>`:''}
 <div class="pbar"><i style="width:${Math.round(doneN/n*100)}%"></i></div>
 <div class="pnums"><span class="g">${AR?'انرسل':'Sent'} ${ok}</span><span class="r">${AR?'فشل':'Failed'} ${bad}</span><span>${doneN} / ${n}</span></div>
 ${b.skipped?`<p class="sheetsub">${AR?`تجاوزنا ${b.skipped} وظيفة مقدّم عليها من قبل`:`Skipped ${b.skipped} already applied`}</p>`:''}
 ${run?`<p class="sheetsub">${AR?'تقدر تقفل الصفحة، التقديم يكمّل لحاله.':'You can close this page; it keeps going.'}</p>`:''}
 <div class="blist">${b.items.map(i=>`<div class="bi ${i.status}"><div><b dir="auto">${esc(AR?i.title_ar:i.title)}</b><span>${esc(i.company)}</span>${i.error?`<span class="er">${esc(i.error)}</span>`:''}</div><em>${stTxt(i.status)}</em></div>`).join('')}</div>
 ${run?`<button class="btn full" id="bcan" style="margin-top:14px">${AR?'وقّف الباقي':'Stop the rest'}</button>`:`<a class="btn big full" href="#/apps" style="margin-top:14px">${AR?'سجل الطلبات':'Applications history'}</a>`}</div>`;
 if($('#bcan'))$('#bcan').onclick=async()=>{await api('/api/batch/'+b.id+'/cancel',{method:'POST'});batch()};
 if(run)BT=setTimeout(()=>{if(location.hash.startsWith('#/batch'))batch()},2500)}
