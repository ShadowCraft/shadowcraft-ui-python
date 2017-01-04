import requests, csv, re
import ArmoryConstants
from ArmoryDocument import ArmoryDocument

class ArmoryItem(object):

    # Some static data that used by the item loader code
    item_enchants = None
    item_upgrades = None
    upgrade_rulesets = None
    item_bonuses = None
    item_name_descriptions = None
    
    def __init__(self, json):        
        self.name = json['name']
        self.ilevel = int(json['itemLevel'])
        self.item_id = int(json['id'])
        self.upgradable = ArmoryItem.check_upgradable(self.item_id)
        self.populate_data(json)

    def populate_data(self, json):
        self.quality = json['quality']
        self.equip_location = json['inventoryType']
        self.icon = json['icon']

        # Tag is the header text on an item that has a description, such as
        # 'warforged' or 'heroic'. This field is used in the display of items.
        # If the value doesn't come along in the json data, make one up based
        # on the context field.
        if 'nameDescription' in json:
            self.tag = json['nameDescription']
        elif json['context'].endswith('-mythic'):
            self.tag = 'Mythic'
        elif json['context'].endswith('-heroic'):
            self.tag = 'Heroic'
        elif json['context'].endswith('-normal'):
            self.tag = ''
        elif json['context'] == 'raid-finder':
            self.tag = 'Raid Finder'

        # If this item is a gem or an armor item, save some additional information about it.
        if json['itemClass'] == 3:
            if gemInfo in json:
                self.stats = {}
            else:
                self.gem_slot = json['gemInfo']['type']['type'].title()
                self.stats = ArmoryItem.scan_str(json['gemInfo']['bonus']['name'])
        elif json['itemClass'] == 4:
            if json['itemSubClass'] in ArmoryConstants.ARMOR_CLASS:
                self.armor_class = ArmoryConstants.ARMOR_CLASS[json['itemSubClass']]

        if json['itemClass'] != 3 and 'bonusStats' in json:
            self.stats = {}
            for entry in json['bonusStats']:
                if entry['stat'] not in ArmoryConstants.STAT_LOOKUP:
                    print("STAT ID missing: %s", entry['stat'])
                else:
                    self.stats[ArmoryConstants.STAT_LOOKUP[entry['stat']]] = entry['amount']

        # If an item has chanceBonusLists, then it's an item that can have
        # various bonuses attached to it like item sockets, random enchantments,
        # etc. Store these with the item if they exist so they can be displayed
        # on the popup for the item.
        self.bonus_tree = json['bonusLists'] if 'bonusLists' in json else []
        
        # TODO: what is this for? These 5 bonus IDs are for the 100% secondary
        # stat bonuses.
        self.chance_bonus_lists = []
        for bonusId in json['bonusSummary']['defaultBonusLists']:
            if bonusId in [486, 487, 488, 489, 490]:
                self.chance_bonus_lists.append(bonusId)

        # If this item is a weapon, we need to store a little bit of information
        # about it.
        if 'weaponInfo' in json:
            self.speed = float(json['weaponInfo']['weaponSpeed'])
            self.dps = float(json['weaponInfo']['dps'])
            self.subclass = json['itemSubClass']

    # This method takes a string like "+4 Critical Strike" and turns it into a
    # hash of two values. The values are the attribute being modified and the
    # value of the modifier.
    def scan_str(string):
        ret = {}
        for attr in ArmoryConstants.SCAN_ATTRIBUTES:
            match = re.search(r"\+(\d+) (%s)" % attr, string, re.IGNORECASE)
            if match:
                attr = match.group(2).lower()
                if attr in ArmoryConstants.SCAN_OVERRIDE:
                    attr = ArmoryConstants.SCAN_OVERRIDE[attr]
                re.sub(r' ', '_', attr)
                ret[attr] = int(match.group(1))
            else:
                match = re.search(r"Equip:.*(%s) by (\d+)" % attr, string, re.IGNORECASE)
                if match:
                    attr = match.group(1).lower()
                    if attr in ArmoryConstants.SCAN_OVERRIDE:
                        attr = ArmoryConstants.SCAN_OVERRIDE[attr]
                    re.sub(r' ', '_', attr)
                    ret[attr] = int(match.group(2))
        return ret

    # The mapping for upgrades goes as follows:
    # 1. The RulesetItemUpgrade file contains a list of items that can be
    #    upgraded and maps to a ID of the kind of upgrade.
    # 2. The ItemUpgrade file contains a list of kinds of upgrades and maps
    #    from those IDs to the number of upgrades for that kind (via a
    #    chain of previous IDs) and the currency necessary for the upgrade.
    #
    # For ShC, we only care about valor upgrades so we can skip any other
    # kind of upgrade.
    def check_upgradable(item_id):
        rule = ArmoryItem.upgrade_ruleset(item_id)
        if rule != None:
            item_upgrade = ArmoryItem.item_upgrade(rule)
            # valor in 6.2.3 is currency type 1191
            if item_upgrade == 1191:
                return True
        return False
    
    def item_enchant(enchant_id):
        if ArmoryItem.item_enchants == None:
            ArmoryItem.item_enchants = {}
            with open('../external_data/SpellItemEnchantment.dbc.csv', mode='r') as infile:
                reader = csv.reader(infile)
                next(reader) # Skip the first row with the header
                for row in reader:
                    ArmoryItem.item_enchants[int(row[0])] = row
        return ArmoryItem.item_enchants[enchant_id]

    # item_upgrades and upgrade_rulesets are used to determine if a piece of gear is
    # eligible for a valor upgrade. They are used in the check_upgradable method.
    def item_upgrade(rule_id):
        # The header on the ItemUpgrade data looks like (as of 7.0.3):
        # id,cost,prev_id,id_currency_type,upgrade_group,upgrade_ilevel
        # We only care about the prev_id and id_currency_type ones
        if ArmoryItem.item_upgrades == None:
            ArmoryItem.item_upgrades = {}
            with open('../external_data/ItemUpgrade.dbc.csv', mode='r') as infile:
                reader = csv.reader(infile)
                next(reader) # Skip the first row with the header
                for row in reader:
                    p_id = int(row[2])
                    currency = int(row[3])
                    if p_id != 0 and currency != 0:
                        ArmoryItem.item_upgrades[p_id] = currency
        return ArmoryItem.item_upgrades[rule_id] if rule_id in ArmoryItem.item_upgrades else None
    
    def upgrade_ruleset(item_id):
        # The header on the RulesetItemUpgrade data looks like (as of 7.0.3):
        # id,id_item,id_upgrade_base
        # We only care about the last two of these.
        if ArmoryItem.upgrade_rulesets == None:
            ArmoryItem.upgrade_rulesets = {}
            with open('../external_data/RulesetItemUpgrade.dbc.csv', mode='r') as infile:
                reader = csv.reader(infile)
                next(reader) # Skip the first row with the header
                for row in reader:
                    ArmoryItem.upgrade_rulesets[int(row[1])] = int(row[2])
        return ArmoryItem.upgrade_rulesets[item_id] if item_id in ArmoryItem.upgrade_rulesets else None
    
    def item_bonus(bonus_id):
        if ArmoryItem.item_bonuses == None:
            ArmoryItem.item_bonuses = {}
            with open('../external_data/ItemBonus.dbc.csv', mode='r') as infile:
                reader = csv.reader(infile)
                next(reader) # Skip the first row with the header
                for row in reader:
                    id_node = int(row[3])
                    if id_node not in ArmoryItem.item_bonuses:
                        ArmoryItem.item_bonuses[id_node] = []

                    entry = {
                        "type": int(row[4]),
                        "val1": int(row[1]),
                        "val2": int(row[2]),
                    }
                    
                    # Bonus Types (value of column 4):
                    # 1 = Item level increase.
                    # 2 = Stat.  This is for items with random stats.  Take the value of column 4 and
                    #     replace it with the stat from the STAT_LOOKUP array in WowArmory::Constants
                    # 5 = Name (heroic, stages, etc).  Take the value of column 4 and replace it with
                    #     the name from the item from the item_name_description lookup.  This pulls
                    #     data from the WoD_ItemNameDescription.csv file.  These entries are used to
                    #     display the green text next to items in the list.
                    # 6 = Socket.  Take the value of column 4 and replace it with the socket type from
                    #     the SOCKET_MAP array in WowArmory::Constants.
                    if entry['type'] == ArmoryConstants.ITEM_BONUS_TYPES['random_stat'] and \
                       entry['val1'] in ArmoryConstants.STAT_LOOKUP:
                        entry["val1"] = ArmoryConstants.STAT_LOOKUP[entry["val1"]]
                    elif entry['type'] == ArmoryConstants.ITEM_BONUS_TYPES['name']:
                        entry['val1'] = ArmoryItem.item_name_description(entry["val1"])
                    elif entry['type'] == ArmoryConstants.ITEM_BONUS_TYPES['socket'] and \
                         entry['val2'] in ArmoryConstants.SOCKET_MAP:
                        entry['val2'] = ArmoryConstants.SOCKET_MAP[entry['val2']]
                    elif entry['type'] == ArmoryConstants.ITEM_BONUS_TYPES['ilvl_increase']:
                        entry.pop('val2', None)
                    elif entry['type'] == ArmoryConstants.ITEM_BONUS_TYPES['base_ilvl']:
                        entry.pop('val2', None)

                    ArmoryItem.item_bonuses[id_node].append(entry)
                    
        return ArmoryItem.item_bonuses[bonus_id]
    
    def item_name_description(desc_id):
        if ArmoryItem.item_name_descriptions == None:
            ArmoryItem.item_name_descriptions = {}
            with open('../external_data/ItemNameDescription.dbc.csv', mode='r') as infile:
                reader = csv.reader(infile)
                next(reader) # Skip the first row with the header
                for row in reader:
                    text = row[1]
                    if len(text) == 0: continue
                    
                    # For some reason all of the values in this table have single-quotes around
                    # every string. Remove those and just store the strings themselves.
                    text = row[1]
                    if text[0] == '\'':
                        text = text[1:]
                    if text[-1] == '\'':
                        text = text[:-1]
                    ArmoryItem.item_name_descriptions[int(row[0])] = text
        return ArmoryItem.item_name_descriptions[desc_id]
    
if __name__ == '__main__':
    print(ArmoryItem.item_enchant(44))
    print(ArmoryItem.item_bonus(1572))
    print(ArmoryItem.check_upgradable(142512))
    print(ArmoryItem.check_upgradable(124367))
    print(ArmoryItem.scan_str("+4 Critical Strike"))
    print(ArmoryItem.scan_str("Equip: Mastery by 4"))
    json = ArmoryDocument.get('us','/wow/item/%d' % 142512)
    item = ArmoryItem(json)
    print(item.name)
