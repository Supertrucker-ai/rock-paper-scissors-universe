#!/usr/bin/env node
/* Logic tests. Run: node tools/test.js */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const L = require("../logic.js");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "objects.json"), "utf8"));
const world = L.build(data);

// resolve: classic rock paper scissors
assert.strictEqual(L.resolve(world, "rock", "scissors").winner, "rock");
assert.strictEqual(L.resolve(world, "scissors", "rock").winner, "rock");
assert.strictEqual(L.resolve(world, "paper", "rock").winner, "paper");
assert.strictEqual(L.resolve(world, "scissors", "paper").winner, "scissors");
assert.strictEqual(L.resolve(world, "rock", "rock").result, "tie");
assert.strictEqual(L.resolve(world, "rock", "rock").winner, undefined);
assert.strictEqual(L.resolve(world, "cat", "magnet").result, "none");
assert.ok(/Rock dulls/.test(L.resolve(world, "scissors", "rock").why));

// "a"/"b" orientation
assert.strictEqual(L.resolve(world, "rock", "scissors").result, "a");
assert.strictEqual(L.resolve(world, "scissors", "rock").result, "b");

// Every dealt hand is a true cycle: all three pairs decisive, nobody wins twice
const tris = L.triangles(world);
assert.ok(tris.length > 0, "no triangles");
let prev = null;
for (let i = 0; i < 2000; i++) {
  const hand = L.deal(tris, prev, Math.random);
  prev = hand.key;
  assert.strictEqual(hand.ids.length, 3);
  assert.strictEqual(new Set(hand.ids).size, 3, "duplicate in hand");
  const wins = { };
  hand.ids.forEach((x) => (wins[x] = 0));
  for (let a = 0; a < 3; a++) {
    for (let b = a + 1; b < 3; b++) {
      const r = L.resolve(world, hand.ids[a], hand.ids[b]);
      assert.ok(r.result === "a" || r.result === "b", "undecided pair in hand");
      wins[r.winner]++;
    }
  }
  hand.ids.forEach((x) => assert.strictEqual(wins[x], 1, "hand is not a cycle"));
}

// dealer avoids immediate repeats
let repeats = 0, last = null;
for (let i = 0; i < 500; i++) {
  const h = L.deal(tris, last, Math.random);
  if (h.key === last) repeats++;
  last = h.key;
}
assert.strictEqual(repeats, 0, "dealer repeated a hand");

// tricky CPU counters the player's last pick
const hand = tris[0];
const x = hand[0];
const counter = hand.find((y) => world.beats[y].has(x));
assert.strictEqual(L.cpuPick(world, hand, "tricky", x, Math.random), counter);
// easy CPU stays inside the hand
for (let i = 0; i < 100; i++) assert.ok(hand.includes(L.cpuPick(world, hand, "easy", x, Math.random)));

console.log("All tests passed (" + tris.length + " triangles).");
