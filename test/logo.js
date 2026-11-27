// Loghi aziendali: testata, piè di pagina, vista web e PDF
const {chromium}=require('playwright');const {open}=require('./harness');const fs=require('fs');const path=require('path');
const file=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:950},acceptDownloads:true})).newPage();
  p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await open(p,file);await p.waitForTimeout(800);
  console.log(JSON.stringify(await p.evaluate(()=>({head:[...document.querySelectorAll('#stage .ph img.logo')].map(i=>i.naturalWidth+'x'+i.naturalHeight).join(','),foot:[...document.querySelectorAll('#stage .pf img.flogo')].length}))));
  await p.locator('#stage .page').first().screenshot({path:path.join(out,'pagina1.png')});
  await p.locator('#stage .page .pf').first().screenshot({path:path.join(out,'piede.png')});
  await p.click('#vWeb');await p.waitForTimeout(800);await p.screenshot({path:path.join(out,'web.png')});
  await b.close()})();
