import type { GameConfig } from "./games";

export interface GameDetails {
  howToPlay: string[];
  faqs: { q: string; a: string }[];
}

export function getGameDetails(game: GameConfig): GameDetails {
  const howToPlay: string[] = [];
  const faqs: { q: string; a: string }[] = [];

  // Generate How To Play based on engine/category
  if (game.engine === "word-guess") {
    howToPlay.push(
      `Type any valid ${game.wordLength}-letter word and press Enter to submit your guess.`,
      `After each guess, the color of the tiles will change to show how close your guess was to the word.`,
      `Green tiles mean the letter is in the word and in the correct spot.`,
      `Yellow tiles mean the letter is in the word but in the wrong spot.`,
      `Gray tiles mean the letter is not in the word in any spot.`,
      `You have ${game.attempts} attempts to guess the hidden word correctly.`
    );
  } else if (game.engine === "multi-word-guess") {
    howToPlay.push(
      `You are solving ${game.boardCount} different words at the same time.`,
      `Every time you submit a guess, that single guess applies to all ${game.boardCount} boards simultaneously.`,
      `Use the color hints (Green, Yellow, Gray) on each board to narrow down the hidden words.`,
      `You have ${game.attempts} total attempts to solve all the boards.`
    );
  } else if (game.engine === "guessing") {
    howToPlay.push(
      `Look closely at the clues provided on the screen.`,
      `Type your guess based on the category.`,
      `If your guess is incorrect, you may receive additional clues or feedback to help you narrow it down.`,
      `Keep guessing until you find the correct answer or run out of attempts.`
    );
  } else if (game.engine === "entity-guessing") {
    howToPlay.push(
      `Look at the silhouette of the mystery character displayed on the screen.`,
      `Type your guess into the input box; autocomplete suggestions will appear as you type.`,
      `If your guess is incorrect, a new progressive hint (such as publisher, team affiliations, powers, or debut year) will unlock to help you.`,
      `You have ${game.attempts || 6} attempts to identify the character before the full artwork is revealed!`
    );
  } else if (game.engine === "language-guessing") {
    howToPlay.push(
      `Select your game mode (Classic, Daily Challenge, Endless, or Speed Mode) and difficulty level.`,
      `Click the Play button to listen to a short spoken audio clip of someone speaking in a mystery language.`,
      `Use the dynamic waveform visualizer and listen carefully to phonetic sounds, intonation, and rhythm.`,
      `Depending on your difficulty setting, choose from multiple choice options or type the language name with autocomplete.`,
      `You can replay the audio clip at any time for a -10 point penalty, or skip to the next language for 0 points.`
    );
  } else if (game.engine === "word-puzzle") {
    if (game.slug === "hangman") {
      howToPlay.push(
        `Guess the hidden word one letter at a time.`,
        `If you guess a correct letter, it will be revealed in its proper place(s).`,
        `If you guess an incorrect letter, a part of the hangman will be drawn.`,
        `Solve the word before the hangman is fully drawn to win.`
      );
    } else if (game.slug === "word-scramble") {
      howToPlay.push(
        `Look at the scrambled letters provided.`,
        `Rearrange the letters to form a valid word.`,
        `Type or select the letters in the correct order to submit your answer.`
      );
    } else {
      howToPlay.push(
        `Read the provided clue carefully.`,
        `Think of a word that matches the challenge requirement (like finding a synonym, antonym, or filling in the blanks).`,
        `Submit your answer to see if you are correct.`
      );
    }
  } else if (game.engine === "grid-puzzle") {
    howToPlay.push(
      `Use your arrow keys or swipe on the screen to move the tiles.`,
      `When two tiles with the same letter touch, they merge into the next letter in the alphabet!`,
      `For example, merging two 'A' tiles creates a 'B' tile.`,
      `Keep merging letters to see how far down the alphabet you can go before the board fills up.`
    );
  } else if (game.engine === "word-search") {
    howToPlay.push(
      `Scan the grid of letters to find the hidden words listed on the right.`,
      `Click and drag (or tap and swipe on mobile) across the letters to select a word.`,
      `Words can be hidden horizontally, vertically, or diagonally, in any direction.`,
      `When you find a word, it will be highlighted with a colorful line and crossed off the list.`,
      `Find all the hidden words to complete the puzzle!`
    );
  } else if (game.engine === "falling-words") {
    return {
      howToPlay: [
        "Words will fall from the top of the screen towards the bottom.",
        "Type the first letter of any falling word to lock onto it.",
        "Finish typing the word to destroy it and gain points.",
        "Survive the waves and defeat massive boss words.",
        "Don't let words hit the bottom, or you lose a life. You have 3 lives!",
      ],
      faqs: [
        { q: "How many lives do I have?", a: "You start with 3 lives." },
        { q: "What happens during a boss wave?", a: "A massive word drops very slowly. You must destroy it to proceed to the next wave." },
      ],
    };
  } else {
    // Default fallback
    howToPlay.push(
      `Follow the on-screen prompts to interact with the game.`,
      `Use your keyboard or touch screen to enter your answers.`,
      `Complete the objective before running out of attempts.`
    );
  }

  // Generate FAQs based on game type
  faqs.push({
    q: `What is ${game.name}?`,
    a: `${game.name} is a ${game.difficulty.toLowerCase()} difficulty game where you ${game.description.toLowerCase()}`
  });

  if (game.daily) {
    faqs.push({
      q: `When does the daily puzzle reset?`,
      a: `The daily puzzle resets every night at midnight local time. Be sure to check back every day for a new challenge!`
    });
  }

  if (game.engine === "word-guess" || game.engine === "multi-word-guess") {
    faqs.push({
      q: `Is there a limit to how many times I can play?`,
      a: game.mode === "endless" ? `No! You can play ${game.name} as many times as you want. There is no daily limit.` : `Depending on the game mode, you may have unlimited practice rounds or a single daily challenge.`
    });
    faqs.push({
      q: `Can I play on my phone?`,
      a: `Yes, ${game.name} is fully optimized for mobile devices, tablets, and desktop computers.`
    });
  } else {
    faqs.push({
      q: `Can I play ${game.name} for free?`,
      a: `Yes, all games on EveryWordGames are 100% free to play with no downloads required.`
    });
  }

  if (game.engine === "entity-guessing") {
    faqs.push({
      q: `What happens when I run out of attempts?`,
      a: `If you don't guess the character within ${game.attempts || 6} attempts, the full artwork and details will be revealed so you can learn more about them.`
    });
    faqs.push({
      q: `Can I share my results without spoiling the character?`,
      a: `Yes! When the game ends, click the 'Share Result' button to copy a spoiler-free emoji grid (like 🟩🟩🟩🟩) that shows how many attempts you took.`
    });
  }

  if (game.engine === "language-guessing") {
    faqs.push({
      q: `Where does the audio come from?`,
      a: `Audio samples are sourced from high-quality public domain and open-source datasets (such as Wikimedia Commons and Common Voice), supplemented by intelligent speech synthesis.`
    });
    faqs.push({
      q: `What is the difference between the game modes?`,
      a: `Classic lets you play at your own pace; Daily Challenge features the exact same mystery language for everyone globally each day; Endless gives you 3 lives to survive as long as possible; and Speed Mode challenges you to identify as many languages as you can in 60 seconds!`
    });
  }

  return { howToPlay, faqs };
}
