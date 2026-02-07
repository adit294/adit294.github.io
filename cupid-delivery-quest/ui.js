/**
 * Cupid's Delivery Quest - UI: screens, map, level complete, address mailto, receipt.
 */

(function () {
  'use strict';

  var CUPID_EMAIL = 'aditagarwal687@gmail.com';

  var CLUE_LINES = [
    'First stop… warm wishes incoming.',
    "Cupid's aim is true. A surprise is being prepared.",
    "You found the jackpot. Delivery complete! 💘",
  ];

  var STORAGE_KEYS = {
    unlockedLevel: 'cupid_unlocked_level',
    soundOn: 'cupid_sound_on',
    reducedMotion: 'cupid_reduced_motion',
  };

  var TOTAL_LEVELS = 3;
  var currentDeliveryId = '';

  function getStored(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (el) {
      el.classList.remove('active');
    });
    var el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function showModal(id, show) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function updateMapUI() {
    var unlocked = Math.min(TOTAL_LEVELS, getStored(STORAGE_KEYS.unlockedLevel, 1));
    document.querySelectorAll('.map-node').forEach(function (btn) {
      var level = parseInt(btn.getAttribute('data-level'), 10);
      btn.classList.remove('unlocked', 'locked');
      if (level <= unlocked) {
        btn.classList.add('unlocked');
        btn.disabled = false;
      } else {
        btn.classList.add('locked');
        btn.disabled = true;
      }
    });
    var progressEl = document.getElementById('map-progress');
    if (progressEl) progressEl.textContent = (unlocked - 1) + '/3 deliveries completed';
  }

  function generateDeliveryId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var part = function (len) {
      var s = '';
      for (var i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
      return s;
    };
    return 'CUPID-' + part(4) + '-' + part(4);
  }

  function runShippingAnimations(callback) {
    var strip = document.getElementById('printer-strip');
    var stamp = document.getElementById('label-stamp');
    if (strip) strip.classList.add('printing');
    setTimeout(function () {
      if (stamp) stamp.classList.add('stamped');
      setTimeout(callback || function () {}, 400);
    }, 500);
  }

  function showShippingScreen() {
    showScreen('screen-shipping');
    currentDeliveryId = generateDeliveryId();
    var idEl = document.getElementById('delivery-id-display');
    if (idEl) idEl.textContent = 'Delivery ID: ' + currentDeliveryId;
    document.getElementById('form-shipping').reset();
    var errEl = document.getElementById('err-fullAddress');
    if (errEl) errEl.textContent = '';
    var ta = document.getElementById('fullAddress');
    if (ta) ta.classList.remove('invalid');
    document.getElementById('sending-animation').classList.add('hidden');
    document.getElementById('shipping-label-card').style.display = 'block';
    runShippingAnimations();
  }

  function validateAddress() {
    var ta = document.getElementById('fullAddress');
    var errEl = document.getElementById('err-fullAddress');
    var v = ta && ta.value ? ta.value.trim() : '';
    if (!v) {
      if (ta) ta.classList.add('invalid');
      if (errEl) errEl.textContent = 'Please enter your address.';
      return false;
    }
    if (ta) ta.classList.remove('invalid');
    if (errEl) errEl.textContent = '';
    return true;
  }

  function openMailto(addressText) {
    var subject = encodeURIComponent('Cupid Delivery - ' + currentDeliveryId);
    var body = encodeURIComponent(
      'Delivery ID: ' + currentDeliveryId + '\n\nFull address:\n' + addressText
    );
    window.location.href = 'mailto:' + CUPID_EMAIL + '?subject=' + subject + '&body=' + body;
  }

  function showReceipt(addressText) {
    showScreen('screen-receipt');
    document.getElementById('receipt-delivery-id').textContent = 'Delivery ID: ' + currentDeliveryId;
    document.getElementById('receipt-address').textContent = addressText;

    var mailto = document.getElementById('btn-mailto');
    var subject = encodeURIComponent('Cupid Delivery - ' + currentDeliveryId);
    var body = encodeURIComponent('Delivery ID: ' + currentDeliveryId + '\n\nFull address:\n' + addressText);
    mailto.href = 'mailto:' + CUPID_EMAIL + '?subject=' + subject + '&body=' + body;

    document.getElementById('btn-copy-details').onclick = function () {
      var text = 'Delivery ID: ' + currentDeliveryId + '\n\n' + addressText;
      navigator.clipboard.writeText(text).then(function () {
        var btn = document.getElementById('btn-copy-details');
        var orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = orig; }, 2000);
      });
    };
  }

  function onShippingSubmit(e) {
    e.preventDefault();
    if (!validateAddress()) return;
    var addressText = document.getElementById('fullAddress').value.trim();
    document.getElementById('shipping-label-card').style.display = 'none';
    document.getElementById('sending-animation').classList.remove('hidden');
    openMailto(addressText);
    setTimeout(function () {
      showReceipt(addressText);
    }, 1200);
  }

  function refreshHUD() {
    if (!window.CupidGame) return;
    var collected = window.CupidGame.getCollected();
    var required = window.CupidGame.getRequired();
    var hearts = window.CupidGame.getHearts();
    var progress = window.CupidGame.getProgress();
    var hudCol = document.getElementById('hud-collectibles');
    var hudHearts = document.getElementById('hud-hearts');
    var hudBar = document.getElementById('hud-timer-bar');
    if (window.CupidGame.isArrowLevel && window.CupidGame.isArrowLevel()) {
      var left = window.CupidGame.getBarriersLeft ? window.CupidGame.getBarriersLeft() : 0;
      var heartsText = collected + '/' + required + ' hearts';
      if (hudCol) hudCol.textContent = heartsText + (left > 0 ? ' · Barriers: ' + left : ' · Aim at heart!');
    } else if (hudCol) {
      hudCol.textContent = collected + ' / ' + required;
    }
    if (hudHearts) hudHearts.textContent = '\u2665'.repeat(hearts);
    if (hudBar) hudBar.style.width = (100 - progress * 100) + '%';
  }

  function startLevel(levelNum) {
    showScreen('screen-game');
    if (window.CupidGame.doResize) window.CupidGame.doResize();
    window.CupidGame.setLevel(levelNum - 1);
    window.CupidGame.setPaused(false);
    document.getElementById('game-overlay').classList.add('hidden');
    document.getElementById('btn-try-again').classList.add('hidden');
    document.getElementById('overlay-text').textContent = '';
    window.CupidGame.run();
  }

  function onGameWin() {
    var level = window.CupidGame.getLevelIndex() + 1;
    var unlocked = getStored(STORAGE_KEYS.unlockedLevel, 1);
    setStored(STORAGE_KEYS.unlockedLevel, Math.max(unlocked, level + 1));
    document.getElementById('modal-level-title').textContent = 'Level ' + level + ' Complete!';
    document.getElementById('modal-clue').textContent = CLUE_LINES[level - 1] || '';
    var container = document.getElementById('confetti-container');
    if (container && window.CupidConfetti) {
      container.innerHTML = '';
      var reduced = document.body.classList.contains('reduced-motion');
      window.CupidConfetti.burst(container, { reducedMotion: reduced });
    }
    showModal('modal-level-complete', true);
    if (level >= TOTAL_LEVELS) {
      document.getElementById('btn-back-to-map').textContent = 'Continue to delivery →';
      document.getElementById('btn-back-to-map').onclick = function () {
        showModal('modal-level-complete', false);
        showShippingScreen();
      };
    } else {
      document.getElementById('btn-back-to-map').textContent = 'Back to Map';
      document.getElementById('btn-back-to-map').onclick = function () {
        showModal('modal-level-complete', false);
        updateMapUI();
        showScreen('screen-map');
      };
    }
  }

  function onGameLose() {
    document.getElementById('overlay-text').textContent = 'Try again!';
    document.getElementById('btn-try-again').classList.remove('hidden');
    document.getElementById('game-overlay').classList.remove('hidden');
  }

  function restartQuest() {
    setStored(STORAGE_KEYS.unlockedLevel, 1);
    updateMapUI();
    showScreen('screen-map');
  }

  function init() {
    var soundOn = getStored(STORAGE_KEYS.soundOn, true);
    var reduced = getStored(STORAGE_KEYS.reducedMotion, false);
    document.getElementById('toggle-sound').checked = soundOn;
    document.getElementById('toggle-reduced-motion').checked = reduced;
    if (reduced) document.body.classList.add('reduced-motion');

    document.getElementById('toggle-sound').addEventListener('change', function () {
      setStored(STORAGE_KEYS.soundOn, this.checked);
    });
    document.getElementById('toggle-reduced-motion').addEventListener('change', function () {
      var v = this.checked;
      setStored(STORAGE_KEYS.reducedMotion, v);
      document.body.classList.toggle('reduced-motion', v);
    });

    document.getElementById('btn-start').addEventListener('click', function () {
      updateMapUI();
      showScreen('screen-map');
    });
    document.getElementById('btn-how-to-play').addEventListener('click', function () {
      showModal('modal-how-to-play', true);
    });
    document.getElementById('btn-close-how-to-play').addEventListener('click', function () {
      showModal('modal-how-to-play', false);
    });

    document.querySelectorAll('.map-node').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var level = parseInt(btn.getAttribute('data-level'), 10);
        startLevel(level);
      });
    });

    document.getElementById('btn-skip-game').addEventListener('click', function () {
      if (confirm('Skip the game and go to the delivery form? (You can still play from the map later.)')) {
        setStored(STORAGE_KEYS.unlockedLevel, TOTAL_LEVELS + 1);
        showShippingScreen();
      }
    });

    var canvas = document.getElementById('game-canvas');
    if (canvas && window.CupidGame) {
      window.CupidGame.init(canvas);
      window.CupidGame.setCallbacks({
        onWin: onGameWin,
        onLose: onGameLose,
        getSoundEnabled: function () { return document.getElementById('toggle-sound').checked; },
      });
    }

    document.getElementById('btn-pause').addEventListener('click', function () {
      var p = !window.CupidGame.isPaused();
      window.CupidGame.setPaused(p);
      this.textContent = p ? 'Resume' : 'Pause';
      if (p) {
        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('overlay-text').textContent = 'Paused';
      } else {
        document.getElementById('game-overlay').classList.add('hidden');
      }
    });
    document.getElementById('btn-try-again').addEventListener('click', function () {
      document.getElementById('game-overlay').classList.add('hidden');
      document.getElementById('btn-try-again').classList.add('hidden');
      startLevel(window.CupidGame.getLevelIndex() + 1);
    });

    document.getElementById('form-shipping').addEventListener('submit', onShippingSubmit);

    document.getElementById('btn-restart-quest').addEventListener('click', function () {
      restartQuest();
    });
    document.getElementById('btn-back-to-map-receipt').addEventListener('click', function () {
      updateMapUI();
      showScreen('screen-map');
    });

    setInterval(refreshHUD, 100);
    updateMapUI();
    showScreen('screen-landing');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
