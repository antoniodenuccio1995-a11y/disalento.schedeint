// End-to-end test of sharing with an in-memory imitation of the Supabase functions:
// desktop editor creates the link and edits; a phone opens the investor link and must see the same edits.
const {chromium}=require('playwright');const {open}=require('./harness');const path=require('path');
const file=process.argv[2],out=process.argv[3];require('fs').mkdirSync(out,{recursive:true});
const db={};let n=0;
async function supa(route){const u=route.request().url(),fn=u.split('/rpc/')[1],b=JSON.parse(route.request().postData()||'{}');
  const ok=j=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(j)}),ko=(c,m)=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:c,message:m})});
  if(fn==='sc_crea'){const id='00000000-0000-4000-8000-'+String(++n).padStart(12,'0');db[id]={dati:b.p_dati,versione:1,chiave:'ab'.repeat(18),aggiornata:new Date().toISOString()};return ok([{id,chiave:db[id].chiave}])}
  const r=db[b.p_id];if(!r)return ok(fn==='sc_versione'?null:[]);
  if(fn==='sc_leggi')return ok([{dati:r.dati,versione:r.versione,aggiornata:r.aggiornata}]);
  if(fn==='sc_versione')return ok(r.versione);
  if(fn==='sc_salva'){if(b.p_chiave!==r.chiave)return ko('42501','Chiave');if(b.p_versione!=null&&b.p_versione!==r.versione)return ko('40001','Versione');r.dati=b.p_dati;r.versione++;r.aggiornata=new Date().toISOString();return ok(r.versione)}
  return ko('X','?')}
(async()=>{const b=await chromium.launch();
  const A=await b.newContext({viewport:{width:1440,height:950}});await A.route('**/*supabase.co/**',supa);
  const pa=await A.newPage();pa.on('pageerror',e=>console.log('PAGEERR A',e.message));await open(pa,file);
  await pa.click('#bShare');await pa.waitForSelector('#mShare:not([hidden])');
  const view=await pa.inputValue('#lnkView'),edit=await pa.inputValue('#lnkEdit');console.log('links',view,edit.replace(/k=.*/,'k=…'));
  await pa.screenshot({path:path.join(out,'share.png')});await pa.click('#bShareClose');
  await pa.fill('#titolo','Casa Ruggiano – versione condivisa');await pa.waitForTimeout(2600);
  console.log('A cloud:',await pa.evaluate(()=>document.querySelector('#sum .cl')?.textContent),'db versione',Object.values(db)[0].versione);
  // telefono dell'investitore
  const B=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await B.route('**/*supabase.co/**',supa);
  const pb=await B.newPage();pb.on('pageerror',e=>console.log('PAGEERR B',e.message));await open(pb,file,{url:view});await pb.waitForTimeout(800);
  const vb=()=>pb.evaluate(()=>({viewer:document.body.classList.contains('viewer'),edVisible:getComputedStyle(document.getElementById('ed')).display!=='none',titolo:document.querySelector('.t1')?.textContent}));
  console.log('B prima',JSON.stringify(await vb()));await pb.screenshot({path:path.join(out,'phone.png')});
  // nuova modifica dal computer: il telefono la riceve da solo
  await pa.fill('#titolo','Casa Ruggiano – aggiornata adesso');await pa.waitForTimeout(2600);await pb.waitForTimeout(9000);
  console.log('B dopo',JSON.stringify(await vb()));
  // link di modifica aperto sul telefono di Antonio
  const C=await b.newContext({viewport:{width:390,height:844}});await C.route('**/*supabase.co/**',supa);
  const pc=await C.newPage();pc.on('pageerror',e=>console.log('PAGEERR C',e.message));await open(pc,file,{url:edit});await pc.waitForTimeout(800);
  console.log('C',JSON.stringify(await pc.evaluate(()=>({viewer:document.body.classList.contains('viewer'),url:location.href,titolo:document.getElementById('titolo').value}))));
  await b.close()})();
