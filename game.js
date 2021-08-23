class Game {
  constructor() {
    this.town         
    this.statBox      = new StatBox()
    this.inv          = new Inventory()
    this.equipment    = new Equipment()
    this.buttons      = []
    this.globalCD     = 90
    this.timePassed   = 0
    this.timeTotal    = 0
    this.paused       = false
    this.party        = []
    this.enemies      = []
    this.objects      = []
    this.spells       = []
    this.scrolls      = []
    this.loot         = []
    this.difficulty   = 16
    this.nextWave     = -1
    this.phase        = 0
    this.test         = false
    
    this.init()
  }
  
  init() {
     this.createObjectsAndArrys()
     this.gameStuff()   
  }

  createObjectsAndArrys() {
    for (let i = 0; i < 13; i++) {
      this.spells.push(new Spell(i))
      if (i < 5) {
        this.buttons.push(new Button([5,55,105,155][i], 630, 50, 20, 
        ['Damage', 'Spells','Misc.', 'Clear'][i]))
      } 
      if (i < 5) {
        this.party.push(new Ally([5, 0, 2, 4, 7, 8, 3, 3, 1][i]))
        this.scrolls.push({ type : i, level : 0, until : -10000})
      }
    }
    for (let b of this.equipment.buttons)
      this.buttons.push(b)
    this.buttons.push(this.inv.button)
    this.buttons.push(this.statBox.button)
    this.buttons.push(this.equipment.button)
    this.party[0] = new Priest(5)
    healer = this.party[0]
    tank   = this.party[1]
    rogue  = this.party[2]
    druid  = this.party[3]
    mage   = this.party[4]
    this.localizeParty()
  }

  newMember(member) {
    if (member.evoked)
      this.party = this.party.filter(p => !p.evoked)
    this.party.push(member)
    this.localizeParty()
    this.combineAll()
  }
  
  gameStuff() {
    this.inv.add(new Item(0, 0))
    this.inv.add(new Item(1, 0))
    this.sellFactor  = .25
    this.buyFactor   = 1
  }

  findEnemies() { 
    this.enemies = []
    if (this.timePassed <= this.nextWave) 
      return
    let list = []
    let values = Enemy.GetValues()
    do 
      list.push(Math.floor(Math.random() * values.length))
    while(list.reduce((p, e) => p + values[e], 0) < this.difficulty - 4)
    if (list.reduce((p, e) => p + values[e], 0) > this.difficulty || list.length > 5) 
      this.findEnemies()
    else {
      this.enemiesFound(list)
      for (let pl of game.party)
      pl.lastAction = game.timePassed
    }
  }


  enemiesFound(list) { 
    for (let li of list) 
      this.enemies.push(new Enemy(li))
    this.localizeEnemies()
    for (let p of this.party)
      p.lastAction = game.timePassed
    this.combineAll()
  }

  localizeEnemies() {
    let totalW = this.enemies.reduce((p, e) => p + e.pos.w, 0) + (this.enemies.length - 1) * 20
    for (let i = 0; i < this.enemies.length; i++) {
      if (i == 0) this.enemies[i].pos.x = WIDTH / 2 - totalW / 2
      else        this.enemies[i].pos.x = this.enemies[i - 1].pos.x + this.enemies[i - 1].pos.w + 20
    }
  }

  combineAll() { 
    this.objects = []
    this.objects.push(this.statBox)
    this.objects.push(this.inv)
    this.objects.push(this.equipment)

    for (let b of this.buttons)         this.objects.push(b) 
    for (let s of this.inv.slots)       this.objects.push(s)
    for (let p of this.party)           this.objects.push(p)
    for (let s of healer.spells)        this.objects.push(s)
    for (let e of this.enemies)         this.objects.push(e)
    for (let p of this.equipment.parts) this.objects.push(p)
  }

  localizeParty() {
    this.actualizeRange()
    for (let i = 0; i < this.party.length; i++) {
      let amount = this.party.filter(p => p.range == this.party[i].range).length
      let pos    = this.party.filter(p => p.range == this.party[i].range).indexOf(this.party[i])
      this.party[i].pos.x = 510 - amount * 50 + pos * 100
      this.party[i].pos.y = this.party[i].range * 120 + 240
      if (this.party[i].evoked) this.party[i].pos.x -= 15
    }
    this.party.sort((a,b) => a.nr - b.nr)
  }

  actualizeRange() {
    for (let i = 0; i < 2; i++) {
      if (!this.party.some(hero => hero.range == 0))
        for (let h of this.party) h.range--
      if (!this.party.some(hero => hero.range == 1))
        for (let h of this.party.filter(h => h.range == 2)) h.range--
    }
  }

  upgrade() {
    this.routines()

    if (this.phase == 2) 
      return

    if (!this.paused) 
      this.timePassed++

    for (let o of this.objects) { 
      o.checkMouse()
      o.action()
    }
    this.checkregularXPGain()
  }

  routines() {
    this.start()
    this.isCombatOver()
    if (mage.abilities[2])
      mage.abilities[2].refreshment()

    if (!this.objects.some(o => o instanceof Enemy && o.alive)) 
      this.findEnemies()    

    this.timeTotal++
    
    for (let pl of game.party)
      pl.getCurrentValues()
  }

  start() {
    if (this.phase == 0) {
      if (!this.town) 
        this.town = new Town()
      if (isClicked()) 
        this.phase++ 
      return
    }
  }

  checkregularXPGain() {
    if (this.timePassed % 600 != 599) return
    let xp = game.enemies.filter(e => e.alive).reduce((p, x) => p + x.value/10, 0)
    for (let p of this.party)
      p.gainExp(xp)
  }

  render() {
    if (this.phase == 0) {
      this.startScreen() 
      return
    }
    if (this.phase == 2) {
      this.town.show()
      return
    }

    this.background()
    this.town.showWayBack()

    for (let o of this.objects)
      o.render()
    if (this.paused) 
      this.pauseMode()
    if (this.phase == -1)
      this.gameOver()
  }

  finalize() {
    if (this.party.some(s => s.evoked > 0 && (s.evoked < game.timePassed || !s.alive))) {
      game.party.splice(this.party.indexOf(this.party.find(p => p.evoked < game.timePassed)), 1)
      game.localizeParty()
      this.combineAll()
    }
    game.thereIsInfo = false
    if (!game.paused)
      for (let s of healer.spells) s.selected = false
  }

  isCombatOver() { 
    if (this.enemies.length == 0) return
    if (!this.objects.some(o => o instanceof Enemy && o.alive)) 
      this.allEnemiesDead()
  }

  allEnemiesDead() { 
    this.nextWave = this.timePassed + rand(300,480, 0)
    this.objects = this.objects.filter(o => !(o instanceof Enemy))
    this.difficulty += 5
    game.inv.add(Item.findLoot())
    rogue.abilities[1].checkBounty()
  }

  startScreen() {
    rect(0, 0, WIDTH, HEIGHT, 'black')
    ctx.drawImage(info.startScreen, 125, 175)
  }

  background() {
    rect(0, 0, WIDTH, HEIGHT, '#000')
    let wid = Math.max(game.party.filter(p => p.range == 0).length,
                       game.party.filter(p => p.range == 1).length,
                       game.party.filter(p => p.range == 2).length)
    rect(WIDTH / 2 - wid * 45 - 30, 220, wid * 70 + 95, 395, '#121212')
    write('Gold:',     810, 28, 30, 'goldenrod', 'left')
    write(healer.gold, 990, 28, 30, 'goldenrod', 'right')
    write(round(game.difficulty), 5, 20, 25, '#555', 'left')

    this.showExtraStuff()
  }

  showExtraStuff() {
    this.showScrolls()

    if (druid.efflorescence)
      this.showEfflorescence()
    if (mage.abilities[2])
      mage.abilities[2].refreshment(true)
  }

  showEfflorescence() {
    var grd = ctx.createRadialGradient(500, 350, 10, 500, 350, 110)
    let val = Math.pow((game.timePassed % 300 - 150) / 150, 2)
    if (game.timePassed % 300 == 299) 
      druid.healEfflorescence()
      
    grd.addColorStop(0, `rgb( 18, ${Math.sin(val) * 120}, 18)`)
    grd.addColorStop(1, '#121212')
    ctx.fillStyle = grd
    ctx.fillRect(400, 230, 200, 240)
  }

  showScrolls() {
    if (this.scrolls.every(s => s.until < game.timePassed) && !druid.MOTW) 
      return

    let nr = -1
    for (let i = 0; i < this.scrolls.length; i++) {
      if (this.scrolls[i].until < this.timePassed) continue
      ctx.drawImage(info.scrolls[i], 934, 45 + ++nr * 66)
      let val = 1 - (game.scrolls[i].until - game.timePassed) / (60 * 60 * 5)
      rect(934, 45 + nr * 66, 56, 56 * val, 'rgba(0, 0, 0, .7')
    }
    if (druid.MOTW)
      ctx.drawImage(info.talents[4][2], 934, 45 + ++nr * 66)
  }

  pauseMode() {
    rect(270, 270, 460, 260, 'rgba(175,175,175,.35)')
    write('PAUSE', WIDTH/2, HEIGHT/2 - 40, 120, 'orange', 'center')
    write('Change Spell Keys', WIDTH/2, HEIGHT/2 + 40, 25, 'darkorange', 'center')
    write('or', WIDTH/2, HEIGHT/2 + 70, 25, 'darkorange', 'center')
    write('Check your Inventory', WIDTH/2, HEIGHT/2 + 100, 25, 'darkorange', 'center')
  }

  gameOver() {
    if (this.phase != -1) { this.phase = -1; return }
    rect(150, 310, 700, 180, 'rgba(175,175,175,.35)')
    write('GAME OVER', WIDTH / 2, HEIGHT / 2, 120, 'red', 'center')
  }

}