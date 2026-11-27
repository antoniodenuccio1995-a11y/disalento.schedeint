const {chromium}=require('playwright');const {open}=require('./harness');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:950}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
await open(p,process.argv[2]);await p.evaluate(()=>document.querySelectorAll('details.sec,details.tg').forEach(d=>d.open=true));
await p.fill('[data-lab="opTitolo"]','Il conto della casa');await p.uncheck('[data-off="opRend"]');await p.uncheck('[data-off="opDurata"]');
await p.uncheck('[data-off="invGuadagnoNota"]');await p.fill('[data-lab="invRiceve"]','Totale alla vendita');await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(()=>({op:[...document.querySelectorAll('.opbox .k, .opbox .ln>span:first-child')].map(x=>x.textContent),inv:document.querySelector('.invbox').innerText.replace(/\n+/g,' | '),pg:document.getElementById('pgInfo').textContent}))));
await b.close()})();
