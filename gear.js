class Gear {
  constructor() {
    this.gems         = []  
    this.createdTime  = game ? game.timePassed : 0
  }

  static quality  = ['Simple','Solid','Fine','Pure','Great']
  static parts    = ['Head', 'Chest', 'Legs', 'Feet', 'Mainhand', 'Offhand']
  static material = ['Mail', 'Leather', 'Cloth'] 
  static weapon   = ['Axe', 'Sword', 'Mace', 'Staff', 'Dagger', 'Wand']

  getStats() {
    let list = []
    let values = [{cha: 'Armor' ,  val :  25 * this.level},
                  {cha: 'Health',  val :  20 * this.level},
                  {cha: 'Defence', val :   1 * this.level},
                  {cha: 'Healing', val :  .8 * this.level},
                  {cha: 'Damage',  val :  .8 * this.level},
                  {cha: 'Crit',    val : 1.1 * this.level},
                  {cha: 'Haste',   val : 1.1 * this.level},
                  {cha: 'Spirit',  val : 1.1 * this.level},
                  {cha: 'Mana',    val :  17 * this.level}
                ]
    for (let v of values)
      v.val = round(v.val * rand(.93, 1.07), (v.val > 15) ? 0 : 1)
    
    if (this instanceof Armor) {
      if      (this.part     == 'Offhand')  list = [0, 1, 2,    4, 5, 6]
      else if (this.material == 'Mail')     list = [0, 1, 2,    4, 5, 6]
      else if (this.material == 'Leather')  list = [0, 1,       4, 5, 6]
      else if (this.material == 'Cloth')    list = [0, 1,    3, 4, 5, 6, 7, 8]
    }

    if (this instanceof Weapon) {
      if      (this.name.includes('Wand'))  list = [         3, 4, 5, 6, 7, 8]
      else                                  list = [0, 1, 2,    4, 5, 6]
    }

    let zufall = list [Math.floor(Math.random() * list.length)]

    return values[zufall]
  }

  getSlotAmount() {
    let slots = Math.floor(this.level / 2)
    let value = this.level % 2 == 0 ? 30 : 80
    if (rand(0,100) < value) slots++
    return slots
  }

  show(pos = this.pos) {
    if (this instanceof Weapon) {
      ctx.drawImage(info.weapon, 9 + 90 * (this.picNr % 21), 3 + 90 * Math.floor(this.picNr / 21), 
      88, 88,  pos.x, pos.y, pos.w, pos.h)   
      return
    }

    if (this.nr < 60)
      ctx.drawImage(info.armor, 30 + 98 * (this.picNr % 19), 8 + 98 * Math.floor(this.picNr / 19), 
                    88, 88,  pos.x, pos.y, pos.w, pos.h)  
    else   
      ctx.drawImage(info.weapon, 9 + 90 * (this.picNr % 21), 3 + 90 * Math.floor(this.picNr / 21), 
      88, 88,  pos.x, pos.y, pos.w, pos.h)          
  }
}

class Armor extends Gear {
  constructor(nr, pos, noStarterGear) {
    super()
    this.nr           = nr
    this.level        = (nr % 5) + 1
    this.part         = nr < 60 ? Gear.parts[Math.floor((nr % 20) / 5)] : 'Offhand'
    this.material     = nr < 60 ? Gear.material[Math.floor(nr / 20)]    : ''
    this.picNr        = this.getPicNr(nr)    
    this.slotAmount   = this.getSlotAmount()
    this.rs           = this.calcRS()
    this.stats        = this.getStats()
    this.name         = this.getName()
    this.pos          = pos
  }

  getPicNr(nr) {
    return [182,190,170,180,195,    24, 21,  1,  0, 19,   33,166, 88, 89,185,   66, 65, 69, 57, 76,
            177,173,171,179,172,     2, 10,  7,  6,  4,  147, 56, 72,109,128,   69, 77, 67, 64, 68,
            189,165,176,192,183,   139, 12,115,127, 13,   14, 37, 87, 86, 15,   60, 59, 61, 62, 58,
            172,174,170,169,168][nr]
  }

  getPrice(nr = this.nr) {
    let price = (15 + this.rs * 0.3) * (1 + .2 * this.slotAmount) * Math.pow(1.3,this.level - 1)
    if (!this.stats) price *= .6
    return round(price)
  }

  getName(nr = this.nr) {
    if (nr >= 60)
      return Gear.quality[nr - 60] + ' ' + 'Shield'
    return Gear.quality[nr % 5] 
            + ' ' + this.material + ' ' +
           [this.material == 'Cloth' ? 'Cap'  : 'Helm', 
            this.material == 'Cloth' ? 'Robe' : 'Armor', 
           'Leggings', 'Boots'][Math.floor((nr % 20) / 5)]
  }

  calcRS() { 
    if (this.nr >= 60) 
      return [100, 200, 300, 400, 500][this.level - 1] * rand(.9,1.1)

    let rs  = this.material == 'Mail' ? 160 : this.material == 'Leather' ? 80 : 30
        rs *= (.7 + this.level * .3)
    if (this.part == 'Feet') rs *= .667
    return rand(.9,1.1,2) * rs
  }

  canEquip(nr, hero) {
    if (this.name.includes('Shield') && !['Warrior', 'Paladin', 'Shaman'].includes(hero.type))
      return false
    if (Gear.parts[nr] != this.part) 
      return false
    if (this.material == 'Mail' && !['Warrior', 'Paladin'].includes(hero.type)) 
      return false
    if (this.material == 'Leather' && ['Priest', 'Warlock', 'Mage'].includes(hero.type)) 
      return false
    if ((this.level - 1) * 2 > hero.level) 
      return false

    return true
  }

}

class Weapon extends Gear {
  constructor(nr, pos) {
    super()
    this.nr           = nr
    this.level        = (nr % 5) + 1
    this.pos          = pos

    this.name         = this.getName(nr)
    this.part         = 'Mainhand'               
    this.slotAmount   = this.getSlotAmount()
    this.power        = this.getPower(nr)
    this.price        = this.getPrice(nr)
    this.picNr        = this.getPicNr(nr)
    this.mainStats    = this.getMainStats(nr)
    this.stats        = this.getStats()
  }

  getName(nr) {
    return Gear.quality[nr % 5] + ' ' + Gear.weapon[Math.floor(nr / 5)]
  }

  getPower(nr) {
    return nr >= 25 ? [32, 38, 46, 56, 78][nr % 5] : 0
  }

  getPrice(nr) {
    let price = [45, 55, 38, 50, 43, 45][Math.floor(nr / 5)]  * (1 + .15 * this.slotAmount) * Math.pow(1.8, this.level - 1)
    return round(price)
  }

  getPicNr(nr) {
    return [ 30,  25,  23,  24,  27,    210, 203, 200, 202, 197,   131, 127, 127, 118, 119,
            194, 192,  63,  64,  67,    211, 117, 212, 115, 116,   213, 191, 193,  65,  66][nr]
  }

  getMainStats(nr) {
    let axes   = [[2, 3], [7, 2], [13,  0], [20, -3], [25, 5]]
    let swords = [[0, 6], [4, 6], [15, -3], [17,  5], [20, 12]]
    let maces  = [[3, 3], [7, 1], []]
  }

  canEquip(nr, hero) {
    if (this.name.includes('Axe')    && !['Warrior'].                   includes(hero.type) || 
        this.name.includes('Sword')  && !['Warrior', 'Rogue'].          includes(hero.type) ||
        this.name.includes('Mace')   && !['Warrior', 'Druid'].          includes(hero.type) ||
        this.name.includes('Staff')  && !['Druid', 'Mage', 'Priest'].   includes(hero.type) ||
        this.name.includes('Dagger') && !['Rogue'].                     includes(hero.type) ||
        this.name.includes('Wand')   && !['Priest', 'Mage'].            includes(hero.type))
      return false
    if ((this.level - 1) * 2 > hero.level) 
      return false
    if (Gear.parts[nr] != this.part) 
      return false

    return true
  }

}

class Gem {
  constructor(nr, pos) {
    this.nr           = nr
    this.name         = this.getName()
  }

  getName() {
    return 'Gem of ' + ['Health', 'Protection', 'Precision', 'Haste', 'Force',
                        'Healing'][this.nr]
  }

}
