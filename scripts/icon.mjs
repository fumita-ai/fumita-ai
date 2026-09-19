/**
 * アプリアイコン(コーヒー豆と牛乳瓶)の SVG を組み立てる。
 * PNG は scripts/make-icons.mjs が Chromium で書き出す。
 */

const BEAN_ROWS = [
  { y: 152, xs: [100, 128, 156], s: 1 },
  { y: 178, xs: [86, 114, 142, 170], s: 1 },
  { y: 204, xs: [100, 128, 156], s: 1 },
];

function bean(x, y, rotate, scale, fill, crease) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})">
      <ellipse rx="13" ry="9.2" fill="${fill}"/>
      <path d="M-10 0.3 C-6.2 -4.4 -2.7 -4.4 0 0 C2.7 4.4 6.2 4.4 10 -0.3"
            fill="none" stroke="${crease}" stroke-width="2.1" stroke-linecap="round"/>
    </g>`;
}

/**
 * @param {{ size: number, padding: number, background: string }} opts
 */
export function iconSvg({ size = 512, padding = 0 } = {}) {
  // 元の座標系は 256x256。padding ぶんだけ中身を縮める(maskable 用)。
  const scale = (256 - padding * 2) / 256;

  const bottle =
    'M96 62 L96 88 C96 100 60 108 58 132 L58 214 A16 16 0 0 0 74 230 ' +
    'L182 230 A16 16 0 0 0 198 214 L198 132 C196 108 160 100 160 88 L160 62 Z';

  const beans = BEAN_ROWS.flatMap((row, r) =>
    row.xs.map((x, c) => bean(x, row.y, ((r * 43 + c * 67) % 60) - 30, row.s, '#F5F5F7', '#8E8E93')),
  ).join('\n      ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3A3A3C"/>
      <stop offset="1" stop-color="#1C1C1E"/>
    </linearGradient>
    <clipPath id="inner">
      <path d="${bottle}"/>
    </clipPath>
  </defs>
  <rect width="256" height="256" fill="url(#bg)"/>
  <g transform="translate(${padding} ${padding}) scale(${scale})">
    <path d="${bottle}" fill="#FFFFFF" fill-opacity="0.08"/>
    <g clip-path="url(#inner)">
      ${beans}
    </g>
    <path d="${bottle}" fill="none" stroke="#F5F5F7" stroke-width="9" stroke-linejoin="round"/>
    <rect x="90" y="36" width="76" height="24" rx="9" fill="none" stroke="#F5F5F7" stroke-width="9"/>
    <path d="M76 120 L76 168" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>`;
}

/** ブラウザのタブ用(小さいので中身を簡略化)。 */
export function faviconSvg() {
  return iconSvg({ size: 64 });
}
