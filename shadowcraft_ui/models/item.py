"""model for items in mongo"""

import copy
import re
import requests
import pymongo
from pymongo import MongoClient
import ArmoryDocument
from ArmoryItem import ArmoryItem
import ArmoryConstants
from time import sleep

ARTIFACT_WEAPONS = [128476, 128479, 128870, 128869, 128872, 134552]
ORDER_HALL_SET = [139739, 139740, 139741, 139742, 139743, 139744, 139745, 139746]
MIN_ILVL = 800

def init_db(dbase):
    """create indexes"""
    dbase.items.create_index(
        [
            ('id', pymongo.ASCENDING),
            ('item_level', pymongo.ASCENDING),
            ('is_gem', pymongo.ASCENDING)
        ],
        unique=True
    )
    dbase.items.create_index(
        [
            ('slot', pymongo.ASCENDING),
        ],
        unique=True
    )

def populate_db(dbase):
    """get item data to put into mongo"""

    # Abuse wowhead to load in a big list of items to import
    wowhead_ids = []
    ranges = ((800, 850), (851, 900), (901, 950))
    for item_type in ['weapons', 'leather-armor', 'cloaks', 'rings', 'amulets', 'trinkets']:
        print("Requesting %s from wowhead" % item_type)
        for r in ranges:
            print("Rare items, ilevels %d to %d...  " % (r[0], r[1]), end='')
            wowhead_ids.extend(get_ids_from_wowhead(
                'http://www.wowhead.com/%s/min-level:%d/max-level:%d/class:4/quality:3' % (item_type, r[0], r[1])))
            print("Epic items, ilevels %d to %d...  " % (r[0], r[1]), end='')
            wowhead_ids.extend(get_ids_from_wowhead(
                'http://www.wowhead.com/%s/min-level:%d/max-level:%d/class:4/quality:4' % (item_type, r[0], r[1])))
        print()

    print("Requesting legendaries from wowhead")
    wowhead_ids.extend(get_ids_from_wowhead(
        'http://www.wowhead.com/items/armor/min-level:895/class:4/quality:5'))

    wowhead_ids.extend(ARTIFACT_WEAPONS)
    wowhead_ids.extend(ORDER_HALL_SET)

    item_ids = set(wowhead_ids)
    print("Have %d items to load" % len(item_ids))

    pos = 0
    for item_id in item_ids:
        pos += 1
        if pos % 10 == 0:
            print("Loading item %d of %d" % (pos, len(item_ids)))
        import_item(dbase, item_id)

def populate_gems(dbase):
    """get gem data to put into mongo"""

    # Load the gems from wowhead that we were added in Legion and don't have intellect or strength on them.
    wowhead_ids = []
    wowhead_ids.extend(get_ids_from_wowhead("http://www.wowhead.com/items/gems/prismatic?filter=166:23:20;7:3:3;0:0:0"))

    item_ids = set(wowhead_ids)
    print("Have %d gems to load" % len(item_ids))
    pos = 0
    for item_id in item_ids:
        pos += 1
        if pos % 10 == 0:
            print("Loading gem %d of %d" % (pos, len(item_ids)))
        import_item(dbase, item_id, True)


def import_item(dbase, item_id, is_gem=False):
    """fetch data from bnet"""
    print("Importing %d" % item_id)

    # TODO: see if this item exists in the database before loading it. Do we want to
    # continue doing this?

    # Request the initial json data from the armory and insert it into an array of
    # json to be further processed. If we get an exception here, we can't continue
    # because we can't generate any of the remaining urls anyways.
    json = {}
    try:
        json = ArmoryDocument.get('us', '/wow/item/%d' % item_id)

        for stat in json['bonusStats']:
            if ArmoryConstants.STAT_LOOKUP[stat['stat']] == 'intellect':
                print("import_item: item has intellect on it, ignoring")
                return

    except ArmoryDocument.ArmoryError as err:
        print("import_item failed to fetch %d: %s" % (item_id, err))
        return

    # Create a basic item to store in the database. The properties will get populated
    # as we loop through the json below.
    db_item = {'id': item_id, 'is_gem': is_gem, 'is_crafted': False}

    # Loop through the json data that was retrieved and process each in turn
    item = ArmoryItem(json)
    item_props = item.as_json()

    # Skip items that don't have an equip location because wowhead keeps sticking
    # random shit into the list (like the item that discovers new legendaries)
    if not is_gem and item_props['equip_location'] == '':
        return

    db_item.update(item_props)

    if not is_gem:
        # Join all of the chance bonus lists into one list for all of the item levels.
        # This is mostly safe. It might be weird for items at very low ilvls where they
        # might not support sockets, but that rarely happens.
        db_item['chance_bonus_lists'] += item_props['chance_bonus_lists']
        db_item['chance_bonus_lists'] = list(set(db_item['chance_bonus_lists']))
        db_item['quality'] = item.quality
        db_item['bonuses'] = item.bonus_tree
        db_item['item_level'] = item.item_level

        # Weapon stats go into a different part of the object. Take them out of the
        # main object after they've been copied.
        if 'speed' in item_props:
            db_item['weaponStats'] = {
                'speed': item_props['speed'],
                'dps': item_props['dps'],
                'min_dmg': item_props['min_dmg'],
                'max_dmg': item_props['max_dmg']
            }

            del db_item['speed']
            del db_item['dps']
            del db_item['min_dmg']
            del db_item['max_dmg']

        if json['context'] == 'trade-skill':
            db_item['is_crafted'] = True

    dbase.items.replace_one({'id': item_id}, db_item, upsert=True)


def get_ids_from_wowhead_by_ilvl(quality, min_ilvl, max_ilvl):
    """Loads a list of item IDs from wowhead filtered by item level and quality"""
    url = 'http://www.wowhead.com/items/min-level:%d/max-level:%d/class:4/quality:%d/live-only:on?filter=21;1;0' % (
        min_ilvl, max_ilvl, quality)
    return get_ids_from_wowhead(url)


def get_ids_from_wowhead_by_type(item_type):
    """Loads a list of gem item IDs from wowhead filtered by gem type"""
    url = 'http://www.wowhead.com/gems/type:%d?filter=166;7;0' % item_type
    return get_ids_from_wowhead(url)


def get_ids_from_wowhead(url):
    """Loads a list of item IDs from wowhead based on a wowhead URL"""
    ids = []
    resp = requests.get(
        url,
        timeout=60,
        headers={'user-agent': ArmoryDocument.USER_AGENT}
    )
    if resp.status_code == 200:
        match_iter = re.finditer(r'_\[(\d+)\]=\{.*?\}', resp.text)
        for match in match_iter:
            ids.append(int(match.groups(1)[0]))

    print("Found %d new items from wowhead" % len(ids))
    sleep(10)
    return ids


def test_item():
    """load mongo with test items"""
    mongo = MongoClient()
#    import_item(mongo.roguesim_python, 147172)
    populate_db(mongo.roguesim_python)
    populate_gems(mongo.roguesim_python)

if __name__ == '__main__':
    test_item()
