const express = require('express'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const multer = require('multer'), pdf = require('pdf-parse'), mammoth = require('mammoth');
const nodemailer = require('nodemailer'), MailComposer = require('nodemailer/lib/mail-composer');
const bcrypt = require('bcryptjs'), cookieParser = require('cookie-parser');
const SEED = require('./jobs-seed');

const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const ENC_KEY = crypto.createHash('sha256').update(process.env.ENC_KEY || SECRET).digest();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const GLOBAL_DRY = process.env.DRY_RUN === '1';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MS_ID = process.env.MS_CLIENT_ID, MS_SECRET = process.env.MS_CLIENT_SECRET;
const _b64 = v => { try { return v ? Buffer.from(v, 'base64').toString('utf8').trim() : ''; } catch { return ''; } };
const G_ID = process.env.GOOGLE_CLIENT_ID || _b64((process.env.GID_P1 || '') + (process.env.GID_P2 || '') + (process.env.GID_P3 || '')) || _b64(process.env.GID_B64), G_SECRET = process.env.GOOGLE_CLIENT_SECRET || _b64((process.env.GSEC_P1 || '') + (process.env.GSEC_P2 || ''));
fs.mkdirSync(path.join(DATA, 'cv'), { recursive: true });

// ---------- tiny JSON store ----------
const DBF = path.join(DATA, 'db.json');
let db = fs.existsSync(DBF) ? JSON.parse(fs.readFileSync(DBF, 'utf8')) : { users: [], jobs: [], apps: [], seq: 1 };
// Optional persistent Postgres (DATABASE_URL): whole state as one JSONB row + CV files as bytea.
const _dec = s => { try { return Buffer.from(s || '', 'base64').toString('utf8'); } catch { return ''; } };
const _isPg = s => /^postgres(ql)?:\/\//.test(s || '');
const RELAY_URL = process.env.RELAY_URL || '', RELAY_SECRET = process.env.RELAY_SECRET || _b64((process.env.RLY_P1 || '') + (process.env.RLY_P2 || '') + (process.env.RLY_P3 || ''));
async function relaySend(cfg, msg) {
  const atts = []; for (const a of msg.attachments || []) atts.push({ filename: a.filename, contentType: a.contentType || ({ '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.doc': 'application/msword' }[path.extname(a.filename || '').toLowerCase()]), base64: (await fs.promises.readFile(a.path)).toString('base64') });
  const r = await fetch(RELAY_URL.replace(/\/$/, '') + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Relay-Secret': RELAY_SECRET }, signal: AbortSignal.timeout(45000),
    body: JSON.stringify({ host: cfg.host, port: cfg.port, user: cfg.auth.user, appPassword: cfg.auth.pass, fromName: msg.fromName, to: msg.to, replyTo: msg.replyTo, subject: msg.subject, text: msg.text, html: msg.html, attachments: atts }) });
  const j = await r.json().catch(() => ({ ok: false, error: 'relay_' + r.status }));
  if (!j.ok) throw Object.assign(new Error('relay ' + j.error + ' ' + (j.detail || '')), { relayError: j.error, smtpCode: j.smtpCode });
  return j;
}
const useRelay = cfg => !!(RELAY_URL && RELAY_SECRET && cfg.port === 465);
const DATABASE_URL = [process.env.DATABASE_URL, _dec(process.env.DATABASE_URL_B64), _dec((process.env.DB_P1 || '') + (process.env.DB_P2 || '') + (process.env.DB_P3 || ''))].find(_isPg) || '';
let PG = DATABASE_URL ? new (require('pg').Pool)({ connectionString: DATABASE_URL, ssl: /render\.com|neon|supabase/.test(DATABASE_URL) ? { rejectUnauthorized: false } : false }) : null;
let pgTimer = null;
const save = () => { fs.writeFileSync(DBF + '.tmp', JSON.stringify(db)); fs.renameSync(DBF + '.tmp', DBF);
  if (PG) { clearTimeout(pgTimer); pgTimer = setTimeout(() => PG.query('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT(k) DO UPDATE SET v=$2', ['db', JSON.stringify(db)]).catch(e => console.error('pg save', e.message)), 300); } };
const saveFile = (uid, buf, ext) => PG && PG.query('INSERT INTO files(uid,ext,data) VALUES($1,$2,$3) ON CONFLICT(uid) DO UPDATE SET ext=$2,data=$3', [uid, ext, buf]).catch(e => console.error('pg file', e.message));
const delFile = uid => PG && PG.query('DELETE FROM files WHERE uid=$1', [uid]).catch(() => {});
function seedJobs() { // merge seed (adds new fields like gender) by email+title
  for (const j of SEED) { const e = db.jobs.find(x => x.email === j.email && x.title === j.title); if (e) Object.assign(e, j); else db.jobs.push({ id: db.seq++, ...j, added: new Date().toISOString() }); } }
async function boot() {
  if (PG) try {
    await PG.query('CREATE TABLE IF NOT EXISTS kv(k text primary key, v jsonb)'); await PG.query('CREATE TABLE IF NOT EXISTS files(uid int primary key, ext text, data bytea)');
    const r = await PG.query("SELECT v FROM kv WHERE k='db'"); if (r.rows[0]) db = r.rows[0].v;
    for (const f of (await PG.query('SELECT uid,ext,data FROM files')).rows) fs.writeFileSync(path.join(DATA, 'cv', f.uid + f.ext), f.data);
    for (const u of db.users) if (u.cv) u.cv.file = path.join(DATA, 'cv', path.basename(u.cv.file));
    console.log('Postgres storage: loaded', db.users.length, 'users');
  } catch (e) { console.error('Postgres unavailable, using file storage:', e.message); PG = null; }
  // Migrate: if jobs lack type/gender audience, rebuild from seed (preserve id by email+title when possible)
  if (!db.jobs.length || db.jobs.some(j => !j.type || !['women_only','men_only','women_preferred','open'].includes(j.gender))) {
    const old = db.jobs.slice(); db.jobs = [];
    for (const j of SEED) {
      const prev = old.find(x => x.email === j.email && x.title === j.title);
      db.jobs.push({ id: prev?.id || db.seq++, ...j, added: prev?.added || new Date().toISOString() });
    }
    // keep admin-added jobs (not in seed), normalised
    for (const x of old) if (!SEED.some(j => j.email === x.email && j.title === x.title)) db.jobs.push({ ...x, gender: ['women_only','men_only','women_preferred','open'].includes(x.gender) ? x.gender : 'open', type: x.type || 'إداري', type_en: x.type_en || 'Admin' });
  } else seedJobs();
  save();
}

// ---------- crypto helpers (secrets never logged / returned) ----------
const enc = o => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const d = Buffer.concat([c.update(JSON.stringify(o)), c.final()]); return [iv, c.getAuthTag(), d].map(b => b.toString('base64')).join('.'); };
const dec = s => { const [iv, t, d] = s.split('.').map(x => Buffer.from(x, 'base64'));
  const c = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv); c.setAuthTag(t); return JSON.parse(Buffer.concat([c.update(d), c.final()])); };
const sign = v => v + '.' + crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
const unsign = s => { if (!s) return null; const i = s.lastIndexOf('.'); const v = s.slice(0, i); return sign(v) === s ? v : null; };

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' })); app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const auth = (req, res, next) => { const id = unsign(req.cookies.s); const u = id && db.users.find(x => x.id == id);
  if (!u) return res.status(401).json({ error: 'auth' }); req.u = u; next(); };
const pub = u => ({ id: u.id, email: u.email, profile: u.profile, prefs: u.prefs, cv: u.cv ? { name: u.cv.name, uploaded: u.cv.uploaded } : null,
  mail: u.mail ? { type: u.mail.type, address: u.mail.address, verified: u.mail.verified } : null, sentToday: sentToday(u) });
const setCookie = (res, id) => res.cookie('s', sign(String(id)), { httpOnly: true, sameSite: 'lax', secure: BASE_URL.startsWith('https'), maxAge: 30 * 864e5 });

// ---------- auth ----------
app.post('/api/signup', async (req, res) => {
  const { email, password, name, gender } = req.body || {};
  if (!/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8) return res.status(400).json({ error: 'invalid' });
  if (db.users.find(u => u.email === email.toLowerCase())) return res.status(409).json({ error: 'exists' });
  const u = { id: db.seq++, email: email.toLowerCase(), hash: await bcrypt.hash(password, 10), created: new Date().toISOString(),
    profile: { gender: ['m','f'].includes(gender) ? gender : '', name: name || '', title: '', skills: [], years: 0, city: '', phone: '', nationality: '' },
    prefs: { titles: [], cities: [], salary: '', mode: 'review', dailyCap: 20, lang: 'both', dryRun: true }, consent: new Date().toISOString() };
  db.users.push(u); save(); setCookie(res, u.id); res.json(pub(u));
});
app.post('/api/login', async (req, res) => {
  const u = db.users.find(x => x.email === (req.body.email || '').toLowerCase());
  if (!u || !(await bcrypt.compare(req.body.password || '', u.hash))) return res.status(401).json({ error: 'bad' });
  setCookie(res, u.id); res.json(pub(u));
});
app.post('/api/logout', (req, res) => { res.clearCookie('s'); res.json({ ok: 1 }); });
app.get('/api/me', auth, (req, res) => res.json(pub(req.u)));
app.get('/api/config', (req, res) => res.json({ microsoft: !!(MS_ID && MS_SECRET), google: !!(G_ID && G_SECRET), dryRun: GLOBAL_DRY, smtp: process.env.SMTP_ENABLED !== '0', relay: !!(RELAY_URL && RELAY_SECRET) }));

// ---------- CV parsing ----------
const CITIES = { 'riyadh': 'Riyadh', 'الرياض': 'Riyadh', 'jeddah': 'Jeddah', 'جدة': 'Jeddah', 'جده': 'Jeddah', 'dammam': 'Dammam', 'الدمام': 'Dammam',
  'khobar': 'Khobar', 'الخبر': 'Khobar', 'makkah': 'Makkah', 'mecca': 'Makkah', 'مكة': 'Makkah', 'madinah': 'Madinah', 'medina': 'Madinah', 'المدينة': 'Madinah',
  'jubail': 'Jubail', 'الجبيل': 'Jubail', 'ahsa': 'Al Ahsa', 'الأحساء': 'Al Ahsa', 'taif': 'Taif', 'الطائف': 'Taif', 'abha': 'Abha', 'أبها': 'Abha', 'tabuk': 'Tabuk', 'تبوك': 'Tabuk', 'qassim': 'Qassim', 'القصيم': 'Qassim', 'buraidah': 'Qassim' };
const SKILLS = ['javascript','typescript','python','java','react','node','sql','excel','power bi','sap','erp','oracle','autocad','revit','solidworks','primavera','project management','pmp','accounting','ifrs','finance','sales','b2b','marketing','digital marketing','seo','customer service','hr','recruitment','payroll','admin','ms office','communication','leadership','negotiation','hvac','mep','electrical','mechanical','civil','plumbing','hse','safety','fire safety','nursing','nurse','pharmacist','pharmacy','healthcare','logistics','supply chain','procurement','warehouse','cashier','data analysis','network','cybersecurity','it','support','linux','cloud','aws','design','photoshop','figma','teaching','teacher','kindergarten','childcare','reception','receptionist','security','guard','driver','cleaning','beauty','spa','data entry','arabic','english','محاسبة','مبيعات','تسويق','موارد بشرية','خدمة العملاء','إدارة','برمجة','تمريض','صيدلة','كهرباء','تكييف','سباكة','مشتريات','لوجستيات','سكرتارية'];
const goodName = n => /^[\p{L}][\p{L}'.-]*(\s+[\p{L}][\p{L}'.-]*){1,4}$/u.test((n || '').trim());
function extract(text) {
  const lines = text.split(/\n/).map(s => s.trim()).filter(Boolean), low = text.toLowerCase();
  const name = (lines.slice(0, 6).find(l => l.length < 40 && goodName(l) && !/@|\d|cv|resume|curriculum|سيرة|ذاتية|summary|profile/i.test(l)) || '').replace(/\s+/g, ' ');
  const title = (lines.slice(1, 8).find(l => l.length < 60 && /engineer|developer|manager|accountant|specialist|technician|officer|analyst|nurse|pharmacist|designer|consultant|supervisor|executive|sales|teacher|receptionist|guard|driver|cashier|secretary|معلم|حارس|سائق|استقبال|مهندس|محاسب|أخصائي|اخصائي|مدير|فني|مطور|مصمم|ممرض|مشرف|موظف/i.test(l)) || '');
  const skills = SKILLS.filter(s => new RegExp('(^|[^a-z\u0600-\u06ff])' + s.replace(/[.+]/g, '\\$&') + '($|[^a-z\u0600-\u06ff])', 'i').test(low));
  let years = 0; const m = low.match(/(\d{1,2})\+?\s*(years|yrs|سنوات|سنة|عام)/); if (m) years = +m[1];
  else { const ys = [...low.matchAll(/\b(19[89]\d|20[0-2]\d)\b/g)].map(x => +x[1]); if (ys.length > 1) years = Math.min(30, new Date().getFullYear() - Math.min(...ys) - (ys.length > 3 ? 4 : 0)); }
  const city = Object.entries(CITIES).find(([k]) => low.includes(k))?.[1] || '';
  const phone = (text.match(/(\+?966\s?|0)5\d[\s-]?\d{3}[\s-]?\d{4}/) || [''])[0];
  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [''])[0];
  return { name, title, skills, years: Math.max(0, years), city, phone, email };
}
app.post('/api/cv', auth, upload.single('cv'), async (req, res) => {
  const f = req.file; if (!f) return res.status(400).json({ error: 'nofile' });
  f.originalname = Buffer.from(f.originalname, 'latin1').toString('utf8');
  const ext = path.extname(f.originalname).toLowerCase();
  let text = '';
  try { if (ext === '.pdf') text = (await pdf(f.buffer)).text; else if (ext === '.docx') text = (await mammoth.extractRawText({ buffer: f.buffer })).value; else return res.status(400).json({ error: 'type' }); }
  catch (e) { console.error('cv parse', e.message); return res.status(400).json({ error: 'parse' }); }
  const file = path.join(DATA, 'cv', `${req.u.id}${ext}`); fs.writeFileSync(file, f.buffer); saveFile(req.u.id, f.buffer, ext);
  const ex = extract(text); const p = req.u.profile;
  req.u.cv = { name: f.originalname, file, uploaded: new Date().toISOString(), chars: text.length };
  req.u.profile = { ...p, name: p.name || (goodName(ex.name) ? ex.name : ''), title: ex.title || p.title, skills: ex.skills.length ? ex.skills : p.skills, years: ex.years || p.years, city: ex.city || p.city, phone: ex.phone || p.phone };
  if (!req.u.prefs.titles.length && req.u.profile.title) req.u.prefs.titles = [req.u.profile.title];
  if (!req.u.prefs.cities.length && req.u.profile.city) req.u.prefs.cities = [req.u.profile.city];
  save(); res.json({ extracted: ex, me: pub(req.u) });
});
app.put('/api/profile', auth, (req, res) => {
  const { profile, prefs } = req.body || {};
  if (profile) req.u.profile = { ...req.u.profile, ...profile };
  if (prefs) { req.u.prefs = { ...req.u.prefs, ...prefs }; req.u.prefs.dailyCap = Math.max(1, Math.min(50, +req.u.prefs.dailyCap || 20)); if (!req.u.mail) req.u.prefs.dryRun = true; }
  save(); res.json(pub(req.u));
});

// ---------- email connection ----------
app.post('/api/mail/smtp', auth, async (req, res) => {
  let { host, port, user, pass, fromName } = req.body || {};
  user = String(user || '').trim().toLowerCase(); pass = String(pass || '').replace(/\s+/g, '');
  host = String(host || 'smtp.gmail.com').trim(); port = +port || 465;
  if (!user || !pass) return res.status(400).json({ error: 'missing' });
  if (/gmail\.com$/.test(user) && !/^[a-z]{16}$/i.test(pass)) return res.status(400).json({ error: 'badformat' });
  const cfg = { host, port, secure: port === 465, auth: { user, pass } };
  if (useRelay(cfg)) {
    try { await relaySend(cfg, { fromName: fromName || req.u.profile.name, to: user, subject: 'واصل ✓ تم ربط إيميلك', text: 'تم ربط إيميلك بواصل بنجاح، وطلبات التوظيف بتنرسل من إيميلك هذا.\n\nYour Gmail is connected to Wasel.' }); }
    catch (e) {
      const map = { auth_failed: 'badpass', need_app_password: 'need_2fa', connection_failed: 'smtp_blocked' };
      console.warn('[relay-verify]', e.relayError, e.smtpCode);
      return res.status(400).json({ error: map[e.relayError] || 'verify', detail: String(e.message).split(pass).join('***').slice(0, 160) });
    }
  } else try { await nodemailer.createTransport({ ...cfg, connectionTimeout: 12000, greetingTimeout: 10000, socketTimeout: 15000 }).verify(); }
  catch (e) {
    const m = String(e.message || ''), code = String(e.code || ''), rc = +e.responseCode || 0;
    const safe = m.split(pass).join('***').slice(0, 160);
    let error = 'verify';
    if (/ETIMEDOUT|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|ESOCKET|ECONNECTION|timeout/i.test(code + ' ' + m) && !/127\.0\.0\.1|localhost/.test(host)) error = 'smtp_blocked';
    else if (/Application-specific password required|InvalidSecondFactor|534/i.test(m) || rc === 534) error = 'need_2fa';
    else if (code === 'EAUTH' || rc === 535 || /BadCredentials|Username and Password not accepted/i.test(m)) error = 'badpass';
    console.warn('[smtp-verify]', error, code, rc, safe);
    return res.status(400).json({ error, detail: safe });
  }
  req.u.mail = { type: 'smtp', address: user, fromName: fromName || req.u.profile.name, verified: new Date().toISOString(), secret: enc(cfg) };
  save(); res.json(pub(req.u));
});
app.delete('/api/mail', auth, (req, res) => { delete req.u.mail; save(); res.json(pub(req.u)); });
app.get('/api/mail/google/start', auth, (req, res) => {
  if (!G_ID) return res.status(501).send('Google OAuth not configured');
  const state = sign(String(req.u.id) + ':' + Date.now());
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: G_ID, redirect_uri: BASE_URL + '/api/mail/google/callback',
    response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'openid email https://www.googleapis.com/auth/gmail.send', state }));
});
const MS_AUTH = 'https://login.microsoftonline.com/common/oauth2/v2.0/', MS_SCOPE = 'openid email offline_access User.Read Mail.Send';
app.get('/api/mail/microsoft/start', auth, (req, res) => {
  if (!MS_ID) return res.status(501).send('Microsoft OAuth not configured');
  res.redirect(MS_AUTH + 'authorize?' + new URLSearchParams({ client_id: MS_ID, redirect_uri: BASE_URL + '/api/mail/microsoft/callback', response_type: 'code', scope: MS_SCOPE, prompt: 'select_account', state: sign(String(req.u.id) + ':' + Date.now()) }));
});
const msToken = p => fetch(MS_AUTH + 'token', { method: 'POST', body: new URLSearchParams({ client_id: MS_ID, client_secret: MS_SECRET, scope: MS_SCOPE, ...p }) }).then(r => r.json());
app.get('/api/mail/microsoft/callback', async (req, res) => {
  const st = unsign(req.query.state || ''); const u = st && db.users.find(x => x.id == st.split(':')[0]);
  if (!u || !req.query.code || Date.now() - +st.split(':')[1] > 15 * 60e3) return res.redirect('/app#/settings?mail=error');
  const t = await msToken({ code: req.query.code, redirect_uri: BASE_URL + '/api/mail/microsoft/callback', grant_type: 'authorization_code' });
  if (!t.refresh_token) { console.error('ms oauth', t.error); return res.redirect('/app#/settings?mail=error'); }
  const me = await (await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: 'Bearer ' + t.access_token } })).json();
  u.mail = { type: 'outlook', address: me.mail || me.userPrincipalName, fromName: u.profile.name, verified: new Date().toISOString(), secret: enc({ refresh: t.refresh_token }) };
  save(); res.redirect('/app#/settings?mail=ok');
});
app.get('/api/mail/google/callback', async (req, res) => {
  const st = unsign(req.query.state || ''); const u = st && db.users.find(x => x.id == st.split(':')[0]);
  if (!u || !req.query.code || Date.now() - +st.split(':')[1] > 15 * 60e3) return res.redirect('/app#/settings?mail=error');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ code: req.query.code, client_id: G_ID, client_secret: G_SECRET, redirect_uri: BASE_URL + '/api/mail/google/callback', grant_type: 'authorization_code' }) });
  const t = await r.json(); if (t.error) console.error('google oauth', t.error); if (!t.refresh_token) return res.redirect('/app#/settings?mail=error');
  const info = JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url'));
  u.mail = { type: 'gmail', address: info.email, fromName: u.profile.name, verified: new Date().toISOString(), secret: enc({ refresh: t.refresh_token }) };
  save(); res.redirect('/app#/settings?mail=ok');
});

const cvName = u => `${(u.profile.name || 'CV').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_')}_CV${path.extname(u.cv.file)}`;
const escH = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const toHtml = body => '<div style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.7">' + body.split(/\n{2,}/).map(p => p.trim() === '———' ? '<hr>' : `<p dir="auto" style="unicode-bidi:plaintext;text-align:start;margin:0 0 12px">${escH(p).replace(/\n/g, '<br>')}</p>`).join('') + '</div>';
async function deliver(u, msg) {
  if (!u.mail) throw new Error('no-mail');
  const s = dec(u.mail.secret); const from = { name: u.mail.fromName || u.profile.name, address: u.mail.address };
  if (u.mail.type === 'smtp') return useRelay(s) ? relaySend(s, { fromName: from.name, ...msg }) : nodemailer.createTransport(s).sendMail({ from, ...msg });
  if (u.mail.type === 'outlook') {
    const t = await msToken({ refresh_token: s.refresh, grant_type: 'refresh_token' }); if (!t.access_token) throw new Error('outlook auth ' + (t.error || ''));
    if (t.refresh_token) { u.mail.secret = enc({ refresh: t.refresh_token }); save(); }
    const atts = []; for (const a of msg.attachments || []) atts.push({ '@odata.type': '#microsoft.graph.fileAttachment', name: a.filename, contentBytes: (await fs.promises.readFile(a.path)).toString('base64') });
    const body = { message: { subject: msg.subject, body: msg.html ? { contentType: 'HTML', content: msg.html } : { contentType: 'Text', content: msg.text }, toRecipients: [{ emailAddress: { address: msg.to } }], attachments: atts }, saveToSentItems: true };
    const r = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', { method: 'POST', headers: { Authorization: 'Bearer ' + t.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('outlook ' + r.status); return;
  }
  const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: G_ID, client_secret: G_SECRET, refresh_token: s.refresh, grant_type: 'refresh_token' }) })).json();
  if (!tok.access_token) throw new Error('gmail auth ' + (tok.error || ''));
  const raw = (await new MailComposer({ from, ...msg }).compile().build()).toString('base64url');
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { Authorization: 'Bearer ' + tok.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw }) });
  if (!r.ok) throw new Error('gmail ' + r.status);
}
app.post('/api/mail/test', auth, async (req, res) => {
  try { await deliver(req.u, { to: req.u.mail?.address, subject: 'Wasel test ✓ اختبار', text: 'تم ربط بريدك بنجاح. Your mailbox is connected.' }); res.json({ ok: 1 }); }
  catch (e) { res.status(400).json({ error: 'send', detail: String(e.message).slice(0, 120) }); }
});

// ---------- jobs & matching ----------
const norm = s => (s || '').toLowerCase();
function score(u, j) {
  const p = u.profile, words = [...u.prefs.titles, p.title].join(' ').toLowerCase().split(/[\s/–-]+/).filter(w => w.length > 2);
  const hay = norm(j.title + ' ' + j.title_ar + ' ' + j.skills.join(' '));
  let s = 0; words.forEach(w => { if (hay.includes(w)) s += 18; });
  (p.skills || []).forEach(k => { if (j.skills.some(x => norm(x).includes(norm(k)) || norm(k).includes(norm(x)))) s += 10; });
  const cities = u.prefs.cities.length ? u.prefs.cities : [p.city];
  if (cities.some(c => c && norm(j.city).includes(norm(c)))) s += 15; else if (/saudi|eastern/i.test(j.city)) s += 8;
  if (j.kind === 'open') s += 3;
  if (u.profile.gender === 'f' && j.gender === 'women_only') s += 8; if (u.profile.gender === 'f' && j.gender === 'women_preferred') s += 5; if (u.profile.gender === 'm' && j.gender === 'men_only') s += 8;
  return Math.min(100, s);
}
const applied = u => new Set(db.apps.filter(a => a.uid === u.id && a.status !== 'draft').map(a => a.to.toLowerCase()));
const audienceFor = g => g === 'f' ? ['women_only', 'women_preferred', 'open'] : g === 'm' ? ['men_only', 'open'] : null;
const genderOk = (u, j) => { const a = audienceFor(u.profile.gender); if (!a) return true; return a.includes(j.gender || 'open'); };
app.get('/api/jobs', auth, (req, res) => {
  const done = applied(req.u);
  res.json(db.jobs.filter(j => !j.hidden && genderOk(req.u, j)).map(j => ({ ...j, score: score(req.u, j), applied: done.has(j.email.toLowerCase()) })).sort((a, b) => b.score - a.score));
});
app.post('/api/admin/jobs', (req, res) => {
  if (!ADMIN_TOKEN || req.get('x-admin-token') !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden' });
  const j = req.body; if (!j.company || !j.title || !/@/.test(j.email || '') || !/^https?:/.test(j.source || '')) return res.status(400).json({ error: 'company,title,email,source required' });
  const job = { id: db.seq++, company: j.company, title: j.title, title_ar: j.title_ar || j.title, city: j.city || 'Saudi Arabia', email: j.email, source: j.source,
    skills: j.skills || [], subject_format: j.subject_format || null, posted: j.posted || new Date().toISOString().slice(0, 10), kind: j.kind || 'vacancy',
    gender: ['women_only', 'men_only', 'women_preferred', 'open'].includes(j.gender) ? j.gender : 'open', type: j.type || 'إداري', type_en: j.type_en || j.type || 'Admin', added: new Date().toISOString() };
  db.jobs.push(job); save(); res.json(job);
});

// ---------- cover email generation ----------
function compose(u, j) {
  const p = u.profile, name = p.name || u.email.split('@')[0], lang = u.prefs.lang;
  const sub = j.subject_format ? j.subject_format.replace('{title}', j.title).replace('{name}', name)
    : `${j.kind === 'open' ? (p.title || j.title) : j.title} – ${name}${p.city ? ' – ' + p.city : ''}`;
  const sk = (p.skills || []).slice(0, 5).join('، '), skEn = (p.skills || []).slice(0, 5).join(', ');
  const yrs = p.years ? `${p.years} سنوات خبرة` : 'خبرة عملية', yrsEn = p.years ? `${p.years} years of experience` : 'hands-on experience';
  const CITY_AR = { Riyadh: 'الرياض', Jeddah: 'جدة', Dammam: 'الدمام', Khobar: 'الخبر', Makkah: 'مكة', Madinah: 'المدينة المنورة', Jubail: 'الجبيل', 'Al Ahsa': 'الأحساء', Taif: 'الطائف', Abha: 'أبها', Tabuk: 'تبوك', Qassim: 'القصيم', 'Saudi Arabia': 'المملكة', 'Eastern Province': 'المنطقة الشرقية' };
  const hasAr = s => /[\u0600-\u06FF]/.test(s || '');
  const cityAr = CITY_AR[j.city] || j.city, jobEn = j.title.replace(/\s*\([^)]*\)/g, '').trim(), titleEn = hasAr(p.title) ? '' : p.title, titleAr = hasAr(p.title) ? p.title : '';
  const iso = x => '\u2068' + x + '\u2069'; const ph = p.phone ? iso(p.phone) : '';
  const nat = p.nationality ? ` (${p.nationality})` : '';
  const ar = `السلام عليكم ورحمة الله،\n\nأتقدم لكم بطلب ${j.kind === 'open' ? 'الانضمام إلى فريق ' + j.company : 'وظيفة «' + j.title_ar + '»'}${j.city ? ' في ' + cityAr : ''}. لدي ${yrs}${titleAr ? ' بصفتي ' + titleAr : (p.title ? ' في مجال ' + p.title : '')}${sk ? '، ومن أبرز مهاراتي: ' + sk : ''}.\n\nمرفق سيرتي الذاتية، ويسعدني التواصل معكم في أي وقت${ph ? ' على الرقم ' + ph : ''}.\n\nمع خالص التحية،\n${name}${nat}`;
  const en = `Dear Hiring Team,\n\nI would like to apply for ${j.kind === 'open' ? 'a suitable role at ' + j.company : 'the ' + jobEn + ' position'}${j.city ? ' in ' + j.city : ''}. I bring ${yrsEn}${titleEn ? (/^[aeiou]/i.test(titleEn) ? ' as an ' : ' as a ') + titleEn : ''}${skEn ? ', with strengths in ' + skEn : ''}.\n\nPlease find my CV attached. I am available for an interview at your convenience${ph ? ' on ' + ph : ''}.\n\nBest regards,\n${iso(name)}`;
  return { subject: sub, body: lang === 'ar' ? ar : lang === 'en' ? en.replace(/\n[^\n]*$/, '\n' + iso(name)) : ar + '\n\n———\n\n' + en };
}
const sentToday = u => { const d = new Date().toISOString().slice(0, 10); return db.apps.filter(a => a.uid === u.id && ['sent', 'dry-run'].includes(a.status) && (a.sentAt || '').startsWith(d)).length; };

app.get('/api/apps', auth, (req, res) => res.json(db.apps.filter(a => a.uid === req.u.id).map(a => ({ ...a, job: db.jobs.find(j => j.id === a.jobId) })).reverse()));
app.post('/api/apps/draft', auth, (req, res) => {
  const done = applied(req.u), out = [];
  db.apps.filter(a => a.uid === req.u.id && a.status === 'draft').forEach(a => done.add(a.to.toLowerCase()));
  for (const id of req.body.jobIds || []) {
    const j = db.jobs.find(x => x.id == id); if (!j || done.has(j.email.toLowerCase())) continue;
    const a = { id: db.seq++, uid: req.u.id, jobId: j.id, to: j.email, ...compose(req.u, j), status: 'draft', created: new Date().toISOString() };
    db.apps.push(a); out.push(a); done.add(j.email.toLowerCase());
  }
  save(); res.json(out);
});
app.put('/api/apps/:id', auth, (req, res) => {
  const a = db.apps.find(x => x.id == req.params.id && x.uid === req.u.id && x.status === 'draft'); if (!a) return res.status(404).end();
  if (req.body.subject) a.subject = String(req.body.subject).slice(0, 200); if (req.body.body) a.body = String(req.body.body).slice(0, 5000);
  save(); res.json(a);
});
app.delete('/api/apps/:id', auth, (req, res) => { db.apps = db.apps.filter(x => !(x.id == req.params.id && x.uid === req.u.id && x.status === 'draft')); save(); res.json({ ok: 1 }); });

async function sendApps(u, ids, opt = {}) {
  const results = []; const done = applied(u);
  for (const id of ids) {
    const a = db.apps.find(x => x.id == id && x.uid === u.id && x.status === 'draft'); if (!a) continue;
    if (done.has(a.to.toLowerCase())) { a.status = 'skipped-duplicate'; results.push(a); continue; }
    if (sentToday(u) >= Math.min(50, +u.prefs.dailyCap || 20)) { results.push({ ...a, status: 'cap-reached' }); break; }
    if (!u.cv) { results.push({ ...a, status: 'no-cv' }); break; }
    const dry = GLOBAL_DRY || u.prefs.dryRun;
    try {
      if (!dry) await deliver(u, { to: a.to, subject: a.subject, text: a.body, html: toHtml(a.body), attachments: [{ filename: cvName(u), path: u.cv.file }] });
      a.status = dry ? 'dry-run' : 'sent'; a.sentAt = new Date().toISOString(); if (!dry) done.add(a.to.toLowerCase());
    } catch (e) { a.status = 'failed'; a.error = String(e.message).slice(0, 120); }
    results.push(a); save();
    if (!opt.noDelay) await new Promise(r => setTimeout(r, dry ? 50 : 4000 + Math.random() * 4000));
  }
  return results;
}
app.post('/api/apps/send', auth, async (req, res) => { if (!req.u.mail && !(GLOBAL_DRY || req.u.prefs.dryRun)) return res.status(400).json({ error: 'nomail' }); res.json(await sendApps(req.u, req.body.ids || [])); });


// ---------- bulk apply: server-side queue ----------
const BATCH_MAX = 25, DAY_MAX = 50;
const dayLimit = u => Math.min(DAY_MAX, Math.max(1, +u.prefs.dailyCap || 20));
const batchView = b => ({ ...b, items: b.items.map(i => { const j = db.jobs.find(x => x.id === i.jobId) || {}; return { ...i, company: j.company, title: j.title, title_ar: j.title_ar, city: j.city }; }) });
app.post('/api/batch', auth, (req, res) => {
  const u = req.u; db.batches = db.batches || [];
  if (db.batches.some(b => b.uid === u.id && b.state === 'running')) return res.status(409).json({ error: 'running' });
  const dry = !!(GLOBAL_DRY || u.prefs.dryRun);
  if (!u.mail && !dry) return res.status(400).json({ error: 'nomail' });
  if (!u.cv) return res.status(400).json({ error: 'nocv' });
  const room = dayLimit(u) - sentToday(u); if (room <= 0) return res.status(400).json({ error: 'cap', limit: dayLimit(u) });
  const done = applied(u); const ids = [...new Set((req.body.jobIds || []).map(Number))];
  if (ids.length > BATCH_MAX) return res.status(400).json({ error: 'batchmax', max: BATCH_MAX });
  const items = []; let skipped = 0;
  for (const id of ids) {
    const j = db.jobs.find(x => x.id === id); if (!j || !genderOk(u, j)) continue;
    if (done.has(j.email.toLowerCase())) { skipped++; continue; }
    if (items.length >= room) break;
    db.apps = db.apps.filter(a => !(a.uid === u.id && a.status === 'draft' && a.jobId === j.id));
    const a = { id: db.seq++, uid: u.id, jobId: j.id, to: j.email, ...compose(u, j), status: 'draft', created: new Date().toISOString(), bulk: true };
    db.apps.push(a); done.add(j.email.toLowerCase()); items.push({ appId: a.id, jobId: j.id, status: 'queued' });
  }
  if (!items.length) return res.status(400).json({ error: 'nothing', skipped });
  const b = { id: db.seq++, uid: u.id, created: new Date().toISOString(), state: 'running', dry, skipped, nextAt: Date.now(), items };
  db.batches.push(b); save(); res.json(batchView(b));
});
app.get('/api/batch/current', auth, (req, res) => { const b = (db.batches || []).filter(b => b.uid === req.u.id).pop(); res.json(b ? batchView(b) : null); });
app.post('/api/batch/:id/cancel', auth, (req, res) => {
  const b = (db.batches || []).find(b => b.id == req.params.id && b.uid === req.u.id); if (!b) return res.status(404).end();
  b.items.filter(i => i.status === 'queued').forEach(i => { i.status = 'cancelled'; db.apps = db.apps.filter(a => a.id !== i.appId); });
  b.state = 'cancelled'; save(); res.json(batchView(b));
});
let batchBusy = false;
async function batchTick() {
  if (batchBusy) return; batchBusy = true;
  try {
    for (const b of (db.batches || []).filter(b => b.state === 'running' && b.nextAt <= Date.now())) {
      const u = db.users.find(x => x.id === b.uid); const it = b.items.find(i => i.status === 'sending') || b.items.find(i => i.status === 'queued');
      if (!u || !it) { b.state = 'done'; save(); continue; }
      it.status = 'sending'; save();
      const dry = !!(GLOBAL_DRY || u.prefs.dryRun);
      if (sentToday(u) >= dayLimit(u)) { b.items.filter(i => ['queued', 'sending'].includes(i.status)).forEach(i => i.status = 'cap-reached'); b.state = 'done'; save(); continue; }
      const [r] = await sendApps(u, [it.appId], { noDelay: true });
      it.status = r ? r.status : 'failed'; if (r && r.error) it.error = r.error; it.at = new Date().toISOString();
      b.nextAt = Date.now() + (dry ? 1500 + Math.random() * 1500 : 20000 + Math.random() * 20000);
      if (!b.items.some(i => i.status === 'queued')) b.state = 'done';
      save();
    }
  } catch (e) { console.warn('[batch]', e.message); } finally { batchBusy = false; }
}
setInterval(batchTick, 1000);

// auto mode: hourly, matches >= 40, respecting daily cap
async function runAuto() {
  const out = [];
  for (const u of db.users.filter(u => u.prefs.mode === 'auto' && u.cv && (u.mail || u.prefs.dryRun || GLOBAL_DRY))) {
    const done = applied(u); const room = u.prefs.dailyCap - sentToday(u); if (room <= 0) continue;
    const jobs = db.jobs.filter(j => genderOk(u, j) && !done.has(j.email.toLowerCase()) && score(u, j) >= 40).slice(0, room);
    const ids = jobs.map(j => { const a = { id: db.seq++, uid: u.id, jobId: j.id, to: j.email, ...compose(u, j), status: 'draft', created: new Date().toISOString(), auto: true }; db.apps.push(a); return a.id; });
    if (ids.length) out.push(...(await sendApps(u, ids)).map(a => ({ uid: u.id, to: a.to, status: a.status })));
  }
  return out;
}
setInterval(runAuto, 60 * 60 * 1000);
app.post('/api/admin/run-auto', async (req, res) => { if (!isAdmin(req)) return res.status(403).end(); res.json(await runAuto()); });

const isAdmin = req => ADMIN_TOKEN && req.get('x-admin-token') === ADMIN_TOKEN;
app.delete('/api/admin/jobs/:id', (req, res) => { if (!isAdmin(req)) return res.status(403).end(); const n = db.jobs.length; db.jobs = db.jobs.filter(j => j.id != req.params.id); db.apps = db.apps.filter(a => a.jobId != req.params.id); save(); res.json({ removed: n - db.jobs.length }); });
app.delete('/api/admin/users', (req, res) => { if (!isAdmin(req)) return res.status(403).end(); const pat = String(req.query.match || ''); if (pat.length < 4) return res.status(400).end();
  const gone = db.users.filter(u => u.email.includes(pat)); for (const u of gone) { try { u.cv && fs.unlinkSync(u.cv.file) } catch {} delFile(u.id); }
  const ids = new Set(gone.map(u => u.id)); db.users = db.users.filter(u => !ids.has(u.id)); db.apps = db.apps.filter(a => !ids.has(a.uid)); save(); res.json({ removed: gone.length }); });
app.get('/api/admin/stats', (req, res) => { if (!isAdmin(req)) return res.status(403).end(); res.json({ users: db.users.length, jobs: db.jobs.length, apps: db.apps.length, storage: PG ? 'postgres' : 'file' }); });
app.delete('/api/account', auth, (req, res) => {
  if (req.u.cv) try { fs.unlinkSync(req.u.cv.file); } catch {} delFile(req.u.id);
  db.apps = db.apps.filter(a => a.uid !== req.u.id); db.users = db.users.filter(u => u.id !== req.u.id); save(); res.clearCookie('s'); res.json({ ok: 1 });
});
// ---------- job ingestion (public Telegram previews + RSS), every ~2.5h ----------
const { runIngest } = require('./ingest');
let ingesting = null; const INGEST_EVERY = 150 * 60e3;
const ingestNow = () => ingesting || (ingesting = runIngest(db, save).catch(e => ({ error: e.message })).finally(() => { ingesting = null; }));
const ingestIfStale = () => { const l = Date.parse(db.meta?.lastIngest || 0) || 0; if (Date.now() - l > INGEST_EVERY - 60e3) ingestNow(); };
app.post('/api/admin/ingest', async (req, res) => { if (!isAdmin(req)) return res.status(403).end(); if (req.query.async) { ingestNow(); return res.json({ started: true }); } res.json(await ingestNow()); });
app.get('/api/admin/ingest', (req, res) => { if (!isAdmin(req)) return res.status(403).end(); res.json({ running: !!ingesting, ...(db.meta?.lastReport || {}) }); });
app.get('/api/jobs/meta', (req, res) => res.json({ lastUpdated: db.meta?.lastIngest || null, total: db.jobs.filter(j => !j.hidden).length, running: !!ingesting }));
app.get('/api/wake', (req, res) => { ingestIfStale(); res.json({ ok: 1, lastUpdated: db.meta?.lastIngest || null }); });
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.get('/healthz', (req, res) => res.send('ok'));
app.use((err, req, res, next) => { if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'too_large' }); console.error('err', err && err.message); res.status(500).json({ error: 'server' }); });
boot().then(() => { app.listen(PORT, () => console.log('Wasel on ' + PORT, PG ? '(postgres)' : '(file)')); setTimeout(ingestIfStale, 45e3); setInterval(ingestIfStale, 10 * 60e3); });
