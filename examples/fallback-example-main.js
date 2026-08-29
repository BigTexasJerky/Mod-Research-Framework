"use strict";

const { api, enums } = sandkit;

/* Paste/include mrf-client.js above this point. */

const MOD_ID = "example.fallback-machine";
const STRUCTURE_ID = "fallbackMachine";
const TECH_ID = "example.fallback-machine.research";

api.structures.register({
  id: STRUCTURE_ID,
  blockGridType: STRUCTURE_ID,
  name: "Fallback Machine",
  description: "Example machine for MRF fallback mode.",
  categoryKey: "thermal",
  alwaysUnlocked: false,
  unlockedBy: TECH_ID,
  buildModes: [{ type: "single" }],
  variants: [{ id: STRUCTURE_ID, angles: [0] }],
  shape: [
    [1,1,1,1],
    [1,1,1,1],
    [1,1,1,1],
    [1,1,1,1]
  ]
});

MRF.registerResearch({
  id: TECH_ID,
  modId: MOD_ID,
  name: "Fallback Machine Research",
  description: "Unlocks the Fallback Machine.",
  category: "thermal",
  cost: 5000,
  requires: enums.Tech.Thermo,
  unlocks: {
    structures: [STRUCTURE_ID]
  },
  mode: "fallback"
});
