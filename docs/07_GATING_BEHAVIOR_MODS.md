# GATING BEHAVIOR MODS

Researching a card cannot magically stop JavaScript that already ran.

If your mod changes global behavior, make the feature check its tech state.

```js
const TECH_ID =
  "yourname.super-laser.research";

function researched() {
  return sandkit.api.tech.isResearchedById(
    TECH_ID
  );
}

function applySuperLaser(args) {
  if (!researched()) return;

  // do the spicy laser stuff
}
```

Gate the actual feature at the narrowest useful hook or processor.

For structures, native `unlockedBy` is usually the cleaner route.

A card that does not control anything is still allowed, but call it what it is: a progression marker, not a real unlock.
