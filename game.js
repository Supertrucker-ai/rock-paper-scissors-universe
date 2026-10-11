/* Rock Paper Scissors Universe: UI. Game rules live in logic.js. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var world = null;
  var tris = [];

  // localStorage can throw or be empty (private mode, blocked data), so every access is wrapped.
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } }
  };

  var WINS_NEEDED = 3; // best of 5
  var state = {
    difficulty: store.get("rpsu.difficulty") === "tricky" ? "tricky" : "easy",
    best: parseInt(store.get("rpsu.best") || "0", 10) || 0,
    prevKey: null,
    lastPick: null
  };

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(cls, html, onClick) {
    var b = el("button", cls, html);
    b.type = "button";
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  function clear() { app.innerHTML = ""; window.scrollTo(0, 0); }
  function obj(id) { return world.byId[id]; }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }

  /* ---------- Home ---------- */
  function showHome() {
    clear();
    app.appendChild(el("div", "hero", "🪨📄✂️"));
    app.appendChild(el("h1", "", "Rock Paper Scissors <span>Universe</span>"));
    app.appendChild(el("p", "sub", "Every object. One question: which one wins?"));

    var play = btn("btn primary", '<span>Play vs CPU<small>Best of 5. Same 3 objects for both of you.</small></span><span class="ico">⚔️</span>', function () { startMatch(); });
    var endless = btn("btn", '<span>Endless Streak<small>Best streak: ' + state.best + '</small></span><span class="ico">🔥</span>', function () { startStreak(); });
    var settle = btn("btn", '<span>Settle It<small>Pick any two. Who would win?</small></span><span class="ico">🤔</span>', function () { showSettle(); });
    app.appendChild(play);
    app.appendChild(endless);
    app.appendChild(settle);

    app.appendChild(el("div", "label", "CPU difficulty"));
    var seg = el("div", "seg");
    [["easy", "Easy"], ["tricky", "Tricky"]].forEach(function (d) {
      var b = btn(state.difficulty === d[0] ? "on" : "", d[1], function () {
        state.difficulty = d[0];
        store.set("rpsu.difficulty", d[0]);
        showHome();
      });
      seg.appendChild(b);
    });
    app.appendChild(seg);
    app.appendChild(el("p", "sub", world.objects.length + " objects in the universe and counting."));
  }

  /* ---------- Rounds (vs CPU and Endless) ---------- */
  var game = null; // { mode, you, cpu, streak, hand, picked }

  function startMatch() { game = { mode: "match", you: 0, cpu: 0 }; state.lastPick = null; nextRound(); }
  function startStreak() { game = { mode: "streak", streak: 0 }; state.lastPick = null; nextRound(); }

  function nextRound() {
    var d = RPSU.deal(tris, state.prevKey, Math.random);
    state.prevKey = d.key;
    game.hand = d.ids;
    game.picked = null;
    showPick();
  }

  function topbar() {
    var bar = el("div", "topbar");
    bar.appendChild(btn("back", "← Home", showHome));
    if (game.mode === "match") bar.appendChild(el("div", "score", "You " + game.you + " – " + game.cpu + " CPU"));
    else bar.appendChild(el("div", "pill", "🔥 Streak " + game.streak));
    return bar;
  }

  function showPick() {
    clear();
    app.appendChild(topbar());
    app.appendChild(el("p", "prompt", "Same 3 objects for both of you. Pick the one you think <b>beats what the CPU will pick</b>."));
    var hand = el("div", "hand");
    var lock = btn("btn primary", "Lock it in", function () { reveal(); });
    lock.disabled = true;
    game.hand.forEach(function (id) {
      var o = obj(id);
      var b = btn("obj", '<span class="e">' + o.emoji + "</span><span>" + o.name + "</span>", function () {
        game.picked = id;
        Array.prototype.forEach.call(hand.children, function (c) { c.classList.remove("sel"); });
        b.classList.add("sel");
        lock.disabled = false;
      });
      hand.appendChild(b);
    });
    app.appendChild(hand);
    app.appendChild(el("div", "spacer"));
    app.appendChild(lock);
  }

  function fighter(label, id, cls) {
    var o = obj(id);
    return el("div", "fighter " + cls, '<div class="who">' + label + '</div><div class="e">' + o.emoji + '</div><div class="n">' + o.name + "</div>");
  }

  function reveal() {
    var mine = game.picked;
    var theirs = RPSU.cpuPick(world, game.hand, state.difficulty, state.lastPick, Math.random);
    state.lastPick = mine;
    var r = RPSU.resolve(world, mine, theirs);

    var youCls = "", cpuCls = "";
    var big, vcls = "", note = "", why = "";
    if (r.result === "a") { youCls = "win"; cpuCls = "lose"; vcls = "win"; big = "You win this round! 🎉"; why = r.why; buzz(60); }
    else if (r.result === "b") { youCls = "lose"; cpuCls = "win"; vcls = "lose"; big = "CPU wins this round"; why = r.why; }
    else { big = "Same pick! 🤝"; note = "Great minds think alike. New objects coming up."; }

    var youWin = r.result === "a", cpuWin = r.result === "b";
    var over = false, streakEnded = false;
    if (game.mode === "match") {
      if (youWin) game.you++;
      if (cpuWin) game.cpu++;
      over = game.you >= WINS_NEEDED || game.cpu >= WINS_NEEDED;
    } else {
      if (youWin) {
        game.streak++;
        if (game.streak > state.best) { state.best = game.streak; store.set("rpsu.best", state.best); }
      }
      if (cpuWin) streakEnded = true;
    }

    clear();
    app.appendChild(topbar());
    var rev = el("div", "reveal");
    rev.appendChild(fighter("You", mine, youCls));
    rev.appendChild(el("div", "vs", "VS"));
    rev.appendChild(fighter("CPU", theirs, cpuCls));
    app.appendChild(rev);

    var v = el("div", "verdict " + vcls);
    v.appendChild(el("div", "big", big));
    if (why) v.appendChild(el("div", "why", why));
    if (note) v.appendChild(el("div", "note", note));
    app.appendChild(v);

    app.appendChild(el("div", "spacer"));

    if (game.mode === "match" && over) {
      var won = game.you > game.cpu;
      app.appendChild(el("div", "verdict " + (won ? "win" : "lose"), '<div class="big">' + (won ? "🏆 You won the match!" : "CPU won the match") + '</div><div class="note">Final score: ' + game.you + " – " + game.cpu + "</div>"));
      app.appendChild(btn("btn primary", "<span>Rematch</span><span class=\"ico\">🔁</span>", startMatch));
      app.appendChild(btn("btn", "<span>Home</span><span class=\"ico\">🏠</span>", showHome));
    } else if (game.mode === "streak" && streakEnded) {
      app.appendChild(el("div", "big-streak", String(game.streak)));
      app.appendChild(el("p", "center", game.streak === 1 ? "win in a row" : "wins in a row"));
      app.appendChild(el("p", "center pill", "Best streak: " + state.best));
      app.appendChild(btn("btn primary", "<span>Try again</span><span class=\"ico\">🔁</span>", startStreak));
      app.appendChild(btn("btn", "<span>Home</span><span class=\"ico\">🏠</span>", showHome));
    } else {
      app.appendChild(btn("btn primary", "<span>Next round</span><span class=\"ico\">➡️</span>", nextRound));
    }
  }

  /* ---------- Settle It ---------- */
  function showSettle() {
    var a = null, b = null;
    function render() {
      clear();
      var bar = el("div", "topbar");
      bar.appendChild(btn("back", "← Home", showHome));
      bar.appendChild(el("div", "pill", "Settle It"));
      app.appendChild(bar);

      var r = a && b ? RPSU.resolve(world, a, b) : null;
      var slots = el("div", "slots");
      slots.appendChild(slot(a, "First", r && r.winner === a));
      slots.appendChild(el("div", "vs", "VS"));
      slots.appendChild(slot(b, "Second", r && r.winner === b));
      app.appendChild(slots);

      var v = el("div", "verdict instant");
      if (!r) {
        v.innerHTML = '<div class="note">' + (a ? "Now tap the object it fights." : "Tap two objects to see who wins.") + "</div>";
      } else if (r.result === "tie") {
        v.innerHTML = '<div class="big">Same object! 🤝</div><div class="note">It\'s a draw. Pick a different one.</div>';
      } else if (r.result === "none") {
        v.innerHTML = '<div class="big">No clear winner 🤷</div><div class="note">These two would just ignore each other.</div>';
      } else {
        v.className = "verdict instant win";
        v.innerHTML = '<div class="big">' + obj(r.winner).name + " wins!</div><div class=\"why\">" + r.why + "</div>";
      }
      app.appendChild(v);

      var grid = el("div", "grid");
      world.objects.slice().sort(function (x, y) { return x.name.localeCompare(y.name); }).forEach(function (o) {
        var cls = "gitem" + (o.id === a ? " a" : "") + (o.id === b ? " b" : "");
        grid.appendChild(btn(cls, '<span class="e">' + o.emoji + "</span><span>" + o.name + "</span>", function () {
          if (a && b) { a = o.id; b = null; }
          else if (!a) { a = o.id; }
          else { b = o.id; }
          buzz(10);
          render();
        }));
      });
      app.appendChild(grid);
    }
    function slot(id, label, win) {
      if (!id) return el("div", "slot empty", label);
      var o = obj(id);
      return el("div", "slot" + (win ? " win" : ""), '<div class="e">' + o.emoji + '</div><div class="n">' + o.name + "</div>");
    }
    render();
  }

  /* ---------- Boot ---------- */
  fetch("data/objects.json")
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      world = RPSU.build(data);
      tris = RPSU.triangles(world);
      showHome();
    })
    .catch(function (err) {
      app.innerHTML = '<p class="loading">Could not load the game data.<br>' + String(err) + "</p>";
    });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline mode is optional */ });
    });
  }
})();
