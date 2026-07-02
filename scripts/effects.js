// Shared animated-canvas effect engines: the built-in EFFECT_ENGINES table,
// the config/color helpers they rely on, the startEffect()/stopEffect()
// runtime that drives their requestAnimationFrame loop, and
// compileCustomEffect() — the entry point user-authored custom effects go
// through. Loaded as a plain global-scope script (no bundler/module system
// in this codebase) by options.html (custom-effect editor live preview) and
// content.js (via manifest.json content_scripts and every dynamic
// re-injection call site) — must load after gradient.js and before
// content.js.
window.PageDyeEffects = (function () {
  let effectCleanup = null;

  // --- Effects (animated Canvas 2D wallpapers) --------------------------
  //
  // Each engine is a plain object: init(cfg) returns fresh per-instance state
  // (with cfg — {color, density, speed}, all user-configurable — tucked
  // inside it), resize(state, width, height) recomputes anything that
  // depends on the viewport size (particle counts, columns...), and
  // draw(ctx, canvas, state, dt) renders one frame given the elapsed time in
  // ms. onMouseMove is optional and only implemented by engines that react
  // to the cursor. density and speed are both 0-100 dials; each engine maps
  // them onto its own sensible range via effectSpeedMultiplier() or its own
  // scaling.
  const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';

  function normalizeEffectConfig(cfg) {
    return {
      color: (cfg && cfg.color) || '#ffffff',
      bgColor: (cfg && cfg.bgColor) || '#000000',
      density: clampPercent(cfg && cfg.density, 50),
      speed: clampPercent(cfg && cfg.speed, 50),
      text: (cfg && typeof cfg.text === 'string' && cfg.text.trim()) ? cfg.text : 'PageDye'
    };
  }

  function clampPercent(n, fallback) {
    return typeof n === 'number' && !isNaN(n) ? Math.max(0, Math.min(100, n)) : fallback;
  }

  // Maps a 0-100 "speed" dial to a 0.4x-2x multiplier applied on top of each
  // engine's own base speed constants.
  function effectSpeedMultiplier(speed) {
    return 0.4 + (speed / 100) * 1.6;
  }

  function spawnBubble(width, height, initial) {
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : height + Math.random() * 40,
      r: 4 + Math.random() * 14,
      rise: 15 + Math.random() * 35,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1.2,
      wobbleAmp: 8 + Math.random() * 16
    };
  }

  function spawnConfetti(width, height, initial, speedMul) {
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : -20,
      size: 6 + Math.random() * 8,
      fall: (40 + Math.random() * 60) * speedMul,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.8 + Math.random() * 1.5
    };
  }

  const EFFECT_ENGINES = {
    matrix: {
      init(cfg) {
        return { width: 0, height: 0, fontSize: 16, columns: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to font size 26px (sparse, few columns) down to
        // 10px (dense, many columns) — smaller glyphs pack more columns in.
        state.fontSize = 26 - (state.cfg.density / 100) * 16;
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        const cols = Math.max(1, Math.floor(width / state.fontSize));
        state.columns = new Array(cols).fill(0).map(() => ({
          y: Math.random() * height,
          speed: (60 + Math.random() * 90) * speedMul
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, fontSize, columns, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        ctx.fillStyle = hexToRgba(cfg.bgColor, 0.12);
        ctx.fillRect(0, 0, width, height);
        ctx.font = `${fontSize}px monospace`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = hexToRgba(cfg.color, 0.85);
        columns.forEach((col, i) => {
          const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          ctx.fillText(ch, i * fontSize, col.y);
          col.y += col.speed * (dt / 1000);
          if (col.y > height + fontSize) {
            col.y = -fontSize * (1 + Math.random() * 10);
            col.speed = (60 + Math.random() * 90) * speedMul;
          }
        });
      }
    },

    particles: {
      init(cfg) {
        return { width: 0, height: 0, particles: [], mouse: { x: -9999, y: -9999 }, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to particle count ~20-220.
        const target = Math.round(20 + (state.cfg.density / 100) * 200);
        const count = Math.min(240, Math.max(10, target));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.particles = new Array(count).fill(0).map(() => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 24 * speedMul,
          vy: (Math.random() - 0.5) * 24 * speedMul
        }));
      },
      onMouseMove(state, e, canvas) {
        const rect = canvas.getBoundingClientRect();
        state.mouse.x = e.clientX - rect.left;
        state.mouse.y = e.clientY - rect.top;
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, particles, mouse, cfg } = state;
        if (!width || !height) return;
        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        const dtSec = dt / 1000;
        const repelRadius = 90;
        const speedMul = effectSpeedMultiplier(cfg.speed);

        particles.forEach((p) => {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < repelRadius) {
            const force = (1 - dist / repelRadius) * 260 * speedMul;
            p.vx += (dx / dist) * force * dtSec;
            p.vy += (dy / dist) * force * dtSec;
          }
          p.x += p.vx * dtSec;
          p.y += p.vy * dtSec;
          // Gentle drag so a repelled particle settles back to a calm drift
          // instead of flying off and accelerating forever.
          p.vx *= 0.98;
          p.vy *= 0.98;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          p.x = Math.max(0, Math.min(width, p.x));
          p.y = Math.max(0, Math.min(height, p.y));
        });

        ctx.strokeStyle = hexToRgba(cfg.color, 0.15);
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.globalAlpha = 1 - dist / 120;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = cfg.color;
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    },

    waves: {
      init(cfg) {
        return { width: 0, height: 0, phase: 0, lineCount: 6, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to 3-14 stacked wave lines.
        state.lineCount = Math.max(2, Math.round(3 + (state.cfg.density / 100) * 11));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, lineCount, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.0006 * effectSpeedMultiplier(cfg.speed);

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < lineCount; i++) {
          const t = i / (lineCount - 1 || 1);
          const baseY = height * (0.3 + t * 0.5);
          const amplitude = 24 + t * 40;
          const freq = 0.006 + t * 0.002;
          const speed = 1 + t * 0.6;
          const opacity = 0.12 + (1 - t) * 0.25;

          ctx.beginPath();
          ctx.strokeStyle = hexToRgba(cfg.color, opacity);
          ctx.lineWidth = 1.5;
          for (let x = 0; x <= width; x += 4) {
            const y = baseY + Math.sin(x * freq + state.phase * speed) * amplitude;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    },

    // "Warp speed" starfield: points fly radially outward from the center,
    // accelerating and growing as they approach the edge, then wrap back to
    // the center with a fresh random angle.
    starfield: {
      init(cfg) {
        return { width: 0, height: 0, stars: [], maxR: 0, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        state.maxR = Math.sqrt(width * width + height * height) / 2;
        // density 0-100 maps to 40-400 stars.
        const count = Math.min(400, Math.max(40, Math.round(40 + (state.cfg.density / 100) * 360)));
        state.stars = new Array(count).fill(0).map(() => ({
          angle: Math.random() * Math.PI * 2,
          r: Math.random() * state.maxR
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, stars, cfg, maxR } = state;
        if (!width || !height || !maxR) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const cx = width / 2;
        const cy = height / 2;
        const dtSec = dt / 1000;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;

        stars.forEach((s) => {
          s.r += (40 + s.r * 0.6) * speedMul * dtSec;
          if (s.r > maxR) {
            s.r = 0;
            s.angle = Math.random() * Math.PI * 2;
          }
          const x = cx + Math.cos(s.angle) * s.r;
          const y = cy + Math.sin(s.angle) * s.r;
          const size = Math.max(0.6, (s.r / maxR) * 2.6);
          ctx.globalAlpha = Math.min(1, 0.3 + (s.r / maxR) * 0.9);
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    },

    // Calm water ripples: circles spawn at random points and expand outward,
    // fading as they grow — a slower, quieter counterpoint to the other
    // effects.
    ripple: {
      init(cfg) {
        return { width: 0, height: 0, ripples: [], spawnTimer: 0, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        state.ripples = [];
        state.spawnTimer = 0;
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        // density 0-100 maps to a spawn interval of 1400ms (sparse) down to
        // 250ms (dense, many concurrent ripples).
        const spawnInterval = 1400 - (cfg.density / 100) * 1150;
        const maxRadius = Math.max(width, height) * 0.5;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          state.spawnTimer = spawnInterval;
          state.ripples.push({ x: Math.random() * width, y: Math.random() * height, r: 0 });
        }

        ctx.lineWidth = 1.5;
        state.ripples = state.ripples.filter((rp) => rp.r < maxRadius);
        state.ripples.forEach((rp) => {
          rp.r += 60 * speedMul * (dt / 1000);
          const alpha = Math.max(0, 1 - rp.r / maxRadius);
          ctx.strokeStyle = hexToRgba(cfg.color, alpha * 0.6);
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
          ctx.stroke();
        });
      }
    },

    // Soft translucent bands drifting like the aurora borealis, layered with
    // additive blending so overlapping bands brighten instead of muddying.
    aurora: {
      init(cfg) {
        return { width: 0, height: 0, phase: 0, bandCount: 3, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to 2-6 aurora bands.
        state.bandCount = Math.max(2, Math.round(2 + (state.cfg.density / 100) * 4));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, bandCount, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.00035 * effectSpeedMultiplier(cfg.speed);

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < bandCount; i++) {
          const t = i / (bandCount - 1 || 1);
          const baseY = height * (0.15 + t * 0.55);
          const amplitude = height * (0.08 + t * 0.06);
          const freq = 0.002 + t * 0.0015;
          const speed = 0.6 + t * 0.5;
          const thickness = height * (0.1 + (1 - t) * 0.12);

          ctx.beginPath();
          ctx.moveTo(0, baseY);
          for (let x = 0; x <= width; x += 8) {
            const y = baseY + Math.sin(x * freq + state.phase * speed + i * 1.7) * amplitude;
            ctx.lineTo(x, y);
          }
          for (let x = width; x >= 0; x -= 8) {
            const y = baseY + thickness + Math.sin(x * freq + state.phase * speed + i * 1.7) * amplitude;
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = hexToRgba(cfg.color, 0.08 + (1 - t) * 0.05);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    // Snowfall: small dots drifting down with a gentle sideways sway,
    // wrapping back to the top once off-screen.
    snow: {
      init(cfg) {
        return { width: 0, height: 0, flakes: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to ~30-260 flakes.
        const count = Math.min(260, Math.max(30, Math.round(30 + (state.cfg.density / 100) * 230)));
        state.flakes = new Array(count).fill(0).map(() => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 1 + Math.random() * 2.5,
          drift: Math.random() * Math.PI * 2,
          fall: 20 + Math.random() * 40
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, flakes, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const dtSec = dt / 1000;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;

        flakes.forEach((f) => {
          f.drift += dtSec * 1.2;
          f.y += f.fall * speedMul * dtSec;
          f.x += Math.sin(f.drift) * 12 * dtSec;
          if (f.y > height + 4) {
            f.y = -4;
            f.x = Math.random() * width;
          }
          if (f.x < -4) f.x = width + 4;
          if (f.x > width + 4) f.x = -4;
          ctx.globalAlpha = 0.5 + (f.r / 3.5) * 0.5;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    },

    // Bubbles rising from the bottom of the viewport with a light wobble,
    // fading in as they climb and respawning once they drift off the top.
    bubbles: {
      init(cfg) {
        return { width: 0, height: 0, bubbles: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to ~12-120 bubbles.
        const count = Math.min(120, Math.max(12, Math.round(12 + (state.cfg.density / 100) * 108)));
        state.bubbles = new Array(count).fill(0).map(() => spawnBubble(width, height, true));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, bubbles, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const dtSec = dt / 1000;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 1.2;

        bubbles.forEach((b) => {
          b.wobble += dtSec * b.wobbleSpeed;
          b.y -= b.rise * speedMul * dtSec;
          b.x += Math.sin(b.wobble) * b.wobbleAmp * dtSec;
          if (b.y < -b.r * 2) Object.assign(b, spawnBubble(width, height, false));
          const fade = Math.min(1, (height - b.y) / height);
          ctx.globalAlpha = 0.15 + fade * 0.35;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }
    },

    // Slow-drifting, twinkling nodes linked across a wider radius than
    // "particles" — reads as a constellation rather than a network.
    constellation: {
      init(cfg) {
        return { width: 0, height: 0, nodes: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to ~15-90 sparse, far-linked nodes.
        const count = Math.min(90, Math.max(15, Math.round(15 + (state.cfg.density / 100) * 75)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.nodes = new Array(count).fill(0).map(() => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 8 * speedMul,
          vy: (Math.random() - 0.5) * 8 * speedMul,
          twinkle: Math.random() * Math.PI * 2
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, nodes, cfg } = state;
        if (!width || !height) return;
        const dtSec = dt / 1000;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        nodes.forEach((n) => {
          n.x += n.vx * dtSec;
          n.y += n.vy * dtSec;
          n.twinkle += dtSec * 1.5;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
          n.x = Math.max(0, Math.min(width, n.x));
          n.y = Math.max(0, Math.min(height, n.y));
        });

        const linkDist = 180;
        ctx.strokeStyle = hexToRgba(cfg.color, 0.12);
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < linkDist) {
              ctx.globalAlpha = 1 - dist / linkDist;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;

        nodes.forEach((n) => {
          const glow = 0.5 + Math.sin(n.twinkle) * 0.5;
          ctx.fillStyle = hexToRgba(cfg.color, 0.5 + glow * 0.5);
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.2 + glow * 1.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    },

    // A handful of glowing points that wander with gentle random turns and
    // pulse in brightness, like fireflies at dusk.
    fireflies: {
      init(cfg) {
        return { width: 0, height: 0, flies: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to ~6-40 fireflies — kept low since each glows.
        const count = Math.min(40, Math.max(6, Math.round(6 + (state.cfg.density / 100) * 34)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.flies = new Array(count).fill(0).map(() => ({
          x: Math.random() * width,
          y: Math.random() * height,
          angle: Math.random() * Math.PI * 2,
          turnSpeed: (Math.random() - 0.5) * 2,
          speed: (10 + Math.random() * 20) * speedMul,
          pulse: Math.random() * Math.PI * 2
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, flies, cfg } = state;
        if (!width || !height) return;
        const dtSec = dt / 1000;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        flies.forEach((f) => {
          f.angle += f.turnSpeed * dtSec;
          f.pulse += dtSec * 2;
          f.x += Math.cos(f.angle) * f.speed * dtSec;
          f.y += Math.sin(f.angle) * f.speed * dtSec;
          if (f.x < 0 || f.x > width) {
            f.angle = Math.PI - f.angle;
            f.x = Math.max(0, Math.min(width, f.x));
          }
          if (f.y < 0 || f.y > height) {
            f.angle = -f.angle;
            f.y = Math.max(0, Math.min(height, f.y));
          }

          const glow = 0.4 + Math.sin(f.pulse) * 0.4 + 0.2;
          ctx.save();
          ctx.shadowColor = cfg.color;
          ctx.shadowBlur = 12 * glow;
          ctx.fillStyle = hexToRgba(cfg.color, Math.max(0.15, glow));
          ctx.beginPath();
          ctx.arc(f.x, f.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
    },

    // A grid of lines with a bright band sweeping diagonally across it —
    // reads as a quiet tech/scanline pulse.
    gridpulse: {
      init(cfg) {
        return { width: 0, height: 0, cell: 40, phase: 0, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to grid cell size 70px (sparse) down to 20px (dense).
        state.cell = Math.max(16, 70 - (state.cfg.density / 100) * 50);
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, cell, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.0004 * effectSpeedMultiplier(cfg.speed);

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        const cycle = state.phase % 1;
        const waveX = cycle * (width + cell * 6) - cell * 3;
        const waveY = cycle * (height + cell * 6) - cell * 3;
        const waveWidth = cell * 3;

        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += cell) {
          const d = Math.abs(x - waveX);
          const alpha = 0.06 + Math.max(0, 1 - d / waveWidth) * 0.55;
          ctx.strokeStyle = hexToRgba(cfg.color, alpha);
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += cell) {
          const d = Math.abs(y - waveY);
          const alpha = 0.06 + Math.max(0, 1 - d / waveWidth) * 0.55;
          ctx.strokeStyle = hexToRgba(cfg.color, alpha);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
    },

    // Fast falling streaks with a trailing fade — a brisk rainstorm rather
    // than snow's slow drift.
    rain: {
      init(cfg) {
        return { width: 0, height: 0, drops: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to ~40-300 streaks.
        const count = Math.min(300, Math.max(40, Math.round(40 + (state.cfg.density / 100) * 260)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.drops = new Array(count).fill(0).map(() => ({
          x: Math.random() * width,
          y: Math.random() * height,
          len: 10 + Math.random() * 20,
          speed: (300 + Math.random() * 300) * speedMul
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, drops, cfg } = state;
        if (!width || !height) return;
        const dtSec = dt / 1000;
        // Partial-opacity clear leaves a short motion trail behind each drop.
        ctx.fillStyle = hexToRgba(cfg.bgColor, 0.25);
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = hexToRgba(cfg.color, 0.5);
        ctx.lineWidth = 1;

        drops.forEach((d) => {
          d.y += d.speed * dtSec;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x, d.y + d.len);
          ctx.stroke();
          if (d.y > height) {
            d.y = -d.len - Math.random() * 100;
            d.x = Math.random() * width;
          }
        });
      }
    },

    // Rotating rectangular pieces falling with a side-to-side wobble.
    confetti: {
      init(cfg) {
        return { width: 0, height: 0, pieces: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to ~20-200 pieces.
        const count = Math.min(200, Math.max(20, Math.round(20 + (state.cfg.density / 100) * 180)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.pieces = new Array(count).fill(0).map(() => spawnConfetti(width, height, true, speedMul));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, pieces, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const dtSec = dt / 1000;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;

        pieces.forEach((p) => {
          p.y += p.fall * dtSec;
          p.wobble += dtSec * p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 40 * dtSec;
          p.rot += p.rotSpeed * dtSec;
          if (p.y > height + 20) Object.assign(p, spawnConfetti(width, height, false, speedMul));

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.85;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        });
        ctx.globalAlpha = 1;
      }
    },

    // Soft glowing blobs drifting on independent Lissajous paths, blended
    // additively so overlaps brighten — a calm flowing plasma field.
    plasma: {
      init(cfg) {
        return { width: 0, height: 0, blobs: [], phase: 0, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to 2-7 blobs.
        const count = Math.max(2, Math.round(2 + (state.cfg.density / 100) * 5));
        state.blobs = new Array(count).fill(0).map(() => ({
          freqX: 0.15 + Math.random() * 0.25,
          freqY: 0.15 + Math.random() * 0.25,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          radius: Math.min(width, height) * (0.18 + Math.random() * 0.12)
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, blobs, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.0005 * effectSpeedMultiplier(cfg.speed);

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';

        blobs.forEach((b) => {
          const cx = width / 2 + Math.sin(state.phase * b.freqX + b.phaseX) * width * 0.32;
          const cy = height / 2 + Math.cos(state.phase * b.freqY + b.phaseY) * height * 0.32;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.radius);
          grad.addColorStop(0, hexToRgba(cfg.color, 0.35));
          grad.addColorStop(1, hexToRgba(cfg.color, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, b.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    // Points spiraling inward toward the center, accelerating and shrinking
    // the radius as they go, then respawning at the outer edge.
    vortex: {
      init(cfg) {
        return { width: 0, height: 0, particles: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to ~30-260 particles.
        const count = Math.min(260, Math.max(30, Math.round(30 + (state.cfg.density / 100) * 230)));
        state.particles = new Array(count).fill(0).map(() => ({
          angle: Math.random() * Math.PI * 2,
          r: Math.random() * Math.max(width, height) * 0.5,
          spin: (0.4 + Math.random() * 0.8) * (Math.random() < 0.5 ? -1 : 1)
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, particles, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const dtSec = dt / 1000;
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.max(width, height) * 0.55;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;

        particles.forEach((p) => {
          p.angle += p.spin * speedMul * dtSec;
          p.r -= (20 + p.r * 0.15) * speedMul * dtSec;
          if (p.r < 4) {
            p.r = maxR;
            p.angle = Math.random() * Math.PI * 2;
          }
          const x = cx + Math.cos(p.angle) * p.r;
          const y = cy + Math.sin(p.angle) * p.r;
          const size = Math.max(0.6, (1 - p.r / maxR) * 2.6 + 0.5);
          ctx.globalAlpha = Math.min(1, 0.25 + (1 - p.r / maxR) * 0.8);
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    },

    // Types out the configured text, holds, erases, then loops — a simple
    // cursor-blinking typewriter centered in the viewport.
    typewriter: {
      init(cfg) {
        return {
          width: 0, height: 0, fontSize: 32,
          charIndex: 0, phase: 'typing', timer: 0,
          cursorOn: true, cursorTimer: 0, cfg
        };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to font size 20px (small) to 72px (large).
        state.fontSize = 20 + (state.cfg.density / 100) * 52;
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, cfg } = state;
        if (!width || !height) return;
        const text = cfg.text;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const charInterval = 160 / speedMul;
        const holdDuration = 1400;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        state.timer += dt;
        if (state.phase === 'typing') {
          if (state.timer >= charInterval) {
            state.timer = 0;
            state.charIndex = Math.min(text.length, state.charIndex + 1);
            if (state.charIndex >= text.length) {
              state.phase = 'hold';
              state.timer = 0;
            }
          }
        } else if (state.phase === 'hold') {
          if (state.timer >= holdDuration) {
            state.phase = 'erasing';
            state.timer = 0;
          }
        } else if (state.phase === 'erasing') {
          if (state.timer >= charInterval / 1.6) {
            state.timer = 0;
            state.charIndex = Math.max(0, state.charIndex - 1);
            if (state.charIndex <= 0) {
              state.phase = 'pauseEmpty';
              state.timer = 0;
            }
          }
        } else if (state.phase === 'pauseEmpty') {
          if (state.timer >= 500) {
            state.phase = 'typing';
            state.timer = 0;
          }
        }

        state.cursorTimer += dt;
        if (state.cursorTimer >= 500) {
          state.cursorTimer = 0;
          state.cursorOn = !state.cursorOn;
        }

        ctx.font = `${state.fontSize}px monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = cfg.color;
        const shown = text.slice(0, state.charIndex);
        ctx.fillText(shown + (state.cursorOn ? '|' : ''), width / 2, height / 2);
      }
    }
  };

  // ---- Custom effects ----------------------------------------------
  //
  // A custom effect is user-authored source that evaluates to an engine
  // object with the exact same shape as the EFFECT_ENGINES entries above:
  // {init(cfg), resize(state, width, height), draw(ctx, canvas, state, dt),
  // onMouseMove(state, e, canvas)?}. Compiled locally with `new Function` —
  // never fetched remotely, always the user's own stored code, same trust
  // boundary as the existing Custom CSS injection. Compiled code runs in
  // the global scope (not this module's closure), so the color/speed
  // helpers built-in engines reach directly are re-exposed on `helpers`
  // below for custom code to call as window.PageDyeEffects.helpers.xxx().
  const customEngineCache = new Map();

  function compileCustomEffect(code) {
    try {
      const factory = new Function("'use strict';\n" + code);
      const engine = factory();
      if (!engine || typeof engine.init !== 'function' || typeof engine.resize !== 'function' || typeof engine.draw !== 'function') {
        return { ok: false, error: 'Code must evaluate to an object with init(cfg), resize(state, width, height) and draw(ctx, canvas, state, dt) functions.' };
      }
      return { ok: true, engine };
    } catch (err) {
      return { ok: false, error: (err && err.message) ? err.message : String(err) };
    }
  }

  // Recompiling on every animation frame would be wasteful — cache the
  // compiled engine per effect id, keyed on the code text so an edit
  // invalidates it automatically.
  function getCompiledCustomEngine(id, code) {
    const cacheKey = id + '::' + code;
    const cached = customEngineCache.get(id);
    if (cached && cached.cacheKey === cacheKey) return cached.result;
    const result = compileCustomEffect(code);
    customEngineCache.set(id, { cacheKey, result });
    return result;
  }

  function resolveEngine(kind, customEffects) {
    if (typeof kind === 'string' && kind.indexOf('custom:') === 0) {
      const id = kind.slice('custom:'.length);
      const entry = (customEffects || []).find((e) => e.id === id);
      if (entry) {
        const compiled = getCompiledCustomEngine(id, entry.code);
        if (compiled.ok) return { engine: compiled.engine, isCustom: true };
        console.warn('[PageDye] Custom effect "' + entry.name + '" failed to compile, falling back to Waves:', compiled.error);
      } else {
        console.warn('[PageDye] Custom effect "' + id + '" not found, falling back to Waves.');
      }
      return { engine: EFFECT_ENGINES.waves, isCustom: false };
    }
    return { engine: EFFECT_ENGINES[kind] || EFFECT_ENGINES.waves, isCustom: false };
  }

  // Starts (or restarts) the animated-canvas wallpaper. Battery/perf
  // safeguards: prefers-reduced-motion renders a single static frame and
  // never starts the loop; otherwise the loop keeps running but skips
  // drawing while the tab is hidden (rAF itself is already throttled by the
  // browser in background tabs, this just avoids wasted engine work too).
  //
  // `customEffects` (optional) is the user's saved custom-effect library —
  // only consulted when `kind` is a "custom:<id>" reference. Built-in
  // engines are trusted first-party code and run directly; a custom engine's
  // init/resize/draw/onMouseMove calls are each guarded — a runtime error
  // stops the loop and freezes on the last good frame (instead of throwing
  // on every animation frame or crashing the host page) and is reported
  // once via console.error and the optional `onError` callback.
  function startEffect(canvas, kind, opacityPct, effectConfig, customEffects, onError) {
    stopEffect();

    canvas.style.display = 'block';
    canvas.style.opacity = ((typeof opacityPct === 'number' ? opacityPct : 100) / 100).toString();

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resolved = resolveEngine(kind, customEffects);
    const engine = resolved.engine;
    const isCustom = resolved.isCustom;

    let stopped = false;
    function fail(err) {
      if (stopped) return;
      stopped = true;
      stopEffect();
      console.error('[PageDye] Custom effect crashed, stopping:', err);
      if (onError) onError(err);
    }

    function safeCall(methodName, ...args) {
      const fn = engine[methodName];
      if (typeof fn !== 'function') return undefined;
      if (!isCustom) return fn.apply(engine, args);
      try {
        return fn.apply(engine, args);
      } catch (err) {
        fail(err);
        return undefined;
      }
    }

    const state = safeCall('init', normalizeEffectConfig(effectConfig));
    if (stopped) return;

    function resize() {
      if (stopped) return;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      safeCall('resize', state, width, height);
      safeCall('draw', ctx, canvas, state, 0);
    }
    resize();
    if (stopped) return;
    window.addEventListener('resize', resize);

    let mouseHandler = null;
    if (engine.onMouseMove) {
      mouseHandler = (e) => { if (!stopped) safeCall('onMouseMove', state, e, canvas); };
      window.addEventListener('mousemove', mouseHandler);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId = null;
    if (!reduceMotion) {
      let last = null;
      const loop = (t) => {
        if (stopped) return;
        frameId = requestAnimationFrame(loop);
        if (document.hidden) return;
        const dt = last === null ? 16 : Math.min(t - last, 100);
        last = t;
        safeCall('draw', ctx, canvas, state, dt);
      };
      frameId = requestAnimationFrame(loop);
    }

    effectCleanup = () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      if (mouseHandler) window.removeEventListener('mousemove', mouseHandler);
    };
  }

  function stopEffect() {
    if (effectCleanup) {
      effectCleanup();
      effectCleanup = null;
    }
  }

  function hexToRgba(hex, alpha) {
    hex = String(hex || '#ffffff').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const a = (typeof alpha === 'number' && !isNaN(alpha)) ? alpha : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return {
    EFFECT_ENGINES,
    normalizeEffectConfig,
    clampPercent,
    effectSpeedMultiplier,
    hexToRgba,
    startEffect,
    stopEffect,
    compileCustomEffect,
    helpers: {
      hexToRgba,
      effectSpeedMultiplier,
      clampPercent
    }
  };
})();
