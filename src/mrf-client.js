"use strict";

/*
 * Mod Research Framework v0.3.0 client helper
 * API contract version: 1
 *
 * This file is intentionally small enough to ship inside another mod.
 * It is NOT the framework. It only talks to MRF when MRF is installed,
 * and can create a normal vanilla research node when fallback mode is used.
 *
 * BigTexas / MRF
 */
const MRF = (() => {
  const API_VERSION = 1;

  function bridge() {
    return sandkit.engine?.api?.tech || null;
  }

  function info() {
    try {
      return bridge()?.getMRFInfo?.() || null;
    } catch (_) {
      return null;
    }
  }

  function isAvailable() {
    const current = info();
    return !!(
      current &&
      current.id === "tex.mod-research-framework" &&
      Number(current.apiVersion) >= API_VERSION &&
      typeof bridge()?.registerMRFResearch === "function"
    );
  }

  function validate(options) {
    if (!options || typeof options !== "object") {
      throw new Error("MRF.registerResearch requires an options object.");
    }

    for (const field of ["id", "modId", "name", "category"]) {
      if (!options[field] || typeof options[field] !== "string") {
        throw new Error(`MRF.registerResearch missing required string: ${field}`);
      }
    }

    if (!Number.isFinite(Number(options.cost)) || Number(options.cost) < 0) {
      throw new Error("MRF.registerResearch cost must be a number >= 0.");
    }

    const mode = options.mode || "fallback";
    if (!["required", "fallback", "optional"].includes(mode)) {
      throw new Error(
        `MRF.registerResearch mode must be required, fallback, or optional. Got: ${mode}`
      );
    }

    return mode;
  }

  function buildDefinition(options, includeMetadata) {
    const definition = {
      name: options.name,
      description: options.description || "",
      cost: Number(options.cost || 0),
      currencyType: options.currencyType || "gold",
      unlocks: options.unlocks || {}
    };

    if (options.requires != null) {
      definition.requires = options.requires;
    }

    if (includeMetadata) {
      definition.modResearch = {
        apiVersion: API_VERSION,
        modId: options.modId,
        category: options.category,
        name: options.name,
        description: options.description || "",
        parentId: options.requires ?? null
      };

      if (options.costLabel) {
        definition.modResearch.costLabel =
          String(options.costLabel);
      }
    }

    return definition;
  }

  function registerWithMRF(options) {
    const definition =
      buildDefinition(options, true);

    bridge().registerMRFResearch(
      options.id,
      definition
    );

    console.log(
      `[${options.modId}] MRF research registered: ${options.id}`
    );

    return {
      mode: "mrf",
      techId: options.id,
      framework: info()
    };
  }

  function registerVanillaFallback(options) {
    const parentId =
      options.fallbackParentId ??
      (
        Array.isArray(options.requires)
          ? options.requires[0]
          : options.requires
      );

    if (parentId == null) {
      throw new Error(
        `MRF fallback for ${options.id} needs fallbackParentId or a single vanilla requires value.`
      );
    }

    const definition =
      buildDefinition(options, false);

    sandkit.api.tech.registerNode(
      options.id,
      definition,
      {
        parentId,
        ...(options.preferredPosition
          ? { preferredPosition: options.preferredPosition }
          : {})
      }
    );

    console.log(
      `[${options.modId}] MRF not installed. Vanilla research fallback registered: ${options.id}`
    );

    return {
      mode: "vanilla-fallback",
      techId: options.id,
      framework: null
    };
  }

  function registerResearch(options) {
    const mode =
      validate(options);

    if (isAvailable()) {
      return registerWithMRF(options);
    }

    if (mode === "required") {
      throw new Error(
        `[${options.modId}] requires Mod Research Framework v0.3.0+ (API ${API_VERSION}).`
      );
    }

    if (mode === "optional") {
      console.log(
        `[${options.modId}] MRF not installed. Optional research integration skipped.`
      );

      return {
        mode: "optional-skipped",
        techId: options.id,
        framework: null
      };
    }

    return registerVanillaFallback(options);
  }

  return Object.freeze({
    apiVersion: API_VERSION,
    info,
    isAvailable,
    registerResearch
  });
})();
