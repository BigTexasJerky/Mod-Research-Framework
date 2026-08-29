# API REFERENCE

## Detect MRF

```js
MRF.isAvailable()
```

Returns true when a compatible MRF runtime bridge is present.

## Framework information

```js
MRF.info()
```

Current result:

```js
{
  id: "tex.mod-research-framework",
  version: "0.3.0",
  apiVersion: 1
}
```

Do not parse the framework version to decide API compatibility. Check `apiVersion`.

## Register research

```js
MRF.registerResearch(options)
```

### Required fields

`id`
: Globally unique tech ID. Keep this stable after release.

`modId`
: Your exact mod ID.

`name`
: Research name shown to the player.

`category`
: MRF category ID.

`cost`
: Native research cost.

### Recommended fields

`description`
: What the research actually unlocks.

`requires`
: Vanilla prerequisite ID or array of prerequisite IDs.

`unlocks`
: Native Sandustry unlock object.

`mode`
: `fallback`, `required`, or `optional`. Defaults to `fallback`.

### Optional fields

`currencyType`
: Defaults to `gold`.

`costLabel`
: Display-only cost label used by MRF.

`fallbackParentId`
: Explicit vanilla parent for fallback registration. Useful when `requires` is an array.

`preferredPosition`
: Optional vanilla fallback Tech Tree position.

## Return value

MRF mode:

```js
{
  mode: "mrf",
  techId: "...",
  framework: {
    id: "tex.mod-research-framework",
    version: "0.3.0",
    apiVersion: 1
  }
}
```

Fallback:

```js
{
  mode: "vanilla-fallback",
  techId: "...",
  framework: null
}
```

Optional skip:

```js
{
  mode: "optional-skipped",
  techId: "...",
  framework: null
}
```
