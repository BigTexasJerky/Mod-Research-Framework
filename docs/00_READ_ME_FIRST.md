# MOD RESEARCH FRAMEWORK v0.3.0 - DEVELOPER BETA

## What this is

I built MRF because once you start running a pile of mods, dumping every custom research node into Sandustry's normal Tech Tree gets ugly fast.

MRF gives mods their own research tab.

The goal is not to replace Sandustry's research system. It still uses the game's research state, costs and unlocks underneath. MRF just gives modded research a cleaner home and a small API so every modder does not have to reinvent the same thing.

If MRF is installed:
- compatible research goes under **Research -> Mods**
- research can be grouped by category
- vanilla prerequisites still matter
- locked research can send the player back to the vanilla prerequisite
- the vanilla prerequisite gets highlighted
- MRF research stays off the normal vanilla Tech Tree

If MRF is not installed:
- a modder can choose **fallback mode**
- the exact same research can register as a normal vanilla Tech Tree node
- the mod still works

That fallback is optional. The mod author decides.

## Framework ID

`tex.mod-research-framework`

## MRF API version

`1`

Framework version and API version are different things.

MRF may move from 0.3.0 to 0.3.1 without changing the integration contract. Breaking the public contract later would require a new MRF API version.

## Current game target

This developer beta is built and patch-validated against Sandustry 0.5.5.

MRF currently uses three narrow renderer compatibility patches. Sandkit's own docs warn compiled bundle patches are version-sensitive, so do not assume a future Sandustry update is supported until the framework is tested against it.
