// Wasel job ingester: public Telegram channel previews (t.me/s) + public WordPress RSS feeds.
// Keeps only posts with a valid application email. No logins. Polite: 1 request at a time, small page counts.
const UA = 'Mozilla/5.0 (compatible; WaselJobsBot/1.0; +https://wasel-jobs.onrender.com)';
const TG = ['saudirecruiters', 'ksa4work', 'jobseastern', 'Taras_saudi', 'jobs_saudi_arab', 'jobs4ksa'];
const RSS = ['https://alwzifa.com/feed', 'https://sqrjobs.net/feed'];
const TG_PAGES = 10, MAX_AGE_DAYS = 30;
const BAD_EMAIL = /(example|sentry|wixpress|\.png|\.jpe?g|\.webp|\.gif|@2x|noreply|no-reply|tarassaudi|telegram|alwzifa\.com|sqrjobs|wordpress)/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,10}/g;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = async u => { const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en' }, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); };
const ent = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const strip = h => ent(h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();

const CITIES = [['الرياض', 'Riyadh', /الرياض|riyadh/i], ['جدة', 'Jeddah', /جد[ةه]|jedd?ah/i], ['الدمام', 'Dammam', /الدمام|dammam/i], ['الخبر', 'Khobar', /الخبر|khobar/i], ['الظهران', 'Dhahran', /الظهران|dhahran/i],
  ['مكة', 'Makkah', /مك[ةه] المكرم|مكة|makkah|mecca/i], ['المدينة', 'Madinah', /المدينة المنورة|madinah|medina/i], ['الجبيل', 'Jubail', /الجبيل|jubail/i], ['الطائف', 'Taif', /الطائف|taif/i], ['تبوك', 'Tabuk', /تبوك|tabuk/i],
  ['أبها', 'Abha', /أبها|ابها|abha/i], ['خميس مشيط', 'Khamis Mushait', /خميس مشيط/i], ['القصيم', 'Qassim', /القصيم|بريدة|عنيزة|qassim|buraydah/i], ['الأحساء', 'Al Ahsa', /الأحساء|الاحساء|الهفوف|ahsa|hofuf/i],
  ['حائل', 'Hail', /حائل|hail/i], ['جازان', 'Jazan', /جازان|جيزان|jazan/i], ['نجران', 'Najran', /نجران|najran/i], ['ينبع', 'Yanbu', /ينبع|yanbu/i], ['الخرج', 'Al Kharj', /الخرج/i], ['المنطقة الشرقية', 'Eastern Province', /الشرقية|eastern province/i]];
const TYPES = [ // [ar, en, regex]  order matters
  ['صحة', 'Healthcare', /تمريض|ممرض|طبيب|طبيبة|صيدل|مستشفى|عيادة|مختبر|أسنان|اسنان|أخصائي علاج|nurs|pharm|clinic|hospital|medical|dental|physio/i],
  ['تعليم', 'Education', /معلم|معلمة|مدرس|تدريس|رياض أطفال|رياض الاطفال|حاضنة|مدرسة|مدارس|أكاديمي|teacher|school|tutor|kindergarten|lecturer/i],
  ['تقنية', 'IT', /مبرمج|برمجة|مطور|تقنية المعلومات|دعم فني|شبكات|أمن سيبراني|سيبراني|developer|software|it support|network|cyber|data (analyst|engineer|scientist)|devops|\bIT\b/i],
  ['هندسة', 'Engineering', /مهندس|هندس|engineer|technician|فني /i],
  ['أمن', 'Security', /حارس|حراس|أمن |امن |حراسات|security guard|security officer/i],
  ['مبيعات', 'Sales', /مبيعات|مندوب|تسويق|كاشير|بائع|بائعة|تجزئة|sales|marketing|cashier|retail|merchandis/i],
  ['ضيافة', 'Hospitality', /استقبال|باريستا|طباخ|شيف|مطعم|فندق|ضيافة|خدمة عملاء|كول سنتر|reception|barista|chef|cook|hotel|restaurant|customer service|call center/i],
  ['نظافة', 'Cleaning', /نظافة|عامل نظافة|عاملة نظافة|cleaner|housekeep/i],
  ['صناعة', 'Industrial', /مصنع|إنتاج|انتاج|مستودع|سائق|نقل ثقيل|لوجست|warehouse|driver|production|logistic|factory/i],
  ['إداري', 'Admin', /.*/]];
const gender = (t, title) => {
  const w = /للنساء|نسائي|نسائية|للسيدات|سيدات فقط|للإناث|للاناث|إناث|اناث|female|women|ladies/i.test(t) || /للنساء|نسائي|نسائية|للسيدات|سيدات فقط|للإناث|للاناث|إناث|اناث|female|women|ladies|موظفة|معلمة|ممرضة|أخصائية|اخصائية|محاسبة|سكرتيرة|بائعة|حاضنة|مصممة|اختصاصية/i.test(title);
  const m = /للرجال|رجال فقط|للذكور|ذكور|\bmales?\b|\bmen only\b/i.test(t);
  const both = /للجنسين|الجنسين|both genders|ذكور وإناث|ذكور واناث|رجال ونساء|male\s*(&|and|\/)\s*female/i.test(t);
  if (both || (w && m)) return 'open'; if (/للنساء|نسائي|للسيدات|سيدات فقط|للإناث|للاناث|women only|female only|ladies only/i.test(t)) return 'women_only'; if (m) return 'men_only'; if (w) return 'women_preferred'; return 'open'; };
const TITLE_RES = [/بمسمى\s*[:：(«"]?\s*([^\n)»".،]{3,60})/, /بمسميات?\s*(?:التالية)?\s*[:：]?\s*\n?\s*[🔹▪️•\-–*✅📌]*\s*([^\n]{3,60})/, /(?:position|job title|role)\s*[:：]\s*([^\n]{3,60})/i, /شاغر(?:\s+وظيفي)?\s*[:：]\s*([^\n]{3,60})/, /وظيف[ةه]\s*[:：]\s*([^\n]{3,60})/, /⬅️\s*([^\n⚫]{3,60})/];
const COMPANY_RES = [/(?:تعلن|يعلن)\s+((?:شركة|شركه|مؤسسة|مؤسسه|مجموعة|مجموعه|مستشفى|مستشفي|مدارس|مدرسة|مركز|مجمع|عيادات|جامعة|بنك|مصنع|فندق|مطاعم|مطعم)\s+[^\n،,.(]{2,40}?)(?=\s+(?:عن|في|ب|ل)\s|\s*[،,.\n(])/, /(?:company|at)\s*[:：]\s*([^\n]{2,40})/i];
const clean = s => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F#*_~|]/gu, '').replace(/\s+/g, ' ').trim().replace(/^[\s:：\-–•▪]+|[\s:：\-–•▪]+$/g, '');
const KW = /وظيف|وظائف|شاغر|توظيف|السيرة الذاتية|سيرتك|cv|resume|hiring|vacanc|job/i;

function parse(text, meta) {
  if (!KW.test(text)) return [];
  const emails = [...new Set((text.match(EMAIL_RE) || []).map(e => e.replace(/\.+$/, '')).filter(e => !BAD_EMAIL.test(e) && e.length < 80))];
  if (!emails.length) return [];
  let title = ''; for (const r of TITLE_RES) { const m = text.match(r); if (m) { title = clean(m[1]); if (title.length >= 3) break; } }
  if (!title && meta.title) title = clean(meta.title);
  if (!title) { const l = text.split('\n').map(clean).find(l => l.length > 6 && l.length < 70 && !/@|http|requirement|responsibilit|المتطلبات|الشروط|hiring/i.test(l) && !/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(l)); title = l || 'وظيفة شاغرة'; }
  title = title.slice(0, 80);
  let company = ''; for (const r of COMPANY_RES) { const m = text.match(r); if (m) { company = clean(m[1]); break; } }
  if (!company) { const dom = emails[0].split('@')[1].toLowerCase(); company = /gmail|hotmail|outlook|yahoo|icloud|live\./.test(dom) ? 'جهة توظيف (بدون اسم)' : dom.split('.')[0].replace(/^./, c => c.toUpperCase()); }
  const c = CITIES.find(x => x[2].test(text)); const ty = TYPES.find(x => x[2].test(title)) || TYPES.find(x => x[2].test(text));
  const subj = text.match(/(?:عنوان (?:الرسالة|البريد|الإيميل|الايميل))/) ? title : null;
  return [{ company: company.slice(0, 60), title, title_ar: title, city: c ? c[1] : 'Saudi Arabia', city_ar: c ? c[0] : 'السعودية', email: emails[0], alt_emails: emails.slice(1, 3),
    source: meta.link, source_name: meta.src, posted: (meta.date || new Date().toISOString()).slice(0, 10), gender: gender(text, title), type: ty[0], type_en: ty[1],
    skills: [ty[0], ...((title.match(/[\p{L}]{3,}/gu) || []).slice(0, 5))], subject_format: subj, kind: 'vacancy', ingested: true, snippet: text.slice(0, 600) }];
}

async function telegram(ch, report) {
  const out = []; let before = '';
  for (let p = 0; p < TG_PAGES; p++) {
    const h = await get(`https://t.me/s/${ch}${before ? '?before=' + before : ''}`);
    const blocks = h.split('tgme_widget_message_wrap').slice(1); if (!blocks.length) { if (!p) report.rejected['t.me/' + ch] = 'no public web preview'; break; }
    let minId = Infinity;
    for (const b of blocks) {
      const id = (b.match(/data-post="([^"]+)"/) || [])[1]; if (!id) continue; const n = +id.split('/')[1]; if (n < minId) minId = n;
      const tx = (b.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="tgme_widget_message_(?:footer|reply_markup|link_preview)|<div class="tgme_widget_message_info)/) || [])[1];
      const date = (b.match(/datetime="([^"]+)"/) || [])[1];
      if (!tx || (date && Date.now() - Date.parse(date) > MAX_AGE_DAYS * 864e5)) continue;
      out.push(...parse(strip(tx), { link: 'https://t.me/' + id, src: 't.me/' + ch, date }));
    }
    if (!isFinite(minId) || minId <= 1) break; before = minId; await sleep(1200);
  }
  return out;
}
async function rss(url) {
  const x = await get(url); const out = [];
  for (const it of x.split('<item>').slice(1)) {
    const g = t => ((it.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`)) || [])[1] || '');
    const date = g('pubDate'); if (date && Date.now() - Date.parse(date) > MAX_AGE_DAYS * 864e5) continue;
    const body = strip(g('content:encoded') || g('description'));
    out.push(...parse(body, { link: g('link').trim(), src: new URL(url).host, date: date ? new Date(date).toISOString() : null, title: null }));
  }
  return out;
}

async function runIngest(db, save) {
  const report = { started: new Date().toISOString(), bySource: {}, byGender: {}, byType: {}, added: 0, updated: 0, expired: 0, rejected: {} };
  const found = [];
  for (const ch of TG) { try { const r = await telegram(ch, report); found.push(...r); report.bySource['t.me/' + ch] = { parsed: r.length }; if (!r.length) report.rejected['t.me/' + ch] = 'no posts with an application email (apply via links/WhatsApp)'; } catch (e) { report.rejected['t.me/' + ch] = e.message; } }
  for (const u of RSS) { try { const r = await rss(u); found.push(...r); report.bySource[new URL(u).host] = { parsed: r.length }; } catch (e) { report.rejected[u] = e.message; } }
  const key = j => j.email.toLowerCase() + '|' + j.title.toLowerCase().replace(/\s+/g, ' ');
  const have = new Map(db.jobs.map(j => [key(j), j])); const now = new Date().toISOString();
  for (const j of found) {
    const k = key(j), e = have.get(k);
    if (e) { if (e.ingested) { e.seen = now; report.updated++; } continue; }
    const job = { id: db.seq++, ...j, added: now, seen: now }; db.jobs.push(job); have.set(k, job); report.added++;
    const s = report.bySource[j.source_name] || (report.bySource[j.source_name] = { parsed: 0 }); s.added = (s.added || 0) + 1;
    report.byGender[j.gender] = (report.byGender[j.gender] || 0) + 1; report.byType[j.type] = (report.byType[j.type] || 0) + 1;
  }
  const cut = Date.now() - MAX_AGE_DAYS * 864e5; const n0 = db.jobs.length;
  const gone = new Set(db.jobs.filter(j => j.ingested && Date.parse(j.posted) < cut).map(j => j.id));
  db.jobs = db.jobs.filter(j => !gone.has(j.id)); report.expired = n0 - db.jobs.length;
  report.total = db.jobs.length; report.ingestedActive = db.jobs.filter(j => j.ingested).length; report.finished = new Date().toISOString();
  db.meta = { ...(db.meta || {}), lastIngest: report.finished, lastReport: report }; save();
  return report;
}
module.exports = { runIngest, parse };
