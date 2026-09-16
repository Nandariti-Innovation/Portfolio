const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformSync } = require('esbuild');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const code = transformSync(fs.readFileSync('supabase/functions/portfolio-contact/handler.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code;
const m = { exports: {} };
vm.runInNewContext(code, { module: m, exports: m.exports, URL, Response, Request, AbortSignal, TextEncoder, console: {error() {}}, crypto: webcrypto });
const { createContactHandler } = m.exports;
const body = { requestId: '6f4d6fde-63fc-4b85-a9c6-b3f261a63328', name: 'Test Visitor', email: 'visitor@example.com', company: 'Example', type: 'hiring', message: 'A frontend role enquiry.' };
const config = { CONTACT_ALLOWED_ORIGINS: 'https://portfolio.example', RESEND_API_KEY: 'test-key', RESEND_FROM_EMAIL: 'sender@example.com', CONTACT_TO_EMAIL: 'owner@example.com', SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'private-db-key' };
function fixture({ code = 'ready', failMail = false, failDB = false, env = config } = {}) {
  let sent = 0, mail, saved = false;
  const calls = [];
  const handler = createContactHandler(key => env[key], async (url, options) => {
    calls.push(url);
    if (url.includes('/rpc/')) return new Response(JSON.stringify({ code, created_at: new Date().toISOString(), resend_id: saved ? 'mail-1' : null }), { status: failDB ? 500 : 200 });
    if (url === 'https://api.resend.com/emails') {
      sent++; mail = JSON.parse(options.body);
      assert.equal(options.headers['Idempotency-Key'], `portfolio-contact-${body.requestId}`);
      return new Response(JSON.stringify(failMail ? {message:'private error'} : {id:'mail-1'}), {status:failMail?500:200});
    }
    saved = true; return new Response(null, {status:204});
  });
  return { calls, get sent(){return sent}, get mail(){return mail}, run: (data=body, origin='https://portfolio.example', method='POST') => handler(new Request('https://edge.example', {method, headers:{Origin:origin,'Content-Type':'application/json'}, ...(method==='POST'?{body:JSON.stringify(data)}:{})})) };
}
test('sends fixed recipient and visitor Reply-To; successful retry does not send twice', async()=>{
  const f=fixture(); assert.equal((await f.run()).status,200); assert.equal((await f.run()).status,200); assert.equal(f.sent,1);
  assert.deepEqual(f.mail.to,['owner@example.com']); assert.equal(f.mail.reply_to,body.email);
});
test('CORS preflight works and unknown origins cannot write',async()=>{
  const f=fixture(); const r=await f.run(body, 'https://portfolio.example','OPTIONS'); assert.equal(r.status,204); assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://portfolio.example');
  assert.equal((await f.run(body,'https://wrong.example')).status,403); assert.equal(f.calls.length,0);
});
test('validates fields before any external calls',async()=>{
  const f=fixture(); for(const patch of [{email:'bad'},{type:'wrong'},{message:'short'},{website:'spam'},{requestId:'wrong'},{name:'a\nb'}]) assert.equal((await f.run({...body,...patch})).status,400); assert.equal(f.calls.length,0);
});
test('rate limits, conflicts, database failures, and missing secrets do not send',async()=>{
  for(const [options,status] of [[{code:'limited'},429],[{code:'conflict'},409],[{failDB:true},503],[{env:{}},403]]) {const f=fixture(options); assert.equal((await f.run()).status,status); assert.equal(f.sent,0);}
});
test('provider errors never return secrets or private details',async()=>{
  const f=fixture({failMail:true}); const r=await f.run(); assert.equal(r.status,202); const text=await r.text(); assert(JSON.parse(text).saved); assert(!text.includes('private error')); assert(!text.includes('test-key'));
});

test('missing mail secrets still saves to database',async()=>{
  const f=fixture({env:{...config,RESEND_API_KEY:''}}); const r=await f.run();
  assert.equal(r.status,202); assert.equal((await r.json()).saved,true); assert.equal(f.sent,0); assert(f.calls[0].includes('/rpc/'));
});
test('known Codespace works without custom origin configuration',async()=>{
  const f=fixture({env:{...config,CONTACT_ALLOWED_ORIGINS:''}});
  assert.equal((await f.run(body,'https://stunning-spoon-j6rrxp4jjvfqj75-5173.app.github.dev')).status,200);
});
test('configured origins tolerate trailing slash',async()=>{
  const f=fixture({env:{...config,CONTACT_ALLOWED_ORIGINS:' https://portfolio.example/ '}});
  assert.equal((await f.run()).status,200);
});
