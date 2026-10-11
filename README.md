# Rock Paper Scissors Universe

Rock-paper-scissors with every object in the universe. Both players see the same 3 objects, secretly pick the one they think beats the other's pick, and the game tells you which object really wins and why.

**Play:** https://supertrucker-ai.github.io/rock-paper-scissors-universe/
On a phone, open the link, tap Share, then **Add to Home Screen** for a full-screen offline app.

## Modes
- **Play vs CPU:** best of 5, same 3 objects for both sides.
- **Endless Streak:** keep winning until you lose.
- **Settle It:** pick any two objects and see who wins (and why).

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000 (the page loads its data with `fetch`, so it needs a server, not a double-click).

## Add objects
Edit `data/objects.json`: add the object, then add matchups as `[winner, loser, "reason"]`. Then check your work:
```
node tools/validate.js   # contradictions, unknown ids, win cap, how many hands the dealer can use
node tools/test.js       # game logic tests
```
Each object needs at least 2 wins and 1 loss, and should sit in at least one cycle (A beats B, B beats C, C beats A) or it can never be dealt in a game.

See [GAME_DESIGN.md](GAME_DESIGN.md) for the full design.
