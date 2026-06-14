const fs = require('fs');
const path = require('path');

const files = [
  'src/styles.css',
  'src/components/GameCard.astro',
  'src/data/games.ts',
  'src/engines/multiWordGuessEngine.ts',
  'src/engines/playerStore.ts',
  'src/engines/wordGuessEngine.ts',
  'src/engines/wordPuzzleEngine.ts',
  'src/lib/gameApp.ts',
  'src/pages/multi-word-guess.astro',
  'src/pages/word-guess.astro',
  'src/pages/games/[slug].astro'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace imports and names specifically first
  content = content.replace(/wordleEngine/g, 'wordGuessEngine');
  content = content.replace(/multiWordleEngine/g, 'multiWordGuessEngine');
  
  content = content.replace(/mountWordle/g, 'mountWordGuess');
  content = content.replace(/wordleTarget/g, 'wordGuessTarget');
  content = content.replace(/createWordleTarget/g, 'createWordGuessTarget');
  content = content.replace(/WordleTarget/g, 'WordGuessTarget');
  
  content = content.replace(/multiWordle/g, 'multiWordGuess');
  content = content.replace(/mountMultiWordle/g, 'mountMultiWordGuess');
  content = content.replace(/MultiWordle/g, 'MultiWordGuess');
  
  content = content.replace(/wordleResult/g, 'wordGuessResult');
  content = content.replace(/WordleResult/g, 'WordGuessResult');
  
  content = content.replace(/wordleOptions/g, 'wordGuessOptions');
  content = content.replace(/getWordleKeyboardState/g, 'getWordGuessKeyboardState');

  // Then replace the slugs and generic css classes
  content = content.replace(/wordle/g, 'word-guess');
  
  // And the visible text
  content = content.replace(/Wordle/g, 'Word Guess');

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Replacement done');
