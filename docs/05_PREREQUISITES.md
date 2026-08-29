# PREREQUISITES

Use Sandustry's enum whenever possible:

```js
requires:
  sandkit.enums.Tech.Thermo
```

not:

```js
requires: 21
```

Both may resolve to the same current ID, but one can actually be understood six months later.

MRF uses the real prerequisite ID for:
- lock state
- displayed vanilla prerequisite
- Tech Tree navigation
- highlight target

## No prerequisite

Just omit `requires`.

For fallback mode, a vanilla node still needs somewhere to live. If you truly want no prerequisite and still want vanilla fallback, give the helper an explicit fallback parent:

```js
fallbackParentId:
  sandkit.enums.Tech.SomeSensibleRoot
```

The MRF version can still display no prerequisite while the vanilla fallback needs a physical tree parent.

## Multiple prerequisites

```js
requires: [
  sandkit.enums.Tech.Vacuum,
  sandkit.enums.Tech.QuantumPortal
],

fallbackParentId:
  sandkit.enums.Tech.QuantumPortal
```

MRF requires all listed prerequisites.

Vanilla fallback can only have one physical parent node, so `fallbackParentId` tells the helper where to draw it.
