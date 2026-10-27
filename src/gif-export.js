import { drawArtwork } from './renderer.js';
const presets=[{id:'small',name:'Small',width:320,height:194,note:'Smaller file'},{id:'medium',name:'Medium',width:640,height:388,note:'Standard size'},{id:'large',name:'Large',width:960,height:582,note:'More room for detail'}];
const sizeLabel=bytes=>bytes<1024*1024?`${(bytes/1024).toFixed(0)} KB`:`${(bytes/1024/1024).toFixed(2)} MB`;
export function initGifExport(getState){
 const dialog=document.createElement('dialog');dialog.className='gif-dialog';dialog.setAttribute('aria-labelledby','gif-title');
 dialog.innerHTML=`<div class="gif-heading"><div><p class="eyebrow">GIF EXPORT</p><h2 id="gif-title">Export animation</h2><p class="gif-subtitle">Compare sizes and file sizes before downloading.</p></div><button class="gif-close" aria-label="Close GIF export">×</button></div><div class="gif-options"><label>Duration<select id="gif-duration"><option value="3">3 seconds</option><option value="6">6 seconds</option></select></label><label>Custom width<input id="gif-width" type="number" min="64" max="1600" step="1" value="800" required></label><span class="gif-times">×</span><label>Custom height<input id="gif-height" type="number" min="64" max="1600" step="1" value="485" required></label><span class="gif-units">px</span></div><p class="gif-fit">Artwork keeps its proportions. Extra space uses the canvas background.</p><div class="gif-grid" role="group" aria-label="GIF export size"></div><div class="gif-progress"><div></div></div><p class="gif-status" role="status" aria-live="polite"></p><div class="gif-actions"><p>12 FPS · Looping<br><span>Created on your device. No uploads or fees.</span></p><button id="gif-download" disabled>Preparing previews…</button></div>`;
 document.body.append(dialog);
 const grid=dialog.querySelector('.gif-grid'),status=dialog.querySelector('.gif-status'),download=dialog.querySelector('#gif-download');
 let worker=null,version=0,selected='medium',results=new Map(),snapshot,timer,items=[],busy=false;
 function cleanup(){clearTimeout(timer);version++;worker?.terminate();worker=null;busy=false;for(const result of results.values())URL.revokeObjectURL(result.url);results.clear();}
 function selection(id){selected=id;for(const button of grid.children)button.setAttribute('aria-pressed',String(button.dataset.id===id));const result=results.get(id);download.disabled=!result;download.textContent=result?`Download GIF · ${sizeLabel(result.blob.size)}`:'Preparing previews…';}
 function card(item){
  const button=document.createElement('button');button.className='gif-size';button.dataset.id=item.id;button.setAttribute('aria-pressed',String(item.id===selected));
  button.innerHTML=`<div class="gif-preview"><span>Preparing animation…</span></div><div class="gif-card-heading"><strong>${item.name}</strong><span class="gif-selected">✓</span></div><span class="gif-dimensions">${item.width} × ${item.height} px</span><span class="gif-bytes">Calculating file size…</span><span class="gif-note">${item.note}</span>`;
  button.setAttribute('aria-label',`${item.name}, ${item.width} by ${item.height} pixels`);button.onclick=()=>selection(item.id);return button;
 }
 async function generate(){
  cleanup();const token=version;
  const width=dialog.querySelector('#gif-width'),height=dialog.querySelector('#gif-height');
  if(!width.checkValidity()||!height.checkValidity()){
   grid.replaceChildren();status.textContent='Enter whole-number dimensions between 64 and 1600 pixels.';download.disabled=true;download.textContent='Check custom dimensions';return;
  }
  items=[...presets,{id:'custom',name:'Custom',width:Number(width.value),height:Number(height.value),note:'Custom dimensions'}];
  grid.replaceChildren(...items.map(card));selection(selected);dialog.querySelector('.gif-progress div').style.width='0%';
  const duration=Number(dialog.querySelector('#gif-duration').value),frames=duration*12;
  const surface=document.createElement('canvas'),ctx=surface.getContext('2d',{alpha:false});
  worker=new Worker(new URL('./gif.worker.js',import.meta.url),{type:'module'});busy=true;
  let next=0;
  const fail=message=>{if(token!==version)return;worker?.terminate();worker=null;busy=false;status.textContent=message;download.textContent='Preview unavailable';download.disabled=true;};
  async function sendFrame(){
   if(token!==version||!dialog.open)return;
   try{
    // Ease time forward and back so the last frame returns smoothly to the first.
    const phase=next/frames,time=snapshot.time+duration/Math.PI*(1-Math.cos(phase*Math.PI*2))*snapshot.speed;
    drawArtwork(ctx,snapshot.artwork,snapshot.columns,snapshot.palette,time);
    const bitmap=await createImageBitmap(surface);
    if(token!==version||!worker){bitmap.close();return;}
    worker.postMessage({type:'frame',bitmap,index:next,delay:next%3===2?90:80},[bitmap]);next++;
   }catch{fail('GIF preview could not be created. Close this window and try a smaller size.');}
  }
  worker.onmessage=({data})=>{
   if(token!==version)return;
   if(data.type==='error'){fail('GIF encoding failed. Try a smaller custom size.');return;}
   if(data.type==='result'){
    const blob=new Blob([data.bytes],{type:'image/gif'}),url=URL.createObjectURL(blob);results.set(data.id,{blob,url});
    const button=grid.querySelector(`[data-id="${data.id}"]`),preview=button.querySelector('.gif-preview');
    const image=new Image();image.src=url;image.alt=`Animated ${data.id} GIF preview`;preview.replaceChildren(image);
    button.querySelector('.gif-bytes').textContent=sizeLabel(blob.size)+' · exact size';selection(selected);
   }
   if(data.type==='ready'){
    const progress=Math.round((data.index+1)/frames*100);dialog.querySelector('.gif-progress div').style.width=progress+'%';
    if(next<frames){status.textContent=`Creating four animated previews · ${progress}%`;requestAnimationFrame(sendFrame);}
    else{busy=false;worker.terminate();worker=null;status.textContent='Ready. Each preview is the actual GIF you’ll download.';}
   }
  };
  worker.onerror=()=>fail('Your browser could not start the GIF encoder. Please try again in a current browser.');
  worker.postMessage({type:'init',sizes:items,frames});status.textContent='Creating four animated previews · 0%';requestAnimationFrame(sendFrame);
 }
 document.querySelector('#export-gif').onclick=()=>{snapshot=getState();dialog.showModal();generate();};
 dialog.querySelector('.gif-close').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{cleanup();grid.replaceChildren();});
 for(const input of dialog.querySelectorAll('input,select'))input.addEventListener('input',()=>{
  // Invalidate immediately: an old encode must never win over new dimensions.
  cleanup();download.disabled=true;download.textContent='Updating previews…';status.textContent='Updating dimensions…';
  if(input.tagName==='INPUT')selected='custom';timer=setTimeout(generate,450);
 });
 download.onclick=()=>{const result=results.get(selected),item=items.find(i=>i.id===selected);if(!result||busy)return;const a=document.createElement('a');a.href=result.url;a.download=`vizal-${snapshot.artwork.id}-${item.width}x${item.height}.gif`;a.click();};
}
