// Pannello in cinque schede e menu "Altro": screenshot di ogni scheda, computer e telefono
const {chromium}=require('playwright');const {open}=require('./harness');const fs=require('fs');const path=require('path');
const file=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message)});
  await open(p,file);await p.waitForTimeout(400);
  for(const c of ['casa','conti','scenari','testi','aspetto']){await p.click(`#cats [data-cat="${c}"]`);await p.waitForTimeout(250);
    const vis=await p.evaluate(()=>[...document.querySelectorAll('#ed details.sec')].filter(d=>d.offsetParent).map(d=>d.querySelector('summary').firstChild.textContent.trim()));
    console.log(c,'→',vis.join(' | '));await p.screenshot({path:path.join(out,'d-'+c+'.png')})}
  await p.click('#mDati summary');await p.waitForTimeout(200);await p.screenshot({path:path.join(out,'d-menu.png'),clip:{x:900,y:0,width:540,height:520}});await p.keyboard.press('Escape');await p.click('body',{position:{x:5,y:300}});
  // un avviso porta alla sezione
  await p.click('#cats [data-cat="aspetto"]');await p.click('#secChecks summary');await p.waitForTimeout(200);
  const li=p.locator('#checks li[data-sez]').first();const dove=await li.getAttribute('data-sez');await li.click();await p.waitForTimeout(700);
  console.log('avviso →',dove,'| scheda:',await p.evaluate(()=>document.getElementById('ed').dataset.cat),'| aperta:',await p.evaluate(n=>[...document.querySelectorAll('#ed details.sec')].find(d=>d.querySelector('summary').firstChild.textContent.trim()===n).open,dove));
  // dal pannello rapido alla sezione giusta
  await p.click('#stage [data-b="grafB"] svg',{position:{x:300,y:120}});await p.waitForTimeout(200);await p.click('#qp [data-qp-sez]');await p.waitForTimeout(600);
  console.log('grafico → scheda',await p.evaluate(()=>document.getElementById('ed').dataset.cat));
  // ricordata dopo il ricaricamento
  await p.reload();await p.waitForTimeout(800);console.log('dopo ricarica:',await p.evaluate(()=>document.getElementById('ed').dataset.cat));
  const C=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const q=await C.newPage();q.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR m',e.message)});
  await open(q,file);await q.waitForTimeout(300);
  for(const c of ['casa','conti','testi']){await q.tap(`#cats [data-cat="${c}"]`);await q.waitForTimeout(250);await q.screenshot({path:path.join(out,'m-'+c+'.png')})}
  await q.evaluate(()=>window.scrollTo(0,900));await q.waitForTimeout(200);await q.screenshot({path:path.join(out,'m-scroll.png')});
  console.log('phone sw',await q.evaluate(()=>document.documentElement.scrollWidth));
  await q.tap('#mDati summary');await q.waitForTimeout(200);await q.screenshot({path:path.join(out,'m-menu.png')});
  console.log('ERRORS',errs.length);await b.close()})();
