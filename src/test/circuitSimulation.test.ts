import { describe, expect, it } from 'vitest'
import { advanceRace, CIRCUIT_LENGTH, CIRCUIT_SAMPLES, createRace, CRASH_RESPAWN_SECONDS, getCarPose, GHOST_SECONDS, sampleCircuit } from '../lib/circuitSimulation'

describe('Circuit Run simulation', () => {
  it('creates a stable field and a continuous, closed course', () => {
    expect(createRace(8)).toEqual(createRace(8))
    expect(createRace(99)).toHaveLength(10)
    expect(createRace(1)).toHaveLength(4)
    expect(CIRCUIT_LENGTH).toBeGreaterThan(1000)
    expect(sampleCircuit(CIRCUIT_LENGTH + 12)).toMatchObject(sampleCircuit(12))
    expect(sampleCircuit(CIRCUIT_LENGTH).x).toBeCloseTo(sampleCircuit(0).x)
    expect(createRace(8).every(car=>car.baseSpeed>=95&&car.baseSpeed<113)).toBe(true)
  })

  it('keeps the Imola route wide and free of track crossings', () => {
    const orient = (a: typeof CIRCUIT_SAMPLES[number], b: typeof CIRCUIT_SAMPLES[number], c: typeof CIRCUIT_SAMPLES[number]) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
    const intersects = (a: typeof CIRCUIT_SAMPLES[number], b: typeof CIRCUIT_SAMPLES[number], c: typeof CIRCUIT_SAMPLES[number], d: typeof CIRCUIT_SAMPLES[number]) => orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0
    const edges=CIRCUIT_SAMPLES
    let crossing=false, crossingAt=''
    for(let first=0;first<edges.length-1;first++)for(let second=first+2;second<edges.length-1;second++){
      if(first===0&&second===edges.length-2)continue
      if(intersects(edges[first],edges[first+1],edges[second],edges[second+1])){crossing=true;crossingAt=`${first}/${second}: (${edges[first].x},${edges[first].y}) to (${edges[first+1].x},${edges[first+1].y}) crosses (${edges[second].x},${edges[second].y}) to (${edges[second+1].x},${edges[second+1].y})`;break}
    }
    expect(crossing,crossingAt).toBe(false)
  })

  it('advances cars smoothly and counts completed laps', () => {
    const cars = createRace(8)
    const initial = cars.map(car => car.distance)
    for (let frame = 0; frame < 12000; frame++) advanceRace(cars, 1 / 60)
    expect(cars.every((car, index) => car.distance > initial[index])).toBe(true)
    expect(cars.some(car => car.laps > 0)).toBe(true)
    expect(cars.every(car => Number.isFinite(getCarPose(car).angle))).toBe(true)
  })

  it('moves around a slower car on a straight and eases back toward the racing line', () => {
    const cars = createRace(4)
    const follower = cars[0]
    const leader = cars[1]
    follower.distance = 100
    follower.baseSpeed = 95
    follower.speed = 95
    leader.distance = 150
    leader.baseSpeed = 30
    leader.speed = 30
    advanceRace(cars, .06)
    expect(Math.abs(follower.laneOffset)).toBeGreaterThan(0)
    follower.passTimer = 0
    follower.laneOffset = 12
    leader.distance = 500
    advanceRace(cars, .06)
    expect(Math.abs(follower.laneOffset)).toBeLessThan(12)
  })

  it('hides crashed cars for five seconds, then lets them ghost for two seconds',()=>{
    const [first,second]=createRace(4).slice(0,2)
    first.distance=100;second.distance=110
    first.laneOffset=0;second.laneOffset=0
    advanceRace([first,second],.06)
    expect(first.crashTimer).toBe(CRASH_RESPAWN_SECONDS)
    expect(second.crashTimer).toBe(CRASH_RESPAWN_SECONDS)
    for(let frame=0;frame<84;frame++)advanceRace([first],.06)
    expect(first.crashTimer).toBe(0)
    expect(first.ghostTimer).toBe(GHOST_SECONDS)
    const respawnDistance=first.distance
    for(let frame=0;frame<10;frame++)advanceRace([first],.06)
    expect(first.distance).toBeGreaterThan(respawnDistance)
    expect(first.ghostTimer).toBeLessThan(GHOST_SECONDS)
    for(let frame=0;frame<24;frame++)advanceRace([first],.06)
    expect(first.ghostTimer).toBe(0)
  })
})
