class Info {
  constructor() {
    this.monsters   = []
    this.items      = []
    this.wands      = []
    this.scrolls    = []
    this.sounds     = []
    this.talents    = []
    this.alliance         = new Image()
    this.alliance.src     = './rsc/alliance.png'
    this.armor            = new Image()
    this.armor.src        = './rsc/armor.png'
    this.book             = new Image()
    this.book.src         = './rsc/book.png'
    this.castBar          = new Image()
    this.castBar.src      = './rsc/castBar.jpg'
    this.default          = new Image()
    this.default.src      = './rsc/talents/default.jpg'
    this.frame            = new Image()
    this.frame.src        = './rsc/frame.png'
    this.forest           = new Image()
    this.forest.src       = './rsc/forest.jpg'
    this.horde            = new Image()
    this.horde.src        = './rsc/horde.png'
    this.imp              = new Image()
    this.imp.src          = './rsc/imp.jpg'
    this.ironShield       = new Image()
    this.ironShield.src   = './rsc/ironShield.png'
    this.jeweler          = new Image()
    this.jeweler.src      = './rsc/jeweler.jpg'    
    this.levelUp          = new Image()
    this.levelUp.src      = './rsc/levelUp.png'
    this.lightning        = new Image()
    this.lightning.src    = './rsc/lightning.png'
    this.poison           = new Image()
    this.poison.src       = './rsc/poison.png'
    this.portraits        = new Image()
    this.portraits.src    = './rsc/portraits.jpg'
    this.shieldPic        = new Image()
    this.shieldPic.src    = './rsc/shield.png'
    this.silhouette       = new Image()
    this.silhouette.src   = './rsc/silhouette.png'
    this.smith            = new Image()
    this.smith.src        = './rsc/smith.png'
    this.spiderWeb        = new Image()
    this.spiderWeb.src    = './rsc/spiderWeb.png'
    this.skeleton         = new Image()
    this.skeleton.src     = './rsc/skeleton.jpg'
    this.startScreen      = new Image()
    this.startScreen.src  = './rsc/startScreen.jpg'
    this.sunder           = new Image()
    this.sunder.src       = './rsc/sunder.png'
    this.refreshment      = new Image()
    this.refreshment.src  = './rsc/refreshment.png'
    this.target           = new Image()
    this.target.src       = './rsc/target.png'
    this.town             = new Image()
    this.town.src         = './rsc/town.jpg'
    this.trainer          = new Image()
    this.trainer.src      = './rsc/trainer.jpg'   
    this.thorns           = new Image()
    this.thorns.src       = './rsc/thorns.png'
    this.vendor           = new Image()
    this.vendor.src       = './rsc/vendor.jpg'
    this.weapon           = new Image()
    this.weapon.src       = './rsc/weapon.png'

    let list = [0, 1, 2, 3, 4, 10, 11, 12, 13, 14, 20, 21, 22, 23, 
                24, 25, 26, 27, 28, 35, 36, 37, 38, 39]
    for (let i = 0; i < 9; i++) {
      this.talents.push([])
      for (let j = 0; j < 5; j++) {
        if (list.includes(i * 5 + j)) {
          this.talents[i][j] = new Image()
          this.talents[i][j].src = `./rsc/talents/talent_${i}_${j}.jpg`
        }
        else
          this.talents[i][j] = this.default
      } 
    }

    for (let i = 0; i < 10; i++) {
      this.monsters[i]     = new Image()
      this.monsters[i].src = `./rsc/monster${i}.jpg`
    }
  
    for (let i = 0; i < 5; i++) {
      this.items[i]       = new Image()
      this.items[i].src   = `./rsc/item${i}.png`
    }
    
    for (let i = 0; i < 4; i++) {
      this.wands[i]       = new Image()
      this.wands[i].src   = `./rsc/wand${i}.png`
    }

    for (let i = 0; i < 5; i++) {
      this.scrolls[i]     = new Image()
      this.scrolls[i].src = `./rsc/scroll${i}.jpg`
    }

    for (let i = 0; i < 31; i++) {
      this.sounds[i] = new Audio()
      // Warr,      Rogue,   Druid,     Priest ,   Mage,       Skeleton
      // Ogre,      Troll,   Bear,      Bat,       Goblin,     Spider 
      // Mantis,    Cat,     Boar,      Lizard,    ShieldBash, Gem
      // Explosion, Coins,   Swiftness, Eating,    Moonfire,   Kick
      // Web,       Drop,    LizHeal,   LevelUp    ManaBurn,   Imp
      // Sunder
      let nr = [1415152, 1394020, 1394184,  568228,  1392378, 1044983,
                 557654,  612524, 1256852,  985770,  550525,  561413,
                 560323,  562385,  548822, 1844142,  567879,  567574,
                 568315,  567428,  568146,  567612,  569023,  623880,
                 569368,  567557,  569300, 1087470,  569766,  2066565,
                 1416604][i]
      this.sounds[i].src = [`https://wow.zamimg.com/wowsounds/${nr}`]
      this.sounds[i].volume = .6                    
    }
  }
  
  static heroes
  static spells

  static getInfo(obj) {
    
    let text = []

    if (obj instanceof Item) { 
      text.push([`Name:  ${obj.name}`])
      text.push([`Level: ${obj.level + 1}`])
      let buyPrice  = Math.ceil (obj.price * game.buyFactor)
      let sellPrice = Math.floor(obj.price * game.sellFactor)
      text.push([`Price: ${buyPrice || `can't be sold.`}   (Sale: ${sellPrice})`])

      text.push([``])
      if (obj.nr == 0) text.push([`Heals you for ${obj.power}.`])
      if (obj.nr == 1) text.push([`Restores ${obj.power} of your Mana.`])
      if (obj.nr == 2) text.push([`Resurrects a fallen hero.`])
      if (obj.nr == 3) {
        text.push([`Buffs all party members:`])
        let kind = ['Health', 'Armor', 'Power', 'Crit', 'Haste'][obj.kind]
        let val  = [40, 50, 3, 2, 2, 2][obj.kind] * (obj.level + 1)
        if (obj.kind > 1) val += '%'
        text.push([`Increases ${kind} by ${val}.`])
      }
      if (obj.nr == 4) {text.push([`Evokes a ${["weak", "lesser", "fierce"][obj.level]} skeleton,`])
                       text.push([`which will fight for you.`])}
      if (obj.nr == 5) {text.push([`Restores ${obj.power} of your Mana.`])
                        text.push([`Cooldown: 3 secs.`])}
    }

    if (obj instanceof Spell) {
      text.push([`Name:  ${obj.name}`])
      text.push([`Level: ${obj.level}`])
      text.push([``])

      if (obj.instHeal > 0)
        text.push([`Heals ${obj.targets} target${obj.targets > 1 ? 's' : ''} for ${round(obj.instHeal)}.`])
      if (obj.name == 'Shield')
        text.push([`Absorbs ${round(obj.extra)} damage.`])

      if (obj.ticNr > 0) {
        text.push([`Adds ${obj.ticNr} HoTs on target,`])
        text.push([`healing ${round(obj.ticPower)} every ${obj.ticBetw} secs.`])
        if (obj.name == 'Wildgrowth')
          text.push([`HoT effect will decline.`])
        if (obj.name == 'Lifebloom')
          text.push([`Last HoTs blooms for ${round(obj.ticPower * obj.extra)}.`])
        }
      text.push([``])
      text.push([`Costs:    ${round(obj.manaCost)} Mana.`])
      if (obj.CD > 0)
        text.push([`Cooldown: ${round(obj.CD / 60,1)} secs.`])
    }

    else if (obj instanceof Creature) {
      if (obj instanceof Ally) { 
        text.push([`Name:   ${obj.name}`])
        text.push([`Klasse: ${obj.type}`])
        if (obj.evoked) {
          if (obj.evoked < 500000) {
          let val = (obj.evoked - game.timePassed) / 3600
          let value = val < 1 ? '< 1min' : '> ' + Math.floor(val) + 'min'
          text.push([`Span:   ${value}`])
          }
        }
        else {
          text.push([`Exp:    ${round(obj.exp)}`])
          text.push([`Level:  ${obj.level}`])
        }
      }
      else text.push([`Klasse: ${obj.type}`])
      text.push([``])  
      text.push([`Health: ${round(obj.hpCurr)}/${round(obj.hpFull)}`]) 
      if (obj.type == `Priest`)
        text.push([`Mana:   ${round(obj.manaCurr)}/${round(obj.manaFull)}`]) 
      if (obj instanceof Ally)
      text.push([`Armor:  ${round(obj.rs)}`])
      text.push([`Prot.:  ${round(obj.armor,1)}%`]) 
      text.push([``])  
      text.push([`Att Power:  ${round(obj.powDam,1)}`])
      let val = obj.powDam * (1 + obj.crit / 100)  / (2.5 * (1 - obj.haste / 100))
      text.push([`DPS      :  ${round(val,1)}`])
      if (obj.powHeal > 0)
      text.push([`Heal Power: ${round(obj.powHeal,1)}`])

      if (obj instanceof Priest)
        text.push([`Spirit:     ${round(obj.spirit,1)}`])
      text.push([``])  
      text.push([`Critical:   ${round(obj.crit,1)}%`])
      text.push([`Haste:      ${round(obj.haste,1)}%`])
      text.push([`Defence:    ${round(obj.def,1)}%`])
      if (obj instanceof Enemy) {
        text.push([``])  
        text.push([`Damage:     ${round(obj.damDealed)}`]) 
      }
    }

    else if (obj instanceof Armor) {
      text.push(obj.name)
      text.push([`Level: ${obj.level}`])
      if ((obj.level - 1) > 1)
        text.push([`Requ.: Level ${(obj.level - 1) * 2}`])
      if (obj.stats) 
        text.push([`${obj.stats.cha}: +${obj.stats.val}`])
      text.push([``])  
      text.push([`Armor: ${Math.floor(obj.rs)}`])
      text.push([`Slots: ${obj.slotAmount}`])
      let buyPrice  = Math.ceil ((obj.price || obj.getPrice()) * game.buyFactor)
      let sellPrice = Math.floor((obj.price || obj.getPrice())* game.sellFactor)
      text.push([`Price: ${buyPrice}   (Sale: ${sellPrice})`])

    }

    else if (obj instanceof StatBox) {
      if (obj.mode == 0) {
        this.heroes     = this.makeSortedCopyOfHeroes()
        for (let h of this.heroes) { 
          let perc = round(100 * h.damDealed / this.heroes.sum)
          if (isNaN(perc)) perc = 0
          text.push([[h.name,   5], [Math.round(h.damDealed),145], [perc + '%', 194]])
        }
      }

      if (obj.mode == 1) {
        if (!this.spells || game.timeTotal < 5 || game.timeTotal % 30 == 0) 
          this.spells     = this.makeSortedCopyOfSpells()
        for (let s of this.spells) {
          let perc = round(100 * s.healDone / this.spells.sumHeal)
          if (isNaN(perc)) perc = 0
          text.push([[s.name,   5], [round(s.healDone), 145], [perc + '%', 194]])
        }
        let perc = round(100 * this.spells.sumOver / this.spells.sumHeal)
        if (isNaN(perc)) perc = 0
        text.push([['Overheal:', 5], [round(this.spells.sumOver), 145], [perc + '%', 194]])
      }

      if (obj.mode == 2) {
        text.push([['Mana Gained by:', 5], ['', 0], ['', 0]])
        text.push([['Regeneration:',   5], [round(healer.manaByReg), 194], ['', 0]])
        text.push([['Abilities:',      5], [round(healer.manaBySpell), 194], ['', 0]])
        text.push([['Items:',          5], [round(healer.manaByItem), 194], ['', 0]])
        text.push([['', 0], ['', 0], ['', 0]])
        if (mage.abilities[2].healDone)
          text.push([['Refreshment:',    5], [round(mage. abilities[2].healDone), 194], ['', 0]])
        if (druid.abilities[1].healDone) 
          text.push([['Efflorescence:',  5], [round(druid.abilities[1].healDone), 194], ['', 0]])
        if (druid.abilities[0].damDone)
          text.push([['Thorns Damage:',  5], [round(druid.abilities[0].damDone), 194], ['', 0]])

      }
    }

    return text
  }

  static makeSortedCopyOfHeroes() {
    let h = JSON.parse(JSON.stringify(game.party.filter(p => p.name != 'Imp')))
    h.sort((a, b) => b.damDealed - a.damDealed)
    h.sum = h.reduce((acc, h) => acc+= h.damDealed, 0)
    return h
  }

  static makeSortedCopyOfSpells() {
    let s = JSON.parse(JSON.stringify(healer.spells))
    s.sort((a, b) => b.healDone - a.healDone)
    s.sumHeal = s.reduce((acc, s) => acc+= s.healDone, 0)
    s.sumOver = s.reduce((acc, s) => acc+= s.overHeal, 0)
    return s
  }
}
