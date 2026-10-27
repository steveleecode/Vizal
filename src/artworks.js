// Artwork samplers return a character and RGB color at normalized coordinates.
// Add another sampler here to extend the collection without changing the renderer.
const stars = [[.08,.18,.035],[.24,.11,.032],[.40,.16,.028],[.54,.09,.026],[.68,.20,.036],[.84,.12,.032],[.92,.32,.028],[.61,.39,.027],[.38,.34,.025]];
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const noise = (x,y) => { const v = Math.sin(x*127.1+y*311.7)*43758.5453; return v-Math.floor(v); };
export const starryNight = {
 id:'starry-night', title:'The Starry Night', artist:'Vincent van Gogh', year:1889,
 sample(x,y,t,col,row) {
  const n=noise(col,row);
  let color=[15,37,83], glyph='.';
  // Two counter-rotating eddies distort the long horizontal brushstrokes.
  let u=x,v=y;
  for(const [cx,cy,strength] of [[.47,.39,1.5],[.72,.45,-.85]]) {
   const dx=x-cx,dy=(y-cy)*.69,r=Math.hypot(dx,dy),a=strength*Math.exp(-r*r/0.048);
   u+=dx*Math.cos(a)-dy*Math.sin(a)-dx;
   v+=(dx*Math.sin(a)+dy*Math.cos(a)-dy)*1.1;
  }
  const flow=Math.sin(v*155+u*13-t*1.1+Math.sin(u*17+v*7-t*.2)*2.3);
  const band=Math.sin(v*48+u*9+Math.sin(u*10-t*.15)*1.4);
  const light=clamp((flow*.5+.5)*.66+(band*.5+.5)*.29+n*.1);
  color=[15+light*30,39+light*103,85+light*112];
  glyph=flow>.55?'=':flow>-.05?'-':n>.75?':':'.';
  if(band>.65&&flow>.1){color=[51+light*30,132+light*45,177+light*38];glyph='~';}
  // Warm revolving rings, with independently flickering centers.
  for(const [sx,sy,radius] of stars){
   const dx=x-sx,dy=(y-sy)*.66,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
   if(r<radius*1.8){
    const ring=Math.sin(r*450-a*2+t*.75),fade=1-r/(radius*1.8);
    if(r<radius*.38){glyph=n>.45?'@':'*';color=[245,225,151];}
    else if(ring>-.1){glyph=ring>.65?'o':a>0?'/':'\\';color=[125+fade*110,143+fade*72,128+fade*20];}
   }
  }
  // Crescent moon at upper right, surrounded by concentric character arcs.
  const mx=x-.91,my=(y-.12)*.66,mr=Math.hypot(mx,my);
  if(mr<.064){
   if(mr<.041&&Math.hypot(mx-.017,my+.009)>.033){glyph='@';color=[249,211,108];}
   else if(Math.sin(mr*460+Math.atan2(my,mx)*2-t*.3)>.25){glyph='o';color=[176,165,106];}
  }
  const hill=.71+.022*Math.sin(x*18)+.019*Math.sin(x*39);
  if(y>hill){const h=Math.sin(x*45+y*93)*.5+.5;glyph=h>.6?'~':'-';color=[18+h*14,39+h*24,64+h*34];}
  // Village: stable roof geometry, sparse amber window lights.
  if(y>.79){
   const block=Math.floor(x*29),local=x*29-block;
   const base=.84+noise(block,3)*.12,roof=base-.035+Math.abs(local-.5)*.065;
   if(y>roof){glyph=y<base?'/':n>.7?'|':'.';color=[26,42,57];
    if(y>base+.015&&n>.89){glyph=n>.96?'H':':';color=[194+n*45,139+n*48,62];}
   }
   if(Math.abs(x-.54)<.009&&y>.755){glyph='|';color=[83,100,114];}
   if(Math.abs(x-.54)<.02&&y>.87){glyph=n>.7?'|':':';color=[71,85,98];}
  }
  // Cypress: irregular flame-like branches with directional green strokes.
  const top=.18,cy=(y-top)/(.99-top);
  const trunk=.19+.013*Math.sin(y*15)+.008*Math.sin(y*37);
  const width=(.011+Math.pow(clamp(cy),.72)*.069)*(1+.19*Math.sin(y*67));
  if(y>top&&Math.abs(x-trunk)<width){
   const edge=Math.abs(x-trunk)/width,vein=Math.sin(x*360+y*80+Math.sin(y*32)*3-t*.35);
   glyph=vein>.5?'/':vein>-.3?'|':':';
   const l=clamp(vein*.32+.3+edge*.12);
   color=[15+l*28,43+l*79,31+l*36];
   if(n<.13){glyph=' ';}
  }
  return {glyph,color};
 }
};
starryNight.movement='Post-impressionism';
starryNight.source='https://en.wikipedia.org/wiki/The_Starry_Night';
starryNight.image='/artworks/starry-night.jpg';
const imageArtwork=(id,title,artist,year,movement,page,motion)=>({id,title,artist,year,movement,source:'https://en.wikipedia.org/wiki/'+page,image:'/artworks/'+id+'.jpg',motion});
export const artworks = [starryNight,
 imageArtwork('great-wave','The Great Wave','Katsushika Hokusai','c. 1831','Ukiyo-e','The_Great_Wave_off_Kanagawa','wave'),
 imageArtwork('mona-lisa','Mona Lisa','Leonardo da Vinci','c. 1503–1519','High Renaissance','Mona_Lisa','portrait'),
 imageArtwork('pearl-earring','Girl with a Pearl Earring','Johannes Vermeer','c. 1665','Dutch Golden Age','Girl_with_a_Pearl_Earring','portrait'),
 imageArtwork('the-scream','The Scream','Edvard Munch',1893,'Expressionism','The_Scream','wave'),
 imageArtwork('the-kiss','The Kiss','Gustav Klimt','1907–1908','Art Nouveau','The_Kiss_(Klimt)','shimmer'),
 imageArtwork('water-lilies','Water Lilies · The Clouds','Claude Monet','1914–1926','Impressionism','Water_Lilies_(Monet_series)','water'),
 imageArtwork('sunflowers','Sunflowers','Vincent van Gogh',1888,'Post-impressionism','Sunflowers_(Van_Gogh_series)','shimmer'),
 imageArtwork('bedroom','Bedroom in Arles','Vincent van Gogh',1888,'Post-impressionism','Bedroom_in_Arles','portrait'),
 imageArtwork('cafe-terrace','Café Terrace at Night','Vincent van Gogh',1888,'Post-impressionism','Caf%C3%A9_Terrace_at_Night','shimmer'),
 imageArtwork('birth-of-venus','The Birth of Venus','Sandro Botticelli','c. 1484–1486','Early Renaissance','The_Birth_of_Venus','water'),
 imageArtwork('creation-of-adam','The Creation of Adam','Michelangelo','c. 1511','High Renaissance','The_Creation_of_Adam','portrait'),
 imageArtwork('night-watch','The Night Watch','Rembrandt van Rijn',1642,'Dutch Golden Age','The_Night_Watch','shimmer'),
 imageArtwork('las-meninas','Las Meninas','Diego Velázquez',1656,'Baroque','Las_Meninas','portrait'),
 imageArtwork('sunday-afternoon','A Sunday on La Grande Jatte','Georges Seurat','1884–1886','Neo-impressionism','A_Sunday_Afternoon_on_the_Island_of_La_Grande_Jatte','shimmer'),
 imageArtwork('impression-sunrise','Impression, Sunrise','Claude Monet',1872,'Impressionism','Impression,_Sunrise','water'),
 imageArtwork('wanderer','Wanderer Above the Sea of Fog','Caspar David Friedrich','c. 1818','Romanticism','Wanderer_above_the_Sea_of_Fog','water'),
 imageArtwork('last-supper','The Last Supper','Leonardo da Vinci','1495–1498','High Renaissance','The_Last_Supper_(Leonardo)','portrait'),
 imageArtwork('hay-wain','The Hay Wain','John Constable',1821,'Romanticism','The_Hay_Wain','water'),
 imageArtwork('flaming-june','Flaming June','Frederic Leighton',1895,'Academic art','Flaming_June','shimmer')
];
// Decode once; all frames sample local, downsampled pixel data.
const prepared=new Map();
export function prepareArtwork(artwork){
 if(artwork.sample)return Promise.resolve(artwork);
 if(prepared.has(artwork.id)){const hit=prepared.get(artwork.id);prepared.delete(artwork.id);prepared.set(artwork.id,hit);return hit;}
 const promise=(async()=>{
  const image=new Image();image.src=artwork.image;await image.decode();
  const surface=document.createElement('canvas');surface.width=480;surface.height=Math.round(480*image.height/image.width);
  const context=surface.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,surface.width,surface.height);
  const {data}=context.getImageData(0,0,surface.width,surface.height),w=surface.width,h=surface.height;
  const ratio=image.width/image.height,displayRatio=1.65,fw=Math.min(1,ratio/displayRatio),fh=Math.min(1,displayRatio/ratio);
  return {...artwork,sample(x,y,t,col,row){
   let u=(x-(1-fw)/2)/fw,v=(y-(1-fh)/2)/fh;
   if(u<0||u>1||v<0||v>1)return {glyph:' ',color:[6,12,24]};
   if(artwork.motion==='wave'){u+=Math.sin(v*20+t*.6)*.004;v+=Math.sin(u*15+t*.5)*.003;}
   else if(artwork.motion==='water'){u+=Math.sin(v*36+t*.65)*.004;v+=Math.cos(u*24+t*.45)*.002;}
   else {u+=Math.sin(t*.3)*.0015;v+=Math.cos(t*.35)*.001;}
   const px=Math.min(w-1,Math.max(0,Math.round(u*(w-1)))),py=Math.min(h-1,Math.max(0,Math.round(v*(h-1)))),i=(py*w+px)*4;
   const r=data[i],g=data[i+1],b=data[i+2],l=(r*.2126+g*.7152+b*.0722)/255;
   const shimmer=1+Math.sin(col*.14+row*.19-t*1.2)*.045;
   const glyphs=' .,:;i+tfLCOG@';
   return {glyph:glyphs[Math.min(glyphs.length-1,Math.floor(Math.pow(l,.78)*(glyphs.length-1)))],color:[r*shimmer*.83,g*shimmer*.83,b*shimmer*.83]};
  }};
 })();
 prepared.set(artwork.id,promise);if(prepared.size>6)prepared.delete(prepared.keys().next().value);promise.catch(()=>{if(prepared.get(artwork.id)===promise)prepared.delete(artwork.id);});return promise;
}
export function recolor([r,g,b],palette){
 if(palette==='original')return [r,g,b];
 const l=clamp((r*.25+g*.55+b*.2)/255);
 return palette==='amber'?[Math.round(65+l*190),Math.round(28+l*180),Math.round(12+l*100)]:[Math.round(35+l*220),Math.round(40+l*215),Math.round(38+l*207)];
}
