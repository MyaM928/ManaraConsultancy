/* Manara — lighthouse-themed animated backgrounds.
   Reads the scene name from <body data-scene="..."> (fallback window.MANARA_SCENE, else "stars").
   Draws a full-viewport canvas layered inside .bg (behind content). Respects reduced-motion. */
(function () {
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var host = document.querySelector('.bg') || document.body;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  host.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1, HZ = 0;

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight; HZ = H * 0.70;
    canvas.width = Math.max(1, W * DPR); canvas.height = Math.max(1, H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize); resize();

  var scene = (document.body.getAttribute('data-scene') || window.MANARA_SCENE || 'stars').toLowerCase();

  // ---- shared field data ----
  var stars = [], bubbles = [], rain = [], gulls = [];
  for (var i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random() * 0.6, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28, s: 0.4 + Math.random() });
  for (var b = 0; b < 34; b++) bubbles.push({ x: Math.random(), y: Math.random(), r: Math.random() * 3 + 1, sp: 0.02 + Math.random() * 0.05, dr: Math.random() * 0.4 });
  for (var r0 = 0; r0 < 140; r0++) rain.push({ x: Math.random(), y: Math.random(), l: 12 + Math.random() * 16, sp: 0.9 + Math.random() * 0.7 });
  for (var g0 = 0; g0 < 5; g0++) gulls.push({ x: Math.random(), y: 0.12 + Math.random() * 0.22, sp: 0.006 + Math.random() * 0.008, ph: Math.random() * 6.28 });

  // ---- helpers ----
  function gold(a) { return 'rgba(230,204,140,' + a + ')'; }
  function fillGold(a) { return 'rgba(199,161,78,' + a + ')'; }

  function drawStars(t, alpha) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], tw = 0.55 + 0.45 * Math.sin(t * s.s + s.p);
      ctx.fillStyle = 'rgba(244,238,225,' + (alpha * tw * 0.9) + ')';
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.29); ctx.fill();
    }
  }

  // filled sea + moving crest lines from baseline y
  function sea(t, baseY, amp, speed, tint) {
    ctx.save();
    var grd = ctx.createLinearGradient(0, baseY, 0, H);
    grd.addColorStop(0, tint || 'rgba(14,30,50,.55)');
    grd.addColorStop(1, 'rgba(4,9,15,.85)');
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (var x = 0; x <= W; x += 12) {
      var y = baseY + Math.sin((x / 150) + t * speed) * amp + Math.sin((x / 57) - t * speed * 1.6) * (amp * 0.4);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    // crest highlight
    ctx.beginPath();
    for (var x2 = 0; x2 <= W; x2 += 12) {
      var y2 = baseY + Math.sin((x2 / 150) + t * speed) * amp + Math.sin((x2 / 57) - t * speed * 1.6) * (amp * 0.4);
      if (x2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = gold(0.35); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
    return baseY;
  }

  function waterRays(t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 5; i++) {
      var cx = (i / 4) * W + Math.sin(t * 0.2 + i) * 30;
      var g = ctx.createLinearGradient(cx, 0, cx + 60, H);
      g.addColorStop(0, 'rgba(230,204,140,.10)'); g.addColorStop(1, 'rgba(230,204,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx - 30, 0); ctx.lineTo(cx + 30, 0); ctx.lineTo(cx + 120, H); ctx.lineTo(cx + 40, H); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawBubbles(t) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      var y = (b.y - (t * b.sp % 1) + 1) % 1;
      var x = b.x + Math.sin(t + i) * 0.01 * b.dr;
      ctx.strokeStyle = 'rgba(230,204,140,' + (0.10 + 0.12 * (1 - y)) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x * W, y * H, b.r, 0, 6.29); ctx.stroke();
    }
  }

  function lighthouse(x, baseY, s, t, beam) {
    ctx.save(); ctx.translate(x, baseY);
    ctx.strokeStyle = gold(0.55); ctx.fillStyle = fillGold(0.22); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-6 * s, 0); ctx.lineTo(-4 * s, -34 * s); ctx.lineTo(4 * s, -34 * s); ctx.lineTo(6 * s, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,235,180,' + (0.55 + 0.4 * Math.sin(t * 3)) + ')';
    ctx.fillRect(-3.4 * s, -41 * s, 6.8 * s, 6 * s);
    if (beam) {
      var a = -Math.PI / 2 + Math.sin(t * 0.4) * 0.55, len = Math.max(W, H) * 0.9, sp = 0.11;
      ctx.save(); ctx.translate(0, -38 * s); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter';
      var bg = ctx.createLinearGradient(0, 0, len, 0);
      bg.addColorStop(0, 'rgba(255,236,180,.20)'); bg.addColorStop(0.5, 'rgba(230,204,140,.06)'); bg.addColorStop(1, 'rgba(230,204,140,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sp) * len, Math.sin(sp) * len); ctx.lineTo(Math.cos(-sp) * len, Math.sin(-sp) * len); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function landMass(t) {
    ctx.save(); ctx.fillStyle = 'rgba(8,18,30,.9)'; ctx.strokeStyle = gold(0.25); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W, HZ + 4);
    ctx.quadraticCurveTo(W * 0.82, HZ - 34, W * 0.70, HZ + 2);
    ctx.lineTo(W, HZ + 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    lighthouse(W * 0.80, HZ - 6, 0.8, t, true);
  }

  function ship(cx, baseY, s, t) {
    var bob = Math.sin(t * 0.9) * 4, tilt = Math.sin(t * 0.9) * 0.05;
    ctx.save(); ctx.translate(cx, baseY + bob); ctx.rotate(tilt);
    ctx.strokeStyle = gold(0.6); ctx.fillStyle = fillGold(0.18); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-32 * s, 0); ctx.quadraticCurveTo(0, 15 * s, 32 * s, 0); ctx.lineTo(26 * s, -4 * s); ctx.lineTo(-26 * s, -4 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -4 * s); ctx.lineTo(0, -46 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3 * s, -44 * s); ctx.lineTo(3 * s, -9 * s); ctx.lineTo(26 * s, -9 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3 * s, -38 * s); ctx.lineTo(-3 * s, -9 * s); ctx.lineTo(-22 * s, -9 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawGulls(t) {
    ctx.strokeStyle = gold(0.4); ctx.lineWidth = 1.4;
    for (var i = 0; i < gulls.length; i++) {
      var g = gulls[i], x = ((g.x + t * g.sp) % 1.1) * W, y = g.y * H + Math.sin(t + g.ph) * 6, w = 7 + Math.sin(t * 4 + g.ph) * 3;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - 5, x, y); ctx.quadraticCurveTo(x, y - 5, x + w, y); ctx.stroke();
    }
  }

  // whale silhouette centered at (x,y)
  function whale(x, y, s, dir, t, ph) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    var flick = Math.sin(t * 1.4 + ph) * 0.12;
    ctx.fillStyle = fillGold(0.16); ctx.strokeStyle = gold(0.45); ctx.lineWidth = 1.4 / s;
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.quadraticCurveTo(-20, -26, 40, -14);
    ctx.quadraticCurveTo(66, -10, 74, 0);
    ctx.quadraticCurveTo(66, 10, 40, 16);
    ctx.quadraticCurveTo(-10, 24, -50, 12);
    ctx.quadraticCurveTo(-58, 10, -60, 6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // tail
    ctx.save(); ctx.translate(-60, 3); ctx.rotate(flick);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, -16, -30, -20); ctx.quadraticCurveTo(-18, -4, -22, 2); ctx.quadraticCurveTo(-14, 8, -30, 20); ctx.quadraticCurveTo(-18, 14, 0, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // eye
    ctx.fillStyle = gold(0.6); ctx.beginPath(); ctx.arc(46, -2, 1.6 / 1, 0, 6.29); ctx.fill();
    ctx.restore();
  }

  // merfolk: upper body + flicking tail, facing dir
  function merfolk(x, y, s, dir, t, ph) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    ctx.fillStyle = fillGold(0.18); ctx.strokeStyle = gold(0.5); ctx.lineWidth = 1.3 / s;
    // head
    ctx.beginPath(); ctx.arc(0, -34, 6, 0, 6.29); ctx.fill(); ctx.stroke();
    // torso
    ctx.beginPath(); ctx.moveTo(-5, -28); ctx.quadraticCurveTo(-8, -14, -4, -4); ctx.lineTo(4, -4); ctx.quadraticCurveTo(8, -16, 5, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
    // arm reaching forward
    ctx.beginPath(); ctx.moveTo(3, -24); ctx.quadraticCurveTo(18, -20, 26, -24); ctx.stroke();
    // tail
    var sw = Math.sin(t * 1.6 + ph) * 0.2;
    ctx.save(); ctx.translate(0, -4); ctx.rotate(sw);
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-8, 24, -2, 40); ctx.quadraticCurveTo(-16, 46, -14, 54); ctx.quadraticCurveTo(0, 48, 2, 42); ctx.quadraticCurveTo(4, 48, 16, 54); ctx.quadraticCurveTo(12, 44, 4, 40); ctx.quadraticCurveTo(8, 22, 4, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // ---- scenes ----
  var SC = {};
  SC.stars = function (t) {
    drawStars(t, 0.9);
    lighthouse(W * 0.5, HZ + 40, 1.1, t, true);
    sea(t, HZ + 44, 6, 0.6);
    drawGulls(t * 0.4);
  };
  SC.ship = function (t) {
    drawStars(t, 0.55);
    landMass(t);
    sea(t, HZ, 8, 0.7);
    var px = (W * 0.12) + ((t * 12) % (W * 0.62));
    ship(px, HZ - 6, 1.0, t);
    drawGulls(t * 0.5);
  };
  SC.sail = function (t) {
    drawStars(t, 0.6);
    // moon glow + reflection
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var mg = ctx.createRadialGradient(W * 0.5, HZ - 120, 0, W * 0.5, HZ - 120, 160);
    mg.addColorStop(0, 'rgba(255,235,180,.18)'); mg.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H); ctx.restore();
    sea(t, HZ, 7, 0.6);
    ship(W * 0.5 + Math.sin(t * 0.3) * 40, HZ - 4, 1.15, t);
    drawGulls(t * 0.5);
  };
  SC.whales = function (t) {
    ctx.fillStyle = 'rgba(6,16,28,.35)'; ctx.fillRect(0, 0, W, H);
    waterRays(t); drawBubbles(t);
    whale(W * 0.30 + Math.sin(t * 0.3) * 40, H * 0.42 + Math.sin(t * 0.5) * 18, 1.1, 1, t, 0);
    whale(W * 0.66 + Math.cos(t * 0.24) * 46, H * 0.60 + Math.cos(t * 0.4) * 16, 0.8, -1, t, 2);
  };
  SC.mermaid = function (t) {
    ctx.fillStyle = 'rgba(6,16,28,.4)'; ctx.fillRect(0, 0, W, H);
    waterRays(t); drawBubbles(t);
    var gap = 60 + Math.sin(t * 0.4) * 30;
    var cy = H * 0.5;
    // meeting glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var gg = ctx.createRadialGradient(W * 0.5, cy - 24, 0, W * 0.5, cy - 24, 90);
    gg.addColorStop(0, 'rgba(255,235,180,' + (0.14 + 0.06 * Math.sin(t)) + ')'); gg.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); ctx.restore();
    merfolk(W * 0.5 - gap, cy, 1.15, 1, t, 0);
    merfolk(W * 0.5 + gap, cy, 1.15, -1, t, 1.4);
  };
  SC.dawn = function (t) {
    // warm sunrise band on horizon
    ctx.save();
    var g = ctx.createLinearGradient(0, HZ - 160, 0, HZ + 30);
    g.addColorStop(0, 'rgba(20,24,44,0)'); g.addColorStop(0.7, 'rgba(210,120,70,.10)'); g.addColorStop(1, 'rgba(248,180,110,.20)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HZ + 30);
    ctx.globalCompositeOperation = 'lighter';
    var sg = ctx.createRadialGradient(W * 0.5, HZ, 0, W * 0.5, HZ, 150);
    sg.addColorStop(0, 'rgba(255,210,140,' + (0.30 + 0.06 * Math.sin(t)) + ')'); sg.addColorStop(1, 'rgba(255,210,140,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W * 0.5, HZ, 150, 0, 6.29); ctx.fill();
    ctx.restore();
    drawStars(t, Math.max(0, 0.3));
    sea(t, HZ, 6, 0.5, 'rgba(60,50,60,.5)');
    drawGulls(t * 0.5);
  };
  SC.storm = function (t) {
    // flash
    var flash = 0; var cyc = t % 6.5;
    if (cyc < 0.18) flash = 1 - cyc / 0.18; else if (cyc > 0.30 && cyc < 0.42) flash = (0.42 - cyc) / 0.12;
    if (flash > 0) { ctx.fillStyle = 'rgba(200,215,240,' + (0.16 * flash) + ')'; ctx.fillRect(0, 0, W, H); }
    // clouds
    ctx.save(); ctx.fillStyle = 'rgba(10,18,30,.5)';
    for (var i = 0; i < 4; i++) { var cx = ((i / 4) * W + t * 8) % (W + 200) - 100, cy = 60 + i * 22; ctx.beginPath(); ctx.ellipse(cx, cy, 150, 34, 0, 0, 6.29); ctx.fill(); }
    ctx.restore();
    // bolt on flash
    if (flash > 0.4) {
      ctx.strokeStyle = 'rgba(220,230,255,' + flash + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); var bx = W * (0.3 + 0.4 * ((t | 0) % 3) / 3);
      ctx.moveTo(bx, 40); ctx.lineTo(bx - 14, 120); ctx.lineTo(bx + 6, 130); ctx.lineTo(bx - 10, 220); ctx.stroke();
    }
    // rain
    ctx.strokeStyle = 'rgba(180,200,230,.22)'; ctx.lineWidth = 1;
    for (var r = 0; r < rain.length; r++) {
      var d = rain[r], y = (d.y + (t * d.sp % 1)) % 1, x = (d.x + y * 0.06) % 1;
      ctx.beginPath(); ctx.moveTo(x * W, y * H); ctx.lineTo(x * W - 3, y * H + d.l); ctx.stroke();
    }
    lighthouse(W * 0.16, HZ + 20, 1.15, t, true);
    sea(t, HZ + 24, 16, 1.5);
  };

  var draw = SC[scene] || SC.stars;
  var t0 = performance.now();
  function frame(now) {
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    draw(t);
    if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) { draw(3.0); } else { requestAnimationFrame(frame); }
})();
