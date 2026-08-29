# Mod Research Framework (MRF)

**Developer Beta v0.3.0**  
**Author:** BigTexas  
**Framework ID:** `tex.mod-research-framework`

MRF keeps compatible Sandustry mod research out of the vanilla Tech Tree and puts it in a dedicated **Mods** research tab.

This repository is the developer home for MRF. The Steam Workshop item should stay lightweight. Documentation, examples and the client helper live here instead of being shoved into Sandustry's installed mod folder.

## Repository layout

```text
runtime/
  Mod Research Framework/
    modinfo.json
    entry.js
    patches.json
    preview.png
    README.txt

src/
  mrf-client.js

docs/
  full developer documentation

examples/
  fallback-example-main.js
  required-example-main.js
  optional-example-main.js

.vscode/
  tasks.json
  settings.json
  extensions.json

MRF.code-workspace
```

## Open in VS Code

Clone the repository and open:

```text
MRF.code-workspace
```

or just open the repository folder.

## Recommended integration

Use the client helper from:

```text
src/mrf-client.js
```

Then register research:

```js
MRF.registerResearch({
  id: "yourname.mod.research",
  modId: "yourname.mod",

  name: "Turbo Whatever",
  description: "Unlocks the Turbo Whatever.",

  category: "logistics",
  cost: 25000,

  requires:
    sandkit.enums.Tech.ConveyorsMk2,

  unlocks: {
    structures: ["turboWhatever"]
  },

  mode: "fallback"
});
```

### Fallback mode

With MRF installed:
- research appears in the Mods tab
- no mod node clutters the vanilla tree

Without MRF:
- the helper can register a normal vanilla research node

## Steam Workshop

Do **not** ship this entire repository as the installed Workshop mod.

The Workshop runtime should come only from:

```text
runtime/Mod Research Framework/
```

GitHub is the developer distribution.
Steam is the player/runtime distribution.

That split keeps Sandustry's mod loader clean and gives developers somewhere sane to get docs, examples and source.

## Start here

1. `docs/00_READ_ME_FIRST.md`
2. `docs/01_FIVE_MINUTE_INTEGRATION.md`
3. `docs/02_INTEGRATION_MODES.md`
4. `docs/03_API_REFERENCE.md`
