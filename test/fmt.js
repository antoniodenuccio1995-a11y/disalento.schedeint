// Formati degli importi, voci degli scenari e zoom
const {chromium}=require('playwright');const {open}=require('./harness');const fs=require('fs');const path=require('path');
const file=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1440,height:950}});const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message)});
  await open(p,file);await p.waitForTimeout(500);
  const txt=sel=>p.evaluate(s=>[...document.querySelectorAll(s)].map(x=>x.textContent.replace(/\s+/g,' ').trim()).join(' | '),sel);
  console.log('OP esatti:',await txt('#stage [data-b="operazione"] .ln'));
  // formato unit tests
  // selects present
  console.log('select fmt count',await p.locator('select[data-fmt]').count());
  await p.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
  // globale in k
  await p.selectOption('#fmtAll','k');await p.waitForTimeout(300);
  console.log('OP k:',await txt('#stage [data-b="operazione"] .ln'));
  console.log('INV k:',await txt('#stage [data-b="investitore"] .big, #stage [data-b="investitore"] .pair b'));
  console.log('SC k:',await txt('#stage [data-b="scenari"] tr'));
  console.log('COMP k (€/m² esatti):',await txt('#stage [data-b="composizione"] tr'));
  // un modulo esatto
  await p.selectOption('select[data-fmt="operazione"] >> nth=0','eur');await p.waitForTimeout(300);
  console.log('OP eur override:',await txt('#stage [data-b="operazione"] .ln'));
  console.log('sync selects operazione:',await p.evaluate(()=>[...document.querySelectorAll('select[data-fmt="operazione"]')].map(s=>s.value).join(',')));
  // grafico B prima
  await p.locator('#stage [data-b="grafB"]').screenshot({path:path.join(out,'grafB-k-tutto.png')});
  const hB=()=>p.evaluate(()=>document.querySelector('#stage [data-b="grafB"] svg').getAttribute('height'));
  console.log('grafB H tutto',await hB());
  for(const k of ['gbRiceve','gbPct','gbFascia','gbPru','gbFav']){await p.uncheck(`[data-off="${k}"]`);await p.waitForTimeout(150)}
  console.log('grafB H ridotto',await hB(),await txt('#stage [data-b="grafB"] text'));
  await p.locator('#stage [data-b="grafB"]').screenshot({path:path.join(out,'grafB-k-ridotto.png')});
  for(const k of ['gbPar','gbPrev','gbLeg']){await p.uncheck(`[data-off="${k}"]`);await p.waitForTimeout(150)}
  console.log('grafB H minimo',await hB());
  await p.locator('#stage [data-b="grafB"]').screenshot({path:path.join(out,'grafB-minimo.png')});
  // tabella: colonne e righe
  for(const k of ['scUtile','scFav','scLav','scNota']){await p.uncheck(`[data-off="${k}"]`);await p.waitForTimeout(150)}
  console.log('SC ridotta:',await txt('#stage [data-b="scenari"] tr'),'nota:',await p.locator('#stage [data-b="scenari"] .scs').count());
  await p.locator('#stage [data-b="scenari"]').screenshot({path:path.join(out,'scenari-ridotta.png')});
  // salvataggio e ricarica: tutto resta
  await p.waitForTimeout(600);
  const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('scheda-investimento-v2')));
  console.log('saved fmt',JSON.stringify(st.fmt),'off',Object.keys(st.off).join(','));
  // zoom
  const z=async()=>p.evaluate(()=>({lab:document.getElementById('zFit').textContent,sw:document.getElementById('stagebox').scrollWidth,cw:document.getElementById('stagebox').clientWidth,ml:document.getElementById('stage').style.marginLeft}));
  console.log('zoom fit',JSON.stringify(await z()));
  await p.click('#zPiu');await p.click('#zPiu');await p.waitForTimeout(200);console.log('zoom ++',JSON.stringify(await z()));
  await p.screenshot({path:path.join(out,'zoom-desktop.png')});
  await p.click('#zFit');await p.click('#zMeno');await p.waitForTimeout(200);console.log('zoom fit-',JSON.stringify(await z()));
  await p.click('#zFit');
  // telefono
  const C=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const q=await C.newPage();q.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR m',e.message)});
  await open(q,file);await q.waitForTimeout(400);await q.click('#tPv');await q.waitForTimeout(300);
  const zq=()=>q.evaluate(()=>({lab:document.getElementById('zFit').textContent,sw:document.getElementById('stagebox').scrollWidth,cw:document.getElementById('stagebox').clientWidth,doc:document.documentElement.scrollWidth,dcw:document.documentElement.clientWidth}));
  console.log('phone fit',JSON.stringify(await zq()));
  await q.screenshot({path:path.join(out,'phone-fit.png')});
  await q.click('#zPiu');await q.click('#zPiu');await q.waitForTimeout(300);console.log('phone ++',JSON.stringify(await zq()));
  await q.screenshot({path:path.join(out,'phone-zoom.png')});
  console.log('ERRORS',errs.length);await b.close()})();
