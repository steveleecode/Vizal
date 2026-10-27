import { initWallpaperExport } from './wallpaper-export.js';
import { initCollection } from './collection.js';
import { drawArtwork } from './renderer.js';
import { initGifExport } from './gif-export.js';
import { artworks, prepareArtwork } from './artworks.js';
const canvas=document.querySelector('#art'),ctx=canvas.getContext('2d',{alpha:false});
const defaults={columns:180,speed:1};
const state={artwork:artworks[0],...defaults,palette:'original',paused:matchMedia('(prefers-reduced-motion: reduce)').matches,time:0};
let last=0,previousFrame=0,rows=78,dirty=false,selectionVersion=0,transitionStart=0;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const previousCanvas=document.createElement('canvas'),previousContext=previousCanvas.getContext('2d');
const select=document.querySelector('#painting-select'),list=document.querySelector('#painting-list');
for(const [index,artwork] of artworks.entries()){
 const option=new Option(artwork.title,artwork.id);select.add(option);
 const button=document.createElement('button');button.className='painting-card';button.dataset.artwork=artwork.id;
 button.setAttribute('aria-pressed',String(index===0));button.setAttribute('aria-label',`${artwork.title} by ${artwork.artist}`);
 const image=new Image();image.alt='';image.decoding='async';image.loading=index<6?'eager':'lazy';image.src=`/artworks/thumbnails/${artwork.id}.webp`;
 const title=document.createElement('span');title.className='card-title';title.textContent=artwork.title;
 const artist=document.createElement('span');artist.className='card-artist';artist.textContent=artwork.artist;
 const check=document.createElement('span');check.className='card-check';check.textContent='✓';check.setAttribute('aria-hidden','true');
 button.title=`${artwork.title} · ${artwork.artist}`;button.addEventListener('pointerenter',()=>prepareArtwork(artwork).catch(()=>{}),{once:true});
 button.append(image,title,artist,check);button.onclick=()=>chooseArtwork(artwork.id);list.append(button);
}
const collection=initCollection(list,reducedMotion);
select.onchange=()=>chooseArtwork(select.value);
async function chooseArtwork(id){
 const artwork=artworks.find(a=>a.id===id);if(!artwork)return;
 const version=++selectionVersion,status=document.querySelector('#artwork-status'),wrap=document.querySelector('.canvas-wrap');
 if(id===state.artwork.id){status.textContent='';select.value=id;wrap.setAttribute('aria-busy','false');return;}
 status.textContent='Loading painting…';wrap.setAttribute('aria-busy','true');
 try{
  const ready=await prepareArtwork(artwork);if(version!==selectionVersion)return;
  previousCanvas.width=canvas.width;previousCanvas.height=canvas.height;previousContext.drawImage(canvas,0,0);
  state.artwork=ready;state.time=0;transitionStart=reducedMotion.matches?0:performance.now();
  const index=artworks.indexOf(artwork),number=String(index+1).padStart(3,'0');
  select.value=id;document.querySelectorAll('[data-artwork]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.artwork===id)));
  document.querySelector('#artwork-title').textContent=artwork.title;
  document.querySelector('#artwork-artist').textContent=`${artwork.artist} · ${artwork.year}`;
  document.querySelector('#artwork-movement').textContent=artwork.movement.toUpperCase();
  document.querySelector('#artwork-study').textContent=`ASCII STUDY ${number}`;
  document.querySelector('#canvas-number').textContent=`ARTWORK / ${number}`;
  document.querySelector('.footer-number').textContent=`${String(index+1).padStart(2,'0')} /`;
  document.querySelector('#artwork-caption').textContent=artwork.title.toUpperCase();
  document.querySelector('.source').href=artwork.source;
  canvas.setAttribute('aria-label',`Animated colored ASCII rendition of ${artwork.title}`);
  collection.reveal(list.querySelector(`[data-artwork="${id}"]`));
  status.textContent='';dirty=true;
 }catch{if(version===selectionVersion){status.textContent='Could not load this painting. Please try again.';select.value=state.artwork.id;}}
 finally{if(version===selectionVersion)wrap.setAttribute('aria-busy','false');}
}
// Warm the small local image cache without delaying the first painting.
const warm=()=>Promise.allSettled(artworks.slice(1,4).map(prepareArtwork));
if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:2000});else setTimeout(warm,500);
function resize(){
 const cellWidth=8,cellHeight=15;
 transitionStart=0;
 rows=Math.round(state.columns/1.65*cellWidth/cellHeight);
 canvas.width=state.columns*cellWidth;canvas.height=rows*cellHeight;
 document.querySelector('#resolution').textContent=`${state.columns} × ${rows} CHARACTERS`;
 render();
}
function render(){
 if(canvas.width!==state.columns*8){resize();return;}
 drawArtwork(ctx,state.artwork,state.columns,state.palette,state.time);
 if(transitionStart){
  const progress=Math.min(1,(performance.now()-transitionStart)/480);
  ctx.globalAlpha=1-progress*progress*(3-2*progress);ctx.drawImage(previousCanvas,0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
  if(progress===1)transitionStart=0;
 }
}
function tick(now){
 const dt=last?Math.min((now-last)/1000,.1):0;last=now;
 if(!document.hidden){
  if(!state.paused)state.time+=dt*state.speed;
  if(dirty||((!state.paused&&state.speed>0)||transitionStart)&&now-previousFrame>=32){render();previousFrame=now;dirty=false;}
 }
 requestAnimationFrame(tick);
}
const pause=document.querySelector('#pause');
function syncPause(){pause.innerHTML=state.paused?'▶ <span>Resume animation</span>':'Ⅱ <span>Pause animation</span>';pause.setAttribute('aria-pressed',String(state.paused));document.querySelector('#play-state').textContent=state.paused?'Ⅱ   ANIMATION PAUSED':'↻   ANIMATION PLAYING';}
pause.onclick=()=>{state.paused=!state.paused;syncPause();};
const resetControls=document.querySelector('#reset-controls');
function syncReset(){resetControls.hidden=state.columns===defaults.columns&&state.speed===defaults.speed;}
resetControls.onclick=()=>{
 state.columns=defaults.columns;state.speed=defaults.speed;
 document.querySelector('#density').value=state.columns;
 document.querySelector('#density-value').value=state.columns;
 document.querySelector('#speed').value=state.speed*100;
 document.querySelector('#speed-value').value=`${state.speed.toFixed(1)}×`;
 dirty=true;syncReset();document.querySelector('#density').focus({preventScroll:true});
};
document.querySelector('#density').oninput=e=>{state.columns=Number(e.target.value);document.querySelector('#density-value').value=state.columns;dirty=true;syncReset();};
document.querySelector('#speed').oninput=e=>{state.speed=Number(e.target.value)/100;document.querySelector('#speed-value').value=`${state.speed.toFixed(1)}×`;syncReset();};
document.querySelectorAll('[data-palette]').forEach(button=>{button.setAttribute('aria-pressed',String(button.classList.contains('selected')));button.onclick=()=>{state.palette=button.dataset.palette;document.querySelectorAll('[data-palette]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});render();};});
document.querySelector('#snapshot').onclick=()=>{canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`vizal-${state.artwork.id}-${state.palette}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});};
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.canvas-wrap').requestFullscreen();}catch{document.querySelector('.canvas-wrap').scrollIntoView({behavior:'smooth',block:'center'});}};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!document.querySelector('dialog[open]')&&!['INPUT','BUTTON','A','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();pause.click();}});
document.addEventListener('visibilitychange',()=>{last=0;});
resize();syncPause();requestAnimationFrame(tick);

initGifExport(()=>({...state}));

initWallpaperExport(()=>({...state}));
