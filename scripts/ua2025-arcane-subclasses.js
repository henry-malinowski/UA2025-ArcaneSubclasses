import { onRenderItemSheetOtherAbility, onPostUseActivityOtherAbility } from "./recovery-other-ability.js";

Hooks.once("init", () => {
  CONFIG.DND5E.featureTypes.class.subtypes.magicTattoos = "Magic Tattoos";
  CONFIG.DND5E.activityActivationTypes.castASpell = {
    label: "Cast a Spell",
    group: "DND5E.ACTIVATION.Category.Combat"
  };
  CONFIG.DND5E.activityActivationTypes.expendFocus = {
    label: "Expend Focus",
    group: "DND5E.ACTIVATION.Category.Combat"
  };
  
  // Idempotent registration: only define the period and hooks if not already present
  if (!CONFIG.DND5E.limitedUsePeriods.otherAbility) {
    CONFIG.DND5E.limitedUsePeriods.otherAbility = {
      label: "Other Ability used",
      abbreviation: "Other Ability",
      type: "special"
    };
    Hooks.on("renderItemSheet5e", onRenderItemSheetOtherAbility);
    Hooks.on("dnd5e.postUseActivity", onPostUseActivityOtherAbility);
  }
  
  console.log("ua2025-arcane-subclasses.js hooked");
});