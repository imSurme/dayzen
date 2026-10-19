# Dayzen

A day-planning game that runs in the browser. Pick a character, plan their week by placing cards on the hours between 08:00 and 24:00, and try to finish the week's main mission before you run out of hearts.

No install or build step: plain HTML, CSS and JavaScript. Playable in **English** and **Turkish**.

## How to run

The easiest way is to open `index.html` in your browser.

You can also serve it locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Progress (stars, unlocked characters, badges, an unfinished week) is kept in the browser's `localStorage`. In another browser or a private window the game starts fresh.

## Language

Switch between **English** and **Türkçe** in two places:

- the **Türkçe | English** toggle in the top-right corner of the title screen
- **⚙️ Settings → Dil / Language**

The game opens in English the first time. Your choice is saved in the browser, the page reloads in that language, and later visits open in the language you picked. Your current week and progress are kept.

## How to play

1. **Pick a character and difficulty.** Each character has a trait, special cards, a fixed schedule and a weekly main mission.
2. **Plan the day.** Drag cards from your hand onto the schedule. They won't all fit, so you choose what to do and what to skip. While you plan, the forecast strip shows the day's estimated score, energy and stress.
3. **Start the day.** Surprise events pop up as the day runs, and you decide how to react.
4. **Check the night report.** Life balance, mission progress and hearts are updated here.
5. **Save the week.** Finish the main mission in time and reach Sunday with hearts left, and the week is saved.

### Core rules

- **⚡ Energy and 😰 stress** affect every task's points: low energy or high stress means fewer points. However you end the day, you start the next morning close to it.
- **⚖️ Life balance:** Work, Health, Social and Home drop every night. If one hits zero you have a crisis and lose a heart.
- **📌 To-dos:** Each day brings 1–2 to-dos that must be done before their deadline. The first miss in a week is a warning; later misses cost hearts.
- **🔒 Requirements:** Some cards need enough energy or low enough stress; otherwise the task fails.
- **🛏️ Bedtime:** Going to bed early leaves less time today but you start tomorrow fresher.
- **⏪ Rewind:** Replaying a day uses one of your limited weekly rewinds.
- **🎯 Daily goals:** Each day has 3 goals; every goal you hit earns a 🌟 star.

### Controls

| | Desktop | Phone |
|---|---|---|
| Place a card | Drag the card onto the schedule | Press and hold the card; the tray slides away, then drag it onto the schedule |
| Move a block | Drag the block | Press and hold the block, then drag |
| Remove from plan | ✕ on the block | Drop the block back on the tray, or ✕ |
| Card details | Click the card | Tap the card |
| Card tray | — | Swipe down to close, swipe up to open |

## Content

- **10 characters**, each with their own weekly main mission:

  | Character | Trait | Main mission | Unlock |
  |---|---|---|---|
  | 🎓 Student | Quick Recovery | Exam Week | Free |
  | 💻 Developer | Flow State | Project Delivery | Free |
  | 👪 Parent | Family Warmth | Happy Family | Free |
  | 🍎 Teacher | Patient | Report Card Week | Free |
  | 🩺 Doctor | Resilient | Heavy Shift | 6 🌟 |
  | 🎨 Artist | Inspiration | Gallery Opening | 6 🌟 |
  | 🏋️ Athlete | Athletic | Tournament Prep | 8 🌟 |
  | 🍳 Chef | Gourmet | Gourmet Inspection | 8 🌟 |
  | 🎙️ Streamer | Night Owl | 10K Followers | 10 🌟 |
  | 🚀 Founder | Ambitious | Funding Round | 12 🌟 |

- **7 daily scenarios:** First Day of the Week, Busy Tuesday, Deadline Day, Party Night, Friday Fatigue, Weekend, Lazy Sunday.
- **Cards:** 23 common, 22 character-specific and 6 star-unlocked cards, plus 7 to-dos and 16 fixed-schedule tasks.
- **78 surprise events:** general, character-specific, day-specific and rare.
- **15 daily goals, 7 perks, 18 badges.**
- **3 difficulty levels:**

  | Difficulty | Hearts | Rewinds | Nightly decay |
  |---|---|---|---|
  | 🌱 Easy | 4 | 3 | 18 |
  | ⚖️ Normal | 3 | 2 | 24 |
  | 🔥 Hard | 2 | 1 | 28 |

## Project structure

```
index.html          Page skeleton
css/
  style.css         Base look (panels, cards, schedule, buttons)
  campaign.css      Campaign screens (menu, character select, collection)
  polish.css        Forecast, settings and tutorial
  refine.css        Layout and readability fixes
  challenge.css     Main mission, life balance, hearts, result themes
  cardzoom.css      Large card (details) view
  mobile.css        Phone layout and touch drag
  title.css         Title screen
  theme.css         Color and type system (loaded last)
js/
  i18n.js           Language choice and page translator (loaded first)
  data.js           Tasks, characters, perks, scenarios, goals, badges
  logo.js           Logo (SVG)
  events.js         Surprise events
  challenge.js      Main missions, life balance, difficulty, to-dos, requirements
  lang-en.js        English content: card, character and event names, UI dictionary, rules
  simulation.js     Day simulation (pure function)
  state.js          Schedule state and placement rules
  campaign.js       Weekly flow, night report, hearts, saving
  sound.js          Sound effects and music (Web Audio, no audio files)
  ui.js             Game board, drag and drop, simulation animation
  results.js        End-of-day screen
  screens.js        Title screen, character select, collection, events, week report
  tutorial.js       First-day tutorial
  main.js           Startup
```

### How translation works

The game code produces Turkish text. When English is selected, `lang-en.js` replaces the names and descriptions in the game data with their English versions, and `i18n.js` translates every piece of text written to the page from a dictionary (placeholder patterns such as `"{n} puan": "{n} points"` are supported). Longer text with markup is written in both languages in the code with `OG.t(tr, en)`. When you add new text, add its English version to the dictionary in `lang-en.js`; `OG.i18nMissing()` in the browser console lists any text that couldn't be translated.

Fonts (Fredoka and Nunito) load from Google Fonts; without a connection the game falls back to system fonts.
