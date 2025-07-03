Hooks.once("init", () => {
  console.log("ua2025-arcane-subclasses.js hooked");
  CONFIG.DND5E.featureTypes.class.subtypes.magicTattoos = "Magic Tattoos";
  CONFIG.DND5E.activityActivationTypes.castASpell = {
    label: "Cast a Spell",
    group: "DND5E.ACTIVATION.Category.Combat"
  };
  CONFIG.DND5E.activityActivationTypes.expendFocus = {
    label: "Expend Focus",
    group: "DND5E.ACTIVATION.Category.Combat"
  };
});