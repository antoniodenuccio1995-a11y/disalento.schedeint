// Usage: node test.js <html> <outdir> [--photos] [--exports] [--mobile]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {open}=require('./harness');
const [,,file,out,...flags]=process.argv;fs.mkdirSync(out,{recursive:true});
const has=f=>flags.includes(f);
async function makeImages(page){
  // draws simple test pictures in the browser and returns them as buffers
  const list=await page.evaluate(()=>{
    const mk=(w,h,sky,wall,label)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
      const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,sky);gr.addColorStop(1,'#f4efe6');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.fillStyle='#c9b89e';g.fillRect(0,h*.78,w,h*.22);g.fillStyle=wall;g.fillRect(w*.18,h*.32,w*.64,h*.48);
      g.fillStyle='#7a6a58';for(let i=0;i<4;i++)g.fillRect(w*(.24+i*.15),h*.45,w*.07,h*.14);g.fillStyle='#5a4a3a';g.fillRect(w*.46,h*.6,w*.08,h*.2);
      g.fillStyle='#2f5d3a';g.beginPath();g.arc(w*.1,h*.7,h*.12,0,7);g.fill();g.fillStyle='#333';g.font=`${Math.round(h*.06)}px sans-serif`;g.fillText(label,20,h*.1);
      return c.toDataURL('image/jpeg',.9).split(',')[1]};
    return [mk(1600,1000,'#9cc3e0','#efe6d6','copertina'),mk(1200,800,'#b8cfe0','#ddd2bf','oggi'),mk(1200,800,'#a7c7e8','#f6f1e8','progetto'),mk(1000,800,'#ffffff','#ffffff','planimetria')]});
  return list.map((b,i)=>({name:['copertina','oggi','progetto','planimetria'][i]+'.jpg',mimeType:'image/jpeg',buffer:Buffer.from(b,'base64')}));
}
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1440,height:950},deviceScaleFactor:1,acceptDownloads:true});
  const page=await ctx.newPage();
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('CONSOLE',m.type(),m.text())});
  page.on('pageerror',e=>console.log('PAGEERR',e.message));
  await open(page,file);
  if(has('--photos')){
    const imgs=await makeImages(page);
    const pick=async(sel,files)=>{const [fc]=await Promise.all([page.waitForEvent('filechooser'),page.click(sel)]);await fc.setFiles(files)};
    await pick('[data-slot="cover"] [data-img-pick]',[imgs[0]]);await page.waitForTimeout(400);
    for(let i=0;i<3;i++){await pick(`[data-slot="gal"][data-i="${i}"] [data-img-pick]`,[imgs[i+1]]);await page.waitForTimeout(300)}
    await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));await page.fill('#cNome','Antonio');await page.fill('#cRuolo','Amministrazione');await page.fill('#cTel','000 000 0000');
    await page.waitForTimeout(500);
  }
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
  const pages=await page.$$('.page');
  for(let i=0;i<pages.length;i++){await page.evaluate(i=>{const st=document.getElementById('stage');st.dataset.t=st.style.transform;st.style.transform='none';const v=document.getElementById('view');v.dataset.s=v.getAttribute('style')||'';v.style.cssText='position:static;max-height:none;overflow:visible';document.getElementById('bar').style.visibility='hidden'},i);
    await pages[i].screenshot({path:path.join(out,'p'+(i+1)+'.png')});await page.evaluate(()=>{const st=document.getElementById('stage');st.style.transform=st.dataset.t;const v=document.getElementById('view');v.setAttribute('style',v.dataset.s);document.getElementById('bar').style.visibility=''})}
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,'desktop.png')});
  console.log('info',JSON.stringify(await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,status:document.getElementById('status').textContent,pg:document.getElementById('pgInfo').textContent,checks:[...document.querySelectorAll('#checks li')].map(l=>l.textContent)}))));
  if(has('--exports')){
    for(const [id,name] of [['#bPdf','out.pdf'],['#bXls','out.xlsx'],['#bZip','out.zip']]){
      const [d]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.click(id)]);await d.saveAs(path.join(out,name));console.log('download',name,d.suggestedFilename());
      await page.waitForFunction(()=>!document.getElementById('bPdf').disabled);}
  }
  if(has('--mobile')){
    const m=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const mp=await m.newPage();mp.on('pageerror',e=>console.log('PAGEERR(m)',e.message));
    // reuse saved state from desktop run
    const state=await page.evaluate(()=>localStorage.getItem('scheda-investimento-v2'));
    await open(mp,file,{init:`try{localStorage.setItem('scheda-investimento-v2',${JSON.stringify(state||'')}||null)}catch(e){}`});
    await mp.screenshot({path:path.join(out,'m-edit.png')});
    await mp.evaluate(()=>window.scrollTo(0,1400));await mp.waitForTimeout(200);await mp.screenshot({path:path.join(out,'m-edit2.png')});
    await mp.click('#tPv');await mp.waitForTimeout(400);await mp.screenshot({path:path.join(out,'m-preview.png')});
    await mp.click('#mDati summary');await mp.waitForTimeout(200);await mp.screenshot({path:path.join(out,'m-menu.png')});
    console.log('mobile',JSON.stringify(await mp.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}))));
    await m.close();
  }
  await b.close();
})();
