const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformSync } = require('esbuild');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
function fixture() {
 const rows=[]; const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
 const location={pathname:'/',origin:'https://portfolio.example',href:'https://portfolio.example/'};
 const code=transformSync(readFileSync('src/utils/visitorTracking.ts','utf8'),{loader:'ts',format:'cjs',define:{'import.meta.env.DEV':'false','import.meta.env.VITE_VISITOR_GEO_URL':'""','import.meta.env.VITE_TRACK_VISITORS_IN_DEV':'"false"'}}).code;
 const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require:()=>({__esModule:true,default:{from:()=>({insert:async row=>{rows.push(row);return {error:null}}})}}),crypto:webcrypto,localStorage:memory(),sessionStorage:memory(),location,navigator:{userAgent:'Chrome/120 Windows',language:'en-IN'},window:{innerWidth:1200,innerHeight:800},document:{referrer:'https://linkedin.com/feed?secret=1',visibilityState:'visible'},performance,URL,URLSearchParams,console,AbortSignal});
 return {api:m.exports,rows,location};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('public route records metadata once under repeated mounts',async()=>{
 const f=fixture();f.api.setVisitorRoute('/','?utm_source=linkedin&token=secret',false);f.api.setVisitorRoute('/','',false);await tick();
 assert.equal(f.rows.length,1);assert.equal(f.rows[0].utm_source,'linkedin');assert.equal(f.rows[0].referrer_host,'linkedin.com');assert(!JSON.stringify(f.rows).includes('secret'));assert.equal(f.rows[0].country,null);
 f.location.pathname='/projects';f.api.setVisitorRoute('/projects','',false);await tick();assert.equal(f.rows[1].visitor_id,f.rows[0].visitor_id);assert.equal(f.rows[1].session_id,f.rows[0].session_id);assert.notEqual(f.rows[1].page_view_id,f.rows[0].page_view_id);
});
test('dashboard routes and authenticated visitors never insert',async()=>{
 for(const path of ['/dashboard','/dashboard/queries','/dashboard/auth','/DASHBOARD/media']) {const f=fixture();f.location.pathname=path;f.api.setVisitorRoute(path,'',false);await tick();assert.equal(f.rows.length,0);}
 const f=fixture();f.api.setVisitorRoute('/','',true);await tick();assert.equal(f.rows.length,0);
});
test('pending public events are discarded on dashboard navigation',async()=>{
 const f=fixture();f.api.setVisitorRoute('/','',false);f.location.pathname='/dashboard';f.api.setVisitorRoute('/dashboard','',false);await tick();assert.equal(f.rows.length,0);
});

test('only page views are recorded without a resume link click',async()=>{
 const f=fixture();f.api.setVisitorRoute('/','',false);await tick();
 assert(f.rows.every(row=>row.action==='page_view'));
 assert(f.rows.every(row=>!Object.hasOwn(row,'duration_seconds')));
 assert.equal(f.api.trackVisitorEvent,undefined);
});


test('repeated visits to the same public page do not add rows',async()=>{
 const f=fixture();
 for(const path of ['/','/projects','/','/projects','/']){
  f.location.pathname=path;f.api.setVisitorRoute(path,'',false);await tick();
 }
 assert.equal(f.rows.length,2);
 assert(f.rows.every(row=>row.action==='page_view'));
});
