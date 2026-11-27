// Test harness: wraps the artifact body in the publish skeleton and serves CDN libs + Google Fonts locally.
const fs=require('fs'),path=require('path');
const V=path.join(__dirname,'node_modules');
const LIBS={
  'html2canvas':path.join(V,'html2canvas/dist/html2canvas.min.js'),
  'jspdf':path.join(V,'jspdf/dist/jspdf.umd.min.js'),
  'xlsx':path.join(V,'xlsx/dist/xlsx.full.min.js'),
  'jszip':path.join(V,'jszip/dist/jszip.min.js'),
};
const FONTS={
  'noto-400-normal':'@fontsource/noto-serif/files/noto-serif-latin-400-normal.woff2',
  'noto-400-italic':'@fontsource/noto-serif/files/noto-serif-latin-400-italic.woff2',
  'noto-500-normal':'@fontsource/noto-serif/files/noto-serif-latin-500-normal.woff2',
  'noto-600-normal':'@fontsource/noto-serif/files/noto-serif-latin-600-normal.woff2',
  'inter-400-normal':'@fontsource/inter/files/inter-latin-400-normal.woff2',
  'inter-500-normal':'@fontsource/inter/files/inter-latin-500-normal.woff2',
  'inter-600-normal':'@fontsource/inter/files/inter-latin-600-normal.woff2',
  'inter-700-normal':'@fontsource/inter/files/inter-latin-700-normal.woff2',
};
function fontCss(){
  let s='';
  for(const k of Object.keys(FONTS)){const [f,w,st]=k.split('-');const fam=f==='noto'?'Noto Serif':'Inter';
    s+=`@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/local/${k}.woff2) format('woff2')}\n`}
  return s;
}
const RESET=':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
async function open(page,file,opts={}){
  await page.route('**/*',route=>{
    const u=route.request().url();
    if(u.startsWith('http://harness.local/')){
      const rel=decodeURIComponent(new URL(u).pathname.slice(1));
      if(/\.(png|jpe?g|webp|svg)$/i.test(rel)){const f=path.join(path.dirname(file),rel);if(fs.existsSync(f))return route.fulfill({status:200,contentType:'image/'+(rel.split('.').pop().toLowerCase().replace('jpg','jpeg').replace('svg','svg+xml')),body:fs.readFileSync(f)});return route.fulfill({status:404,body:''})}
      const src=fs.readFileSync(file,'utf8');
      const body=/^<!DOCTYPE/i.test(src)?src:`<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>${src}</body></html>`;
      return route.fulfill({status:200,contentType:'text/html',body});
    }
    if(u.includes('fonts.googleapis.com'))return route.fulfill({status:200,contentType:'text/css',body:fontCss()});
    if(u.includes('fonts.gstatic.com/local/')){const k=u.split('/local/')[1].replace('.woff2','');return route.fulfill({status:200,contentType:'font/woff2',body:fs.readFileSync(path.join(V,FONTS[k]))})}
    for(const [k,f] of Object.entries(LIBS)){if(u.includes('cdnjs.cloudflare.com')&&u.includes('/'+k+'/'))return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(f)})}
    if(u.includes('supabase.co'))return route.fallback();
    if(u.startsWith('blob:')||u.startsWith('data:'))return route.continue();
    return route.abort();
  });
  if(opts.init)await page.addInitScript(opts.init);
  await page.goto(opts.url||'http://harness.local/');
  await page.waitForFunction(()=>window.html2canvas&&window.jspdf&&window.XLSX&&window.JSZip,null,{timeout:15000}).catch(()=>console.log('libs not ready'));
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(400);
}
module.exports={open};
