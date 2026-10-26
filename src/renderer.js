import { recolor } from './artworks.js';
export function drawArtwork(ctx,artwork,columns,palette,time){
 const rows=Math.round(columns/1.65*8/15),width=columns*8,height=rows*15;
 if(ctx.canvas.width!==width||ctx.canvas.height!==height){ctx.canvas.width=width;ctx.canvas.height=height;}
 ctx.fillStyle='#060c18';ctx.fillRect(0,0,width,height);
 ctx.font='bold 14px "Courier New", monospace';ctx.textBaseline='top';
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const {glyph,color}=artwork.sample(col/(columns-1),row/(rows-1),time,col,row);
  const c=recolor(color.map(v=>Math.min(255,v*1.45)),palette);
  ctx.fillStyle=`rgb(${c.map(Math.round).join(',')})`;ctx.fillText(glyph,col*8,row*15);
 }
}
