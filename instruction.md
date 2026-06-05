You are a senior software architect, game developer, UI/UX designer, and Astro.js expert.

Your task is to build a production-ready web platform called **EveryWordGames** using **Astro.js**.

The goal is to become the ultimate destination for word games, guessing games, trivia games, and puzzle games. The website must be playable immediately after generation and should feel like a polished gaming platform rather than a collection of simple mini-projects.

## PRIMARY GOAL

Build a launch-ready MVP that contains approximately 25–30 playable game modes while keeping the codebase extremely modular, maintainable, and easy to expand.

The entire platform must be built around reusable engines instead of creating separate logic for every game.

---

# TECH STACK

* Astro.js
* TypeScript
* HTML
* CSS
* Vanilla JavaScript where possible
* Local Storage
* No unnecessary dependencies
* No backend required
* Fully static deployment compatible
* SEO friendly
* Fast loading
* Mobile first
* Responsive on all devices

---

# IMPORTANT DEVELOPMENT RULE

Before generating code:

Search for existing open-source implementations and algorithms for:

* Wordle
* Multi Wordle
* Hangman
* Word Search
* Word Scramble
* Country Guessing
* Flag Guessing
* Trivia Games
* Crossword Systems

Reuse architecture and proven logic where licenses permit.

DO NOT create everything from scratch if a proven implementation pattern already exists.

However:

* Do NOT clone branded websites.
* Do NOT copy copyrighted assets.
* Create an original implementation and design.

---

# WEBSITE NAME

EveryWordGames

Possible domain:

everywordgames.com

---

# DESIGN GOALS

The website should feel like a modern gaming platform.

Not a dashboard.
Not a document.
Not a tutorial.

Users should instantly feel like they arrived at a gaming website.

Visual inspiration:

* Steam
* Epic Games Store
* Modern indie game portals
* NYT Games (cleanliness only)
* Wordly-inspired discoverability

---

# COLOR PALETTE

Background:
#0F172A

Card:
#1E293B

Primary:
#3B82F6

Secondary:
#8B5CF6

Accent:
#F59E0B

Success:
#10B981

Text:
#F8FAFC

Muted:
#94A3B8

---

# UI REQUIREMENTS

Homepage must include:

1. Hero Section
2. Featured Games
3. Daily Challenges
4. Trending Games
5. Recently Played
6. Categories
7. Player Statistics
8. Achievement Preview
9. Footer

Game cards should include:

* Icon
* Name
* Description
* Difficulty
* Play button

Hover effects:

* Glow
* Scale
* Smooth transitions

Animations:

* Lightweight
* Professional
* Not excessive

---

# SITE STRUCTURE

/

Homepage

/wordle

Classic Wordle Games

/multi-wordle

Multi-board games

/guess

Guessing games

/word-games

Puzzle games

/daily

Daily challenges

/stats

Player statistics

/achievements

Achievement system

---

# CORE ARCHITECTURE

Build FOUR reusable engines.

---

# ENGINE 1

WORDLE ENGINE

One engine powers:

* 2 Letter Wordle
* 3 Letter Wordle
* 4 Letter Wordle
* 5 Letter Wordle
* 6 Letter Wordle
* 7 Letter Wordle
* 8 Letter Wordle
* 9 Letter Wordle
* 10 Letter Wordle
* Daily Wordle
* Endless Wordle
* Survival Wordle
* Hardcore Wordle

Configuration should determine:

* Word length
* Number of attempts
* Rules
* Daily mode
* Endless mode

No duplicated code.

---

# ENGINE 2

MULTI WORDLE ENGINE

One engine powers:

* Double Wordle
* Triple Wordle
* Quad Wordle
* Hex Wordle
* Octo Wordle
* Sedecordle

Configuration controls:

* Board count
* Attempts
* Layout

No duplicated logic.

---

# ENGINE 3

GUESSING ENGINE

One reusable guessing system.

Supports:

* Images
* Text clues
* Progressive hints
* Scoring
* Difficulty levels

Used by:

## Geography

* Guess Country
* Guess Flag
* Guess Capital

## Entertainment

* Guess Movie
* Guess TV Show
* Guess Anime

## Brands

* Guess Logo
* Guess Brand
* Guess Company

Configuration determines category.

---

# ENGINE 4

WORD PUZZLE ENGINE

Used for:

* Hangman
* Word Scramble
* Unscramble
* Word Search
* Missing Letters
* Synonym Challenge
* Antonym Challenge

Single engine architecture.

---

# DAY ONE PLAYABLE GAMES

Wordle Family

* 2 Letter Wordle
* 3 Letter Wordle
* 4 Letter Wordle
* 5 Letter Wordle
* 6 Letter Wordle
* 7 Letter Wordle
* 8 Letter Wordle
* 9 Letter Wordle
* 10 Letter Wordle
* Daily Wordle
* Endless Wordle
* Survival Wordle
* Hardcore Wordle

Multi Wordle

* Double Wordle
* Triple Wordle
* Quad Wordle
* Hex Wordle
* Octo Wordle
* Sedecordle

Geography

* Guess Country
* Guess Flag
* Guess Capital

Entertainment

* Guess Movie
* Guess TV Show
* Guess Anime

Word Games

* Hangman
* Word Scramble
* Unscramble
* Word Search
* Missing Letters

Daily Challenges

* Daily Word
* Daily Country
* Daily Flag
* Daily Movie

---

# FUTURE PLACEHOLDER GAMES

Generate placeholder routes and cards for:

* Crossword
* Mini Crossword
* Spelling Bee
* Word Chain
* Rhyme Challenge
* Guess Song
* Guess Actor
* Guess Footballer
* Guess Cricketer
* Guess Stadium
* Guess Historical Figure
* Guess Scientist
* Guess Invention
* Guess Celebrity

These should appear on the site but can be marked "Coming Soon."

---

# PLAYER SYSTEM

Local storage only.

Track:

* Total games played
* Wins
* Losses
* Win rate
* Current streak
* Longest streak
* Fastest solve
* Average solve
* Favorite game

---

# ACHIEVEMENT SYSTEM

Create reusable achievement architecture.

Examples:

* First Win
* 10 Wins
* 50 Wins
* 100 Wins
* 7 Day Streak
* 30 Day Streak
* Word Master
* Geography Expert
* Movie Buff

Store locally.

---

# DAILY CHALLENGE SYSTEM

Generate deterministic daily challenges.

Same challenge for all users.

Use date-based seed generation.

Supports:

* Daily Word
* Daily Flag
* Daily Country
* Daily Movie

---

# DATASETS

Provide sample datasets included in project.

Word Lists:

* 2–10 letter words

Countries:

* At least 100

Flags:

* At least 100

Movies:

* At least 200

TV Shows:

* At least 100

Anime:

* At least 100

Brands:

* At least 100

Use JSON datasets.

---

# SEO

Generate:

* Sitemap
* Robots.txt
* Metadata
* Open Graph tags
* Twitter cards

Every game page should have unique metadata.

---

# PERFORMANCE

Target:

* Lighthouse 90+
* Mobile optimized
* Lazy loading
* Route-based loading
* Minimal bundle size

---

# CODE QUALITY

Requirements:

* Clean folder structure
* TypeScript types
* Reusable components
* Reusable layouts
* Reusable game engines
* Proper comments
* Scalable architecture

---

# OUTPUT REQUIREMENTS

Generate:

1. Complete Astro.js project structure
2. All pages
3. Reusable engines
4. Components
5. Layouts
6. Data files
7. Styling system
8. Routing
9. Local storage systems
10. Achievement system
11. Statistics system
12. Daily challenge system

The final result should look like a polished commercial gaming website and allow users to immediately play approximately 25–30 game modes on launch day while being architected to easily scale to 100+ games in the future.
