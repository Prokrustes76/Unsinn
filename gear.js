class Gear {
  constructor() {
    this.gems         = []  
  }

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

    else {
      if      (this.name.includes('Wand'))  list = [         3, 4, 5, 6, 7, 8]
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
    this.part         = nr < 60 ? Armor.parts[Math.floor((nr % 20) / 5)] : 'Offhand'
    this.material     = nr < 60 ? Armor.material[Math.floor(nr / 20)]     : ''
    this.picNr        = this.getPicNr(nr)    
    this.slotAmount   = this.getSlotAmount()
    this.rs           = this.calcRS()
    this.stats        = this.getStats()
    this.name         = this.getName()
    this.pos          = pos
    this.createdTime  = game ? game.timePassed : 0
  }

  static parts    = ['Head', 'Chest', 'Legs', 'Feet', 'Mainhand', 'Offhand']
  static material = ['Mail', 'Leather', 'Cloth'] 
  static quality  = ['Simple','Solid','Fine','Pure','Great']

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
      return Armor.quality[nr - 60] + ' ' + 'Shield'
    return Armor.quality[nr % 5] 
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
    if (Armor.parts[nr] != this.part) 
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

    this.name         = nr >= 70 ? ['Simple', 'Lesser', 'Solid', 'Greater', 'Master'][nr % 5] + ' Wand' : 
                        ''
    this.power        = nr >= 70 ? [32, 38, 46, 56, 78][nr % 5] : 
                        0
    this.price        = nr >= 70 ? [30, 70, 130, 220, 400][nr % 5] : 
                        0
    this.picNr        = nr >= 70 ? [194, 192, 193, 190, 191][nr % 5] :
                        0
    this.stats        = this.getStats()
    this.slotAmount   = this.getSlotAmount()
  }

  canEquip(nr, hero) {
    if (this.name.includes('Wand') && !['Priest', 'Mage'].includes(hero.type))
      return false

    if ((this.level - 1) * 2 > hero.level) 
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
