// Pannello rapido: tocca un riquadro dell'anteprima, cambia scritte, importi riga per riga e voci del grafico
const {chromium}=require('playwright');const {open}=require('./harness');const fs=require('fs');const path=require('path');
const file=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:1440,height:950},acceptDownloads:true})).newPage();p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message)});
  await open(p,file);await p.waitForTimeout(500);
  const txt=sel=>p.evaluate(s=>[...document.querySelectorAll(s)].map(x=>x.textContent.replace(/\s+/g,' ').trim()).join(' | '),sel);
  // 1. riquadro dell'investitore
  await p.click('#stage [data-b="investitore"] .big');await p.waitForTimeout(300);
  console.log('qp aperto:',await p.isVisible('#qp'),await txt('#qp .qh b'),'sel:',await p.locator('#stage .blk.sel').count());
  await p.screenshot({path:path.join(out,'qp-investitore.png')});
  await p.fill('#qp [data-lab="invGuadagnoNota"]','metà dell’utile, imposte escluse');
  await p.fill('#qp [data-lab="invRiceve"]','Ti torna alla vendita');
  await p.selectOption('#qp select[data-fmt="invRiceve"]','k');await p.waitForTimeout(400);
  console.log('INV:',await txt('#stage [data-b="investitore"] .lbl, #stage [data-b="investitore"] .big, #stage [data-b="investitore"] .pair'));
  // 2. grafico: preset essenziale e titolo spento
  await p.click('#stage [data-b="grafB"] svg',{position:{x:200,y:120}});await p.waitForTimeout(300);
  console.log('qp grafico:',await txt('#qp .qh b'));
  await p.click('#qp [data-gb-preset="essenziale"]');await p.waitForTimeout(300);
  await p.fill('#qp [data-lab="gbTPrev"]','Il nostro prezzo');await p.uncheck('#qp [data-off="grafBTit"]');await p.waitForTimeout(400);
  console.log('grafB testi:',await txt('#stage [data-b="grafB"] text'),'titolo:',await p.locator('#stage [data-b="grafB"] .k').count());
  await p.locator('#stage [data-b="grafB"]').screenshot({path:path.join(out,'grafB-essenziale.png')});
  await p.screenshot({path:path.join(out,'qp-grafico.png')});
  // 3. chiudi con Esc, l'editor si allinea
  await p.keyboard.press('Escape');await p.waitForTimeout(300);
  console.log('chiuso:',!(await p.isVisible('#qp')),'sel:',await p.locator('#stage .blk.sel').count());
  await p.evaluate(()=>document.getElementById('secTesti').open=true);
  console.log('editor sincronizzato:',await p.inputValue('#lRighe [data-lab="invRiceve"]'),'/',await p.inputValue('#lRighe select[data-fmt="invRiceve"]'));
  // 4. intestazione e "Vai a"
  await p.click('#stage .page .ph >> nth=0');await p.waitForTimeout(200);console.log('qp testata:',await txt('#qp .qh b'));
  await p.click('#qp [data-qp-sez]');await p.waitForTimeout(600);console.log('dopo vai a:',!(await p.isVisible('#qp')));
  // 5. PDF senza bordo di selezione; salvataggio
  await p.click('#stage [data-b="scenari"]');await p.waitForTimeout(200);
  const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('scheda-investimento-v2')));
  console.log('salvato lab',JSON.stringify(st.lab),'fmt',JSON.stringify(st.fmt));
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click('#bPdf')]);await dl.saveAs(path.join(out,'out.pdf'));console.log('pdf ok');
  // 6. telefono: foglio dal basso
  const C=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const q=await C.newPage();q.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR m',e.message)});
  await open(q,file);await q.waitForTimeout(300);await q.click('#tPv');await q.waitForTimeout(300);
  await q.tap('#stage [data-b="operazione"] .ln.top');await q.waitForTimeout(400);
  console.log('phone qp:',JSON.stringify(await q.evaluate(()=>{const r=document.getElementById('qp').getBoundingClientRect();return{vis:!document.getElementById('qp').hidden,l:r.left,w:r.width,b:Math.round(r.bottom),sw:document.documentElement.scrollWidth}})));
  await q.screenshot({path:path.join(out,'phone-qp.png')});
  console.log('ERRORS',errs.length);await b.close()})();
