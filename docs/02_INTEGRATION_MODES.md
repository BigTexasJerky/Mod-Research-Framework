# INTEGRATION MODES

## `fallback` - recommended for most public mods

```js
mode: "fallback"
```

MRF installed:
- goes to the Mods tab
- no vanilla mod node

MRF missing:
- registers a vanilla research node

This is the easiest sell to players because your mod does not become useless just because they did not subscribe to MRF.

Do NOT declare MRF as a hard manifest dependency when using fallback mode. If Sandustry blocks your mod because the dependency is missing, your fallback code never gets a chance to run.

## `required`

```js
mode: "required"
```

MRF installed:
- normal MRF research

MRF missing:
- helper throws a clear error
- no vanilla fallback

For this mode, add:

```json
"dependencies": [
  "tex.mod-research-framework"
]
```

Use this when your mod actually depends on MRF and you do not want to maintain a vanilla layout.

## `optional`

```js
mode: "optional"
```

MRF installed:
- research appears in Mods

MRF missing:
- MRF research registration is skipped

This is useful for a mod where research is an extra progression layer and the mod already has sane behavior without it.

Do not use optional mode for a structure that is permanently `alwaysUnlocked: false` unless your no-MRF path separately unlocks that structure.
