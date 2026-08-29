# MOD AUTHOR RELEASE CHECKLIST

Before you upload an MRF-compatible mod:

- Pick a permanent unique tech ID.
- Pick the correct `modId`.
- Pick a category that actually makes sense.
- Use a real vanilla enum for prerequisites.
- Test with MRF installed.
- Confirm the research does NOT appear in vanilla with MRF installed.
- Confirm cost is deducted.
- Confirm unlock actually happens.
- Restart the game and confirm researched state survives.
- If using fallback mode, disable/remove MRF and test again.
- Confirm the vanilla fallback node appears.
- Confirm the fallback purchase unlocks the same thing.
- Re-enable MRF and confirm there is no duplicate node.
- Test an existing save.
- Test a fresh save.
- If using multiple prerequisites, set a sensible `fallbackParentId`.
- If the mod changes global behavior, verify the feature itself is gated.
- Do not ship MRF's `patches.json` inside your mod.
- Do not copy the full framework into your mod.
- It is fine to ship the tiny client helper.

If you only tested the MRF path, you did not test fallback mode.
