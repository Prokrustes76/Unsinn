class GameObject {

  action() {
    if (game.paused || game.phase != 1) 
      return
    if (!this.act || !this.alive) 
      return
    this.regenAndHoTs()
    if (!this.isActive()) return
    this.getCurrentValues()
    this.act()
  }

  render() {
    this.show()  
    if (!this.isMouseOnMe()) return
    if (this.highLightable)  this.highLight()
    let objectForInfo = this.getContent ? this.getContent() : this
    if (this.hasInfo)        this.showInfo(Info.getInfo(objectForInfo))
  }

  checkMouse() {
    if (!this.isMouseOnMe()) return
    if (this.clickOnMe && isClicked()) {
      if (this.alwaysClickable || (!game.paused && game.phase != -1))
        this.clickOnMe()
    } 
  }

  isMouseOnMe(pos = this.getPos ? this.getPos() : this.pos) {
    return mouseX > pos.x && mouseX < pos.x + pos.w &&
      mouseY > pos.y && mouseY < pos.y + pos.h
  }

  highLight() {
    rect(this.pos.x, this.pos.y, this.pos.w, this.pos.h, 'rgba(150, 150, 150, .15')
  }

  showInfo(text = '') {
    let len = text.length * 20 + 8
    rect(770, 795 - len, 220, len, '#1a1a1a')
    rect(770, 795 - len, 220, len, '#333', 4)
    for (let i = 0; i < text.length; i++)
      write(text[i], 778, 810 - len + i * 20, 13, 'goldenrod', 'left')
    if (this instanceof Ability) ctx.drawImage(info.book,     913, 790 - len, 70, 70)
    if (this instanceof Enemy)   ctx.drawImage(info.horde,    918, 803 - len, 70, 110)
    if (this instanceof Ally)    ctx.drawImage(info.alliance, 905, 801 - len, 80, 100)
  }
}

class Item {

  constructor(nr, level = 0) {
    this.nr         = nr
    this.name       = ['Health Potion', 'Mana Bottle', 'Ankh', 'Scroll', 'Figurine', 'Mana Crystal'][nr] 
    this.level      = level 
    this.price      = [25,  40, 100,  50, 100, 0][nr] * (level + 1)
    this.prob       = Item.getProb[nr]
    this.power      = nr == 0 ? [100, 150, 210][level] :
                      nr == 1 ? [ 80, 120, 150][level] :
                      nr == 2 ? [120, 180, 250][level] :
                      nr == 3 ? [  5,  10,  15][level] :
                      nr == 4 ? [ 20,  30,  45][level] :
                                [ 70, 120, 200][level] 
                      
    this.CD         = nr >= 3 ? 0 : 5400 
    this.evoked     = [false, false, false, false, false, true][nr]
    this.consumable = true
    this.lastUse    = -10000
    this.pic        = nr == 5 ? info.talents[7][0] : info.items[nr]  
    if (nr == 3)    this.kind   = Math.floor(rand(0, 5))     // Scroll type
  }
  
  static nextUse = [0, 0, 0, 0, 0, 0]
  static getProb = [30, 30, 8, 25, 7]

  static getCumulProb() {
    let list = []
    Item.getProb.reduce((a,b,i) => list[i] = round((a + b),2),0);
    return list
  }

  static getLevel() {
    for (let i = 3; i > 0; i--) {
      if (game.difficulty > 20 + i * 25) return i
      if (game.difficulty > 11 + i * 25) 
        return Math.abs(round((game.difficulty - 11 - i * 25) / 9 + rand(-.5, .5), 0))
      }
    return 0
  }

  static findLoot() {
    let lootChancePerLevel = healer.level * 3 + game.difficulty * 1.5
    let armorLevel = Math.floor((game.difficulty - 12) / 12)
    armorLevel = Math.floor(rand(0, armorLevel))

    let loot
    
    if (rand(0, 100) < lootChancePerLevel) {
      if (rand(0, 100) < 45) {                      // Armor = 45%
        let level = Math.floor(rand(0, 13)) * 5 
        level += armorLevel
        loot = new Armor(level)
      }
      else if(rand(0, 100) < 40) {                  // Weapon = 40% von 55%, also 22%
        let level = Math.floor(rand(0, 6)) * 5
        level += armorLevel
        loot = new Weapon(level)
      }
      else {                                        // Anderes Item = Rest %, also 33% 
        let zufall = rand(0, 100)
        for (let number of Item.getCumulProb())
          if (zufall < number) {
            loot = new Item(Item.getCumulProb().indexOf(number), Item.getLevel())
            break
          }
      }
    }
    return loot
  }

  show(pos) {
    ctx.drawImage(this.pic, pos.x, pos.y, pos.w, pos.w)
  }

  usePossible() { 
    if (this.nr == 2 && !game.party.some(p => p.focussed && !p.alive)) 
      return false
    return game.timePassed >= Item.nextUse[this.nr]
  }

  use() { 
    Item.nextUse[this.nr] = game.timePassed + this.CD
    if (this.nr == 0) healer.gainHP  (this.power)
    if (this.nr == 1) healer.gainMana(this.power, 'item')
    if (this.nr == 2) game.party.find(p => p.focussed).resurrect(this.power)
    if (this.nr == 3) game.scrolls[this.kind] = {type : this.kind, 
                      level : this.level, until : game.timePassed + 5 * 60 * 60}
    if (this.nr == 4) game.newMember(new Ally(99, this.level))
    
    if (this.nr == 5) {
      healer.gainMana(this.power, 'item')
      let addTime = Math.max(mage.abilities[0].duration - 3600, mage.manaCrystal - game.timePassed)
      mage.manaCrystal = game.timePassed + addTime
    }
  }
}

class Button extends GameObject{

  constructor(x, y, w, h, text = '', type = 'normal', fromNPC) {
    super()
    this.pos             = { x : x, y : y, w : w, h : h}
    this.text            = text
    this.type            = type
    this.highLightable   = true
    this.alwaysClickable = true
    this.fromNPC         = fromNPC
    this.size            = this.type == 'normal' ? 11 : this.type == 'TrainerOptions' ? 20 : 25
  }

  show() {
    let col = game.buttons.indexOf(this) == game.statBox.mode ? '#454545' : '#1a1a1a'
    rect(this.pos.x, this.pos.y, this.pos.w , this.pos.h, col)
    rect(this.pos.x, this.pos.y, this.pos.w , this.pos.h, '#333', 4)
    this.showContent()
  }
  
  showContent() {
    if (this.type == 'Spell') 
      game.town.npcs[3].showSpellOptions(this)

    if (this.type == 'playerPick')
      game.town.npcs[3].showPlayerPick(this)

    for (let i = 0; i < 5; i++)
      if (this.type.includes(`vTalent${i}`))
        game.town.npcs[3].showIndivTalents(i)

    if (game.equipment.buttons.includes(this)) {
      let nr = game.equipment.buttons.indexOf(this)
      game.party.filter(p => !p.evoked)[nr].show(this.pos.x + 1, 219, 37, 31, .7)
      return
    } 
    write(this.text, this.pos.x + this.pos.w / 2, this.pos.y + this.pos.h / 2, this.size, 'goldenrod', 'center')
  }

  clickOnMe() {
    if (['Weapons', 'Armor'].includes(this.text)) 
      game.town.npcs[0].clicked(this)
    if (game.town.npcs[3].options.includes(this))
      game.town.npcs[3].clicked(this)
    if (this.type == 'normal') {
      if (game.equipment.buttons.includes(this)) {
        game.equipment.mode = game.equipment.buttons.indexOf(this)
        return
      }
      if (game.buttons.indexOf(this) == 3)
        game.statBox.clear()
      else
        game.statBox.mode = game.buttons.indexOf(this)
    }
    if (this.type == 'push') {
      this.text = (this.text == '▶') ? '◀' : '▶'
      if (this == game.statBox.button) {
        for (let i = 0; i < 4; i++)
          game.buttons[i].pos.x += this.pos.x > 100 ? -206 : 206
        game.statBox.pos.x += this.pos.x > 100 ? -206 : 206
        this.pos.x += this.pos.x > 100 ? -206 : 206
      }
      if (this == game.equipment.button) {
        for (let b of game.equipment.buttons)
          b.pos.x += this.pos.x > 100 ? -206 : 206
        game.equipment.pos.x += this.pos.x > 100 ? -206 : 206
        this.pos.x += this.pos.x > 100 ? -206 : 206
      }
      if (this == game.inv.button){
        let back = this == game.inv.button ? game.inv : game.equipment
        back.pos.x += this.pos.x > 100 ? -206 : 206
        this.pos.x += this.pos.x > 100 ? -206 : 206
      }
      if (!isNaN(this.fromNPC)) {
        let back = game.town.npcs[this.fromNPC]
        this.pos.x += (this.pos.x > 700) ? -500 : 500
        back.pos.x = this.pos.x + this.pos.w
        game.town.createObjects()
      }
    }
  }
}

class StatBox extends GameObject{
  constructor() {
    super()
    this.pushable = true
    this.mode     = 0
    this.pos      = {x : 4, y : 628, w : 202, h : 165}
    this.button   = new Button(212, 630, 25, 163, '◀', 'push')
  }

  show(x = this.pos.x, y = this.pos.y, w = this.pos.w, h = this.pos.h) {
    rect(x, y, w, h, '#1a1a1a')
    rect(x + 1, y + 2, w - 2, h - 2, '#333', 4)

    let text  = Info.getInfo(this)
    
    for (let i = 0; i < text.length; i++) { 
      let col = this.mode == 1 ? i == text.length - 1 ? '#AAA' : 'white' : 
      this.mode == 2 ? 'white' : game.party.find(p => p.name == text[i][0][0]).color 
      write(text[i][0][0], x + text[i][0][1], y + 33 + i * 17, 10, col, 'left')
      write(text[i][1][0], x + text[i][1][1], y + 33 + i * 17, 10, col, 'right')
      write(text[i][2][0], x + text[i][2][1], y + 33 + i * 17, 10, col, 'right')
    }
  }

  clear() {
    if (this.mode == 0)
      for (let p of game.party) p.damDealed = 0
    if (this.mode == 1) 
      for (let s of healer.spells) {
        s.healDone = 0
        s.overHeal = 0
      }
    if (this.mode == 2) {
      healer.manaBySpell = 0
      healer.manaByItem = 0
      healer.manaByReg = 0
      druid.abilities[0].damDone = 0
      druid.abilities[1].healDone = 0
      mage. abilities[2].healDone = 0
    } 
  }
}

class Inventory extends GameObject {
  constructor() {
    super()
    this.pushable = true
    this.slots    = []
    this.size     = 12
    this.pos      = {x : 3 , y : 465, w : 204, h : 155}
    this.button   = new Button(212, 467, 25, 151, '◀', 'push')
    for (let i = 0; i < this.size; i++) 
      this.slots.push(new Slot(i))
  }

  show(x = this.pos.x, y = this.pos.y, w = this.pos.w, h = this.pos.h,) {
    rect(x, y, w, h, '#333')
    for (let s of this.slots)
      s.show()
  }

  add(item) {
    if (this.slots.every(s => s.content)) 
      return 'full'
    this.slots.find(s => !s.content).putIntoSlot(item)
  }

}

class Slot extends GameObject{
  constructor(nr) {
    super()
    this.nr               = nr
    this.content          = undefined
    this.alwaysClickable  = true
    this.highLightable    = true
    this.hasInfo          = true
    this.selected         = false
    this.pos              = { x : 0, y : 0, w : 0, h : 0 }
  }

  getPos() { 
    if (this.nr < 12)
      return { x : game.inv.pos.x + 6 + (this.nr % 4) * 50,
               y : game.inv.pos.y + 6 + Math.floor(this.nr / 4) * 50,
               w : 43, 
               h : 43}
    let val = (game.town.npcs[0].products.slots.includes(this) ?  70 : 
               game.town.npcs[1].products.slots.includes(this) ? 220 : 370) + 
               Math.floor((this.nr % 12) / 6) * 60 


    return { x : 625 + (this.nr % 6) * 60 ,
             y : val,
             w : 50,
             h : 50}
  }

  show(name = undefined, pos = this.getPos()) {
    if (this.selected)
      rect(pos.x-3, pos.y-3, pos.w+6, pos.h+6,'#CCC')

    rect(pos.x, pos.y, pos.w, pos.h, '#1a1a1a')
    if (this.content == undefined) return 
    
    this.content.show(pos)
    if (!this.content.usePossible || this.content.usePossible()) 
      return

    rect(pos.x, pos.y, pos.w, pos.h, 'rgba(0,0,0,.6')
    let val = Math.ceil((Item.nextUse[this.content.nr] - game.timePassed) / 60)
    if (val < 0) return
    write(val, pos.x + pos.w / 2 - 1, pos.y + pos.h / 2 + 2, 22, '#888', 'center')

  }

  clickOnMe() { 
    if (!this.content) return

    if (this.nr >= 12) {
      this.buyItems()
      return
    }

    // SELLING ITEMS
    if (game.phase == 2) {
      let price = this.content.price || this.content.getPrice()
      healer.gold += Math.floor(price * game.sellFactor)
      this.content = undefined
      return
      
    } 

    if (!this.content.consumable) {
      this.selectMe()
      return
    } 

    else {
      if (!this.content.usePossible())
        return
      this.content.use()
      if (this.content.consumable) 
        this.content = undefined
      else this.selected = true
    }
  }

  buyItems() { 
    let price = Math.ceil((this.content.price || this.content.getPrice()) * game.buyFactor)
    if (healer.gold >= price && 
        game.inv.slots.some(s => !s.content)) {
          healer.gold -= price
          game.inv.add (this.content)
          if (!this.content.usePossible)          // Vendor hat sofort Ersatz-Potions etc.
            this.content = undefined
        }
  }

  selectMe() {
    for (let slot of game.inv.slots.filter(s => s != this))
      slot.selected = false
    this.selected = !this.selected
  }

  getContent() {
    return this.content
  }

  highLight() { 
    rect(this.pos.x, this.pos.y, this.pos.w , this.pos.h, 'rgba(150,150,150,.1')
  }

  putIntoSlot(item) { 
    this.content = item
  }
}

class Equipment extends GameObject{
  constructor() {
    super()
    this.mode     = 0
    this.pushable = true
    this.pos      = {x : 4, y : 215, w : 202, h : 240}
    this.button   = new Button(212, 217, 25, 238, '◀', 'push')
    this.buttons  = []
    this.parts    = []
    for (let i = 0; i < 5; i++)
      this.buttons.push(new Button(5 + i * 40,217,40,35))
    for (let i = 0; i < 9; i++)
      this.parts.push(new BodyPart(i))
  }

  show(x = this.pos.x, y = this.pos.y, w = this.pos.w, h = this.pos.h) {

    rect(x, y, w, h, '#1a1a1a')
    rect(x + 1, y + 2, w - 2, h - 2, '#333', 4)
    if (game.party[this.mode].isMale)
      ctx.drawImage(info.silhouette,   0 + 10, 0, 240, 500, x + 50, y + 43, 100 , 192)
    else
      ctx.drawImage(info.silhouette, 250 + 10, 0, 240, 500, x + 50, y + 35, 100 , 200)

  }
}

class BodyPart extends GameObject {
  constructor(nr) {
    super()
    this.nr       = nr
    this.name     = ['Head', 'Chest', 'Legs', 'Feet', 'Main Hand', 'Offhand', 'inv1', 'inv2', 'inv3']
    this.hasInfo  = true
    this.pos     
    this.alwaysClickable = true
  }

  getPos() {
    return { x : game.equipment.pos.x + [10,  10,  10,  160,  10, 160, 175, 175, 175][this.nr],
             y : game.equipment.pos.y + [45,  88, 197, 197, 142, 142, 45, 70, 95][this.nr],
             w : this.nr < 6 ? 36 : 20,
             h : this.nr < 6 ? 36 : 20}
  }

  getContent() {
    game.party[game.equipment.mode].inv[this.nr]
  }

  show(pos = this.getPos()) { 
    let x  = [102, 102,  92, 114,  66, 138][this.nr] + game.equipment.pos.x
    let y  = [ 60, 110, 160, 220, 142, 142][this.nr] + game.equipment.pos.y
    if (this.nr < 6)
      line(pos.x + 18, pos.y + 18, x, y, 'darkgoldenrod', 1)
    rect(pos.x, pos.y, pos.w, pos.h, '#333')
    this.showContent(pos)
  }

  getContent() {
    return game.party[game.equipment.mode].inv[this.nr]
  }

  showContent(pos) {
    if (this.getContent()) {
      this.getContent().show(pos)
    }
  }

  hasInfo() {
    if (this.getContent())
      return this.getContent()
  }

  clickOnMe() { 
    let slot = game.inv.slots.find(s => s.selected)
    if (!slot) return
    let replacing = game.inv.slots.find(s => s.selected).content
    if (!replacing) return
    let char = game.party[game.equipment.mode]
    let replaced = this.getContent()
    if (replacing.canEquip(this.nr, char))
    {
      char.tryEquip(this.nr, replacing) 
      slot.content = replaced
      slot.selected = false
    }
  }
}

