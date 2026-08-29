# FIVE MINUTE INTEGRATION

There are two pieces:

1. MRF itself is a standalone Workshop mod.
2. Your mod may carry the tiny `mrf-client.js` helper.

Do **not** package MRF's `entry.js` or `patches.json` inside your mod.

## Recommended public setup: fallback mode

Copy the contents of `mrf-client.js` near the top of your main entry, or keep the helper with your source and bundle it into your entry.

Then:

```js
const TECH_ID = "yourname.my-mod.research";

const result = MRF.registerResearch({
  id: TECH_ID,
  modId: "yourname.my-mod",

  name: "Industrial Steam Wizardry",
  description: "Unlocks the Steam Machine.",

  category: "thermal",
  cost: 15000,

  requires:
    sandkit.enums.Tech.Thermo,

  unlocks: {
    structures: [
      "steamMachine"
    ]
  },

  mode: "fallback"
});
```

With MRF:
`Industrial Steam Wizardry` appears under Mods -> Thermal.

Without MRF:
it becomes a normal child of the vanilla Thermo research.

Same tech ID. Same cost. Same unlock. Same save-state key.

## Structure gating

```js
api.structures.register({
  id: "steamMachine",
  blockGridType: "steamMachine",
  name: "Steam Machine",

  alwaysUnlocked: false,
  unlockedBy: TECH_ID,

  // the rest of your structure...
});
```

Do not turn around and call `unlockByType()` unconditionally or you just defeated your own research gate.
