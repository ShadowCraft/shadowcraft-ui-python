import traceback
import pymongo

from shadowcraft.calcs.rogue.Aldriana import AldrianasRogueDamageCalculator, settings, InputNotModeledException
from shadowcraft.objects import buffs
from shadowcraft.objects import race
from shadowcraft.objects import stats
from shadowcraft.objects import procs
from shadowcraft.objects import talents
from shadowcraft.objects import artifact
from shadowcraft.objects import artifact_data
from shadowcraft.core import i18n
from shadowcraft.core import exceptions

class ShadowcraftComputation:
    enchantMap = {
        5437: "mark_of_the_claw",
        5438: "mark_of_the_distant_army",
        5439: "mark_of_the_hidden_satyr",
    }

    trinkets = {

        # 6.2.3
        133597: 'infallible_tracking_charm',

        # 7.0
        140794: 'arcanogolem_digit',
        139329: 'bloodthirsty_instinct',
        137459: 'chaos_talisman',
        137419: 'chrono_shard',
        140806: 'convergence_of_fates',
        128705: 'darkmoon_deck_dominion',
        140808: 'draught_of_souls',
        140796: 'entwined_elemental_foci',
        137539: 'faulty_countermeasure',
        137369: 'giant_ornamental_pearl',
        133642: 'horn_of_valor',
        127842: 'infernal_alchemist_stone',
        137357: 'mark_of_dargrul',
        133664: 'memento_of_angerboda',
        139334: 'natures_call',
        140802: 'nightblooming_frond',
        137312: 'nightmare_egg_shell',
        139320: 'ravaged_seed_pod',
        136715: 'spiked_counterweight',
        139325: 'spontaneous_appendages',
        137373: 'tempered_egg_of_serpentrix',
        137406: 'terrorbound_nexus',
        137439: 'tiny_oozeling_in_a_jar',
        137537: 'tirathons_betrayal',
        137486: 'windscar_whetstone',
        144259: 'kiljaedens_burning_wish',

        # Return to Karazhan
        142159: 'bloodstained_handkerchief',
        142167: 'eye_of_command',
        142164: 'toe_knees_promise',
    }

    otherProcs = {
    }

    artifactTraits = {
        # Assassination/Kingslayers
        'a': {
            214368: 'assassins_blades',
            192657: 'bag_of_tricks',
            192326: 'balanced_blades',
            192923: 'blood_of_the_assassinated',
            192323: 'fade_into_shadows',
            192428: 'from_the_shadows',
            192759: 'kingsbane',
            192329: 'gushing_wounds',
            192318: 'master_alchemist',
            192349: 'master_assassin',
            192376: 'poison_knives',
            192315: 'serrated_edge',
            192422: 'shadow_swiftness',
            192345: 'shadow_walker',
            192424: 'surge_of_toxins',
            192310: 'toxic_blades',
            192384: 'urge_to_kill',
            214928: 'slayers_precision',
        },

        # Outlaw/Dreadblades traits
        'Z': {
            216230: 'black_powder',
            202507: 'blade_dancer',
            202628: 'blademaster',
            202897: 'blunderbuss',
            202769: 'blurred_time',
            202665: 'curse_of_the_dreadblades',
            202463: 'cursed_edges',
            202521: 'cursed_leather',
            202755: 'deception',
            202524: 'fatebringer',
            202514: 'fates_thirst',
            202907: 'fortunes_boon',
            202530: 'fortune_strikes',
            202533: 'ghostly_shell',
            202820: 'greed',
            202522: 'gunslinger',
            202753: 'hidden_blade',
            214929: 'cursed_steel',
        },

        # Subtlety/Fangs traits
        'b': {
            209835: 'akarris_soul',
            197241: 'catlike_reflexes',
            197233: 'demons_kiss',
            197604: 'embrace_of_darkness',
            197239: 'energetic_stabbing',
            197256: 'flickering_shadows',
            197406: 'finality',
            197369: 'fortunes_bite',
            197244: 'ghost_armor',
            209782: 'goremaws_bite',
            197234: 'gutripper',
            197235: 'precision_strike',
            197231: 'the_quiet_knife',
            197610: 'second_shuriken',
            221856: 'shadow_fangs',
            209781: 'shadow_nova',
            197386: 'soul_shadows',
            214930: 'legionblade',
        },
    }

    artifactTraitsReverse = {}
    for k,v in artifactTraits.items():
        artifactTraitsReverse[k] = {v2: k2 for k2, v2 in v.items()}

    gearProcs = trinkets.copy()
    gearProcs.update(otherProcs)

    # Creates a group of items based on the base ilvls passed in.  For each entry in the
    # base_ilvls array, it will create additional entries stepping by step_size up to
    # num_steps times.
    def createGroup(base_ilvls, num_steps, step_size):
      trinketGroup = []
      subgroup = ()
      for base_ilvl in base_ilvls:
        for i in range(base_ilvl,base_ilvl + (num_steps+1)*step_size, step_size):
          subgroup += (i,)
      trinketGroup.extend(list(subgroup))
      return trinketGroup

    def createGroupMax(base_ilvl, max_ilvl, step_size):
      group = range(base_ilvl, max_ilvl, step_size)

    # used for rankings
    trinketGroups = {
        # Alchemist trinket
        'infernal_alchemist_stone': range(815, 865, 5),

        # Dungeon trinkets
        'chaos_talisman': range(820, 955, 5),
        'chrono_shard': range(820, 955, 5),
        'darkmoon_deck_dominion': range(815, 955, 5),
        'faulty_countermeasure': range(820, 955, 5),
        'giant_ornamental_pearl': range(820, 955, 5),
        'horn_of_valor': range(820, 955, 5),
        'mark_of_dargrul': range(820, 955, 5),
        'memento_of_angerboda': range(820, 955, 5),
        'nightmare_egg_shell': range(820, 955, 5),
        'spiked_counterweight': range(820, 955, 5),
        'tempered_egg_of_serpentrix': range(820, 955, 5),
        'terrorbound_nexus': range(820, 955, 5),
        'tiny_oozeling_in_a_jar': range(820, 955, 5),
        'tirathons_betrayal': range(820, 955, 5),
        'windscar_whetstone': range(820, 955, 5),

        # Emerald Nightmare
        'ravaged_seed_pod': range(850, 955, 5),
        'spontaneous_appendages': range(850, 955, 5),
        'natures_call': range(850, 955, 5),
        'bloodthirsty_instinct': range(850, 955, 5),

        # Return to Karazhan
        'bloodstained_handkerchief': range(855, 955, 5),
        'eye_of_command': range(860, 955, 5),
        'toe_knees_promise': range(855, 955, 5),

        # Nighthold trinkets
        'arcanogolem_digit': range(855, 955, 5),
        'convergence_of_fates': range(860, 955, 5),
        'entwined_elemental_foci': range(860, 955, 5),
        'nightblooming_frond': range(860, 955, 5),
        'draught_of_souls': range(865, 955, 5),

        # Legendary trinkets
        'kiljaedens_burning_wish': [910, 940],
    }

    gearBoosts = {
        137049: 'insignia_of_ravenholdt',
        137030: 'duskwalkers_footpads',
        137098: 'zoldyck_family_training_shackles',
        137021: 'the_dreadlords_deceit',
        137031: 'thraxis_tricksy_treads',
        137099: 'greenskins_waterlogged_wristcuffs',
        141321: 'shivarran_symmetry',
        137032: 'shadow_satyrs_walk',
        137100: 'denial_of_the_half_giants',
        133976: 'cinidaria_the_symbiote',
        144236: 'mantle_of_the_master_assassin',
    }

    # combines gearProcs and gearBoosts
    trinketMap = {**gearProcs, **gearBoosts}

    # Tier + Order Hall sets
    tier18IDs = frozenset([124248, 124257, 124263, 124269, 124274])
    tier18LFRIDs = frozenset([128130, 128121, 128125, 128054, 128131, 128137])
    tier19IDs = frozenset([138326, 138329, 138332, 138335, 138338, 138371])
    orderhallIDs = frozenset([139739, 139740, 139741, 139742, 139743, 139744, 139745, 139746])

    # Legion Dungeon sets
    marchOfTheLegionIDs = frozenset([134529, 134533])
    journeyThroughTimeIDs = frozenset([137419, 137487])
    jacinsRuseIDs = frozenset([137480, 137397])

    # Kara trinket/chest sets
    toeKneesIDs = frozenset([142164, 142203])
    bloodstainedIDs = frozenset([142159, 142203])
    eyeOfCommandIDs = frozenset([142167, 142203])

    def weapon(self, gear_data, slot):
        if slot not in gear_data or gear_data[slot] is None or len(gear_data[slot]) == 0:
            return stats.Weapon(0.01, 2, None, None)

        speed = float(gear_data[slot]['weaponStats']['speed'])
        dmg = float(gear_data[slot]['weaponStats']['dps']) * speed
        return stats.Weapon(dmg, speed, None, None)

    def setup(self, db, input_data, gear_data, gear_stats, gear_ids):

        i18n.set_language('local')

        # Base
        _level = int(input_data['character'].get("level", 110))

        # Buffs
        buff_list = []
        if input_data['settings'].get('buffs.flask_legion_agi', False):
            buff_list.append('flask_wod_agi')
        if input_data['settings'].get('buffs.short_term_haste_buff', False):
            buff_list.append('short_term_haste_buff')
        buff_list.append(input_data['settings']['buffs.food_buff'])

        _buffs = buffs.Buffs(*buff_list, level=_level)

        # ##################################################################################
        # Set up gear buffs.
        buff_list = ['gear_specialization']

        if len(self.tier18IDs & gear_ids) >= 2:
            buff_list.append('rogue_t18_2pc')

        if len(self.tier18IDs & gear_ids) >= 4:
            buff_list.append('rogue_t18_4pc')

        if len(self.tier18LFRIDs & gear_ids) >= 4:
            buff_list.append('rogue_t18_4pc_lfr')

        if len(self.tier19IDs & gear_ids) >= 2:
            buff_list.append('rogue_t19_2pc')

        if len(self.tier19IDs & gear_ids) >= 4:
            buff_list.append('rogue_t19_4pc')

        if len(self.orderhallIDs & gear_ids) >= 6:
            buff_list.append('rogue_orderhall_6pc')

        if len(self.orderhallIDs & gear_ids) == 8:
            buff_list.append('rogue_orderhall_8pc')

        if len(self.marchOfTheLegionIDs & gear_ids) == 2:
            buff_list.append('march_of_the_legion_2pc')

        if len(self.journeyThroughTimeIDs & gear_ids) == 2:
            buff_list.append('journey_through_time_2pc')

        if len(self.jacinsRuseIDs & gear_ids) == 2:
            buff_list.append('jacins_ruse_2pc')

        if len(self.toeKneesIDs & gear_ids) == 2 or len(self.bloodstainedIDs & gear_ids) == 2 or len(self.eyeOfCommandIDs & gear_ids) == 2:
            buff_list.append('kara_empowered_2pc')

        for item_id, item_name in self.gearBoosts.items():
            if item_id in gear_ids:
                buff_list.append(item_name)

        _gear_buffs = stats.GearBuffs(*buff_list)

        # ##################################################################################
        # Trinket procs and enchants
        proclist = []
        for slot, item in gear_data.items():
            item_id = item['id']
            if item_id in self.gearProcs:
                proclist.append((self.gearProcs[item_id], item['item_level']))
                if item_id == 133597:
                    proclist.append(('infallible_tracking_charm_mod', gd[1]))

            enchant = item['enchant']
            if enchant != 0:

                # Look up this enchant from the database to determine whether it has a stat
                # component to it.
                results = db.enchants.find({'spell_id': enchant})
                if results.count() != 0:
                    for stat, value in results[0]['stats'].items():
                        if stat not in gear_stats:
                            gear_stats[stat] = 0
                        gear_stats[stat] += value

                # Also if this is a proc-based enchant, add it to the proclist
                if enchant in self.enchantMap:
                    proclist.append(self.enchantMap[enchant])

        pot = input_data['settings'].get('buffs.pot', 'potion_none')
        if pot != 'potion_none':
            proclist.append(pot)

        prepot = input_data['settings'].get('buffs.prepot', 'potion_none')
        if prepot != 'potion_none':
            proclist.append(prepot)

        # TODO: this doesn't like our new settings for potions
        _procs = procs.ProcsList(*proclist)

        # ##################################################################################
        # Weapons
        _mh = self.weapon(gear_data, 'mainHand')
        _oh = self.weapon(gear_data, 'offHand')
        # ##################################################################################

        # ##################################################################################
        # Player stats
        # Need parameter order here
        # str, agi, int, spi, sta, ap, crit, hit, exp, haste, mastery, mh, oh, thrown, procs, gear buffs
        raceStr = input_data['settings'].get("race", 'human').lower().replace(" ", "_")
        _class = input_data['character'].get('player_class', 'rogue')
        _race = race.Race(raceStr, _class, _level)

        _stats = stats.Stats(
            mh=_mh, oh=_oh, procs=_procs, gear_buffs=_gear_buffs,
            str=gear_stats.get('strength', 0),
            agi=gear_stats.get('agility', 0),
            int=gear_stats.get('intellect', 0),
            stam=gear_stats.get('stamina', 0),
            ap=0,
            crit=gear_stats.get('crit', 0),
            haste=gear_stats.get('haste', 0),
            mastery=gear_stats.get('mastery', 0),
            versatility=gear_stats.get('versatility', 0),
            level=_level)

        # ##################################################################################

        _spec = input_data['character'].get("active", 'a')
        if _spec == "a":
            tree = 0
            spec = "assassination"
        elif _spec == "Z":
            tree = 1
            spec = "outlaw"
        else:
            tree = 2
            spec = "subtlety"

        # Talents
        t = input_data['character']['talents']['current']
        _talents = talents.Talents(t, spec, _class, _level)

        _opt = input_data['settings']
        rotation_keys = [x for x in _opt if x.startswith('rotation') and x.find(spec) != -1]
        existing_options = {key:_opt[key] for key in rotation_keys}
        rotation_options = {}
        for key, value in existing_options.items():
            new_key = key.split('.')[-1]
            rotation_options[new_key] = value

        if spec == "outlaw":
            opts = ['jolly_roger_reroll', 'grand_melee_reroll', 'shark_reroll', 'true_bearing_reroll', 'buried_treasure_reroll', 'broadsides_reroll']

            if _opt['rotation.outlaw.reroll_policy'] != 'custom':
                value = int(_opt['reroll_policy'])
                for opt in opts:
                    rotation_options[opt] = int(value)
            else:
                for opt in opts:
                    rotation_options[opt] = int(_opt[opt])

        # TODO: this option doesn't exist anymore?
#        elif spec == "subtlety":
#            rotation_options['positional_uptime'] = rotation_options['positional_uptime'] / 100.0

        settings_options = {}
        settings_options['num_boss_adds'] = int(_opt.get('general.settings.num_boss_adds', 0))
        settings_options['is_day'] = _opt.get('general.settings.night_elf_racial', 'day') == 'day'
        settings_options['marked_for_death_resets'] = int(_opt.get('general.settings.mfd_resets', 0))
        settings_options['finisher_threshold'] = int(_opt.get("general.settings.finisher_threshold", 0))

        # TODO: this option doesn't exist anymore?
        settings_options['is_demon'] = _opt.get("demon_enemy", 0) == 1
        if tree == 0:
            _cycle = settings.AssassinationCycle(**rotation_options)
        elif tree == 1:
            _cycle = settings.OutlawCycle(**rotation_options)
        else:
            _cycle = settings.SubtletyCycle(**rotation_options)
            _cycle.cp_builder
        _settings = settings.Settings(_cycle,
            response_time = float(_opt.get("general.settings.response_time", 0.5)),
            duration = int(_opt.get('general.settings.duration', 300)),
            latency = float(_opt.get("other.latency", 0.03)),
            adv_params = _opt.get("other.advanced", ''),
            default_ep_stat = 'ap',
            **settings_options
        )

        _artifact = input_data['character']['artifact']

        if len(_artifact['traits']) == 0:
            # if no artifact data was passed (probably because the user had the wrong
            # weapons equipped), pass a string of zeros as the trait data.
            _traits = artifact.Artifact(spec, "rogue", "0"*len(artifact_data.traits[("rogue",spec)]))
        elif len(_artifact['traits']) == len(artifact_data.traits[("rogue",spec)]):
            traitstr = ""
            remap = {}
            for k,v in _artifact['traits'].items():
                remap[self.artifactTraits[_spec][int(k)]] = v

            for t in artifact_data.traits[("rogue",spec)]:
                if (t in remap):
                    traitstr += str(remap[t])
                else:
                    traitstr += "0"

            _traits = artifact.Artifact(spec, "rogue", traitstr)
        else:
            _traits = None

        calculator = AldrianasRogueDamageCalculator(_stats, _talents, _traits, _buffs, _race, spec, _settings, _level)
        return calculator

    def get_all(self, db, input_data):
        out = {}
        try:

            # We do this here instead of in the setup method because the gear data is needed
            # in this method too, so just do it and pass it into setup to avoid doing it
            # twice.
            gear_data = input_data['character'].get("gear", {})
            gear_ids = []
            gear_stats = {}
            for slot, item in gear_data.items():
                gear_ids.append(item['id'])

                # Calculate overall stats as we go
                for stat, value in item['stats'].items():
                    if stat not in gear_stats:
                        gear_stats[stat] = 0
                    gear_stats[stat] += value

            # Turn this into a frozenset so it can be compared against other frozensets
            gear_ids = frozenset(gear_ids)

            calculator = self.setup(db, input_data, gear_data, gear_stats, gear_ids)

            # Compute DPS Breakdown.
            out["breakdown"] = calculator.get_dps_breakdown()
            out["totalDps"] = sum(entry[1] for entry in out["breakdown"].items())

            # Get character stats used for calculation (should equal armory)
            out["stats"] = calculator.stats.get_character_stats(calculator.race)
            # Filter interesting stats
            out["stats"]["agility"] = out["stats"]["agi"]
            out['stats'] = {k:out['stats'][k] for k in ['agility', 'crit', 'versatility', 'mastery', 'haste']}

            # Get EP Values
            default_ep_stats = ['agi', 'haste', 'crit', 'mastery', 'versatility', 'ap']
            _opt = input_data.get("settings", {})
            out["ep"] = calculator.get_ep(ep_stats=default_ep_stats)

            other_buffs = ['rogue_t19_2pc','rogue_t19_4pc','rogue_orderhall_8pc',
                           'rogue_t18_2pc','rogue_t18_4pc','rogue_t18_4pc_lfr',
                           'mark_of_the_hidden_satyr','mark_of_the_distant_army',
                           'mark_of_the_claw','march_of_the_legion_2pc',
                           'journey_through_time_2pc','jacins_ruse_2pc',
                           'kara_empowered_2pc']

            for k,v in self.gearBoosts.items():
                other_buffs.append(v)

            out["other_ep"] = calculator.get_other_ep(other_buffs)

            exclude_items = [item for item in gear_data if item in self.trinkets]
            exclude_procs = [self.gearProcs[x] for x in exclude_items]
            gear_rankings = calculator.get_upgrades_ep_fast(self.trinketGroups)

            out["proc_ep"] = gear_rankings
            out["trinket_map"] = self.trinketMap

            # Compute weapon ep
            out["mh_ep"], out["oh_ep"] = calculator.get_weapon_ep(dps=True, enchants=True)
            out["mh_speed_ep"], out["oh_speed_ep"] = calculator.get_weapon_ep([2.4, 2.6, 1.7, 1.8])
            _spec = input_data.get("spec","a")
            if _spec == "Z":
              out["mh_type_ep"], out["oh_type_ep"] = calculator.get_weapon_type_ep()

            # Talent ranking is slow. This is done last per a note from nextormento.
            talents = calculator.get_talents_ranking()
            out['talentRanking'] = {}
            for tier, values in talents.items():
                out['talentRanking'].update(values)

            out["engine_info"] = calculator.get_engine_info()

            # Get the artifact ranking and change the IDs from the engine back to
            # the item IDs using the artifactMap data.
            artifactRanks = calculator.get_trait_ranking()
            out["traitRanking"] = {}
            for trait,spell_id in self.artifactTraitsReverse[_spec].items():
                if trait in artifactRanks:
                    out['traitRanking'][spell_id] = round(artifactRanks[trait], 2)
                else:
                    out['traitRanking'][spell_id] = 0

            return out
        except (InputNotModeledException, exceptions.InvalidInputException) as e:
            out["error"] = e.error_msg
            return out

def get_engine_output(db, input_data):
    engine = ShadowcraftComputation()
    try:
        response = engine.get_all(db, input_data)
    except KeyError as e:
        traceback.print_exc()
        response = {'error': "%s: %s" % (e.__class__, e.args[0])}
    return response

def get_settings():
    dummy_data = [
        {
            'spec': 'a',
            'heading': 'Assassination Rotation Settings',
            'name': 'rotation.assassination',
            'items': [
                {
                    'name': 'kingsbane',
                    'label': 'Kingsbane w/ Vendetta',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'just',
                    'options': {
                        'just': "Use cooldown if it aligns, but don't delay usage",
                        'only': 'Only use cooldown with Vendetta'
                    }
                },
                {
                    'name': 'exsang',
                    'label': 'Exsang w/ Vendetta',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'just',
                    'options': {
                        'just': "Use cooldown if it aligns, but don't delay usage",
                        'only': 'Only use cooldown with Vendetta'
                    }
                },
                {
                    'name': 'cp_builder',
                    'label': 'CP Builder',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'mutilate',
                    'options': {
                        'mutilate': "Mutilate",
                        'fan_of_knives': 'Fan of Knives'
                    }
                },
                {
                    'name': 'lethal_poison',
                    'label': 'Lethal Poison',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'dp',
                    'options': {
                        'ap': "Deadly Poison",
                        'wp': 'Wound Poison'
                    }
                },
            ]
        },
        {
            'spec': 'Z',
            'heading': 'Outlaw Rotation Settings',
            'name': 'rotation.outlaw',
            'items': [
                {
                    'name': 'blade_flurry',
                    'label': 'Blade Flurry',
                    'description': 'Use Blade Flurry',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'between_the_eyes_policy',
                    'label': 'BtE Policy',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'never',
                    'options': {
                        "shark": "Only use with Shark",
                        "always": 'Use BtE on cooldown',
                        "never": 'Never use BtE',
                    }
                },
                {
                    'name': 'reroll_policy',
                    'label': 'RtB Reroll Policy',
                    'description': '',
                    'type': 'dropdown',
                    'default': '1',
                    'options': {
                        "1": 'Reroll single buffs',
                        "2": 'Reroll two or fewer buffs',
                        "3": 'Reroll three or fewer buffs',
                        "custom": 'Custom setup per buff (see below)',
                    }
                },
                {
                    'name': 'jolly_roger_reroll',
                    'label': 'Jolly Roger',
                    'description': '',
                    'type': 'dropdown',
                    'default': '0',
                    'options': {
                        '0': '0 - Never reroll combos with this buff',
                        '1': '1 - Reroll single buff rolls of this buff',
                        '2': '2 - Reroll double-buff rolls containing this buff',
                        '3': '3 - Reroll triple-buff rolls containing this buff'
                    }
                },
                {
                    'name': 'grand_melee_reroll',
                    'label': 'Grand Melee',
                    'description': '',
                    'type': 'dropdown',
                    'default': '0',
                    'options': {
                        '0': '0 - Never reroll combos with this buff',
                        '1': '1 - Reroll single buff rolls of this buff',
                        '2': '2 - Reroll double-buff rolls containing this buff',
                        '3': '3 - Reroll triple-buff rolls containing this buff'
                    }
                },
                {
                    'name': 'shark_reroll',
                    'label': 'Shark-Infested Waters',
                    'description': '',
                    'type': 'dropdown',
                    'default': '0',
                    'options': {
                        '0': '0 - Never reroll combos with this buff',
                        '1': '1 - Reroll single buff rolls of this buff',
                        '2': '2 - Reroll double-buff rolls containing this buff',
                        '3': '3 - Reroll triple-buff rolls containing this buff'
                    }
                },
                {
                    'name': 'true_bearing_reroll',
                    'label': 'True Bearing',
                    'description': '',
                    'type': 'dropdown',
                    'default': '0',
                    'options': {
                        '0': '0 - Never reroll combos with this buff',
                        '1': '1 - Reroll single buff rolls of this buff',
                        '2': '2 - Reroll double-buff rolls containing this buff',
                        '3': '3 - Reroll triple-buff rolls containing this buff'
                    }
                },
                {
                    'name': 'buried_treasure_reroll',
                    'label': 'Buried Treasure',
                    'description': '',
                    'type': 'dropdown',
                    'default': '0',
                    'options': {
                        '0': '0 - Never reroll combos with this buff',
                        '1': '1 - Reroll single buff rolls of this buff',
                        '2': '2 - Reroll double-buff rolls containing this buff',
                        '3': '3 - Reroll triple-buff rolls containing this buff'
                    }
                },
                {
                    'name': 'broadsides_reroll',
                    'label': 'Broadsides',
                    'description': '',
                    'type': 'dropdown',
                    'default': '0',
                    'options': {
                        '0': '0 - Never reroll combos with this buff',
                        '1': '1 - Reroll single buff rolls of this buff',
                        '2': '2 - Reroll double-buff rolls containing this buff',
                        '3': '3 - Reroll triple-buff rolls containing this buff'
                    }
                }
            ]
        },
        {
            'spec': 'b',
            'heading': 'Subtlety Rotation Settings',
            'name': 'rotation.subtlety',
            'items': [
                {
                    'name': 'cp_builder',
                    'label': 'CP Builder',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'backstab',
                    'options': {
                        'backstab': 'Backstab',
                        'shuriken_storm': 'Shuriken Storm',
                    }
                },
                {
                    'name': 'symbols_policy',
                    'label': 'SoD Policy',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'always',
                    'options': {
                        'always': 'Use on cooldown',
                        'just': 'Only use SoD when needed to refresh',
                    }
                },
                {
                    'name': 'dance_finishers_policy',
                    'label': 'Use Finishers during Dance',
                    'description': '',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'positional_uptime',
                    'label': 'Backstab uptime',
                    'description': 'Percentage of the fight you are behind the target (0-100). This has no effect if Gloomblade is selected as a talent.',
                    'type': 'text',
                },
                {
                    'name': 'compute_cp_waste',
                    'label': 'Compute CP Waste',
                    'description': 'EXPERIMENTAL FEATURE: Compute combo point waste',
                    'type': 'checkbox',
                    'default': False
                }
            ]
        },
        {
            'spec': 'All',
            'heading': 'Raid Buffs',
            'name': 'buffs',
            'items': [
                {
                    'name': 'flask_legion_agi',
                    'label': 'Legion Agility Flask',
                    'description': 'Flask of the Seventh Demon (1300 Agility)',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'short_term_haste_buff',
                    'label': '+30% Haste/40 sec',
                    'description': 'Heroism/Bloodlust/Time Warp',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'food_buff',
                    'label': 'Food',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'food_legion_crit_375',
                    'options': {
                        'food_legion_crit_375': 'The Hungry Magister (375 Crit)',
                        'food_legion_haste_375': 'Azshari Salad (375 Haste)',
                        'food_legion_mastery_375': 'Nightborne Delicacy Platter (375 Mastery)',
                        'food_legion_versatility_375': 'Seed-Battered Fish Plate (375 Versatility)',
                        'food_legion_feast_200': 'Lavish Suramar Feast (200 Agility)',
                        'food_legion_damage_3': 'Fishbrul Special (High Fire Proc)',
                    }
                },
                {
                    'name': 'prepot',
                    'label': 'Pre-pot',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'potion_old_war',
                    'options': {
                        'potion_old_war': 'Potion of the Old War',
                        'potion_deadly_grace': 'Potion of Deadly Grace',
                        'potion_none': 'None',
                    }
                },
                {
                    'name': 'potion',
                    'label': 'Combat Potion',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'potion_old_war',
                    'options': {
                        'potion_old_war': 'Potion of the Old War',
                        'potion_deadly_grace': 'Potion of Deadly Grace',
                        'potion_none': 'None',
                    }
                }
            ]
        },
        {
            'spec': 'All',
            'heading': 'General Settings',
            'name': 'general.settings',
            'items': [
                {
                    'name': 'demon_enemy',
                    'label': 'Enemy is Demon',
                    'description': 'Enables damage buff from heirloom trinket against demons',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'patch',
                    'label': 'Patch/Engine',
                    'description': '',
                    'type': 'dropdown',
                    'default': '7.0',
                    'options': {
                        '7.0': '7.0',
                        'fierys_strange_voodoo': 'fierys strange voodoo',
                    }
                },
                {
                    'name': 'race',
                    'label': 'Race',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'human',
                    'options': {
                        'human': 'Human',
                        'dwarf': 'Dwarf',
                        'orc': 'Orc',
                        'blood_elf': 'Blood Elf',
                        'gnome': 'Gnome',
                        'worgen': 'Worgen',
                        'troll': 'Troll',
                        'night_elf': 'Night Elf',
                        'undead': 'Undead',
                        'goblin': 'Goblin',
                        'pandren': 'Pandaren',
                    }
                },
                {
                    'name': 'night_elf_racial',
                    'label': 'Night Elf Racial',
                    'description': '',
                    'type': 'dropdown',
                    'default': 'night',
                    'options': {
                        'night': 'Night',
                        'day': 'Day',
                    }
                },
                {
                    'name': 'finisher_threshold',
                    'label': 'Finisher Threshold',
                    'description': 'Minimum CPs to use finisher',
                    'type': 'dropdown',
                    'default': '5',
                    'options': {
                        '4': '4',
                        '5': '5',
                        '6': '6'
                    }
                },
                {
                    'name': 'level',
                    'label': 'Level',
                    'description': '',
                    'type': 'text',
                    'default': '110'
                },
                {
                    'name': 'duration',
                    'label': 'Fight Duration',
                    'description': '',
                    'type': 'text',
                    'default': '360'
                },
                {
                    'name': 'response_time',
                    'label': 'Response Time',
                    'description': '',
                    'type': 'text',
                    'default': "0.5",
                },
                {
                    'name': 'num_boss_adds',
                    'label': 'Number of Boss Adds',
                    'description': '',
                    'type': 'text',
                    'default': "0",
                },
                {
                    'name': 'mfd_resets',
                    'label': 'MfD Resets Per Minute',
                    'description': '',
                    'type': 'text',
                    'default': "0",
                }
            ]
        },
        {
            'spec': 'All',
            'heading': 'Item Filter',
            'name': 'general.filter',
            'items': [
                {
                    'name': 'dynamic_ilvl',
                    'label': 'Dynamic ILevel filtering',
                    'description': 'Dynamically filters items in gear lists to +/- 50 Ilevels of the item equipped in that slot. Disable this option to use the manual filtering options below.',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'max_ilvl',
                    'label': 'Max ILevel',
                    'description': "Don't show items over this item level in gear lists",
                    'type': 'text',
                    'default': '1000'
                },
                {
                    'name': 'min_ilvl',
                    'label': 'Min ILevel',
                    'description': "Don't show items under this item level in gear lists",
                    'type': 'text',
                    'default': '850'
                },
                {
                    'name': 'show_upgrades',
                    'label': 'Show Upgrades',
                    'description': 'Show all upgraded items in gear lists',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'epic_gems',
                    'label': 'Recommend Epic Gems',
                    'description': '',
                    'type': 'checkbox',
                    'default': False
                }
            ]
        },
        {
            'spec': 'All',
            'heading': 'Other',
            'name': 'other',
            'items': [
                {
                    'name': 'latency',
                    'label': 'Latency',
                    'description': '',
                    'type': 'text',
                    'default': '0'
                },
                {
                    'name': 'advanced',
                    'label': 'Advanced Parameters',
                    'description': '',
                    'type': 'text',
                    'default': ''
                }
            ]
        }
    ]
    return dummy_data

if __name__ == '__main__':
    print(get_engine_output({}))