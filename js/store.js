(function () {
  const KEY = 'women-day-state-v1';

  function defaultState() {
    return {
      content: { ...window.DEFAULT_CONTENT },
      quotes: [...window.DEFAULT_QUOTES],
      quoteIndex: 0,
      pack: window.DEFAULT_PACK,
      media: [],
      themeId: 'hoa-dao',
      customThemes: [],
      theme: null, // theme đang áp dụng (đã resolve)
      layout: 'hero'
    };
  }

  function normalize(s) {
    const d = defaultState();
    if (!s || typeof s !== 'object') return d;
    return {
      content: { ...d.content, ...(s.content || {}) },
      quotes: Array.isArray(s.quotes) && s.quotes.length ? s.quotes : d.quotes,
      quoteIndex: Number.isInteger(s.quoteIndex) ? s.quoteIndex : 0,
      pack: typeof s.pack === 'string' ? s.pack : d.pack,
      media: Array.isArray(s.media) ? s.media : [],
      themeId: s.themeId || d.themeId,
      customThemes: Array.isArray(s.customThemes) ? s.customThemes : [],
      theme: s.theme && typeof s.theme === 'object' ? s.theme : null,
      layout: typeof s.layout === 'string' ? s.layout : d.layout
    };
  }

  // base64url cho chuỗi unicode
  function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decode(str) {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  window.Store = {
    defaultState,

    load() {
      const hash = location.hash.startsWith('#c=') ? location.hash.slice(3) : '';
      if (hash) {
        try { return normalize(decode(hash)); } catch (e) { /* bỏ qua link lỗi */ }
      }
      try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
      catch (e) { return defaultState(); }
    },

    save(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { console.warn('Không lưu được (có thể do ảnh quá lớn):', e); }
    },

    clear() { localStorage.removeItem(KEY); },

    // Link chia sẻ: bỏ media dạng data URL để URL không quá dài
    shareLink(state) {
      const slim = {
        ...state,
        media: state.media.filter(m => m.src && !m.src.startsWith('data:'))
      };
      return location.origin + location.pathname + '#c=' + encode(slim);
    },

    hasLocalMedia(state) {
      return state.media.some(m => m.src && m.src.startsWith('data:'));
    }
  };
})();
