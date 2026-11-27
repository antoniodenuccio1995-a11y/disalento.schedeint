// Screenshots of the web view: investor on desktop and phone (simulated Supabase), plus editor switch
const {chromium}=require('playwright');const {open}=require('./harness');const fs=require('fs');const path=require('path');
const file=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();
  // immagini di prova dal test precedente
  const A=await b.newContext({viewport:{width:1440,height:950}});const pa=await A.newPage();pa.on('pageerror',e=>console.log('PAGEERR',e.message));
  await open(pa,file);
  const imgs=await pa.evaluate(()=>{const mk=(w,h,sky,wall)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,sky);gr.addColorStop(1,'#f4efe6');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#c9b89e';g.fillRect(0,h*.78,w,h*.22);g.fillStyle=wall;g.fillRect(w*.18,h*.32,w*.64,h*.48);g.fillStyle='#7a6a58';for(let i=0;i<4;i++)g.fillRect(w*(.24+i*.15),h*.45,w*.07,h*.14);return c.toDataURL('image/jpeg',.85)};
    return [mk(1600,1000,'#7fb0d8','#efe6d6'),mk(1200,800,'#b8cfe0','#ddd2bf'),mk(1200,800,'#a7c7e8','#f6f1e8')]});
  const S=await pa.evaluate(imgs=>{const s=JSON.parse(localStorage.getItem('scheda-investimento-v2')||'null');return s},imgs);
  // costruisce i dati di una scheda condivisa con foto
  const dati=await pa.evaluate(imgs=>{const k='scheda-investimento-v2';return null},imgs);
  await pa.click('#vWeb');await pa.waitForTimeout(600);
  await pa.screenshot({path:path.join(out,'editor-web.png')});
  // investitore: scheda condivisa simulata
  const sched={nome:'Casa Ruggiano',titolo:'Casa Ruggiano',claim:'Ruggiano, frazione di Salve (Lecce)',sottotitolo:'Acquisto, lavori e rivendita in circa 12 mesi',foto:imgs[0],galleria:[{src:imgs[1],cap:'La casa oggi'},{src:imgs[2],cap:'Il progetto'},{src:'',cap:'La planimetria',fit:true}],layoutVer:3,
    contatti:{nome:'Ufficio DiSalento',tel:'0833 000000',email:'',ruolo:''},
    composizione:[{l:'Abitazione',mq:140,pm:850,cop:true,corpo:0},{l:'Giardino',mq:100,pm:100,cop:false,corpo:0}],
    comparabili:[{l:'Casa indipendente con giardino',mq:210,prezzo:125000}]};
  const route=r=>{const fn=r.request().url().split('/rpc/')[1];if(fn==='sc_leggi')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{dati:sched,versione:3,aggiornata:new Date().toISOString()}])});if(fn==='sc_versione')return r.fulfill({status:200,contentType:'application/json',body:'3'});return r.fulfill({status:200,contentType:'application/json',body:'[]'})};
  for(const [nome,vp,mob] of [['inv-desktop',{width:1440,height:900},false],['inv-phone',{width:390,height:844},true]]){
    const C=await b.newContext({viewport:vp,isMobile:mob,hasTouch:mob,deviceScaleFactor:mob?2:1,reducedMotion:'reduce'});await C.route('**/*supabase.co/**',route);
    const p=await C.newPage();p.on('pageerror',e=>console.log('PAGEERR',nome,e.message));
    await open(p,file,{url:'http://harness.local/?s=11111111-1111-4111-8111-111111111111&v=1'});await p.waitForTimeout(1200);
    console.log(nome,JSON.stringify(await p.evaluate(()=>({web:!document.getElementById('web').hidden,a4:!document.getElementById('stagebox').hidden,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,h:document.getElementById('web').scrollHeight}))));
    await p.screenshot({path:path.join(out,nome+'.png'),fullPage:true});await C.close()}
  await b.close()})();
