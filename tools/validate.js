#!/usr/bin/env node
/* Validates data/objects.json. Run: node tools/validate.js */
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../logic.js");

const MAX_WINS = 8;   // no "god objects"
const MIN_WINS = 2;
const file = path.join(__dirname, "..", "data", "objects.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

const errors = [];
const warnings = [];
const ids = new Set();

data.objects.forEach((o) => {
  if (!o.id || !o.name || !o.emoji || !o.category) errors.push("Object missing a field: " + JSON.stringify(o));
  if (ids.has(o.id)) errors.push("Duplicate id: " + o.id);
  ids.add(o.id);
});

const seen = new Set();
data.matchups.forEach((m) => {
  const [w, l, why] = m;
  if (!ids.has(w)) errors.push("Unknown winner id: " + w);
  if (!ids.has(l)) errors.push("Unknown loser id: " + l);
  if (w === l) errors.push("Object beats itself: " + w);
  if (!why || why.length < 5) errors.push("Missing reason: " + w + " > " + l);
  const k = w + ">" + l;
  if (seen.has(k)) errors.push("Duplicate matchup: " + k);
  seen.add(k);
  if (seen.has(l + ">" + w)) errors.push("Contradiction (both beat each other): " + w + " <-> " + l);
});

const world = L.build(data);
const n = data.objects.length;

data.objects.forEach((o) => {
  const wins = world.beats[o.id].size;
  const losses = world.lostTo[o.id].size;
  if (wins > MAX_WINS) errors.push(o.id + " beats " + wins + " objects (max " + MAX_WINS + ")");
  if (wins < MIN_WINS) errors.push(o.id + " beats only " + wins + " (min " + MIN_WINS + ")");
  if (losses < 1) errors.push(o.id + " never loses to anything");
});

const tris = L.triangles(world);
const inTri = {};
tris.forEach((t) => t.forEach((id) => (inTri[id] = (inTri[id] || 0) + 1)));
data.objects.forEach((o) => {
  if (!inTri[o.id]) warnings.push(o.id + " is in no triangle, so it can never be dealt in a game");
  else if (inTri[o.id] < 2) warnings.push(o.id + " is in only 1 triangle");
});

const pairs = (n * (n - 1)) / 2;
const decisive = data.matchups.length;
console.log("Objects:   " + n);
console.log("Matchups:  " + decisive);
console.log("Coverage:  " + ((decisive / pairs) * 100).toFixed(1) + "% of all pairs are decisive (affects Settle It only)");
console.log("Triangles: " + tris.length + " (hands the dealer can use)");
const wins = data.objects.map((o) => world.beats[o.id].size);
console.log("Wins per object: min " + Math.min(...wins) + ", max " + Math.max(...wins) + ", avg " + (wins.reduce((a, b) => a + b, 0) / n).toFixed(1));

warnings.forEach((w) => console.log("WARN  " + w));
errors.forEach((e) => console.log("ERROR " + e));
if (errors.length) {
  console.log("\nFAILED with " + errors.length + " error(s).");
  process.exit(1);
}
console.log("\nOK");
