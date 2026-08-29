# HOW TO KEEP YOUR MOD OFF THE VANILLA TREE

When MRF is available, do not call:

```js
sandkit.api.tech.registerNode(...)
```

for your MRF research.

That function is for the vanilla tree.

Use:

```js
MRF.registerResearch(...)
```

or, if you do not want the client helper:

```js
sandkit.engine.api.tech.registerMRFResearch(
  TECH_ID,
  definition
);
```

MRF also has a defensive compatibility rule that hides a native node carrying `modResearch` metadata. That is a safety net, not the integration method.

Clean integration means the mod never creates the vanilla node while MRF is active.

In fallback mode, the helper calls `registerNode()` only when MRF is missing. That is intentional.
