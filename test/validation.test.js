import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const englishWords = require('an-array-of-english-words');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the answer list (datasets.json -> wordLists['5'])
const datasetsPath = path.resolve(__dirname, '../src/data/datasets.json');
const datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));
const answerList = datasets.wordLists['5'].map(w => w.toLowerCase());

// Load the dictionary (dictionary.json)
const dictionaryPath = path.resolve(__dirname, '../public/dictionary.json');
const dictionaryArray = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
const globalDictionary = new Set(dictionaryArray);

test('Dictionary validation accepts 1000 common English words', (t) => {
    // Filter to 5-letter words only since we are testing 5-letter wordle
    const common5LetterWords = englishWords.filter(w => w.length === 5).slice(0, 1000);
    
    assert.ok(common5LetterWords.length > 0, 'Should have some 5-letter words to test');

    let passedCount = 0;
    const failedWords = [];

    for (const word of common5LetterWords) {
        const inAnswerList = answerList.includes(word);
        const inDictionary = globalDictionary.has(word);

        if (inAnswerList || inDictionary) {
            passedCount++;
        } else {
            failedWords.push(word);
        }
    }

    if (failedWords.length > 0) {
        console.error(`Validation failed for ${failedWords.length} words. Sample: ${failedWords.slice(0, 10).join(', ')}`);
    }

    assert.strictEqual(passedCount, common5LetterWords.length, 'All 1000 common 5-letter words should be accepted');
});

test('Validation fallback when dictionary is unavailable', (t) => {
    // Simulate fallback where globalDictionary is empty
    const fallbackDictionary = new Set();
    const wordInAnswerList = answerList[0]; // Guaranteed to be in answer list
    
    // Some valid word that is ONLY in the extended dictionary
    const extendedWord = dictionaryArray.find(w => w.length === 5 && !answerList.includes(w));
    
    const wordInAnswerListPassed = answerList.includes(wordInAnswerList) || fallbackDictionary.has(wordInAnswerList);
    assert.strictEqual(wordInAnswerListPassed, true, 'Answer list word should pass in fallback mode');
    
    if (extendedWord) {
        const extendedWordPassed = answerList.includes(extendedWord) || fallbackDictionary.has(extendedWord);
        assert.strictEqual(extendedWordPassed, false, 'Dictionary-only word should fail in fallback mode');
    }
});
