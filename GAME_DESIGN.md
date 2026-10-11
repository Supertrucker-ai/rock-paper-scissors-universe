# Rock Paper Scissors Universe: Design Document

**Status:** Draft v0.1 | **Platform:** Mobile web (installable PWA) | **Hosting:** GitHub Pages (static, no server)

## 1. Pitch

Rock-paper-scissors, but with every object imaginable, built to settle the classic kid argument: "Which one would win?" Each round, **both players see the same 3 random objects**. Each secretly picks the one they think will beat whatever the *other* player is about to pick, then both reveal at once. Whichever object would *objectively* win takes the round, and the game tells you **why** in one funny line ("Water rusts Iron").

The fun is the mind game: you're not just picking your favorite object, you're predicting your opponent and countering them.

## 2. Design Goals

1. **Lightweight:** one small static site, no backend, no accounts, no ads, works offline.
2. **Instantly readable:** emoji objects, big tap targets, one-handed play.
3. **Fair and explainable:** every win has a reason a kid can understand.
4. **Kid-safe:** curated object list only, no user-generated content, no network calls.
5. **Easy to grow:** adding objects means editing one JSON file.

## 3. Core Loop

1. **One shared hand of 3 objects** is dealt and shown to both players (no duplicates).
2. Each player secretly locks in one object, trying to beat what they expect the other to choose.
3. Simultaneous reveal with a short animation.
4. The result screen shows the winner and the reason line.
5. First to 3 round wins takes the match (best of 5).

**Same pick = Tie:** if both players choose the same object, the round is a tie and is replayed with a fresh hand. ("Great minds think alike!")

**Standoff:** if the two different picks have no defined winner, the round is replayed too. The dealer is built to avoid this (see section 5), so it should never happen in normal play.

## 4. Win Logic: Curated Matchup Web

Decision: **hand-curated matchups**, resolved with a simple lookup. No AI at runtime.

- Each object lists the objects it beats, each with a short reason.
- Resolution: if A lists B, A wins; if B lists A, B wins; otherwise Standoff.
- **Validator rule:** no two objects may beat each other (no contradictions).
- **Coverage target:** each object beats about 8-12 others and loses to about 8-12 others, which gives roughly 85%+ of random pairs a decisive result, so Standoffs stay rare.
- **No god objects:** nothing may beat more than ~15% of the roster. Objects like "Black Hole" or "Nuke" are either excluded or given clear weaknesses.
- **Objectivity rule of thumb:** a win must be true in the physical or common-sense world (Fire burns Paper, Scissors cut Paper, Magnet picks up Paperclip). Avoid pop-culture or opinion-based wins.

### Data format (`data/objects.json`)

```json
{
  "id": "water",
  "name": "Water",
  "emoji": "💧",
  "category": "nature",
  "beats": [
    { "id": "fire", "why": "Water puts out Fire" },
    { "id": "iron", "why": "Water rusts Iron" }
  ]
}
```

### Starter sample (illustrative)

| Object | Beats (why) |
|---|---|
| 🪨 Rock | ✂️ Scissors (dulls them), 🥚 Egg (smashes it) |
| 📄 Paper | 🪨 Rock (wraps it), 💧 Water (soaks it up) |
| ✂️ Scissors | 📄 Paper (cuts it), 🌿 Plant (snips it) |
| 🔥 Fire | 📄 Paper (burns it), 🌿 Plant (burns it) |
| 💧 Water | 🔥 Fire (puts it out), 🪨 Rock (wears it down over time) |
| 🧲 Magnet | 📎 Paperclip (pulls it), ✂️ Scissors (sticks to them) |

## 5. Object Roster

- **v1 target:** ~150 objects. **Stretch:** 250.
- Categories (used for variety when dealing): nature, tools, food, animals, household, tech, toys, weather.
- **Dealing rule (important, because the hand is shared):** the dealer only draws "triangle" hands, where the 3 objects form a true cycle (A beats B, B beats C, C beats A), like rock-paper-scissors itself. This guarantees there is no obviously best pick, so the mind game works. A transitive hand (A beats B and C) would make everyone pick A, which is boring.
- The validator pre-computes every valid triangle from the matchup data and stores the list. The dealer picks a random triangle, so no runtime searching is needed.
- **Roster implication:** the matchup web must contain plenty of cycles, since the dealer needs them. The validator reports triangle count and flags objects that appear in none.
- Variety: avoid dealing the same triangle twice in a row, and prefer triangles with 3 different categories.
- **Inclusion rules:** appropriate for all ages, recognizable as a single emoji, and has at least 6 wins and 6 losses defined.

## 6. Game Modes (v1)

| Mode | Description | Priority |
|---|---|---|
| **vs. CPU** | Best of 5 against a bot, shared 3-object hand | Must have |
| **Settle It** | Pick any two objects and get the verdict plus the reason | Must have |
| **Endless Streak** | Keep winning rounds; a loss ends the run. Tracks best streak | Must have |
| **Pass-and-play 2P** | Two people share one phone, with a "pass the phone" screen between picks | Should have |
| **Collection book** | Objects unlock as you see/win with them; shows a % complete | Nice to have |

**CPU behavior:** picks one of the 3 shared objects at random (easy). A "smart" setting learns from the player's recent picks, for example countering the object they chose last round. The CPU never reads the player's current pick.

**Settle It mode (new):** a quick sandbox for the core use case. Pick any two objects from the roster (search or browse) and the game gives the verdict and the reason line, or "Standoff" if the matchup isn't defined. No scoring. This is the "argue with your friend" button.

## 7. UX and Screens

1. **Home:** title, big Play button, mode picker, best streak.
2. **Pick screen:** the shared 3 object cards (emoji + name), tap to select, confirm button. In pass-and-play, picks are hidden behind a "pass the phone" screen. (Or both players tap their own side of the screen on a tablet or large phone, with a lock-in indicator.)
3. **Reveal:** cards flip, with a tiny screen shake on a win.
4. **Result:** winner, reason line, "Next round" button.
5. **Match end:** score, rematch, home.
6. **Collection:** grid of discovered objects (if built).

**Mobile requirements:** portrait-first, minimum 48px tap targets, no scrolling during play, haptic buzz on win where supported, a mute toggle, and no text input anywhere.

## 8. Technical Approach

- **Stack:** plain HTML, CSS, and vanilla JS (no framework, no build step).
- **Files:** `index.html`, `style.css`, `game.js`, `data/objects.json`, `manifest.json`, `sw.js` (service worker for offline), `tools/validate.js`.
- **PWA:** installable via "Add to Home Screen" on iOS and Android, so it behaves like an app with its own icon.
- **Storage:** `localStorage` for best streak and collection progress (wrapped in try/catch).
- **Size budget:** under 1 MB total.
- **Validator script:** checks for contradictions, unknown IDs, coverage percentage, and objects over the win cap.

## 9. Delivery: GitHub

- Repo hosts the source and design doc.
- **GitHub Pages** serves the game at a public URL, which can be texted to the phone. Open it, tap Share, then "Add to Home Screen."
- Note: Pages sites are public by default. The game contains nothing personal.

## 10. Roadmap

| Milestone | Scope |
|---|---|
| **M0** | Design doc (this) |
| **M1** | Playable vs. CPU, ~40 objects, core loop, result reasons |
| **M2** | Roster to ~150 and validator tool, Endless Streak, PWA/offline |
| **M3** | Pass-and-play, sound/haptics polish, collection book |
| **M4** | Stretch roster, difficulty setting, achievements |

## 11. Risks and Open Questions

- **Authoring cost** of matchups grows with the roster, so generate in batches and validate each time.
- **Disputed matchups:** kids will argue ("a rock *can't* beat an egg!"). Keep reason lines and consider a report-a-matchup link to the repo issues.
- **Standoff frequency:** if coverage is too low, rounds feel flat. The validator reports it.
- **Triangle supply:** the dealer needs enough cycles in the data. If the roster has too few, rounds repeat too often. The validator reports it.
- **Open:** game name styling and logo, CPU difficulty default, whether pass-and-play should use a split-screen lock-in instead of passing the phone.
