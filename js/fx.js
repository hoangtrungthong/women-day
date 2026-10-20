/* Hiệu ứng nền pseudo-3D: phối cảnh, parallax, depth-of-field, bokeh.
   Chạy tốt nhất trong Electron (Chromium bật GPU, không throttle). */
(function () {
  const view = document.getElementById('fx');
  const vctx = view.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HQ = !!(window.desktop && window.desktop.isElectron);

  const FOCAL = 820;
  const Z_NEAR = -220;
  const Z_FAR = 1500;

  // 3 lớp độ sâu, mỗi lớp một canvas riêng để blur một lần thay vì blur từng hoa
  // fog thấp để màu không bị rửa nhạt, saturate bù lại độ rực cho lớp xa
  const LAYERS = [
    { zMin: 620, zMax: Z_FAR, blur: HQ ? 5 : 3, fog: 0.2, sat: 1.5 },
    { zMin: 220, zMax: 620, blur: HQ ? 1.6 : 1, fog: 0.08, sat: 1.3 },
    { zMin: Z_NEAR, zMax: 220, blur: 0, fog: 0, sat: 1.15 }
  ];

  let kind = 'none';
  let accent = '#e05c8a';
  let baseHue = 340;

  let flowers = [];
  let drops = [];
  let sparks = [];
  let bokeh = [];
  let raf = null;
  let last = 0;
  let spawnTimer = 0;
  let time = 0;

  // camera
  let camX = 0, camY = 0, tgtX = 0, tgtY = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeOutBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  function hexHue(hex) {
    const m = /^#?([\da-f]{6})$/i.exec(String(hex).trim());
    if (!m) return 340;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (!d) return 340;
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  }

  /* ---------- canvas layers ---------- */
  let dpr = 1;
  const buffers = LAYERS.map(() => {
    const c = document.createElement('canvas');
    return { canvas: c, ctx: c.getContext('2d') };
  });
  let ctx = null; // ctx của lớp đang vẽ

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, HQ ? 2 : 1.5);
    [view, ...buffers.map(b => b.canvas)].forEach(c => {
      c.width = Math.max(1, Math.round(W() * dpr));
      c.height = Math.max(1, Math.round(H() * dpr));
    });
    view.style.width = W() + 'px';
    view.style.height = H() + 'px';
    vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buffers.forEach(b => b.ctx.setTransform(dpr, 0, 0, dpr, 0, 0));
  }
  resize();
  window.addEventListener('resize', () => {
    resize();
    if (kind === 'bloom' && reduce) renderStatic();
  });

  function layerIndexFor(z) {
    for (let i = 0; i < LAYERS.length; i++) {
      if (z >= LAYERS[i].zMin && z < LAYERS[i].zMax) return i;
    }
    return z >= Z_FAR ? 0 : LAYERS.length - 1;
  }

  /* ---------- projection ---------- */
  function project(wx, wy, z) {
    const s = FOCAL / (FOCAL + z);
    return {
      s,
      x: W() / 2 + (wx - camX * (1 + z / FOCAL * -0.4)) * s,
      y: H() / 2 + (wy - camY) * s
    };
  }

  /* ---------- hoa 3D ---------- */
  // Bảng màu rực: lệch hue rộng khắp vòng tròn màu, không bó vào accent
  const PALETTES = [
    [0, 38, 318],      // hồng - cam - tím hồng
    [280, 320, 215],   // tím - hồng - xanh tím
    [45, 18, 338],     // vàng - cam - hồng
    [165, 195, 120],   // ngọc - xanh - lục
    [10, 345, 55],     // đỏ - hồng đậm - vàng
    [195, 255, 300]    // xanh - lam tím - tím
  ];

  function makeFlower(o) {
    o = o || {};
    const z = o.z != null ? o.z : rand(Z_NEAR + 60, Z_FAR * 0.92);
    const spread = 1 + z / FOCAL;

    let wx = o.wx;
    if (wx == null) {
      // chừa khoảng giữa cho thiệp khi hoa ở gần camera
      const near = z < 260;
      const side = Math.random() < 0.5 ? -1 : 1;
      wx = near
        ? side * rand(0.34, 0.72) * W() * spread
        : rand(-0.62, 0.62) * W() * spread;
    }

    // mỗi bông lấy một bộ 3 hue, cánh sẽ chuyển màu dọc theo chiều dài
    const pal = pick(PALETTES);
    const shift = baseHue - 340; // xoay nhẹ cả bảng theo màu nhấn của theme
    const hues = pal.map(h => (h + shift + rand(-10, 10) + 360) % 360);

    return {
      wx,
      wy: o.wy != null ? o.wy : rand(-0.42, 0.46) * H() * spread,
      z,
      size: (o.size || rand(30, 64)) * clamp(Math.min(1, W() / 900), 0.6, 1),
      hue: hues[0],
      hue2: hues[1],
      hue3: hues[2],
      sat: rand(88, 100),
      lig: rand(58, 70),
      // mỗi cánh lệch hue một chút -> bông hoa ngả màu như cầu vồng
      rainbow: Math.random() < 0.45 ? rand(16, 40) : rand(2, 10),
      petals: 5 + ((Math.random() * 4) | 0),
      layers: Math.random() < 0.72 ? 2 : 1,
      notched: Math.random() < 0.5,
      spin: rand(0, Math.PI * 2),
      spinV: rand(-0.12, 0.12),
      // nghiêng bông hoa trong không gian -> phối cảnh thật
      tiltX: rand(-0.85, 0.85),
      tiltY: rand(-0.7, 0.7),
      tiltVX: rand(-0.08, 0.08),
      tiltVY: rand(-0.08, 0.08),
      stem: rand(80, 170),
      bend: rand(-0.34, 0.34),
      sway: rand(0, Math.PI * 2),
      swaySpd: rand(0.4, 1.0),
      t: o.t || 0,
      tGrow: rand(0.65, 1.1),
      tBloom: rand(1.1, 1.8),
      tHold: o.hold != null ? o.hold : rand(3.4, 7),
      tFade: rand(1.9, 3),
      burst: false,
      fallen: null
    };
  }

  function phaseOf(f) {
    const g = f.tGrow, b = g + f.tBloom, h = b + f.tHold, e = h + f.tFade;
    if (f.t < 0) return { name: 'wait', grow: 0, open: 0, fade: 0 };
    if (f.t < g) return { name: 'grow', grow: f.t / g, open: 0, fade: 0 };
    if (f.t < b) return { name: 'bloom', grow: 1, open: (f.t - g) / f.tBloom, fade: 0 };
    if (f.t < h) return { name: 'hold', grow: 1, open: 1, fade: 0 };
    if (f.t < e) return { name: 'fade', grow: 1, open: 1, fade: (f.t - h) / f.tFade };
    return { name: 'dead', grow: 1, open: 1, fade: 1 };
  }

  // quay vector quanh trục X rồi Y
  function rot3(v, ax, ay) {
    let { x, y, z } = v;
    let ca = Math.cos(ax), sa = Math.sin(ax);
    let y1 = y * ca - z * sa, z1 = y * sa + z * ca;
    let cb = Math.cos(ay), sb = Math.sin(ay);
    let x1 = x * cb + z1 * sb, z2 = -x * sb + z1 * cb;
    return { x: x1, y: y1, z: z2 };
  }

  function fog(f, a) {
    const L = LAYERS[layerIndexFor(f.z)];
    return a * (1 - L.fog * 0.45);
  }

  function petalPath(len, wid, notched) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid, -len * 0.22, wid * 0.86, -len * 0.78, notched ? wid * 0.2 : 0, -len);
    if (notched) ctx.quadraticCurveTo(0, -len * 0.84, -wid * 0.2, -len);
    ctx.bezierCurveTo(-wid * 0.86, -len * 0.78, -wid, -len * 0.22, 0, 0);
    ctx.closePath();
  }

  // hướng cánh trong không gian 3D
  function petalDir(f, i, total, layer, stagger) {
    const ang = (i / total) * Math.PI * 2 + f.spin + (layer ? Math.PI / total : 0);
    const open3 = 0.35 + 0.65 * easeOutCubic(stagger);
    return rot3({
      x: Math.cos(ang) * open3,
      y: Math.sin(ang) * open3,
      z: -(1 - open3) * 0.9
    }, f.tiltX, f.tiltY);
  }

  function petalStagger(f, i, total, layer, open) {
    return clamp((open - layer * 0.17 - (i / total) * 0.3) / 0.56, 0, 1);
  }

  // Cánh hoa: nén theo chiều sâu để ra cảm giác cong, có highlight mép
  function drawPetal3(f, i, total, layer, open, alpha, scr) {
    const stagger = petalStagger(f, i, total, layer, open);
    if (stagger <= 0) return null;

    const e = easeOutBack(stagger);
    const lScale = layer === 0 ? 1 : 0.62;
    const dir = petalDir(f, i, total, layer, stagger);

    const len = f.size * 0.98 * lScale * e * scr.s;
    const wid = f.size * 0.44 * lScale * e * scr.s;
    if (len < 0.4) return null;

    // góc trên mặt phẳng màn hình + độ nén do nghiêng
    const screenAng = Math.atan2(dir.y, dir.x) + Math.PI / 2;
    const flat = Math.hypot(dir.x, dir.y);
    const squash = clamp(flat / Math.max(0.0001, Math.hypot(flat, dir.z)), 0.18, 1);
    const facing = clamp(0.45 + 0.55 * (1 - Math.abs(dir.z)), 0, 1);

    const px = scr.x + dir.x * f.size * 0.12 * scr.s;
    const py = scr.y + dir.y * f.size * 0.12 * scr.s;

    const lig = clamp(f.lig + layer * 10 + (dir.z < 0 ? 8 : -6) * facing, 26, 86);
    // lệch hue theo index cánh -> cả bông ngả cầu vồng
    const spin = Math.sin((i / total) * Math.PI * 2) * f.rainbow;
    const h1 = (f.hue + spin + layer * 14 + 360) % 360;
    const h2 = (f.hue2 + spin * 0.6 + layer * 14 + 360) % 360;
    const h3 = (f.hue3 + spin * 0.4 + 360) % 360;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(screenAng);
    ctx.transform(1, 0, 0, squash, 0, 0);
    ctx.globalAlpha = alpha;

    // glow quanh cánh cho màu "nổ" ra ngoài
    ctx.shadowColor = `hsla(${h2}, 100%, 62%, ${0.55 * alpha})`;
    ctx.shadowBlur = Math.max(2, len * 0.3);

    // gradient 3 màu: gốc cánh -> giữa -> chóp cánh
    const g = ctx.createLinearGradient(0, 0, 0, -len);
    g.addColorStop(0, `hsla(${h3}, ${f.sat}%, ${clamp(lig + 26, 0, 94)}%, 1)`);
    g.addColorStop(0.38, `hsla(${h1}, ${f.sat}%, ${clamp(lig + 6, 0, 90)}%, 1)`);
    g.addColorStop(0.74, `hsla(${h2}, 100%, ${lig}%, 1)`);
    g.addColorStop(1, `hsla(${h2 - 16}, 100%, ${clamp(lig - 12, 24, 100)}%, 0.96)`);

    petalPath(len, wid, f.notched);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;

    // vệt sáng dọc cánh, kiểu satin
    const sheen = ctx.createLinearGradient(-wid, 0, wid, 0);
    sheen.addColorStop(0, 'hsla(0, 0%, 100%, 0)');
    sheen.addColorStop(0.42, `hsla(0, 0%, 100%, ${0.4 * facing})`);
    sheen.addColorStop(0.62, 'hsla(0, 0%, 100%, 0)');
    petalPath(len, wid, f.notched);
    ctx.fillStyle = sheen;
    ctx.fill();

    // viền màu tương phản ở mép cánh
    ctx.globalAlpha = alpha * 0.75;
    petalPath(len, wid, f.notched);
    ctx.strokeStyle = `hsla(${h3}, 100%, ${dir.z < 0 ? 92 : 70}%, ${dir.z < 0 ? 0.6 : 0.35})`;
    ctx.lineWidth = Math.max(0.5, len * 0.038);
    ctx.stroke();

    // gân cánh
    ctx.globalAlpha = alpha * 0.34;
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.08);
    ctx.lineTo(0, -len * 0.84);
    ctx.strokeStyle = `hsla(${h1 - 18}, 100%, ${clamp(lig - 26, 14, 100)}%, 1)`;
    ctx.lineWidth = Math.max(0.5, len * 0.022);
    ctx.stroke();

    ctx.restore();
    return dir.z;
  }

  function drawStem(f, grow, alpha, scr) {
    const len = f.stem * scr.s;
    if (len < 2 || grow <= 0) return;
    const baseY = scr.y + len;
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `hsla(130, 36%, ${32 + f.lig * 0.1}%, 1)`;
    ctx.lineWidth = Math.max(1, f.size * 0.07 * scr.s);
    ctx.setLineDash([len * grow, len + 20]);
    ctx.beginPath();
    ctx.moveTo(scr.x, baseY);
    ctx.quadraticCurveTo(scr.x + f.bend * len * 0.55, scr.y + len * 0.5, scr.x, scr.y);
    ctx.stroke();
    ctx.setLineDash([]);

    [0.4, 0.66].forEach((at, i) => {
      const lp = clamp((grow - at) / 0.26, 0, 1);
      if (lp <= 0) return;
      const e = easeOutBack(lp);
      const lx = scr.x + f.bend * len * 0.3 * (1 - at);
      const ly = scr.y + len * at;
      const dir = i % 2 ? 1 : -1;
      const L = f.size * 0.95 * scr.s;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(dir * (0.72 + 0.14 * i));
      ctx.scale(e, e * (0.6 + 0.4 * Math.abs(Math.cos(f.tiltY))));
      const lg = ctx.createLinearGradient(0, 0, L, 0);
      lg.addColorStop(0, 'hsla(132, 46%, 34%, 1)');
      lg.addColorStop(1, 'hsla(96, 56%, 60%, 0.9)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(L * 0.5, -L * 0.32, L, 0);
      ctx.quadraticCurveTo(L * 0.5, L * 0.32, 0, 0);
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawCenter(f, open, alpha, scr) {
    const r = f.size * 0.3 * scr.s * easeOutCubic(clamp(open / 0.8, 0, 1));
    if (r < 0.5) return;
    const squash = clamp(Math.cos(f.tiltX) * Math.cos(f.tiltY), 0.22, 1);
    ctx.save();
    ctx.translate(scr.x, scr.y);
    ctx.transform(1, 0, 0, squash, 0, 0);
    ctx.globalAlpha = alpha;

    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 0, 0, 0, r);
    g.addColorStop(0, 'hsla(56, 100%, 92%, 1)');
    g.addColorStop(0.42, 'hsla(46, 100%, 70%, 1)');
    g.addColorStop(0.78, 'hsla(28, 100%, 58%, 1)');
    g.addColorStop(1, `hsla(${f.hue3}, 95%, 52%, 0.95)`);
    ctx.shadowColor = 'hsla(44, 100%, 60%, .8)';
    ctx.shadowBlur = Math.max(2, r * 1.1);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;

    // nhị hoa: hạt phấn nhiều màu trên cuống mảnh
    const n = 12;
    for (let i = 0; i < n; i++) {
      const sp = clamp((open - 0.52 - i * 0.015) / 0.3, 0, 1);
      if (sp <= 0) continue;
      const a = (i / n) * Math.PI * 2 + f.spin * 1.4;
      const rr = r * (0.4 + 0.95 * easeOutBack(sp));
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      ctx.strokeStyle = `hsla(46, 90%, 58%, ${0.5 * sp})`;
      ctx.lineWidth = Math.max(0.4, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.4, r * 0.2 * sp), 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0
        ? `hsla(${f.hue2}, 100%, 78%, 1)`
        : `hsla(${48 + (i % 4) * 6}, 100%, ${76 + (i % 3) * 6}%, 1)`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFallen(f, dt, alpha, scr) {
    if (!f.fallen) {
      f.fallen = Array.from({ length: f.petals }, (_, i) => ({
        a: (i / f.petals) * Math.PI * 2 + f.spin,
        x: 0, y: 0, z: 0,
        vx: rand(-55, 55), vy: rand(14, 70), vz: rand(-40, 70),
        rot: rand(0, Math.PI * 2), vr: rand(-2.4, 2.4),
        spin: rand(1.5, 4)
      }));
    }
    f.fallen.forEach(p => {
      p.vy += 72 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rot += p.vr * dt;
      const sc = project(f.wx + Math.cos(p.a) * f.size * 0.3 + p.x, f.wy + Math.sin(p.a) * f.size * 0.3 + p.y, f.z + p.z);
      const len = f.size * 0.95 * sc.s;
      if (len < 0.4) return;
      const flip = Math.abs(Math.cos(p.rot * p.spin));
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(p.a + p.rot);
      ctx.transform(1, 0, 0, clamp(flip, 0.14, 1), 0, 0);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = `hsla(${f.hue2}, 100%, 65%, ${0.5 * alpha})`;
      ctx.shadowBlur = Math.max(2, len * 0.3);
      const g = ctx.createLinearGradient(0, 0, 0, -len);
      g.addColorStop(0, `hsla(${f.hue3}, ${f.sat}%, ${clamp(f.lig + 26, 0, 95)}%, 1)`);
      g.addColorStop(0.5, `hsla(${f.hue}, ${f.sat}%, ${clamp(f.lig + 6, 0, 92)}%, 1)`);
      g.addColorStop(1, `hsla(${f.hue2}, 100%, ${clamp(f.lig - 10, 20, 100)}%, 1)`);
      petalPath(len, f.size * 0.42 * sc.s, f.notched);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    });
  }

  function drawFlower(f, dt) {
    const ph = phaseOf(f);
    if (ph.name === 'wait') return;

    const scr = project(f.wx, f.wy, f.z);
    if (scr.s <= 0.02) return;
    // cắt bớt hoa ngoài khung để đỡ tốn
    const pad = f.size * 3 * scr.s + f.stem * scr.s;
    if (scr.x < -pad || scr.x > W() + pad || scr.y < -pad || scr.y > H() + pad) return;

    const alpha = fog(f, ph.name === 'fade' ? 1 - easeOutCubic(ph.fade) : 1);
    if (alpha <= 0.01) return;

    const swayX = Math.sin(time * f.swaySpd + f.sway) * 0.055;

    if (ph.name === 'fade' || ph.name === 'dead') {
      drawStem(f, 1, alpha, scr);
      drawFallen(f, dt, alpha, scr);
      drawCenter(f, 1, alpha, scr);
      return;
    }

    drawStem(f, easeOutCubic(clamp(ph.grow, 0, 1)), alpha, scr);

    if (!f.burst && ph.open > 0.45) {
      f.burst = true;
      burst(f, scr);
    }

    const open = clamp(ph.open, 0, 1);
    if (open <= 0) return;

    // hào quang nhiều màu, vẽ cộng sáng cho rực
    const o = easeOutCubic(open);
    const gr = f.size * (2.2 + o * 1.1) * scr.s;
    if (gr > 2) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const halo = ctx.createRadialGradient(scr.x, scr.y, 0, scr.x, scr.y, gr);
      halo.addColorStop(0, `hsla(${f.hue2}, 100%, 72%, ${0.34 * o * alpha})`);
      halo.addColorStop(0.4, `hsla(${f.hue}, 100%, 66%, ${0.2 * o * alpha})`);
      halo.addColorStop(0.72, `hsla(${f.hue3}, 100%, 64%, ${0.09 * o * alpha})`);
      halo.addColorStop(1, `hsla(${f.hue3}, 100%, 64%, 0)`);
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, gr, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // tia sáng hình sao lúc hoa mới bung
      const flare = clamp((0.85 - Math.abs(open - 0.6) * 2.4), 0, 1);
      if (flare > 0.02) {
        const rr = gr * 1.5;
        ctx.globalAlpha = flare * alpha * 0.5;
        ctx.strokeStyle = `hsla(${f.hue2}, 100%, 85%, 1)`;
        ctx.lineWidth = Math.max(0.6, f.size * 0.05 * scr.s);
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + f.spin;
          ctx.beginPath();
          ctx.moveTo(scr.x, scr.y);
          ctx.lineTo(scr.x + Math.cos(a) * rr, scr.y + Math.sin(a) * rr);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    const sx = { ...scr, x: scr.x + swayX * f.size * scr.s };

    // sắp cánh theo z thật: xa vẽ trước, gần vẽ sau -> che nhau đúng chiều sâu
    const order = [];
    for (let layer = 0; layer < f.layers; layer++) {
      for (let i = 0; i < f.petals; i++) {
        const st = petalStagger(f, i, f.petals, layer, open);
        if (st <= 0) continue;
        order.push({ layer, i, z: petalDir(f, i, f.petals, layer, st).z + layer * 0.02 });
      }
    }
    order.sort((a, b) => b.z - a.z);

    const front = [];
    order.forEach(p => {
      if (p.z < -0.02) front.push(p);
      else drawPetal3(f, p.i, f.petals, p.layer, open, alpha, sx);
    });
    drawCenter(f, open, alpha, sx);
    // cánh hướng về camera vẽ sau nhị, ra lớp trước
    front.forEach(p => drawPetal3(f, p.i, f.petals, p.layer, open, alpha, sx));
  }

  /* ---------- kim tuyến 3D ---------- */
  function burst(f, scr) {
    const n = HQ ? 22 : 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.25, 0.25);
      const sp = rand(50, 190);
      sparks.push({
        wx: f.wx, wy: f.wy, z: f.z,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 26,
        vz: rand(-110, 110),
        life: 1,
        decay: rand(0.45, 0.95),
        s: rand(1.6, 4.4),
        hue: (f.hue + rand(-32, 64) + 360) % 360
      });
    }
  }

  function drawSparks(dt, layerIdx) {
    let any = false;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of sparks) {
      if (layerIndexFor(s.z) !== layerIdx) continue;
      const sc = project(s.wx, s.wy, s.z);
      if (sc.s <= 0.02) continue;
      const r = Math.max(0.3, s.s * s.life * sc.s);
      ctx.globalAlpha = clamp(s.life, 0, 1) * 0.9;
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${s.hue}, 100%, 74%)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${s.hue}, 100%, 84%, ${s.life * 0.45})`;
      ctx.lineWidth = Math.max(0.5, r * 0.4);
      ctx.beginPath();
      ctx.moveTo(sc.x - r * 3, sc.y); ctx.lineTo(sc.x + r * 3, sc.y);
      ctx.moveTo(sc.x, sc.y - r * 3); ctx.lineTo(sc.x, sc.y + r * 3);
      ctx.stroke();
      any = true;
    }
    ctx.restore();
    return any;
  }

  function stepSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= s.decay * dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      s.vy += 58 * dt;
      s.wx += s.vx * dt;
      s.wy += s.vy * dt;
      s.z += s.vz * dt;
    }
  }

  /* ---------- bokeh: vòng sáng nhoè ở lớp xa ---------- */
  function makeBokeh() {
    const z = rand(700, Z_FAR);
    return {
      wx: rand(-0.75, 0.75) * W() * (1 + z / FOCAL),
      wy: rand(-0.6, 0.6) * H() * (1 + z / FOCAL),
      z,
      r: rand(40, 120),
      // rải khắp vòng màu cho nền lốm đốm nhiều sắc
      hue: rand(0, 360),
      a: rand(0.22, 0.48),
      drift: rand(-10, 10),
      ph: rand(0, Math.PI * 2),
      spd: rand(0.15, 0.5)
    };
  }

  function drawBokeh(dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of bokeh) {
      b.wx += b.drift * dt;
      const sc = project(b.wx, b.wy + Math.sin(time * b.spd + b.ph) * 16, b.z);
      const r = b.r * sc.s;
      if (r < 1) continue;
      const g = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, r);
      g.addColorStop(0, `hsla(${b.hue}, 100%, 72%, ${b.a})`);
      g.addColorStop(0.55, `hsla(${b.hue + 30}, 100%, 66%, ${b.a * 0.6})`);
      g.addColorStop(0.85, `hsla(${b.hue + 60}, 100%, 64%, ${b.a * 0.22})`);
      g.addColorStop(1, `hsla(${b.hue + 60}, 100%, 64%, 0)`);
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- hiệu ứng rơi (có chiều sâu) ---------- */
  function makeDrop() {
    const z = rand(Z_NEAR, Z_FAR);
    const spread = 1 + z / FOCAL;
    return {
      wx: rand(-0.75, 0.75) * W() * spread,
      wy: rand(-0.75, 0.75) * H() * spread,
      z,
      s: rand(7, 17),
      vy: rand(26, 95),
      vx: rand(-32, 32),
      rot: rand(0, Math.PI * 2),
      vr: rand(-1.4, 1.4),
      hue: rand(0, 360),
      alpha: rand(0.55, 1)
    };
  }

  function dropFill(p, s, y2) {
    const g = ctx.createLinearGradient(0, 0, 0, y2 || -s);
    g.addColorStop(0, `hsl(${p.hue}, 100%, 76%)`);
    g.addColorStop(1, `hsl(${(p.hue + 45) % 360}, 100%, 58%)`);
    ctx.shadowColor = `hsla(${p.hue}, 100%, 65%, .7)`;
    ctx.shadowBlur = s * 0.9;
    return g;
  }

  const dropShapes = {
    petal(p, s) {
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = dropFill(p, s, s);
      ctx.fill();
    },
    heart(p, s) {
      const u = s / 10;
      ctx.beginPath();
      ctx.moveTo(0, 3 * u);
      ctx.bezierCurveTo(0, 0, -5 * u, 0, -5 * u, -3 * u);
      ctx.bezierCurveTo(-5 * u, -7 * u, 0, -7 * u, 0, -3 * u);
      ctx.bezierCurveTo(0, -7 * u, 5 * u, -7 * u, 5 * u, -3 * u);
      ctx.bezierCurveTo(5 * u, 0, 0, 0, 0, 3 * u);
      ctx.fillStyle = dropFill(p, s, -s * 0.7);
      ctx.fill();
    },
    sparkle(p, s) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, .9)`;
      ctx.shadowBlur = s;
      ctx.strokeStyle = `hsl(${p.hue}, 100%, 72%)`;
      ctx.lineWidth = Math.max(0.6, s * 0.14);
      ctx.stroke();
    },
    confetti(p, s) {
      ctx.fillStyle = dropFill(p, s, -s * 0.4);
      ctx.fillRect(-s / 2, -s / 5, s, s / 2.5);
    }
  };

  function drawDrops(dt, layerIdx) {
    const shape = dropShapes[kind];
    if (!shape) return;
    const L = LAYERS[layerIdx];
    for (const p of drops) {
      if (layerIndexFor(p.z) !== layerIdx) continue;
      const sc = project(p.wx, p.wy, p.z);
      const s = p.s * sc.s;
      if (s < 0.4) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha * (1 - L.fog * 0.4);
      ctx.translate(sc.x, sc.y);
      ctx.rotate(p.rot);
      ctx.transform(1, 0, 0, clamp(Math.abs(Math.cos(p.rot * 1.7)), 0.2, 1), 0, 0);
      shape(p, s);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function stepDrops(dt) {
    for (const p of drops) {
      const spread = 1 + p.z / FOCAL;
      p.wy += p.vy * dt;
      p.wx += (p.vx + Math.sin(p.wy / 70) * 24) * dt;
      p.rot += p.vr * dt;
      if (p.wy > 0.8 * H() * spread) {
        Object.assign(p, makeDrop(), { wy: -0.8 * H() * spread });
      }
    }
  }

  /* ---------- camera parallax ---------- */
  window.addEventListener('pointermove', e => {
    if (kind === 'none' || reduce) return;
    tgtX = (e.clientX / W() - 0.5) * 120;
    tgtY = (e.clientY / H() - 0.5) * 70;
  });
  window.addEventListener('pointerleave', () => { tgtX = 0; tgtY = 0; });

  window.addEventListener('pointerdown', e => {
    if (kind !== 'bloom' || reduce) return;
    if (e.target.closest('.panel, .fab-wrap, .edit-dock, button, a, input, select, textarea, [contenteditable="true"]')) return;
    // nở một bông ngay sát camera tại điểm bấm
    const z = rand(-140, 40);
    const s = FOCAL / (FOCAL + z);
    flowers.push(makeFlower({
      wx: (e.clientX - W() / 2) / s + camX,
      wy: (e.clientY - H() / 2) / s + camY,
      z,
      size: rand(54, 84),
      hold: rand(2.4, 4.2)
    }));
  });

  /* ---------- vòng lặp ---------- */
  function byDepth(a, b) { return b.z - a.z; }

  function drawScene(dt) {
    const maxF = W() < 620 ? 7 : (HQ ? 18 : 12);
    if (kind === 'bloom') {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && flowers.length < maxF) {
        flowers.push(makeFlower());
        spawnTimer = rand(0.35, 1.2);
      }
      for (let i = flowers.length - 1; i >= 0; i--) {
        const f = flowers[i];
        f.t += dt;
        f.spin += f.spinV * dt;
        f.tiltX += f.tiltVX * dt;
        f.tiltY += f.tiltVY * dt;
        if (phaseOf(f).name === 'dead') flowers.splice(i, 1);
      }
      flowers.sort(byDepth);
      stepSparks(dt);
    } else {
      stepDrops(dt);
    }

    // vẽ từng lớp vào buffer rồi blur -> depth of field
    buffers.forEach((buf, idx) => {
      ctx = buf.ctx;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, buf.canvas.width, buf.canvas.height);
      ctx.restore();

      if (kind === 'bloom') {
        if (idx === 0) drawBokeh(dt);
        flowers.forEach(f => { if (layerIndexFor(f.z) === idx) drawFlower(f, dt); });
        drawSparks(dt, idx);
      } else {
        if (idx === 0) drawBokeh(dt);
        drawDrops(dt, idx);
      }
    });

    // composite: xa trước, gần sau
    vctx.save();
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.clearRect(0, 0, view.width, view.height);
    buffers.forEach((buf, idx) => {
      const L = LAYERS[idx];
      const parts = [];
      if (L.blur > 0) parts.push(`blur(${L.blur * dpr}px)`);
      parts.push(`saturate(${L.sat})`);
      vctx.filter = parts.join(' ');
      vctx.drawImage(buf.canvas, 0, 0);
    });
    vctx.filter = 'none';
    vctx.restore();
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    time += dt;
    // camera đuổi theo con trỏ cho mượt
    camX += (tgtX - camX) * Math.min(1, dt * 2.6);
    camY += (tgtY - camY) * Math.min(1, dt * 2.6);
    drawScene(dt);
    raf = requestAnimationFrame(frame);
  }

  function renderStatic() {
    flowers = Array.from({ length: 7 }, () => makeFlower());
    flowers.forEach(f => { f.t = f.tGrow + f.tBloom + 0.25; f.swaySpd = 0; });
    flowers.sort(byDepth);
    sparks = [];
    drawScene(0);
  }

  window.FX = {
    set(nextKind, nextColor) {
      kind = nextKind || 'none';
      if (nextColor) { accent = nextColor; baseHue = hexHue(nextColor); }
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      vctx.save();
      vctx.setTransform(1, 0, 0, 1, 0, 0);
      vctx.clearRect(0, 0, view.width, view.height);
      vctx.restore();

      flowers = []; drops = []; sparks = []; bokeh = []; spawnTimer = 0; time = 0;
      if (kind === 'none') return;

      bokeh = Array.from({ length: HQ ? 16 : 9 }, makeBokeh);

      if (reduce) {
        if (kind === 'bloom') renderStatic();
        return;
      }

      if (kind === 'bloom') {
        for (let i = 0; i < 6; i++) {
          flowers.push(makeFlower({ t: -i * 0.4 }));
        }
      } else {
        const count = Math.min(HQ ? 110 : 70, Math.round(W() / (HQ ? 12 : 18)));
        drops = Array.from({ length: count }, makeDrop);
      }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
})();
