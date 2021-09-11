class Creature extends GameObject{ 
  constructor(nr) {
    super()
    this.nr           = nr
    this.pos          = {w : 80,
                         h : 100}
    this.alive        = true
    this.active       = true
    this.damReceived  = 0
    this.damDealed    = 0
    this.healDone     = 0
    this.hasInfo      = true
    this.lastAction   = rand(0, 100, 0) + game ? game.timePassed : 0
    this.lastUse      = game ? game.timePassed : 0
    this.web          = -1
    this.asleep       = -1
    this.dots         = [[], [], []]
    this.poisoned     = {dam : 0,   until : 0}
    this.armorDamaged = {debuff: 0, until: -1}
  }

  static resetValuesForStart() {
    game.party       = game.party.filter(p => !p.evoked)  
    game.nextWave   = game.timePassed - 1
    game.difficulty  = 18
    for (let p of game.party) {
      p.hots     = [[],[],[],[],[],[],[],[],[],[],[],[]]
      p.hpCurr       = p.pure.hpFull
      p.shielded     = 0
      p.lastAction   = game.timePassed + rand(0, 100)
      p.poisoned     = {dam : 0,   until : 0}
      p.armorDamaged = {debuff: 0, until: -1}
      p.web          = 0
      p.asleep       = 0
      p.leveledUp    = -Infinity
    }
    if (mage.imp)
      game.newMember(new Ally(98))

    tank.battleStance = tank.battleStance == Infinity ? Infinity : game.timePassed - 90 * 60 * 60
    tank.revenge = tank.revenge ? [] : undefined

    healer.manaCurr      = healer.pure.manaFull
    healer.lastAction2   = -500     // for Global CD
    healer.lastSpell     = -500     // for ManaReg only
    healer.freeSpell     = false
    healer.lastReg       = 0
    healer.timeCasting   = 0
    healer.currSpell     = -1
    healer.scrolls       = []

    for (let slot of game.inv.slots.filter(s => s.content)) {
      if (slot.content.evoked)
        slot.content = undefined
    }

    Item.nextUse = [0, 0, 0, 0, 0, 0]

    for (let s of game.scrolls)
      s.until = -1
    for (let s of healer.spells)
      s.lastTime         = -1500

    rogue.swiftness      = rogue.swiftness == -Infinity ? -Infinity : game.timePassed - 15 * 60
    mage.manaCrystal     = mage.manaCrystal == Infinity ? Infinity : game.timePassed + mage.abilities[0].duration - 3600

    game.localizeParty()
  }

  isActive() {
    return game.timePassed > Math.max(this.web, this.asleep) && this.alive
  }

  getCurrentValues() {
    if (this instanceof Enemy) {
      this.haste = this.pure.haste

      if (this.targeted)
        this.haste += rogue.slowPoison || 0

      return
    }

    this.powDam  = this.pure.powDam
    this.powHeal = this.pure.powHeal
    this.rs      = this.calcTotalRS()
    this.def     = this.pure.def
    this.crit    = this.pure.crit
    this.haste   = this.pure.haste
    this.threat  = this.pure.threat
    this.hpFull  = this.pure.hpFull

    if (this.armorDamaged.until < game.timePassed) 
      this.armorDamaged.debuff = 0
    else
      this.rs  = Math.max(this.rs - this.armorDamaged.debuff, 0)

    if (this instanceof Priest) {
      this.manaFull = this.pure.manaFull
      this.spirit   = this.pure.spirit
    }

    for (let i of this.inv.filter(item => item.stats)) {
      if (i.stats.cha == 'Armor')    this.rs       += i.stats.val
      if (i.stats.cha == 'Health')   this.hpFull   += i.stats.val
      if (i.stats.cha == 'Defence')  this.def      += i.stats.val
      if (i.stats.cha == 'Healing')  this.powHeal  += i.stats.val
      if (i.stats.cha == 'Damage')   this.powDam   += i.stats.val
      if (i.stats.cha == 'Crit')     this.crit     += i.stats.val
      if (i.stats.cha == 'Haste')    this.haste    += i.stats.val
      if (i.stats.cha == 'Spirit')   this.spirit   += i.stats.val
      if (i.stats.cha == 'Mana')     this.manaFull += i.stats.val
    }

    if (!game) return

    if (game.timePassed < game.scrolls[0].until)   this.hpFull  += 40 * (game.scrolls[0].level + 1)
    if (game.timePassed < game.scrolls[1].until)   this.rs      += 40 * (game.scrolls[1].level + 1)
    if (game.timePassed < game.scrolls[2].until)  {this.powDam  += 2  *  game.scrolls[2].level * .5
                                                   this.powHeal += 2}
    if (game.timePassed < game.scrolls[3].until)   this.crit    += 2  + game.scrolls[3].level * .5
    if (game.timePassed < game.scrolls[4].until)   this.haste   += 2  + game.scrolls[4].level * .5
    
    if (druid.MOTW) {
      this.hpFull   += [ 7,   15,  26][druid.abilities[2].level -1]
      this.manaFull += [ 7,   15,  26][druid.abilities[2].level -1]
      this.rs       += [15,   35,  60][druid.abilities[2].level -1]
      this.powDam   += [1/6, 1/2,   1][druid.abilities[2].level -1]
      this.crit     += [1/6, 1/2,   1][druid.abilities[2].level -1]
      this.haste    += [1/6, 1/2,   1][druid.abilities[2].level -1]
      if (this.powHeal)
        this.powHeal  += [1/6, 1/2,   1][druid.abilities[2].level -1]
    }

    if (this == tank) {
      this.rs += druid.abilities[0].valueArmor * tank.thorns
      this.rs *= tank.toughness
      if (tank.revenge && tank.revenge.length > 0)
        tank.abilities[4].revenge()
    }

    if (game.timePassed - this.swiftness <= 10 * 60)
      this.haste += rogue.abilities[2].level * 7

    if (this == healer)
      this.rs += healer.innerFire


    this.armor   = this.calcArmor() // Muss am Schluss wegen Scroll
  }

  show(x = this.pos.x, y = this.pos.y, w = this.pos.w, h = this.pos.h, proc = 1) { 
    let ratio = (this.hpFull - this.hpCurr) / this.hpFull
    
    if (this instanceof Ally)
      if (this.evoked)
        ctx.drawImage(this.pic, x, y, w, h)
      else {
        ctx.drawImage(info.portraits, this.pic.x, this.pic.y, 75, 100 * proc, x, y, w, h) 
        if (x != this.pos.x) return
      }
    if (this instanceof Enemy) {
      ctx.drawImage(this.pic, x, y, w, h)
      if (this.targeted) 
        ctx.drawImage(info.target, x + w / 2 - 40, y + h / 2 - 40, 80, 80)
    }

    if (this.web >= game.timePassed)
      ctx.drawImage(info.spiderWeb, x, y, w, h)

    rect(x, y, w, h * ratio, 'rgba(255,0,0,.35)')

    if (!this.alive) rect(x, y, w, h, 'rgba(0,0,0,.5)')
    else this.checkSpecial(0, this.pos)

    if (this instanceof Ally) this.showAllyStuff()
    
    if (this.focussed)
      rect(x - 1, y - 1, w + 2, h + 2, 'yellow', 2)
  }

  regenAndHoTs() {
    this.checkDoTs()
    if (this instanceof Ally) 
      this.checkHots()
    if (this instanceof Priest) 
      this.priestStuff() 
    if (this.shielded && game.timePassed > this.shieldedUntil) {
      healer.spells[4].overHeal += this.shielded
      this.shielded = 0
    }
  }

  checkDoTs() {
    if (this.poisoned.until >= game.timePassed) {
      this.isHurt(this.poisoned.dam, true) // true = ignore Armor
    }

    for (let i = 0; i < this.dots.length; i++) {
      if (this.dots[i].length == 0) continue
      
      for (let tic of this.dots[i].tics)
        if (tic != game.timePassed)
          continue
        else {
          druid.attack(this, this.dots[i].dam)
          this.dots[i].tics.splice(0, 1)
        }
    }
  }

  act() {
    if (game.timePassed < this.lastAction + 150 * (1 - this.haste / 100))
      return
    if (game.timePassed < this.web)    return
    if (game.timePassed < this.asleep) return
    this.doSpecial()
    this.chooseAction()
  }

  doSpecial() {
    if (game.enemies.length == 0)
      return

    if (game.timePassed < this.lastUse + this.specialCD * 60) 
      return
    
    this.lastUse = game.timePassed
  
    if (this == mage) {
      if (this.fireBlast <= game.timePassed) {
        info.sounds[18].play()
        this.fireBlast = game.timePassed + 12 * 60
        this.attackAll(mage.abilities[1].value)
      }
      if (game.timePassed >= mage.manaCrystal)
        mage.abilities[0].createManaCrystal()
    }

    if (this == druid && this.moonfire <= game.timePassed)
      druid.abilities[4].moonfire()

    if (this instanceof Enemy && this.special != '') {
      if (Math.random() <= rogue.kick) {
        info.sounds[23].play()
        return
      }

      if (this.special.includes('W')) {
        info.sounds[24].play()
        game.party[this.findSingleTarget()].web = game.timePassed + 480
      }

      if (this.special.includes('A')) {
        info.sounds[30].play()
        let target = this.findSingleTarget()
        game.party[target].armorDamaged.until  = game.timePassed + 15 * 60
        game.party[target].armorDamaged.debuff += 30
        this.hurting(game.party[target], this.value)
      }

      if (this.special.includes('M')) {
        info.sounds[28].play()
        let amount = (Math.random() * this.value + this.value) 
        healer.loseMana(amount, true)
        this.gainHP(amount * 2)
      }


      if (this.special.includes('H')) {
        info.sounds[26].play()
        this.heal(350 * (this.powHeal / 40), game.enemies.indexOf(this),undefined , 'Enemy')
      }

      if (this.special.includes('P')) {
        let target
        do {
          target = game.party[Math.floor(Math.random() * 5)]
        } while(!(target.alive && target.range < 2))
        info.sounds[25].play()
        target.poisoned.dam   = this.value / 150
        target.poisoned.until = game.timePassed + 20 * 60  
      }
    }
  }

  attackAll(dam) {
    dam = dam * [1, 0.6, 0.45, .4, .35][game.enemies.filter(en => en.hpCurr > 0).length]
    for (let e of game.enemies.filter(en => en.hpCurr > 0)) {
      this.attack(e, dam)
    }
  }

  calcDamage(factor = 1, dam) {
    let amount = dam || this.powDam * factor * rand(.9,1.1)
    this.wandDamage ? amount = this.wandDamage() + (this.powDam - 25) : amount
        
    if (this.canCrit()) amount *= 2

    this.name == 'Imp' ? mage.damDealed += amount : this.damDealed += amount
    return amount; 
  }

  canDefend() {
    return rand(0,100) < this.def
  }

  canCrit() {  
    let value = rand(0, 100, 2)
    this.checkSpecial('Swiftness', value)

    return value <= this.crit
  }

  isHurt(amount, ignoreArmor) {
    amount = this.checkSpecial(amount)
    
    this.damReceived += amount

    if (!ignoreArmor)
      amount *= (1 - this.armor / 100)
    
    if (this.shielded > 0) 
      this.shieldEffect(amount)

    else this.hpCurr -= amount
    if (this.hpCurr <= 0) this.dead()

    return amount
  }

  checkSpecial(amount = 0, pos) {

    //Revenge
    if (this.revenge && !pos && amount > 0) {
      this.revenge.push([amount * tank.abilities[4].value, game.timePassed])
    }

    //SunderArmor   (amount is here sunder, and pos is target...)
    if (amount == 'SunderArmor' && this == rogue) {
      pos.armor -= Math.random() < rogue.sunderArmor ? 1.5 : 0
      pos.armor = Math.max(pos.armor, 0)
      return
    }

    // Swiftness (amount is Swiftness, pos is critchance)
    if (amount == 'Swiftness' && this.swiftness > -Infinity && pos <= this.crit) {
      this.swiftness = game.timePassed + 10 * 60
      info.sounds[20].play()
    }
      
    //Battle Stance
    let val = game.timePassed - this.battleStance
    if (val >= 0 && val <= 600) {
      amount *= (1 - (tank.abilities[1].level) / 8)
      if (pos)
        ctx.drawImage(info.ironShield, pos.x, pos.y + 20, 80, 80)
    }
    else if (game.timePassed - this.battleStance >= 3600 && tank.hpCurr / tank.hpFull <= .4) {
      this.battleStance = game.timePassed
      info.sounds[16].play()
    }

    //Thorns
    if (tank == this && tank.thorns > 0) {
      ctx.drawImage(info.thorns, this.pos.x -5, this.pos.y -5, this.pos.w +10, this.pos.h +10)
    }

    //DoTs
    for (let i = 0; i < this.dots.length; i++)
      if (this.dots[i].length == 0 ||this.dots[i].tics.length == 0)
        continue
      else {
        if (pos) {
          ctx.drawImage(this.dots[i].pic, pos.x + pos.w - 20, pos.y, 20, 20)
          write(this.dots[i].tics.length, pos.x + pos.w - 10, this.pos.y + 12, 22, 'gold', 'center', 2)
        }
      }



    return amount
  }

  heal(amount, target, spell, att = 'Ally') {
    if (!game.party[target].alive) return 

    if (att == 'Enemy') {
      game.enemies[target].gainHP(amount)
      return
    }

    if (this.canCrit()) amount *= 2
    amount *= (this.powHeal / 40) * rand(.95, 1.05, 2)

    this.healDone += amount

    if (spell) {
      spell.healDone += amount
      spell.overHeal += Math.max(0, amount - (game.party[target].hpFull - game.party[target].hpCurr)) 
    }
    game.party[target].gainHP(amount)
  }

  gainHP(amount) {
    this.hpCurr = Math.min(this.hpFull, this.hpCurr + amount)
  }

  shieldEffect(amount) {
    let absorb = amount >= this.shielded ? this.shielded : amount
    healer.spells.find(s => s.name == 'Shield').healDone += absorb
    this.shielded -= absorb
    this.hpCurr -= Math.max(0, amount - absorb)
    if (this.shielded == 0) {
      healer.gainMana(game.spells[11].manaCost * game.spells[11].rapture, 'abil')
    }
  }

  dead() {
    if (this == healer) 
      game.gameOver()
    if (this instanceof Ally && game.party[healer.target] == this)
      healer.target = -1
    this.hpCurr   = 0
    this.active   = false
    this.alive    = false
    this.targeted = false
    this.hots     = [[],[],[],[],[],[],[],[],[],[],[],[]]
    this.dots     = [[], [], []]
  }

  resurrect(amount) {
    this.active   = true
    this.alive    = true
    this.hpCurr   = round(amount)
  }
}

class Ally extends Creature{
  constructor(nr, level) {
    super(nr)
    this.type       = Ally.types[nr]
    this.name       = ['Ansgar', 'Uther', 'Leya', 'Randal', 'Sala',
                       'Sibyl', 'Goor', 'Lagoth', 'Rhei'][nr]
    this.isMale     = [true, true, false, true, false, false, true, true, false][nr]
    this.exp        = 0
    this.level      = this.getLevel(this.exp)
    this.lvlPoints  = 0
    this.usedPoints = 0
    this.talents    = []
    this.hots       = [[],[],[],[],[],[],[],[],[],[],[],[]]
    this.pure       = {
      armor      : 0,
      powDam     : round([38, 38, 35, 35, 35, 25, 45, 50, 35][nr]),
      powHeal    : round([ 0, 40,  0, 40, 40, 40,  0,  0,  0][nr]),
      def        : round([ 8,  5, 10,  3,  3,  2,  2,  2,  4][nr]),
      crit       : round([ 5,  7, 14,  6,  8,  5,  7,  7,  8][nr]),
      haste      : round([ 0,  0, 28,  4, 17,  0,  5,  4,  8][nr]),
      threat     : round([62, 35, 12, 14, 13, 16, 13, 18, 14][nr]),
      hpFull     : round([500, 430, 380, 370, 350, 320, 330, 300, 350][nr] * rand(.95, 1.05), -1),
    }
    this.range         = [0, 0, 1, 1, 1, 2, 2, 2, 2][nr] || 0
    this.picNr         = [68, 30, 20, 3, 57, 27, 7, 2, 22][nr]
    this.pic           = {x : 8 + ((3 + this.picNr) % 11) * 80, 
                          y : 26 + Math.floor((3 + this.picNr) / 11) * 124}
    this.color         = ['Tan', 'Pink', 'Yellow', '#0070DE', 'Orange', 'White', '#8787ED', '#40C7EB', '#A9D271'][nr]
    this.focussed      = false
    this.shielded      = 0
    this.leveledUp     = -Infinity


    if (this.type == 'Warrior') {
      this.battleStance  = Infinity
      this.revenge       = undefined
      this.martyrdom     = 0
      this.toughness     = 1
      this.taunt         = 0
      this.thorns        = 0
    }

    if (this.type == 'Rogue') {
      this.sunderArmor   = 0
      this.bounty        = 0
      this.swiftness     = -Infinity
      this.kick          = 0
    }

    if (this.type == 'Druid') {
      this.efflorescence = false
      this.MOTW          = false
      this.roar          = 0
      this.moonfire      = Infinity
    }

    if (this.type == 'Mage') {
      this.manaCrystal   = Infinity
      this.fireBlast     = Infinity
    }


    this.abilities     = []

    for (let i = 0; i < 5; i++) {
      if (this.type == 'Warrior') this.abilities.push(new WarriorTalent(i))
      if (this.type == 'Paladin') this.abilities.push(new PaladinTalent(i))
      if (this.type == 'Rogue')   this.abilities.push(new RogueTalent(i))
      if (this.type == 'Shaman')  this.abilities.push(new ShamanTalent(i))
      if (this.type == 'Druid')   this.abilities.push(new DruidTalent(i))
      if (this.type == 'Priest')  this.abilities.push(new PriestTalent(i))
      if (this.type == 'Warlock') this.abilities.push(new WarlockTalent(i))
      if (this.type == 'Mage')    this.abilities.push(new MageTalent(i))
      if (this.type == 'Hunter')  this.abilities.push(new HunterTalent(i))
    }

    this.inv           = this.initInv(nr) 

    this.attackSound   = info.sounds[nr == 99 ? 5 : nr == 98 ? 29 : [0,, 1,, 2, 3,, 4,][nr]]
    this.attackSound.volume = .1
    
    if (nr > 90) {
      if (nr  == 98) {
        this.level = mage.abilities[3].level - 1
        let extraDam = ((mage.powDam * (1 + mage.crit / 100)  / (2.5 * (1 - mage.haste / 100))) - 22) / 3
        this.pure = {
          powHeal    : 0,
          powDam     : [  4,   6,   8][this.level] + extraDam,
          def        : [ 10,  10,  10][this.level],
          crit       : [  0,   0,   0][this.level],
          haste      : [  0,   5,  10][this.level],
          threat     : [  4,   5,   7][this.level],
          hpFull     : [150, 180, 210][this.level]
        }
        this.range  = 2
        this.name   = 'Imp'
        this.type   = 'Evoked'
        this.pic    = info.imp
        this.pos    = { x : 0, y : 0, w : 40, h : 40}
        this.evoked = Infinity
        this.color  = ['#999']
        this.evokedArmor = [100, 130, 175][this.level] 
      }
      
      if (nr  == 99) {
        this.pure = {
          powDam     : round([30, 42, 52][level] * rand(.95, 1.05), 1),
          powHeal    : 0,
          armor      : round([ 22,  25,  27][level] * rand(.95, 1.05), 1),
          def        : round([  5,   6,   7][level] * rand(.95, 1.05), 1),
          crit       : round([  5,   6,   7][level] * rand(.95, 1.05), 1),
          haste      : round([ 10,  12,  13][level] * rand(.95, 1.05), 1),
          threat     : round([ 30,  50,  70][level] * rand(.95, 1.05), 1),
          hpFull     : round([350, 470, 550][level] * rand(.95, 1.05), 1),
        }
        this.level  = level + 1
        this.name   = 'Skeleton'
        this.type   = 'Evoked'
        this.pic    = info.skeleton 
        this.pos    = { x : 0, y : 0, w : 80, h : 100}
        this.evoked = 60 * 60 * 5 + game.timePassed
        this.color  = ['#999']
        this.evokedArmor = [250, 420, 580][this.level - 1] * rand(.9,1.1)
      }
    }
    this.hpCurr  = this.pure.hpFull   
  }

  
  static types = ['Warrior', 'Paladin', 'Rogue', 'Shaman', 'Druid', 
                  'Priest', 'Warlock', 'Mage', 'Hunter']
  
  static biggestGapHP() {
    let target = [undefined, -1]
    for (let i = 0; i < game.party.length; i++)
      if (game.party[i].range < 2 && game.party[i].hpFull - game.party[i].hpCurr > target[1]) {
        target[1] = game.party[i].hpFull - game.party[i].hpCurr 
        target[0] = i
      }
    return target[0]
  }

  initInv(nr) {
    let list =  [[,new Armor(25), new Armor(30), new Armor(55), new Weapon( 0), new Armor(60)],
                 [,new Armor(25), new Armor(30), new Armor(55), new Weapon( 5),              ],
                 [,new Armor(25), new Armor(30), new Armor(55), new Weapon(20),              ],
                 [,new Armor(25), new Armor(50), new Armor(55), new Weapon(15),              ],
                 [,new Armor(25), new Armor(50), new Armor(55), new Weapon(15),              ],
                 [,new Armor(45), new Armor(50), new Armor(55), new Weapon(25),              ],
                 [,new Armor(45), new Armor(50), new Armor(55), new Weapon(25),              ],
                 [,new Armor(45), new Armor(50), new Armor(55), new Weapon(15),              ],
                 [,new Armor(25), new Armor(30), new Armor(55), new Weapon(25),              ]][nr] || []

    for (let i of list)
      if (i) {
        i.stats  = undefined
        i.price *= .6
      }

    return list 
  }

  calcTotalRS() {
    if (this.evoked) return this.evokedArmor
    let rs = 20
    for (let obj of this.inv)
      if (obj && obj.rs) rs += obj.rs
    return rs
  }

  calcArmor() {
    return 100 * this.rs / (this.rs + 550 + this.level * 100)
  }

  tryEquip(nr, armor) { 
    if (armor.canEquip(nr, this))
      this.equip(nr, armor)
  }

  equip(nr, armor) {
    this.inv[nr] = armor
  }

  getNr()  {
    return game.party.indexOf(game.party.find(p => p.focussed))
  }

  showAllyStuff(w = this.pos.w / 4) {
    for (let i = 0; i < this.hots.length; i++) {
      if (this.hots[i].length == 0) continue
      let pos = this.hots.filter(h => h.length > 0).indexOf(this.hots[i])
      let x = this.pos.x + pos * w
      healer.spells[i].show(x, this.pos.y, true, w)
      rect(x, this.pos.y, w, w, 'rgba(0,0,0,.2)')
      if (this.name != 'Imp')
        write(this.hots[i].length, x + w / 2, this.pos.y + w / 2 + 2, w - 2, 'white', 'center')
    }

    if (this.armorDamaged.until > game.timePassed) {
      ctx.drawImage(info.sunder, this.pos.x + this.pos.w - w - 8, this.pos.y - 2, w * 1.4, w * 1.4)
    }

    if (this.poisoned.until > game.timePassed) {
      let offSet = this.armorDamaged.until > game.timePassed ? w : 0
      ctx.drawImage(info.poison, this.pos.x + this.pos.w - w - 2, this.pos.y + offSet + 2, w * .8, w)
    }

    if (this.shielded > 0) {
      if (this.name == 'Imp') {
        ctx.drawImage(info.shieldPic, this.pos.x - 2, this.pos.y - 4, 44, 48)
        write(Math.ceil(this.shielded), this.pos.x + 2, this.pos.y + 34, 9, 'white', 'left', true)
      } 
      else {
        ctx.drawImage(info.shieldPic, this.pos.x - 8, this.pos.y - 8, 96, 116)
        write(Math.ceil(this.shielded), this.pos.x + 3, this.pos.y + 92, 12, 'white', 'left', true)
      }
    }

    if (this == rogue && this.swiftness - game.timePassed > 540) 
      ctx.drawImage(info.lightning, this.pos.x + 30, this.pos.y, 20, 100)

    if (this.leveledUp > game.timePassed) 
      ctx.drawImage(info.levelUp, this.pos.x, this.pos.y + 25, 80, 50)

    if (this instanceof Priest) {
      this.showMana()
      this.showSpells() 
      this.showBalken()
    }
  }

  clickOnMe() {
    if (this.focussed) { this.focussed = false ; return }
    for (let hero of game.party) hero.focussed = false
    this.focussed = true
    if (!healer.isCasting) healer.target = game.party.indexOf(this)
  }

  gainExp(amount) {
    if (this.evoked) return
    this.exp += amount
    if (this.level < this.getLevel())
      this.levelUp()
  }

  getLevel(exp = this.exp) {
    let necessaryXP = [0, 200, 600, 1200, 2000, 3000, 4200, 5600, 7200, 9000, 11000, 13200, 15600, 18200, 21000]
    for (let i = 0;  i < necessaryXP.length; i++)
      if (exp < necessaryXP[i]) 
        return i
  }

  levelUp() {
    this.leveledUp = game.timePassed + 6 * 60
    info.sounds[27].play()

    this.pure.hpFull  +=   9 +   3 * this.level
    this.pure.powDam  += .25 + .15 * this.level
    if (this.pure.powHeal > 0)
      this.pure.powHeal += .25 + .15 * this.level
    this.level ++
    this.lvlPoints++
    if (this instanceof Priest)
      this.levelUpPriest()
  }

  chooseAction() {
    this.attack()
  }

  attack(target = this.findTarget(), dam) {
    if (!target || target.canDefend())
      return

    if (target == this.findTarget()) {
      this.attackSound.play()
      this.lastAction = game.timePassed
      this.checkSpecial('SunderArmor', target)
    }

    target.isHurt(this.calcDamage(undefined, dam))
  }

  findTarget() {
    let list = game.enemies.filter (e => e.alive)
    return game.enemies.find(e => e.targeted) ||
           game.enemies.find(e => e.alive)
  }

  checkHots() { 
    for (let h of this.hots) { 
      if (h[0] && game.timePassed >= h[0][0]) { 
        let spell = healer.spells[this.hots.indexOf(h)]
        healer.heal(h[0][1] , game.party.indexOf(this), spell)
        h.splice(0,1)
      }
    }
  }

  healEfflorescence() {
    let target = Ally.biggestGapHP(); 
    this.heal(druid.abilities[1].value, target, druid.abilities[1])
  }

}

class Enemy extends Creature {
  constructor(nr) {
    super(nr)
    let  diff       = rand(.95, 1.05, 2)
    this.type       = ['Ogre', 'Troll', 'Bear', 'Giant Bat', 'Goblin', 'Spider', 'Mantis',
                       'Wild Cat', 'Boar', 'Lizard'][nr]
    this.pure       = {}                  
    this.value      = Enemy.GetValues()[nr] * diff
    //                 W = Web, P = Poison, S = Self-Heal
    this.special    = ['', 'P','A','M','P','W','P','A','', 'H'][nr]
    //                 Ogr Tro Bea Bat Gob Spi Man Cat Boa Liz
    this.powDam     = [90, 63, 55, 30, 39, 46, 42, 52, 49, 49][nr] * diff * 1.3
    this.powHeal    = [ 0,  0,  0,  0,  0,  0,  0,  0,  0, 40][nr] * diff
    this.armor      = [28, 25, 30, 16, 22, 23, 31, 20, 22, 27][nr] * diff
    this.def        = [ 5,  7,  6,  3,  7,  5,  6, 10,  6,  6][nr] * diff
    this.pure.haste = [15, 24, 20, 30, 35, 15, 35, 35, 22, 12][nr] * diff
    this.aoe        = [15, 10, 15, 35,  0,  5,  5,  0, 20, 20][nr] * diff
    this.crit       = [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0][nr]
    this.specialCD  = [ 0, 13,  7, 10, 13, 14, 13,  7,  8, 15][nr]
    this.picReduce  = [ 0,  1,  0,  3,  3,  2,  2,  2,  1,  1][nr]
    this.crit       = 0

    this.hpFull     = [2300, 1750, 2000, 1050,  850, 1250, 1250, 1150, 1750, 1300][nr] * diff * 1.1
    this.hpCurr     = this.hpFull   

    this.targeted   = false
    this.pic        = info.monsters[nr]
    this.pos        = { w: this.pic.width - this.picReduce * 10, h: this.pic.height - this.picReduce * 15 }
    this.pos.y      = this.picReduce * 15
    this.attackSound  = info.sounds[nr + 6]
    this.attackSound.volume = .2

    this.powDam -= druid.roar
    }

    static GetValues() {
      return [30, 20, 18, 10, 10, 14, 16, 14, 14, 15]
    }

    clickOnMe() {
      if (!this.alive) return
      if (this.targeted) { this.targeted = false; return }
      else for (let e of game.enemies) 
        e.targeted = false
      this.targeted = true
    }

    chooseAction() { 
      if (rand(0, 10, 1) < 2.5)
        this.attackSound.play()

      if (rand(0, 100) < tank.taunt)
        this.attackOne(0)
      else if (rand(0, 100) < this.aoe)
        this.attackAll()
      else this.attackOne()

      this.lastAction = game.timePassed
    }

    attackAll() { 
      for (let target of game.party.filter(p => p.alive))
        if (!target.canDefend())
          this.hurting(target, this.calcDamage(.3))
    }

    attackOne(target = this.findSingleTarget()) {
      if (!game.party[target].canDefend())
        this.hurting(game.party[target], this.calcDamage())
    }

    hurting(target, amount) {
      if (target.thorns > 0) {
        this.isHurt(druid.abilities[0].valueDamage)
        druid.abilities[0].damDone += druid.abilities[0].valueDamage
      }

      if (target != tank && tank.martyrdom > 0) {
        tank.isHurt(amount * tank.martyrdom)
        tank.martyrdomDamage = tank.martyrdomDamage || 0
        tank.martyrdomDamage += amount * tank.martyrdom
        amount *= (1 - tank.martyrdom)
      }

      target.isHurt(amount)
    }

    findSingleTarget() {
      let totalThread = 0
      for (let hero of game.party.filter(p => p.alive))
        totalThread += hero.threat
      let zufall = rand(0, totalThread)
      let accum = 0
      for (let hero of game.party.filter(p => p.alive)) {
        accum += hero.threat
        if (accum >= zufall) {
          return game.party.indexOf(hero)    
        }
      }
    }

  dead() {
    super.dead()
    healer.gold += round(this.value * rand(.3 , .4))
    for (let p of game.party.filter(p => p.alive))
        p.gainExp(this.value)
  }
}

class Priest extends Ally {
  constructor(nr, type, pure, range) {
    super(nr, type, pure, range)
    this.pure.manaFull = 500
    this.manaCurr      = this.pure.manaFull
    this.pure.powHeal  = 40
    this.pure.powDam   = 25
    this.pure.spirit   = 50
    this.pure.crit     = 5
    this.innerFire     = 0
    this.combatRegen   = 0
    this.spells        = []
    this.target        = 1
    this.lastAction2   = -500     // for Global CD
    this.lastSpell     = -500     // for ManaReg only
    this.freeSpell     = false
    this.lastReg       = 0
    this.timeCasting   = 0
    this.currSpell     = -1
    this.manaByReg     = 0
    this.manaBySpell   = 0
    this.manaByItem    = 0
    this.gold          = 0

    this.newSpellAvailable()

    for (let i = 0; i < this.spells.length; i++)
      this.spells[i].key = ['A', 'W', '1', 'Q', '4'][i]
  }

  newSpellAvailable() {
    //if (!this.spells.some(s => s.name == 'Lesser Heal'))        this.spells.push(new Spell(0))
    //if (!this.spells.some(s => s.name == 'Flash Heal'))        this.spells.push(new Spell(1))
    if (!this.spells.some(s => s.name == 'Regrowth'))        this.spells.push(new Spell(2))
    //if (!this.spells.some(s => s.name == 'Rejuvenation'))        this.spells.push(new Spell(3))
    if (!this.spells.some(s => s.name == 'Renew')) this.spells.push(new Spell(4))
    //if (!this.spells.some(s => s.name == 'Riptide'))        this.spells.push(new Spell(5))
    //if (!this.spells.some(s => s.name == 'Lifebloom'))        this.spells.push(new Spell(6))
    //if (!this.spells.some(s => s.name == 'Heal Prayer'))        this.spells.push(new Spell(7))
    //if (!this.spells.some(s p=> s.name == 'Wildgrowth'))        this.spells.push(new Spell(8))
    if (!this.spells.some(s => s.name == 'Binding Heal'))  this.spells.push(new Spell(9))
    if (!this.spells.some(s => s.name == 'Holy Nova') && this.level > 0) this.spells.push(new Spell(10))
    if (!this.spells.some(s => s.name == 'Shield') && this.level > 0) this.spells.push(new Spell(11))
    for (let s of this.spells) {
      s.pos.x = 508 - this.spells.length * 36 + this.spells.indexOf(s) * 72
    }
  }

  onGlobalCD() {
    return game.timePassed < this.lastAction2 + game.globalCD
  }

  levelUpPriest() {
    this.newSpellAvailable()
    this.pure.manaFull += 10 +   6  * this.level
    this.pure.spirit   += .4 + .06 * this.level
    for (let s of game.spells) {
      s.manaCost    *= 1.05
      s.instHeal    *= 1.03
      s.ticPower    *= 1.03
      s.extra       *= 1.03
      s.adaptSpellsToNorm()
    }
    game.combineAll()
  }

  showSpells() {
    rect(500 - 38 * this.spells.length, 690, 76 * this.spells.length, 76, '#151515')
    for (let s of this.spells)
      s.show()
  }

  showMana(x = this.pos.x, y = this.pos.y) {
    let ratio = 1 - this.manaCurr / this.manaFull
    rect(x,      y + 100, 80,          8, 'blue')
    rect(x + 80, y + 100, -80 * ratio, 8, 'skyblue')
  }

  isSpellCast(key) { 
    for (let s of this.spells) {
      if (this.isCasting()) return
      if (s.key != key) continue
      if (!this.spellPossible(s)) return
      if (s.duration == 0) 
        this.itsInstant(s)
      else this.itsDura(s)
    }
  }

  itsInstant(spell) {
    this.target = this.getNr()
    spell.execute()
  }

  itsDura(spell) {
    this.currSpell = this.spells.indexOf(spell)
    if (this.timeCasting == 0) {
      this.target = this.getNr()
      this.timeCasting++
    }
  }

  isCasting() {
    return this.timeCasting > 0
  }

  isFinished(dura) {
    return this.timeCasting >= dura * (1 - this.haste / 100)
  }

  spellPossible(s) {
    if (!game.party.find(p => p.focussed).alive) return false
    if (s.onSpecialCD()) return false
    if (this.web >= game.timePassed) return
    if (!this.active || this.onGlobalCD()) return false
    if (this.manaCurr < s.manaCost && !this.freeSpell) return false
    if (game.party.some(p => p.focussed && p.alive && this.target == -1)) {
      healer.target = this.getNr()
      return true
    }
    if (this.target == -1) return false
    return true
  }

  manaRegen() {
    if (game.timePassed >= this.lastSpell + 300) 
      this.gainMana(this.spirit / 2, 'reg')
    else 
    this.gainMana(this.spirit / 2 * this.combatRegen, 'reg')
  }

  loseMana(amount, drain = false) {
    if (!drain)
      this.lastSpell = game.timePassed
    this.manaCurr -= amount
  }

  gainMana(amount, way) {
    if (way == 'reg')  this.manaByReg   += Math.min(this.manaFull - this.manaCurr, amount)
    if (way == 'item') this.manaByItem  += amount
    if (way == 'abil') this.manaBySpell += amount
    
    this.manaCurr = Math.min(this.manaFull, this.manaCurr + amount)

    if (way == 'reg')
      this.lastReg  = game.timePassed
  }

  showBalken() {
    let y = 637
    if (!this.isCasting()) return
    let dura = this.spells[this.currSpell].duration * (1 - this.haste / 100)
    ctx.drawImage(info.castBar, 0, 0, 260, 21, 350, y, 300, 31)
    ctx.drawImage(this.spells[this.currSpell].pic, 353, y + 6, 20, 22)
    let ratio = this.timeCasting / dura
    ctx.drawImage(info.castBar, 257, 25, -224 * ratio, 19, 380, y + 4, 268 * ratio, 26)
    write(this.spells[this.currSpell].name, 440, y + 17, 18,'white','center')
    let txt = (Math.round(((dura - this.timeCasting) / 60) * 10) / 10) + " / " + 
              (Math.round(((dura * (1 - this.haste / 100)) / 60) * 10) / 10) + " sec"
    write(txt, 640, y + 17, 18, 'white', 'right')
  }

  priestStuff() {
    if (this.isCasting()) {
      this.timeCasting++
      if (this.timeCasting >= this.spells[this.currSpell].duration * (1 - this.haste / 100)) {
      this.spells[this.currSpell].execute() 
      this.timeCasting = 0;
      }
    }
   
    if (game.timePassed > this.lastReg + 150) 
      this.manaRegen()
  }

  wandDamage() {
    return this.inv[4].power * rand(.9, 1.1, 2)
  }
}