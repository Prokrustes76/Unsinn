let ctx, game, info, mouseX, mouseY, clicked
let WIDTH = 1000, HEIGHT = 800
let healer, tank, druid, mage, rogue
let monster = [], items = [], wands = []

window.onload = () => {
  ctx = document.getElementById('Canvas').getContext('2d')
  ctx.textBaseline = 'middle'

  init()
  setTimeout(loop, 800)
}

async function init() {
  info = new Info()
  game = new Game()
}

function loop() {
  game.upgrade()
  game.render()
  game.finalize()

  requestAnimationFrame(loop)
}

document.addEventListener('mousemove', mouseMoved)
document.addEventListener('mousedown', mouseDown)
document.addEventListener('keydown',   keyDown)

function mouseMoved(event) {
  mouseX = event.clientX
  mouseY = event.clientY
}

function mouseDown(event) {
  clicked = true
}

function keyDown(event) {
  if (game.phase == 0) return

  if (event.keyCode == 80) { 
    game.paused = !game.paused; 
    return 
  }

  if (event.keyCode == 27) 
    healer.timeCasting = 0
  
  if (game.paused) 
    changeKey(event.keyCode)
  else 
    healer.isSpellCast(String.fromCharCode(event.keyCode))
}

function changeKey(k) {
  {
    for (let s of healer.spells)
      if (!healer.spells.some(sp => sp.key == 
      String.fromCharCode(k)) && s.selected)
        s.key = String.fromCharCode(k)
  }
}

function isClicked() {
  if (!clicked) 
    return false
  clicked = false; 
  return true
}

function calcNumber(x, y) {
  x = Math.floor((x - 30) / 98)
  y = Math.floor((y -  6) / 98)
  return y * 19 + x
}

function circle(x, y, size, col, border) {
  ctx.fillStyle = col
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()
  if (!border)
    return
  ctx.strokeStyle = border
  ctx.lineWidth = 2
  ctx.stroke()
}

function rect(x, y, w, h, col, border) {
  if (!border) {
    ctx.fillStyle = col
    ctx.fillRect(x, y, w, h)
    return
  }
  ctx.strokeStyle = col
  ctx.lineWidth = border
  ctx.strokeRect(x, y, w, h)
}

function line(x1, y1, x2, y2, col, width) {
  ctx.strokeStyle = col
  ctx.lineWidth   = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function write(text, x, y, size, col, pos = 'center', shadow = true) {
  ctx.fillStyle = col
  makeShadow(true)
  ctx.textAlign = pos
  ctx.font = `${size}px Cousine`
  ctx.fillText(text, x, y)
  makeShadow(false)
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

function makeShadow(wanted) {
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowOffsetX = wanted ? 3 : 0
  ctx.shadowOffsetY = wanted ? 3 : 0
  ctx.shadowBlur = wanted ? 7 : 0
}

function rand(min, max, digits = 4) {
  let r = Math.random() * (max - min) + min
  return round(r, digits)
}

function round(amount, digits = 0) {
  return Math.round(amount* Math.pow(10, digits)) / Math.pow(10, digits)
}

function cheatA() {
  for (let e of game.enemies)
    e.hpCurr = 0

  healer.gold += 135
  for (let hero of game.party)
    hero.exp = 320

  do {
    game.inv.add(Item.findLoot())
  }
  while (game.inv.slots.some(slot => !slot.content))
}

function cheatB() {
  for (let e of game.party)
    if (!e.alive) {
      e.alive = true
      e.hpCurr = 100
    }
}