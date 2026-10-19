// "Dayzen" logosu: güneş ışınlı, maskeli kahraman saat ve dalgalanan pelerin (SVG).
(function (root) {
  'use strict';
  const OG = root.OG;
  const INK = '#2b2140';

  // 12 güneş ışını
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const p = (r, da) => `${(60 + r * Math.sin(a + da)).toFixed(1)},${(56 - r * Math.cos(a + da)).toFixed(1)}`;
    return `<polygon points="${p(36, -0.2)} ${p(53, 0)} ${p(36, 0.2)}"/>`;
  }).join('');

  OG.LOGO_SVG = `
<svg class="logo-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="logo-cape">
    <path d="M38 62 C30 80 22 96 14 112 C28 106 36 113 48 106 C58 114 70 105 80 112 C88 104 98 108 108 102 C96 88 88 76 82 62 Z"
      fill="#e5484d" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M44 72 C40 84 36 94 32 104" fill="none" stroke="#b8323a" stroke-width="4" stroke-linecap="round"/>
    <path d="M76 72 C80 84 84 94 88 102" fill="none" stroke="#b8323a" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g class="logo-rays" fill="#ffc83d" stroke="${INK}" stroke-width="4" stroke-linejoin="round">${rays}</g>
  <circle cx="60" cy="56" r="33" fill="#fff8e6" stroke="${INK}" stroke-width="5"/>
  <g stroke="${INK}" stroke-width="4" stroke-linecap="round">
    <line x1="60" y1="27" x2="60" y2="34"/>
    <line x1="60" y1="85" x2="60" y2="80"/>
  </g>
  <g fill="${INK}">${[1, 11, 5, 7].map((h) => {
    const a = (h * 30 * Math.PI) / 180;
    return `<circle cx="${(60 + 27 * Math.sin(a)).toFixed(1)}" cy="${(56 - 27 * Math.cos(a)).toFixed(1)}" r="2.2"/>`;
  }).join('')}</g>
  <path d="M30 47 C42 40 78 40 90 47 L88 59 C78 63 68 61 60 57 C52 61 42 63 32 59 Z"
    fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="47" cy="51.5" rx="6" ry="4.5" fill="#fff"/>
  <ellipse cx="73" cy="51.5" rx="6" ry="4.5" fill="#fff"/>
  <circle cx="48" cy="52" r="2.3" fill="${INK}"/>
  <circle cx="74" cy="52" r="2.3" fill="${INK}"/>
  <path d="M46 68 C52 76 68 76 74 68" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="40" cy="67" r="4" fill="#ff9aa5" opacity="0.8"/>
  <circle cx="80" cy="67" r="4" fill="#ff9aa5" opacity="0.8"/>
</svg>`;

  // Tarayıcı sekmesi simgesi
  OG.applyFavicon = function () {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = `data:image/svg+xml,${encodeURIComponent(OG.LOGO_SVG.trim().replace('class="logo-svg" ', ''))}`;
  };
})(window);
