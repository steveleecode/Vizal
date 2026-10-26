import { GIFEncoder, quantize, applyPalette } from 'gifenc';
let jobs=[],frames=0;
self.onmessage=({data})=>{
 try{
  if(data.type==='init'){
   frames=data.frames;jobs=data.sizes.map(size=>({...size,canvas:new OffscreenCanvas(size.width,size.height),gif:GIFEncoder(),palette:null}));return;
  }
  if(data.type!=='frame')return;
  const bitmap=data.bitmap;
  for(const job of jobs){
   const ctx=job.canvas.getContext('2d',{willReadFrequently:true});
   ctx.fillStyle='#060c18';ctx.fillRect(0,0,job.width,job.height);
   const scale=Math.min(job.width/bitmap.width,job.height/bitmap.height),w=bitmap.width*scale,h=bitmap.height*scale;
   ctx.drawImage(bitmap,(job.width-w)/2,(job.height-h)/2,w,h);
   const pixels=ctx.getImageData(0,0,job.width,job.height).data;
   if(!job.palette)job.palette=quantize(pixels,128);
   job.gif.writeFrame(applyPalette(pixels,job.palette),job.width,job.height,{palette:job.palette,delay:data.delay,repeat:0});
  }
  bitmap.close();
  if(data.index===frames-1){
   for(const job of jobs){job.gif.finish();const bytes=job.gif.bytes();self.postMessage({type:'result',id:job.id,bytes},[bytes.buffer]);}
  }
  self.postMessage({type:'ready',index:data.index});
 }catch(error){self.postMessage({type:'error',message:error.message});}
};
