/* Rock Paper Scissors Universe: pure game logic (no DOM). Works in browser and Node. */
(function (root) {
  "use strict";

  function build(data) {
    var byId = {};
    var beats = {};
    var lostTo = {};
    var why = {};
    data.objects.forEach(function (o) {
      byId[o.id] = o;
      beats[o.id] = new Set();
      lostTo[o.id] = new Set();
    });
    data.matchups.forEach(function (m) {
      var w = m[0], l = m[1], reason = m[2];
      if (!byId[w] || !byId[l]) return;
      beats[w].add(l);
      lostTo[l].add(w);
      why[w + ">" + l] = reason;
    });
    return { objects: data.objects, byId: byId, beats: beats, lostTo: lostTo, why: why };
  }

  // Returns { result: 'tie' | 'a' | 'b' | 'none', winner, loser, why }
  function resolve(world, a, b) {
    if (a === b) return { result: "tie" };
    if (world.beats[a].has(b)) return { result: "a", winner: a, loser: b, why: world.why[a + ">" + b] };
    if (world.beats[b].has(a)) return { result: "b", winner: b, loser: a, why: world.why[b + ">" + a] };
    return { result: "none" };
  }

  // Every cycle A>B>C>A, listed once, each as [a, b, c] with a being the smallest id.
  function triangles(world) {
    var out = [];
    Object.keys(world.beats).forEach(function (a) {
      world.beats[a].forEach(function (b) {
        world.beats[b].forEach(function (c) {
          if (c !== a && world.beats[c].has(a) && a < b && a < c) out.push([a, b, c]);
        });
      });
    });
    return out;
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Deal a shared hand of 3 objects that form a cycle. Avoids repeating the previous hand.
  function deal(tris, prevKey, rng) {
    rng = rng || Math.random;
    var pick, key, tries = 0;
    do {
      pick = tris[Math.floor(rng() * tris.length)];
      key = pick.slice().sort().join("|");
      tries++;
    } while (key === prevKey && tris.length > 1 && tries < 20);
    return { ids: shuffle(pick, rng), key: key };
  }

  // CPU pick. "easy" = random. "tricky" = counters the player's last pick when it is in the hand.
  function cpuPick(world, hand, difficulty, lastPlayerPick, rng) {
    rng = rng || Math.random;
    if (difficulty === "tricky" && lastPlayerPick && hand.indexOf(lastPlayerPick) !== -1) {
      for (var i = 0; i < hand.length; i++) {
        if (world.beats[hand[i]].has(lastPlayerPick)) return hand[i];
      }
    }
    return hand[Math.floor(rng() * hand.length)];
  }

  var api = { build: build, resolve: resolve, triangles: triangles, deal: deal, cpuPick: cpuPick, shuffle: shuffle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RPSU = api;
})(typeof window !== "undefined" ? window : this);
