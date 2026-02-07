/**
 * Cupid's Delivery Quest - 2 levels: (1) Falling Roses, (2) Heart Catch
 * Logical size: 400x300; canvas has min height so it's always visible.
 */

(function () {
  'use strict';

  const LOGICAL_WIDTH = 400;
  const LOGICAL_HEIGHT = 300;

  const JACKPOT_IMAGE_SRC = 'person_img.png';
  const LEVEL_CONFIG = [
    {
      name: 'Falling Roses',
      gameType: 'falling_roses',
      count: 8,
      durationMs: 25000,
      obstacleCount: 4,
      obstacleSpeed: 0.8,
    },
    {
      name: 'Chocolate Catch',
      gameType: 'chocolate_catch',
      count: 5,
      durationMs: 28000,
      obstacleCount: 0,
      obstacleSpeed: 0,
    },
    {
      name: "Cupid's Arrow",
      gameType: 'cupid_arrow',
      durationMs: 60000,
      barrierHitsTotal: 6,
      arrowSpeed: 14,
      arrowHeartsRequired: 8,
    },
  ];

  let canvas, ctx;
  let scale = 1;
  let levelIndex = 0;
  let config;
  let player = { x: 0, y: 0, w: 24, h: 24, vx: 0, vy: 0, speed: 3 };
  let collectibles = [];
  let obstacles = [];
  let collected = 0;
  let hearts = 3;
  let invincibleUntil = 0;
  let startTime = 0;
  let paused = false;
  let gameOver = false;
  let won = false;
  let keys = {};
  let touchDir = { x: 0, y: 0 };
  let animId = null;
  let spawnAccum = 0;

  // Level 3 (Cupid's Arrow) state
  let arrows = [];
  let barriers = [];
  let aimAngle = -Math.PI / 2;
  let mouseX = LOGICAL_WIDTH / 2;
  let mouseY = LOGICAL_HEIGHT - 40;
  let jackpotImg = null;
  let barriersBroken = 0;

  let onWin = function () {};
  let onLose = function () {};
  let getSoundEnabled = function () { return true; };

  function resize() {
    if (!canvas || !canvas.parentElement) return;
    const parent = canvas.parentElement;
    const w = parent.clientWidth || LOGICAL_WIDTH;
    const h = Math.max(280, parent.clientHeight || LOGICAL_HEIGHT);
    const scaleX = w / LOGICAL_WIDTH;
    const scaleY = h / LOGICAL_HEIGHT;
    scale = Math.min(scaleX, scaleY, 2);
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
    canvas.style.width = LOGICAL_WIDTH * scale + 'px';
    canvas.style.height = LOGICAL_HEIGHT * scale + 'px';
  }

  // ----- Level 1: Falling roses (petals fall from top, avoid clouds) -----
  function spawnFallingPetals() {
    collectibles = [];
    for (let i = 0; i < config.count; i++) {
      collectibles.push({
        x: 30 + Math.random() * (LOGICAL_WIDTH - 60),
        y: -20 - Math.random() * 200,
        vy: 0.9 + Math.random() * 0.6,
        type: 'petal',
        radius: 10,
      });
    }
  }

  function spawnClouds() {
    obstacles = [];
    const n = config.obstacleCount;
    const speed = config.obstacleSpeed;
    for (let i = 0; i < n; i++) {
      obstacles.push({
        x: Math.random() * (LOGICAL_WIDTH - 50),
        y: Math.random() * (LOGICAL_HEIGHT - 40),
        w: 44,
        h: 28,
        vx: (Math.random() - 0.5) * speed * 1.2,
        vy: (Math.random() - 0.5) * speed,
        type: 'cloud',
      });
    }
  }

  // ----- Level 2: Chocolate Catch (Cupid at bottom, chocolates fall) -----
  function spawnFallingChocolates() {
    collectibles = [];
    for (let i = 0; i < config.count; i++) {
      collectibles.push({
        x: 30 + Math.random() * (LOGICAL_WIDTH - 60),
        y: -30 - Math.random() * 300,
        vy: 1.2 + Math.random() * 0.8,
        type: 'chocolate',
        radius: 12,
      });
    }
  }

  function spawnRain() {
    obstacles = [];
    for (let i = 0; i < 5; i++) {
      obstacles.push({
        x: Math.random() * (LOGICAL_WIDTH - 12),
        y: -20 - Math.random() * 150,
        w: 8,
        h: 20,
        vy: 2 + Math.random() * 1.2,
        type: 'rain',
      });
    }
  }

  // ----- Level 3: Cupid's Arrow (aim & shoot, break barriers, hit jackpot) -----
  const JACKPOT_CX = LOGICAL_WIDTH / 2;
  const JACKPOT_CY = 110;
  const JACKPOT_SIZE = 44;

  function spawnArrowHearts() {
    collectibles = [];
    const n = 11;
    for (let i = 0; i < n; i++) {
      collectibles.push({
        x: 30 + Math.random() * (LOGICAL_WIDTH - 60),
        y: -30 - Math.random() * 280,
        vy: 1.0 + Math.random() * 0.6,
        type: 'arrow_heart',
        radius: 14,
      });
    }
  }

  function spawnBrokenHearts() {
    obstacles = [];
    for (let i = 0; i < 4; i++) {
      obstacles.push({
        x: 40 + Math.random() * (LOGICAL_WIDTH - 80),
        y: -30 - Math.random() * 180,
        vy: 0.8 + Math.random() * 0.5,
        w: 28,
        h: 28,
        type: 'arrow_broken',
      });
    }
  }

  function spawnBarriers() {
    barriers = [];
    const totalHits = config.barrierHitsTotal || 6;
    const hitsPerBarrier = 2;
    const n = Math.ceil(totalHits / hitsPerBarrier);
    const bw = 50;
    const bh = 28;
    const cx = JACKPOT_CX;
    const cy = JACKPOT_CY;
    const r = 55;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      barriers.push({
        x: cx + Math.cos(a) * r - bw / 2,
        y: cy + Math.sin(a) * r - bh / 2,
        w: bw,
        h: bh,
        hitsLeft: hitsPerBarrier,
      });
    }
  }

  function loadJackpotImage() {
    if (jackpotImg) return;
    jackpotImg = new Image();
    jackpotImg.src = JACKPOT_IMAGE_SRC;
  }

  function shootArrow() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const speed = config.arrowSpeed || 14;
    arrows.push({
      x: cx,
      y: cy,
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
    });
    playBeep(600, 0.06);
  }

  function updateCupidArrow(dt, now) {
    const cupidCx = player.x + player.w / 2;
    const cupidCy = player.y + player.h / 2;
    aimAngle = Math.atan2(mouseY - cupidCy, mouseX - cupidCx);
    const heartsRequired = config.arrowHeartsRequired || 8;

    collectibles.forEach(function (c) {
      c.y += c.vy;
    });
    const heartSpawn = [];
    collectibles = collectibles.filter(function (c) {
      if (c.y > LOGICAL_HEIGHT + 30) {
        heartSpawn.push({
          x: 30 + Math.random() * (LOGICAL_WIDTH - 60),
          y: -30 - Math.random() * 80,
          vy: 1.0 + Math.random() * 0.6,
          type: 'arrow_heart',
          radius: 14,
        });
        return false;
      }
      return true;
    });
    heartSpawn.forEach(function (c) { collectibles.push(c); });

    obstacles.forEach(function (o) {
      o.y += o.vy;
      if (o.y > LOGICAL_HEIGHT + 30) {
        o.y = -30 - Math.random() * 60;
        o.x = 40 + Math.random() * (LOGICAL_WIDTH - 80);
      }
    });

    arrows = arrows.filter(function (arr) {
      arr.x += arr.vx;
      arr.y += arr.vy;
      if (arr.x < -20 || arr.x > LOGICAL_WIDTH + 20 || arr.y < -20 || arr.y > LOGICAL_HEIGHT + 20) return false;

      for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        if (Math.hypot(arr.x - c.x, arr.y - c.y) < c.radius) {
          collected++;
          playBeep(440, 0.08);
          collectibles.splice(i, 1);
          collectibles.push({
            x: 30 + Math.random() * (LOGICAL_WIDTH - 60),
            y: -30 - Math.random() * 100,
            vy: 1.0 + Math.random() * 0.6,
            type: 'arrow_heart',
            radius: 14,
          });
          return false;
        }
      }
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        if (arr.x >= o.x && arr.x <= o.x + o.w && arr.y >= o.y && arr.y <= o.y + o.h) {
          hearts--;
          playBeep(200, 0.2);
          obstacles.splice(i, 1);
          if (hearts <= 0) {
            gameOver = true;
            onLose();
          }
          return false;
        }
      }
      for (let i = barriers.length - 1; i >= 0; i--) {
        const b = barriers[i];
        if (arr.x > b.x && arr.x < b.x + b.w && arr.y > b.y && arr.y < b.y + b.h) {
          b.hitsLeft--;
          if (b.hitsLeft <= 0) {
            barriers.splice(i, 1);
            barriersBroken++;
            playBeep(350, 0.1);
          }
          return false;
        }
      }
      const jx = JACKPOT_CX - JACKPOT_SIZE / 2;
      const jy = JACKPOT_CY - JACKPOT_SIZE / 2;
      if (barriers.length === 0 && collected >= heartsRequired && arr.x > jx && arr.x < jx + JACKPOT_SIZE && arr.y > jy && arr.y < jy + JACKPOT_SIZE) {
        won = true;
        playBeep(523, 0.15);
        playBeep(659, 0.15);
        playBeep(784, 0.2);
        onWin();
        return false;
      }
      return true;
    });
  }

  const EMOJI = {
    cupid: '\u{1F498}',
    babyAngel: '\u{1F47C}',
    rose: '\u{1F339}',
    chocolate: '\u{1F36B}',
    heart: '\u{1F496}',
    brokenHeart: '\u{1F494}',
    cloud: '\u2601\uFE0F',
    droplet: '\u{1F4A7}',
    bowArrow: '\u{1F3F9}',
  };

  function drawEmoji(emoji, x, y, sizePx) {
    ctx.save();
    ctx.font = sizePx + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
    ctx.restore();
  }

  function drawEmojiRotated(emoji, x, y, sizePx, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = sizePx + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }

  function drawCupid() {
    const x = player.x + player.w / 2;
    const y = player.y + player.h / 2;
    ctx.save();
    const blink = invincibleUntil > Date.now() && Math.floor(Date.now() / 80) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.5;
    const playerEmoji = config && config.gameType === 'falling_roses' ? EMOJI.babyAngel : EMOJI.cupid;
    drawEmoji(playerEmoji, x, y, 28);
    ctx.restore();
  }

  function drawPetal(c) {
    drawEmoji(EMOJI.rose, c.x, c.y, 24);
  }

  function drawHeart(c) {
    drawEmoji(EMOJI.chocolate, c.x, c.y, 26);
  }

  function drawCloud(o) {
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    drawEmoji(EMOJI.cloud, cx, cy, 32);
  }

  function drawRain(o) {
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    drawEmoji(EMOJI.droplet, cx, cy, 18);
  }

  function hitTestPlayerRect(rx, ry, rw, rh) {
    const pl = player.x;
    const pr = player.x + player.w;
    const pt = player.y;
    const pb = player.y + player.h;
    return pr > rx && pl < rx + rw && pb > ry && pt < ry + rh;
  }

  function hitTestPlayerCircle(px, py, cx, cy, cr) {
    return Math.hypot(px - cx, py - cy) < player.w / 2 + cr;
  }

  function playBeep(freq, duration) {
    if (!getSoundEnabled()) return;
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + duration);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration);
    } catch (_) {}
  }

  function updateFallingRoses(dt, now) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;

    collectibles.forEach(function (c) {
      c.y += c.vy;
    });
    const toSpawn = [];
    collectibles = collectibles.filter(function (c) {
      if (c.y > LOGICAL_HEIGHT + 20) {
        toSpawn.push({
          x: 30 + Math.random() * (LOGICAL_WIDTH - 60),
          y: -20 - Math.random() * 80,
          vy: 0.9 + Math.random() * 0.6,
          type: 'petal',
          radius: 10,
        });
        return false;
      }
      if (hitTestPlayerCircle(px, py, c.x, c.y, c.radius)) {
        collected++;
        playBeep(440, 0.08);
        return false;
      }
      return true;
    });
    toSpawn.forEach(function (c) { collectibles.push(c); });

    obstacles.forEach(function (o) {
      o.x += o.vx;
      o.y += o.vy;
      if (o.x < -60 || o.x > LOGICAL_WIDTH + 60) o.vx *= -1;
      if (o.y < -30 || o.y > LOGICAL_HEIGHT + 30) o.vy *= -1;
    });
    if (invincibleUntil <= now) {
      obstacles.forEach(function (o) {
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        if (Math.abs(px - cx) < (player.w / 2 + o.w / 2) && Math.abs(py - cy) < (player.h / 2 + o.h / 2)) {
          hearts--;
          invincibleUntil = now + 1000;
          playBeep(200, 0.2);
        }
      });
      if (hearts <= 0) {
        gameOver = true;
        onLose();
      }
    }
  }

  function updateChocolateCatch(dt, now) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;

    collectibles.forEach(function (c) {
      c.y += c.vy;
    });
    const toSpawn = [];
    collectibles = collectibles.filter(function (c) {
      if (c.y > LOGICAL_HEIGHT + 20) {
        toSpawn.push({
          x: 30 + Math.random() * (LOGICAL_WIDTH - 60),
          y: -30 - Math.random() * 100,
          vy: 1.2 + Math.random() * 0.8,
          type: 'chocolate',
          radius: 12,
        });
        return false;
      }
      if (hitTestPlayerCircle(px, py, c.x, c.y, c.radius)) {
        collected++;
        playBeep(440, 0.08);
        return false;
      }
      return true;
    });
    toSpawn.forEach(function (c) { collectibles.push(c); });

    obstacles.forEach(function (o) {
      o.y += o.vy;
      if (o.y > LOGICAL_HEIGHT + 30) {
        o.y = -30;
        o.x = Math.random() * (LOGICAL_WIDTH - o.w);
      }
    });
    if (invincibleUntil <= now) {
      obstacles.forEach(function (o) {
        if (hitTestPlayerRect(o.x, o.y, o.w, o.h)) {
          hearts--;
          invincibleUntil = now + 1000;
          playBeep(200, 0.2);
        }
      });
      if (hearts <= 0) {
        gameOver = true;
        onLose();
      }
    }
  }

  function update(dt) {
    if (paused || gameOver || won) return;

    const now = Date.now();
    const elapsed = now - startTime;

    if (config.gameType === 'cupid_arrow') {
      if (elapsed >= config.durationMs) {
        gameOver = true;
        onLose();
        return;
      }
      updateCupidArrow(dt, now);
      return;
    }

    if (config.count && collected >= config.count) {
      won = true;
      playBeep(523, 0.15);
      playBeep(659, 0.15);
      playBeep(784, 0.2);
      onWin();
      return;
    }
    if (elapsed >= config.durationMs) {
      gameOver = true;
      onLose();
      return;
    }

    if (config.gameType === 'falling_roses') {
      let dx = 0, dy = 0;
      if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
      if (touchDir.x !== 0 || touchDir.y !== 0) { dx += touchDir.x; dy += touchDir.y; }
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        player.vx = (dx / len) * player.speed;
        player.vy = (dy / len) * player.speed;
      } else {
        player.vx *= 0.85;
        player.vy *= 0.85;
      }
      player.x += player.vx;
      player.y += player.vy;
      player.x = Math.max(0, Math.min(LOGICAL_WIDTH - player.w, player.x));
      player.y = Math.max(0, Math.min(LOGICAL_HEIGHT - player.h, player.y));
      updateFallingRoses(dt, now);
    } else {
      let dx = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
      if (touchDir.x !== 0) dx += touchDir.x;
      player.vx = dx !== 0 ? dx * player.speed : player.vx * 0.85;
      player.x += player.vx;
      player.x = Math.max(0, Math.min(LOGICAL_WIDTH - player.w, player.x));
      player.y = LOGICAL_HEIGHT - player.h - 10;
      player.vy = 0;
      updateChocolateCatch(dt, now);
    }
  }

  function drawJackpot() {
    const jx = JACKPOT_CX - JACKPOT_SIZE / 2;
    const jy = JACKPOT_CY - JACKPOT_SIZE / 2;
    if (jackpotImg && jackpotImg.complete && jackpotImg.naturalWidth) {
      ctx.drawImage(jackpotImg, jx, jy, JACKPOT_SIZE, JACKPOT_SIZE);
    } else {
      ctx.fillStyle = 'rgba(255, 200, 220, 0.9)';
      ctx.beginPath();
      ctx.arc(JACKPOT_CX, JACKPOT_CY, JACKPOT_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c2185b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♥', JACKPOT_CX, JACKPOT_CY);
    }
  }

  function draw() {
    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    if (config.gameType === 'cupid_arrow') {
      collectibles.forEach(function (c) {
        drawEmoji(EMOJI.heart, c.x, c.y, 26);
      });
      obstacles.forEach(function (o) {
        drawEmoji(EMOJI.brokenHeart, o.x + o.w / 2, o.y + o.h / 2, 24);
      });
      drawJackpot();
      barriers.forEach(function (b) {
        ctx.fillStyle = 'rgba(180, 120, 80, 0.85)';
        ctx.strokeStyle = 'rgba(120, 80, 50, 0.9)';
        ctx.lineWidth = 2;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      });
      arrows.forEach(function (arr) {
        const angle = Math.atan2(arr.vy, arr.vx);
        drawEmojiRotated(EMOJI.bowArrow, arr.x, arr.y, 22, angle);
      });
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      const aimLen = 35;
      ctx.strokeStyle = '#c2185b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(aimAngle) * aimLen, cy + Math.sin(aimAngle) * aimLen);
      ctx.stroke();
      drawCupid();
      return;
    }

    collectibles.forEach(function (c) {
      if (c.type === 'petal') drawPetal(c);
      else drawHeart(c);
    });
    obstacles.forEach(function (o) {
      if (o.type === 'cloud') drawCloud(o);
      else if (o.type === 'rain') drawRain(o);
    });
    drawCupid();
  }

  function tick(timestamp) {
    const prev = tick.last || timestamp;
    const dt = Math.min((timestamp - prev) / 1000, 0.1);
    tick.last = timestamp;
    update(dt);
    draw();
    if (!gameOver && !won) animId = requestAnimationFrame(tick);
  }

  function run() {
    config = LEVEL_CONFIG[levelIndex];
    if (!config) return;

    resize();

    if (config.gameType === 'falling_roses') {
      player.x = LOGICAL_WIDTH / 2 - player.w / 2;
      player.y = LOGICAL_HEIGHT / 2 - player.h / 2;
      spawnFallingPetals();
      spawnClouds();
    } else if (config.gameType === 'chocolate_catch') {
      player.x = LOGICAL_WIDTH / 2 - player.w / 2;
      player.y = LOGICAL_HEIGHT - player.h - 10;
      spawnFallingChocolates();
      spawnRain();
    } else if (config.gameType === 'cupid_arrow') {
      player.x = LOGICAL_WIDTH / 2 - player.w / 2;
      player.y = LOGICAL_HEIGHT - player.h - 12;
      loadJackpotImage();
      spawnBarriers();
      spawnArrowHearts();
      spawnBrokenHearts();
      arrows = [];
      barriersBroken = 0;
      collected = 0;
      mouseX = LOGICAL_WIDTH / 2;
      mouseY = LOGICAL_HEIGHT - 40;
      aimAngle = -Math.PI / 2;
    }

    player.vx = 0;
    player.vy = 0;
    collected = 0;
    hearts = 3;
    invincibleUntil = 0;
    startTime = Date.now();
    gameOver = false;
    won = false;
    spawnAccum = 0;
    tick.last = 0;
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(tick);
  }

  function canvasToLogical(clientX, clientY) {
    if (!canvas) return { x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT / 2 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function init(c) {
    canvas = c;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', function (e) {
      const p = canvasToLogical(e.clientX, e.clientY);
      mouseX = p.x;
      mouseY = p.y;
    });
    canvas.addEventListener('mousedown', function (e) {
      if (config && config.gameType === 'cupid_arrow' && !paused && !gameOver && !won) {
        e.preventDefault();
        shootArrow();
      }
    });
    canvas.addEventListener('touchmove', function (e) {
      if (e.touches.length && config && config.gameType === 'cupid_arrow') {
        const p = canvasToLogical(e.touches[0].clientX, e.touches[0].clientY);
        mouseX = p.x;
        mouseY = p.y;
        e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      if (config && config.gameType === 'cupid_arrow' && !paused && !gameOver && !won) {
        e.preventDefault();
        shootArrow();
      }
    });

    function isFormFocused() {
      var el = document.activeElement;
      return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
    }
    document.addEventListener('keydown', function (e) {
      if (isFormFocused()) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].indexOf(e.code) >= 0) {
        e.preventDefault();
        keys[e.code] = true;
      }
    });
    document.addEventListener('keyup', function (e) {
      if (isFormFocused()) return;
      keys[e.code] = false;
    });

    const dpad = document.getElementById('mobile-controls');
    if (dpad) {
      dpad.querySelectorAll('.dpad-btn[data-dir]').forEach(function (btn) {
        const dir = btn.getAttribute('data-dir');
        const setDir = function (x, y) {
          touchDir.x = x;
          touchDir.y = y;
        };
        btn.addEventListener('touchstart', function (e) {
          e.preventDefault();
          if (dir === 'up') setDir(0, -1);
          else if (dir === 'down') setDir(0, 1);
          else if (dir === 'left') setDir(-1, 0);
          else if (dir === 'right') setDir(1, 0);
        });
        btn.addEventListener('touchend', function (e) {
          e.preventDefault();
          touchDir.x = 0;
          touchDir.y = 0;
        });
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          if (dir === 'up') setDir(0, -1);
          else if (dir === 'down') setDir(0, 1);
          else if (dir === 'left') setDir(-1, 0);
          else if (dir === 'right') setDir(1, 0);
        });
        btn.addEventListener('mouseup', function () {
          touchDir.x = 0;
          touchDir.y = 0;
        });
        btn.addEventListener('mouseleave', function () {
          touchDir.x = 0;
          touchDir.y = 0;
        });
      });
      const center = dpad.querySelector('.dpad-center');
      if (center) {
        center.addEventListener('touchend', function (e) { e.preventDefault(); touchDir.x = 0; touchDir.y = 0; });
        center.addEventListener('mouseup', function () { touchDir.x = 0; touchDir.y = 0; });
      }
    }
  }

  function setLevel(index) {
    levelIndex = index;
  }

  function getLevelIndex() {
    return levelIndex;
  }

  function setPaused(p) {
    paused = p;
  }

  function isPaused() {
    return paused;
  }

  function getProgress() {
    if (!config) return 0;
    const elapsed = Date.now() - startTime;
    const dur = config.durationMs || 60000;
    return Math.min(1, elapsed / dur);
  }

  function getCollected() {
    return collected;
  }

  function getRequired() {
    if (config && config.gameType === 'cupid_arrow') return config.arrowHeartsRequired || 8;
    return config ? config.count : 0;
  }

  function getBarriersLeft() {
    if (!barriers.length) return 0;
    return barriers.reduce(function (s, b) { return s + b.hitsLeft; }, 0);
  }

  function isArrowLevel() {
    return config && config.gameType === 'cupid_arrow';
  }

  function getHearts() {
    return hearts;
  }

  function setCallbacks(o) {
    onWin = o.onWin || onWin;
    onLose = o.onLose || onLose;
    getSoundEnabled = o.getSoundEnabled || getSoundEnabled;
  }

  function doResize() {
    resize();
  }

  window.CupidGame = {
    init: init,
    run: run,
    setLevel: setLevel,
    getLevelIndex: getLevelIndex,
    setPaused: setPaused,
    isPaused: isPaused,
    getProgress: getProgress,
    getCollected: getCollected,
    getRequired: getRequired,
    getHearts: getHearts,
    getBarriersLeft: getBarriersLeft,
    isArrowLevel: isArrowLevel,
    setCallbacks: setCallbacks,
    doResize: doResize,
    LEVEL_CONFIG: LEVEL_CONFIG,
  };
})();
