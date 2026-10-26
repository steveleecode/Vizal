const groups={night:['starry-night','cafe-terrace','night-watch','impression-sunrise','the-kiss'],landscape:['great-wave','water-lilies','sunday-afternoon','impression-sunrise','wanderer','hay-wain'],portrait:['mona-lisa','pearl-earring','the-scream','the-kiss','birth-of-venus','las-meninas','flaming-june'],classic:['mona-lisa','pearl-earring','birth-of-venus','creation-of-adam','night-watch','las-meninas','last-supper']};
export function initCollection(list,reducedMotion){
 const prev=document.querySelector('#collection-prev'),next=document.querySelector('#collection-next'),position=document.querySelector('#collection-position'),thumb=document.querySelector('#collection-thumb');
 let frame=0;
 const visible=()=>Array.from(list.children).filter(card=>!card.hidden);
 function update(){
  frame=0;const cards=visible(),left=list.scrollLeft,right=left+list.clientWidth,max=list.scrollWidth-list.clientWidth;
  const first=cards.findIndex(card=>card.offsetLeft+card.offsetWidth>left+4);
  let last=cards.findLastIndex(card=>card.offsetLeft<right-4);
  position.textContent=`${String(first+1).padStart(2,'0')}–${String(last+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
  prev.disabled=left<=2;next.disabled=left>=max-2;
  const fraction=Math.min(1,list.clientWidth/list.scrollWidth);
  thumb.style.width=`${fraction*100}%`;thumb.style.transform=`translateX(${max>0?left/max*(1-fraction)/fraction*100:0}%)`;
  list.parentElement.classList.toggle('has-before',left>2);list.parentElement.classList.toggle('has-after',left<max-2);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 list.addEventListener('scroll',schedule,{passive:true});new ResizeObserver(schedule).observe(list);
 function slide(direction){list.scrollBy({left:direction*Math.max(180,list.clientWidth-190),behavior:reducedMotion.matches?'instant':'smooth'});}
 prev.onclick=()=>slide(-1);next.onclick=()=>slide(1);
 document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{
  const filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  list.getAnimations().forEach(animation=>animation.cancel());
  for(const card of list.children)card.hidden=filter!=='all'&&!groups[filter].includes(card.dataset.artwork);
  list.scrollTo({left:0,behavior:'instant'});
  if(!reducedMotion.matches)list.animate([{opacity:.25,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:250,easing:'ease-out'});
  schedule();
 });
 list.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const cards=visible(),index=cards.indexOf(document.activeElement);if(index<0)return;
  event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?cards.length-1:Math.max(0,Math.min(cards.length-1,index+(event.key==='ArrowRight'?1:-1)));
  cards[target].focus({preventScroll:true});reveal(cards[target]);
 });
 function reveal(card){
  if(!card)return;
  if(card.hidden)document.querySelector('[data-filter="all"]').click();
  const start=card.offsetLeft,end=start+card.offsetWidth;
  if(start<list.scrollLeft||end>list.scrollLeft+list.clientWidth)list.scrollTo({left:start-(list.clientWidth-card.offsetWidth)/2,behavior:reducedMotion.matches?'instant':'smooth'});
 }
 schedule();return {reveal};
}
