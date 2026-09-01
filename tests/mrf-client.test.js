"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const clientSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "mrf-client.js"),
  "utf8"
);

function createContext(withFramework) {
  const captured = {
    mrf: null,
    fallback: null
  };

  const techBridge = {
    getMRFInfo: withFramework
      ? () => ({
          id: "tex.mod-research-framework",
          version: "0.3.0",
          apiVersion: 1
        })
      : () => null,
    registerMRFResearch(id, definition) {
      captured.mrf = { id, definition };
    }
  };

  const context = vm.createContext({
    console,
    sandkit: {
      engine: { api: { tech: techBridge } },
      api: {
        tech: {
          registerNode(id, definition, placement) {
            captured.fallback = { id, definition, placement };
          }
        }
      }
    }
  });

  vm.runInContext(clientSource, context);
  return { context, captured };
}

function localizedOptions() {
  return {
    id: "example.localized-tech",
    modId: "example.mod",
    nameKey: "mods|example|techName",
    descriptionKey: "mods|example|techDescription",
    category: "special",
    cost: 25000,
    currencyType: "gold",
    requires: 48,
    unlocks: { structures: ["exampleMachine"] },
    locked: true,
    branch: "alien",
    isElectricity: true,
    mode: "fallback"
  };
}

{
  const { context, captured } = createContext(true);
  context.options = localizedOptions();
  vm.runInContext("MRF.registerResearch(options)", context);

  assert.equal(captured.mrf.id, "example.localized-tech");
  assert.equal(captured.mrf.definition.name, undefined);
  assert.equal(captured.mrf.definition.nameKey, "mods|example|techName");
  assert.equal(captured.mrf.definition.descriptionKey, "mods|example|techDescription");
  assert.equal(captured.mrf.definition.locked, true);
  assert.equal(captured.mrf.definition.branch, "alien");
  assert.equal(captured.mrf.definition.isElectricity, true);
  assert.equal(captured.mrf.definition.modResearch.nameKey, "mods|example|techName");
  assert.equal(
    captured.mrf.definition.modResearch.descriptionKey,
    "mods|example|techDescription"
  );
}

{
  const { context, captured } = createContext(false);
  context.options = localizedOptions();
  vm.runInContext("MRF.registerResearch(options)", context);

  assert.equal(captured.fallback.id, "example.localized-tech");
  assert.equal(captured.fallback.definition.nameKey, "mods|example|techName");
  assert.equal(captured.fallback.definition.descriptionKey, "mods|example|techDescription");
  assert.equal(captured.fallback.definition.locked, true);
  assert.equal(captured.fallback.definition.branch, "alien");
  assert.equal(captured.fallback.definition.isElectricity, true);
  assert.equal(captured.fallback.placement.parentId, 48);
}

console.log("MRF client localized tech field tests passed.");
