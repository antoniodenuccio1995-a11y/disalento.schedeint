// Chi apre il link: parte dalle pagine A4 (predefinito) o dalla vista web, scelta in Condividi
const {chromium}=require('playwright');const {open}=require('./harness');
const file=process.argv[2];
const db={};let n=0;const KEY='ab'.repeat(18);
async function supa(route){const fn=route.request().url().split('/rpc/')[1],b=JSON.parse(route.request().postData()||'{}');
  const ok=j=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(j)});
  if(fn==='sc_crea'){const id='00000000-0000-4000-8000-'+String(++n).padStart(12,'0');db[id]={dati:b.p_dati,versione:1};return ok([{id,chiave:KEY}])}
  const r=db[b.p_id];if(fn==='sc_leggi')return ok(r?[{dati:r.dati,versione:r.versione,aggiornata:new Date().toISOString()}]:[]);
  if(fn==='sc_versione')return ok(r?r.versione:null);
  if(fn==='sc_salva'){r.dati=b.p_dati;r.versione++;return ok(r.versione)}return ok(null)}
(async()=>{const b=await chromium.launch();const errs=[];
  const A=await b.newContext({viewport:{width:1440,height:950}});await A.route('**/*supabase.co/**',supa);const p=await A.newPage();p.on('pageerror',e=>errs.push(e.message));
  await open(p,file);await p.click('#bShare');await p.waitForSelector('#mShare:not([hidden])');
  const view=await p.inputValue('#lnkView');console.log('scelta iniziale:',await p.getAttribute('[data-vlink="a4"]','aria-pressed'));
  const guarda=async(nome)=>{const C=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await C.route('**/*supabase.co/**',supa);const q=await C.newPage();q.on('pageerror',e=>errs.push(e.message));
    await open(q,file,{url:view});await q.waitForTimeout(900);
    console.log(nome,JSON.stringify(await q.evaluate(()=>({a4:!document.getElementById('stagebox').hidden,web:!document.getElementById('web').hidden,selettore:!document.getElementById('vMode').hidden,pagine:document.querySelectorAll('#stage .page').length,zoom:!document.getElementById('bZoom').hidden,sw:document.documentElement.scrollWidth}))));await C.close()};
  await guarda('investitore (predefinito):');
  await p.click('[data-vlink="web"]');await p.waitForTimeout(2200);console.log('info:',await p.textContent('#shareInfo'));
  await guarda('investitore (vista web):');
  await p.click('[data-vlink="a4"]');await p.waitForTimeout(2200);await guarda('investitore (di nuovo A4):');
  console.log('ERRORS',errs.length,errs.join(' | '));await b.close()})();
