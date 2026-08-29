# TROUBLESHOOTING

## Research shows in both MRF and vanilla

You are probably registering it twice.

Search your mod for:
- `registerNode(`
- old research setup code
- a fallback path that does not actually check MRF

With MRF available there should be no vanilla `registerNode()` call for that research.

## Research is missing from MRF

Check:
- MRF v0.3.0+ is enabled
- `MRF.isAvailable()` returns true
- tech ID is unique
- `modId` is correct
- category is a string
- your code did not throw before registration

## Fallback does not show

A vanilla node needs a parent.

If `requires` is missing or is an array, set:

```js
fallbackParentId:
  sandkit.enums.Tech.WhateverMakesSense
```

## Structure shows before research

Look for:
- `alwaysUnlocked: true`
- unconditional `unlockByType()`
- unconditional `unlockById()`

Use `alwaysUnlocked: false` and `unlockedBy: TECH_ID`.

## LOCKED sends me to the wrong vanilla tech

Make sure your `requires` contains the actual vanilla Tech enum, not the display text.

Bad:

```js
requires: "Drying & Condensing"
```

Good:

```js
requires:
  sandkit.enums.Tech.Thermo
```

## Sandustry updated and MRF disappeared

MRF currently uses narrow renderer patches. Game bundle updates can move those anchors.

Check for a newer MRF build before assuming every dependent mod broke.
