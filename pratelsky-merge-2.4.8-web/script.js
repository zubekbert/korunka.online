(() => {
  'use strict';

  const loadingState = document.getElementById('loadingState');
  const fakeLoadingOverlay = document.getElementById('fakeLoadingOverlay');
  const fakeLoadingTitle = document.getElementById('fakeLoadingTitle');
  const fakeLoadingHint = document.getElementById('fakeLoadingHint');
  const comboStopOverlay = document.getElementById('comboStopOverlay');
  const comboStopTitle = document.getElementById('comboStopTitle');
  const comboStopImage = document.getElementById('comboStopImage');
  const comboStopKicker = document.getElementById('comboStopKicker');
  const pullRefreshEasterEgg = document.getElementById('pullRefreshEasterEgg');
  const pullRefreshLabel = document.getElementById('pullRefreshLabel');
  let matterAttempts = 0;
  const FAKE_LOADING_MIN_MS = 1950;
  const FAKE_RESTART_MIN_MS = 1750;

const LOADING_HINTS = [
  'Leštím Dagmar řetěz…',
  'Hledám Tomáše…',
  'Kontroluji Zdendův čumák…',
  'Zahřívám fyziku…',
  'Připravuji zlatou figurku…',
  'Probouzím Tomáše…',
  'Dagmar odmítá menší řetěz…',
  'Ondra kontroluje fyziku…'
];
let loadingHintTimer = null;

const COMBO_STOP_TRIGGER = 5;
const COMBO_STOP_SCENARIOS = [
  {
    kicker: 'Combo ×5',
    image: 'assets/ui/combo-warning-worker.png',
    titles: [
      'Vykašli se na všechnu práci.',
      'Práce počká.',
      'Flákej se profesionálně.',
      'Dneska už nic nedělej.'
    ]
  },
  {
    kicker: 'Combo ×5',
    image: 'assets/ui/combo-stop-sleep.jpg',
    title: 'Odpočiň si.'
  },
  {
    kicker: 'Combo ×5',
    image: 'assets/ui/combo-stop-rifle.png',
    title: 'Už toho opravdu nech.'
  },
  {
    kicker: 'Combo ×5',
    image: 'assets/ui/combo-stop-bighead.png',
    title: 'To je blbě.'
  }
];
const COMBO_STOP_MS = 2950;

  function waitForMatter() {
    if (window.Matter) {
      startGameModule(window.Matter);
      return;
    }
    matterAttempts += 1;
    if (matterAttempts < 60) {
      window.setTimeout(waitForMatter, 100);
    } else if (loadingState) {
      loadingState.textContent = 'Nepodařilo se načíst fyzikální knihovnu Matter.js. Zkontroluj internetové připojení a obnov stránku.';
      if (fakeLoadingTitle) fakeLoadingTitle.textContent = 'Načítání se nepodařilo';
      if (fakeLoadingHint) fakeLoadingHint.textContent = 'Zkus obnovit stránku.';
    }
  }


function stopLoadingHints() {
  if (loadingHintTimer) {
    window.clearInterval(loadingHintTimer);
    loadingHintTimer = null;
  }
}

function startLoadingHints() {
  if (!fakeLoadingHint) return;
  stopLoadingHints();
  let hintIndex = Math.floor(Math.random() * LOADING_HINTS.length);
  fakeLoadingHint.textContent = LOADING_HINTS[hintIndex];
  loadingHintTimer = window.setInterval(() => {
    hintIndex = (hintIndex + 1 + Math.floor(Math.random() * (LOADING_HINTS.length - 1))) % LOADING_HINTS.length;
    fakeLoadingHint.textContent = LOADING_HINTS[hintIndex];
  }, 920);
}

function setFakeLoadingVisible(visible, title = 'Načítání nové hry') {
  if (fakeLoadingTitle) fakeLoadingTitle.textContent = title;
  if (visible) startLoadingHints(); else stopLoadingHints();
  if (!fakeLoadingOverlay) return;
  fakeLoadingOverlay.classList.toggle('is-visible', visible);
  fakeLoadingOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

function showFakeLoading(title = 'Načítání nové hry') {
  setFakeLoadingVisible(true, title);
}

function hideFakeLoading() {
  setFakeLoadingVisible(false);
}



function setComboStopVisible(visible, scenario = null) {
  if (scenario) {
    if (comboStopTitle) comboStopTitle.textContent = scenario.title || '';
    if (comboStopImage && scenario.image) comboStopImage.src = scenario.image;
    if (comboStopKicker) comboStopKicker.textContent = scenario.kicker || `Combo ×${COMBO_STOP_TRIGGER}`;
  }
  if (!comboStopOverlay) return;
  comboStopOverlay.classList.toggle('is-visible', visible);
  comboStopOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

  function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }


let deferredInstallPrompt = null;
const installButton = document.getElementById('installButton');

if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('Service worker se nepodařilo zaregistrovat.', error);
    });
  });
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) installButton.hidden = false;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installButton) installButton.hidden = true;
});

if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

  function startGameModule(MatterLib) {
    const { Engine, Bodies, Body, Composite, Events } = MatterLib;

    const LEVELS = [
      {
        name: 'Zdenda', file: 'assets/characters/zdenda.webp',
        visualWidth: 66, visualHeight: 88, hitWidth: 54, hitHeight: 74,
        exponent: 2.00, points: 10, tone: 196, wave: 'triangle'
      },
      {
        name: 'Terka', file: 'assets/characters/terka.webp',
        visualWidth: 78, visualHeight: 102, hitWidth: 60, hitHeight: 84,
        exponent: 2.00, points: 20, tone: 247, wave: 'sine'
      },
      {
        name: 'Míra', file: 'assets/characters/mira.webp',
        visualWidth: 92, visualHeight: 118, hitWidth: 70, hitHeight: 98,
        exponent: 2.05, points: 40, tone: 294, wave: 'triangle'
      },
      {
        name: 'Karel', file: 'assets/characters/karel.webp',
        visualWidth: 108, visualHeight: 134, hitWidth: 94, hitHeight: 112,
        exponent: 2.25, points: 80, tone: 370, wave: 'square'
      },
      {
        name: 'Dagmar', file: 'assets/characters/dagmar.webp',
        visualWidth: 124, visualHeight: 152, hitWidth: 104, hitHeight: 128,
        exponent: 2.30, points: 160, tone: 440, wave: 'sine'
      },
      {
        name: 'Ondra', file: 'assets/characters/ondra.webp',
        visualWidth: 142, visualHeight: 174, hitWidth: 118, hitHeight: 144,
        exponent: 2.30, points: 320, tone: 554, wave: 'triangle'
      },
      {
        name: 'Tomáš', file: 'assets/characters/tomas.webp',
        visualWidth: 162, visualHeight: 198, hitWidth: 132, hitHeight: 160,
        exponent: 2.20, points: 640, tone: 659, wave: 'sine'
      }
    ];

    const GAME = {
      width: 420,
      height: 660,
      wall: 18,
      sideInset: 20,
      floorY: 632,
      dangerY: 162,
      dropY: 82,
      initialUnlocked: 3,
      dropCooldownMs: 150,
      mergeReach: 1.08,
      overflowHoldMs: 700,
      overflowSettleMs: 720,
      comboWindowMs: 2300,
      goldChance: 1 / 15,
      goldImpactGraceMs: 130,
      goldAuraFadeMs: 180,
      starterWeights: [0.55, 0.30, 0.15],
      storageBest: 'pratelsky-merge-best-v24',
      previousStorageBest: 'pratelsky-merge-best-v22'
    };

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const canvasStage = document.getElementById('canvasStage');
    const scoreValue = document.getElementById('scoreValue');
    const bestValue = document.getElementById('bestValue');
    const mergeValue = document.getElementById('mergeValue');
    const highestValue = document.getElementById('highestValue');
    const nextValue = document.getElementById('nextValue');
    const helpText = document.getElementById('helpText');
    const collection = document.getElementById('collection');
    const unlockedCounter = document.getElementById('unlockedCounter');
    const comboBurst = document.getElementById('comboBurst');
    const levelUnlockSplash = document.getElementById('levelUnlockSplash');
    const levelUnlockImage = document.getElementById('levelUnlockImage');
    const levelUnlockName = document.getElementById('levelUnlockName');
    const comboCameo = document.getElementById('comboCameo');
    const comboCameoImage = document.getElementById('comboCameoImage');
    const unlockToast = document.getElementById('unlockToast');
    const goldToast = document.getElementById('goldToast');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const gameOverSummary = document.getElementById('gameOverSummary');
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');
    const soundLabel = document.getElementById('soundLabel');
    const tomasVoice = document.getElementById('tomasVoice');

    const images = [];
    let engine;
    let pointerX = GAME.width / 2;
    let activePointerId = null;
    let isAiming = false;
    let canDrop = true;
    let isGameOver = false;
    let currentDrop = null;
    let nextDrop = null;
    let score = 0;
    let mergeCount = 0;
    let highestLevel = GAME.initialUnlocked - 1;
    let unlockedLevels = GAME.initialUnlocked;
    let pendingMerges = [];
    let mergeEffects = [];
    let particles = [];
    let lastFrame = performance.now();
    let animationFrame = null;
    let toastTimer = null;
    let levelUnlockTimer = null;
    let goldToastTimer = null;
    let comboTimer = null;
    let comboCount = 0;
    let comboCameoTimer = null;
    let comboStopActive = false;
    let comboStopTimer = null;
    let lastMergeAt = -Infinity;
    let pendingTomasVoice = false;
    let tomasVoiceQueue = 0;
    let tomasVoicePlaying = false;
    const tomasVoiceTimers = new Set();
    let soundEnabled = true;
    let audioContext = null;
    let paletteTransition = null;
    let canvasPalette = null;
    let resetSequenceId = 0;
    let pullRefreshActive = false;
    let pullRefreshCommitted = false;
    let pullRefreshStartX = 0;
    let pullRefreshStartY = 0;
    let pullRefreshDistance = 0;

    const storedBest = Number(localStorage.getItem(GAME.storageBest) || 0);
    const previousBest = Number(localStorage.getItem(GAME.previousStorageBest) || 0);
    let bestScore = Math.max(storedBest, previousBest);
    localStorage.setItem(GAME.storageBest, String(bestScore));

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const easeOutBack = (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);


function setPullRefreshDistance(distance) {
  pullRefreshDistance = clamp(distance, 0, PULL_REFRESH_MAX_PX);
  if (!pullRefreshEasterEgg) return;
  const visualOffset = Math.min(158, pullRefreshDistance * .92);
  pullRefreshEasterEgg.style.setProperty('--pull-offset', `${visualOffset}px`);
  pullRefreshEasterEgg.classList.toggle('is-ready', pullRefreshDistance >= PULL_REFRESH_THRESHOLD_PX);
  if (pullRefreshLabel) {
    pullRefreshLabel.textContent = pullRefreshDistance >= PULL_REFRESH_THRESHOLD_PX
      ? 'Pusť pro novou hru'
      : 'Táhni ještě kousek…';
  }
}

function resetPullRefreshIndicator(immediate = false) {
  pullRefreshActive = false;
  pullRefreshCommitted = false;
  pullRefreshDistance = 0;
  if (!pullRefreshEasterEgg) return;
  pullRefreshEasterEgg.classList.remove('is-dragging', 'is-ready', 'is-triggered');
  if (immediate) {
    pullRefreshEasterEgg.style.transition = 'none';
    pullRefreshEasterEgg.style.setProperty('--pull-offset', '0px');
    requestAnimationFrame(() => { pullRefreshEasterEgg.style.transition = ''; });
  } else {
    pullRefreshEasterEgg.style.setProperty('--pull-offset', '0px');
  }
  pullRefreshEasterEgg.setAttribute('aria-hidden', 'true');
  if (pullRefreshLabel) pullRefreshLabel.textContent = 'Táhni ještě kousek…';
}

function beginPullRefresh(event) {
  if (!event.touches || event.touches.length !== 1) return;
  if (window.innerWidth > 860 || window.scrollY > 1 || comboStopActive) return;
  if (fakeLoadingOverlay?.classList.contains('is-visible')) return;
  const touch = event.touches[0];
  if (touch.clientY > PULL_REFRESH_START_ZONE_PX) return;
  const target = event.target;
  if (target instanceof HTMLElement && target.closest('button, a, input, textarea, select')) return;
  pullRefreshActive = true;
  pullRefreshCommitted = false;
  pullRefreshStartX = touch.clientX;
  pullRefreshStartY = touch.clientY;
  setPullRefreshDistance(0);
}

function movePullRefresh(event) {
  if (!pullRefreshActive || !event.touches || event.touches.length !== 1) return;
  const touch = event.touches[0];
  const dx = touch.clientX - pullRefreshStartX;
  const dy = touch.clientY - pullRefreshStartY;
  if (!pullRefreshCommitted) {
    if (dy <= 7) return;
    if (Math.abs(dx) > dy * .72) {
      resetPullRefreshIndicator(true);
      return;
    }
    pullRefreshCommitted = true;
    if (pullRefreshEasterEgg) {
      pullRefreshEasterEgg.classList.add('is-dragging');
      pullRefreshEasterEgg.setAttribute('aria-hidden', 'false');
    }
  }
  if (dy > 0) {
    event.preventDefault();
    const resisted = Math.pow(dy, .92) * .88;
    setPullRefreshDistance(resisted);
  }
}

function endPullRefresh() {
  if (!pullRefreshActive) return;
  const shouldRestart = pullRefreshCommitted && pullRefreshDistance >= PULL_REFRESH_THRESHOLD_PX;
  pullRefreshActive = false;
  if (!shouldRestart) {
    resetPullRefreshIndicator();
    return;
  }
  if (pullRefreshEasterEgg) {
    pullRefreshEasterEgg.classList.remove('is-dragging', 'is-ready');
    pullRefreshEasterEgg.classList.add('is-triggered');
    pullRefreshEasterEgg.style.setProperty('--pull-offset', '158px');
  }
  if (pullRefreshLabel) pullRefreshLabel.textContent = 'Spouštím novou hru…';
  window.setTimeout(() => {
    resetPullRefreshIndicator();
    ensureAudioContext();
    restartWithFakeLoading();
  }, 460);
}

    function setupCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(GAME.width * dpr);
      canvas.height = Math.round(GAME.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function loadImage(src) {
      return new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
      });
    }

    async function preloadAssets() {
      const loaded = await Promise.all(LEVELS.map(level => loadImage(level.file)));
      loaded.forEach((image, index) => { images[index] = image; });
      const missing = loaded.map((image, index) => image ? null : LEVELS[index].name).filter(Boolean);
      if (missing.length && loadingState) {
        loadingState.textContent = `Nepodařilo se načíst: ${missing.join(', ')}.`;
        throw new Error('Chybí obrázky postav.');
      }
    }

    function randomStarterLevel() {
      const random = Math.random();
      if (random < GAME.starterWeights[0]) return 0;
      if (random < GAME.starterWeights[0] + GAME.starterWeights[1]) return 1;
      return 2;
    }

    function randomDrop() {
      return {
        level: randomStarterLevel(),
        gold: Math.random() < GAME.goldChance
      };
    }

    function superellipseVertices(width, height, exponent, count = 28) {
      const vertices = [];
      for (let index = 0; index < count; index += 1) {
        const angle = Math.PI * 2 * index / count;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        vertices.push({
          x: width / 2 * Math.sign(cosine) * Math.pow(Math.abs(cosine), 2 / exponent),
          y: height / 2 * Math.sign(sine) * Math.pow(Math.abs(sine), 2 / exponent)
        });
      }
      return vertices;
    }

    function createWalls() {
      const options = {
        isStatic: true,
        restitution: 0.025,
        friction: 0.48,
        label: 'wall'
      };
      const topY = GAME.dangerY - 16;
      const sideHeight = GAME.height - topY;
      const leftWallX = GAME.sideInset + GAME.wall / 2;
      const rightWallX = GAME.width - GAME.sideInset - GAME.wall / 2;
      const floorWidth = GAME.width - GAME.sideInset * 2;

      Composite.add(engine.world, [
        Bodies.rectangle(leftWallX, topY + sideHeight / 2, GAME.wall, sideHeight, options),
        Bodies.rectangle(rightWallX, topY + sideHeight / 2, GAME.wall, sideHeight, options),
        Bodies.rectangle(
          GAME.width / 2,
          GAME.floorY + GAME.wall / 2,
          floorWidth,
          GAME.wall,
          { ...options, label: 'floor' }
        )
      ]);
    }

    function createPiece(levelIndex, x, y, options = {}) {
      const level = LEVELS[levelIndex];
      const body = Bodies.fromVertices(
        x,
        y,
        [superellipseVertices(level.hitWidth, level.hitHeight, level.exponent)],
        {
          restitution: 0.055,
          friction: 0.13,
          frictionStatic: 0.22,
          frictionAir: 0.0105,
          density: 0.00135,
          label: 'piece'
        },
        true
      );

      body.game = {
        level: levelIndex,
        gold: Boolean(options.gold),
        goldExpiresAt: null,
        goldFadeStart: null,
        bornAt: performance.now(),
        popStart: options.pop ? performance.now() : null,
        popDuration: 390,
        merging: false,
        overflowSince: null
      };

      Body.setInertia(body, body.inertia * 0.67);
      Body.setAngle(body, Number.isFinite(options.angle) ? options.angle : (Math.random() - 0.5) * 0.055);
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.020);
      return body;
    }

    function bindCollisions() {
      Events.on(engine, 'collisionStart', event => {
        const now = performance.now();
        for (const pair of event.pairs) {
          const a = pair.bodyA;
          const b = pair.bodyB;
          let mergeQueued = false;

          if (a.label === 'piece' && b.label === 'piece') {
            mergeQueued = queueMerge(a, b);
          }

          registerGoldLanding(a, b, now, mergeQueued);
          registerGoldLanding(b, a, now, mergeQueued);
        }
      });
    }

    function bodyExists(body) {
      return Boolean(Composite.get(engine.world, body.id, 'body'));
    }

    function queueMerge(a, b) {
      if (!a?.game || !b?.game) return false;
      if (a.game.merging || b.game.merging) return false;
      if (a.game.level !== b.game.level) return false;
      if (a.game.level >= LEVELS.length - 1) return false;
      a.game.merging = true;
      b.game.merging = true;
      pendingMerges.push([a, b]);
      return true;
    }

    function registerGoldLanding(body, other, now, mergeQueued) {
      if (body.label !== 'piece' || !body.game?.gold || body.game.merging || mergeQueued) return;

      const landedOnFloor = other.label === 'floor';
      const landedOnPiece = other.label === 'piece'
        && body.position.y <= other.position.y + 5
        && body.velocity.y >= -0.45;

      // Dotyk boční stěny se nepočítá jako dopad. Zlatá větev dostane
      // jen nepatrnou technickou toleranci, aby se stihl zpracovat merge
      // vzniklý ve stejném fyzikálním kroku.
      if ((landedOnFloor || landedOnPiece) && body.game.goldExpiresAt == null) {
        body.game.goldExpiresAt = now + GAME.goldImpactGraceMs;
      }
    }

    function updateGoldLifecycle(now) {
      const bodies = Composite.allBodies(engine.world)
        .filter(body => body.label === 'piece' && body.game);

      for (const body of bodies) {
        if (
          body.game.gold
          && !body.game.merging
          && body.game.goldExpiresAt != null
          && now >= body.game.goldExpiresAt
        ) {
          body.game.gold = false;
          body.game.goldExpiresAt = null;
          body.game.goldFadeStart = now;
        }

        if (
          body.game.goldFadeStart != null
          && now - body.game.goldFadeStart >= GAME.goldAuraFadeMs
        ) {
          body.game.goldFadeStart = null;
        }
      }
    }

    function goldVisualStrength(body, now) {
      if (body.game.gold) return 1;
      if (body.game.goldFadeStart == null) return 0;
      return 1 - clamp((now - body.game.goldFadeStart) / GAME.goldAuraFadeMs, 0, 1);
    }

    function findNearbyMerges() {
      const bodies = Composite.allBodies(engine.world)
        .filter(body => body.label === 'piece' && body.game && !body.game.merging);

      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          const a = bodies[i];
          const b = bodies[j];
          if (a.game.merging || b.game.merging) continue;
          if (a.game.level !== b.game.level || a.game.level >= LEVELS.length - 1) continue;

          const level = LEVELS[a.game.level];
          const dx = a.position.x - b.position.x;
          const dy = a.position.y - b.position.y;
          const reachX = level.hitWidth * GAME.mergeReach;
          const reachY = level.hitHeight * GAME.mergeReach;
          const normalized = dx * dx / (reachX * reachX) + dy * dy / (reachY * reachY);

          if (normalized <= 1) {
            queueMerge(a, b);
            break;
          }
        }
      }
    }

    function updateCombo(now) {
      if (now - lastMergeAt <= GAME.comboWindowMs) {
        comboCount = comboCount >= 5 ? 1 : comboCount + 1;
      } else {
        comboCount = 1;
      }
      lastMergeAt = now;
      if (comboCount >= 2) showCombo(comboCount);
      return comboCount;
    }


function showCombo(value) {
  comboBurst.textContent = `COMBO ×${value}`;
  comboBurst.classList.remove('is-visible');
  void comboBurst.offsetWidth;
  comboBurst.classList.add('is-visible');
  window.clearTimeout(comboTimer);
  comboTimer = window.setTimeout(() => comboBurst.classList.remove('is-visible'), 760);
  maybeShowComboCameo(value);
  if (value === COMBO_STOP_TRIGGER) triggerComboStop();
}


function triggerComboStop() {
  if (comboStopActive || isGameOver) return;
  comboStopActive = true;
  canDrop = false;
  activePointerId = null;
  isAiming = false;
  canvas.classList.remove('is-aiming');
  if (engine) engine.timing.timeScale = 0;
  const baseScenario = COMBO_STOP_SCENARIOS[Math.floor(Math.random() * COMBO_STOP_SCENARIOS.length)];
  const scenario = { ...baseScenario, title: baseScenario.title || baseScenario.titles[Math.floor(Math.random() * baseScenario.titles.length)] };
  setComboStopVisible(true, scenario);
  window.clearTimeout(comboStopTimer);
  comboStopTimer = window.setTimeout(() => {
    setComboStopVisible(false);
    if (engine) engine.timing.timeScale = 1;
    comboStopActive = false;
    canDrop = true;
  }, COMBO_STOP_MS);
}

function maybeShowComboCameo(value) {
  if (!comboCameo || !comboCameoImage || window.innerWidth <= 860) return;
  if (value < 2 || value > 4 || isGameOver || comboStopActive) return;
  const showLeft = Math.random() < 0.5;
  comboCameoImage.src = showLeft ? 'assets/ui/ondra-peek-left.png' : 'assets/ui/ondra-peek-right.png';
  comboCameo.classList.remove('is-left', 'is-right', 'is-visible');
  void comboCameo.offsetWidth;
  comboCameo.classList.add(showLeft ? 'is-left' : 'is-right');
  comboCameo.setAttribute('aria-hidden', 'false');
  window.clearTimeout(comboCameoTimer);
  comboCameo.classList.add('is-visible');
  comboCameoTimer = window.setTimeout(() => {
    comboCameo.classList.remove('is-visible');
    window.setTimeout(() => {
      comboCameo.classList.remove('is-left', 'is-right');
      comboCameo.setAttribute('aria-hidden', 'true');
    }, 1200);
  }, 1350 + Math.random() * 550);
}

    function showUnlock(levelIndex) {
      const level = LEVELS[levelIndex];
      unlockToast.textContent = `Odemčena postava: ${level.name}`;
      unlockToast.classList.add('is-visible');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => unlockToast.classList.remove('is-visible'), 1600);

      if (levelUnlockSplash && levelUnlockImage && levelUnlockName) {
        levelUnlockImage.src = level.file;
        levelUnlockImage.alt = level.name;
        levelUnlockName.textContent = level.name;
        levelUnlockSplash.classList.remove('is-visible');
        void levelUnlockSplash.offsetWidth;
        levelUnlockSplash.classList.add('is-visible');
        levelUnlockSplash.setAttribute('aria-hidden', 'false');
        window.clearTimeout(levelUnlockTimer);
        levelUnlockTimer = window.setTimeout(() => {
          levelUnlockSplash.classList.remove('is-visible');
          levelUnlockSplash.setAttribute('aria-hidden', 'true');
        }, 1580);
      }
    }

    function showGoldToast() {
      goldToast.classList.add('is-visible');
      window.clearTimeout(goldToastTimer);
      goldToastTimer = window.setTimeout(() => goldToast.classList.remove('is-visible'), 1200);
    }

    function spawnParticles(x, y, gold, count = 18) {
      const colors = gold
        ? ['#fff4b0', '#ffd35a', '#e7a72b', '#ffffff']
        : ['#ffffff', '#f1c49d', '#d8874b', '#ffe6d2'];
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.7 + Math.random() * 2.8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          gravity: 0.035 + Math.random() * 0.025,
          life: 420 + Math.random() * 300,
          born: performance.now(),
          size: 1.8 + Math.random() * 3.7,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    function processMerges(now) {
      if (!pendingMerges.length) return;
      const queue = pendingMerges;
      pendingMerges = [];

      for (const [a, b] of queue) {
        if (!bodyExists(a) || !bodyExists(b)) continue;

        const sourceLevel = a.game.level;
        const newLevel = sourceLevel + 1;
        const x = (a.position.x + b.position.x) / 2;
        const y = (a.position.y + b.position.y) / 2;
        const velocityX = (a.velocity.x + b.velocity.x) / 2;
        const velocityY = (a.velocity.y + b.velocity.y) / 2;
        const goldParents = Number(a.game.gold) + Number(b.game.gold);
        const resultGold = goldParents > 0;
        const comboMultiplier = updateCombo(now);
        const goldMultiplier = 1 + goldParents;
        const gained = LEVELS[newLevel].points * comboMultiplier * goldMultiplier;

        mergeEffects.push({
          start: now,
          duration: 430,
          x,
          y,
          sourceLevel,
          resultLevel: newLevel,
          gold: resultGold,
          from: [
            { x: a.position.x, y: a.position.y, angle: a.angle, gold: a.game.gold },
            { x: b.position.x, y: b.position.y, angle: b.angle, gold: b.game.gold }
          ],
          gained
        });

        Composite.remove(engine.world, a);
        Composite.remove(engine.world, b);

        const merged = createPiece(newLevel, x, y, { gold: resultGold, pop: true });
        Body.setVelocity(merged, {
          x: velocityX * 0.14 + (Math.random() - 0.5) * 0.24,
          y: Math.min(-1.05, velocityY * 0.06 - 0.40)
        });
        Body.setAngularVelocity(merged, (Math.random() - 0.5) * 0.018);
        Composite.add(engine.world, merged);

        spawnParticles(x, y, resultGold, resultGold ? 26 : 18);
        playMergeSound(sourceLevel, comboMultiplier, resultGold);

        score += gained;
        mergeCount += 1;
        highestLevel = Math.max(highestLevel, newLevel);

        if (newLevel + 1 > unlockedLevels) {
          const previous = unlockedLevels;
          unlockedLevels = newLevel + 1;
          renderCollection(previous);
          showUnlock(newLevel);
        }

        if (newLevel === LEVELS.length - 1) {
          scheduleTomasVoice(370);
        }

        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem(GAME.storageBest, String(bestScore));
        }
      }

      updateStats();
    }

    function tuneMotion() {
      const bodies = Composite.allBodies(engine.world)
        .filter(body => body.label === 'piece' && body.game && !body.game.merging);

      for (const body of bodies) {
        const maxAngular = 0.047;
        if (Math.abs(body.angularVelocity) > maxAngular) {
          Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * maxAngular);
        }

        if (body.speed < 1.7) {
          Body.setAngularVelocity(body, body.angularVelocity * 0.985);
        }
      }
    }

    async function restartWithFakeLoading(title = 'Načítání nové hry', delay = FAKE_RESTART_MIN_MS) {
      const sequenceId = ++resetSequenceId;
      showFakeLoading(title);
      await wait(delay);
      if (sequenceId !== resetSequenceId) return;
      resetGame();
      await wait(180);
      if (sequenceId !== resetSequenceId) return;
      hideFakeLoading();
    }

    function resetGame() {
      if (animationFrame) cancelAnimationFrame(animationFrame);

      engine = Engine.create({ enableSleeping: true });
      engine.gravity.y = 1.18;
      engine.gravity.scale = 0.001;

      pointerX = GAME.width / 2;
      activePointerId = null;
      isAiming = false;
      canDrop = true;
      isGameOver = false;
      currentDrop = randomDrop();
      nextDrop = randomDrop();
      score = 0;
      mergeCount = 0;
      highestLevel = GAME.initialUnlocked - 1;
      unlockedLevels = GAME.initialUnlocked;
      pendingMerges = [];
      mergeEffects = [];
      particles = [];
      comboCount = 0;
      comboStopActive = false;
      window.clearTimeout(comboStopTimer);
      setComboStopVisible(false);
      window.clearTimeout(comboCameoTimer);
      lastMergeAt = -Infinity;
      pendingTomasVoice = false;
      tomasVoiceQueue = 0;
      tomasVoicePlaying = false;
      for (const timer of tomasVoiceTimers) window.clearTimeout(timer);
      tomasVoiceTimers.clear();
      lastFrame = performance.now();

      canvas.classList.remove('is-aiming');
      helpText.textContent = 'Podrž figurku, posuň ji doleva nebo doprava a puštěním ji shoď.';
      gameOverOverlay.classList.remove('is-visible');
      gameOverOverlay.setAttribute('aria-hidden', 'true');
      comboBurst.classList.remove('is-visible');
      if (engine) engine.timing.timeScale = 1;
      resetPullRefreshIndicator(true);
      if (comboCameo) comboCameo.classList.remove('is-visible', 'is-left', 'is-right');
      unlockToast.classList.remove('is-visible');
      window.clearTimeout(levelUnlockTimer);
      if (levelUnlockSplash) {
        levelUnlockSplash.classList.remove('is-visible');
        levelUnlockSplash.setAttribute('aria-hidden', 'true');
      }
      goldToast.classList.remove('is-visible');

      if (tomasVoice) {
        tomasVoice.pause();
        tomasVoice.currentTime = 0;
      }

      createWalls();
      bindCollisions();
      renderCollection();
      updateStats();
      animationFrame = requestAnimationFrame(frame);
    }

    function clampDropX(levelIndex, value) {
      const half = LEVELS[levelIndex].hitWidth / 2;
      const innerLeft = GAME.sideInset + GAME.wall;
      const innerRight = GAME.width - GAME.sideInset - GAME.wall;
      return clamp(value, innerLeft + half + 4, innerRight - half - 4);
    }

    function dropCurrent() {
      if (!canDrop || isGameOver) return;
      canDrop = false;

      const dropped = currentDrop;
      const x = clampDropX(dropped.level, pointerX);
      const piece = createPiece(dropped.level, x, GAME.dropY, { gold: dropped.gold });
      Composite.add(engine.world, piece);

      if (dropped.gold) showGoldToast();

      currentDrop = nextDrop;
      nextDrop = randomDrop();
      updateStats();

      window.setTimeout(() => {
        if (!isGameOver) canDrop = true;
      }, GAME.dropCooldownMs);
    }

    function updateStats() {
      scoreValue.textContent = String(score);
      bestValue.textContent = String(bestScore);
      mergeValue.textContent = String(mergeCount);
      highestValue.textContent = LEVELS[highestLevel].name;
      nextValue.textContent = `${LEVELS[nextDrop.level].name}${nextDrop.gold ? ' ✦' : ''}`;
      unlockedCounter.textContent = `${unlockedLevels} / ${LEVELS.length}`;
    }

    function renderCollection(previousUnlocked = unlockedLevels) {
      collection.innerHTML = '';
      LEVELS.forEach((level, index) => {
        const unlocked = index < unlockedLevels;
        const item = document.createElement('article');
        item.className = `collection-item${unlocked ? '' : ' is-locked'}${index >= previousUnlocked && unlocked ? ' is-new' : ''}`;

        const image = document.createElement('img');
        image.src = level.file;
        image.alt = unlocked ? level.name : `Zamčená postava, level ${index + 1}`;

        const name = document.createElement('span');
        name.className = 'collection-name';
        name.textContent = unlocked ? level.name : 'Zamčeno';

        const levelText = document.createElement('span');
        levelText.className = 'collection-level';
        levelText.textContent = `Level ${index + 1}`;

        item.append(image, name, levelText);

        if (!unlocked) {
          const lock = document.createElement('span');
          lock.className = 'lock-mark';
          lock.textContent = '🔒';
          lock.setAttribute('aria-hidden', 'true');
          item.append(lock);
        }

        collection.append(item);
      });
    }

    function checkGameOver(now) {
      if (isGameOver || comboStopActive) return;
      const bodies = Composite.allBodies(engine.world)
        .filter(body => body.label === 'piece' && body.game && !body.game.merging);

      for (const body of bodies) {
        const aboveLine = body.bounds.min.y < GAME.dangerY;
        const oldEnough = now - body.game.bornAt > GAME.overflowSettleMs;
        const settled = body.speed < 2.0;

        if (aboveLine && oldEnough && settled) {
          body.game.overflowSince ??= now;
          if (now - body.game.overflowSince > GAME.overflowHoldMs) {
            finishGame();
            return;
          }
        } else {
          body.game.overflowSince = null;
        }
      }
    }

    function finishGame() {
      isGameOver = true;
      canDrop = false;
      isAiming = false;
      activePointerId = null;
      canvas.classList.remove('is-aiming');
      gameOverSummary.textContent = `Skóre ${score} · ${mergeCount} spojení · nejvyšší postava ${LEVELS[highestLevel].name}`;
      gameOverOverlay.classList.add('is-visible');
      gameOverOverlay.setAttribute('aria-hidden', 'false');
    }

    function parseColor(value) {
      const trimmed = value.trim();
      if (trimmed.startsWith('#')) {
        const hex = trimmed.slice(1);
        if (hex.length === 3) {
          return [
            parseInt(hex[0] + hex[0], 16),
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
            1
          ];
        }
        if (hex.length >= 6) {
          return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
            1
          ];
        }
      }
      const match = trimmed.match(/rgba?\(([^)]+)\)/i);
      if (match) {
        const values = match[1].split(',').map(Number);
        return [values[0], values[1], values[2], values.length > 3 ? values[3] : 1];
      }
      return [255, 255, 255, 1];
    }

    function rgba(values) {
      return `rgba(${Math.round(values[0])}, ${Math.round(values[1])}, ${Math.round(values[2])}, ${values[3]})`;
    }

    function mixColors(from, to, t) {
      return rgba(from.map((value, index) => value + (to[index] - value) * t));
    }

    function readPalette() {
      const styles = getComputedStyle(document.documentElement);
      const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
      return {
        top: parseColor(read('--canvas-top', '#fbf7f0')),
        bottom: parseColor(read('--canvas-bottom', '#ead9c1')),
        container: parseColor(read('--container-line', '#94795d')),
        danger: parseColor(read('--danger-line', '#b44f50')),
        label: parseColor(read('--canvas-label', '#796a5b')),
        guide: parseColor(read('--guide-line', '#c87b42')),
        shadow: parseColor(read('--piece-shadow', 'rgba(59,35,15,.20)')),
        gold: parseColor(read('--gold', '#f5c84b')),
        goldDeep: parseColor(read('--gold-deep', '#c98a16'))
      };
    }

    function clonePalette(palette) {
      const result = {};
      for (const [key, value] of Object.entries(palette)) result[key] = [...value];
      return result;
    }

    function currentPalette(now) {
      if (!canvasPalette) canvasPalette = readPalette();
      if (!paletteTransition) return canvasPalette;
      const t = clamp((now - paletteTransition.start) / paletteTransition.duration, 0, 1);
      const eased = easeOutCubic(t);
      const mixed = {};
      for (const key of Object.keys(paletteTransition.to)) {
        mixed[key] = parseColor(mixColors(paletteTransition.from[key], paletteTransition.to[key], eased));
      }
      if (t >= 1) {
        canvasPalette = clonePalette(paletteTransition.to);
        paletteTransition = null;
        return canvasPalette;
      }
      return mixed;
    }

    function beginPaletteTransition() {
      const now = performance.now();
      const from = clonePalette(currentPalette(now));
      window.setTimeout(() => {
        paletteTransition = {
          from,
          to: readPalette(),
          start: performance.now(),
          duration: 1500
        };
      }, 30);
    }

    window.addEventListener('pratelsky-theme-change', beginPaletteTransition);

    function drawBackground(now, palette) {
      ctx.clearRect(0, 0, GAME.width, GAME.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME.height);
      gradient.addColorStop(0, rgba(palette.top));
      gradient.addColorStop(1, rgba(palette.bottom));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME.width, GAME.height);

      const isDark = document.documentElement.dataset.theme === 'dark';
      ctx.save();
      if (isDark) {
        const time = now / 1000;
        for (let index = 0; index < 22; index += 1) {
          const px = 24 + ((index * 73) % 372);
          const py = 20 + ((index * 47) % 118);
          const pulse = .22 + .22 * Math.sin(time * 1.2 + index);
          ctx.fillStyle = `rgba(235,242,255,${pulse})`;
          ctx.beginPath();
          ctx.arc(px, py, index % 4 === 0 ? 1.4 : .8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const glow = ctx.createRadialGradient(330, 18, 0, 330, 18, 130);
        glow.addColorStop(0, 'rgba(255,245,207,.38)');
        glow.addColorStop(1, 'rgba(255,245,207,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(180, 0, 240, 170);
      }
      ctx.restore();
    }

    function drawContainer(palette) {
      const innerLeft = GAME.sideInset + GAME.wall;
      const innerRight = GAME.width - GAME.sideInset - GAME.wall;

      ctx.save();
      ctx.strokeStyle = rgba(palette.container);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(innerLeft, GAME.dangerY - 14);
      ctx.lineTo(innerLeft, GAME.floorY);
      ctx.lineTo(innerRight, GAME.floorY);
      ctx.lineTo(innerRight, GAME.dangerY - 14);
      ctx.stroke();

      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = rgba(palette.danger);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(innerLeft + 9, GAME.dangerY);
      ctx.lineTo(innerRight - 9, GAME.dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = rgba(palette.label);
      ctx.font = '700 11px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('hranice zaplnění', innerLeft + 11, GAME.dangerY - 9);
      ctx.restore();
    }

    function fitImage(image, maxWidth, maxHeight) {
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      return { width: image.naturalWidth * scale, height: image.naturalHeight * scale };
    }

    function drawGoldAura(level, now, palette, alpha = 1) {
      const pulse = 1 + Math.sin(now / 165) * .045;
      const radiusX = level.visualWidth * .66 * pulse;
      const radiusY = level.visualHeight * .61 * pulse;
      ctx.save();
      ctx.globalAlpha *= alpha;
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.max(radiusX, radiusY));
      glow.addColorStop(0, 'rgba(255,246,165,.08)');
      glow.addColorStop(.55, mixColors(palette.gold, [255,255,255,0], .45));
      glow.addColorStop(1, 'rgba(255,201,55,0)');
      ctx.scale(1, radiusY / radiusX);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha *= .78 * alpha;
      ctx.strokeStyle = rgba(palette.gold);
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX * .86, radiusY * .86, now / 1600, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      for (let index = 0; index < 5; index += 1) {
        const angle = now / 620 + index * Math.PI * 2 / 5;
        const sx = Math.cos(angle) * radiusX * .78;
        const sy = Math.sin(angle) * radiusY * .78;
        ctx.fillStyle = index % 2 ? rgba(palette.goldDeep) : rgba(palette.gold);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.6 + Math.sin(now / 170 + index) * .5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawPieceVisual(levelIndex, x, y, angle, scale, alpha, goldStrength, now, palette) {
      const level = LEVELS[levelIndex];
      const image = images[levelIndex];
      if (!image) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      const auraStrength = typeof goldStrength === 'number' ? clamp(goldStrength, 0, 1) : (goldStrength ? 1 : 0);
      if (auraStrength > 0) drawGoldAura(level, now, palette, auraStrength);

      const dimensions = fitImage(image, level.visualWidth, level.visualHeight);
      ctx.shadowColor = rgba(palette.shadow);
      ctx.shadowBlur = 10 + auraStrength * 8;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(
        image,
        -dimensions.width / 2,
        -dimensions.height / 2,
        dimensions.width,
        dimensions.height
      );
      ctx.restore();
    }

    function piecePopScale(body, now) {
      if (!body.game.popStart) return 1;
      const progress = clamp((now - body.game.popStart) / body.game.popDuration, 0, 1);
      if (progress >= 1) {
        body.game.popStart = null;
        return 1;
      }
      return clamp(.32 + easeOutBack(progress) * .68, .2, 1.16);
    }

    function drawBodies(now, palette) {
      const bodies = Composite.allBodies(engine.world)
        .filter(body => body.label === 'piece' && body.game);
      for (const body of bodies) {
        drawPieceVisual(
          body.game.level,
          body.position.x,
          body.position.y,
          body.angle,
          piecePopScale(body, now),
          body.game.merging ? .36 : 1,
          goldVisualStrength(body, now),
          now,
          palette
        );
      }
    }

    function drawMergeEffects(now, palette) {
      mergeEffects = mergeEffects.filter(effect => now - effect.start < effect.duration);
      for (const effect of mergeEffects) {
        const t = clamp((now - effect.start) / effect.duration, 0, 1);
        const collapse = easeOutCubic(clamp(t / .58, 0, 1));
        const parentScale = Math.max(0, 1 - collapse);
        const parentAlpha = Math.max(0, 1 - t * 1.7);

        for (const parent of effect.from) {
          const px = parent.x + (effect.x - parent.x) * collapse;
          const py = parent.y + (effect.y - parent.y) * collapse;
          drawPieceVisual(
            effect.sourceLevel,
            px,
            py,
            parent.angle * (1 - collapse),
            parentScale,
            parentAlpha,
            parent.gold,
            now,
            palette
          );
        }

        ctx.save();
        const ringT = clamp((t - .18) / .72, 0, 1);
        ctx.globalAlpha = (1 - ringT) * .72;
        ctx.strokeStyle = effect.gold ? rgba(palette.gold) : rgba(palette.guide);
        ctx.lineWidth = 4 * (1 - ringT) + 1;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 10 + ringT * 66, 0, Math.PI * 2);
        ctx.stroke();

        if (t > .25 && t < .82) {
          ctx.globalAlpha = 1 - Math.abs(t - .52) * 3.2;
          ctx.fillStyle = effect.gold ? rgba(palette.goldDeep) : rgba(palette.guide);
          ctx.font = '900 15px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(`+${effect.gained}`, effect.x, effect.y - 45 - t * 20);
        }
        ctx.restore();
      }
    }

    function updateAndDrawParticles(now) {
      particles = particles.filter(particle => now - particle.born < particle.life);
      for (const particle of particles) {
        const age = now - particle.born;
        const dt = Math.min((now - lastFrame) / 16.67, 2);
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += particle.gravity * dt;
        particle.vx *= .988;
        const alpha = 1 - age / particle.life;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (.55 + alpha * .45), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }


function estimateLandingY(levelIndex, x) {
  const level = LEVELS[levelIndex];
  const halfWidth = level.hitWidth / 2;
  let landingTop = GAME.floorY;
  const bodies = Composite.allBodies(engine.world)
    .filter(body => body.label === 'piece' && body.game && !body.game.merging);

  for (const body of bodies) {
    const overlapsX = body.bounds.max.x >= x - halfWidth
      && body.bounds.min.x <= x + halfWidth;
    if (!overlapsX) continue;
    const candidateTop = body.bounds.min.y;
    if (candidateTop > GAME.dropY && candidateTop < landingTop) {
      landingTop = candidateTop;
    }
  }

  return clamp(
    landingTop - level.hitHeight / 2 - 2,
    GAME.dropY + level.hitHeight * .62,
    GAME.floorY - level.hitHeight / 2
  );
}

function drawLandingPreview(now, palette) {
  if (isGameOver || !currentDrop || comboStopActive) return;
  const level = LEVELS[currentDrop.level];
  const x = clampDropX(currentDrop.level, pointerX);
  const y = estimateLandingY(currentDrop.level, x);

  ctx.save();
  ctx.globalAlpha = isAiming ? .58 : .34;
  ctx.strokeStyle = rgba(palette.guide);
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.ellipse(
    x,
    y + level.hitHeight * .43,
    Math.max(13, level.hitWidth * .34),
    Math.max(4, level.hitHeight * .045),
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  drawPieceVisual(
    currentDrop.level,
    x,
    y,
    0,
    .96,
    isAiming ? .19 : .10,
    0,
    now,
    palette
  );
}

    function drawGuide(now, palette) {
      if (isGameOver || !currentDrop) return;
      const level = LEVELS[currentDrop.level];
      const x = clampDropX(currentDrop.level, pointerX);

      ctx.save();
      ctx.strokeStyle = rgba(palette.guide);
      ctx.globalAlpha = isAiming ? .58 : .24;
      ctx.lineWidth = isAiming ? 2 : 1.25;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(x, GAME.dropY + level.hitHeight / 2 + 5);
      ctx.lineTo(x, GAME.dangerY - 9);
      ctx.stroke();
      ctx.restore();

      drawPieceVisual(
        currentDrop.level,
        x,
        GAME.dropY,
        0,
        isAiming ? 1 : .94,
        isAiming ? .98 : canDrop ? .74 : .34,
        currentDrop.gold,
        now,
        palette
      );
    }

    function frame(now) {
      const delta = Math.min(now - lastFrame, 30);
      const palette = currentPalette(now);

      if (!isGameOver) {
        Engine.update(engine, delta);
        tuneMotion();
        findNearbyMerges();
        processMerges(now);
        updateGoldLifecycle(now);
        checkGameOver(now);
        if (comboCount > 0 && now - lastMergeAt > GAME.comboWindowMs) comboCount = 0;
      }

      drawBackground(now, palette);
      drawContainer(palette);
      drawLandingPreview(now, palette);
      drawBodies(now, palette);
      drawMergeEffects(now, palette);
      updateAndDrawParticles(now);
      drawGuide(now, palette);

      lastFrame = now;
      animationFrame = requestAnimationFrame(frame);
    }

    function gameX(event) {
      const rect = canvas.getBoundingClientRect();
      return (event.clientX - rect.left) * GAME.width / rect.width;
    }

    function ensureAudioContext() {
      if (!soundEnabled) return null;
      if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioContext = new AudioContextClass();
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      if (pendingTomasVoice) {
        pendingTomasVoice = false;
        window.setTimeout(drainTomasVoiceQueue, 0);
      }
      return audioContext;
    }

    function playMergeSound(sourceLevel, combo, gold) {
      if (!soundEnabled) return;
      const context = ensureAudioContext();
      if (!context) return;

      const level = LEVELS[sourceLevel];
      const now = context.currentTime;
      const master = context.createGain();
      const oscillator = context.createOscillator();
      const harmonic = context.createOscillator();
      const harmonicGain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = level.wave;
      oscillator.frequency.setValueAtTime(level.tone * (1 + Math.min(combo - 1, 5) * .035), now);
      oscillator.frequency.exponentialRampToValueAtTime(level.tone * 1.13, now + .16);

      harmonic.type = sourceLevel % 2 ? 'sine' : 'triangle';
      harmonic.frequency.setValueAtTime(level.tone * (gold ? 2.02 : 1.5), now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800 + sourceLevel * 260, now);

      master.gain.setValueAtTime(.0001, now);
      master.gain.exponentialRampToValueAtTime(gold ? .17 : .12, now + .018);
      master.gain.exponentialRampToValueAtTime(.0001, now + .28);

      harmonicGain.gain.setValueAtTime(.0001, now);
      harmonicGain.gain.exponentialRampToValueAtTime(gold ? .075 : .038, now + .025);
      harmonicGain.gain.exponentialRampToValueAtTime(.0001, now + .21);

      oscillator.connect(filter);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(filter);
      filter.connect(master);
      master.connect(context.destination);

      oscillator.start(now);
      harmonic.start(now);
      oscillator.stop(now + .30);
      harmonic.stop(now + .24);
    }

    function scheduleTomasVoice(delay = 370) {
      if (!soundEnabled || !tomasVoice) return;
      const timer = window.setTimeout(() => {
        tomasVoiceTimers.delete(timer);
        tomasVoiceQueue += 1;
        drainTomasVoiceQueue();
      }, delay);
      tomasVoiceTimers.add(timer);
    }

    function drainTomasVoiceQueue() {
      if (!soundEnabled || !tomasVoice || tomasVoicePlaying || tomasVoiceQueue <= 0) return;
      ensureAudioContext();

      tomasVoiceQueue -= 1;
      tomasVoicePlaying = true;
      tomasVoice.currentTime = 0;
      const promise = tomasVoice.play();

      if (promise && typeof promise.catch === 'function') {
        promise
          .then(() => { pendingTomasVoice = false; })
          .catch(() => {
            tomasVoicePlaying = false;
            tomasVoiceQueue += 1;
            pendingTomasVoice = true;
          });
      }
    }

    if (tomasVoice) {
      tomasVoice.addEventListener('ended', () => {
        tomasVoicePlaying = false;
        window.setTimeout(drainTomasVoiceQueue, 120);
      });
      tomasVoice.addEventListener('error', () => {
        tomasVoicePlaying = false;
      });
    }

    function setSoundEnabled(enabled) {
      soundEnabled = enabled;
      soundToggle.setAttribute('aria-pressed', String(enabled));
      soundToggle.title = enabled ? 'Vypnout zvuky' : 'Zapnout zvuky';
      soundIcon.textContent = enabled ? '🔊' : '🔇';
      soundLabel.textContent = enabled ? 'Zvuk zapnutý' : 'Zvuk vypnutý';
      if (!enabled && tomasVoice) {
        tomasVoice.pause();
        tomasVoice.currentTime = 0;
        tomasVoiceQueue = 0;
        tomasVoicePlaying = false;
        pendingTomasVoice = false;
        for (const timer of tomasVoiceTimers) window.clearTimeout(timer);
        tomasVoiceTimers.clear();
      }
      if (enabled) ensureAudioContext();
    }

    canvas.addEventListener('pointerdown', event => {
      if (!canDrop || isGameOver || isAiming) return;
      event.preventDefault();
      ensureAudioContext();
      activePointerId = event.pointerId;
      isAiming = true;
      pointerX = gameX(event);
      canvas.setPointerCapture(activePointerId);
      canvas.classList.add('is-aiming');
      helpText.textContent = 'Posuň figurku a puštěním ji shoď.';
    });

    canvas.addEventListener('pointermove', event => {
      if (!isAiming || event.pointerId !== activePointerId) return;
      event.preventDefault();
      pointerX = gameX(event);
    });

    function finishPointer(event) {
      if (!isAiming || event.pointerId !== activePointerId) return;
      event.preventDefault();
      pointerX = gameX(event);
      if (canvas.hasPointerCapture(activePointerId)) canvas.releasePointerCapture(activePointerId);
      isAiming = false;
      activePointerId = null;
      canvas.classList.remove('is-aiming');
      helpText.textContent = 'Podrž figurku, posuň ji doleva nebo doprava a puštěním ji shoď.';
      dropCurrent();
    }

    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);

    soundToggle.addEventListener('click', () => setSoundEnabled(!soundEnabled));
    document.getElementById('restartButton').addEventListener('click', () => {
      ensureAudioContext();
      restartWithFakeLoading();
    });
    document.getElementById('restartOverlayButton').addEventListener('click', () => {
      ensureAudioContext();
      restartWithFakeLoading();
    });

document.addEventListener('touchstart', beginPullRefresh, { passive: true });
document.addEventListener('touchmove', movePullRefresh, { passive: false });
document.addEventListener('touchend', endPullRefresh, { passive: true });
document.addEventListener('touchcancel', () => resetPullRefreshIndicator(), { passive: true });
    window.addEventListener('resize', setupCanvas);

    setupCanvas();
    canvasPalette = readPalette();
    bestValue.textContent = String(bestScore);

    showFakeLoading();

    preloadAssets()
      .then(async () => {
        const startedAt = performance.now();
        loadingState.classList.add('is-hidden');
        window.setTimeout(() => loadingState.remove(), 320);
        const elapsed = performance.now() - startedAt;
        await wait(Math.max(0, FAKE_LOADING_MIN_MS - elapsed));
        resetGame();
        await wait(180);
        hideFakeLoading();
      })
      .catch(error => {
        console.error(error);
      });
  }

  waitForMatter();
})();
