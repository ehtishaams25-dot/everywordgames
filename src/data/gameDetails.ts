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

  return { howToPlay, faqs };
}
