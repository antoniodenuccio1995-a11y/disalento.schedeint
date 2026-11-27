// Le mie schede: pannello laterale con cartelle, cestino, ricerca; tasto "Tutta pagina"; avviso di versione nuova.
// Supabase è simulato in memoria (stesse regole delle funzioni sc_* del database).
const {chromium}=require('playwright');const {open}=require('./harness');const fs=require('fs');const path=require('path');
const file=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
const COD='codice-prova-123',KEY='ab'.repeat(18),ID=i=>'00000000-0000-4000-8000-00000000000'+i;
const db={},cartelle=new Set();const ora=()=>new Date().toISOString();
[[1,'Casa Ruggiano','Mario Rossi'],[2,'Villa Pescoluse',''],[3,'Rustico Salve','Anna Bianchi']].forEach(([i,nome,dest],k)=>{db[ID(i)]={dati:{nome,titolo:nome,destinatario:dest},versione:1,archivio:COD,cartella:null,eliminata:null,aggiornata:new Date(Date.now()-k*864e5).toISOString(),creata:ora()}});
async function supa(route){const fn=route.request().url().split('/rpc/')[1],b=JSON.parse(route.request().postData()||'{}');
  const ok=j=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(j)}),ko=(c,m)=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:c,message:m})});
  const mio=id=>db[id]&&db[id].archivio===b.p_codice;
  switch(fn){
    case 'sc_leggi':{const r=db[b.p_id];return ok(r&&!r.eliminata?[{dati:r.dati,versione:r.versione,aggiornata:r.aggiornata}]:[])}
    case 'sc_versione':{const r=db[b.p_id];return ok(r&&!r.eliminata?r.versione:null)}
    case 'sc_verifica':return ok(!!(db[b.p_id]&&(b.p_chiave===KEY||mio(b.p_id))))
    case 'sc_salva':{const r=db[b.p_id];if(!r||r.eliminata)return ko('P0002','Scheda non trovata.');r.dati=b.p_dati;r.versione++;r.aggiornata=ora();return ok(r.versione)}
    case 'sc_elenco':return ok(Object.entries(db).filter(([,r])=>r.archivio===b.p_codice).sort((a,c)=>c[1].aggiornata.localeCompare(a[1].aggiornata)).map(([id,r])=>({id,nome:r.dati.nome,titolo:r.dati.titolo,destinatario:r.dati.destinatario,creata:r.creata,aggiornata:r.aggiornata,cartella:r.cartella,eliminata:r.eliminata})))
    case 'sc_cartelle_elenco':{const n=new Set([...cartelle,...Object.values(db).filter(r=>r.cartella).map(r=>r.cartella)]);return ok([...n].sort().map(nome=>({nome,schede:Object.values(db).filter(r=>r.cartella===nome&&!r.eliminata).length})))}
    case 'sc_cartella_crea':cartelle.add(b.p_nome.trim());return ok(b.p_nome.trim())
    case 'sc_cartella_rinomina':cartelle.delete(b.p_vecchio);cartelle.add(b.p_nuovo);Object.values(db).forEach(r=>{if(r.cartella===b.p_vecchio)r.cartella=b.p_nuovo});return ok(b.p_nuovo)
    case 'sc_cartella_elimina':cartelle.delete(b.p_nome);Object.values(db).forEach(r=>{if(r.cartella===b.p_nome)r.cartella=null});return ok(true)
    case 'sc_sposta':if(!mio(b.p_id))return ko('42501','no');db[b.p_id].cartella=b.p_cartella||null;if(b.p_cartella)cartelle.add(b.p_cartella);return ok(b.p_cartella)
    case 'sc_elimina':if(!mio(b.p_id)&&b.p_chiave!==KEY)return ko('42501','no');db[b.p_id].eliminata=ora();return ok(true)
    case 'sc_ripristina':if(!mio(b.p_id))return ko('42501','no');db[b.p_id].eliminata=null;return ok(true)
    case 'sc_elimina_def':if(!mio(b.p_id)||!db[b.p_id].eliminata)return ko('42501','no');delete db[b.p_id];return ok(true)
  }return ko('X','?')}
(async()=>{const b=await chromium.launch();const errs=[];
  const init=`try{localStorage.setItem('sc-codice','${COD}');localStorage.setItem('sc-chiavi',JSON.stringify({'${ID(1)}':'${KEY}'}))}catch(e){}`;
  const A=await b.newContext({viewport:{width:1440,height:950}});await A.route('**/*supabase.co/**',supa);
  const p=await A.newPage();p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message)});
  await open(p,file,{url:'http://harness.local/?s='+ID(1),init});await p.waitForTimeout(900);
  console.log('modifica: schede del pannello visibili',await p.isVisible('#cats'),'| titolo',await p.inputValue('#nome'));
  const carte=()=>p.evaluate(()=>[...document.querySelectorAll('#archList .acard b')].map(x=>x.textContent).join(' | '));
  const chips=()=>p.evaluate(()=>[...document.querySelectorAll('#archFold button')].map(x=>x.textContent.replace(/\s+/g,' ').trim()+(x.getAttribute('aria-pressed')==='true'?'*':'')).join(' · '));
  await p.click('#bArch');await p.waitForTimeout(500);
  console.log('archivio:',await carte(),'| cartelle:',await chips());await p.screenshot({path:path.join(out,'drawer.png')});
  // nuova cartella
  await p.click('#bCartNew');await p.fill('#archFormIn','Clienti 2027');await p.click('#archFormOk');await p.waitForTimeout(400);
  console.log('dopo nuova cartella:',await chips(),'|',await p.textContent('#archList'));
  // sposta Villa Pescoluse nella cartella
  await p.click('#archFold [data-vista="*"]');await p.selectOption(`select[data-sposta="${ID(2)}"]`,'Clienti 2027');await p.waitForTimeout(400);
  console.log('spostata:',db[ID(2)].cartella,'|',await chips(),'| messaggio:',await p.textContent('#archMsg'));
  // nuova cartella dalla tendina di una scheda
  await p.selectOption(`select[data-sposta="${ID(3)}"]`,'__nuova');await p.fill('#archFormIn','Da valutare');await p.click('#archFormOk');await p.waitForTimeout(400);
  console.log('da tendina:',db[ID(3)].cartella,'|',await chips());
  // rinomina cartella
  await p.click('#archFold [data-vista="Clienti 2027"]');await p.waitForTimeout(150);console.log('in cartella:',await carte());
  await p.click('#bCartRen');await p.fill('#archFormIn','Investitori 2027');await p.click('#archFormOk');await p.waitForTimeout(400);
  console.log('rinominata:',db[ID(2)].cartella,'|',await chips());
  // cerca
  await p.click('#archFold [data-vista="*"]');await p.fill('#archQ','bianchi');await p.waitForTimeout(150);console.log('cerca bianchi:',await carte());await p.fill('#archQ','');
  // elimina (due tocchi), cestino, ripristina, elimina per sempre
  await p.click(`[data-del="${ID(3)}"]`);await p.waitForTimeout(100);console.log('primo tocco: ancora',db[ID(3)].eliminata?'eliminata':'presente','| tasto',await p.textContent(`[data-del="${ID(3)}"]`));
  await p.click(`[data-del="${ID(3)}"]`);await p.waitForTimeout(400);console.log('secondo tocco:',db[ID(3)].eliminata?'nel cestino':'presente','|',await chips());
  await p.screenshot({path:path.join(out,'drawer-cestino-chip.png')});
  await p.click('#archFold [data-vista="x"]');await p.waitForTimeout(150);console.log('cestino:',await carte());await p.screenshot({path:path.join(out,'cestino.png')});
  await p.click(`[data-rip="${ID(3)}"]`);await p.waitForTimeout(400);console.log('ripristinata:',db[ID(3)].eliminata,'|',await chips());
  await p.click('#archFold [data-vista="*"]');await p.click(`[data-del="${ID(3)}"]`);await p.click(`[data-del="${ID(3)}"]`);await p.waitForTimeout(400);
  await p.click('#archFold [data-vista="x"]');await p.click(`[data-def="${ID(3)}"]`);await p.click(`[data-def="${ID(3)}"]`);await p.waitForTimeout(400);
  console.log('per sempre:',ID(3) in db?'ANCORA NEL DB':'cancellata','|',await chips());
  // elimina cartella: le schede restano
  await p.click('#archFold [data-vista="Investitori 2027"]');await p.click('#bCartDel');await p.click('#bCartDel');await p.waitForTimeout(400);
  console.log('cartella eliminata:',db[ID(2)].cartella,'|',await chips());
  await p.keyboard.press('Escape');await p.waitForTimeout(150);console.log('chiuso con Esc:',await p.isHidden('#mArch'));
  // tutta pagina
  await p.click('#cats [data-cat="aspetto"]');await p.click('#bFull');await p.waitForTimeout(500);
  console.log('tutta pagina:',JSON.stringify(await p.evaluate(()=>({ed:getComputedStyle(document.getElementById('ed')).display,zoom:document.getElementById('zFit').textContent,w:Math.round(document.querySelector('#stage .page').getBoundingClientRect().width)}))));
  await p.screenshot({path:path.join(out,'tutta-pagina.png')});
  await p.click('#bFull');await p.waitForTimeout(300);console.log('uscita:',await p.isVisible('#cats'),await p.textContent('#zFit'));
  // avviso di versione nuova
  await p.route(u=>u.search.startsWith('?nv='),r=>r.fulfill({status:200,contentType:'text/html',body:"<script>const VERSIONE='9999-01-01';</script>"}));
  await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await p.waitForTimeout(800);
  console.log('avviso versione nuova:',await p.isVisible('#nuovaVer'));await p.screenshot({path:path.join(out,'nuova-versione.png')});
  // eliminare la scheda aperta porta alla bozza del browser
  await p.click('#bNuovaNo');await p.click('#bArch');await p.waitForTimeout(400);await p.click(`[data-del="${ID(1)}"]`);
  await Promise.all([p.waitForURL(u=>!u.search.includes('s='),{timeout:5000}).catch(()=>{}),p.click(`[data-del="${ID(1)}"]`)]);await p.waitForTimeout(600);
  console.log('dopo elimina aperta:',p.url(),'| db',db[ID(1)].eliminata?'nel cestino':'presente');
  // il link di una scheda nel cestino non si apre
  const V=await b.newContext({viewport:{width:390,height:844}});await V.route('**/*supabase.co/**',supa);const v=await V.newPage();
  await open(v,file,{url:'http://harness.local/?s='+ID(1)+'&v=1'});await v.waitForTimeout(700);console.log('link nel cestino:',await v.textContent('#status'));
  // telefono
  const M=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await M.route('**/*supabase.co/**',supa);
  const m=await M.newPage();m.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR m',e.message)});
  await open(m,file,{init});await m.waitForTimeout(400);await m.tap('#mDati summary');await m.tap('#bArch2');await m.waitForTimeout(500);
  console.log('telefono:',JSON.stringify(await m.evaluate(()=>({w:Math.round(document.querySelector('#mArch .dbox').getBoundingClientRect().width),sw:document.documentElement.scrollWidth}))));
  await m.screenshot({path:path.join(out,'telefono.png')});
  console.log('ERRORS',errs.length);await b.close()})();
