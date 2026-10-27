import { drawArtwork } from './renderer.js';
const sizes=[['1920x1080','Full HD · 1920 × 1080'],['2560x1600','MacBook 13″ / 16:10 · 2560 × 1600'],['2560x1664','MacBook Air 13″ · 2560 × 1664'],['3024x1964','MacBook Pro 14″ · 3024 × 1964'],['3456x2234','MacBook Pro 16″ · 3456 × 2234'],['3840x2160','4K display · 3840 × 2160']];
export function initWallpaperExport(getState){
 const dialog=document.createElement('dialog');dialog.className='gif-dialog wallpaper-dialog';dialog.setAttribute('aria-labelledby','wallpaper-title');
 dialog.innerHTML=`<div class="gif-heading"><div><p class="eyebrow">DESKTOP WALLPAPER</p><h2 id="wallpaper-title">Export wallpaper</h2><p class="gif-subtitle">Download a static image or an animated video for your desktop.</p></div><button class="gif-close" aria-label="Close wallpaper export">×</button></div><div class="wallpaper-modes" role="group" aria-label="Wallpaper format"><button data-wallpaper-mode="static" aria-pressed="true">▧ Static <span>PNG image</span></button><button data-wallpaper-mode="animated" aria-pressed="false">▷ Animated <span>MP4 loop</span></button></div><div class="wallpaper-layout"><div><div class="wallpaper-screen"><canvas aria-label="Wallpaper preview"></canvas><video hidden muted loop playsinline controls aria-label="Exported animated wallpaper preview"></video></div><p class="wallpaper-spec"></p></div><div class="wallpaper-settings"><label for="wallpaper-size">Display resolution</label><select id="wallpaper-size">${sizes.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select><label for="wallpaper-fit">Artwork placement</label><select id="wallpaper-fit"><option value="contain">Fit · show the full artwork</option><option value="cover">Fill · crop to the display</option></select><div class="wallpaper-animation" hidden><label for="wallpaper-duration">Loop length</label><select id="wallpaper-duration"><option value="6">6 seconds</option><option value="12">12 seconds</option></select><p class="wallpaper-small">24 FPS · H.264 MP4 · No audio<br>Motion eases forward and back for smooth replay.</p></div></div></div><div class="wallpaper-help"></div><div class="gif-progress"><div></div></div><p class="gif-status" role="status" aria-live="polite"></p><div class="gif-actions"><p>Exported on your device<br><span>No uploads. No app installed by Vizal.</span></p><div class="wallpaper-actions"><button class="wallpaper-cancel" hidden>Cancel export</button><button class="wallpaper-download">Download PNG</button></div></div>`;
 document.body.append(dialog);
 const preview=dialog.querySelector('canvas'),previewCtx=preview.getContext('2d',{alpha:false}),video=dialog.querySelector('video');
 const size=dialog.querySelector('#wallpaper-size'),fit=dialog.querySelector('#wallpaper-fit'),duration=dialog.querySelector('#wallpaper-duration');
 const status=dialog.querySelector('.gif-status'),download=dialog.querySelector('.wallpaper-download'),cancel=dialog.querySelector('.wallpaper-cancel'),bar=dialog.querySelector('.gif-progress div');
 const source=document.createElement('canvas'),sourceCtx=source.getContext('2d',{alpha:false});
 let snapshot,mode='static',worker=null,token=0,result=null,url=null,raf=0,started=0,busy=false,last=0;
 function dimensions(){return size.value.split('x').map(Number);}
 function place(ctx,width,height){
  ctx.fillStyle='#060c18';ctx.fillRect(0,0,width,height);
  const scale=(fit.value==='cover'?Math.max:Math.min)(width/source.width,height/source.height);
  ctx.drawImage(source,(width-source.width*scale)/2,(height-source.height*scale)/2,source.width*scale,source.height*scale);
 }
 function clearResult(){result=null;if(url)URL.revokeObjectURL(url);url=null;video.pause();video.removeAttribute('src');video.load();video.hidden=true;preview.hidden=false;}
 function setBusy(value){busy=value;cancel.hidden=!value;for(const control of dialog.querySelectorAll('select,[data-wallpaper-mode]'))control.disabled=value;download.disabled=value;}
 function stop(){token++;worker?.terminate();worker=null;setBusy(false);}
 function sync(){
  const [w,h]=dimensions();preview.width=640;preview.height=Math.round(640*h/w);
  dialog.querySelector('.wallpaper-animation').hidden=mode!=='animated';
  dialog.querySelectorAll('[data-wallpaper-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wallpaperMode===mode)));
  dialog.querySelector('.wallpaper-spec').textContent=`${w.toLocaleString()} × ${h.toLocaleString()} px · ${mode==='static'?'PNG image':duration.value+'s MP4 loop'}`;
  dialog.querySelector('.wallpaper-help').innerHTML=mode==='static'?'<strong>Set it as your wallpaper</strong><p>Download the PNG, then open System Settings → Wallpaper → Add Photo and select your file. <a href="https://support.apple.com/guide/mac-help/mchlp3013/mac" target="_blank" rel="noopener noreferrer">Apple’s instructions ↗</a></p>':'<strong>Using an animated wallpaper</strong><p>Custom MP4s need a live-wallpaper app; this download won’t install itself in macOS Wallpaper settings. <a href="https://aerialscreensaver.github.io/" target="_blank" rel="noopener noreferrer">Aerial (free) ↗</a> supports your own MP4s. Import the file under My Videos, then enable its wallpaper mode. Check the app’s macOS requirements.</p>';
  download.textContent=mode==='static'?'Download PNG':result?'Download MP4':'Create animated wallpaper';
  status.textContent='';bar.style.width='0%';last=0;
 }
 function invalidate(){stop();clearResult();sync();}
 function loop(now){
  if(!dialog.open)return;
  if(!document.hidden&&!busy&&preview.hidden===false&&now-last>65){
   const length=Number(duration.value),phase=((now-started)/1000%length)/length;
   const motionTime=mode==='static'?snapshot.time:snapshot.time+length/Math.PI*(1-Math.cos(phase*2*Math.PI))*snapshot.speed;
   drawArtwork(sourceCtx,snapshot.artwork,snapshot.columns,snapshot.palette,motionTime);place(previewCtx,preview.width,preview.height);last=now;
  }
  raf=requestAnimationFrame(loop);
 }
 function save(blob,extension){const link=document.createElement('a'),downloadUrl=URL.createObjectURL(blob);link.href=downloadUrl;link.download=`vizal-${snapshot.artwork.id}-wallpaper-${size.value}.${extension}`;link.click();setTimeout(()=>URL.revokeObjectURL(downloadUrl),1000);}
 async function create(){
  if(busy)return;
  if(mode==='static'){
   setBusy(true);const current=++token;
   try{const [w,h]=dimensions(),output=document.createElement('canvas');output.width=w;output.height=h;drawArtwork(sourceCtx,snapshot.artwork,snapshot.columns,snapshot.palette,snapshot.time);place(output.getContext('2d',{alpha:false}),w,h);
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));if(current!==token)return;if(!blob)throw Error('Could not create PNG.');save(blob,'png');status.textContent='PNG downloaded. Choose it in macOS Wallpaper settings.';
   }catch(error){status.textContent=error.message;}finally{if(current===token)setBusy(false);}return;
  }
  if(result){save(result,'mp4');return;}
  if(!('VideoEncoder' in window)||!('OffscreenCanvas' in window)){status.textContent='Animated MP4 export needs a browser with video encoding support. Try current Chrome, Edge, or Safari. Static PNG still works.';return;}
  setBusy(true);const current=++token,[width,height]=dimensions(),seconds=Number(duration.value),frames=seconds*24;let index=0;
  worker=new Worker(new URL('./wallpaper.worker.js',import.meta.url),{type:'module'});
  function fail(message){if(current!==token)return;stop();download.textContent='Try animated export again';status.textContent=message;}
  async function send(){
   try{if(current!==token)return;const phase=index/frames,time=snapshot.time+seconds/Math.PI*(1-Math.cos(phase*2*Math.PI))*snapshot.speed;
    drawArtwork(sourceCtx,snapshot.artwork,snapshot.columns,snapshot.palette,time);const bitmap=await createImageBitmap(source);
    if(current!==token||!worker){bitmap.close();return;}worker.postMessage({type:'frame',index,bitmap},[bitmap]);index++;const pct=Math.round(index/frames*100);bar.style.width=pct+'%';status.textContent=`Exporting wallpaper · ${pct}%${pct===100?' · finishing MP4…':''}`;
   }catch(error){fail(error.message||'Could not render the wallpaper. Try Full HD.');}
  }
  worker.onmessage=({data})=>{
   if(current!==token)return;
   if(data.type==='error'){fail(data.message);return;}
   if(data.type==='ready'){requestAnimationFrame(send);return;}
   if(data.type==='result'){
    result=new Blob([data.buffer],{type:'video/mp4'});url=URL.createObjectURL(result);video.src=url;video.hidden=false;preview.hidden=true;
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)video.play().catch(()=>{});
    stop();download.textContent='Download MP4';status.textContent=`Ready · ${(result.size/1024/1024).toFixed(2)} MB · ${width} × ${height} · ${seconds} seconds`;bar.style.width='100%';
   }
  };
  worker.onerror=()=>fail('The video encoder could not start. Try Full HD or a current browser.');
  worker.postMessage({type:'init',width,height,frames,fit:fit.value});status.textContent='Checking MP4 support…';
 }
 dialog.querySelectorAll('[data-wallpaper-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.wallpaperMode;invalidate();});
 for(const input of [size,fit,duration])input.onchange=invalidate;
 download.onclick=create;cancel.onclick=()=>{stop();sync();status.textContent='Export cancelled. You can start again.';};
 dialog.querySelector('.gif-close').onclick=()=>dialog.close();
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{stop();cancelAnimationFrame(raf);clearResult();});
 document.querySelector('#export-wallpaper').onclick=()=>{snapshot=getState();started=performance.now();dialog.showModal();invalidate();raf=requestAnimationFrame(loop);};
}
