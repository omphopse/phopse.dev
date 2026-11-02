import { useEffect, useRef, useState } from 'react'
import { advanceRace, CIRCUIT_PATH_D, CIRCUIT_SAMPLES, createRace, getCarPose, sampleCircuit, type RaceCar } from '../lib/circuitSimulation'
import type { CircuitQuality } from '../lib/osPreferences'

const grass=['#174835','#1c503a','#123e30','#20553b','#164330'],ink='#100C0D',asphalt='#292d2d',ivory='#E3DCD2',terra='#CC8B65'
function seeded(seed:number){let state=seed>>>0;return()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296}}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,radius:number){ctx.beginPath();ctx.roundRect(x,y,width,height,radius)}

function drawGrandstand(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,flip=1){
  ctx.save();ctx.translate(x,y);ctx.scale(1,flip);ctx.fillStyle='#102e28';rounded(ctx,0,0,width,height,4);ctx.fill();ctx.fillStyle='#CC8B65';ctx.fillRect(0,0,width,5);ctx.fillStyle='#AFA99B';
  for(let row=0;row<3;row++){ctx.fillRect(7,9+row*7,width-14,2);for(let seat=0;seat<Math.floor((width-16)/9);seat++){ctx.fillStyle=['#d6d1c5','#77937d','#a97863'][seat%3];ctx.fillRect(9+seat*9,12+row*7,4,2)}}
  ctx.restore()
}
function drawTree(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,shade:number){
  ctx.fillStyle='#102e27';ctx.beginPath();ctx.ellipse(x+3,y+5,radius*1.1,radius*.82,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=['#163e30','#1d5539','#246140'][shade%3];ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6f9773';ctx.beginPath();ctx.arc(x-radius*.25,y-radius*.26,radius*.43,0,Math.PI*2);ctx.fill()
}
function fitTransform(ctx:CanvasRenderingContext2D,width:number,height:number,dpr:number){const mobile=width<760,scale=mobile?Math.max(width/1000,height/390):Math.min(width/1000,height/390),scaleY=mobile?height/280:scale*.65,left=(width-1000*scale)/2,top=(height-600*scaleY)/2;ctx.setTransform(dpr*scale,0,0,dpr*scaleY,dpr*left,dpr*top);return{scale,scaleY,left,top}}

function drawStaticScene(ctx:CanvasRenderingContext2D,width:number,height:number,dpr:number){
  const random=seeded(4172);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#153f31';ctx.fillRect(0,0,width,height)
  for(let index=0;index<210;index++){const x=random()*width,y=random()*height,r=8+random()*55;ctx.fillStyle=grass[index%grass.length];ctx.globalAlpha=.11+random()*.13;ctx.beginPath();ctx.ellipse(x,y,r,r*(.18+random()*.23),random()*.3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1
  const transform=fitTransform(ctx,width,height,dpr)
  // Soft terrain contours add depth without changing the legibility of the circuit.
  ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle='#9bb08b';ctx.lineWidth=1
  for(let line=0;line<12;line++){ctx.beginPath();ctx.ellipse(510,300,440+line*13,245+line*7,-.12,Math.PI*.08,Math.PI*1.84);ctx.stroke()}ctx.restore()
  for(const [x,y,r,shade] of [[920,85,13,2],[950,118,10,0],[75,350,11,1],[100,500,13,2],[960,520,13,1],[925,550,10,0],[630,545,12,2],[680,540,8,1],[120,385,9,2],[730,100,8,2],[245,94,9,1],[565,540,9,0],[875,115,8,2]] as number[][])drawTree(ctx,x,y,r,shade)
  drawGrandstand(ctx,320,98,208,32);drawGrandstand(ctx,550,98,138,32);drawGrandstand(ctx,540,430,208,30,-1)
  // Pit building and paddock sit outside the start straight.
  ctx.fillStyle='#112f29';rounded(ctx,280,66,226,25,4);ctx.fill();ctx.fillStyle=ivory;ctx.fillRect(286,66,216,7);ctx.fillStyle='#829184';for(let bay=0;bay<8;bay++){ctx.fillRect(294+bay*25,78,16,9);ctx.fillStyle=terra;ctx.fillRect(294+bay*25,88,16,2);ctx.fillStyle='#829184'}
  ctx.fillStyle='#4a504d';ctx.beginPath();ctx.moveTo(300,132);ctx.lineTo(740,132);ctx.lineTo(758,150);ctx.lineTo(740,168);ctx.lineTo(300,168);ctx.closePath();ctx.fill();ctx.strokeStyle=ivory;ctx.lineWidth=2;ctx.setLineDash([12,9]);ctx.stroke();ctx.setLineDash([])
  // Runoff apron at the two most demanding corners.
  ctx.fillStyle='#98745e';ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(905,280,45,20,-.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(790,375,44,18,.04,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1
  const road=new Path2D(CIRCUIT_PATH_D)
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0e2b25';ctx.lineWidth=60;ctx.stroke(road)
  ctx.strokeStyle='#D8D2C4';ctx.lineWidth=52;ctx.stroke(road)
  ctx.strokeStyle=asphalt;ctx.lineWidth=44;ctx.stroke(road)
  // Fine asphalt grooves, kept subtle at desktop scale.
  ctx.save();ctx.strokeStyle='#454846';ctx.lineWidth=1.2;ctx.globalAlpha=.65;ctx.setLineDash([7,19]);ctx.stroke(road);ctx.restore()
  // Continuous, alternating kerbs follow the actual sampled road edge.
  for(let index=0;index<CIRCUIT_SAMPLES.length;index+=5){const sample=CIRCUIT_SAMPLES[index];if(sample.curvature<.002)continue;const nx=-Math.sin(sample.angle),ny=Math.cos(sample.angle);for(const side of [-1,1]){ctx.save();ctx.translate(sample.x+nx*side*27,sample.y+ny*side*27);ctx.rotate(sample.angle);ctx.fillStyle=(Math.floor(sample.distance/12)%2)?ivory:terra;rounded(ctx,-3,-2.5,6,5,1);ctx.fill();ctx.restore()}}
  // Pit-lane divider and a short service-entry connector.
  ctx.strokeStyle='#141c1b';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(300,150);ctx.lineTo(740,150);ctx.stroke();ctx.strokeStyle='#4d514f';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(300,150);ctx.lineTo(740,150);ctx.stroke();ctx.strokeStyle=ivory;ctx.lineWidth=1.5;ctx.setLineDash([10,8]);ctx.stroke();ctx.setLineDash([])
  ctx.strokeStyle='#141c1b';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(730,150);ctx.bezierCurveTo(755,160,770,180,790,200);ctx.stroke();ctx.strokeStyle='#454846';ctx.lineWidth=6;ctx.stroke()
  // Start/finish stripe and starting grid boxes on the main straight.
  const start=sampleCircuit(125),sx=-Math.sin(start.angle),sy=Math.cos(start.angle);ctx.strokeStyle=ivory;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(start.x-sx*24,start.y-sy*24);ctx.lineTo(start.x+sx*24,start.y+sy*24);ctx.stroke();ctx.fillStyle='#FAF8F4';
  for(let grid=0;grid<8;grid++){const gx=290+grid*48;ctx.globalAlpha=.65;ctx.fillRect(gx,183,18,7);ctx.fillRect(gx+23,210,18,7)}ctx.globalAlpha=1
  if(width<760){ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.textAlign='center';ctx.fillStyle=ivory;ctx.font='700 17px "DM Sans",sans-serif';ctx.fillText('IMOLA',width/2,height-130);ctx.fillStyle='#c9c2b5';ctx.font='9px "DM Mono",monospace';ctx.fillText('EMILIA-ROMAGNA · ITALY',width/2,height-112);ctx.restore()}else{ctx.fillStyle=ivory;ctx.font='700 17px "DM Sans",sans-serif';ctx.fillText('IMOLA',710,140);ctx.fillStyle='#c9c2b5';ctx.font='9px "DM Mono",monospace';ctx.fillText('EMILIA-ROMAGNA · ITALY',710,157)}
  // Low-profile barriers and marshal posts.
  for(const [x,y] of [[770,142],[790,142],[810,142],[830,142],[850,142],[870,142],[90,310],[95,330],[100,350],[930,350],[935,370]] as number[][]){ctx.fillStyle=ink;rounded(ctx,x,y,10,4,1.5);ctx.fill();ctx.fillStyle=ivory;ctx.fillRect(x+1,y+1,3,2);ctx.fillStyle=terra;ctx.fillRect(x+6,y+1,3,2)}
  return transform
}

function drawCars(ctx:CanvasRenderingContext2D,cars:RaceCar[],transform:{scale:number;scaleY:number;left:number;top:number},dpr:number){
  ctx.setTransform(dpr*transform.scale,0,0,dpr*transform.scaleY,dpr*transform.left,dpr*transform.top)
  for(const car of cars){
    const pose=getCarPose(car);ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle+Math.PI/2);ctx.fillStyle='#071a15';ctx.globalAlpha=.5;ctx.beginPath();ctx.ellipse(0,1,12,23,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1
    // Clean, high-contrast top-down car silhouettes stay readable at wallpaper scale.
    ctx.fillStyle='#111614';for(const x of [-7,4])for(const y of [-10,6]){ctx.beginPath();ctx.roundRect(x,y,3,7,1.2);ctx.fill()}
    ctx.fillStyle='#101514';ctx.beginPath();ctx.roundRect(-9,12,18,3.5,1.2);ctx.fill();ctx.beginPath();ctx.roundRect(-8,-16,16,2.5,1);ctx.fill()
    ctx.fillStyle=car.accent;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(2.5,-13);ctx.lineTo(4,-4);ctx.lineTo(6,6);ctx.lineTo(5,11);ctx.lineTo(3,14);ctx.lineTo(-3,14);ctx.lineTo(-5,11);ctx.lineTo(-6,6);ctx.lineTo(-4,-4);ctx.lineTo(-2.5,-13);ctx.closePath();ctx.fill()
    ctx.fillStyle='#f4efe4';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(1.2,-7);ctx.lineTo(1.2,6);ctx.lineTo(0,9);ctx.lineTo(-1.2,6);ctx.lineTo(-1.2,-7);ctx.closePath();ctx.fill()
    ctx.fillStyle='#15201d';ctx.beginPath();ctx.ellipse(0,-1,2.2,4.5,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c9bda8';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,-1,3.5,Math.PI*1.08,Math.PI*1.92);ctx.stroke()
    ctx.fillStyle='#fff2d4';ctx.fillRect(-1.5,-17,3,1.2);ctx.fillStyle=car.accent;ctx.fillRect(-7,13,14,1.6);ctx.restore()
  }
}

function StaticFallback({cars}:{cars:RaceCar[]}){return <div className="circuit-static-fallback" aria-hidden="true"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice"><path d={CIRCUIT_PATH_D} fill="none" stroke="#102e27" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round"/><path d={CIRCUIT_PATH_D} fill="none" stroke="#E3DCD2" strokeWidth="52" strokeLinecap="round" strokeLinejoin="round"/><path d={CIRCUIT_PATH_D} fill="none" stroke="#292d2d" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round"/><text x="710" y="140" fill="#E3DCD2" fontSize="17" fontWeight="700">IMOLA</text><text x="710" y="157" fill="#c9c2b5" fontSize="9" letterSpacing="1">EMILIA-ROMAGNA · ITALY</text>{cars.map(car=>{const pose=getCarPose(car);return <g key={car.id} transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle*180/Math.PI+90})`}><path d="M0 -17 L5 -8 L4 11 L10 15 L10 18 L-10 18 L-10 15 L-4 11 L-5 -8Z" fill={car.accent} stroke="#101b18" strokeWidth="2"/><rect x="-9" y="-17" width="18" height="4" rx="1" fill="#100C0D"/><circle r="3.3" cy="2" fill="#E3DCD2" stroke="#100C0D"/></g>})}</svg></div>}

export default function CircuitWallpaper({animated,paused,carCount,quality,resetKey}:{animated:boolean;paused:boolean;carCount:number;quality:CircuitQuality;resetKey:number}){
  const canvas=useRef<HTMLCanvasElement>(null),race=useRef<RaceCar[]>(createRace(carCount)),[fallback,setFallback]=useState(false),[reducedMotion,setReducedMotion]=useState(false)
  useEffect(()=>{race.current=createRace(carCount);},[carCount,resetKey])
  useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;setReducedMotion(media.matches);const change=(event:MediaQueryListEvent)=>setReducedMotion(event.matches);media.addEventListener?.('change',change);return()=>media.removeEventListener?.('change',change)},[])
  useEffect(()=>{
    const element=canvas.current;if(!element)return
    let context:CanvasRenderingContext2D|null=null
    try{context=element.getContext('2d',{alpha:false,desynchronized:true})}catch{setFallback(true);return}
    if(!context){setFallback(true);return}
    setFallback(false)
    const staticCanvas=document.createElement('canvas'),staticContext=staticCanvas.getContext('2d')
    if(!staticContext){setFallback(true);return}
    let width=0,height=0,dpr=1,transform={scale:1,scaleY:1,left:0,top:0},frame=0,lastFrame=0,lastTime=0,disposed=false,loopActive=false
    const raceCars=race.current
    const qualityScale=quality==='high'?1.5:quality==='balanced'?1.2:1
    const interval=quality==='low'?1000/30:quality==='balanced'?1000/45:1000/60
    const render=()=>{if(disposed)return;context!.setTransform(1,0,0,1,0,0);context!.drawImage(staticCanvas,0,0);drawCars(context!,raceCars,transform,dpr)}
    const canAnimate=()=>animated&&!paused&&!reducedMotion&&document.visibilityState!=='hidden'
    const tick=(time:number)=>{if(disposed)return;if(!canAnimate()){loopActive=false;render();return}if(time-lastFrame>=interval){if(lastTime)advanceRace(raceCars,Math.min(.06,(time-lastTime)/1000));lastFrame=time}lastTime=time;render();frame=requestAnimationFrame(tick)}
    const start=()=>{if(disposed||loopActive||!canAnimate())return;loopActive=true;lastTime=performance.now();lastFrame=lastTime-interval;frame=requestAnimationFrame(tick)}
    const resize=()=>{const rect=element.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(window.devicePixelRatio||1,qualityScale);element.width=Math.round(width*dpr);element.height=Math.round(height*dpr);staticCanvas.width=element.width;staticCanvas.height=element.height;staticContext.setTransform(1,0,0,1,0,0);staticContext.clearRect(0,0,staticCanvas.width,staticCanvas.height);transform=drawStaticScene(staticContext,width,height,dpr);render()}
    const visibility=()=>{if(document.visibilityState==='hidden'){cancelAnimationFrame(frame);loopActive=false;render()}else start()}
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;observer?.observe(element);window.addEventListener('resize',resize);resize();start()
    document.addEventListener('visibilitychange',visibility)
    return()=>{disposed=true;cancelAnimationFrame(frame);loopActive=false;observer?.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility)}
  },[animated,paused,carCount,quality,resetKey,reducedMotion])
  const fallbackCars=race.current
  return <div className="circuit-wallpaper" aria-hidden="true"><canvas ref={canvas} className="circuit-canvas"/>{fallback&&<StaticFallback cars={fallbackCars}/>}</div>
}
