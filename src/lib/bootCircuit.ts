const liveries = ['#748e7c', '#b8bbb0', '#535d5d', '#ad7252']
export const launchAt = 4000
const waveSpacing = 174
export const passCount = 38
export const raceEnd = 8000

export function carLaunch(index: number, portrait = false) {
  const wave = Math.floor(index / 2)
  return launchAt + wave * waveSpacing + (index % 2) * (portrait ? 87 : 48)
    + Math.floor(wave / 5) * 36
}

export function createBootCircuit(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Circuit canvas unavailable')
  let width = 0
  let height = 0

  function shape(color: string, points: number[]) {
    ctx!.fillStyle = color
    ctx!.beginPath()
    ctx!.moveTo(points[0], points[1])
    for (let i = 2; i < points.length; i += 2) ctx!.lineTo(points[i], points[i + 1])
    ctx!.closePath()
    ctx!.fill()
  }

  return function render(ms: number) {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    const portrait = w < h
    const dpr = Math.min(devicePixelRatio || 1, portrait ? 1.25 : 1.5)
    if (width !== w || height !== h || canvas.width !== Math.round(w * dpr)) {
      width = w
      height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const t = ms / 1000
    const horizon = h * (portrait ? .46 : .48)
    const center = w * (.5 + .014 * Math.sin(t * .68))
    const road = w * (portrait ? .53 : .42)
    const travel = t * .21 + Math.max(0, t - 3.7) ** 1.6 * .36
    const project = (x: number, depth: number) => [center + x * road * depth, horizon + (h - horizon) * depth]
    const strip = (color: string, left: number, right: number, near: number, far: number) =>
      shape(color, [...project(left, near), ...project(right, near), ...project(right, far), ...project(left, far)])

    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#080e12')
    sky.addColorStop(.46, '#263b39')
    sky.addColorStop(.53, '#162522')
    sky.addColorStop(1, '#080c0d')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    shape('#101b1d', [0, horizon * .74, w * .12, horizon * .78, w * .23, horizon * .91,
      center, horizon, w * .79, horizon * .87, w, horizon * .67, w, horizon + 8, 0, horizon + 8])
    strip('#283032', -1.02, 1.02, 1.1, .005)
    strip('#1b2527', -.69, .69, 1.1, .005)

    for (let i = 0; i < 24; i++) {
      const phase = (i + travel * 4) % 24 / 24
      const near = .014 + phase ** 2.45 * 1.1
      const far = near * .91
      strip(i % 2 ? '#a3aaa2' : '#755548', -.99, -.93, near, far)
      strip(i % 2 ? '#a3aaa2' : '#755548', .93, .99, near, far)
      strip('#bac4bb', -.013, .013, near, near * .88)
      strip('#374343', -.88, .88, near, near * .991)
    }

    for (const side of [-1, 1]) {
      const [edge] = project(side * 1.28, 1.15)
      shape('#263638', [center, horizon, edge, h * .8, edge, h * .85, center, horizon + 2])
      for (let i = 10; i >= 0; i--) {
        const depth = 1 / (1.2 + ((i + 11 - travel % 11) % 11) * 1.3)
        const [x, y] = project(side * 1.18, depth)
        const lampHeight = h * .52 * depth
        const arm = road * depth * .28
        const lampX = x - side * arm
        const lampY = y - lampHeight
        ctx.fillStyle = '#526162'
        ctx.fillRect(x, lampY, Math.max(1, depth * 3), lampHeight)
        ctx.fillRect(Math.min(lampX, x), lampY, arm, Math.max(1, depth * 3))
        const lit = Math.min(1, Math.max(.08, (t - .12 * i) * 1.15))
        const radius = Math.max(3, depth * Math.min(w, h) * .19)
        const halo = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, radius)
        halo.addColorStop(0, 'rgba(239,227,194,.30)')
        halo.addColorStop(1, 'rgba(239,227,194,0)')
        ctx.globalAlpha = lit
        ctx.fillStyle = halo
        ctx.fillRect(lampX - radius, lampY - radius, radius * 2, radius * 2)
        ctx.fillStyle = '#f3ead1'
        ctx.fillRect(lampX - radius * .15, lampY, radius * .3, Math.max(1, depth * 4))
        strip('rgba(210,195,155,.12)', side * .57 - .095, side * .57 + .095, depth * 1.75, depth * .75)
        ctx.globalAlpha = 1
      }
    }

    const gantryDepth = Math.min(1.2, .105 + travel * .15)
    const [gantryX, gantryY] = project(0, gantryDepth)
    const gantryWidth = road * gantryDepth * 2.3
    const gantryTop = gantryY - h * gantryDepth * .69
    ctx.fillStyle = '#172224'
    const post = Math.max(2, gantryWidth * .023)
    ctx.fillRect(gantryX - gantryWidth / 2, gantryTop, post, gantryY - gantryTop)
    ctx.fillRect(gantryX + gantryWidth / 2 - post, gantryTop, post, gantryY - gantryTop)
    ctx.fillRect(gantryX - gantryWidth / 2, gantryTop, gantryWidth, post * 2)
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = t >= 2 + i * .35 && t < 4 ? '#ef845d' : '#465354'
      ctx.fillRect(gantryX + (i - 2.5) * post * 2.5, gantryTop + post * .45, post * 1.4, post)
    }

    const cars = []
    for (let i = 0; i < passCount; i++) {
      const age = ms - carLaunch(i, portrait)
      const lane = (i % 2 ? 1 : -1) * (.43 + (Math.floor(i / 2) % 3) * .06)
      if (i < 4 && age < 0) cars.push({ lane, depth: .09 + Math.floor(i / 2) * .035, i, alpha: 1 })
      const close = i === passCount - 1 || i === 14
      const lifetime = close ? 650 : portrait ? 440 : 610
      if (age >= 0 && age < lifetime) {
        const progress = age / lifetime
        const depth = .09 + (i < 4 ? Math.floor(i / 2) * .035 : 0) + progress ** 2.4 * (close ? 1.16 : .64)
        cars.push({ lane, depth, i, alpha: Math.min(1, i < 4 ? 1 : progress * 9, (1 - progress) * 8) })
      }
    }
    cars.sort((a, b) => a.depth - b.depth)
    for (const { lane, depth, i, alpha } of cars) {
      const [x, y] = project(lane, depth)
      const size = Math.min(w * (portrait ? .135 : .1), h * .19) * depth
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x, y)
      ctx.scale(size, size)
      shape('#101719', [-.69, .04, -.38, -.24, .38, -.24, .69, .04])
      ctx.fillStyle = '#080c0d'
      ctx.fillRect(-.53, -.31, .23, .3)
      ctx.fillRect(.3, -.31, .23, .3)
      shape(liveries[i % liveries.length], [-.42, -.19, -.25, -.32, -.12, -.48, .12, -.48, .25, -.32, .42, -.19])
      shape('#222b2c', [-.12, -.48, -.09, -.56, .09, -.56, .12, -.48])
      shape('#151e20', [-.53, -.2, .53, -.2, .49, -.13, -.49, -.13])
      shape('#b3b7a5', [-.47, -.21, .47, -.21, .45, -.19, -.45, -.19])
      shape('#e99263', [-.085, -.12, .085, -.12, .07, -.075, -.07, -.075])
      ctx.restore()
    }

    const grade = ctx.createLinearGradient(0, 0, 0, h)
    grade.addColorStop(0, 'rgba(0,0,0,.54)')
    grade.addColorStop(.48, 'rgba(0,0,0,0)')
    grade.addColorStop(1, 'rgba(0,0,0,.46)')
    ctx.fillStyle = grade
    ctx.fillRect(0, 0, w, h)
    const sweep = Math.max(0, 1 - Math.abs(t - 7.77) / .28)
    ctx.fillStyle = 'rgba(221,198,150,' + (sweep * .11) + ')'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,0,' + (Math.max(0, 1 - t / 1.65) * .88) + ')'
    ctx.fillRect(0, 0, w, h)
  }
}

