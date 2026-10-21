// Shows "last updated" next to the jobs count (independent of app.js).
(function(){let meta=null,t=0;const AR=()=>(document.documentElement.lang||'ar').startsWith('ar');
const ago=d=>{const m=Math.max(1,Math.round((Date.now()-Date.parse(d))/6e4));if(AR())return m<60?`قبل ${m} دقيقة`:m<1440?`قبل ${Math.round(m/60)} ساعة`:`قبل ${Math.round(m/1440)} يوم`;return m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:`${Math.round(m/1440)} d ago`};
async function load(){if(Date.now()-t<6e4&&meta)return meta;t=Date.now();try{meta=await (await fetch('/api/jobs/meta')).json()}catch{}return meta}
async function paint(){const c=document.getElementById('jcount');if(!c||document.getElementById('lupd'))return;const m=await load();if(!m||!m.lastUpdated||document.getElementById('lupd'))return;
const s=document.createElement('span');s.id='lupd';s.className='muted';s.style.cssText='font-size:.85em;margin-inline-start:8px';s.textContent='· '+(AR()?'آخر تحديث ':'Updated ')+ago(m.lastUpdated);(c.parentElement||c).after(s)}
new MutationObserver(paint).observe(document.documentElement,{childList:true,subtree:true});})();
