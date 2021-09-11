class Ability extends GameObject{
  constructor(nr) {
    super()
    this.nr       = nr
    this.healDone = 0
    this.damDone  = 0
    this.overHeal = 0
    this.lastTime = - 1500
    this.selected = false
    this.hasInfo  = true
    this.alwaysClickable = true
  }

  clickOnMe() { 
    if (!game.paused) return
    if (this.selected) this.selected = false
    else {
      for (let s of healer.spells) s.selected = false
      this.selected = true
    }
  }

  onSpecialCD() {
    return game.timePassed < this.lastTime + this.CD
  }

  execute() {
    this.lastTime      = game.timePassed
    if (healer.freeSpell)
      healer.freeSpell = false
    else healer.loseMana(this.manaCost)
    this.checkSpecial('Shield')
    if (this.duration == 0) {
      healer.lastAction  = game.timePassed
      healer.lastAction2 = game.timePassed
    }
    if (this.instHeal > 0) this.doInstHeal()
    if (this.ticNr    > 0) this.calcHoTs()
  }

  doInstHeal() { 
    let runs = this.targets == 5 ? game.party.length : this.targets
    for (let i = 0; i < runs; i++) {
      let tar = this.targets == 1 ? healer.target : i
      tar = this.checkSpecial('Bind', tar)
      healer.heal(this.instHeal, tar, this)
    }
  }

  calcHoTs() {
    for (let i = 0; i < this.targets; i++) {
      let tar = this.targets == 1 ? healer.target : i
      if (!game.party[tar].alive) 
        continue
      game.party[tar].hots[healer.spells.indexOf(this)] = []
      for (let nr = 1 - healer.haste / 100; nr <= this.ticNr; nr += 1 * (1 - healer.haste / 100))
        game.party[tar].hots[healer.spells.indexOf(this)].
        push([Math.round(60 * nr * this.ticBetw) + game.timePassed, this.getTicPower(nr)]); 
    }
  }

  getTicPower(nr) { 
    if      (this.name == 'Wildgrowth')
      return this.ticPower - 1.4 * nr
    else if (this.name == 'Lifebloom')
      return (nr + 1) * (1 - healer.haste / 100) >= this.ticNr ? this.extra * this.ticPower : this.ticPower
    else return this.ticPower
  }

  checkSpecial(casus, value) {
    if (casus == 'Bind') {
      if (this.name == 'Binding Heal') {
        if (value == 0) return healer.target
        if (value == 1) return this.findBindingPartner()
      }
      else return value
    }
    if (casus == 'Shield' && this.name == 'Shield') {
      game.party[healer.target].shielded = this.extra * (healer.powHeal / 40) * (healer.canCrit() ? 2 : 1)
      game.party[healer.target].shieldedUntil = game.timePassed + this.fadeShield
    }
  }
}

class Spell extends Ability {
  constructor(nr, healDone, overHeal) {
    super(nr, healDone, overHeal)
    this.name     = ['Lesser Heal', 'Flash Heal', 'Regrowth', 'Rejuvenation', 'Renew', 'Riptide', 'Lifebloom',
                     'Heal Prayer', 'Wildgrowth', 'Binding Heal', 'Holy Nova', 'Shield', 'Dispell'][nr]
    this.manaCost = [ 60,  95, 100,  60,  50, 110, 85, 105, 150, 110,  90,   70, 25][nr]
    this.duration = [150,  90, 120,   0,   0,   0,  0, 150,   0, 120,   0,    0,  0][nr]
    this.instHeal = [150, 200, 140,   0,   0,  50,  0, 100,   0, 125,  50,    0,  0][nr]
    this.CD       = [  0,   0,   0,   0,   0, 480,  0,   0, 900,   0,1200, 1200,  0][nr]
    this.ticNr    = [  0,   0,   7,   5,   5,  10,  15,  0,   7,   0,   0,    0,  0][nr]
    this.ticBetw  = [  0,   0,   3,   3,   3,   3,   1,  0,   1,   0,   0,    0,  0][nr]
    this.ticPower = [  0,   0,  15,  30,  25,  20,   8,  0,  16,   0,   0,    0,  0][nr]
    this.targets  = [  1,   1,   1,   1,   1,   1,   1,  5,   5,   2,   5,    1,  1][nr]
    this.extra    = [  0,   0,   0,   0,   0,   0,  10,  0,   0,   0,   0,  150,  0][nr]
    this.pic      = new Image()
    this.pic.src  = `./rsc/heal${nr}.jpg`
    this.pos      = { x : 472, 
                      y : 700, w : 56, h : 56}
    this.key      = ''  
    this.level    = 1
    this.rapture  = 0
    if (this.name == 'Shield') this.fadeShield = 30 * 60 
  }

  upgrade() {
    this.level++
    healer.lvlPoints--

    if (this.name == 'Regrowth') {
      this.ticPower *= 1.4
    }
    if (this.name == 'Renew') {
      this.instHeal = (this.level - 1) * .75 *  this.ticPower
    }
    if (this.name == 'Binding Heal') {
      this.manaCost *= .92
    }
    if (this.name == 'Holy Nova') {
      this.ticBetw = 2
      this.ticPower += 5
      this.ticNr = 3
    }
    if (this.name == 'Shield') {
      this.rapture  = [1/3, 2/3, 1] [this.level - 2]
      this.fadeShield += 5
      this.CD *= .9
    }
    
    this.adaptSpellsToNorm()
  }

  adaptSpellsToNorm() {
    for (let s of healer.spells)
      if (s.name == this.name) {
        s.manaCost = this.manaCost
        s.instHeal = this.instHeal
        s.CD       = this.CD
        s.ticBetw  = this.ticBetw
        s.ticPower = this.ticPower
        s.ticNr    = this.ticNr
        s.extra    = this.extra
      }
  }

  show(x = this.pos.x, y = this.pos.y, noKey, size = 56) {
    ctx.drawImage(this.pic, x, y, size, size)
    if (!noKey) {
      let val = (2 * game.timeTotal) % 50
      let col = !this.selected && (game.paused || this.key) ? '#222' : 
      `rgba(${val},${val},${val})`
      rect(x + 15, y + 58, 26, 26, col)
      write(this.key, x + 28, y + 71, 18, '#888', 'center')
      this.checkIfDarkened()
    }
  }

  checkIfDarkened() {
    if (healer.onGlobalCD() || this.onSpecialCD() || healer.manaCurr < this.manaCost) {
      rect(this.pos.x, this.pos.y, this.pos.w, this.pos.h, 'rgba(0,0,0,.6)')
      if (this.onSpecialCD()) {
        let duraLeft = Math.ceil((this.lastTime + this.CD - game.timePassed)/60)
        write(duraLeft, this.pos.x + 28, this.pos.y + 30, 30, '#AAA', 'center')
      }
    }
  }

  findBindingPartner() {
    let obj = {nr : -1, amount: -1}
    for (let p of game.party)
      if (p != game.party[healer.target] && p.hpFull - p.hpCurr > obj.amount) 
      obj = {nr : game.party.indexOf(p), amount : p.hpFull - p.hpCurr}
    return obj.nr
  }
}

class Talent extends Ability {
  constructor(nr) {
    super(nr)
    this.level       = 0
    this.valueDamage = 0
    this.valueArmor  = 0
    this.cost        = [50, 100, 150][nr]
  }

  show(x = this.pos.x, y = this.pos.y, noKey, size = 60) {
    if (this.pic)
      ctx.drawImage(this.pic, x, y, size, size)
  }

  upgrade(hero) {
    this.level++
    hero.lvlPoints--
  }
}

class WarriorTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['Taunt', 'BattleStance', 'Toughness', 'Martyrdom', 'Revenge'][nr]
    this.pic      = info.talents[0][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

  upgrade(hero) {
    super.upgrade(hero)

    if (this.name == 'Taunt') 
      tank.taunt += 13.33333

    if (this.name == 'BattleStance') 
      tank.battleStance = -Infinity

    if (this.name == 'Toughness')
      tank.toughness += .04

    if (this.name == 'Martyrdom')
      tank.martyrdom = this.level / 12
  
    if (this.name == 'Revenge') {
      tank.revenge = []
      this.value = this.level / 115
    }
  }

  revenge() {
    let amount = 0
    for (let x of tank.revenge)
      if (game.timePassed - x[1] <= 30 * 60)
        amount += x[0]
      else 
        tank.revenge.splice(tank.revenge.indexOf(x), 1)
    
    let max = (3 + (.2 + tank.level / 10) * tank.level) * this.level
    tank.powDam += Math.min(amount, max)
  }
  
}

class PaladinTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['', '', '', '', ''][nr]
    this.pic      = info.talents[1][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

}

class RogueTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['Sunder Armor', 'Bounty', 'Swiftness', 'Poison', 'Kick'][nr]
    this.pic      = info.talents[2][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

  upgrade(hero) {
    super.upgrade(hero)

    if (this.name == 'Sunder Armor') 
      rogue.sunderArmor += 1/3

    if (this.name == 'Bounty')
      rogue.bounty = 1/6

    if (this.name == 'Swiftness')
      rogue.swiftness = - game.timePassed - 11 * 60

    if (this.name == 'Poison') {
      rogue.slowPoison = [-8, -17, -28][this.level - 1]
    }

    if (this.name == 'Kick') 
      rogue.kick = [1/3, 2/3, 1][this.level - 1]
  }

  checkBounty() {
    if (rogue.bounty == 0 || rand(0, 100) > 33)
      return
    healer.gold += (5 + game.difficulty * rogue.bounty) * this.level
    healer.gold = round(healer.gold)
    info.sounds[19].play()
  }

}

class ShamanTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['', '', '', '', ''][nr]
    this.pic      = info.talents[3][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

}

class DruidTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['Thorns', 'Efflorescence', 'Mark of the Wild', 'Demoralizing Roar', 'Moonfire'][nr]
    this.pic      = info.talents[4][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

  upgrade(hero) {
    super.upgrade(hero)

    if (this.name == 'Thorns')  {
      tank.thorns++
      this.valueDamage = [4, 9, 15][this.level - 1]
      this.valueArmor  = [30, 80, 150][this.level - 1]
    }

    if (this.name == 'Efflorescence') {
      druid.efflorescence = true
      this.value = [7, 15, 25][this.level - 1]
    }

    if (this.name == 'Mark of the Wild')
      druid.MOTW = true

    if (this.name == 'Demoralizing Roar')
      druid.roar = [2.5, 5, 8][this.level - 1]

    if (this.name == 'Moonfire') {
      this.valueDamage = [20, 42, 70][this.level -1]
      druid.moonfire = 0
    }
  }

  moonfire() {
    let target = [undefined, -1]
    for (let e of game.enemies)
      if (e.hpCurr > target[1])
        target = [e, e.hpCurr]

    if (target[0] && target[0].hpCurr / target[0].hpFull > .25) {
      target[0].dots[0] = {
        name: 'Moonfire', 
        tics: [],
        dam: this.valueDamage, 
        pic: this.pic} 
      for (let i = 1; i < 6; i++)
        target[0].dots[0].tics.push(game.timePassed + i * 180)

        info.sounds[22].play()
        druid.moonfire = game.timePassed + 25 * 60
      }
    
  }

}

class PriestTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.nr       = nr
    this.name     = ['Meditation', 'Inner Fire', 'Strong Will', 'Inner Focus', ''][nr]
    this.value    = [10, 75, 0, 0, 0][nr]
    this.pic      = info.talents[5][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

  upgrade(hero) {
    super.upgrade(hero)

    if (this.name == 'Meditation') {
      healer.combatRegen += .1
    }

    if (this.name == 'Inner Fire') {
      healer.innerFire += [0, 70, 80, 90][this.level]
    }

    if (this.name == 'Strong Will')
      healer.pure.manaFull += [40, 50, 60][this.level -1]

    if (this.name == 'innerFocus')
      healer.innerFocus = game.timePassed
  }

  getSpecialText() {
    let text = []

    text.push ([`${obj.name}:`])
    text.push ([''])
    text.push ([`The healer restores ${obj.level * obj.val}%`])
    text.push ([`of his regular Mana regeneration`])
    text.push ([`while casting spells.`])

    return text
  }

}

class WarlockTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['', '', '', '', ''][nr]
    this.pic      = info.talents[6][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

}

class MageTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['Mana Crystal', 'Fire Blast', 'Refreshment', 'Summon Imp', 'Charisma'][nr]
    this.pic      = info.talents[7][nr]  
    this.duration = 2.5 * 60 * 60
    this.value    = 0
    this.manaCost = 0
    this.CD       = 0
  }

  upgrade(hero) {
    super.upgrade(hero)

    if (this.name == 'Mana Crystal') {
      mage.manaCrystal = game.timePassed + this.duration
    }

    if (this.name == 'Fire Blast') {
      mage.fireBlast = game.timePassed + 12 * 60 
      this.value += [40, 50, 60][this.level - 1]
    }

    if (this.name == 'Refreshment') {
      mage.refreshment = true
      this.value = [.01, .022, .036][this.level -1]
    }

    if (this.name == 'Summon Imp') {
      mage.imp = true
    }

    if (this.name == 'Charisma') {
      game.sellFactor = [.25, .30, .36, .44][this.level]
      game.buyFactor  = [  1, .95, .88, .78][this.level]
    }

  }

  createManaCrystal() {
    if (game.inv.slots.some(slot => slot.content && slot.content.name == 'Mana Crystal'))
      return
    if (game.inv.add(new Item(5, this.level - 1)) == 'full')
      return
    mage.manaCrystal = game.timePassed + this.duration
    info.sounds[17].play()
  }

  refreshment(paint) {
    if (!mage.refreshment || game.phase != 1 || 
        game.enemies.length > 0 || game.paused)
      return

    if (paint)
      ctx.drawImage(info.refreshment, 400, -30, 200, 200)
      
    setTimeout(_=> {info.sounds[21].play()}, 1500)

    let val = healer.manaFull * this.value / 400
    if (healer.manaCurr < healer.manaFull)
      healer.gainMana(val, 'abil')

    for (let hero of game.party.filter(h => h.alive)) {
      let val = hero.hpFull * this.value / 240
      if (hero.hpCurr < hero.hpFull)
        this.healDone += val
      hero.gainHP(val)
    }
  }
}

class HunterTalent extends Talent {
  constructor(nr) {
    super(nr)
    this.name     = ['', '', '', '', ''][nr]
    this.pic      = info.talents[8][nr]    
    this.manaCost = 0
    this.CD       = 0
  }

}

