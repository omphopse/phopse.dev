export type TrackSample={x:number;y:number;distance:number;angle:number;curvature:number}
export type RaceCar={id:number;distance:number;speed:number;baseSpeed:number;laneOffset:number;passTimer:number;passDirection:number;laps:number;hue:number;accent:string;crashTimer:number;ghostTimer:number}
type Point={x:number;y:number}
type Segment={kind:'line';from:Point;to:Point}|{kind:'cubic';from:Point;c1:Point;c2:Point;to:Point}

export const CIRCUIT_PATH_D='M70 200 L790 200 C850 200 900 220 920 255 C940 290 915 325 875 325 C835 325 810 300 780 300 C750 300 730 320 720 345 C710 370 685 390 650 390 C615 390 590 370 575 350 C560 330 535 335 520 355 C505 375 480 390 450 390 C420 390 395 375 380 355 C365 335 340 335 320 350 C300 365 280 385 250 390 C220 395 180 380 160 350 C140 320 120 290 100 260 C80 230 70 215 70 200 Z'
const segments:Segment[]=[
  {kind:'line',from:{x:70,y:200},to:{x:790,y:200}},
  {kind:'cubic',from:{x:790,y:200},c1:{x:850,y:200},c2:{x:900,y:220},to:{x:920,y:255}},
  {kind:'cubic',from:{x:920,y:255},c1:{x:940,y:290},c2:{x:915,y:325},to:{x:875,y:325}},
  {kind:'cubic',from:{x:875,y:325},c1:{x:835,y:325},c2:{x:810,y:300},to:{x:780,y:300}},
  {kind:'cubic',from:{x:780,y:300},c1:{x:750,y:300},c2:{x:730,y:320},to:{x:720,y:345}},
  {kind:'cubic',from:{x:720,y:345},c1:{x:710,y:370},c2:{x:685,y:390},to:{x:650,y:390}},
  {kind:'cubic',from:{x:650,y:390},c1:{x:615,y:390},c2:{x:590,y:370},to:{x:575,y:350}},
  {kind:'cubic',from:{x:575,y:350},c1:{x:560,y:330},c2:{x:535,y:335},to:{x:520,y:355}},
  {kind:'cubic',from:{x:520,y:355},c1:{x:505,y:375},c2:{x:480,y:390},to:{x:450,y:390}},
  {kind:'cubic',from:{x:450,y:390},c1:{x:420,y:390},c2:{x:395,y:375},to:{x:380,y:355}},
  {kind:'cubic',from:{x:380,y:355},c1:{x:365,y:335},c2:{x:340,y:335},to:{x:320,y:350}},
  {kind:'cubic',from:{x:320,y:350},c1:{x:300,y:365},c2:{x:280,y:385},to:{x:250,y:390}},
  {kind:'cubic',from:{x:250,y:390},c1:{x:220,y:395},c2:{x:180,y:380},to:{x:160,y:350}},
  {kind:'cubic',from:{x:160,y:350},c1:{x:140,y:320},c2:{x:120,y:290},to:{x:100,y:260}},
  {kind:'cubic',from:{x:100,y:260},c1:{x:80,y:230},c2:{x:70,y:215},to:{x:70,y:200}},
]
const palette=['#F2C14E','#E65D4F','#63A7FF','#F4EEE2','#B489E8','#37CBB0','#FF8F3D','#F06292','#A9D83F','#3C7AF7']
export const CRASH_RESPAWN_SECONDS=5
export const GHOST_SECONDS=2
const COLLISION_GAP=20
const COLLISION_LANE_GAP=9
const distance=(a:Point,b:Point)=>Math.hypot(b.x-a.x,b.y-a.y)
const wrapAngle=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle))

function buildSamples():TrackSample[]{
  const points:Point[]=[]
  for(const segment of segments){
    if(segment.kind==='line'){
      const count=Math.max(2,Math.ceil(distance(segment.from,segment.to)/3))
      for(let step=0;step<count;step++){const t=step/count;points.push({x:segment.from.x+(segment.to.x-segment.from.x)*t,y:segment.from.y+(segment.to.y-segment.from.y)*t})}
    }else{
      for(let step=0;step<150;step++){const t=step/150,u=1-t;points.push({x:u*u*u*segment.from.x+3*u*u*t*segment.c1.x+3*u*t*t*segment.c2.x+t*t*t*segment.to.x,y:u*u*u*segment.from.y+3*u*u*t*segment.c1.y+3*u*t*t*segment.c2.y+t*t*t*segment.to.y})}
    }
  }
  points.push({...points[0]})
  let accumulated=0
  const samples=points.map((point,index)=>{if(index>0)accumulated+=distance(points[index-1],point);const previous=points[(index-1+points.length)%points.length],next=points[(index+1)%points.length];return{x:point.x,y:point.y,distance:accumulated,angle:Math.atan2(next.y-previous.y,next.x-previous.x),curvature:0}})
  for(let index=0;index<samples.length;index++){const prev=samples[(index-1+samples.length)%samples.length],next=samples[(index+1)%samples.length];const span=Math.max(1,((next.distance-prev.distance+accumulated)%accumulated));samples[index].curvature=Math.abs(wrapAngle(next.angle-prev.angle))/span}
  return samples
}
export const CIRCUIT_SAMPLES=buildSamples()
export const CIRCUIT_LENGTH=CIRCUIT_SAMPLES.at(-1)!.distance

export function sampleCircuit(distanceAlong:number):TrackSample{
  const distanceValue=((distanceAlong%CIRCUIT_LENGTH)+CIRCUIT_LENGTH)%CIRCUIT_LENGTH
  let low=0,high=CIRCUIT_SAMPLES.length-1
  while(low+1<high){const middle=(low+high)>>1;if(CIRCUIT_SAMPLES[middle].distance<=distanceValue)low=middle;else high=middle}
  const first=CIRCUIT_SAMPLES[low],second=CIRCUIT_SAMPLES[Math.min(low+1,CIRCUIT_SAMPLES.length-1)],span=second.distance-first.distance,t=span>0?(distanceValue-first.distance)/span:0
  return{x:first.x+(second.x-first.x)*t,y:first.y+(second.y-first.y)*t,distance:distanceValue,angle:first.angle+wrapAngle(second.angle-first.angle)*t,curvature:first.curvature+(second.curvature-first.curvature)*t}
}

export function createRace(carCount=8,seed=2026):RaceCar[]{
  let state=seed>>>0
  const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296}
  const count=Math.max(4,Math.min(10,Math.round(carCount)))
  return Array.from({length:count},(_,id)=>{const baseSpeed=95+random()*18;return{id,distance:CIRCUIT_LENGTH*(1-(id+.5)/count),speed:baseSpeed,baseSpeed,laneOffset:0,passTimer:0,passDirection:id%2===0?1:-1,laps:0,hue:Math.round(id*37+random()*14),accent:palette[id%palette.length],crashTimer:0,ghostTimer:0}})
}

export function getCarPose(car:RaceCar){
  const sample=sampleCircuit(car.distance),normalX=-Math.sin(sample.angle),normalY=Math.cos(sample.angle)
  return{x:sample.x+normalX*car.laneOffset,y:sample.y+normalY*car.laneOffset,angle:sample.angle,curvature:sample.curvature,laps:Math.floor(car.distance/CIRCUIT_LENGTH)}
}

export function advanceRace(cars:RaceCar[],deltaSeconds:number){
  const dt=Math.max(0,Math.min(deltaSeconds,.06)),total=CIRCUIT_LENGTH
  if(dt===0)return
  for(const car of cars){
    if(car.crashTimer>0){
      car.crashTimer=Math.max(0,car.crashTimer-dt)
      if(car.crashTimer===0){car.distance+=total*.04+car.id*26;car.speed=car.baseSpeed*.82;car.laneOffset=0;car.passTimer=0;car.ghostTimer=GHOST_SECONDS;car.laps=Math.floor(car.distance/total)}
    }else if(car.ghostTimer>0)car.ghostTimer=Math.max(0,car.ghostTimer-dt)
  }
  const onTrackCars=cars.filter(car=>car.crashTimer===0)
  const targets=onTrackCars.map(car=>{
    const pose=getCarPose(car),curvatureSpeed=Math.max(.62,1-Math.min(.38,pose.curvature*430)),ahead=onTrackCars.filter(other=>other.id!==car.id&&other.ghostTimer===0).map(other=>({other,gap:((other.distance-car.distance)%total+total)%total})).sort((a,b)=>a.gap-b.gap)[0]
    let target=car.baseSpeed*curvatureSpeed
    car.passTimer=Math.max(0,car.passTimer-dt)
    if(ahead&&ahead.gap<86&&ahead.gap>18&&ahead.other.speed<car.baseSpeed*.985&&pose.curvature<.0032&&car.passTimer===0){car.passTimer=2.6;car.passDirection=car.id%2===0?1:-1}
    if(car.passTimer>0){target=Math.max(target,car.baseSpeed*1.08);car.laneOffset+=((car.passDirection*12)-car.laneOffset)*Math.min(1,dt*2.8)}else car.laneOffset+=(0-car.laneOffset)*Math.min(1,dt*2.2)
    if(ahead&&ahead.gap<30&&car.passTimer===0)target=Math.min(target,ahead.other.speed*Math.max(.55,ahead.gap/30))
    return target
  })
  onTrackCars.forEach((car,index)=>{car.speed+=(targets[index]-car.speed)*Math.min(1,dt*(targets[index]>car.speed?1.9:3.8));car.distance+=car.speed*dt;car.laps=Math.floor(car.distance/total)})

  const activeCars=onTrackCars.filter(car=>car.ghostTimer===0)
  const collided=new Set<RaceCar>()
  for(let first=0;first<activeCars.length;first++)for(let second=first+1;second<activeCars.length;second++){
    const a=activeCars[first],b=activeCars[second],gap=Math.abs(a.distance-b.distance),separation=Math.min(gap,total-gap)
    if(separation<COLLISION_GAP&&Math.abs(a.laneOffset-b.laneOffset)<COLLISION_LANE_GAP){collided.add(a);collided.add(b)}
  }
  for(const car of collided){car.crashTimer=CRASH_RESPAWN_SECONDS;car.speed=0;car.passTimer=0;car.laneOffset=0}
}
