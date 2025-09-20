const MODULE_ID = "UA2025-ArcaneSubclasses";
const RECOVER_FLAG_PATH = "recoverOnUse";

export function onRenderItemSheetOtherAbility(app, html) {
  try {
    const item = app.document;
    const actor = item?.actor;

    const root = app.element ?? html?.[0] ?? html;
    if (!root) return;

    root.querySelectorAll('select[name^="system.uses.recovery."][name$=".period"]').forEach((selectEl) => {
      if (selectEl.value !== "otherAbility") return;
      const name = selectEl.getAttribute("name") || "";
      const match = name.match(/system\.uses\.recovery\.(\d+)\.period/);
      if (!match) return;
      const index = match[1];

      const card = selectEl.closest('.form-group.split-group.full-width.card .form-fields')
        || selectEl.closest('.form-group .form-fields')
        || selectEl.parentElement;
      if (!card) return;

      if (card.querySelector(`[data-ua-recover-on-use-index="${index}"]`)) return;

      const mapping = item.getFlag(MODULE_ID, RECOVER_FLAG_PATH) || {};

      const wrapper = document.createElement('div');
      wrapper.classList.add('form-group');
      const label = document.createElement('label');
      label.textContent = actor ? 'Trigger Item' : 'Trigger Item UUID';
      wrapper.appendChild(label);
      const fieldWrap = document.createElement('div');
      fieldWrap.classList.add('form-fields');

      if (actor) {
        const opts = document.createElement('select');
        opts.setAttribute('data-ua-recover-on-use-index', index);
        opts.classList.add('ua-recover-on-use-target');
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Trigger Item —";
        opts.appendChild(placeholder);
        for (const it of actor.items) {
          const opt = document.createElement('option');
          opt.value = it.id;
          opt.textContent = it.name;
          opts.appendChild(opt);
        }

        let stored = mapping[index];
        if (stored && typeof stored === 'string' && stored.includes('.')) {
          try {
            const resolved = actor.sourcedItems?.get(stored)?.first?.();
            if (resolved) stored = resolved.id;
            else if (item.getFlag('core', 'sourceId') === stored) stored = item.id;
          } catch (e) {}
        }
        if (stored) opts.value = String(stored);

        fieldWrap.appendChild(opts);
        wrapper.appendChild(fieldWrap);
        card.parentElement?.appendChild(wrapper);

        opts.addEventListener('change', async (ev) => {
          const val = ev.currentTarget.value || null;
          const current = item.getFlag(MODULE_ID, RECOVER_FLAG_PATH) || {};
          if (val) current[index] = val; else delete current[index];
          await item.setFlag(MODULE_ID, RECOVER_FLAG_PATH, current);
        });
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Compendium UUID or relative UUID';
        input.setAttribute('data-ua-recover-on-use-index', index);
        if (mapping[index]) input.value = String(mapping[index]);

        input.addEventListener('change', async (ev) => {
          const val = ev.currentTarget.value?.trim?.();
          const current = item.getFlag(MODULE_ID, RECOVER_FLAG_PATH) || {};
          if (val) current[index] = val; else delete current[index];
          await item.setFlag(MODULE_ID, RECOVER_FLAG_PATH, current);
        });

        input.addEventListener('dragover', (ev) => { ev.preventDefault(); });
        input.addEventListener('drop', async (ev) => {
          try {
            ev.preventDefault();
            const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
            if (data?.uuid) {
              input.value = data.uuid;
              const current = item.getFlag(MODULE_ID, RECOVER_FLAG_PATH) || {};
              current[index] = data.uuid;
              await item.setFlag(MODULE_ID, RECOVER_FLAG_PATH, current);
            }
          } catch (e) {}
        });

        fieldWrap.appendChild(input);
        wrapper.appendChild(fieldWrap);
        card.parentElement?.appendChild(wrapper);
      }
    });
  } catch (err) {
    console.error(`${MODULE_ID} | renderItemSheet5e injection failed`, err);
  }
}

export async function onPostUseActivityOtherAbility(activity/*, usageConfig, results */) {
  try {
    const usedItem = activity?.item;
    const actor = usedItem?.actor;
    if (!actor || !usedItem) return;

    const updates = [];
    for (const item of actor.items) {
      const sys = item.system || {};
      const uses = sys.uses || {};
      const recovery = Array.isArray(uses.recovery) ? uses.recovery : [];
      if (!recovery.length) continue;
      const mapping = item.getFlag(MODULE_ID, RECOVER_FLAG_PATH) || {};
      for (const [index, target] of Object.entries(mapping)) {
        if (!target) continue;
        let matches = false;
        if (target === usedItem.id) matches = true;
        else if (typeof target === 'string' && target.includes('.')) {
          try {
            const resolved = actor.sourcedItems?.get(target)?.first?.();
            if (resolved && (resolved.id === usedItem.id)) matches = true;
          } catch (e) {}
        }
        if (!matches) continue;
        const rec = recovery[Number(index)];
        if (!rec || rec.period !== 'otherAbility') continue;
        const max = Number(uses.max);
        if (!Number.isFinite(max)) continue;

        let newSpent = uses.spent ?? 0;
        if (rec.type === 'recoverAll') {
          newSpent = 0;
        } else if (rec.type === 'loseAll') {
          newSpent = max;
        } else if (rec.type === 'formula' && rec.formula) {
          try {
            const roll = new CONFIG.Dice.BasicRoll(rec.formula, item.getRollData());
            await roll.evaluate();
            const gain = Number(roll.total) || 0;
            newSpent = Math.clamp((uses.spent ?? 0) - gain, 0, max);
          } catch (e) {
            continue;
          }
        } else {
          newSpent = Math.clamp((uses.spent ?? 0) - 1, 0, max);
        }

        if (newSpent !== uses.spent) {
          updates.push({ _id: item.id, 'system.uses.spent': newSpent });
        }
      }
    }

    if (updates.length) await actor.updateEmbeddedDocuments('Item', updates);
  } catch (err) {
    console.error(`${MODULE_ID} | postUseActivity recovery failed`, err);
  }
}


