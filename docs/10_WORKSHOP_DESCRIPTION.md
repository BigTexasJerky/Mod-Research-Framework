# STEAM WORKSHOP DESCRIPTION - PUBLIC DRAFT

## Mod Research Framework - MRF
### Developer Beta v0.3.0

I made this because the vanilla research tree gets ugly once enough mods start throwing their own nodes into it.

MRF gives compatible mods a separate **Mods** tab under Research. Modders can organize their research by category, keep using normal Sandustry costs and unlocks, and still tie mod research to vanilla progression without covering the vanilla tree in custom nodes.

### What it does

- Adds a dedicated Mods research tab
- Keeps compatible mod research out of the vanilla Tech Tree
- Uses normal Sandustry research costs and saved research state
- Supports vanilla prerequisites
- Shows LOCKED / RESEARCH / RESEARCHED
- Click a locked mod tech to go back to the missing vanilla prerequisite
- Highlights the vanilla tech you still need
- Organizes research into categories
- Includes MISC for mods that do not need some made-up vanilla prerequisite
- Supports mods with more than one research entry
- Public API for other modders
- Optional vanilla fallback support

### For players

MRF is a framework. By itself it mostly gives other mods a place to put their research.

A mod author can make MRF required, or they can use fallback mode.

With fallback mode:
- MRF installed = their research goes into the Mods tab
- MRF not installed = their mod can fall back to a normal vanilla research node

So I am not trying to hold somebody's mod hostage behind another download. The mod author gets to decide how they want it to work.

### For modders

The basic idea is:

```js
MRF.registerResearch({
  id: "yourname.mod.research",
  modId: "yourname.mod",
  name: "Turbo Whatever",
  description: "Unlocks the Turbo Whatever.",
  category: "logistics",
  cost: 25000,
  requires: sandkit.enums.Tech.ConveyorsMk2,
  unlocks: {
    structures: ["turboWhatever"]
  },
  mode: "fallback"
});
```

If MRF is running, that stays out of the vanilla tree.

If MRF is missing and you chose fallback mode, the helper registers the normal vanilla node instead.

The developer download includes the client helper, full API reference, examples, troubleshooting, categories, prerequisites, behavior gating and a release checklist.

### Important for modders

Do not package the full MRF framework inside your mod.

You can package the tiny client helper.

Do not call `registerNode()` for MRF research while MRF is installed. That is exactly the vanilla-tree clutter this framework is trying to get rid of.

### Current compatibility

Built and tested around Sandustry 0.5.5.

MRF currently uses a few narrow renderer patches. Sandustry updates can change compiled bundles, so I will treat game-version compatibility seriously instead of pretending a patch will work forever.

### Framework ID

`tex.mod-research-framework`

### Public API

MRF API v1

### Status

Developer Beta.

I want other modders to beat on this before I call it 1.0. If you find a weird mod layout, prerequisite setup or research pattern that MRF does not handle cleanly, that is exactly the kind of thing I want to know about.

Built by BigTexas.
