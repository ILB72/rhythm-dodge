// One-time, dependency-free PNG preprocessing for the generated sprite set.
// Background plates are intentionally excluded. Original files are never modified.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const folder = path.resolve(process.argv[2] || 'assets/generated');
const backdrop = (r,g,b) => Math.min(r,g,b) > 178 && Math.max(r,g,b)-Math.min(r,g,b) < 42;

function crc32(buffer) {
  let c=0xffffffff;
  for(const byte of buffer){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}
  return (c^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([len,name,data,crc]);
}
function decode(file) {
  const bytes=fs.readFileSync(file), idat=[];let w,h,depth,color,interlace;
  for(let at=8;at<bytes.length;){const n=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8),data=bytes.subarray(at+8,at+8+n);at+=12+n;
    if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);depth=data[8];color=data[9];interlace=data[12];}
    if(type==='IDAT')idat.push(data);if(type==='IEND')break;
  }
  if(depth!==8||![2,6].includes(color)||interlace!==0)throw new Error('지원 형식은 비인터레이스 8비트 RGB/RGBA PNG입니다.');
  const channels=color===6?4:3,bpp=channels,stride=w*channels,packed=zlib.inflateSync(Buffer.concat(idat)),raw=Buffer.alloc(stride*h);
  let src=0;
  for(let y=0;y<h;y++){const filter=packed[src++],row=y*stride,prior=row-stride;
    for(let x=0;x<stride;x++){const v=packed[src++],a=x>=bpp?raw[row+x-bpp]:0,b=y?raw[prior+x]:0,c=y&&x>=bpp?raw[prior+x-bpp]:0;let predict=0;
      if(filter===1)predict=a;else if(filter===2)predict=b;else if(filter===3)predict=(a+b)>>1;else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);predict=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}else if(filter!==0)throw new Error(`지원하지 않는 PNG 필터: ${filter}`);
      raw[row+x]=(v+predict)&255;
    }
  }
  const rgba=Buffer.alloc(w*h*4);for(let i=0,j=0;i<w*h;i++,j+=channels){const p=i*4;rgba[p]=raw[j];rgba[p+1]=raw[j+1];rgba[p+2]=raw[j+2];rgba[p+3]=channels===4?raw[j+3]:255;}
  return {w,h,rgba};
}
function encode(w,h,rgba) {
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  const rows=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++)rgba.copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function clean(sprite) {
  const {w,h,rgba}=sprite,size=w*h,seen=new Uint8Array(size),queue=new Int32Array(size);let read=0,write=0;
  const add=i=>{if(!seen[i]){const p=i*4;if(rgba[p+3]&&backdrop(rgba[p],rgba[p+1],rgba[p+2])){seen[i]=1;queue[write++]=i;}}};
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=1;y<h-1;y++){add(y*w);add(y*w+w-1);}
  while(read<write){const i=queue[read++],x=i%w,y=(i/w)|0;if(x)add(i-1);if(x+1<w)add(i+1);if(y)add(i-w);if(y+1<h)add(i+w);}
  let minX=w,minY=h,maxX=-1,maxY=-1;
  for(let i=0;i<size;i++){const p=i*4;if(seen[i])rgba[p+3]=0;else if(rgba[p+3]){const x=i%w,y=(i/w)|0;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
  if(maxX<minX)throw new Error('남은 아트워크 픽셀이 없습니다.');
  const ow=maxX-minX+1,oh=maxY-minY+1,out=Buffer.alloc(ow*oh*4);
  for(let y=0;y<oh;y++){const from=((minY+y)*w+minX)*4;rgba.copy(out,y*ow*4,from,from+ow*4);}
  return {w:ow,h:oh,rgba:out,removed:write};
}

const files=fs.readdirSync(folder).filter(name=>name.toLowerCase().endsWith('.png')&&!/^(background|bg)[-_]/i.test(name)&&!/-transparent\.png$/i.test(name));
for(const name of files){const output=name.replace(/\.png$/i,'-transparent.png'),sprite=clean(decode(path.join(folder,name)));
  fs.writeFileSync(path.join(folder,output),encode(sprite.w,sprite.h,sprite.rgba));
  console.log(`${name} -> ${output}: ${sprite.w}x${sprite.h}, made ${sprite.removed} edge-connected checker pixels transparent`);
}
