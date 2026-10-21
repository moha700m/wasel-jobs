import { connect } from 'cloudflare:sockets';
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = s => { const b = enc.encode(s); let r = ''; for (let i = 0; i < b.length; i += 0x8000) r += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(r); };
const wrap = s => s.replace(/.{1,76}/g, '$&\r\n');
const hw = s => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`;
async function sha(s) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map(x => x.toString(16).padStart(2, '0')).join(''); }
function buildMime(m) {
  const B = 'wsl' + crypto.randomUUID().replace(/-/g, ''), A = 'alt' + crypto.randomUUID().replace(/-/g, '');
  const from = m.fromName ? `${hw(m.fromName)} <${m.user}>` : m.user;
  const h = [`From: ${from}`, `To: ${m.to}`, `Subject: ${hw(m.subject || '')}`, `Date: ${new Date().toUTCString()}`, `Message-ID: <${crypto.randomUUID()}@wasel>`, 'MIME-Version: 1.0'];
  if (m.replyTo) h.push(`Reply-To: ${m.replyTo}`);
  const parts = [];
  if (m.text) parts.push(`Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(b64(m.text))}`);
  if (m.html) parts.push(`Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(b64(m.html))}`);
  const body = `Content-Type: multipart/alternative; boundary="${A}"\r\n\r\n` + parts.map(p => `--${A}\r\n${p}\r\n`).join('') + `--${A}--\r\n`;
  const atts = [].concat(m.attachments || m.attachment || []).filter(a => a && a.base64);
  if (!atts.length) return h.join('\r\n') + '\r\n' + body;
  let out = h.join('\r\n') + `\r\nContent-Type: multipart/mixed; boundary="${B}"\r\n\r\n--${B}\r\n${body}\r\n`;
  for (const a of atts) { const fn = hw(a.filename || 'file'); out += `--${B}\r\nContent-Type: ${a.contentType || 'application/octet-stream'}; name="${fn}"\r\nContent-Disposition: attachment; filename="${fn}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(a.base64.replace(/\s+/g, ''))}\r\n`; }
  return out + `--${B}--\r\n`;
}
class Smtp {
  constructor(sock) { this.s = sock; this.r = sock.readable.getReader(); this.w = sock.writable.getWriter(); this.buf = ''; }
  async read() { // returns {code, text} for full (possibly multiline) reply
    for (;;) {
      const lines = this.buf.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) if (/^\d{3} /.test(lines[i])) { const txt = lines.slice(0, i + 1).join('\n'); this.buf = lines.slice(i + 1).join('\r\n'); return { code: +lines[i].slice(0, 3), text: txt }; }
      const { value, done } = await this.r.read(); if (done) throw Object.assign(new Error('connection closed'), { kind: 'conn' });
      this.buf += dec.decode(value, { stream: true });
    }
  }
  async cmd(c, ok, kind) { if (c != null) await this.w.write(enc.encode(c + '\r\n')); const r = await this.read(); if (!ok.includes(r.code)) throw Object.assign(new Error(r.text), { code: r.code, kind }); return r; }
}
async function send(m) {
  const sock = connect({ hostname: m.host || 'smtp.gmail.com', port: m.port || 465 }, { secureTransport: 'on', allowHalfOpen: false });
  const c = new Smtp(sock);
  try {
    await c.cmd(null, [220], 'conn');
    await c.cmd('EHLO wasel-mailer', [250], 'conn');
    await c.cmd('AUTH PLAIN ' + b64('\0' + m.user + '\0' + m.appPassword), [235], 'auth');
    await c.cmd(`MAIL FROM:<${m.user}>`, [250], 'sender');
    for (const r of [].concat(m.to)) await c.cmd(`RCPT TO:<${r}>`, [250, 251], 'recipient');
    await c.cmd('DATA', [354], 'data');
    const raw = (m.raw ? dec.decode(Uint8Array.from(atob(m.raw), ch => ch.charCodeAt(0))) : buildMime(m)).replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
    const r = await c.cmd(raw + (raw.endsWith('\r\n') ? '' : '\r\n') + '.', [250], 'data');
    try { await c.cmd('QUIT', [221], 'quit'); } catch {}
    return r.text;
  } finally { try { await sock.close(); } catch {} }
}
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/' || u.pathname === '/health') return J({ ok: true, service: 'wasel-mailer' });
    if (u.pathname !== '/send' || req.method !== 'POST') return J({ ok: false, error: 'not_found' }, 404);
    const sec = req.headers.get('x-relay-secret') || '';
    if (!sec || !env.RELAY_SECRET_SHA256 || (await sha(sec)) !== env.RELAY_SECRET_SHA256) return J({ ok: false, error: 'unauthorized' }, 401);
    let m; try { m = await req.json(); } catch { return J({ ok: false, error: 'bad_json' }, 400); }
    m.appPassword = String(m.appPassword || '').replace(/\s+/g, ''); m.user = String(m.user || '').trim();
    if (!m.user || !m.appPassword || !m.to) return J({ ok: false, error: 'missing_fields' }, 400);
    try { const info = await send(m); return J({ ok: true, info: info.slice(0, 200) }); }
    catch (e) {
      const t = String(e.message || ''), safe = t.split(m.appPassword).join('***').slice(0, 300);
      let error = 'smtp_error';
      if (e.kind === 'auth') error = /534|Application-specific/i.test(t) || e.code === 534 ? 'need_app_password' : 'auth_failed';
      else if (e.kind === 'conn' || !e.code) error = 'connection_failed';
      else if (e.kind === 'recipient') error = 'bad_recipient';
      return J({ ok: false, error, smtpCode: e.code || null, detail: safe }, 400);
    }
  }
};
