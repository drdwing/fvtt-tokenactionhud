import {ActionHandlerPf2e} from './pf2e-actions.js';
import * as settings from '../../settings.js';

export class NpcActionHandlerPf2e {
    constructor(actionHandlerpf2e) {
        this.baseHandler = actionHandlerpf2e;
    }

    async buildActionList(result, tokenId, actor) {
        let actorType = 'npc';

        let strikes = this._getStrikesListNpc(actor, tokenId, actorType);
        let actions = this.baseHandler._getActionsList(actor, tokenId, actorType);
        let items = this.baseHandler._getItemsList(actor, tokenId, actorType);
        let spells = this.baseHandler._getSpellsList(actor, tokenId, actorType);
        let feats = this.baseHandler._getFeatsList(actor, tokenId, actorType);
        let skills = this._getSkillsListNpc(actor, tokenId, actorType);
        let saves = this.baseHandler._getSaveList(actor, tokenId, actorType);
        let attributes = this._getAttributeListNpc(actor, tokenId, actorType);     
        
        this.baseHandler._combineCategoryWithList(result, 'strikes', strikes);
        this.baseHandler._combineCategoryWithList(result, 'actions', actions);
        this.baseHandler._combineCategoryWithList(result, 'items', items);
        this.baseHandler._combineCategoryWithList(result, 'spells', spells);
        this.baseHandler._combineCategoryWithList(result, 'feats', feats);
        this.baseHandler._combineCategoryWithList(result, 'skills', skills);
        this.baseHandler._combineCategoryWithList(result, 'saves', saves);
        if (settings.get('showNpcAbilities')) {
            let abilities = this.baseHandler._getAbilityList(actor, tokenId, actorType);
            this.baseHandler._combineCategoryWithList(result, 'abilities', abilities);
        }
        this.baseHandler._combineCategoryWithList(result, 'attributes', attributes);
    }

    /** @private */
    _getStrikesListNpc(actor, tokenId, actorType) {
        let macroType = 'strike';
        let result = this.baseHandler.initializeEmptyCategory();

        let strikes = actor.items.filter(a => a.type === 'melee');

        let calculateAttackPenalty = settings.get('calculateAttackPenalty')

        strikes.forEach(s => {
            let subcategory = this.baseHandler.initializeEmptySubcategory();

            let variantsMap = [];
            let map = s.data.isAgile ? 4 : 5;
            let attackMod = s.data.data.bonus.total;
            
            let currentMap = 0;
            let currentBonus = attackMod;

            for (let i = 0; i < 3; i++) {
                if (currentBonus === attackMod || calculateAttackPenalty) {
                    name = currentBonus >= 0 ? `+${currentBonus}` : `${currentBonus}`;
                }
                else {
                    name = currentMap >= 0 ? `+${currentMap}` : `${currentMap}`;
                }
                currentMap -= map;
                currentBonus -= map;

                variantsMap.push({_id: `${s.data._id}>${i}`, name: name});
            }
                
            subcategory.actions = this.baseHandler._produceMap(tokenId, actorType, variantsMap, macroType);
            
            subcategory.actions.push({name: 'Damage', encodedValue: `${actorType}.${macroType}.${tokenId}.${encodeURIComponent(s.data._id+'>damage')}`, id: encodeURIComponent(s.data._id+'>damage')})
            subcategory.actions.push({name: 'Critical', encodedValue: `${actorType}.${macroType}.${tokenId}.${encodeURIComponent(s.data._id+'>critical')}`, id: encodeURIComponent(s.data._id+'>critical')})

            let attackEffects = s.data.data.attackEffects?.value;
            if (attackEffects.length > 0)
                attackEffects.forEach(a => subcategory.actions.push({name: `Plus ${a}`, encodedValue: `${actorType}.${macroType}.${tokenId}.plus>${encodeURIComponent(a)}`}));

            this.baseHandler._combineSubcategoryWithCategory(result, s.name, subcategory);
        });

        return result;
    }

    /** @private */
    _getSkillsListNpc(actor, tokenId, actorType) {
        let result = this.baseHandler.initializeEmptyCategory();
        
        let loreItems = actor.items.filter(i => i.data.type === 'lore');
        let lore = this.baseHandler.initializeEmptySubcategory();
        lore.actions = this.baseHandler._produceMap(tokenId, actorType, loreItems, 'lore');
        
        let abbr = settings.get('abbreviateSkills');
        if (abbr)
            lore.actions.forEach(l => { 
                l.name = l.name.substr(0,3)
            });

        this.baseHandler._combineSubcategoryWithCategory(result, 'skills', lore);

        return result;
    }

    /** @private */
    _getAttributeListNpc(actor, tokenId, actorType) {
        let macroType = 'attribute';
        let result = this.baseHandler.initializeEmptyCategory();
        let attributes = this.baseHandler.initializeEmptySubcategory();

        let attributesMap = [{_id: 'perception', name: 'Perception'},{_id: 'initiative', name: 'Initiative'}]
        
        attributes.actions = this.baseHandler._produceMap(tokenId, actorType, attributesMap, macroType);
        
        this.baseHandler._combineSubcategoryWithCategory(result, 'attributes', attributes);

        return result;
    }
}