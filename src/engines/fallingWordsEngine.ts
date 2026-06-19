import type { GameConfig } from "@/data/games";
import { recordGame } from "./playerStore";
import categories from "@/data/categories";
import { renderKeyboard, wireKeyboard, escapeHtml } from "@/lib/gameApp";
import confetti from "canvas-confetti";

const fallbackBossWords = [
  "INTERSTELLAR", "ASTRONOMICAL", "CONSTELLATION", "EXTRATERRESTRIAL", 
  "THERMODYNAMICS", "ELECTROMAGNETIC", "UNPREDICTABLE", "UNBELIEVABLE", 
  "CATASTROPHIC", "REVOLUTIONARY", "EXTRAORDINARY", "TRANSFORMATION"
];

interface FallingWord {
  id: string;
  word: string;
  typedIndex: number;
  x: number;
  y: number;
  speed: number;
  isBoss: boolean;
  element: HTMLElement | null;
}

export function mountFallingWords(root: HTMLElement, game: GameConfig, getGlobalDictionary: () => Set<string> | null) {
  let score = 0;
  let lives = 3;
  let wave = 1;
  let isGameOver = false;
  let words: FallingWord[] = [];
  let activeWordId: string | null = null;
  let started = Date.now();
  
  let animationFrameId: number;
  let lastTime = 0;
  
  let spawnTimer = 0;
  let spawnInterval = 1500;
  let baseSpeed = 0.03; 
  let wordsSpawnedInWave = 0;
  let wordsToSpawnInWave = 15;
  
  let isBossWave = false;
  let bossSpawned = false;
  let cooldownTimer = 0;

  const reset = () => {
    isGameOver = false;
    score = 0;
    lives = 3;
    wave = 1;
    words = [];
    activeWordId = null;
    spawnTimer = 0;
    spawnInterval = 1500;
    baseSpeed = 0.03;
    wordsSpawnedInWave = 0;
    wordsToSpawnInWave = 15;
    isBossWave = false;
    bossSpawned = false;
    cooldownTimer = 0;
    started = Date.now();
    
    // Clear game area
    const gameArea = root.querySelector('#fw-game-area');
    if (gameArea) gameArea.innerHTML = '';
    
    updateHeader();
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(loop);
  };

  const renderUI = () => {
    root.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; max-width: 500px; margin: 0 auto 0.75rem auto;">
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div style="font-size: 0.875rem; font-weight: bold; color: var(--muted); text-transform: uppercase;">Wave <span id="fw-wave">1</span></div>
          <div style="font-size: 0.875rem; font-weight: bold; color: var(--muted); text-transform: uppercase;">Score: <span id="fw-score" style="color: var(--text);">0</span></div>
          <div style="font-size: 0.875rem; font-weight: bold; color: var(--red); text-transform: uppercase;">Lives: <span id="fw-lives">❤️❤️❤️</span></div>
        </div>
        <button class="button secondary small" type="button" data-restart style="margin: 0; white-space: nowrap; flex-shrink: 0;">Restart</button>
      </div>
      
      <div id="fw-game-area" style="position: relative; max-width: 500px; height: 550px; margin: 0 auto 1.5rem auto; background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius); overflow: hidden;">
        <!-- Words will be dynamically added here -->
      </div>
      
      <div class="fw-mobile-keyboard" style="max-width: 500px; margin: 0 auto;">
        ${renderKeyboard({})}
      </div>
    `;

    root.querySelector("[data-restart]")?.addEventListener("click", reset);
    
    wireKeyboard(root, (key) => {
      handleInput(key);
    });
  };

  const updateHeader = () => {
    const scoreEl = root.querySelector('#fw-score');
    if (scoreEl) scoreEl.textContent = score.toString();
    
    const waveEl = root.querySelector('#fw-wave');
    if (waveEl) waveEl.textContent = wave.toString();
    
    const livesEl = root.querySelector('#fw-lives');
    if (livesEl) livesEl.textContent = Array(Math.max(0, lives)).fill('❤️').join('') + Array(Math.max(0, 3-lives)).fill('🖤').join('');
  };

  const handleInput = (char: string) => {
    if (isGameOver) return;
    char = char.toUpperCase();
    if (!/^[A-Z]$/.test(char)) return;

    if (activeWordId) {
      const targetWord = words.find(w => w.id === activeWordId);
      if (targetWord) {
        if (char === targetWord.word[targetWord.typedIndex]) {
          targetWord.typedIndex++;
          updateWordElement(targetWord);
          
          if (targetWord.typedIndex === targetWord.word.length) {
            score += targetWord.isBoss ? targetWord.word.length * 10 : targetWord.word.length * 2;
            
            const wasBoss = targetWord.isBoss;
            const deadX = targetWord.x;
            const deadY = targetWord.y;
            
            destroyWord(targetWord);
            activeWordId = null;
            updateHeader();
            
            if (wasBoss) spawnMiniWords(deadX, deadY);
          }
        }
      } else {
        activeWordId = null; 
      }
    } else {
      const possibleWords = words.filter(w => w.word[0] === char);
      if (possibleWords.length > 0) {
        possibleWords.sort((a, b) => b.y - a.y); 
        const target = possibleWords[0];
        activeWordId = target.id;
        target.typedIndex = 1;
        updateWordElement(target);
        
        if (target.typedIndex === target.word.length) { 
          score += target.word.length * 2;
          
          const wasBoss = target.isBoss;
          const deadX = target.x;
          const deadY = target.y;
          
          destroyWord(target);
          activeWordId = null;
          updateHeader();
          
          if (wasBoss) spawnMiniWords(deadX, deadY);
        }
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.activeElement?.tagName === "INPUT") return;
    handleInput(e.key);
  };

  const getRandomWord = (lengthRange: [number, number], allowFallback: boolean = true) => {
    let wordList: string[] = [];
    const dict = getGlobalDictionary();
    
    if (dict && dict.size > 0) {
      wordList = Array.from(dict).filter(w => w.length >= lengthRange[0] && w.length <= lengthRange[1]);
    }
    
    if (wordList.length === 0) {
      if (lengthRange[0] >= 10) {
        wordList = fallbackBossWords;
      } else if (allowFallback) {
        wordList = ["CAT", "DOG", "BAT", "FLY", "RUN", "JUMP", "CODE"];
      }
    }
    
    if (wordList.length === 0) return "TEST";
    return wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
  };

  const spawnWord = () => {
    if (isBossWave && bossSpawned) return;
    
    const gameArea = root.querySelector('#fw-game-area');
    if (!gameArea) return;
    
    const isBoss = isBossWave;
    // Variable word lengths: mix of short (3-4), medium (5-6), and long (7-9)
    const lengthBuckets: [number, number][] = [[3, 4], [4, 6], [5, 7], [6, 9]];
    const bucket = lengthBuckets[Math.floor(Math.random() * lengthBuckets.length)];
    const wordText = getRandomWord(isBoss ? [10, 15] : bucket);
    
    // Estimate width: normal ~14px/char, boss ~18px/char
    const charWidth = isBoss ? 18 : 14;
    const estimatedWidth = wordText.length * charWidth + 24; // + padding
    
    const gameAreaWidth = gameArea.clientWidth || 500;
    const maxX = Math.max(0, gameAreaWidth - estimatedWidth);
    const spawnX = Math.random() * maxX;
    
    const word: FallingWord = {
      id: Math.random().toString(36).substring(2, 9),
      word: wordText,
      typedIndex: 0,
      x: spawnX,
      y: -40,
      speed: isBoss ? baseSpeed * 0.4 : baseSpeed * (0.8 + Math.random() * 0.4),
      isBoss,
      element: null
    };
    
    createWordElement(word);
    
    wordsSpawnedInWave++;
    if (isBoss) bossSpawned = true;
  };

  const spawnMiniWords = (x: number, y: number) => {
    const numMinis = Math.floor(Math.random() * 2) + 3; // 3 to 4 minis
    const gameAreaWidth = root.querySelector('#fw-game-area')?.clientWidth || 500;
    
    for (let i = 0; i < numMinis; i++) {
      const wordText = getRandomWord([3, 4]); 
      const estimatedWidth = wordText.length * 14 + 24;
      
      const offsetX = (Math.random() - 0.5) * 100;
      let spawnX = Math.max(0, Math.min(gameAreaWidth - estimatedWidth, x + offsetX));
      
      const word: FallingWord = {
        id: Math.random().toString(36).substring(2, 9),
        word: wordText,
        typedIndex: 0,
        x: spawnX,
        y: y - Math.random() * 40, 
        speed: baseSpeed * (1.2 + Math.random() * 0.8), // Fast
        isBoss: false,
        element: null
      };
      
      createWordElement(word);
    }
  };

  const createWordElement = (word: FallingWord) => {
    const gameArea = root.querySelector('#fw-game-area');
    if (!gameArea) return;
    
    const el = document.createElement('div');
    // Using site-native styling: looks like a clean chip
    el.style.position = 'absolute';
    el.style.left = `${word.x}px`;
    el.style.top = `${word.y}px`;
    el.style.padding = '4px 12px';
    el.style.borderRadius = '20px';
    el.style.background = 'var(--surface2)';
    el.style.border = '2px solid var(--border)';
    el.style.color = 'var(--text)';
    el.style.fontWeight = 'bold';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = word.isBoss ? '1.25rem' : '1rem';
    el.style.whiteSpace = 'nowrap';
    el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    el.style.transition = 'top 0.1s linear, background 0.2s';
    
    if (word.isBoss) {
      el.style.borderColor = 'var(--red)';
      el.style.color = 'var(--red)';
      el.style.background = 'rgba(239, 68, 68, 0.1)';
    }

    el.innerHTML = word.word.split('').map(ch => `<span style="display: inline-block; transition: color 0.15s, opacity 0.15s;">${ch}</span>`).join('');
    
    gameArea.appendChild(el);
    word.element = el;
    words.push(word);
  };

  const updateWordElement = (word: FallingWord) => {
    if (!word.element) return;
    
    // Render each letter individually with clear visual progress
    const lettersHtml = word.word.split('').map((ch, i) => {
      if (i < word.typedIndex) {
        // Already typed: greyed out with line-through
        return `<span style="display: inline-block; color: var(--muted); opacity: 0.35; text-decoration: line-through; transition: color 0.15s, opacity 0.15s;">${ch}</span>`;
      } else if (i === word.typedIndex && word.id === activeWordId) {
        // Next letter to type: highlighted cursor
        return `<span style="display: inline-block; color: var(--v2-green); font-weight: 900; text-decoration: underline; text-underline-offset: 3px; transition: color 0.15s;">${ch}</span>`;
      } else {
        // Untyped: normal
        return `<span style="display: inline-block; transition: color 0.15s, opacity 0.15s;">${ch}</span>`;
      }
    }).join('');
    
    word.element.innerHTML = lettersHtml;
    
    if (word.id === activeWordId) {
      word.element.style.borderColor = 'var(--v2-orange)';
      word.element.style.background = 'var(--surface)';
      word.element.style.transform = 'scale(1.05)';
    } else {
      word.element.style.borderColor = word.isBoss ? 'var(--red)' : 'var(--border)';
      word.element.style.transform = 'scale(1)';
      word.element.style.background = word.isBoss ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface2)';
    }
  };

  const destroyWord = (word: FallingWord) => {
    if (word.element) {
      word.element.style.transform = 'scale(1.5)';
      word.element.style.opacity = '0';
      setTimeout(() => word.element?.remove(), 200);
    }
    words = words.filter(w => w.id !== word.id);
  };

  const loseLife = () => {
    lives--;
    updateHeader();
    
    const gameArea = root.querySelector('#fw-game-area') as HTMLElement;
    if (gameArea) {
      const originalBorder = gameArea.style.borderColor;
      gameArea.style.borderColor = 'var(--red)';
      setTimeout(() => {
        if (!isGameOver && gameArea) gameArea.style.borderColor = originalBorder;
      }, 200);
    }

    if (lives <= 0) {
      gameOver();
    }
  };

  const gameOver = () => {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('keydown', onKeyDown);
    
    const elapsedSeconds = Math.round((Date.now() - started) / 1000);
    recordGame(game.slug, false, elapsedSeconds, score);  
    
    const gameArea = root.querySelector('#fw-game-area');
    if (gameArea) {
      gameArea.innerHTML += `
        <div style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;">
          <h2 style="color: var(--red); font-size: 2rem; margin-bottom: 0;">Game Over!</h2>
          <p style="color: var(--text); font-size: 1.25rem; font-weight: bold;">Score: ${score}</p>
        </div>
      `;
      // Support dark mode correctly
      const overlay = gameArea.lastElementChild as HTMLElement;
      if (document.documentElement.classList.contains('dark')) {
        overlay.style.background = 'rgba(0,0,0,0.8)';
      }
    }
  };

  const cleanup = () => {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('keydown', onKeyDown);
  };

  const loop = (timestamp: number) => {
    if (isGameOver) return;
    
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    const gameArea = root.querySelector('#fw-game-area');
    const gameAreaHeight = gameArea ? gameArea.clientHeight : 400;
    
    if (cooldownTimer > 0) {
      cooldownTimer -= dt;
    } else {
      if (isBossWave) {
        if (bossSpawned && words.length === 0) {
          wave++;
          updateHeader();
          isBossWave = false;
          wordsSpawnedInWave = 0;
          wordsToSpawnInWave = 15 + wave * 2;
          spawnInterval = Math.max(500, 1500 - wave * 80);
          baseSpeed = 0.03 + wave * 0.005;
          cooldownTimer = 2000;
        } else if (!bossSpawned) {
          spawnWord();
        }
      } else {
        if (wordsSpawnedInWave < wordsToSpawnInWave) {
          spawnTimer += dt;
          if (spawnTimer >= spawnInterval) {
            spawnTimer = 0;
            spawnWord();
          }
        } else if (words.length === 0) {
          isBossWave = true;
          bossSpawned = false;
          cooldownTimer = 2000;
          
          if (gameArea) {
            const msg = document.createElement('div');
            msg.innerHTML = '<span style="background: var(--red); color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">BOSS APPROACHING!</span>';
            msg.style.position = 'absolute';
            msg.style.top = '50%';
            msg.style.left = '50%';
            msg.style.transform = 'translate(-50%, -50%)';
            msg.style.zIndex = '10';
            gameArea.appendChild(msg);
            setTimeout(() => msg.remove(), 1800);
          }
        }
      }
    }
    
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      w.y += w.speed * dt;
      if (w.element) {
        w.element.style.top = `${w.y}px`;
      }
      
      // Hit bottom check
      if (w.y > gameAreaHeight - 30) {
        if (w.id === activeWordId) activeWordId = null;
        destroyWord(w);
        loseLife();
      }
    }
    
    if (!isGameOver) {
      animationFrameId = requestAnimationFrame(loop);
    }
  };

  (root as any)._cleanup = cleanup;
  
  window.addEventListener('keydown', onKeyDown);
  
  renderUI();
  reset(); // Starts the loop
}
