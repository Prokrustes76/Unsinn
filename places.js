class Town{
  constructor() { 
    this.name     = 'Town'
    this.pic      = info.town
    this.npcs     = this.createNPCs()
    this.objects  = []
  }

  createNPCs() {
    let list = []
    for (let i = 0; i < 4; i++)
      list.push(i < 3 ? new NPC(i): new Trainer(3))
    return list
  }

  createObjects() {
    let list = game.objects.filter(o => !(o instanceof Creature))
    for (let o of this.npcs) {
      list.push(o.button)
      if (o.pos.x < 800) {
        if (o.options)
          for (let b of o.options)
            list.push(b)
        if (o.products)
          for (let s of o.products.slots) 
            list.push(s)
      }
    if (this.npcs[3].pos.x > 600)
      this.npcs[3].optionStart()
    }
    this.objects = list
  }

  showWayBack() {
    if (game.enemies.length > 0) return
    ctx.drawImage(this.pic, 10, 10, 126, 91)
    write('Back To Town', 73, 113, 13, 'darkgoldenrod', 'center')
    if (isClicked() && mouseX > 10 && mouseX < 136 && mouseY > 10 && mouseY < 101) {
      Creature.resetValuesForStart()
      this.createObjects()
      game.phase = 2
      this.npcs[0].checkInventory()
    }
  }

  show() {
    for (let o of this.objects) 
      if (o.action) o.checkMouse()
    this.showBackground()
    for (let npc of this.npcs)
      if (npc.pos.x < 700)
        npc.show()
    for (let o of this.objects) 
      if (o.render) 
        o.render()
  }

  showBackground() {
    rect(0, 0, WIDTH, HEIGHT, '#000')
    write('Gold:',     810, 28, 30, 'goldenrod', 'left')
    write(healer.gold, 990, 28, 30, 'goldenrod', 'right')
    ctx.drawImage(info.forest, 10, 10, 126, 91)
    write('Enter The Forest', 73, 113, 13, 'rgb(0,100,0)', 'center')
    if (isClicked() && mouseX > 10 && mouseX < 136 && mouseY > 10 && mouseY < 101) {
      Creature.resetValuesForStart()
      game.phase = 1
    }
  }
}

class NPC {
  constructor(nr) {
    this.nr       = nr
    this.pic      = [info.smith, info.vendor, info.jeweler, info.trainer][nr]
    this.name     = ['Smith', 'Vendor', 'Jeweler', 'Trainer'][nr]
    this.pos      = {x : 1000, y : 48 + nr * 150 , w : 500, h : 154}
    this.button   = new Button(965, 50 + nr * 150, 30, 150, '◀', 'push', nr)

    if (this.nr != 3) {
      this.products = {size    : 40,
                       slots   : []}
      this.init(nr)
    }
  }

  init(nr) {
    if (nr != 3) {
      for (let i = 0; i < 12; i++) 
        this.products.slots.push(new Slot(i + 12 * (this.nr + 1)))
      this.fillVendorSlots()
    }
  }

  newItemForSmith(zufall) {
    let gibtsWand = Math.random() < .05
    let level = 69 + healer.inv[5].level + Math.round(Math.random() * .8)
    return gibtsWand ? new Weapon(level) : new Armor(zufall)
  }

  fillVendorSlots() {
    if (this.nr == 0) {
      let healLev = Math.floor((healer.level + 1) / 2)
      for (let i = 0; i < 12; i++) {
        let level = i < 6 ? healLev - 1 : healLev
        let zufall = Math.floor(Math.random() * 13) * 5 + level
        this.products.slots[i].putIntoSlot (this.newItemForSmith(zufall))
      }
      
    }
    if (this.nr == 1) {
      let lev = Math.floor(healer.level / 4)
      let list = [[0, 0],   [0, 1],   [0, 2],   [1, 0],   [1, 1],   [1, 2],
                  [2, lev], [4, lev], [3, lev], [3, lev], [3, lev], [3, lev]]
      for (let i = 0; i < 12; i++)
        this.products.slots[i].putIntoSlot (new Item(list[i][0], list[i][1]))
    }
  }

  checkInventory() {
    for (let s of this.products.slots)
      if (!s.content || game.timePassed - s.content.createdTime > 4 * 60 * 60) {
        let zufall = Math.floor(Math.random() * 13) * 5
            zufall += Math.floor((healer.level / 2) * (Math.random() * .5 + .5))
        s.content = this.newItemForSmith(zufall)
      }
  }
  
  show(x = this.pos.x, y = this.pos.y, w = this.pos.w, h = this.pos.h) {
    rect(x, y, w, h, '#333')
    ctx.drawImage(this.pic, 500, y + 5, 110, 144)

    if (this.name == 'Smith') 
      for (let s of this.products.slots)
        s.show()
    
  }

}

class Trainer extends NPC{
  constructor(nr, pos) {
    super(nr, pos)
    this.options = []
    this.phase   ='optionStart'
    this.optionStart()
  }

  show () {
    super.show()
  }

  clicked(button) {
    if (this.phase == 'playerPick'  && button.type == 'playerPick') 
      this.optionPlayer(button)
    if (this.phase == 'optionSpells')
      this.spellChosen(button)
    if (this.phase == 'optionStart' && button.text == 'Spells')
      this.optionSpells()
    if (this.phase == 'optionStart' && button.text == 'Talents')
      this.optionTalents()
    if (this.phase == 'indivTalents' && button.type.includes('indiv'))
      this.talentChosen(button)
       
    game.town.createObjects()
  }

  optionStart() {
    this.phase   ='optionStart'
    this.options = []
    for (let i = 0; i < 3; i++)
      this.options.push(new Button(625 + i * 120, 525, 100, 100, ['Spells', 'Talents', ''][i], 'TrainerOptions'))
  }

  optionSpells() {
    this.phase   ='optionSpells'
    this.options = []
    for (let i = 0; i < 12; i++)
      this.options.push(new Button(622 + (i % 6) * 60, 515 + Math.floor(i / 6) * 60, 56, 56, '', 'Spell'))
  }

  optionTalents() {
    this.phase   ='playerPick'
    this.options = []
    for (let i = 0; i < 5; i++)
      this.options.push(new Button(618 + i * 72, 550 , 68, 88, '', 'playerPick'))
  }

  showPlayerPick(button) {
    write("Upgrade a player's talents!", 800, 522, 18, 'goldenrod')
    let i = this.options.indexOf(button)
    let x = this.options[i].pos.x
    let y = this.options[i].pos.y
    let w = this.options[i].pos.w
    let h = this.options[i].pos.h
    game.party[i].show(x, y, w, h)
  }

  optionPlayer(i) {
    let nr        = this.options.indexOf(i)
    this.phase    = 'indivTalents'
    this.options  = []
    for (let i = 0; i < 5; i++)
      this.options.push(new Button(622 + i * 72, 580 , 60, 60, '', `indivTalent${nr}`, 3))
  }

  showIndivTalents(i) {
    let hero = game.party[i]
    game.party[i].show(622, 510, 50, 50, .7)
    write(`${hero.name} (${hero.type})`, 691, 524, 20, 'goldenrod', 'left')
    write(`Level: ${hero.level}  Levelpoints: ${hero.lvlPoints}`, 691, 549, 16, 'goldenrod', 'left')

    for (let j = 0; j < 5; j++) {
      hero.abilities[j].show(622 + j * 72, 578)
      if (hero.abilities[j].name == '')
        continue 
      for (let k = 0; k < 3; k++) {
        let lvl = hero.abilities[j].level
        let col = k < lvl ? 'goldenrod' : '#444'
        if (k == lvl && this.talentUpgradePossible(hero, hero.abilities[j])) {
          let val = (game.timeTotal % 60) / 60
          col = `rgb(${32 + 120 * val} ,${32 + 85 * val} ,32)`
        }
        circle(622 + j * 72 + 12 + k * 16, 578 + 48, 6, col, 'black')
      }
      }
  }

  talentChosen(button) {
    let nr     = this.options.indexOf(button)
    let hero   = game.party[button.type[button.type.length - 1] * 1]
    let talent = hero.abilities[nr]
    let cost   = [50, 150, 350][talent.level] 

    if (!this.talentUpgradePossible(hero, talent))
      return

    talent.upgrade(hero)
    healer.gold -= cost
  }

  talentUpgradePossible(hero, talent) {
    let cost  = [50, 150, 350][talent.level] 

    if (talent.name == '')
      return false
    if (healer.gold < cost)
      return false
    if (talent.level > 2)
      return false
    if (hero.lvlPoints < 1)
      return false
    return true
  }

  showSpellOptions(button) {
    let i = this.options.indexOf(button)
      let x = this.options[i].pos.x
      let y = this.options[i].pos.y
      game.spells[i].show(x, y, true, 56)
      if (!healer.spells.some(s => s.name == game.spells[i].name))
        rect(x, y, 56, 56, 'rgba(0, 0, 0, .8)')
      else {
        for (let j = 0; j < 3; j++) {
          let lvl = game.spells[i].level - 1
          let col = j < lvl ? 'goldenrod' : '#444'
          if (j == lvl && this.spellUpgradePossible(game.spells[i])) {
            let val = (game.timeTotal % 60) / 60
            col = `rgb(${32 + 120 * val} ,${32 + 85 * val} ,32)`
          }
          circle(x + 12 + j * 16, y + 48, 6, col, 'black')
        }
      }
  }

  spellUpgradePossible(spell, j) {
    let cost  = [50, 100, 200][spell.level - 1]

    if (!healer.spells.some(s => s.name == spell.name))
      return false
    if (healer.gold < cost)
      return false
    if (spell.level > 3)
      return false
    if (healer.lvlPoints < 1)
      return false
    return true
  }

  spellChosen(button) {
    let spell = game.spells[this.options.indexOf(button)] || button
    let cost  = [50, 100, 200][spell.level - 1]

    if (!this.spellUpgradePossible(spell))
      return
    spell.upgrade()
    healer.gold -= cost
  }
}



