type Environment = (key: string) => string | undefined;
const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const savedMessage = 'Your enquiry has been saved. The email notification could not be confirmed, but your message has been received.';
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://deepanshugulia.in', 'https://www.deepanshugulia.in', 'https://stunning-spoon-j6rrxp4jjvfqj75-5173.app.github.dev'];
const normalizeOrigin = (value: string) => { try { return new URL(value.trim()).origin; } catch { return ''; } };

export function createContactHandler(env: Environment, send: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('Origin') || '';
    const allowed = [...defaultOrigins, ...(env('CONTACT_ALLOWED_ORIGINS') || '').split(',').map(normalizeOrigin)].filter(Boolean);
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : '',
      'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
    const reply = (status: number, message: string, saved = false, emailSent = false) => new Response(JSON.stringify({ message, saved, emailSent }), { status, headers });
    if (!origin || !allowed.includes(origin)) return reply(403, 'This website is not allowed to submit enquiries.');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, 'Use POST to submit an enquiry.');
    const key = env('RESEND_API_KEY'), from = env('RESEND_FROM_EMAIL'), to = env('CONTACT_TO_EMAIL');
    const dbURL = env('SUPABASE_URL'), dbKey = env('SUPABASE_SERVICE_ROLE_KEY');
    if (!dbURL || !dbKey) return reply(503, 'Enquiry storage is not configured. Please try again later.');
    let stored = false;
    let stage = 'validation';
    try {
      if (!request.headers.get('Content-Type')?.includes('application/json')) return reply(415, 'Send a JSON form submission.');
      if (Number(request.headers.get('Content-Length')) > 24000) return reply(413, 'Your message is too large.');
      const raw = await request.text();
      if (raw.length > 24000) return reply(413, 'Your message is too large.');
      let input;
      try { input = JSON.parse(raw); } catch { return reply(400, 'Invalid form submission.'); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, 'Invalid form submission.');
      const name = clean(input.name), email = clean(input.email), company = clean(input.company);
      const message = clean(input.message), type = clean(input.type), id = clean(input.requestId);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
        || !['hiring', 'freelancing', 'other'].includes(type) || name.length < 2 || name.length > 100
        || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || company.length > 160
        || message.length < 10 || message.length > 5000 || /[\r\n]/.test(name + company) || clean(input.website)) {
        return reply(400, 'Please check your name, email, enquiry type, and message (10–5000 characters).');
      }
      const payload = { name, email, company, message, type };
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
      const hash = Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, '0')).join('');
      const dbHeaders = { apikey: dbKey, Authorization: `Bearer ${dbKey}`, 'Content-Type': 'application/json' };
      stage = 'database_insert';
      const savedResponse = await send(`${dbURL}/rest/v1/rpc/register_portfolio_contact`, {
        method: 'POST', headers: dbHeaders, signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ p_id: id, p_payload: payload, p_hash: hash }),
      });
      if (!savedResponse.ok) {
        console.error('portfolio-contact failed', { stage, status: savedResponse.status });
        throw new Error('Save failed');
      }
      const saved = await savedResponse.json();
      if (saved.code === 'limited') return reply(429, 'The form has received too many enquiries. Please try again in 15 minutes.');
      if (saved.code === 'conflict') return reply(409, 'Please reopen the form to start a new enquiry.');
      if (saved.code !== 'ready') throw new Error('Invalid reservation');
      stored = true;
      if (saved.resend_id) return reply(200, 'Your enquiry has been sent. Thank you for getting in touch!', true, true);
      if (!key || !from || !to) {
        console.error('portfolio-contact email configuration missing');
        return reply(202, savedMessage, true);
      }
      if (Date.now() - new Date(saved.created_at).getTime() > 23 * 60 * 60 * 1000) return reply(202, savedMessage, true);
      stage = 'email_send';
      const mailResponse = await send('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `portfolio-contact-${id}` },
        body: JSON.stringify({ from, to: [to], reply_to: email, subject: `Portfolio enquiry: ${type}`,
          text: `Type: ${type}\nName: ${name}\nEmail: ${email}\nCompany: ${company || 'Not provided'}\n\n${message}` }),
      });
      const mail = await mailResponse.json();
      if (!mailResponse.ok || !mail.id) {
        console.error('portfolio-contact failed', { stage, status: mailResponse.status });
        throw new Error('Email failed');
      }
      stage = 'email_status_update';
      const updated = await send(`${dbURL}/rest/v1/portfolio_contact_requests?id=eq.${id}`, {
        method: 'PATCH', headers: dbHeaders, signal: AbortSignal.timeout(10000), body: JSON.stringify({ resend_id: mail.id }),
      });
      if (!updated.ok) throw new Error('Delivery status update failed');
      return reply(200, 'Your enquiry has been sent. Thank you for getting in touch!', true, true);
    } catch {
      console.error('portfolio-contact request failed', { stage, saved: stored });
      return stored ? reply(202, savedMessage, true)
        : reply(503, 'Your enquiry could not be saved. Please retry. If this continues, contact me directly.');
    }
  };
}
