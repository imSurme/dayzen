// Dil desteği: Türkçe (varsayılan) ve İngilizce.
// Oyun kodu Türkçe metin üretir; İngilizce modda ekrana düşen her metin sözlükten çevrilir.
// Zengin (etiketli) metinler kodda OG.t(tr, en) ile iki dilde yazılır.
(function (root) {
  'use strict';
  const OG = (root.OG = root.OG || {});
  const PREFS_KEY = 'optimizeGun.prefs';

  // İlk açılışta İngilizce; sonra oyuncunun seçtiği dil hatırlanır
  let lang = 'en';
  try { lang = (JSON.parse(localStorage.getItem(PREFS_KEY)) || {}).lang === 'tr' ? 'tr' : 'en'; } catch (e) { /* varsayılan */ }
  OG.lang = lang;
  OG.t = (tr, en) => (OG.lang === 'en' && en != null ? en : tr);

  OG.setLang = function (l) {
    if (l === OG.lang) return;
    OG.prefs.lang = l;
    OG.savePrefs();
    root.location.reload();
  };

  // ---------- Sözlük ----------
  const DICT = new Map(); // tam metin → çeviri
  const PATTERNS = []; // { re, en, keys }
  const cache = new Map();
  const missing = new Set();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // "{n} puan" gibi yer tutuculu anahtarlar kalıp olur
  OG.addDict = function (obj) {
    for (const [tr, en] of Object.entries(obj)) {
      if (tr.includes('{')) {
        const keys = [];
        const src = tr.split(/(\{\w+\})/).map((part) => {
          const m = part.match(/^\{(\w+)\}$/);
          if (!m) return esc(part);
          keys.push(m[1]);
          return '([\\s\\S]+?)';
        }).join('');
        PATTERNS.push({ re: new RegExp(`^${src}$`, 'u'), en, keys });
      } else {
        DICT.set(tr, en);
      }
    }
    cache.clear();
  };

  const LETTER = /\p{L}/u;
  function byPattern(s) {
    for (const p of PATTERNS) {
      const m = s.match(p.re);
      if (!m) continue;
      let out = p.en;
      p.keys.forEach((k, i) => { out = out.split(`{${k}}`).join(translate(m[i + 1])); });
      return out;
    }
    return null;
  }

  function translate(text) {
    if (!text || !LETTER.test(text)) return text;
    if (cache.has(text)) return cache.get(text);
    const [, lead, body, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    // Baştaki/sondaki emoji, sayı ve noktalama ayrılınca kalan çekirdek
    const m = body.match(/^([^\p{L}]*)([\s\S]*?\p{L})([^\p{L}]*)$/u);
    const stripped = m && (m[1] || m[3]);
    const wrap = (core) => (core == null ? null : m[1] + core + m[3]);
    let out = DICT.has(body) ? DICT.get(body) : null;
    if (out == null && stripped && DICT.has(m[2])) out = wrap(DICT.get(m[2]));
    if (out == null) out = byPattern(body);
    if (out == null && m && m[1]) {
      // Yalnız baştaki işaretler ayrılmış hâli ("⏪ Geri Sar (2)" → "Geri Sar (2)")
      const rest = m[2] + m[3];
      const r = DICT.has(rest) ? DICT.get(rest) : byPattern(rest);
      if (r != null) out = m[1] + r;
    }
    if (out == null && stripped) out = wrap(byPattern(m[2]));
    if (out == null) { missing.add(body); out = body; }
    const res = lead + out + trail;
    cache.set(text, res);
    cache.set(res, res); // çevrilmiş metin tekrar çevrilmesin
    return res;
  }
  OG.tr = translate;

  // ---------- Sayfa çevirmeni ----------
  const ATTRS = ['title', 'aria-label', 'placeholder'];
  const skip = (el) => !el || el.closest('script, style, [data-i18n-skip]');

  function doText(node) {
    if (skip(node.parentElement)) return;
    const t = translate(node.data);
    if (t !== node.data) node.data = t;
  }
  function doAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v) { const t = translate(v); if (t !== v) el.setAttribute(a, t); }
    }
  }
  function walk(rootNode) {
    if (rootNode.nodeType === 3) { doText(rootNode); return; }
    if (rootNode.nodeType !== 1 || skip(rootNode)) return;
    doAttrs(rootNode);
    const tw = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n = tw.nextNode();
    while (n) {
      if (n.nodeType === 3) doText(n);
      else doAttrs(n);
      n = tw.nextNode();
    }
  }

  OG.i18nStart = function () {
    if (OG.lang !== 'en') return;
    document.documentElement.lang = 'en';
    document.title = translate(document.title);
    walk(document.body);
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'childList') m.addedNodes.forEach(walk);
        else if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes' && !skip(m.target)) doAttrs(m.target);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };

  // Geliştirme için: çevrilmemiş metinler
  OG.i18nMissing = () => [...missing];
})(typeof window !== 'undefined' ? window : globalThis);
