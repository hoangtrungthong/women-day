(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  let state = Store.load();
  let editing = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  const toast = (() => {
    const el = $('#toast');
    let t;
    return msg => {
      el.textContent = msg;
      el.hidden = false;
      clearTimeout(t);
      t = setTimeout(() => { el.hidden = true; }, 2200);
    };
  })();

  function allThemes() {
    return [...window.DEFAULT_THEMES, ...state.customThemes];
  }

  function resolveTheme() {
    if (state.theme) return state.theme;
    return allThemes().find(t => t.id === state.themeId) || window.DEFAULT_THEMES[0];
  }

  function save() { Store.save(state); }

  function safeUrl(u) {
    try {
      const url = new URL(u, location.href);
      return ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol) ? url.href : null;
    } catch (e) { return null; }
  }

  function youtubeId(u) {
    const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  function guessType(u) {
    if (youtubeId(u)) return 'youtube';
    if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(u)) return 'video';
    return 'image';
  }

  /* ---------- render ---------- */
  // hue của màu nhấn -> sinh bộ 5 màu aurora trải rộng vòng tròn màu
  function accentHue(hex) {
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

  function isDark(hex) {
    const m = /^#?([\da-f]{6})$/i.exec(String(hex).trim());
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return (((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000) < 128;
  }

  function applyTheme() {
    const t = resolveTheme();
    const r = document.documentElement.style;
    r.setProperty('--bg1', t.bg1);
    r.setProperty('--bg2', t.bg2);
    r.setProperty('--card', t.card);
    r.setProperty('--text', t.text);
    r.setProperty('--accent', t.accent);
    r.setProperty('--font-title', t.font);

    const h = accentHue(t.accent);
    const dark = isDark(t.bg1);
    const l = dark ? 62 : 70;
    // lệch hue rộng để aurora ra nhiều sắc rõ rệt
    [0, 58, -62, 128, 196].forEach((off, i) => {
      r.setProperty(`--g${i + 1}`, `hsl(${(h + off + 360) % 360} 100% ${l - (i % 2) * 6}%)`);
    });

    FX.set(t.fx, t.accent);
  }

  function renderContent() {
    $$('[data-field]').forEach(el => {
      const v = state.content[el.dataset.field] || '';
      el.textContent = v;
      el.classList.toggle('is-empty', !v);
    });
  }

  // Tự chạy câu chúc: chữ bay ra rồi chữ mới bay vào
  const QUOTE_INTERVAL = 6000;
  let quoteTimer = null;
  let hovering = false;
  let elapsed = 0;
  let lastTick = 0;
  const quoteBarFill = $('#quote-box .quote-bar span');

  function renderQuote(dir) {
    const box = $('#quote');
    const total = state.quotes.length;

    if (!total) {
      box.textContent = 'Chưa có câu chúc nào. Bật Chỉnh sửa để thêm nhé.';
      $('#quote-count').textContent = '0 / 0';
      return;
    }

    state.quoteIndex = ((state.quoteIndex % total) + total) % total;
    const text = state.quotes[state.quoteIndex];
    $('#quote-count').textContent = `${state.quoteIndex + 1} / ${total}`;

    if (!dir || reduceMotion) {
      box.textContent = text;
      return;
    }

    box.classList.remove('q-in-left', 'q-in-right', 'q-out-left', 'q-out-right');
    box.classList.add(dir > 0 ? 'q-out-left' : 'q-out-right');

    setTimeout(() => {
      box.textContent = text;
      box.classList.remove('q-out-left', 'q-out-right');
      box.classList.add(dir > 0 ? 'q-in-right' : 'q-in-left');
    }, 320);
  }

  function nextQuote(dir) {
    state.quoteIndex += dir;
    renderQuote(dir);
    save();
  }

  // một đồng hồ duy nhất chạy cả việc lật câu và thanh tiến trình
  function tick(now) {
    quoteTimer = requestAnimationFrame(tick);
    const dt = now - (lastTick || now);
    lastTick = now;

    if (editing || hovering || document.hidden) return;

    elapsed += dt;
    const p = Math.min(1, elapsed / QUOTE_INTERVAL);
    quoteBarFill.style.transform = `scaleX(${p})`;

    if (p >= 1) { elapsed = 0; nextQuote(1); }
  }

  function startAutoplay() {
    stopAutoplay();
    if (reduceMotion || state.quotes.length < 2) return;
    elapsed = 0;
    lastTick = 0;
    $('#quote-box').classList.add('is-playing');
    quoteTimer = requestAnimationFrame(tick);
  }

  function stopAutoplay() {
    if (quoteTimer) { cancelAnimationFrame(quoteTimer); quoteTimer = null; }
    $('#quote-box').classList.remove('is-playing');
  }

  function restartAutoplay() {
    elapsed = 0;
    lastTick = 0;
    quoteBarFill.style.transform = 'scaleX(0)';
  }

  function mediaNode(m) {
    const url = safeUrl(m.src);
    if (!url) return null;
    if (m.type === 'youtube') {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube.com/embed/' + m.id;
      f.title = 'Video YouTube';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      return f;
    }
    if (m.type === 'video') {
      const v = document.createElement('video');
      v.src = url;
      v.controls = true;
      v.playsInline = true;
      return v;
    }
    const i = document.createElement('img');
    i.src = url;
    i.alt = m.name || 'Ảnh kỷ niệm';
    i.loading = 'lazy';
    return i;
  }

  function renderGallery() {
    const g = $('#gallery');
    g.textContent = '';
    state.media.forEach((m, idx) => {
      const node = mediaNode(m);
      if (!node) return;
      const wrap = document.createElement('div');
      wrap.className = 'media-item';
      wrap.appendChild(node);
      const del = document.createElement('button');
      del.className = 'del';
      del.type = 'button';
      del.textContent = '✕';
      del.title = 'Xoá';
      del.addEventListener('click', () => {
        state.media.splice(idx, 1);
        save(); renderGallery(); renderMediaList();
      });
      wrap.appendChild(del);
      g.appendChild(wrap);
    });
    $('#gallery-wrap').hidden = !state.media.length && !editing;
  }

  function applyLayout() {
    const ids = window.LAYOUTS.map(l => l.id);
    const cur = ids.includes(state.layout) ? state.layout : 'hero';
    document.body.classList.remove(...ids.map(i => 'lay-' + i));
    document.body.classList.add('lay-' + cur);
  }

  function renderLayoutGrid() {
    const grid = $('#layout-grid');
    grid.textContent = '';
    window.LAYOUTS.forEach(l => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'layout-chip' + (l.id === state.layout ? ' active' : '');
      chip.dataset.k = l.id;

      const prev = document.createElement('div');
      prev.className = 'prev';
      prev.append(...[0, 1, 2].map(() => document.createElement('i')));
      chip.appendChild(prev);

      const name = document.createElement('strong');
      name.textContent = l.name;
      const desc = document.createElement('span');
      desc.textContent = l.desc;
      chip.append(name, desc);

      chip.addEventListener('click', () => {
        state.layout = l.id;
        save(); applyLayout(); renderLayoutGrid();
      });
      grid.appendChild(chip);
    });
  }

  function renderThemeGrid() {
    const grid = $('#theme-grid');
    grid.textContent = '';
    const current = resolveTheme();
    allThemes().forEach(t => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'theme-chip' + (t.id === current.id ? ' active' : '');
      const sw = document.createElement('div');
      sw.className = 'swatch';
      sw.style.background = `linear-gradient(135deg, ${t.bg1}, ${t.bg2})`;
      sw.style.borderBottom = `4px solid ${t.accent}`;
      chip.appendChild(sw);
      const label = document.createElement('div');
      label.textContent = t.name;
      chip.appendChild(label);
      chip.addEventListener('click', () => {
        state.themeId = t.id;
        state.theme = null;
        save(); applyTheme(); renderThemeGrid(); fillThemeForm();
      });
      if (state.customThemes.some(c => c.id === t.id)) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'rm';
        rm.textContent = 'xoá';
        rm.addEventListener('click', e => {
          e.stopPropagation();
          state.customThemes = state.customThemes.filter(c => c.id !== t.id);
          if (state.themeId === t.id) state.themeId = 'hoa-dao';
          save(); applyTheme(); renderThemeGrid();
        });
        chip.appendChild(rm);
      }
      grid.appendChild(chip);
    });
  }

  function fillThemeForm() {
    const t = resolveTheme();
    $('#t-name').value = '';
    $('#t-bg1').value = t.bg1;
    $('#t-bg2').value = t.bg2;
    $('#t-card').value = t.card.slice(0, 7);
    $('#t-text').value = t.text;
    $('#t-accent').value = t.accent;
    $('#t-font').value = t.font;
    $('#t-fx').value = t.fx;
  }

  function readThemeForm(id, name) {
    return {
      id, name,
      bg1: $('#t-bg1').value,
      bg2: $('#t-bg2').value,
      card: $('#t-card').value + 'ee',
      text: $('#t-text').value,
      accent: $('#t-accent').value,
      font: $('#t-font').value,
      fx: $('#t-fx').value
    };
  }

  function currentPack() {
    return window.QUOTE_PACKS.find(p => p.id === state.pack) || window.QUOTE_PACKS[0];
  }

  function renderPackGrid() {
    const grid = $('#pack-grid');
    grid.textContent = '';
    window.QUOTE_PACKS.forEach(p => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pack-chip' + (p.id === state.pack ? ' active' : '');
      const name = document.createElement('strong');
      name.textContent = p.name;
      const desc = document.createElement('span');
      desc.textContent = p.desc;
      chip.append(name, desc);
      chip.addEventListener('click', () => {
        if (p.id === state.pack) return;
        if (!confirm(`Dùng bộ "${p.name}"? Lời chúc và nội dung thiệp hiện tại sẽ được thay.`)) return;
        state.pack = p.id;
        state.quotes = p.quotes.slice();
        state.content = { ...p.content };
        state.quoteIndex = 0;
        save();
        renderPackGrid(); renderQuoteList(); renderContent(); renderQuote();
        restartAutoplay();
        toast(`Đã chuyển sang bộ "${p.name}"`);
      });
      grid.appendChild(chip);
    });
  }

  function renderQuoteList() {
    const ul = $('#quote-list');
    ul.textContent = '';
    state.quotes.forEach((q, idx) => {
      const li = document.createElement('li');
      const ta = document.createElement('textarea');
      ta.value = q;
      ta.addEventListener('input', () => {
        state.quotes[idx] = ta.value;
        save(); renderQuote();
      });
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'rm';
      rm.textContent = '✕';
      rm.title = 'Xoá câu chúc';
      rm.addEventListener('click', () => {
        state.quotes.splice(idx, 1);
        save(); renderQuoteList(); renderQuote();
        if (state.quotes.length < 2) { stopAutoplay(); updatePlayBtn(); }
      });
      li.append(ta, rm);
      ul.appendChild(li);
    });
  }

  function renderMediaList() {
    const box = $('#media-list');
    box.textContent = '';
    state.media.forEach((m, idx) => {
      const th = document.createElement('div');
      th.className = 'thumb';
      if (m.type === 'image') {
        const i = document.createElement('img');
        i.src = safeUrl(m.src) || '';
        i.alt = '';
        th.appendChild(i);
      }
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = m.type === 'youtube' ? 'YouTube' : m.type === 'video' ? 'Video' : 'Ảnh';
      th.appendChild(tag);
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = '✕';
      del.addEventListener('click', () => {
        state.media.splice(idx, 1);
        save(); renderMediaList(); renderGallery();
      });
      th.appendChild(del);
      box.appendChild(th);
    });
  }

  function renderAll() {
    applyLayout(); applyTheme(); renderContent(); renderQuote(); renderGallery();
  }

  /* ---------- editing ---------- */
  function setEditing(on) {
    editing = on;
    document.body.classList.toggle('editing', on);
    $('#btn-edit').setAttribute('aria-pressed', String(on));
    $('#btn-edit span').textContent = on ? 'Xong' : 'Chỉnh sửa';
    $('#edit-dock').hidden = !on;
    $$('[data-field]').forEach(el => {
      el.contentEditable = on ? 'true' : 'false';
      if (on) el.classList.remove('is-empty');
    });
    // đang sửa thì ngưng chạy cho đỡ nhảy chữ, xong thì chạy lại
    if (on) { stopAutoplay(); } else if (state.quotes.length > 1) { startAutoplay(); }
    updatePlayBtn();
    renderContent();
    renderGallery();
  }

  $$('[data-field]').forEach(el => {
    el.addEventListener('input', () => {
      state.content[el.dataset.field] = el.textContent.trim();
      save();
    });
    el.addEventListener('blur', () => {
      el.classList.toggle('is-empty', !el.textContent.trim());
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && el.dataset.field !== 'message') {
        e.preventDefault();
        el.blur();
      }
    });
  });

  /* ---------- panels ---------- */
  function openPanel(id) {
    $$('.panel').forEach(p => { p.hidden = true; });
    $(id).hidden = false;
    $('#backdrop').hidden = false;
  }
  function closePanels() {
    $$('.panel').forEach(p => { p.hidden = true; });
    $('#backdrop').hidden = true;
  }
  $$('.panel-close').forEach(b => b.addEventListener('click', closePanels));
  $('#backdrop').addEventListener('click', closePanels);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanels(); });

  /* ---------- nút hoa + menu ---------- */
  (function fabMenu() {
    const wrap = $('#fab-wrap');
    const fab = $('#fab');
    const menu = $('#fab-menu');
    let idleTimer = null;

    function setOpen(on) {
      wrap.classList.toggle('open', on);
      fab.setAttribute('aria-expanded', String(on));
      fab.setAttribute('aria-label', on ? 'Đóng menu' : 'Mở menu');
      menu.setAttribute('aria-hidden', String(!on));
      if (on) { wrap.classList.remove('idle'); clearTimeout(idleTimer); }
      else { scheduleIdle(); }
    }

    // để yên một lúc thì nút mờ đi cho khỏi chắn hiệu ứng
    function scheduleIdle() {
      clearTimeout(idleTimer);
      wrap.classList.remove('idle');
      idleTimer = setTimeout(() => {
        if (!wrap.classList.contains('open') && !editing) wrap.classList.add('idle');
      }, 3500);
    }

    fab.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(!wrap.classList.contains('open'));
    });

    // bấm ra ngoài thì đóng
    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && wrap.classList.contains('open')) setOpen(false);
    });

    // bấm mục nào thì đóng menu, trừ nút Chỉnh sửa vì còn dùng tiếp
    $$('.fab-item').forEach(b => {
      b.addEventListener('click', () => {
        if (b.id !== 'btn-edit') setOpen(false);
      });
    });

    window.addEventListener('pointermove', scheduleIdle, { passive: true });
    wrap.addEventListener('pointerenter', () => { clearTimeout(idleTimer); wrap.classList.remove('idle'); });
    wrap.addEventListener('pointerleave', scheduleIdle);
    scheduleIdle();
  })();

  $('#btn-edit').addEventListener('click', () => setEditing(!editing));

  $('#btn-layout').addEventListener('click', () => {
    renderLayoutGrid(); openPanel('#panel-layout');
  });

  $('#btn-theme').addEventListener('click', () => {
    renderThemeGrid(); fillThemeForm(); openPanel('#panel-theme');
  });

  $('#btn-data').addEventListener('click', () => openPanel('#panel-data'));

  $('#btn-share').addEventListener('click', async () => {
    const link = Store.shareLink(state);
    try {
      await navigator.clipboard.writeText(link);
      toast(Store.hasLocalMedia(state)
        ? 'Đã copy link (ảnh/video tải từ máy không kèm theo)'
        : 'Đã copy link chia sẻ');
    } catch (e) {
      location.hash = link.split('#')[1];
      toast('Link đã nằm trên thanh địa chỉ, copy giúp mình nhé');
    }
  });

  /* ---------- quotes ---------- */
  $('#quote-prev').addEventListener('click', () => { nextQuote(-1); restartAutoplay(); });
  $('#quote-next').addEventListener('click', () => { nextQuote(1); restartAutoplay(); });

  $('#quote-play').addEventListener('click', () => {
    if (quoteTimer) stopAutoplay(); else startAutoplay();
    updatePlayBtn();
  });

  function updatePlayBtn() {
    const b = $('#quote-play');
    const on = !!quoteTimer;
    b.textContent = on ? '❚❚' : '▶';
    b.title = on ? 'Tạm dừng' : 'Tự chạy';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(on));
  }

  // tạm ngưng khi trỏ vào để đọc cho kỹ
  $('#quote-box').addEventListener('pointerenter', () => { hovering = true; });
  $('#quote-box').addEventListener('pointerleave', () => { hovering = false; });

  $('#btn-quotes').addEventListener('click', () => {
    renderPackGrid(); renderQuoteList(); openPanel('#panel-quotes');
  });

  function addQuote(text) {
    const v = text.trim();
    if (!v) return;
    state.quotes.push(v);
    state.quoteIndex = state.quotes.length - 1;
    save(); renderQuoteList(); renderQuote(1); restartAutoplay();
  }

  $('#q-add').addEventListener('click', () => {
    addQuote($('#q-input').value);
    $('#q-input').value = '';
  });
  $('#q-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('#q-add').click(); });

  $('#q-suggest').addEventListener('click', () => {
    // gợi ý lấy từ bộ đang dùng cho đúng giọng văn
    const pool = currentPack().suggest.filter(q => !state.quotes.includes(q));
    if (!pool.length) return toast('Hết gợi ý trong bộ này rồi, bạn tự viết nhé');
    addQuote(pool[Math.floor(Math.random() * pool.length)]);
  });

  /* ---------- media ---------- */
  $('#btn-media').addEventListener('click', () => { renderMediaList(); openPanel('#panel-media'); });

  function pushMedia(m) {
    state.media.push(m);
    save(); renderMediaList(); renderGallery();
  }

  function handleFiles(files) {
    Array.from(files).forEach(f => {
      if (f.size > 8 * 1024 * 1024) return toast(`"${f.name}" lớn hơn 8MB, nên dùng link thay vì tải lên`);
      const type = f.type.startsWith('video') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onload = () => pushMedia({ type, src: reader.result, name: f.name });
      reader.readAsDataURL(f);
    });
  }

  $('#file-input').addEventListener('change', e => { handleFiles(e.target.files); e.target.value = ''; });
  $('#drop').addEventListener('click', () => $('#file-input').click());
  ['dragenter', 'dragover'].forEach(ev =>
    $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev =>
    $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.remove('over'); }));
  $('#drop').addEventListener('drop', e => handleFiles(e.dataTransfer.files));

  $('#m-add').addEventListener('click', () => {
    const raw = $('#m-url').value.trim();
    const url = safeUrl(raw);
    if (!url) return toast('Link không hợp lệ');
    const type = guessType(raw);
    pushMedia(type === 'youtube' ? { type, src: url, id: youtubeId(raw) } : { type, src: url });
    $('#m-url').value = '';
  });

  /* ---------- theme form ---------- */
  $('#t-apply').addEventListener('click', () => {
    state.theme = readThemeForm('custom-live', 'Tuỳ chỉnh');
    save(); applyTheme(); renderThemeGrid();
    toast('Đã áp dụng');
  });

  $('#t-save').addEventListener('click', () => {
    const name = $('#t-name').value.trim() || 'Theme của tôi';
    const t = readThemeForm('my-' + Date.now(), name);
    state.customThemes.push(t);
    state.themeId = t.id;
    state.theme = null;
    save(); applyTheme(); renderThemeGrid();
    $('#t-name').value = '';
    toast('Đã lưu theme');
  });

  /* ---------- data ---------- */
  $('#d-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'thiep-20-10.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#d-import').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = Object.assign(Store.defaultState(), JSON.parse(reader.result));
        save(); renderAll(); closePanels();
        startAutoplay(); updatePlayBtn();
        toast('Đã nhập nội dung');
      } catch (err) { toast('File không đọc được'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  });

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Khôi phục toàn bộ nội dung mặc định?')) return;
    Store.clear();
    state = Store.defaultState();
    history.replaceState(null, '', location.pathname);
    renderAll();
    startAutoplay(); updatePlayBtn();
    toast('Đã khôi phục mặc định');
  });

  // mũi tên trái/phải để lật câu chúc
  document.addEventListener('keydown', e => {
    if (editing || e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (e.key === 'ArrowLeft') { nextQuote(-1); restartAutoplay(); }
    if (e.key === 'ArrowRight') { nextQuote(1); restartAutoplay(); }
  });

  /* ---------- thiệp nghiêng theo con trỏ (3D) ---------- */
  (function cardTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = $('#card');
    window.addEventListener('pointermove', e => {
      if (editing) return;
      const ty = (e.clientX / window.innerWidth - 0.5) * 7;
      const tx = (0.5 - e.clientY / window.innerHeight) * 5;
      card.style.setProperty('--tiltX', tx.toFixed(2) + 'deg');
      card.style.setProperty('--tiltY', ty.toFixed(2) + 'deg');
    });
    window.addEventListener('pointerleave', () => {
      card.style.setProperty('--tiltX', '0deg');
      card.style.setProperty('--tiltY', '0deg');
    });
  })();

  /* ---------- init ---------- */
  renderAll();
  setEditing(false);
  startAutoplay();
  updatePlayBtn();
  save();
})();
