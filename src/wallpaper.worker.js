import { Output, BufferTarget, CanvasSource, Mp4OutputFormat, Quality, canEncodeVideo } from 'mediabunny';
let output, source, canvas, context, settings;
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   settings=data;
   if(!await canEncodeVideo('avc',{width:data.width,height:data.height,frameRate:24,quality:new Quality('high')})){
    self.postMessage({type:'error',message:'This browser cannot encode MP4 at this resolution. Try Full HD or a current Chrome, Edge, or Safari.'});return;
   }
   canvas=new OffscreenCanvas(data.width,data.height);context=canvas.getContext('2d',{alpha:false});
   output=new Output({format:new Mp4OutputFormat({fastStart:'in-memory'}),target:new BufferTarget()});
   source=new CanvasSource(canvas,{codec:'avc',quality:new Quality('high'),keyFrameInterval:2});
   output.addVideoTrack(source,{frameRate:24});await output.start();self.postMessage({type:'ready'});return;
  }
  if(data.type!=='frame')return;
  const image=data.bitmap;
  context.fillStyle='#060c18';context.fillRect(0,0,canvas.width,canvas.height);
  const scale=(settings.fit==='cover'?Math.max:Math.min)(canvas.width/image.width,canvas.height/image.height);
  context.drawImage(image,(canvas.width-image.width*scale)/2,(canvas.height-image.height*scale)/2,image.width*scale,image.height*scale);image.close();
  await source.add(data.index/24,1/24);
  if(data.index===settings.frames-1){await output.finalize();const buffer=output.target.buffer;self.postMessage({type:'result',buffer},[buffer]);}
  else self.postMessage({type:'ready'});
 }catch(error){self.postMessage({type:'error',message:error.message||'MP4 export failed. Try a smaller resolution.'});}
};
