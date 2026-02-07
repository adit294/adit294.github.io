/**
 * Heart confetti burst for level complete.
 * No external libs; reduced motion respected via data attribute or class on container.
 */

(function () {
  'use strict';

  function createHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    const r = size;
    ctx.moveTo(x, y - r * 0.5);
    ctx.bezierCurveTo(x - r, y - r, x - r, y + r * 0.5, x, y + r);
    ctx.bezierCurveTo(x + r, y + r * 0.5, x + r, y - r, x, y - r * 0.5);
    ctx.fill();
  }

  function burst(container, options) {
    options = options || {};
    const count = options.reducedMotion ? 8 : 24;
    const duration = options.reducedMotion ? 400 : 800;
    const colors = ['#e91e8c', '#ff85c1', '#c2185b', '#ff4da6'];
    const particles = [];
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const start = performance.now();

    function tick(t) {
      const elapsed = t - start;
      if (elapsed > duration) {
        container.removeChild(canvas);
        return;
      }
      const progress = elapsed / duration;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life = 1 - progress;
        ctx.globalAlpha = p.life;
        createHeart(ctx, p.x, p.y, p.size, p.color);
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.CupidConfetti = { burst: burst };
})();
