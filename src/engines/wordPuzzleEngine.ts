import type { GameConfig } from "@/data/games";
import { getWords, pickUniqueWord, getHistory, addHistory } from "./wordGuessEngine";
import { pickSeeded, shuffleSeeded, todayKey } from "./random";

export interface PuzzleChallenge {
  answer: string;
  display: string;
  hint: string;
  grid?: string[][];
}

const synonymPairs = [
  {
    "answer": "halcyon",
    "display": "Happy"
  },
  {
    "answer": "content",
    "display": "Happy"
  },
  {
    "answer": "bright",
    "display": "Happy"
  },
  {
    "answer": "wistful",
    "display": "Sad"
  },
  {
    "answer": "melancholy",
    "display": "Sad"
  },
  {
    "answer": "pensive",
    "display": "Sad"
  },
  {
    "answer": "profligate",
    "display": "Fast"
  },
  {
    "answer": "prompt",
    "display": "Fast"
  },
  {
    "answer": "libertine",
    "display": "Fast"
  },
  {
    "answer": "dull",
    "display": "Slow"
  },
  {
    "answer": "obtuse",
    "display": "Slow"
  },
  {
    "answer": "slack",
    "display": "Slow"
  },
  {
    "answer": "conspicuous",
    "display": "Big"
  },
  {
    "answer": "prodigious",
    "display": "Big"
  },
  {
    "answer": "intense",
    "display": "Big"
  },
  {
    "answer": "mean",
    "display": "Small"
  },
  {
    "answer": "diminutive",
    "display": "Small"
  },
  {
    "answer": "modest",
    "display": "Small"
  },
  {
    "answer": "robust",
    "display": "Rich"
  },
  {
    "answer": "ample",
    "display": "Rich"
  },
  {
    "answer": "lush",
    "display": "Rich"
  },
  {
    "answer": "mean",
    "display": "Poor"
  },
  {
    "answer": "hapless",
    "display": "Poor"
  },
  {
    "answer": "wretched",
    "display": "Poor"
  },
  {
    "answer": "torrid",
    "display": "Hot"
  },
  {
    "answer": "fervid",
    "display": "Hot"
  },
  {
    "answer": "fervent",
    "display": "Hot"
  },
  {
    "answer": "gelid",
    "display": "Cold"
  },
  {
    "answer": "bleak",
    "display": "Cold"
  },
  {
    "answer": "frigid",
    "display": "Cold"
  },
  {
    "answer": "wanton",
    "display": "Easy"
  },
  {
    "answer": "facile",
    "display": "Easy"
  },
  {
    "answer": "light",
    "display": "Easy"
  },
  {
    "answer": "arduous",
    "display": "Hard"
  },
  {
    "answer": "shrewd",
    "display": "Hard"
  },
  {
    "answer": "delicate",
    "display": "Hard"
  },
  {
    "answer": "frivolous",
    "display": "Light"
  },
  {
    "answer": "clear",
    "display": "Light"
  },
  {
    "answer": "bright",
    "display": "Light"
  },
  {
    "answer": "obscure",
    "display": "Dark"
  },
  {
    "answer": "sullen",
    "display": "Dark"
  },
  {
    "answer": "dour",
    "display": "Dark"
  },
  {
    "answer": "benevolent",
    "display": "Good"
  },
  {
    "answer": "keen",
    "display": "Good"
  },
  {
    "answer": "adept",
    "display": "Good"
  },
  {
    "answer": "intense",
    "display": "Bad"
  },
  {
    "answer": "atrocious",
    "display": "Bad"
  },
  {
    "answer": "deplorable",
    "display": "Bad"
  },
  {
    "answer": "radical",
    "display": "New"
  },
  {
    "answer": "novel",
    "display": "New"
  },
  {
    "answer": "hot",
    "display": "New"
  },
  {
    "answer": "cold",
    "display": "Old"
  },
  {
    "answer": "archaic",
    "display": "Old"
  },
  {
    "answer": "hoary",
    "display": "Old"
  },
  {
    "answer": "light",
    "display": "Clean"
  },
  {
    "answer": "adroit",
    "display": "Clean"
  },
  {
    "answer": "clear",
    "display": "Clean"
  },
  {
    "answer": "salacious",
    "display": "Dirty"
  },
  {
    "answer": "obscene",
    "display": "Dirty"
  },
  {
    "answer": "sordid",
    "display": "Dirty"
  },
  {
    "answer": "audacious",
    "display": "Brave"
  },
  {
    "answer": "intrepid",
    "display": "Brave"
  },
  {
    "answer": "spirited",
    "display": "Brave"
  },
  {
    "answer": "shrewd",
    "display": "Smart"
  },
  {
    "answer": "impudent",
    "display": "Smart"
  },
  {
    "answer": "sharp",
    "display": "Smart"
  },
  {
    "answer": "robust",
    "display": "Strong"
  },
  {
    "answer": "vehement",
    "display": "Strong"
  },
  {
    "answer": "substantial",
    "display": "Strong"
  },
  {
    "answer": "pallid",
    "display": "Weak"
  },
  {
    "answer": "light",
    "display": "Weak"
  },
  {
    "answer": "soft",
    "display": "Weak"
  },
  {
    "answer": "pulchritudinous",
    "display": "Beautiful"
  },
  {
    "answer": "exquisite",
    "display": "Beautiful"
  },
  {
    "answer": "comely",
    "display": "Beautiful"
  },
  {
    "answer": "baleful",
    "display": "Ugly"
  },
  {
    "answer": "atrocious",
    "display": "Ugly"
  },
  {
    "answer": "grotesque",
    "display": "Ugly"
  },
  {
    "answer": "garish",
    "display": "Loud"
  },
  {
    "answer": "tawdry",
    "display": "Loud"
  },
  {
    "answer": "brassy",
    "display": "Loud"
  },
  {
    "answer": "repose",
    "display": "Quiet"
  },
  {
    "answer": "subdued",
    "display": "Quiet"
  },
  {
    "answer": "tranquil",
    "display": "Quiet"
  },
  {
    "answer": "modest",
    "display": "Simple"
  },
  {
    "answer": "naive",
    "display": "Simple"
  },
  {
    "answer": "naif",
    "display": "Simple"
  },
  {
    "answer": "byzantine",
    "display": "Complex"
  },
  {
    "answer": "intricate",
    "display": "Complex"
  },
  {
    "answer": "convoluted",
    "display": "Complex"
  },
  {
    "answer": "crude",
    "display": "Early"
  },
  {
    "answer": "archaic",
    "display": "Early"
  },
  {
    "answer": "inchoate",
    "display": "Early"
  },
  {
    "answer": "deep",
    "display": "Late"
  },
  {
    "answer": "tardily",
    "display": "Late"
  },
  {
    "answer": "new",
    "display": "Late"
  },
  {
    "answer": "ample",
    "display": "Full"
  },
  {
    "answer": "good",
    "display": "Full"
  },
  {
    "answer": "sonorous",
    "display": "Full"
  },
  {
    "answer": "vacuous",
    "display": "Empty"
  },
  {
    "answer": "hollow",
    "display": "Empty"
  },
  {
    "answer": "void",
    "display": "Empty"
  },
  {
    "answer": "good",
    "display": "Safe"
  },
  {
    "answer": "innocuous",
    "display": "Safe"
  },
  {
    "answer": "secure",
    "display": "Safe"
  },
  {
    "answer": "insidious",
    "display": "Dangerous"
  },
  {
    "answer": "grievous",
    "display": "Dangerous"
  },
  {
    "answer": "critical",
    "display": "Dangerous"
  },
  {
    "answer": "crude",
    "display": "Rough"
  },
  {
    "answer": "boisterous",
    "display": "Rough"
  },
  {
    "answer": "abrasive",
    "display": "Rough"
  },
  {
    "answer": "sleek",
    "display": "Smooth"
  },
  {
    "answer": "suave",
    "display": "Smooth"
  },
  {
    "answer": "undulate",
    "display": "Smooth"
  },
  {
    "answer": "tender",
    "display": "Soft"
  },
  {
    "answer": "delicate",
    "display": "Soft"
  },
  {
    "answer": "mellow",
    "display": "Soft"
  },
  {
    "answer": "arduous",
    "display": "Hard"
  },
  {
    "answer": "shrewd",
    "display": "Hard"
  },
  {
    "answer": "delicate",
    "display": "Hard"
  },
  {
    "answer": "eminent",
    "display": "High"
  },
  {
    "answer": "mellow",
    "display": "High"
  },
  {
    "answer": "sharp",
    "display": "High"
  },
  {
    "answer": "dejected",
    "display": "Low"
  },
  {
    "answer": "modest",
    "display": "Low"
  },
  {
    "answer": "soft",
    "display": "Low"
  },
  {
    "answer": "good",
    "display": "Near"
  },
  {
    "answer": "close",
    "display": "Near"
  },
  {
    "answer": "warm",
    "display": "Near"
  },
  {
    "answer": "cold",
    "display": "Far"
  },
  {
    "answer": "right",
    "display": "Far"
  },
  {
    "answer": "distant",
    "display": "Far"
  },
  {
    "answer": "good",
    "display": "Right"
  },
  {
    "answer": "powerful",
    "display": "Right"
  },
  {
    "answer": "proper",
    "display": "Right"
  },
  {
    "answer": "base",
    "display": "Wrong"
  },
  {
    "answer": "erroneous",
    "display": "Wrong"
  },
  {
    "answer": "deplorable",
    "display": "Wrong"
  },
  {
    "answer": "veracious",
    "display": "True"
  },
  {
    "answer": "reliable",
    "display": "True"
  },
  {
    "answer": "harmonious",
    "display": "True"
  },
  {
    "answer": "hollow",
    "display": "False"
  },
  {
    "answer": "mendacious",
    "display": "False"
  },
  {
    "answer": "specious",
    "display": "False"
  },
  {
    "answer": "comprehensive",
    "display": "Wide"
  },
  {
    "answer": "ample",
    "display": "Wide"
  },
  {
    "answer": "heavy",
    "display": "Wide"
  },
  {
    "answer": "slender",
    "display": "Narrow"
  },
  {
    "answer": "dogmatic",
    "display": "Narrow"
  },
  {
    "answer": "petty",
    "display": "Narrow"
  }
];

export function createPuzzleChallenge(game: GameConfig, run = 0): PuzzleChallenge {
  const words = getWords(game.mode === "dailyWord" ? 5 : 6);
  const seed = game.daily ? `${game.slug}:${todayKey()}` : `${game.slug}:${run}:${Date.now()}`;
  const answer = pickUniqueWord(words, game, run);

  if (game.mode === "scramble" || game.mode === "unscramble") {
    return {
      answer,
      display: shuffleSeeded(answer.split(""), seed).join("").toUpperCase(),
      hint: "Unscramble the letters."
    };
  }

  if (game.mode === "missing-letters" || game.mode === "dailyWord") {
    const display = answer
      .split("")
      .map((letter, index) => (index % 2 === 0 ? "_" : letter.toUpperCase()))
      .join(" ");
    return { answer, display, hint: "Fill the missing letters to complete the word." };
  }

  if (game.mode === "word-search") {
    return {
      answer,
      display: answer.toUpperCase(),
      hint: "The target word is hidden left-to-right in the grid.",
      grid: makeWordSearch(answer, seed)
    };
  }

  if (game.mode === "synonym") {
    let pair = pickSeeded(synonymPairs, seed);
    const history = getHistory();
    const available = synonymPairs.filter(p => !history.includes(p.answer));
    if (available.length > 0) {
      pair = pickSeeded(available, seed);
    }
    addHistory(pair.answer);
    return { answer: pair.answer, display: pair.display, hint: "Enter a synonym." };
  }

  if (game.mode === "antonym") {
    let pair = pickSeeded(antonymPairs, seed);
    const history = getHistory();
    const available = antonymPairs.filter(p => !history.includes(p.answer));
    if (available.length > 0) {
      pair = pickSeeded(available, seed);
    }
    addHistory(pair.answer);
    return { answer: pair.answer, display: pair.display, hint: "Enter an antonym." };
  }

  return {
    answer,
    display: "_ ".repeat(answer.length).trim(),
    hint: "Guess letters or enter the full word."
  };
}

function makeWordSearch(answer: string, seed: string) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const shuffled = shuffleSeeded(letters.split(""), seed);
  const grid = Array.from({ length: 12 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => shuffled[(row * 12 + col) % shuffled.length])
  );
  const row = Math.min(5, answer.length);
  answer.toUpperCase().split("").forEach((letter, index) => {
    grid[row][index + 1] = letter;
  });
  return grid;
}
