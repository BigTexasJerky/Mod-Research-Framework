# Contributing

MRF is still a developer beta.

Useful reports include:
- a research setup MRF does not handle cleanly
- prerequisite navigation failures
- vanilla fallback failures
- duplicate research IDs
- save compatibility problems
- Sandustry update compatibility problems

Before submitting code:
- validate JavaScript with `node --check`
- keep runtime changes inside `runtime/Mod Research Framework`
- keep developer-only helpers and examples outside the runtime folder
- do not add extra source files to the Workshop runtime unless the game actually needs them
